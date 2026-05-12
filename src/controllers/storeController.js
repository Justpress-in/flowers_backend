const Store = require('../models/Store');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(s) {
  if (!s) return null;
  const obj = s.toJSON ? s.toJSON() : s;
  return {
    id: obj.slug,
    name: obj.name,
    location: obj.location,
    phone: obj.phone || '',
    email: obj.email || '',
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'store-' + randomId();
  let i = 1;
  while (await Store.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'store-' + randomId(); break; }
  }
  return slug;
}

exports.list = asyncHandler(async (_req, res) => {
  const stores = await Store.find().sort({ createdAt: 1 });
  res.json(stores.map(shape));
});

exports.getById = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ slug: req.params.id });
  if (!store) return res.status(404).json({ message: 'Store not found' });
  res.json(shape(store));
});

exports.create = asyncHandler(async (req, res) => {
  const { name, location, phone, email, id } = req.body || {};
  if (!name || !location) {
    return res.status(400).json({ message: 'Name and location are required' });
  }
  const slug = id ? slugify(id) : await uniqueSlug(name);
  const store = await Store.create({ slug, name, location, phone: phone || '', email: email || '' });
  res.status(201).json(shape(store));
});

exports.update = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ slug: req.params.id });
  if (!store) return res.status(404).json({ message: 'Store not found' });
  const { name, location, phone, email } = req.body || {};
  if (name !== undefined) store.name = name;
  if (location !== undefined) store.location = location;
  if (phone !== undefined) store.phone = phone;
  if (email !== undefined) store.email = email;
  await store.save();
  res.json(shape(store));
});

exports.remove = asyncHandler(async (req, res) => {
  const store = await Store.findOneAndDelete({ slug: req.params.id });
  if (!store) return res.status(404).json({ message: 'Store not found' });
  res.json({ message: 'Store deleted', id: req.params.id });
});
