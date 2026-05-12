const express = require('express');
const c = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.getById);
router.put('/:id', c.update);
router.patch('/:id/password', c.changePassword);
router.delete('/:id', c.remove);

module.exports = router;
