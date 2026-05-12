const Banner = require('../models/Banner');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(b) {
  if (!b) return null;
  const obj = b.toJSON ? b.toJSON() : b;
  return {
    id: obj.slug,
    title: obj.title,
    subtitle: obj.subtitle || '',
    cta: obj.cta || '',
    ctaLink: obj.ctaLink || '',
    bg: obj.bg || '',
    image: obj.image || '',
    order: obj.order || 0,
    active: obj.active !== false,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'banner-' + randomId();
  let i = 1;
  while (await Banner.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'banner-' + randomId(); break; }
  }
  return slug;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = req.query.active === 'true' ? { active: true } : {};
  const banners = await Banner.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(banners.map(shape));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.title) return res.status(400).json({ message: 'Title is required' });
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.title);
  const banner = await Banner.create({
    slug,
    title: body.title,
    subtitle: body.subtitle || '',
    cta: body.cta || '',
    ctaLink: body.ctaLink || '',
    bg: body.bg || '',
    image: body.image || '',
    order: Number(body.order) || 0,
    active: body.active !== false,
  });
  res.status(201).json(shape(banner));
});

exports.update = asyncHandler(async (req, res) => {
  const banner = await Banner.findOne({ slug: req.params.id });
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  const body = req.body || {};
  const fields = ['title', 'subtitle', 'cta', 'ctaLink', 'bg', 'image', 'active'];
  for (const f of fields) if (body[f] !== undefined) banner[f] = body[f];
  if (body.order !== undefined) banner.order = Number(body.order) || 0;
  await banner.save();
  res.json(shape(banner));
});

exports.remove = asyncHandler(async (req, res) => {
  const banner = await Banner.findOneAndDelete({ slug: req.params.id });
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  res.json({ message: 'Banner deleted', id: req.params.id });
});
