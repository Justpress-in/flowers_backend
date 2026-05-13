const Package = require('../models/Package');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(p) {
  if (!p) return null;
  const obj = p.toJSON ? p.toJSON() : p;
  return {
    id: obj.slug,
    name: obj.name,
    eventType: obj.eventType,
    description: obj.description || '',
    image: obj.image || '',
    gallery: obj.gallery || [],
    inclusions: obj.inclusions || [],
    price: obj.price,
    duration: obj.duration || '',
    capacity: obj.capacity || '',
    tags: obj.tags || [],
    featured: !!obj.featured,
    active: obj.active !== false,
    order: obj.order || 0,
    createdAt: obj.createdAt,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'pkg-' + randomId();
  let i = 1;
  while (await Package.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'pkg-' + randomId(); break; }
  }
  return slug;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.eventType) filter.eventType = req.query.eventType;
  if (req.query.active === 'true') filter.active = true;
  const packages = await Package.find(filter).sort({ order: 1, createdAt: -1 });
  res.json(packages.map(shape));
});

exports.getById = asyncHandler(async (req, res) => {
  const pkg = await Package.findOne({ slug: req.params.id });
  if (!pkg) return res.status(404).json({ message: 'Package not found' });
  res.json(shape(pkg));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name || body.price === undefined) {
    return res.status(400).json({ message: 'Name and price are required' });
  }
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.name);
  const pkg = await Package.create({
    slug,
    name: body.name,
    eventType: body.eventType || 'wedding',
    description: body.description || '',
    image: body.image || '',
    gallery: body.gallery || [],
    inclusions: body.inclusions || [],
    price: Number(body.price),
    duration: body.duration || '',
    capacity: body.capacity || '',
    tags: body.tags || [],
    featured: !!body.featured,
    active: body.active !== false,
    order: Number(body.order) || 0,
  });
  res.status(201).json(shape(pkg));
});

exports.update = asyncHandler(async (req, res) => {
  const pkg = await Package.findOne({ slug: req.params.id });
  if (!pkg) return res.status(404).json({ message: 'Package not found' });
  const body = req.body || {};
  const fields = ['name', 'eventType', 'description', 'image', 'gallery', 'inclusions',
    'duration', 'capacity', 'tags', 'featured', 'active'];
  for (const f of fields) if (body[f] !== undefined) pkg[f] = body[f];
  if (body.price !== undefined) pkg.price = Number(body.price);
  if (body.order !== undefined) pkg.order = Number(body.order) || 0;
  await pkg.save();
  res.json(shape(pkg));
});

exports.remove = asyncHandler(async (req, res) => {
  const pkg = await Package.findOneAndDelete({ slug: req.params.id });
  if (!pkg) return res.status(404).json({ message: 'Package not found' });
  res.json({ message: 'Package deleted', id: req.params.id });
});
