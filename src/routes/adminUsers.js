const express = require('express');
const c = require('../controllers/adminUserController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', c.list);
router.get('/:id', c.getById);
router.delete('/:id', c.remove);

module.exports = router;
