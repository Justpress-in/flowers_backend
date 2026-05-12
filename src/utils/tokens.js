const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

function signAccessToken(admin) {
  return jwt.sign(
    { sub: admin._id.toString(), email: admin.email, role: admin.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '40m' }
  );
}

function parseDuration(str) {
  const match = /^(\d+)([smhd])$/.exec(str || '7d');
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const [, n, unit] = match;
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return Number(n) * mult;
}

async function issueRefreshToken(admin) {
  const token = crypto.randomBytes(48).toString('hex');
  const ttl = parseDuration(process.env.JWT_REFRESH_EXPIRES || '7d');
  const expiresAt = new Date(Date.now() + ttl);
  await RefreshToken.create({ token, adminId: admin._id, expiresAt });
  return { token, expiresAt };
}

async function rotateRefreshToken(oldToken) {
  const record = await RefreshToken.findOne({ token: oldToken });
  if (!record || record.revoked || record.expiresAt < new Date()) return null;
  record.revoked = true;
  await record.save();
  return record.adminId;
}

async function revokeRefreshToken(token) {
  if (!token) return;
  await RefreshToken.updateOne({ token }, { $set: { revoked: true } });
}

module.exports = {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  parseDuration,
};
