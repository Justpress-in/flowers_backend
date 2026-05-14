const HomeColour = require('../models/HomeColour');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(c) {
  if (!c) return null;
  const obj = c.toJSON ? c.toJSON() : c;
  return {
    id: obj.slug,
    name: obj.name,
    image: obj.image || '',
    swatch: obj.swatch || '',
    order: obj.order || 0,
    active: obj.active !== false,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'colour-' + randomId();
  let i = 1;
  while (await HomeColour.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'colour-' + randomId(); break; }
  }
  return slug;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = req.query.active === 'true' ? { active: true } : {};
  const items = await HomeColour.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(items.map(shape));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ message: 'Name is required' });
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.name);
  const colour = await HomeColour.create({
    slug,
    name: body.name,
    image: body.image || '',
    swatch: body.swatch || '',
    order: Number(body.order) || 0,
    active: body.active !== false,
  });
  res.status(201).json(shape(colour));
});

exports.update = asyncHandler(async (req, res) => {
  const colour = await HomeColour.findOne({ slug: req.params.id });
  if (!colour) return res.status(404).json({ message: 'Colour not found' });
  const body = req.body || {};
  if (body.name !== undefined) colour.name = body.name;
  if (body.image !== undefined) colour.image = body.image;
  if (body.swatch !== undefined) colour.swatch = body.swatch;
  if (body.order !== undefined) colour.order = Number(body.order) || 0;
  if (body.active !== undefined) colour.active = !!body.active;
  await colour.save();
  res.json(shape(colour));
});

exports.remove = asyncHandler(async (req, res) => {
  const colour = await HomeColour.findOneAndDelete({ slug: req.params.id });
  if (!colour) return res.status(404).json({ message: 'Colour not found' });
  res.json({ message: 'Colour deleted', id: req.params.id });
});
