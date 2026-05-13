const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

function shape(r) {
  if (!r) return null;
  const obj = r.toJSON ? r.toJSON() : r;
  return {
    id: obj._id?.toString?.() || obj.id,
    productId: obj.productId,
    userId: obj.userId?.toString?.() || obj.userId,
    userName: obj.userName || '',
    rating: obj.rating,
    title: obj.title || '',
    body: obj.body,
    images: obj.images || [],
    status: obj.status,
    helpfulCount: obj.helpfulCount || 0,
    createdAt: obj.createdAt,
  };
}

// Public — approved reviews for a product, with aggregate
exports.listForProduct = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const product = await Product.findOne({ slug: productId });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const reviews = await Review.find({ productId, status: 'approved' }).sort({ createdAt: -1 });
  const ratings = reviews.map((r) => r.rating);
  const average = ratings.length ? ratings.reduce((s, n) => s + n, 0) / ratings.length : 0;
  const distribution = [1, 2, 3, 4, 5].reduce((acc, n) => {
    acc[n] = ratings.filter((r) => r === n).length;
    return acc;
  }, {});
  res.json({
    productId,
    count: reviews.length,
    average: Math.round(average * 10) / 10,
    distribution,
    reviews: reviews.map(shape),
  });
});

// User — create or update their own review
exports.upsertMine = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const body = req.body || {};
  if (!body.productId || !body.rating || !body.body) {
    return res.status(400).json({ message: 'productId, rating and body are required' });
  }
  const rating = Math.max(1, Math.min(5, Number(body.rating)));
  const product = await Product.findOne({ slug: body.productId });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Only allow reviews if they've ordered the product
  const hasOrdered = await Order.exists({
    userId,
    productId: body.productId,
    status: { $in: ['Confirmed', 'Processing', 'Shipped', 'Delivered'] },
  });

  const existing = await Review.findOne({ productId: body.productId, userId });
  if (existing) {
    existing.rating = rating;
    existing.title = body.title || '';
    existing.body = body.body;
    existing.images = body.images || [];
    existing.userName = user.name || user.email.split('@')[0];
    await existing.save();
    return res.json(shape(existing));
  }
  if (!hasOrdered) {
    return res.status(403).json({ message: 'You can only review products you have ordered' });
  }
  const created = await Review.create({
    productId: body.productId,
    userId,
    userName: user.name || user.email.split('@')[0],
    rating,
    title: body.title || '',
    body: body.body,
    images: body.images || [],
    status: 'approved',
  });
  res.status(201).json(shape(created));
});

// User — delete own
exports.deleteMine = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, userId: req.user.sub });
  if (!review) return res.status(404).json({ message: 'Review not found' });
  await review.deleteOne();
  res.json({ message: 'Review deleted', id: req.params.id });
});

// User — list their own reviews
exports.listMine = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ userId: req.user.sub }).sort({ createdAt: -1 });
  res.json(reviews.map(shape));
});

// Admin — list all (filter by status)
exports.listAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.productId) filter.productId = req.query.productId;
  const reviews = await Review.find(filter).sort({ createdAt: -1 });
  res.json(reviews.map(shape));
});

// Admin — update status / delete
exports.updateStatus = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  const { status } = req.body || {};
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  review.status = status;
  await review.save();
  res.json(shape(review));
});

exports.adminDelete = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  res.json({ message: 'Review deleted', id: req.params.id });
});
