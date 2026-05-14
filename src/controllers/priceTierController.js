const PriceTier = require('../models/PriceTier');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(p) {
  if (!p) return null;
  const obj = p.toJSON ? p.toJSON() : p;
  return {
    id: obj.slug,
    label: obj.label,
    minPrice: obj.minPrice ?? null,
    maxPrice: obj.maxPrice ?? null,
    currencySymbol: obj.currencySymbol || '$',
    order: obj.order || 0,
    active: obj.active !== false,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'tier-' + randomId();
  let i = 1;
  while (await PriceTier.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'tier-' + randomId(); break; }
  }
  return slug;
}

function parseBound(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = req.query.active === 'true' ? { active: true } : {};
  const tiers = await PriceTier.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(tiers.map(shape));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.label) return res.status(400).json({ message: 'Label is required' });
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.label);
  const tier = await PriceTier.create({
    slug,
    label: body.label,
    minPrice: parseBound(body.minPrice),
    maxPrice: parseBound(body.maxPrice),
    currencySymbol: body.currencySymbol || '$',
    order: Number(body.order) || 0,
    active: body.active !== false,
  });
  res.status(201).json(shape(tier));
});

exports.update = asyncHandler(async (req, res) => {
  const tier = await PriceTier.findOne({ slug: req.params.id });
  if (!tier) return res.status(404).json({ message: 'Tier not found' });
  const body = req.body || {};
  if (body.label !== undefined) tier.label = body.label;
  if (body.minPrice !== undefined) tier.minPrice = parseBound(body.minPrice);
  if (body.maxPrice !== undefined) tier.maxPrice = parseBound(body.maxPrice);
  if (body.currencySymbol !== undefined) tier.currencySymbol = body.currencySymbol;
  if (body.order !== undefined) tier.order = Number(body.order) || 0;
  if (body.active !== undefined) tier.active = !!body.active;
  await tier.save();
  res.json(shape(tier));
});

exports.remove = asyncHandler(async (req, res) => {
  const tier = await PriceTier.findOneAndDelete({ slug: req.params.id });
  if (!tier) return res.status(404).json({ message: 'Tier not found' });
  res.json({ message: 'Price tier deleted', id: req.params.id });
});
