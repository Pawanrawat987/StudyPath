const { Op } = require('sequelize');
const { Subject, Topic } = require('../models');

function validId(value) { return /^\d+$/.test(String(value)) && Number(value) > 0; }
function cleanText(value) { return typeof value === 'string' ? value.trim() : ''; }

async function listSubjects(_req, res, next) {
  try {
    const subjects = await Subject.findAll({ order: [['name', 'ASC']] });
    return res.json({ success: true, subjects });
  } catch (error) { return next(error); }
}

async function getSubject(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const subject = await Subject.findByPk(req.params.id, { include: [{ model: Topic, order: [['name', 'ASC']] }] });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    return res.json({ success: true, subject });
  } catch (error) { return next(error); }
}

async function createSubject(req, res, next) {
  try {
    const name = cleanText(req.body?.name);
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : null;
    if (!name) return res.status(400).json({ success: false, message: 'Subject name is required.' });
    const duplicate = await Subject.findOne({ where: { name } });
    if (duplicate) return res.status(409).json({ success: false, message: 'A subject with this name already exists.' });
    const subject = await Subject.create({ name, description });
    return res.status(201).json({ success: true, subject });
  } catch (error) { return next(error); }
}

async function updateSubject(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const name = cleanText(req.body?.name);
    if (!name) return res.status(400).json({ success: false, message: 'Subject name is required.' });
    const duplicate = await Subject.findOne({ where: { name, id: { [Op.ne]: subject.id } } });
    if (duplicate) return res.status(409).json({ success: false, message: 'A subject with this name already exists.' });
    subject.name = name;
    subject.description = typeof req.body.description === 'string' ? req.body.description.trim() : null;
    await subject.save();
    return res.json({ success: true, subject });
  } catch (error) { return next(error); }
}

async function deleteSubject(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    await subject.destroy();
    return res.status(200).json({ success: true, message: 'Subject deleted.' });
  } catch (error) { return next(error); }
}

module.exports = { listSubjects, getSubject, createSubject, updateSubject, deleteSubject };
