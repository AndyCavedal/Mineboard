const express = require('express');
const router = express.Router();
const controller = require('../controllers/friends');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, controller.getAll);
router.post('/', requireAuth, controller.create);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;
