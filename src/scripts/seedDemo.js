/**
 * Demo data seeder — creates 10 users with realistic orders so the admin
 * dashboard shows meaningful KPIs (revenue, recent orders, low stock alerts).
 *
 *   node src/scripts/seedDemo.js          → add demo users/orders on top of existing data
 *   node src/scripts/seedDemo.js --reset  → first wipe prior demo data (users with @demo.bloomnest emails + their orders)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Event = require('../models/Event');

const DEMO_DOMAIN = 'demo.bloomnest';

const DEMO_USERS = [
  { email: `priya.sharma@${DEMO_DOMAIN}`,    name: 'Priya Sharma',    phone: '+91 98100 12001', address: '12 Lotus Lane, Mumbai 400001' },
  { email: `arjun.mehta@${DEMO_DOMAIN}`,      name: 'Arjun Mehta',     phone: '+91 98100 12002', address: '88 Marine Drive, Mumbai 400020' },
  { email: `sara.lopez@${DEMO_DOMAIN}`,       name: 'Sara Lopez',      phone: '+1 415 555 0123', address: '500 Hayes St, San Francisco, CA 94102' },
  { email: `liam.oconnor@${DEMO_DOMAIN}`,     name: "Liam O'Connor",   phone: '+44 20 7946 0123', address: '14 Marylebone Rd, London NW1 5LR' },
  { email: `aisha.khan@${DEMO_DOMAIN}`,       name: 'Aisha Khan',      phone: '+971 50 555 0123', address: 'Marina Walk, Dubai Marina' },
  { email: `noah.patel@${DEMO_DOMAIN}`,       name: 'Noah Patel',      phone: '+1 212 555 0123', address: '230 Park Ave, New York, NY 10169' },
  { email: `mei.tanaka@${DEMO_DOMAIN}`,       name: 'Mei Tanaka',      phone: '+81 3 5500 1234',  address: '3-1 Marunouchi, Chiyoda, Tokyo 100-0005' },
  { email: `daniel.kim@${DEMO_DOMAIN}`,       name: 'Daniel Kim',      phone: '+82 2 555 0123',   address: '123 Gangnam-daero, Seoul' },
  { email: `eva.muller@${DEMO_DOMAIN}`,       name: 'Eva Müller',      phone: '+49 30 555 0123',  address: 'Friedrichstraße 100, 10117 Berlin' },
  { email: `rohan.iyer@${DEMO_DOMAIN}`,       name: 'Rohan Iyer',      phone: '+91 98100 12010',  address: '52 MG Road, Bengaluru 560001' },
];

const STATUS_MIX = [
  // weighted distribution
  { status: 'Delivered',  weight: 5 },
  { status: 'Shipped',    weight: 3 },
  { status: 'Processing', weight: 2 },
  { status: 'Confirmed',  weight: 2 },
  { status: 'Cancelled',  weight: 1 },
];

const GIFT_RECEIVERS = [
  { name: 'Mom',           phone: '+91 98765 12345', address: 'Rose Villa, 27 Garden Road, Pune 411001' },
  { name: 'James Wilson',  phone: '+44 7700 900123', address: '22 Baker Street, London W1U 3BW' },
  { name: 'Sofía García',  phone: '+34 612 345 678', address: 'Calle Gran Vía 28, Madrid 28013' },
  { name: 'Hiroshi Sato',  phone: '+81 90 1234 5678', address: '1-1 Shibuya, Tokyo 150-0002' },
  { name: 'Layla Hassan',  phone: '+971 55 123 4567', address: 'Palm Jumeirah, Villa 12, Dubai' },
];

const GIFT_MESSAGES = [
  'Thinking of you today — wishing you the very best!',
  'Happy anniversary, my love. Here\'s to many more.',
  'Congratulations on the new role!',
  'A little something to brighten your day.',
  'With heartfelt thanks for everything.',
  '',
  '',
];

const TRACKING_BASES = [
  'https://track.bloomexpress.com/parcel/',
  'https://courier.example.com/t/',
  'https://orders.bloomnest.com/track/',
];

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n) { return String(n).padStart(2, '0'); }
function randomTrackingId() {
  return 'BN' + Array.from({ length: 10 }, () => pad(randInt(0, 9))).join('');
}
function makeOrderId() { return 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase(); }
function makeTrackingUrl() { return pick(TRACKING_BASES) + randomTrackingId(); }
function randomDateInLastDays(days) {
  const now = Date.now();
  const ms = days * 24 * 60 * 60 * 1000;
  return new Date(now - Math.floor(Math.random() * ms));
}

async function main() {
  const args = process.argv.slice(2);
  const RESET = args.includes('--reset');

  await connectDB();

  if (RESET) {
    console.log('• Wiping prior demo data…');
    const oldUsers = await User.find({ email: { $regex: `@${DEMO_DOMAIN}$` } });
    const oldIds = oldUsers.map((u) => u._id);
    const deletedOrders = await Order.deleteMany({ userId: { $in: oldIds } });
    const deletedUsers = await User.deleteMany({ _id: { $in: oldIds } });
    console.log(`   removed ${deletedUsers.deletedCount} demo users and ${deletedOrders.deletedCount} demo orders`);
  }

  const products = await Product.find();
  const stores = await Store.find();
  if (products.length === 0 || stores.length === 0) {
    throw new Error('Products / stores not seeded yet. Run `npm run seed` first.');
  }
  const storeMap = new Map(stores.map((s) => [s.slug, s]));

  console.log(`• Creating ${DEMO_USERS.length} demo users…`);
  const createdUsers = [];
  for (const u of DEMO_USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create({ ...u, password: 'demo1234' });
      createdUsers.push({ user, status: 'created' });
    } else {
      createdUsers.push({ user, status: 'reused' });
    }
  }
  console.log(`   created ${createdUsers.filter((c) => c.status === 'created').length}, reused ${createdUsers.filter((c) => c.status === 'reused').length}`);

  console.log('• Generating orders + adjusting stock…');
  let totalOrders = 0;
  let totalRevenue = 0;
  const productMap = new Map(products.map((p) => [p.slug, p]));

  for (const { user } of createdUsers) {
    const orderCount = randInt(3, 6);
    for (let i = 0; i < orderCount; i++) {
      // pick a product that still has stock somewhere
      const candidates = products.filter((p) => p.storeInventory.some((s) => s.stock > 0));
      if (candidates.length === 0) break;
      const product = pick(candidates);

      // cheapest store with stock
      const stocked = [...product.storeInventory].filter((s) => s.stock > 0).sort((a, b) => a.price - b.price);
      const inv = stocked[0];
      if (!inv) continue;
      const store = storeMap.get(inv.storeId);

      const quantity = Math.min(inv.stock, randInt(1, Math.min(3, inv.stock)));
      const unitPrice = inv.price;
      const lineTotal = unitPrice * quantity;

      const type = Math.random() < 0.3 ? 'gift' : 'personal';
      let giftDetails = null;
      if (type === 'gift') {
        const g = pick(GIFT_RECEIVERS);
        giftDetails = {
          receiverName: g.name,
          receiverPhone: g.phone,
          receiverAddress: g.address,
          giftMessage: pick(GIFT_MESSAGES),
        };
      }

      const { status } = pickWeighted(STATUS_MIX);
      const isShippedLike = status === 'Shipped' || status === 'Delivered';
      const trackingUrl = isShippedLike && Math.random() < 0.85 ? makeTrackingUrl() : '';

      const color = product.availableColors.length ? pick(product.availableColors) : '';
      const size = product.sizes.length ? pick(product.sizes) : '';

      const customDescriptionPool = [
        '', '', '',
        'Please include a hand-written card.',
        'Use eco-friendly packaging if possible.',
        'Pastel ribbon preferred.',
        'Deliver after 3 PM only.',
      ];
      const customDescription = product.allowCustomDescription ? pick(customDescriptionPool) : '';

      const date = randomDateInLastDays(60);

      // decrement stock
      inv.stock = Math.max(0, inv.stock - quantity);

      const order = await Order.create({
        orderId: makeOrderId(),
        userId: user._id,
        productId: product.slug,
        productName: product.name,
        productImage: product.image || '',
        storeId: store?.slug || inv.storeId,
        storeName: store?.name || inv.storeId,
        type,
        color,
        size,
        quantity,
        customDescription,
        giftDetails,
        unitPrice,
        price: lineTotal,
        customerName: user.name,
        customerPhone: user.phone,
        customerEmail: user.email,
        status,
        trackingUrl,
        date,
      });

      // backdate timestamps so admin "recent orders" looks chronological
      await Order.updateOne(
        { _id: order._id },
        { $set: { createdAt: date, updatedAt: date } }
      );

      totalOrders += 1;
      if (status !== 'Cancelled') totalRevenue += lineTotal;
    }
  }

  // Persist product stock changes once
  for (const product of productMap.values()) {
    if (product.isModified('storeInventory')) await product.save();
  }
  // (Above check requires we mark — easier: just save all)
  await Promise.all(products.map((p) => p.save()));

  // Optional: seed a few sample events too so Parties tab isn't empty
  console.log('• Topping up sample events if missing…');
  const eventCount = await Event.countDocuments();
  if (eventCount < 4) {
    const sampleEvents = [
      {
        slug: 'ev-sharma-wedding-' + Math.random().toString(36).slice(2, 6),
        name: 'Sharma Wedding',
        packageType: 'wedding',
        venue: 'Taj Lands End, Mumbai',
        date: new Date(Date.now() + 21 * 86400000),
        capacity: 350,
        description: 'Bridal bouquet, mandap florals, centrepieces for 30 tables.',
        price: 4800,
        contactName: 'Priya Sharma',
        contactPhone: '+91 98100 12001',
        status: 'confirmed',
      },
      {
        slug: 'ev-acme-launch-' + Math.random().toString(36).slice(2, 6),
        name: 'Acme Product Launch',
        packageType: 'corporate',
        venue: 'WeWork BKC, Mumbai',
        date: new Date(Date.now() + 9 * 86400000),
        capacity: 120,
        description: 'Stage florals, branded centrepieces, premium hand bouquets for VIPs.',
        price: 1850,
        contactName: 'Arjun Mehta',
        contactPhone: '+91 98100 12002',
        status: 'in-progress',
      },
      {
        slug: 'ev-zara-bday-' + Math.random().toString(36).slice(2, 6),
        name: "Zara's 5th Birthday",
        packageType: 'birthday',
        venue: 'Hill Top Residences',
        date: new Date(Date.now() + 14 * 86400000),
        capacity: 40,
        description: 'Unicorn-themed balloon arch, table florals, and a candy bar centrepiece.',
        price: 620,
        contactName: 'Aisha Khan',
        contactPhone: '+971 50 555 0123',
        status: 'enquiry',
      },
      {
        slug: 'ev-anniversary-' + Math.random().toString(36).slice(2, 6),
        name: '25th Anniversary — The Patels',
        packageType: 'anniversary',
        venue: 'Private Residence, NYC',
        date: new Date(Date.now() + 30 * 86400000),
        capacity: 80,
        description: 'Romantic rose-and-peony floral installation along the entryway.',
        price: 2100,
        contactName: 'Noah Patel',
        contactPhone: '+1 212 555 0123',
        status: 'confirmed',
      },
    ];
    for (const ev of sampleEvents) {
      if (!(await Event.exists({ slug: ev.slug }))) await Event.create(ev);
    }
  }

  console.log('\n✓ Demo seed complete.');
  console.log(`   Users:   ${createdUsers.length}`);
  console.log(`   Orders:  ${totalOrders}`);
  console.log(`   Revenue (excl. cancelled): $${totalRevenue.toFixed(2)}`);
  console.log(`\n   All demo users use password:  demo1234`);
  console.log(`   E.g.: ${DEMO_USERS[0].email} / demo1234`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Demo seed failed:', err);
  process.exit(1);
});
