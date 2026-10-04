const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const revision = require('../controllers/revision.controller');

const router = express.Router();
router.use(requireAuth, allowRoles('student'));

router.get('/', revision.getAll);
router.get('/pending', revision.getPending);
router.get('/completed', revision.getCompleted);
router.post('/', revision.create);
router.patch('/:id/complete', revision.complete);
router.get('/:id/improvement', revision.improvement);
router.delete('/:id', revision.remove);

module.exports = router;
