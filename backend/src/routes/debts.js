const express = require('express');
const router = express.Router();
const controller = require('../controllers/debts');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, controller.getAll);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;
