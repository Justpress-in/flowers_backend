const express = require('express');
const rateLimit = require('express-rate-limit');
const c = require('../controllers/userAuthController');
const { protectUser } = require('../middleware/userAuth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post('/register', authLimiter, c.register);
router.post('/login', authLimiter, c.login);
router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.get('/me', protectUser, c.me);
router.patch('/me', protectUser, c.updateProfile);

module.exports = router;
