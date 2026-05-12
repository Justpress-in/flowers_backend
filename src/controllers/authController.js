const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  parseDuration,
} = require('../utils/tokens');
const jwt = require('jsonwebtoken');

function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: parseDuration(process.env.JWT_REFRESH_EXPIRES || '7d'),
  };
}

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const accessToken = signAccessToken(admin);
  const { token: refreshToken } = await issueRefreshToken(admin);

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  res.json({
    accessToken,
    refreshToken,
    admin: admin.toJSON(),
  });
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  const adminId = await rotateRefreshToken(token);
  if (!adminId) return res.status(401).json({ message: 'Invalid or expired refresh token' });

  const admin = await Admin.findById(adminId);
  if (!admin) return res.status(401).json({ message: 'Admin not found' });

  const accessToken = signAccessToken(admin);
  const { token: newRefresh } = await issueRefreshToken(admin);
  res.cookie('refreshToken', newRefresh, refreshCookieOptions());
  res.json({ accessToken, refreshToken: newRefresh });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  await revokeRefreshToken(token);
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.sub);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  res.json({ admin: admin.toJSON() });
});
