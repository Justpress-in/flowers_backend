const express = require('express');
const c = require('../controllers/collectionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', protect, c.create);
router.put('/:id', protect, c.update);
router.delete('/:id', protect, c.remove);

module.exports = router;
