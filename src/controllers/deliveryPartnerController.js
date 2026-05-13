const DeliveryPartner = require('../models/DeliveryPartner');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(p) {
  if (!p) return null;
  const obj = p.toJSON ? p.toJSON() : p;
  return {
    id: obj.slug,
    name: obj.name,
    logo: obj.logo || '',
    contactPhone: obj.contactPhone || '',
    contactEmail: obj.contactEmail || '',
    serviceAreas: obj.serviceAreas || [],
    trackingUrlTemplate: obj.trackingUrlTemplate || '',
    active: obj.active !== false,
    order: obj.order || 0,
    notes: obj.notes || '',
    createdAt: obj.createdAt,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'partner-' + randomId();
  let i = 1;
  while (await DeliveryPartner.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'partner-' + randomId(); break; }
  }
  return slug;
}

exports.list = asyncHandler(async (req, res) => {
  const filter = req.query.active === 'true' ? { active: true } : {};
  const partners = await DeliveryPartner.find(filter).sort({ order: 1, name: 1 });
  res.json(partners.map(shape));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ message: 'Name is required' });
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.name);
  const partner = await DeliveryPartner.create({
    slug,
    name: body.name,
    logo: body.logo || '',
    contactPhone: body.contactPhone || '',
    contactEmail: body.contactEmail || '',
    serviceAreas: body.serviceAreas || [],
    trackingUrlTemplate: body.trackingUrlTemplate || '',
    active: body.active !== false,
    order: Number(body.order) || 0,
    notes: body.notes || '',
  });
  res.status(201).json(shape(partner));
});

exports.update = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ slug: req.params.id });
  if (!partner) return res.status(404).json({ message: 'Partner not found' });
  const body = req.body || {};
  const fields = ['name', 'logo', 'contactPhone', 'contactEmail', 'serviceAreas', 'trackingUrlTemplate', 'active', 'notes'];
  for (const f of fields) if (body[f] !== undefined) partner[f] = body[f];
  if (body.order !== undefined) partner.order = Number(body.order) || 0;
  await partner.save();
  res.json(shape(partner));
});

exports.remove = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOneAndDelete({ slug: req.params.id });
  if (!partner) return res.status(404).json({ message: 'Partner not found' });
  res.json({ message: 'Partner deleted', id: req.params.id });
});
