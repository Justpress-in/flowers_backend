const City = require('../models/City');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(c) {
  if (!c) return null;
  const obj = c.toJSON ? c.toJSON() : c;
  return {
    id: obj.slug,
    name: obj.name,
    icon: obj.icon || '',
    order: obj.order || 0,
    active: obj.active !== false,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'city-' + randomId();
  let i = 1;
  while (await City.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'city-' + randomId(); break; }
  }
  return slug;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = req.query.active === 'true' ? { active: true } : {};
  const items = await City.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(items.map(shape));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ message: 'Name is required' });
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.name);
  const city = await City.create({
    slug,
    name: body.name,
    icon: body.icon || '',
    order: Number(body.order) || 0,
    active: body.active !== false,
  });
  res.status(201).json(shape(city));
});

exports.update = asyncHandler(async (req, res) => {
  const city = await City.findOne({ slug: req.params.id });
  if (!city) return res.status(404).json({ message: 'City not found' });
  const body = req.body || {};
  if (body.name !== undefined) city.name = body.name;
  if (body.icon !== undefined) city.icon = body.icon;
  if (body.order !== undefined) city.order = Number(body.order) || 0;
  if (body.active !== undefined) city.active = !!body.active;
  await city.save();
  res.json(shape(city));
});

exports.remove = asyncHandler(async (req, res) => {
  const city = await City.findOneAndDelete({ slug: req.params.id });
  if (!city) return res.status(404).json({ message: 'City not found' });
  res.json({ message: 'City deleted', id: req.params.id });
});
