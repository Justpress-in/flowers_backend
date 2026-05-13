const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
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

  const productIds = [...new Set(user.cart.map((i) => i.productId))];
  const storeIds = [...new Set(user.cart.map((i) => i.storeId))];
  const [products, stores] = await Promise.all([
    Product.find({ slug: { $in: productIds } }),
    Store.find({ slug: { $in: storeIds } }),
  ]);
  const productMap = new Map(products.map((p) => [p.slug, p]));
  const storeMap = new Map(stores.map((s) => [s.slug, s]));

  // validate stock
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
  }

  // create orders + decrement stock atomically per product
  const created = [];
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of user.cart) {
        const product = productMap.get(item.productId);
        const store = storeMap.get(item.storeId);
        const inv = product.storeInventory.find((s) => s.storeId === item.storeId);
        inv.stock = Math.max(0, inv.stock - item.quantity);
        await product.save({ session });

        const unitPrice = inv.price;
        const order = await Order.create(
          [
            {
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
              unitPrice,
              price: unitPrice * item.quantity,
              customerName,
              customerPhone,
              customerEmail,
              status: 'Confirmed',
            },
          ],
          { session }
        );
        created.push(order[0]);
      }
      user.cart = [];
      await user.save({ session });
    });
  } catch (err) {
    // Atlas free tier may not allow transactions on a non-replicated database; fall back to sequential
    if (err?.code === 20 || err?.codeName === 'IllegalOperation' || /Transaction numbers/i.test(err?.message || '')) {
      created.length = 0;
      for (const item of user.cart) {
        const product = productMap.get(item.productId);
        const store = storeMap.get(item.storeId);
        const inv = product.storeInventory.find((s) => s.storeId === item.storeId);
        inv.stock = Math.max(0, inv.stock - item.quantity);
        await product.save();
        const unitPrice = inv.price;
        const o = await Order.create({
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
          unitPrice,
          price: unitPrice * item.quantity,
          customerName,
          customerPhone,
          customerEmail,
          status: 'Confirmed',
        });
        created.push(o);
      }
      user.cart = [];
      await user.save();
    } else {
      throw err;
    }
  } finally {
    session.endSession();
  }

  res.status(201).json({
    orders: created.map(shape),
    total: created.reduce((s, o) => s + o.price, 0),
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
