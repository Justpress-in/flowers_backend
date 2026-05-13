const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserRefreshToken = require('../models/UserRefreshToken');
const { parseDuration } = require('./tokens');

function signUserAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, kind: 'user' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '40m' }
  );
}

async function issueUserRefreshToken(user) {
  const token = crypto.randomBytes(48).toString('hex');
  const ttl = parseDuration(process.env.JWT_REFRESH_EXPIRES || '7d');
  const expiresAt = new Date(Date.now() + ttl);
  await UserRefreshToken.create({ token, userId: user._id, expiresAt });
  return { token, expiresAt };
}

async function rotateUserRefreshToken(oldToken) {
  const record = await UserRefreshToken.findOne({ token: oldToken });
  if (!record || record.revoked || record.expiresAt < new Date()) return null;
  record.revoked = true;
  await record.save();
  return record.userId;
}

async function revokeUserRefreshToken(token) {
  if (!token) return;
  await UserRefreshToken.updateOne({ token }, { $set: { revoked: true } });
}

module.exports = {
  signUserAccessToken,
  issueUserRefreshToken,
  rotateUserRefreshToken,
  revokeUserRefreshToken,
};
