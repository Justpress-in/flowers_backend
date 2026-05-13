const User = require('../models/User');
const Product = require('../models/Product');
const Store = require('../models/Store');
const asyncHandler = require('../utils/asyncHandler');

async function buildCartView(cart) {
  if (!cart || cart.length === 0) return { items: [], subtotal: 0, count: 0 };
  const productIds = [...new Set(cart.map((i) => i.productId))];
  const storeIds = [...new Set(cart.map((i) => i.storeId))];
  const [products, stores] = await Promise.all([
    Product.find({ slug: { $in: productIds } }),
    Store.find({ slug: { $in: storeIds } }),
  ]);
  const productMap = new Map(products.map((p) => [p.slug, p]));
  const storeMap = new Map(stores.map((s) => [s.slug, s]));

  const items = cart.map((item) => {
    const product = productMap.get(item.productId);
    const store = storeMap.get(item.storeId);
    const inv = product?.storeInventory.find((s) => s.storeId === item.storeId);
    const unitPrice = inv?.price || 0;
    const available = inv?.stock || 0;
    return {
      id: item._id.toString(),
      productId: item.productId,
      productName: product?.name || 'Unavailable product',
      productImage: product?.image || '',
      storeId: item.storeId,
      storeName: store?.name || 'Unknown store',
      quantity: item.quantity,
      color: item.color || '',
      size: item.size || '',
      customDescription: item.customDescription || '',
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      available,
      inStock: available >= item.quantity,
      addedAt: item.addedAt,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return { items, subtotal, count };
}

exports.get = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(await buildCartView(user.cart));
});

function sameVariant(a, b) {
  return (
    a.productId === b.productId &&
    a.storeId === b.storeId &&
    (a.color || '') === (b.color || '') &&
    (a.size || '') === (b.size || '') &&
    (a.customDescription || '') === (b.customDescription || '')
  );
}

exports.addItem = asyncHandler(async (req, res) => {
  const { productId, storeId, quantity = 1, color = '', size = '', customDescription = '' } = req.body || {};
  if (!productId || !storeId) {
    return res.status(400).json({ message: 'productId and storeId are required' });
  }
  const qty = Math.max(1, Math.min(99, Number(quantity) || 1));

  const product = await Product.findOne({ slug: productId });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const inv = product.storeInventory.find((s) => s.storeId === storeId);
  if (!inv) return res.status(400).json({ message: 'Product not available in selected store' });

  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const newItem = { productId, storeId, quantity: qty, color, size, customDescription };
  const existing = user.cart.find((c) => sameVariant(c, newItem));
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + qty);
  } else {
    user.cart.push(newItem);
  }
  await user.save();
  res.status(201).json(await buildCartView(user.cart));
});

exports.updateItem = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const item = user.cart.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Cart item not found' });
  const { quantity, color, size, customDescription } = req.body || {};
  if (quantity !== undefined) {
    const q = Math.max(1, Math.min(99, Number(quantity) || 1));
    item.quantity = q;
  }
  if (color !== undefined) item.color = color;
  if (size !== undefined) item.size = size;
  if (customDescription !== undefined) item.customDescription = customDescription;
  await user.save();
  res.json(await buildCartView(user.cart));
});

exports.removeItem = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const item = user.cart.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Cart item not found' });
  item.deleteOne();
  await user.save();
  res.json(await buildCartView(user.cart));
});

exports.clear = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.cart = [];
  await user.save();
  res.json(await buildCartView(user.cart));
});

exports.merge = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });

  for (const raw of items) {
    if (!raw || !raw.productId || !raw.storeId) continue;
    const qty = Math.max(1, Math.min(99, Number(raw.quantity) || 1));
    const candidate = {
      productId: raw.productId,
      storeId: raw.storeId,
      color: raw.color || '',
      size: raw.size || '',
      customDescription: raw.customDescription || '',
      quantity: qty,
    };
    const existing = user.cart.find((c) => sameVariant(c, candidate));
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + qty);
    } else {
      user.cart.push(candidate);
    }
  }
  await user.save();
  res.json(await buildCartView(user.cart));
});

exports.buildCartView = buildCartView;
