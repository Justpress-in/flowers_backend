const Testimonial = require('../models/Testimonial');
const asyncHandler = require('../utils/asyncHandler');

function shape(t) {
  if (!t) return null;
  const obj = t.toJSON ? t.toJSON() : t;
  return {
    id: obj._id?.toString?.() || obj.id,
    customerName: obj.customerName,
    location: obj.location || '',
    avatar: obj.avatar || '',
    rating: obj.rating,
    quote: obj.quote,
    occasion: obj.occasion || '',
    productId: obj.productId || '',
    featured: !!obj.featured,
    active: obj.active !== false,
    order: obj.order || 0,
    createdAt: obj.createdAt,
  };
}

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.active === 'true') filter.active = true;
  if (req.query.featured === 'true') filter.featured = true;
  const items = await Testimonial.find(filter).sort({ order: 1, createdAt: -1 });
  res.json(items.map(shape));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.customerName || !body.quote) {
    return res.status(400).json({ message: 'customerName and quote are required' });
  }
  const t = await Testimonial.create({
    customerName: body.customerName,
    location: body.location || '',
    avatar: body.avatar || '',
    rating: Math.max(1, Math.min(5, Number(body.rating) || 5)),
    quote: body.quote,
    occasion: body.occasion || '',
    productId: body.productId || '',
    featured: !!body.featured,
    active: body.active !== false,
    order: Number(body.order) || 0,
  });
  res.status(201).json(shape(t));
});

exports.update = asyncHandler(async (req, res) => {
  const t = await Testimonial.findById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Testimonial not found' });
  const body = req.body || {};
  const fields = ['customerName', 'location', 'avatar', 'quote', 'occasion', 'productId', 'featured', 'active'];
  for (const f of fields) if (body[f] !== undefined) t[f] = body[f];
  if (body.rating !== undefined) t.rating = Math.max(1, Math.min(5, Number(body.rating)));
  if (body.order !== undefined) t.order = Number(body.order) || 0;
  await t.save();
  res.json(shape(t));
});

exports.remove = asyncHandler(async (req, res) => {
  const t = await Testimonial.findByIdAndDelete(req.params.id);
  if (!t) return res.status(404).json({ message: 'Testimonial not found' });
  res.json({ message: 'Testimonial deleted', id: req.params.id });
});
