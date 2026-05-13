const Offer = require('../models/Offer');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(o) {
  if (!o) return null;
  const obj = o.toJSON ? o.toJSON() : o;
  return {
    id: obj.slug,
    title: obj.title,
    subtitle: obj.subtitle || '',
    image: obj.image || '',
    badge: obj.badge || '',
    link: obj.link || '',
    couponCode: obj.couponCode || '',
    startsAt: obj.startsAt,
    endsAt: obj.endsAt,
    active: obj.active !== false,
    order: obj.order || 0,
    createdAt: obj.createdAt,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'offer-' + randomId();
  let i = 1;
  while (await Offer.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'offer-' + randomId(); break; }
  }
  return slug;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.active === 'true') {
    const now = new Date();
    filter.active = true;
    filter.$and = [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ];
  }
  const offers = await Offer.find(filter).sort({ order: 1, createdAt: -1 });
  res.json(offers.map(shape));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.title) return res.status(400).json({ message: 'Title is required' });
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.title);
  const offer = await Offer.create({
    slug,
    title: body.title,
    subtitle: body.subtitle || '',
    image: body.image || '',
    badge: body.badge || '',
    link: body.link || '',
    couponCode: (body.couponCode || '').toUpperCase(),
    startsAt: body.startsAt || null,
    endsAt: body.endsAt || null,
    active: body.active !== false,
    order: Number(body.order) || 0,
  });
  res.status(201).json(shape(offer));
});

exports.update = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ slug: req.params.id });
  if (!offer) return res.status(404).json({ message: 'Offer not found' });
  const body = req.body || {};
  const fields = ['title', 'subtitle', 'image', 'badge', 'link', 'startsAt', 'endsAt', 'active'];
  for (const f of fields) if (body[f] !== undefined) offer[f] = body[f];
  if (body.couponCode !== undefined) offer.couponCode = (body.couponCode || '').toUpperCase();
  if (body.order !== undefined) offer.order = Number(body.order) || 0;
  await offer.save();
  res.json(shape(offer));
});

exports.remove = asyncHandler(async (req, res) => {
  const offer = await Offer.findOneAndDelete({ slug: req.params.id });
  if (!offer) return res.status(404).json({ message: 'Offer not found' });
  res.json({ message: 'Offer deleted', id: req.params.id });
});
