const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const quizzes = require('../controllers/quiz.controller');

const router = express.Router();
const managers = allowRoles('teacher', 'admin');
const students = allowRoles('student');
router.use(requireAuth);

router.get('/quizzes', quizzes.listQuizzes);
router.get('/quizzes/topic/:topicId', quizzes.listPublishedByTopic);
router.get('/quizzes/subject/:subjectId', quizzes.listPublishedBySubject);
router.post('/quizzes', managers, quizzes.createQuiz);
router.get('/quizzes/:id', quizzes.getQuiz);
router.get('/quizzes/:id/questions', quizzes.listQuestions);
router.post('/quizzes/:id/questions', managers, quizzes.addQuizQuestion);
router.delete('/quizzes/:id/questions/:questionId', managers, quizzes.removeQuizQuestion);
router.put('/quizzes/:id', managers, quizzes.updateQuiz);
router.delete('/quizzes/:id', managers, quizzes.deleteQuiz);
router.post('/quizzes/:id/publish', managers, (req, res, next) => {
  req.body = { ...req.body, isPublished: true };
  return quizzes.updateQuiz(req, res, next);
});
router.post('/quizzes/:id/unpublish', managers, (req, res, next) => {
  req.body = { ...req.body, isPublished: false };
  return quizzes.updateQuiz(req, res, next);
});
router.post('/quizzes/:id/start', students, quizzes.startAttempt);
router.post('/quiz-attempts/:id/submit', students, quizzes.submitAttempt);
router.get('/quiz-attempts/my', students, quizzes.listMyAttempts);
router.get('/quiz-attempts/:id', quizzes.getAttempt);

module.exports = router;
