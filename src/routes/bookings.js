const express = require('express');
const c = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { protectUser } = require('../middleware/userAuth');
const jwt = require('jsonwebtoken');

// Optional user auth — attaches req.user if present, but doesn't block guests
function optionalUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (!decoded.kind || decoded.kind === 'user') req.user = decoded;
    } catch {}
  }
  next();
}

const router = express.Router();

router.post('/', optionalUser, c.create);
router.get('/mine', protectUser, c.listMine);

router.get('/', protect, c.list);
router.put('/:id', protect, c.update);
router.delete('/:id', protect, c.remove);

module.exports = router;
