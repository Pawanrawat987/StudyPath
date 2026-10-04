const { Op } = require('sequelize');
const { sequelize, Quiz, QuizAttempt, Answer, Topic, Question, Subject } = require('../models');

const managers = (user) => ['teacher', 'admin'].includes(user.role);
const idOK = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;
const text = (value) => typeof value === 'string' ? value.trim() : '';
const own = (attempt, user) => Number(attempt.userId) === Number(user.id);

function questionView(question, reveal = false) {
  const q = question.toJSON();
  const options = q.options || {};
  const view = {
    id: q.id,
    topicId: q.topicId,
    questionText: q.questionText,
    options: { A: options.A ?? options.a ?? options[0] ?? '', B: options.B ?? options.b ?? options[1] ?? '', C: options.C ?? options.c ?? options[2] ?? '', D: options.D ?? options.d ?? options[3] ?? '' },
    difficulty: q.difficulty,
  };
  if (reveal) { view.correctAnswer = q.correctAnswer; view.explanation = q.explanation; }
  return view;
}

async function quizQuestions(quiz, transaction) {
  let linked = await quiz.getQuestions({ transaction, order: [['id', 'ASC']] });
  if (!linked.length) {
    const current = await Question.findAll({ where: { topicId: quiz.topicId }, order: [['id', 'ASC']], transaction });
    if (!current.length) return [];
    await quiz.addQuestions(current, { transaction });
    linked = current;
  }
  return linked;
}

function quizView(quiz) {
  const data = quiz.toJSON();
  return {
    id: data.id, title: data.title, description: data.description, topicId: data.topicId,
    timeLimit: data.timeLimit, isPublished: data.isPublished,
    topic: data.Topic ? { id: data.Topic.id, name: data.Topic.name, subject: data.Topic.Subject ? { id: data.Topic.Subject.id, name: data.Topic.Subject.name } : null } : null,
    createdAt: data.createdAt, updatedAt: data.updatedAt,
  };
}

async function publishedQuizView(quiz) {
  const linkedQuestionCount = await quiz.countQuestions();
  const questionCount = linkedQuestionCount || await Question.count({ where: { topicId: quiz.topicId } });
  return { ...quizView(quiz), questionCount };
}

async function listQuizzes(req, res, next) {
  try {
    const where = managers(req.user) ? {} : { isPublished: true };
    const quizzes = await Quiz.findAll({ where, include: [{ model: Topic, include: [Subject] }], order: [['createdAt', 'DESC']] });
    return res.json({ success: true, quizzes: quizzes.filter(q => q.topicId).map(quizView) });
  } catch (error) { return next(error); }
}

async function listPublishedByTopic(req, res, next) {
  try {
    if (!idOK(req.params.topicId)) return res.status(400).json({ success: false, message: 'A valid topic ID is required.' });
    const topic = await Topic.findByPk(req.params.topicId, { include: [{ model: Subject, required: true }] });
    if (!topic || !topic.Subject) return res.status(404).json({ success: false, message: 'Topic or its subject was not found.' });

    // The topicId column covers regular topic quizzes. The question join also finds
    // quizzes that contain this topic alongside questions from other topics.
    const [primaryTopicQuizzes, questionTopicQuizzes] = await Promise.all([
      Quiz.findAll({ where: { topicId: topic.id, isPublished: true }, include: [{ model: Topic, include: [Subject] }], order: [['createdAt', 'DESC']] }),
      Quiz.findAll({
        where: { isPublished: true },
        include: [
          { model: Topic, include: [Subject] },
          { model: Question, where: { topicId: topic.id }, required: true, attributes: [], through: { attributes: [] } },
        ],
        order: [['createdAt', 'DESC']],
      }),
    ]);
    const unique = new Map();
    for (const quiz of [...primaryTopicQuizzes, ...questionTopicQuizzes]) unique.set(quiz.id, quiz);
    const quizzes = await Promise.all([...unique.values()].map(publishedQuizView));
    return res.json({
      success: true,
      quizzes,
      ...(quizzes.length ? {} : { message: 'No published quizzes are available for this topic yet.' }),
    });
  } catch (error) { return next(error); }
}

async function listPublishedBySubject(req, res, next) {
  try {
    if (!idOK(req.params.subjectId)) return res.status(400).json({ success: false, message: 'A valid subject ID is required.' });
    const subject = await Subject.findByPk(req.params.subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    const topics = await Topic.findAll({ where: { subjectId: subject.id }, attributes: ['id'] });
    const topicIds = topics.map(topic => topic.id);
    if (!topicIds.length) return res.json({ success: true, quizzes: [], message: 'No published quizzes are available for this subject yet.' });

    const [primaryTopicQuizzes, questionTopicQuizzes] = await Promise.all([
      Quiz.findAll({ where: { topicId: { [Op.in]: topicIds }, isPublished: true }, include: [{ model: Topic, include: [Subject] }], order: [['createdAt', 'DESC']] }),
      Quiz.findAll({
        where: { isPublished: true },
        include: [
          { model: Topic, include: [Subject] },
          { model: Question, where: { topicId: { [Op.in]: topicIds } }, required: true, attributes: [], through: { attributes: [] } },
        ],
        order: [['createdAt', 'DESC']],
      }),
    ]);
    const unique = new Map();
    for (const quiz of [...primaryTopicQuizzes, ...questionTopicQuizzes]) unique.set(quiz.id, quiz);
    const quizzes = await Promise.all([...unique.values()].map(publishedQuizView));
    return res.json({
      success: true,
      quizzes,
      ...(quizzes.length ? {} : { message: 'No published quizzes are available for this subject yet.' }),
    });
  } catch (error) { return next(error); }
}

async function getQuiz(req, res, next) {
  try {
    if (!idOK(req.params.id)) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const quiz = await Quiz.findByPk(req.params.id, { include: [{ model: Topic, include: [Subject] }] });
    if (!quiz || !quiz.topicId || (!quiz.isPublished && !managers(req.user))) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    return res.json({ success: true, quiz: quizView(quiz) });
  } catch (error) { return next(error); }
}

async function listQuestions(req, res, next) {
  try {
    if (!idOK(req.params.id)) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz || !quiz.topicId || (!quiz.isPublished && !managers(req.user))) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const questions = await quizQuestions(quiz);
    return res.json({ success: true, questions: questions.map(q => questionView(q, managers(req.user))) });
  } catch (error) { return next(error); }
}

async function addQuizQuestion(req, res, next) {
  try {
    if (!idOK(req.params.id) || !idOK(req.body?.questionId)) return res.status(400).json({ success: false, message: 'Valid quiz and question IDs are required.' });
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz || !quiz.topicId) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    if (await QuizAttempt.count({ where: { quizId: quiz.id } })) return res.status(409).json({ success: false, message: 'Questions cannot be changed after an attempt has started.' });
    const question = await Question.findByPk(req.body.questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });
    const linked = await quiz.getQuestions();
    if (!linked.length) await quizQuestions(quiz);
    await quiz.addQuestion(question);
    return res.json({ success: true, message: 'Question added to quiz.' });
  } catch (error) { return next(error); }
}

async function removeQuizQuestion(req, res, next) {
  try {
    if (!idOK(req.params.id) || !idOK(req.params.questionId)) return res.status(400).json({ success: false, message: 'Valid quiz and question IDs are required.' });
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz || !quiz.topicId) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    if (await QuizAttempt.count({ where: { quizId: quiz.id } })) return res.status(409).json({ success: false, message: 'Questions cannot be changed after an attempt has started.' });
    const question = await Question.findByPk(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });
    const linked = await quiz.getQuestions();
    if (!linked.length) await quizQuestions(quiz);
    await quiz.removeQuestion(question);
    return res.json({ success: true, message: 'Question removed from quiz.' });
  } catch (error) { return next(error); }
}

function validateQuiz(body, partial = false) {
  const data = {};
  if (!partial || body.title !== undefined) {
    data.title = text(body.title);
    if (!data.title) return { error: 'Quiz title is required.' };
  }
  if (body.description !== undefined) data.description = text(body.description) || null;
  if (body.topicId !== undefined || !partial) {
    if (!idOK(body.topicId)) return { error: 'A valid topicId is required.' };
    data.topicId = Number(body.topicId);
  }
  if (body.timeLimit !== undefined || !partial) {
    if (body.timeLimit === null || body.timeLimit === '') data.timeLimit = null;
    else {
      const limit = Number(body.timeLimit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 600) return { error: 'Time limit must be a whole number between 1 and 600 minutes.' };
      data.timeLimit = limit;
    }
  }
  if (body.isPublished !== undefined) {
    if (typeof body.isPublished !== 'boolean') return { error: 'isPublished must be a boolean.' };
    data.isPublished = body.isPublished;
  }
  return { data };
}

async function createQuiz(req, res, next) {
  try {
    const validation = validateQuiz(req.body);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    const topic = await Topic.findByPk(validation.data.topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });
    validation.data.isPublished = false;
    const quiz = await Quiz.create(validation.data);
    await quiz.reload({ include: [{ model: Topic, include: [Subject] }] });
    return res.status(201).json({ success: true, quiz: quizView(quiz) });
  } catch (error) { return next(error); }
}

async function updateQuiz(req, res, next) {
  try {
    if (!idOK(req.params.id)) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const validation = validateQuiz(req.body, true);
    if (validation.error) return res.status(400).json({ success: false, message: validation.error });
    if (validation.data.topicId && validation.data.topicId !== quiz.topicId) {
      if (await QuizAttempt.count({ where: { quizId: quiz.id } })) return res.status(409).json({ success: false, message: 'A quiz topic cannot be changed after attempts have started.' });
      const topic = await Topic.findByPk(validation.data.topicId);
      if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' });
      await quiz.setQuestions([]);
    }
    await quiz.update(validation.data);
    await quiz.reload({ include: [{ model: Topic, include: [Subject] }] });
    return res.json({ success: true, quiz: quizView(quiz) });
  } catch (error) { return next(error); }
}

async function deleteQuiz(req, res, next) {
  try {
    if (!idOK(req.params.id)) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    if (await QuizAttempt.count({ where: { quizId: quiz.id } })) return res.status(409).json({ success: false, message: 'A quiz with attempt history cannot be deleted.' });
    await quiz.destroy();
    return res.json({ success: true, message: 'Quiz deleted.' });
  } catch (error) { return next(error); }
}

async function startAttempt(req, res, next) {
  try {
    if (!idOK(req.params.id)) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const result = await sequelize.transaction(async transaction => {
      const quiz = await Quiz.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!quiz || !quiz.isPublished || !quiz.topicId) return { status: 404, body: { success: false, message: 'Quiz not found.' } };
      const questions = await quizQuestions(quiz, transaction);
      if (!questions.length) return { status: 409, body: { success: false, message: 'This quiz has no questions yet.' } };
      const startedAt = new Date();
      const attempt = await QuizAttempt.create({ quizId: quiz.id, userId: req.user.id, startedAt, totalQuestions: questions.length, status: 'in_progress' }, { transaction });
      return { status: 201, body: { success: true, attempt: { id: attempt.id, quizId: quiz.id, startedAt, totalQuestions: questions.length, timeLimit: quiz.timeLimit }, quiz: { id: quiz.id, title: quiz.title }, questions: questions.map(q => questionView(q)) } };
    });
    return res.status(result.status).json(result.body);
  } catch (error) { return next(error); }
}

function attemptSummary(attempt) {
  return {
    id: attempt.id, quizId: attempt.quizId, userId: attempt.userId,
    startedAt: attempt.startedAt, submittedAt: attempt.completedAt,
    score: Number(attempt.score || 0), totalQuestions: attempt.totalQuestions,
    correctAnswers: attempt.correctAnswers, wrongAnswers: attempt.wrongAnswers,
    percentage: Number(attempt.percentage || 0), status: attempt.status,
    quiz: attempt.Quiz ? {
      id: attempt.Quiz.id,
      title: attempt.Quiz.title,
      timeLimit: attempt.Quiz.timeLimit,
      topic: attempt.Quiz.Topic ? {
        id: attempt.Quiz.Topic.id,
        name: attempt.Quiz.Topic.name,
        subject: attempt.Quiz.Topic.Subject ? {
          id: attempt.Quiz.Topic.Subject.id,
          name: attempt.Quiz.Topic.Subject.name,
        } : null,
      } : null,
    } : null,
  };
}

async function submitAttempt(req, res, next) {
  try {
    if (!idOK(req.params.id)) return res.status(404).json({ success: false, message: 'Attempt not found.' });
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can submit quiz attempts.' });
    if (!Array.isArray(req.body?.answers)) return res.status(400).json({ success: false, message: 'answers must be an array.' });
    const seen = new Set();
    for (const answer of req.body.answers) {
      if (!answer || !idOK(answer.questionId) || !['A', 'B', 'C', 'D'].includes(String(answer.selectedAnswer || '').toUpperCase())) return res.status(400).json({ success: false, message: 'Each answer needs a valid questionId and selectedAnswer (A, B, C, or D).' });
      const qid = Number(answer.questionId);
      if (seen.has(qid)) return res.status(400).json({ success: false, message: 'A question can only be answered once.' });
      seen.add(qid);
    }
    const result = await sequelize.transaction(async transaction => {
      const attempt = await QuizAttempt.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!attempt) return { status: 404, body: { success: false, message: 'Attempt not found.' } };
      if (!own(attempt, req.user)) return { status: 403, body: { success: false, message: 'You cannot submit another student’s attempt.' } };
      if (attempt.status !== 'in_progress') return { status: 409, body: { success: false, message: 'This attempt has already been submitted.' } };
      const quiz = await Quiz.findByPk(attempt.quizId, { transaction });
      const questions = await quiz.getQuestions({ transaction, order: [['id', 'ASC']] });
      const byId = new Map(questions.map(q => [Number(q.id), q]));
      if (req.body.answers.some(a => !byId.has(Number(a.questionId)))) return { status: 400, body: { success: false, message: 'An answer references a question outside this quiz.' } };
      const submitted = new Map(req.body.answers.map(a => [Number(a.questionId), String(a.selectedAnswer).toUpperCase()]));
      const now = new Date();
      const deadline = quiz.timeLimit ? new Date(attempt.startedAt).getTime() + quiz.timeLimit * 60000 : Infinity;
      const expired = now.getTime() > deadline;
      // Allow a brief transport grace because the browser submits as its timer reaches zero.
      const lateBeyondGrace = now.getTime() > deadline + 3000;
      let correctAnswers = 0;
      const answerRows = questions.map(question => {
        const selectedAnswer = lateBeyondGrace ? null : submitted.get(Number(question.id)) || null;
        const isCorrect = Boolean(selectedAnswer && String(question.correctAnswer || '').trim().toUpperCase() === selectedAnswer);
        if (isCorrect) correctAnswers += 1;
        return { quizAttemptId: attempt.id, questionId: question.id, selectedAnswer, isCorrect };
      });
      const totalQuestions = questions.length;
      const percentage = totalQuestions ? Number((correctAnswers / totalQuestions * 100).toFixed(2)) : 0;
      await Answer.bulkCreate(answerRows, { transaction });
      await attempt.update({ completedAt: now, status: 'completed', totalQuestions, correctAnswers, wrongAnswers: totalQuestions - correctAnswers, score: correctAnswers, percentage }, { transaction });
      return { status: 200, body: { success: true, expired, message: lateBeyondGrace ? 'Time expired; late answers were not scored.' : expired ? 'Time expired; answers were submitted within the transport grace.' : 'Attempt submitted.', result: { ...attemptSummary(attempt), submittedAt: now } } };
    });
    return res.status(result.status).json(result.body);
  } catch (error) { return next(error); }
}

async function listMyAttempts(req, res, next) {
  try {
    const attempts = await QuizAttempt.findAll({ where: { userId: req.user.id }, include: [{ model: Quiz }], order: [['startedAt', 'DESC']] });
    return res.json({ success: true, attempts: attempts.map(attemptSummary) });
  } catch (error) { return next(error); }
}

async function getAttempt(req, res, next) {
  try {
    if (!idOK(req.params.id)) return res.status(404).json({ success: false, message: 'Attempt not found.' });
    const attempt = await QuizAttempt.findByPk(req.params.id, {
      include: [
        { model: Quiz, include: [{ model: Topic, include: [Subject] }] },
        { model: Answer, include: [{ model: Question }] },
      ],
    });
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found.' });
    if (!managers(req.user) && !own(attempt, req.user)) return res.status(403).json({ success: false, message: 'You cannot view another student’s attempt.' });
    const answers = (attempt.Answers || []).map(answer => ({
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      isCorrect: answer.isCorrect,
      question: answer.Question ? questionView(answer.Question, managers(req.user)) : null,
    }));
    return res.json({ success: true, attempt: { ...attemptSummary(attempt), answers } });
  } catch (error) { return next(error); }
}

module.exports = { listQuizzes, listPublishedByTopic, listPublishedBySubject, getQuiz, listQuestions, addQuizQuestion, removeQuizQuestion, createQuiz, updateQuiz, deleteQuiz, startAttempt, submitAttempt, listMyAttempts, getAttempt };
