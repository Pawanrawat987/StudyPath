const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const performance = require('../controllers/performance.controller');

const router = express.Router();
router.use(requireAuth, allowRoles('student'));

router.get('/overview', performance.overview);
router.get('/subjects', performance.subjects);
router.get('/topics', performance.topics);
router.get('/weak-topics', performance.weakTopics);
router.get('/', performance.getPerformance);

module.exports = router;
