const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

function shape(u, extras = {}) {
  if (!u) return null;
  const obj = u.toJSON ? u.toJSON() : u;
  return {
    id: obj._id?.toString?.() || obj.id,
    email: obj.email,
    name: obj.name || '',
    phone: obj.phone || '',
    address: obj.address || '',
    createdAt: obj.createdAt,
    cartCount: Array.isArray(obj.cart) ? obj.cart.reduce((s, i) => s + i.quantity, 0) : 0,
    ...extras,
  };
}

exports.list = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q
    ? {
        $or: [
          { email: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
        ],
      }
    : {};
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(500);

  // aggregate order stats per user
  const ids = users.map((u) => u._id);
  const agg = await Order.aggregate([
    { $match: { userId: { $in: ids } } },
    {
      $group: {
        _id: '$userId',
        orderCount: { $sum: 1 },
        totalSpent: {
          $sum: {
            $cond: [{ $ne: ['$status', 'Cancelled'] }, '$price', 0],
          },
        },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);
  const stats = new Map(agg.map((a) => [a._id.toString(), a]));

  res.json(
    users.map((u) => {
      const s = stats.get(u._id.toString()) || {};
      return shape(u, {
        orderCount: s.orderCount || 0,
        totalSpent: s.totalSpent || 0,
        lastOrderAt: s.lastOrderAt || null,
      });
    })
  );
});

exports.getById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({
    user: shape(user),
    orders: orders.map((o) => ({
      id: o.orderId,
      productName: o.productName,
      storeName: o.storeName,
      type: o.type,
      quantity: o.quantity,
      price: o.price,
      status: o.status,
      date: o.date,
      createdAt: o.createdAt,
    })),
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted', id: req.params.id });
});
