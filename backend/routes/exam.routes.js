const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const exams = require('../controllers/exam.controller');

const router = express.Router();
router.use(requireAuth, allowRoles('student'));

router.get('/dashboard', exams.dashboard);
router.get('/upcoming', exams.getUpcoming);
router.get('/completed', exams.getCompleted);
router.get('/', exams.getAll);
router.post('/', exams.create);
router.patch('/:id/complete', exams.complete);
router.patch('/:id', exams.update);
router.delete('/:id', exams.remove);

module.exports = router;
