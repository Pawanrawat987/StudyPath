const { Op } = require('sequelize');
const { RevisionPlan, Topic, Subject, QuizAttempt, Answer, Question } = require('../models');
const { calculatePerformance } = require('./performance.controller');

function validId(value) {
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function serializeRevision(revision) {
  const topic = revision.Topic;
  const subject = topic?.Subject;
  return {
    id: revision.id,
    topicId: revision.topicId,
    topicName: topic?.name || 'Topic unavailable',
    subjectId: subject?.id ?? null,
    subjectName: subject?.name || 'Subject unavailable',
    status: revision.status,
    createdAt: revision.createdAt,
    completedAt: revision.completedAt,
  };
}

const topicInclude = [{ association: RevisionPlan.associations.Topic, required: true, include: [{ association: Topic.associations.Subject, required: true }] }];

async function list(req, res, next, status) {
  try {
    const where = { userId: req.user.id };
    if (status) where.status = status;
    const revisions = await RevisionPlan.findAll({ where, include: topicInclude, order: [['createdAt', 'DESC']] });
    return res.json({ success: true, revisions: revisions.map(serializeRevision) });
  } catch (error) { return next(error); }
}

function getAll(req, res, next) { return list(req, res, next); }
function getPending(req, res, next) { return list(req, res, next, 'pending'); }
function getCompleted(req, res, next) { return list(req, res, next, 'completed'); }

async function create(req, res, next) {
  try {
    const topicId = req.body?.topicId;
    if (!validId(topicId)) return res.status(400).json({ success: false, message: 'A valid topicId is required.' });
    const topic = await Topic.findByPk(Number(topicId), { include: [{ model: Subject, required: true }] });
    if (!topic || !topic.Subject) return res.status(404).json({ success: false, message: 'Topic or its subject was not found.' });

    // The server checks current performance so the client cannot add arbitrary topics.
    const performance = await calculatePerformance(req.user.id);
    const topicResult = performance.topicPerformance.find(result => result.topicId === topic.id);
    if (!topicResult || topicResult.percentage >= 50) {
      return res.status(400).json({ success: false, message: 'Only topics currently classified as Weak can be added to revision.' });
    }

    const existing = await RevisionPlan.findOne({ where: { userId: req.user.id, topicId: topic.id } });
    if (existing) return res.status(409).json({ success: false, message: 'This topic is already in your revision list.' });
    const revision = await RevisionPlan.create({
      userId: req.user.id,
      topicId: topic.id,
      title: topic.name,
      status: 'pending',
      completedAt: null,
    });
    await revision.reload({ include: topicInclude });
    return res.status(201).json({ success: true, revision: serializeRevision(revision) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'This topic is already in your revision list.' });
    return next(error);
  }
}

async function complete(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'A valid revision ID is required.' });
    const revision = await RevisionPlan.findOne({ where: { id: Number(req.params.id), userId: req.user.id }, include: topicInclude });
    if (!revision) return res.status(404).json({ success: false, message: 'Revision item not found.' });
    if (revision.status === 'completed') return res.status(409).json({ success: false, message: 'This revision item is already completed.' });
    const latestAttemptId = await QuizAttempt.max('id', { where: { userId: req.user.id } });
    revision.status = 'completed';
    revision.completedAt = new Date();
    revision.completedAfterAttemptId = latestAttemptId || null;
    await revision.save();
    return res.json({ success: true, revision: serializeRevision(revision) });
  } catch (error) { return next(error); }
}

async function remove(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'A valid revision ID is required.' });
    const revision = await RevisionPlan.findOne({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!revision) return res.status(404).json({ success: false, message: 'Revision item not found.' });
    await revision.destroy();
    return res.json({ success: true, message: 'Revision item removed.' });
  } catch (error) { return next(error); }
}

async function percentagesForTopic(userId, topicId) {
  const attempts = await QuizAttempt.findAll({
    where: { userId, status: 'completed', completedAt: { [Op.ne]: null } },
    attributes: ['id', 'startedAt', 'completedAt'],
    include: [{
      model: Answer,
      attributes: ['id', 'questionId', 'isCorrect'],
      required: true,
      include: [{ model: Question, attributes: ['id'], where: { topicId }, required: true }],
    }],
    order: [['completedAt', 'ASC'], ['id', 'ASC']],
  });

  return attempts.map(attempt => {
    const seen = new Set();
    let correct = 0;
    for (const answer of attempt.Answers || []) {
      const questionId = answer.questionId || answer.Question?.id;
      if (!questionId || seen.has(String(questionId))) continue;
      seen.add(String(questionId));
      if (answer.isCorrect) correct += 1;
    }
    const total = seen.size;
    return {
      id: attempt.id,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      percentage: total ? Number((correct / total * 100).toFixed(2)) : null,
    };
  }).filter(attempt => attempt.percentage !== null);
}

async function improvement(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'A valid revision ID is required.' });
    const revision = await RevisionPlan.findOne({
      where: { id: Number(req.params.id), userId: req.user.id },
      include: [{ association: RevisionPlan.associations.Topic, required: true }],
    });
    if (!revision) return res.status(404).json({ success: false, message: 'Revision item not found.' });

    const attempts = await percentagesForTopic(req.user.id, revision.topicId);
    const revisionCreatedAt = new Date(revision.createdAt).getTime();
    const before = revision.completedAfterAttemptId !== null
      ? attempts.filter(attempt => attempt.id <= revision.completedAfterAttemptId).at(-1) || null
      : attempts.filter(attempt => new Date(attempt.startedAt).getTime() < revisionCreatedAt).at(-1) || null;
    const after = revision.completedAt
      ? revision.completedAfterAttemptId !== null
        ? attempts.filter(attempt => attempt.id > revision.completedAfterAttemptId).at(-1) || null
        : attempts.filter(attempt => new Date(attempt.startedAt).getTime() > new Date(revision.completedAt).getTime()).at(-1) || null
      : null;

    let status;
    if (!revision.completedAt) status = 'revision_pending';
    else if (!after) status = 'awaiting_retest';
    else if (!before) status = 'no_previous_attempt';
    else status = 'compared';

    const beforePercentage = before?.percentage ?? null;
    const afterPercentage = after?.percentage ?? null;
    const difference = beforePercentage !== null && afterPercentage !== null
      ? Number((afterPercentage - beforePercentage).toFixed(2))
      : null;
    return res.json({
      success: true,
      improvement: {
        topic: revision.Topic.name,
        beforePercentage,
        afterPercentage,
        improvement: difference,
        status,
        beforeAttemptAt: before?.completedAt ?? null,
        afterAttemptAt: after?.completedAt ?? null,
      },
    });
  } catch (error) { return next(error); }
}

module.exports = { getAll, getPending, getCompleted, create, complete, remove, improvement };
