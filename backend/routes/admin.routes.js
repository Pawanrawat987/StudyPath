const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const admin = require('../controllers/admin.controller');

const router = express.Router();
router.use(requireAuth, allowRoles('teacher', 'admin'));
router.get('/dashboard', admin.dashboard);
router.get('/students', admin.students);
router.get('/students/:studentId/performance', admin.studentPerformance);

module.exports = router;
