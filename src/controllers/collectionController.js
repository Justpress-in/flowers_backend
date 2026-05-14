const Collection = require('../models/Collection');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(c) {
  if (!c) return null;
  const obj = c.toJSON ? c.toJSON() : c;
  return {
    id: obj.slug,
    name: obj.name,
    description: obj.description || '',
    image: obj.image || '',
    kind: obj.kind,
    productIds: obj.productIds || [],
    order: obj.order || 0,
    active: obj.active !== false,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'collection-' + randomId();
  let i = 1;
  while (await Collection.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'collection-' + randomId(); break; }
  }
  return slug;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.kind) filter.kind = req.query.kind;
  if (req.query.active === 'true') filter.active = true;
  const items = await Collection.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(items.map(shape));
});

exports.getById = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ slug: req.params.id });
  if (!collection) return res.status(404).json({ message: 'Collection not found' });
  // Hydrate products so a /collection/:slug page can render directly.
  const products = await Product.find({ slug: { $in: collection.productIds } });
  const productMap = new Map(products.map((p) => [p.slug, p]));
  // Preserve admin-chosen ordering.
  const orderedProducts = collection.productIds
    .map((id) => productMap.get(id))
    .filter(Boolean)
    .map((p) => {
      const o = p.toJSON();
      return {
        id: o.slug,
        name: o.name,
        category: o.category,
        type: o.type,
        description: o.description,
        image: o.image,
        images: o.images || [],
        tags: o.tags || [],
        availableColors: o.availableColors || [],
        storeInventory: o.storeInventory || [],
      };
    });
  res.json({ ...shape(collection), products: orderedProducts });
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ message: 'Name is required' });
  if (!body.kind || !['showstopper', 'pair'].includes(body.kind)) {
    return res.status(400).json({ message: 'kind must be "showstopper" or "pair"' });
  }
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.name);
  const collection = await Collection.create({
    slug,
    name: body.name,
    description: body.description || '',
    image: body.image || '',
    kind: body.kind,
    productIds: Array.isArray(body.productIds) ? body.productIds : [],
    order: Number(body.order) || 0,
    active: body.active !== false,
  });
  res.status(201).json(shape(collection));
});

exports.update = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ slug: req.params.id });
  if (!collection) return res.status(404).json({ message: 'Collection not found' });
  const body = req.body || {};
  if (body.name !== undefined) collection.name = body.name;
  if (body.description !== undefined) collection.description = body.description;
  if (body.image !== undefined) collection.image = body.image;
  if (body.kind !== undefined && ['showstopper', 'pair'].includes(body.kind)) collection.kind = body.kind;
  if (Array.isArray(body.productIds)) collection.productIds = body.productIds;
  if (body.order !== undefined) collection.order = Number(body.order) || 0;
  if (body.active !== undefined) collection.active = !!body.active;
  await collection.save();
  res.json(shape(collection));
});

exports.remove = asyncHandler(async (req, res) => {
  const collection = await Collection.findOneAndDelete({ slug: req.params.id });
  if (!collection) return res.status(404).json({ message: 'Collection not found' });
  res.json({ message: 'Collection deleted', id: req.params.id });
});
