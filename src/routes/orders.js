const express = require('express');
const c = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, c.list);
router.get('/:id', c.getById);
router.post('/', c.create);
router.patch('/:id/status', protect, c.updateStatus);
router.delete('/:id', protect, c.remove);

module.exports = router;
