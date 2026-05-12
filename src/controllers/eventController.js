const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(e) {
  if (!e) return null;
  const obj = e.toJSON ? e.toJSON() : e;
  return {
    id: obj.slug,
    name: obj.name,
    packageType: obj.packageType,
    venue: obj.venue,
    date: obj.date,
    capacity: obj.capacity,
    description: obj.description || '',
    price: obj.price,
    contactName: obj.contactName || '',
    contactPhone: obj.contactPhone,
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'ev-' + randomId();
  let i = 1;
  while (await Event.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'ev-' + randomId(); break; }
  }
  return slug;
}

exports.list = asyncHandler(async (_req, res) => {
  const events = await Event.find().sort({ createdAt: -1 });
  res.json(events.map(shape));
});

exports.getById = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.id });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(shape(event));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.venue || !body.contactPhone) {
    return res.status(400).json({ message: 'Name, venue and contact phone are required' });
  }
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.name);
  const event = await Event.create({
    slug,
    name: body.name,
    packageType: body.packageType || 'wedding',
    venue: body.venue,
    date: body.date || null,
    capacity: Number(body.capacity) || 0,
    description: body.description || '',
    price: Number(body.price) || 0,
    contactName: body.contactName || '',
    contactPhone: body.contactPhone,
    status: body.status || 'enquiry',
  });
  res.status(201).json(shape(event));
});

exports.update = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.id });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const body = req.body || {};
  const fields = ['name', 'packageType', 'venue', 'date', 'description', 'contactName', 'contactPhone', 'status'];
  for (const f of fields) if (body[f] !== undefined) event[f] = body[f];
  if (body.capacity !== undefined) event.capacity = Number(body.capacity) || 0;
  if (body.price !== undefined) event.price = Number(body.price) || 0;
  await event.save();
  res.json(shape(event));
});

exports.remove = asyncHandler(async (req, res) => {
  const event = await Event.findOneAndDelete({ slug: req.params.id });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json({ message: 'Event deleted', id: req.params.id });
});
