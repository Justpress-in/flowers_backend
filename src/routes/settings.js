const express = require('express');
const c = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', c.get);
router.put('/', protect, c.update);

module.exports = router;
