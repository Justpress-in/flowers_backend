const express = require('express');
const c = require('../controllers/cityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', c.list);
router.post('/', protect, c.create);
router.put('/:id', protect, c.update);
router.delete('/:id', protect, c.remove);

module.exports = router;
