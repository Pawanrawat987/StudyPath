const { Op } = require('sequelize');
const { ExamSchedule, Subject, Topic, RevisionPlan } = require('../models');
const { calculatePerformance } = require('./performance.controller');

const DAY_MS = 24 * 60 * 60 * 1000;

function validId(value) {
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return parsed;
}

function dateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function daysRemaining(value, now = new Date()) {
  const target = parseDateOnly(dateOnly(value));
  if (!target) return 0;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((target.getTime() - today) / DAY_MS));
}

function dateRange(value) {
  const start = parseDateOnly(dateOnly(value));
  return { [Op.gte]: start, [Op.lt]: new Date(start.getTime() + DAY_MS) };
}

async function preparationBySubject(userId, subjectIds) {
  const ids = [...new Set(subjectIds.filter(Boolean).map(Number))];
  if (!ids.length) return new Map();
  const topics = await Topic.findAll({ where: { subjectId: { [Op.in]: ids } }, attributes: ['id', 'subjectId'] });
  const topicIds = topics.map(topic => topic.id);
  const topicToSubject = new Map(topics.map(topic => [topic.id, topic.subjectId]));
  const [performance, revisionItems] = await Promise.all([
    calculatePerformance(userId),
    topicIds.length ? RevisionPlan.findAll({ where: { userId, topicId: { [Op.in]: topicIds } }, attributes: ['topicId', 'status'] }) : [],
  ]);

  const performanceByTopic = new Map(performance.topicPerformance.map(topic => [topic.topicId, topic]));
  const revisionsByTopic = new Map();
  for (const revision of revisionItems) {
    const item = revisionsByTopic.get(revision.topicId) || { pending: false, completed: false };
    item[revision.status] = true;
    revisionsByTopic.set(revision.topicId, item);
  }

  const stats = new Map(ids.map(id => [id, {
    totalTopics: 0,
    topicsWithQuizAttempts: 0,
    weakTopicCount: 0,
    completedRevisionTopics: 0,
    pendingRevisionCount: 0,
    completedLearningAreas: new Set(),
  }]));
  for (const topic of topics) {
    const subjectStats = stats.get(topic.subjectId);
    if (subjectStats) subjectStats.totalTopics += 1;

    const topicPerformance = performanceByTopic.get(topic.id);
    const revision = revisionsByTopic.get(topic.id);
    if (topicPerformance && subjectStats) {
      subjectStats.topicsWithQuizAttempts += 1;
      if (topicPerformance.status === 'Weak') subjectStats.weakTopicCount += 1;
      // Each topic is one learning area. Quiz work completes it when its current
      // answer-derived status is Average/Strong; a completed revision also counts.
      else subjectStats.completedLearningAreas.add(topic.id);
    }
    if (revision?.completed && subjectStats) {
      subjectStats.completedRevisionTopics += 1;
      subjectStats.completedLearningAreas.add(topic.id);
    }
    if (revision?.pending && subjectStats) subjectStats.pendingRevisionCount += 1;
  }

  for (const item of stats.values()) {
    item.completedLearningAreaCount = item.completedLearningAreas.size;
    item.preparationPercentage = item.totalTopics
      ? Number((item.completedLearningAreaCount / item.totalTopics * 100).toFixed(2))
      : 0;
    delete item.completedLearningAreas;
  }
  return stats;
}

function serializeSchedule(schedule, preparation = {}) {
  const upcoming = schedule.status === 'upcoming';
  const normalizedDate = dateOnly(schedule.examDate);
  const remaining = upcoming ? daysRemaining(schedule.examDate) : null;
  return {
    id: schedule.id,
    subjectId: schedule.subjectId,
    subjectName: schedule.Subject?.name || schedule.title || 'Subject unavailable',
    examDate: normalizedDate,
    status: schedule.status,
    daysRemaining: remaining,
    isPastDue: upcoming && normalizedDate < dateOnly(new Date()),
    notes: schedule.notes || '',
    preparationPercentage: preparation.preparationPercentage ?? 0,
    totalTopics: preparation.totalTopics ?? 0,
    topicsWithQuizAttempts: preparation.topicsWithQuizAttempts ?? 0,
    weakTopicCount: preparation.weakTopicCount ?? 0,
    completedRevisionTopics: preparation.completedRevisionTopics ?? 0,
    pendingRevisionCount: preparation.pendingRevisionCount ?? 0,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}

async function findSchedules(userId, status) {
  const where = { userId };
  if (status) where.status = status;
  const schedules = await ExamSchedule.findAll({
    where,
    include: [{ association: ExamSchedule.associations.Subject, required: false }],
    order: [['examDate', status === 'completed' ? 'DESC' : 'ASC'], ['id', 'ASC']],
  });
  const preparation = await preparationBySubject(userId, schedules.map(schedule => schedule.subjectId));
  return schedules.map(schedule => serializeSchedule(schedule, preparation.get(schedule.subjectId)));
}

function getAll(req, res, next) {
  return findSchedules(req.user.id).then(exams => res.json({ success: true, exams })).catch(next);
}
function getUpcoming(req, res, next) {
  return findSchedules(req.user.id, 'upcoming').then(exams => res.json({ success: true, exams })).catch(next);
}
function getCompleted(req, res, next) {
  return findSchedules(req.user.id, 'completed').then(exams => res.json({ success: true, exams })).catch(next);
}

async function dashboard(req, res, next) {
  try {
    const exams = await findSchedules(req.user.id);
    const upcomingExams = exams.filter(exam => exam.status === 'upcoming')
      .sort((a, b) => a.examDate.localeCompare(b.examDate) || a.id - b.id);
    const completedExams = exams.filter(exam => exam.status === 'completed')
      .sort((a, b) => b.examDate.localeCompare(a.examDate) || b.id - a.id);
    return res.json({
      success: true,
      upcomingExams,
      completedExams,
      summary: {
        totalExams: exams.length,
        upcomingCount: upcomingExams.length,
        completedCount: completedExams.length,
      },
    });
  } catch (error) { return next(error); }
}

async function create(req, res, next) {
  try {
    const hasSubjectId = req.body?.subjectId !== undefined && req.body.subjectId !== null && req.body.subjectId !== '';
    const subjectName = typeof req.body?.subjectName === 'string' ? req.body.subjectName.trim() : '';
    if (hasSubjectId && !validId(req.body.subjectId)) return res.status(400).json({ success: false, message: 'A valid subjectId is required.' });
    if (!hasSubjectId && !subjectName) return res.status(400).json({ success: false, message: 'Choose a subject or enter an exam subject name.' });
    if (subjectName.length > 180) return res.status(400).json({ success: false, message: 'Subject name must be 180 characters or fewer.' });
    if (hasSubjectId && req.body?.subjectName !== undefined) return res.status(400).json({ success: false, message: 'Choose either a saved subject or a custom subject name.' });
    const parsedDate = parseDateOnly(req.body?.examDate);
    if (!parsedDate) return res.status(400).json({ success: false, message: 'examDate must be a valid date in YYYY-MM-DD format.' });
    if (daysRemaining(parsedDate) === 0 && dateOnly(parsedDate) < dateOnly(new Date())) {
      return res.status(400).json({ success: false, message: 'A new upcoming exam cannot be scheduled in the past.' });
    }
    if (req.body?.notes !== undefined && req.body.notes !== null && typeof req.body.notes !== 'string') {
      return res.status(400).json({ success: false, message: 'notes must be a string.' });
    }
    const subject = hasSubjectId ? await Subject.findByPk(Number(req.body.subjectId)) : null;
    if (hasSubjectId && !subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const duplicateWhere = {
      userId: req.user.id,
      subjectId: subject?.id ?? null,
      examDate: { [Op.gte]: parsedDate, [Op.lt]: new Date(parsedDate.getTime() + DAY_MS) },
    };
    if (!subject) duplicateWhere.title = subjectName;
    const existing = await ExamSchedule.findOne({ where: duplicateWhere });
    if (existing) return res.status(409).json({ success: false, message: 'An exam is already scheduled for this subject and date.' });
    const schedule = await ExamSchedule.create({
      userId: req.user.id,
      subjectId: subject?.id ?? null,
      title: subject ? null : subjectName,
      examDate: parsedDate,
      status: 'upcoming',
      notes: typeof req.body.notes === 'string' ? req.body.notes.trim() || null : null,
    });
    await schedule.reload({ include: [{ association: ExamSchedule.associations.Subject }] });
    const preparation = await preparationBySubject(req.user.id, subject ? [subject.id] : []);
    return res.status(201).json({ success: true, exam: serializeSchedule(schedule, subject ? preparation.get(subject.id) : {}) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'An exam is already scheduled for this subject and date.' });
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'A valid exam ID is required.' });
    const schedule = await ExamSchedule.findOne({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!schedule) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    if (req.body?.subjectId !== undefined && req.body?.subjectName !== undefined) {
      return res.status(400).json({ success: false, message: 'Choose either a saved subject or a custom subject name.' });
    }
    const updates = {};
    if (req.body?.examDate !== undefined) {
      const parsedDate = parseDateOnly(req.body.examDate);
      if (!parsedDate) return res.status(400).json({ success: false, message: 'examDate must be a valid date in YYYY-MM-DD format.' });
      updates.examDate = parsedDate;
    }
    if (req.body?.subjectId !== undefined) {
      if (req.body.subjectId === null || req.body.subjectId === '') {
        return res.status(400).json({ success: false, message: 'Choose a saved subject or provide subjectName.' });
      }
      if (!validId(req.body.subjectId)) return res.status(400).json({ success: false, message: 'A valid subjectId is required.' });
      const subject = await Subject.findByPk(Number(req.body.subjectId));
      if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
      updates.subjectId = subject.id;
      updates.title = null;
    }
    if (req.body?.subjectName !== undefined) {
      if (typeof req.body.subjectName !== 'string' || !req.body.subjectName.trim()) {
        return res.status(400).json({ success: false, message: 'subjectName must be a non-empty string.' });
      }
      const subjectName = req.body.subjectName.trim();
      if (subjectName.length > 180) return res.status(400).json({ success: false, message: 'Subject name must be 180 characters or fewer.' });
      updates.subjectId = null;
      updates.title = subjectName;
    }
    if (req.body?.notes !== undefined) {
      if (req.body.notes !== null && typeof req.body.notes !== 'string') return res.status(400).json({ success: false, message: 'notes must be a string.' });
      updates.notes = typeof req.body.notes === 'string' ? req.body.notes.trim() || null : null;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Provide examDate, notes, subjectId, or subjectName to update.' });
    const nextSubjectId = updates.subjectId !== undefined ? updates.subjectId : schedule.subjectId;
    const nextTitle = updates.title !== undefined ? updates.title : schedule.title;
    const duplicateWhere = {
      userId: req.user.id,
      subjectId: nextSubjectId ?? null,
      examDate: dateRange(updates.examDate ?? schedule.examDate),
      id: { [Op.ne]: schedule.id },
    };
    if (nextSubjectId == null) duplicateWhere.title = nextTitle;
    const duplicate = await ExamSchedule.findOne({
      where: duplicateWhere,
    });
    if (duplicate) return res.status(409).json({ success: false, message: 'An exam is already scheduled for this subject and date.' });
    await schedule.update(updates);
    await schedule.reload({ include: [{ association: ExamSchedule.associations.Subject }] });
    const preparation = await preparationBySubject(req.user.id, schedule.subjectId ? [schedule.subjectId] : []);
    return res.json({ success: true, exam: serializeSchedule(schedule, schedule.subjectId ? preparation.get(schedule.subjectId) : {}) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'An exam is already scheduled for this subject and date.' });
    return next(error);
  }
}

async function complete(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'A valid exam ID is required.' });
    const schedule = await ExamSchedule.findOne({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!schedule) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    if (schedule.status === 'completed') return res.status(409).json({ success: false, message: 'This exam is already completed.' });
    schedule.status = 'completed';
    await schedule.save();
    await schedule.reload({ include: [{ association: ExamSchedule.associations.Subject }] });
    const preparation = await preparationBySubject(req.user.id, [schedule.subjectId]);
    return res.json({ success: true, exam: serializeSchedule(schedule, preparation.get(schedule.subjectId)) });
  } catch (error) { return next(error); }
}

async function remove(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'A valid exam ID is required.' });
    const schedule = await ExamSchedule.findOne({ where: { id: Number(req.params.id), userId: req.user.id } });
    if (!schedule) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    await schedule.destroy();
    return res.json({ success: true, message: 'Exam schedule deleted.' });
  } catch (error) { return next(error); }
}

module.exports = { getAll, getUpcoming, getCompleted, dashboard, create, update, complete, remove, daysRemaining, preparationBySubject };
