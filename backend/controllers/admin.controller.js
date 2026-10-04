const { User, Subject, Topic, Question, Quiz, QuizAttempt } = require('../models');
const { calculatePerformance } = require('./performance.controller');

async function dashboard(_req, res, next) {
  try {
    const [totalStudents, totalSubjects, totalTopics, totalQuestions, totalQuizzes, publishedQuizzes] = await Promise.all([
      User.count({ where: { role: 'student' } }), Subject.count(), Topic.count(), Question.count(), Quiz.count(), Quiz.count({ where: { isPublished: true } }),
    ]);
    return res.json({ success: true, counts: { totalStudents, totalSubjects, totalTopics, totalQuestions, totalQuizzes, publishedQuizzes } });
  } catch (error) { return next(error); }
}

async function students(_req, res, next) {
  try {
    const users = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email', 'emailVerified', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    const rows = await Promise.all(users.map(async (user) => {
      const [attemptCount, performance] = await Promise.all([
        QuizAttempt.count({ where: { userId: user.id } }), calculatePerformance(user.id),
      ]);
      return {
        id: user.id, name: user.name, email: user.email,
        accountStatus: user.emailVerified ? 'verified' : 'pending_verification',
        attemptCount, averagePerformance: performance.overview.totalQuizzesAttempted ? performance.overview.overallPercentage : null,
      };
    }));
    return res.json({ success: true, students: rows });
  } catch (error) { return next(error); }
}

async function studentPerformance(req, res, next) {
  try {
    if (!/^\d+$/.test(String(req.params.studentId)) || Number(req.params.studentId) < 1) {
      return res.status(400).json({ success: false, message: 'A valid student ID is required.' });
    }
    const student = await User.findOne({
      where: { id: req.params.studentId, role: 'student' },
      attributes: ['id', 'name', 'email'],
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    const performance = await calculatePerformance(student.id);
    return res.json({ success: true, student, ...performance.overview, strongTopics: performance.strongTopics, averageTopics: performance.averageTopics, weakTopics: performance.weakTopics });
  } catch (error) { return next(error); }
}

module.exports = { dashboard, students, studentPerformance };
