const Admin = require('../models/Admin');
const RefreshToken = require('../models/RefreshToken');
const asyncHandler = require('../utils/asyncHandler');

function shape(a) {
  if (!a) return null;
  const obj = a.toJSON ? a.toJSON() : a;
  return {
    id: obj._id?.toString?.() || obj.id,
    email: obj.email,
    name: obj.name,
    role: obj.role,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

exports.list = asyncHandler(async (_req, res) => {
  const admins = await Admin.find().sort({ createdAt: 1 });
  res.json(admins.map(shape));
});

exports.getById = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  res.json(shape(admin));
});

exports.create = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const exists = await Admin.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: 'An admin with that email already exists' });

  const admin = await Admin.create({
    email: email.toLowerCase(),
    password,
    name: name || 'Admin',
    role: role === 'superadmin' ? 'superadmin' : 'admin',
  });
  res.status(201).json(shape(admin));
});

exports.update = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  const { name, email, role } = req.body || {};
  if (name !== undefined) admin.name = name;
  if (email !== undefined && email !== admin.email) {
    const exists = await Admin.findOne({ email: email.toLowerCase(), _id: { $ne: admin._id } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    admin.email = email.toLowerCase();
  }
  if (role !== undefined) admin.role = role === 'superadmin' ? 'superadmin' : 'admin';
  await admin.save();
  res.json(shape(admin));
});

exports.changePassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  const { password, currentPassword } = req.body || {};
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  const isSelf = req.admin?.sub === admin._id.toString();
  if (isSelf) {
    if (!currentPassword) return res.status(400).json({ message: 'currentPassword is required' });
    const ok = await admin.matchPassword(currentPassword);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
  }
  admin.password = password;
  await admin.save();
  await RefreshToken.updateMany({ adminId: admin._id }, { $set: { revoked: true } });
  res.json({ message: 'Password changed' });
});

exports.remove = asyncHandler(async (req, res) => {
  if (req.admin?.sub === req.params.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const count = await Admin.countDocuments();
  if (count <= 1) {
    return res.status(400).json({ message: 'At least one admin must remain' });
  }
  const admin = await Admin.findByIdAndDelete(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  await RefreshToken.deleteMany({ adminId: admin._id });
  res.json({ message: 'Admin deleted', id: req.params.id });
});
