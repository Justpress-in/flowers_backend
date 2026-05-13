const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Store = require('../models/Store');
const asyncHandler = require('../utils/asyncHandler');

function shape(c) {
  if (!c) return null;
  const obj = c.toJSON ? c.toJSON() : c;
  return {
    id: obj._id?.toString?.() || obj.id,
    code: obj.code,
    description: obj.description || '',
    type: obj.type,
    value: obj.value,
    minOrder: obj.minOrder || 0,
    maxDiscount: obj.maxDiscount || 0,
    usageLimit: obj.usageLimit || 0,
    perUserLimit: obj.perUserLimit || 0,
    usedCount: obj.usedCount || 0,
    startsAt: obj.startsAt,
    expiresAt: obj.expiresAt,
    active: obj.active !== false,
    createdAt: obj.createdAt,
  };
}

exports.list = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons.map(shape));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.code || !body.type || body.value === undefined) {
    return res.status(400).json({ message: 'code, type and value are required' });
  }
  if (!['percent', 'flat'].includes(body.type)) {
    return res.status(400).json({ message: 'type must be percent or flat' });
  }
  if (body.type === 'percent' && (body.value <= 0 || body.value > 100)) {
    return res.status(400).json({ message: 'Percent value must be between 1 and 100' });
  }
  const exists = await Coupon.findOne({ code: body.code.toUpperCase() });
  if (exists) return res.status(409).json({ message: 'Coupon code already exists' });

  const coupon = await Coupon.create({
    code: body.code.toUpperCase(),
    description: body.description || '',
    type: body.type,
    value: Number(body.value),
    minOrder: Number(body.minOrder) || 0,
    maxDiscount: Number(body.maxDiscount) || 0,
    usageLimit: Number(body.usageLimit) || 0,
    perUserLimit: Number(body.perUserLimit) || 0,
    startsAt: body.startsAt || null,
    expiresAt: body.expiresAt || null,
    active: body.active !== false,
  });
  res.status(201).json(shape(coupon));
});

exports.update = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  const body = req.body || {};
  const fields = [
    'description', 'type', 'value', 'minOrder', 'maxDiscount',
    'usageLimit', 'perUserLimit', 'startsAt', 'expiresAt', 'active',
  ];
  for (const f of fields) if (body[f] !== undefined) coupon[f] = body[f];
  if (body.code && body.code.toUpperCase() !== coupon.code) {
    const exists = await Coupon.findOne({ code: body.code.toUpperCase(), _id: { $ne: coupon._id } });
    if (exists) return res.status(409).json({ message: 'Coupon code already exists' });
    coupon.code = body.code.toUpperCase();
  }
  await coupon.save();
  res.json(shape(coupon));
});

exports.remove = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  res.json({ message: 'Coupon deleted', id: req.params.id });
});

// Compute subtotal from user's cart so redeem can validate without trusting client
async function userCartSubtotal(userId) {
  const user = await User.findById(userId);
  if (!user || !user.cart || user.cart.length === 0) return { subtotal: 0, cart: [] };
  const productIds = [...new Set(user.cart.map((i) => i.productId))];
  const products = await Product.find({ slug: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p.slug, p]));
  let subtotal = 0;
  for (const item of user.cart) {
    const product = productMap.get(item.productId);
    const inv = product?.storeInventory.find((s) => s.storeId === item.storeId);
    if (inv) subtotal += inv.price * item.quantity;
  }
  return { subtotal, cart: user.cart };
}

exports.validateForUser = async function (userId, code) {
  if (!code) return { ok: true, coupon: null, discount: 0 };
  const upper = String(code).toUpperCase();
  const coupon = await Coupon.findOne({ code: upper });
  if (!coupon || !coupon.active) {
    return { ok: false, message: 'Invalid coupon code' };
  }
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, message: 'This coupon is not active yet' };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, message: 'This coupon has expired' };
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: 'This coupon has reached its usage limit' };
  }
  if (coupon.perUserLimit > 0) {
    const usedByUser = await Order.countDocuments({ userId, couponCode: coupon.code });
    if (usedByUser >= coupon.perUserLimit) {
      return { ok: false, message: 'You have already used this coupon' };
    }
  }
  const { subtotal } = await userCartSubtotal(userId);
  if (subtotal === 0) {
    return { ok: false, message: 'Your cart is empty' };
  }
  if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
    return { ok: false, message: `Minimum order of $${coupon.minOrder} required` };
  }
  const discount = coupon.calcDiscount(subtotal);
  return { ok: true, coupon, discount, subtotal };
};

exports.redeem = asyncHandler(async (req, res) => {
  const code = req.body?.code;
  if (!code) return res.status(400).json({ message: 'Coupon code is required' });
  const result = await exports.validateForUser(req.user.sub, code);
  if (!result.ok) return res.status(400).json({ message: result.message });
  res.json({
    code: result.coupon.code,
    description: result.coupon.description || '',
    type: result.coupon.type,
    value: result.coupon.value,
    discount: result.discount,
    subtotal: result.subtotal,
    total: Math.max(0, result.subtotal - result.discount),
  });
});

// Public — list active, non-expired coupons (used to show "available offers" on the cart page)
exports.listPublic = asyncHandler(async (_req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    active: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
    ],
  })
    .sort({ value: -1 })
    .limit(20);
  res.json(
    coupons.map((c) => ({
      code: c.code,
      description: c.description || '',
      type: c.type,
      value: c.value,
      minOrder: c.minOrder || 0,
      maxDiscount: c.maxDiscount || 0,
      expiresAt: c.expiresAt,
    }))
  );
});
