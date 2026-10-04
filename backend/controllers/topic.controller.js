const { Op } = require('sequelize');
const { Subject, Topic } = require('../models');

function validId(value) { return /^\d+$/.test(String(value)) && Number(value) > 0; }
function cleanText(value) { return typeof value === 'string' ? value.trim() : ''; }

async function listTopics(req, res, next) {
  try {
    if (!validId(req.params.subjectId)) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const subject = await Subject.findByPk(req.params.subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const topics = await Topic.findAll({ where: { subjectId: subject.id }, order: [['name', 'ASC']] });
    return res.json({ success: true, topics });
  } catch (error) { return next(error); }
}

async function getTopic(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Topic not found.' });
    const topic = await Topic.findByPk(req.params.id, { include: [{ model: Subject }] });
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });
    return res.json({ success: true, topic });
  } catch (error) { return next(error); }
}

async function createTopic(req, res, next) {
  try {
    if (!validId(req.params.subjectId)) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const subject = await Subject.findByPk(req.params.subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const name = cleanText(req.body?.name);
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : null;
    if (!name) return res.status(400).json({ success: false, message: 'Topic name is required.' });
    const duplicate = await Topic.findOne({ where: { subjectId: subject.id, name } });
    if (duplicate) return res.status(409).json({ success: false, message: 'A topic with this name already exists in this subject.' });
    const topic = await Topic.create({ subjectId: subject.id, name, description });
    return res.status(201).json({ success: true, topic });
  } catch (error) { return next(error); }
}

async function updateTopic(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Topic not found.' });
    const topic = await Topic.findByPk(req.params.id);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });
    const name = cleanText(req.body?.name);
    if (!name) return res.status(400).json({ success: false, message: 'Topic name is required.' });
    let subjectId = topic.subjectId;
    if (req.body.subjectId !== undefined) {
      if (!validId(req.body.subjectId)) return res.status(404).json({ success: false, message: 'Subject not found.' });
      const subject = await Subject.findByPk(req.body.subjectId);
      if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
      subjectId = subject.id;
    }
    const duplicate = await Topic.findOne({ where: { subjectId, name, id: { [Op.ne]: topic.id } } });
    if (duplicate) return res.status(409).json({ success: false, message: 'A topic with this name already exists in this subject.' });
    topic.subjectId = subjectId;
    topic.name = name;
    topic.description = typeof req.body.description === 'string' ? req.body.description.trim() : null;
    await topic.save();
    return res.json({ success: true, topic });
  } catch (error) { return next(error); }
}

async function deleteTopic(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Topic not found.' });
    const topic = await Topic.findByPk(req.params.id);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });
    await topic.destroy();
    return res.status(200).json({ success: true, message: 'Topic and its questions deleted.' });
  } catch (error) { return next(error); }
}

module.exports = { listTopics, getTopic, createTopic, updateTopic, deleteTopic };
