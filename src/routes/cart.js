const express = require('express');
const c = require('../controllers/cartController');
const { protectUser } = require('../middleware/userAuth');

const router = express.Router();
router.use(protectUser);

router.get('/', c.get);
router.post('/items', c.addItem);
router.patch('/items/:itemId', c.updateItem);
router.delete('/items/:itemId', c.removeItem);
router.delete('/', c.clear);
router.post('/merge', c.merge);

module.exports = router;
