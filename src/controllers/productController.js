const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(p) {
  if (!p) return null;
  const obj = p.toJSON ? p.toJSON() : p;
  return {
    id: obj.slug,
    name: obj.name,
    category: obj.category,
    type: obj.type,
    description: obj.description,
    image: obj.image,
    images: obj.images || [],
    sizes: obj.sizes || [],
    tags: obj.tags || [],
    availableColors: obj.availableColors || [],
    allowCustomDescription: !!obj.allowCustomDescription,
    storeInventory: obj.storeInventory || [],
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'product-' + randomId();
  let counter = 1;
  while (await Product.exists({ slug })) {
    slug = `${slugify(base)}-${counter++}`;
    if (counter > 100) {
      slug = 'product-' + randomId();
      break;
    }
  }
  return slug;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.tag) filter.tags = req.query.tag;
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products.map(shape));
});

exports.getById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.id });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(shape(product));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.description) {
    return res.status(400).json({ message: 'Name and description are required' });
  }
  if (!Array.isArray(body.storeInventory) || body.storeInventory.length === 0) {
    return res.status(400).json({ message: 'At least one store inventory entry is required' });
  }
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.name);
  const product = await Product.create({
    slug,
    name: body.name,
    category: body.category || 'flowers',
    type: body.type || 'natural',
    description: body.description,
    image: body.image || '',
    images: body.images || [],
    sizes: body.sizes || [],
    tags: body.tags || [],
    availableColors: body.availableColors || [],
    allowCustomDescription: body.allowCustomDescription !== false,
    storeInventory: body.storeInventory,
  });
  res.status(201).json(shape(product));
});

exports.update = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.id });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const body = req.body || {};
  const fields = [
    'name', 'category', 'type', 'description', 'image', 'images',
    'sizes', 'tags', 'availableColors', 'allowCustomDescription', 'storeInventory',
  ];
  for (const f of fields) if (body[f] !== undefined) product[f] = body[f];
  await product.save();
  res.json(shape(product));
});

exports.remove = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ slug: req.params.id });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deleted', id: req.params.id });
});
