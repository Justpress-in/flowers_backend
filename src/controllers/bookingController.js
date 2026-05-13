const Booking = require('../models/Booking');
const Store = require('../models/Store');
const asyncHandler = require('../utils/asyncHandler');

function shape(b) {
  if (!b) return null;
  const obj = b.toJSON ? b.toJSON() : b;
  return {
    id: obj.bookingId,
    userId: obj.userId ? obj.userId.toString() : null,
    customerName: obj.customerName,
    customerPhone: obj.customerPhone,
    customerEmail: obj.customerEmail || '',
    storeId: obj.storeId || '',
    storeName: obj.storeName || '',
    serviceType: obj.serviceType,
    occasion: obj.occasion || '',
    notes: obj.notes || '',
    preferredDate: obj.preferredDate,
    preferredTime: obj.preferredTime || '',
    durationMin: obj.durationMin || 30,
    status: obj.status,
    adminNotes: obj.adminNotes || '',
    createdAt: obj.createdAt,
  };
}

function makeBookingId() {
  return 'BKG-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Public — anyone can request a booking (guest or user)
exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.customerName || !body.customerPhone || !body.preferredDate) {
    return res.status(400).json({ message: 'Name, phone and preferredDate are required' });
  }
  let storeName = body.storeName || '';
  if (body.storeId && !storeName) {
    const store = await Store.findOne({ slug: body.storeId });
    if (store) storeName = store.name;
  }
  const booking = await Booking.create({
    bookingId: makeBookingId(),
    userId: req.user?.sub || null,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerEmail: body.customerEmail || '',
    storeId: body.storeId || '',
    storeName,
    serviceType: body.serviceType || 'consultation',
    occasion: body.occasion || '',
    notes: body.notes || '',
    preferredDate: body.preferredDate,
    preferredTime: body.preferredTime || '',
    durationMin: Number(body.durationMin) || 30,
    status: 'requested',
  });
  res.status(201).json(shape(booking));
});

// Admin
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.serviceType) filter.serviceType = req.query.serviceType;
  const bookings = await Booking.find(filter).sort({ preferredDate: 1, createdAt: -1 });
  res.json(bookings.map(shape));
});

exports.update = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ bookingId: req.params.id });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const body = req.body || {};
  const fields = ['customerName', 'customerPhone', 'customerEmail', 'serviceType', 'occasion',
    'notes', 'preferredDate', 'preferredTime', 'status', 'adminNotes', 'storeId', 'storeName'];
  for (const f of fields) if (body[f] !== undefined) booking[f] = body[f];
  if (body.durationMin !== undefined) booking.durationMin = Number(body.durationMin) || 30;
  await booking.save();
  res.json(shape(booking));
});

exports.remove = asyncHandler(async (req, res) => {
  const booking = await Booking.findOneAndDelete({ bookingId: req.params.id });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json({ message: 'Booking deleted', id: req.params.id });
});

// User — list own bookings
exports.listMine = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.sub }).sort({ preferredDate: 1 });
  res.json(bookings.map(shape));
});
