const express = require('express');
const c = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');

const router = express.Router();

router.get('/', protect, c.listAll);
router.get('/mine', protectUser, c.listMine);
router.get('/:id', c.getById);
router.post('/checkout', protectUser, c.checkout);
router.patch('/:id/status', protect, c.updateStatus);
router.delete('/:id', protect, c.remove);

module.exports = router;
