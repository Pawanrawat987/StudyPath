const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const subjects = require('../controllers/subject.controller');
const topics = require('../controllers/topic.controller');
const questions = require('../controllers/question.controller');

const router = express.Router();
const contentManagers = allowRoles('teacher', 'admin');
router.use(requireAuth);

router.get('/subjects', subjects.listSubjects);
router.get('/subjects/:id', subjects.getSubject);
router.post('/subjects', contentManagers, subjects.createSubject);
router.put('/subjects/:id', contentManagers, subjects.updateSubject);
router.delete('/subjects/:id', contentManagers, subjects.deleteSubject);

router.get('/subjects/:subjectId/topics', topics.listTopics);
router.post('/subjects/:subjectId/topics', contentManagers, topics.createTopic);
router.get('/topics/:id', topics.getTopic);
router.put('/topics/:id', contentManagers, topics.updateTopic);
router.delete('/topics/:id', contentManagers, topics.deleteTopic);

router.get('/topics/:topicId/questions', questions.listQuestions);
router.post('/topics/:topicId/questions', contentManagers, questions.createQuestion);
router.get('/questions/:id', contentManagers, questions.getQuestion);
router.put('/questions/:id', contentManagers, questions.updateQuestion);
router.delete('/questions/:id', contentManagers, questions.deleteQuestion);

module.exports = router;
