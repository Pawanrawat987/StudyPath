const { Subject, Topic, Question } = require('../models');

const difficulties = new Set(['easy', 'medium', 'hard']);
const answers = new Set(['A', 'B', 'C', 'D']);
function validId(value) { return /^\d+$/.test(String(value)) && Number(value) > 0; }
function cleanText(value) { return typeof value === 'string' ? value.trim() : ''; }
function serializeQuestion(question, includeAnswer) {
  const data = question.toJSON();
  const options = data.options || {};
  const result = {
    id: data.id,
    topicId: data.topicId,
    questionText: data.questionText,
    optionA: options.A ?? options.a ?? options[0] ?? '',
    optionB: options.B ?? options.b ?? options[1] ?? '',
    optionC: options.C ?? options.c ?? options[2] ?? '',
    optionD: options.D ?? options.d ?? options[3] ?? '',
    difficulty: data.difficulty,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  if (includeAnswer) {
    result.correctAnswer = data.correctAnswer;
    result.explanation = data.explanation;
  }
  return result;
}

function validateQuestion(body) {
  const questionText = cleanText(body?.questionText);
  if (!questionText) return { error: 'Question text is required.' };
  const optionA = cleanText(body?.optionA);
  const optionB = cleanText(body?.optionB);
  const optionC = cleanText(body?.optionC);
  const optionD = cleanText(body?.optionD);
  if (!optionA || !optionB || !optionC || !optionD) return { error: 'All four answer options are required.' };
  const correctAnswer = cleanText(body?.correctAnswer).toUpperCase();
  if (!answers.has(correctAnswer)) return { error: 'Correct answer must be A, B, C, or D.' };
  const difficulty = cleanText(body?.difficulty).toLowerCase();
  if (!difficulties.has(difficulty)) return { error: 'Difficulty must be easy, medium, or hard.' };
  return {
    value: {
      questionText,
      options: { A: optionA, B: optionB, C: optionC, D: optionD },
      correctAnswer,
      explanation: typeof body.explanation === 'string' ? body.explanation.trim() || null : null,
      difficulty,
    },
  };
}

async function listQuestions(req, res, next) {
  try {
    if (!validId(req.params.topicId)) return res.status(404).json({ success: false, message: 'Topic not found.' });
    const topic = await Topic.findByPk(req.params.topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });
    const questions = await Question.findAll({ where: { topicId: topic.id }, order: [['id', 'ASC']] });
    const includeAnswer = ['teacher', 'admin'].includes(req.user.role);
    return res.json({ success: true, questions: questions.map((question) => serializeQuestion(question, includeAnswer)) });
  } catch (error) { return next(error); }
}

async function getQuestion(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Question not found.' });
    const question = await Question.findByPk(req.params.id, { include: [{ model: Topic, include: [{ model: Subject }] }] });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });
    return res.json({ success: true, question: serializeQuestion(question, true) });
  } catch (error) { return next(error); }
}

async function createQuestion(req, res, next) {
  try {
    if (!validId(req.params.topicId)) return res.status(404).json({ success: false, message: 'Topic not found.' });
    const topic = await Topic.findByPk(req.params.topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });
    const validation = validateQuestion(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    const question = await Question.create({ topicId: topic.id, ...validation.value });
    return res.status(201).json({ success: true, question: serializeQuestion(question, true) });
  } catch (error) { return next(error); }
}

async function updateQuestion(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Question not found.' });
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });
    const validation = validateQuestion(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    if (req.body.topicId !== undefined) {
      if (!validId(req.body.topicId)) return res.status(404).json({ success: false, message: 'Topic not found.' });
      const topic = await Topic.findByPk(req.body.topicId);
      if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });
      question.topicId = topic.id;
    }
    Object.assign(question, validation.value);
    await question.save();
    return res.json({ success: true, question: serializeQuestion(question, true) });
  } catch (error) { return next(error); }
}

async function deleteQuestion(req, res, next) {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Question not found.' });
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });
    await question.destroy();
    return res.status(200).json({ success: true, message: 'Question deleted.' });
  } catch (error) { return next(error); }
}

module.exports = { listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion };
