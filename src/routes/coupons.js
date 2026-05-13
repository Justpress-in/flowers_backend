const express = require('express');
const c = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');

const router = express.Router();

router.get('/public', c.listPublic);
router.post('/redeem', protectUser, c.redeem);

router.use(protect);
router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
