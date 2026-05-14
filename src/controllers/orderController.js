const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const couponController = require('./couponController');
const asyncHandler = require('../utils/asyncHandler');

function shape(o) {
  if (!o) return null;
  const obj = o.toJSON ? o.toJSON() : o;
  return {
    id: obj.orderId,
    userId: obj.userId ? obj.userId.toString() : null,
    productId: obj.productId,
    productName: obj.productName,
    productImage: obj.productImage || '',
    storeId: obj.storeId,
    storeName: obj.storeName,
    type: obj.type,
    color: obj.color || '',
    size: obj.size || '',
    quantity: obj.quantity || 1,
    customDescription: obj.customDescription || '',
    giftDetails: obj.giftDetails || null,
    unitPrice: obj.unitPrice || 0,
    price: obj.price,
    couponCode: obj.couponCode || '',
    discount: obj.discount || 0,
    customerName: obj.customerName || '',
    customerPhone: obj.customerPhone || '',
    customerEmail: obj.customerEmail || '',
    customerAddress: obj.customerAddress || '',
    basePrice: obj.basePrice || 0,
    status: obj.status,
    trackingUrl: obj.trackingUrl || '',
    date: obj.date,
    createdAt: obj.createdAt,
  };
}

function makeOrderId() {
  return 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

exports.listAll = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders.map(shape));
});

exports.listMine = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user.sub }).sort({ createdAt: -1 });
  res.json(orders.map(shape));
});

exports.getById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(shape(order));
});

exports.checkout = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.cart || user.cart.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty' });
  }

  const body = req.body || {};
  const type = body.type === 'gift' ? 'gift' : 'personal';
  const giftDetails = type === 'gift' ? body.giftDetails || null : null;
  if (type === 'gift') {
    const g = giftDetails || {};
    if (!g.receiverName || !g.receiverPhone || !g.receiverAddress) {
      return res.status(400).json({ message: 'Gift orders require receiver name, phone and address' });
    }
  }
  const customerName = body.customerName || user.name || '';
  const customerPhone = body.customerPhone || user.phone || '';
  const customerEmail = body.customerEmail || user.email || '';
  const customerAddress = body.customerAddress || user.address || '';

  const productIds = [...new Set(user.cart.map((i) => i.productId))];
  const storeIds = [...new Set(user.cart.map((i) => i.storeId))];
  const [products, stores] = await Promise.all([
    Product.find({ slug: { $in: productIds } }),
    Store.find({ slug: { $in: storeIds } }),
  ]);
  const productMap = new Map(products.map((p) => [p.slug, p]));
  const storeMap = new Map(stores.map((s) => [s.slug, s]));

  // Snapshot line items with prices so we can compute subtotal up front
  const lineItems = [];
  for (const item of user.cart) {
    const product = productMap.get(item.productId);
    if (!product) return res.status(400).json({ message: `Product ${item.productId} is no longer available` });
    const inv = product.storeInventory.find((s) => s.storeId === item.storeId);
    if (!inv) return res.status(400).json({ message: `${product.name} is not stocked at the selected store` });
    if (inv.stock < item.quantity) {
      return res.status(409).json({
        message: `${product.name} has only ${inv.stock} left at ${storeMap.get(item.storeId)?.name || item.storeId}`,
      });
    }
    lineItems.push({ item, product, inv, store: storeMap.get(item.storeId) });
  }

  // Use offeredPrice when available, fall back to legacy `price`.
  const sellPriceOf = (inv) => Number(inv.offeredPrice || inv.price || 0);
  const subtotal = lineItems.reduce((s, l) => s + sellPriceOf(l.inv) * l.item.quantity, 0);

  // Validate coupon if provided
  let couponCode = '';
  let discount = 0;
  let couponDoc = null;
  if (body.couponCode) {
    const result = await couponController.validateForUser(userId, body.couponCode);
    if (!result.ok) return res.status(400).json({ message: result.message });
    couponDoc = result.coupon;
    couponCode = result.coupon.code;
    discount = result.discount;
  }

  // Pro-rate discount across lines so per-order price reflects what user paid
  function makePayloads() {
    return lineItems.map(({ item, product, inv, store }) => {
      const sell = sellPriceOf(inv);
      const lineSubtotal = sell * item.quantity;
      const linePortion = subtotal > 0 ? lineSubtotal / subtotal : 0;
      const lineDiscount = Math.round(discount * linePortion * 100) / 100;
      return {
        orderId: makeOrderId(),
        userId,
        productId: product.slug,
        productName: product.name,
        productImage: product.image || '',
        storeId: store?.slug || item.storeId,
        storeName: store?.name || item.storeId,
        type,
        color: item.color || '',
        size: item.size || '',
        quantity: item.quantity,
        customDescription: item.customDescription || '',
        giftDetails: type === 'gift' ? giftDetails : null,
        unitPrice: sell,
        basePrice: Number(inv.basePrice || inv.price || 0),
        price: Math.max(0, lineSubtotal - lineDiscount),
        couponCode,
        discount: lineDiscount,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        status: 'Confirmed',
        inv,
        product,
        quantityToDeduct: item.quantity,
      };
    });
  }

  const payloads = makePayloads();
  const created = [];

  async function place(session) {
    for (const p of payloads) {
      p.inv.stock = Math.max(0, p.inv.stock - p.quantityToDeduct);
      await p.product.save(session ? { session } : undefined);
      const cleanPayload = { ...p };
      delete cleanPayload.inv;
      delete cleanPayload.product;
      delete cleanPayload.quantityToDeduct;
      const docs = session
        ? await Order.create([cleanPayload], { session })
        : [await Order.create(cleanPayload)];
      created.push(docs[0]);
    }
    user.cart = [];
    if (body.customerAddress && body.customerAddress !== user.address) {
      user.address = body.customerAddress;
    }
    if (couponDoc) {
      couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
      await couponDoc.save(session ? { session } : undefined);
    }
    await user.save(session ? { session } : undefined);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(() => place(session));
  } catch (err) {
    if (err?.code === 20 || err?.codeName === 'IllegalOperation' || /Transaction numbers/i.test(err?.message || '')) {
      created.length = 0;
      await place(null);
    } else {
      throw err;
    }
  } finally {
    session.endSession();
  }

  const total = created.reduce((s, o) => s + o.price, 0);

  res.status(201).json({
    orders: created.map(shape),
    subtotal,
    discount,
    couponCode,
    total,
  });
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
