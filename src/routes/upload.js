const express = require('express');
const { upload } = require('../config/cloudinary');
const c = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, upload.single('image'), c.single);
router.post('/multiple', protect, upload.array('images', 10), c.multiple);
router.delete('/', protect, c.destroy);

module.exports = router;
