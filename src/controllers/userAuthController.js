const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { parseDuration } = require('../utils/tokens');
const {
  signUserAccessToken,
  issueUserRefreshToken,
  rotateUserRefreshToken,
  revokeUserRefreshToken,
} = require('../utils/userTokens');

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

function shape(u) {
  if (!u) return null;
  const obj = u.toJSON ? u.toJSON() : u;
  return {
    id: obj._id?.toString?.() || obj.id,
    email: obj.email,
    name: obj.name || '',
    phone: obj.phone || '',
    address: obj.address || '',
  };
}

exports.register = asyncHandler(async (req, res) => {
  const { email, password, name, phone } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: 'An account with that email already exists' });

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    name: name || '',
    phone: phone || '',
  });

  const accessToken = signUserAccessToken(user);
  const { token: refreshToken } = await issueUserRefreshToken(user);
  res.cookie('userRefreshToken', refreshToken, refreshCookieOptions());
  res.status(201).json({ accessToken, refreshToken, user: shape(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const accessToken = signUserAccessToken(user);
  const { token: refreshToken } = await issueUserRefreshToken(user);
  res.cookie('userRefreshToken', refreshToken, refreshCookieOptions());
  res.json({ accessToken, refreshToken, user: shape(user) });
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.userRefreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  const userId = await rotateUserRefreshToken(token);
  if (!userId) return res.status(401).json({ message: 'Invalid or expired refresh token' });
  const user = await User.findById(userId);
  if (!user) return res.status(401).json({ message: 'User not found' });
  const accessToken = signUserAccessToken(user);
  const { token: newRefresh } = await issueUserRefreshToken(user);
  res.cookie('userRefreshToken', newRefresh, refreshCookieOptions());
  res.json({ accessToken, refreshToken: newRefresh });
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.userRefreshToken || req.body?.refreshToken;
  await revokeUserRefreshToken(token);
  res.clearCookie('userRefreshToken', { path: '/' });
  res.json({ message: 'Logged out' });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: shape(user) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, phone, address } = req.body || {};
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  await user.save();
  res.json({ user: shape(user) });
});
