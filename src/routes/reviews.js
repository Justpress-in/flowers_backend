const express = require('express');
const c = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');

const router = express.Router();

// Public
router.get('/product/:productId', c.listForProduct);

// User
router.post('/', protectUser, c.upsertMine);
router.get('/mine', protectUser, c.listMine);
router.delete('/mine/:id', protectUser, c.deleteMine);

// Admin
router.get('/', protect, c.listAll);
router.patch('/:id/status', protect, c.updateStatus);
router.delete('/:id', protect, c.adminDelete);

module.exports = router;
