const jwt = require('jsonwebtoken');

function protectUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authorized — no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.kind && decoded.kind !== 'user') {
      return res.status(401).json({ message: 'Not authorized — wrong token kind' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized — invalid token' });
  }
}

module.exports = { protectUser };
