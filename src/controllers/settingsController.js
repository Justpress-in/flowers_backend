const Settings = require('../models/Settings');
const asyncHandler = require('../utils/asyncHandler');

function shape(s) {
  if (!s) return null;
  const obj = s.toJSON ? s.toJSON() : s;
  const { _id, __v, key, createdAt, updatedAt, ...rest } = obj;
  return rest;
}

exports.get = asyncHandler(async (_req, res) => {
  const doc = await Settings.get();
  res.json(shape(doc));
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Settings.get();
  const body = req.body || {};
  const fields = [
    'siteName', 'tagline', 'description', 'logoUrl',
    'contactEmail', 'contactPhone', 'contactAddress', 'whatsappNumber',
    'currency', 'currencySymbol', 'shippingNote', 'footerCopy',
  ];
  for (const f of fields) if (body[f] !== undefined) doc[f] = body[f];
  if (body.social) {
    doc.social = { ...doc.social?.toObject?.() || {}, ...body.social };
  }
  if (body.hero) {
    doc.hero = { ...doc.hero?.toObject?.() || {}, ...body.hero };
  }
  if (body.seo) {
    doc.seo = { ...doc.seo?.toObject?.() || {}, ...body.seo };
  }
  await doc.save();
  res.json(shape(doc));
});
