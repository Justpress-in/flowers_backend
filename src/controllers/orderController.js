const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const asyncHandler = require('../utils/asyncHandler');

function shape(o) {
  if (!o) return null;
  const obj = o.toJSON ? o.toJSON() : o;
  return {
    id: obj.orderId,
    productId: obj.productId,
    productName: obj.productName,
    storeId: obj.storeId,
    storeName: obj.storeName,
    type: obj.type,
    color: obj.color || '',
    size: obj.size || '',
    customDescription: obj.customDescription || '',
    giftDetails: obj.giftDetails || null,
    price: obj.price,
    customerName: obj.customerName || '',
    customerPhone: obj.customerPhone || '',
    customerEmail: obj.customerEmail || '',
    status: obj.status,
    trackingUrl: obj.trackingUrl || '',
    date: obj.date,
    createdAt: obj.createdAt,
  };
}

function makeOrderId() {
  return 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

exports.list = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders.map(shape));
});

exports.getById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(shape(order));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.productId || !body.storeId || !body.type) {
    return res.status(400).json({ message: 'productId, storeId and type are required' });
  }

  const product = await Product.findOne({ slug: body.productId });
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const store = await Store.findOne({ slug: body.storeId });
  if (!store) return res.status(404).json({ message: 'Store not found' });

  const inv = product.storeInventory.find((s) => s.storeId === body.storeId);
  if (!inv) return res.status(400).json({ message: 'Product not available in selected store' });
  if (inv.stock <= 0) return res.status(400).json({ message: 'Out of stock' });

  inv.stock = Math.max(0, inv.stock - 1);
  await product.save();

  const order = await Order.create({
    orderId: makeOrderId(),
    productId: product.slug,
    productName: product.name,
    storeId: store.slug,
    storeName: store.name,
    type: body.type,
    color: body.color || '',
    size: body.size || '',
    customDescription: body.customDescription || '',
    giftDetails: body.type === 'gift' ? body.giftDetails || null : null,
    price: typeof body.price === 'number' ? body.price : inv.price,
    customerName: body.customerName || '',
    customerPhone: body.customerPhone || '',
    customerEmail: body.customerEmail || '',
    status: 'Confirmed',
  });
  res.status(201).json(shape(order));
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const { status, trackingUrl } = req.body || {};
  if (status) order.status = status;
  if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
  await order.save();
  res.json(shape(order));
});

exports.remove = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndDelete({ orderId: req.params.id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ message: 'Order deleted', id: req.params.id });
});
