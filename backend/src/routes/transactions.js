const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactions');
const { requireAuth, requireOwner } = require('../middleware/auth');

router.get('/', requireAuth, controller.getAll);
router.post('/', requireAuth, requireOwner, controller.create);
router.put('/:id', requireAuth, requireOwner, controller.update);
router.delete('/:id', requireAuth, requireOwner, controller.remove);

module.exports = router;
