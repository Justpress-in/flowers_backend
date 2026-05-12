require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Admin = require('../models/Admin');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Banner = require('../models/Banner');

const stores = [
  { slug: 'store-1', name: 'BloomNest Downtown', location: 'Downtown, City Center', phone: '+1 555-001-0001', email: 'downtown@bloomnest.com' },
  { slug: 'store-2', name: 'BloomNest Westside', location: 'Westside Mall, Block 5', phone: '+1 555-002-0002', email: 'westside@bloomnest.com' },
  { slug: 'store-3', name: 'BloomNest Northgate', location: 'Northgate Plaza, Highway 7', phone: '+1 555-003-0003', email: 'northgate@bloomnest.com' },
];

const banners = [
  {
    slug: 'b1',
    title: 'Summer Sale — Up to 30% Off',
    subtitle: 'Fresh bouquets at unbeatable prices this season',
    cta: 'Shop Flowers',
    ctaLink: '/flowers',
    bg: 'linear-gradient(135deg, #c1440e 0%, #f4a261 100%)',
    image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc71?w=600&h=400&fit=crop',
    order: 1,
    active: true,
  },
  {
    slug: 'b2',
    title: 'Perfect Wedding Packages',
    subtitle: 'Bespoke floral arrangements for your special day',
    cta: 'Explore Events',
    ctaLink: '/parties',
    bg: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=400&fit=crop',
    order: 2,
    active: true,
  },
  {
    slug: 'b3',
    title: 'Gift Someone Today',
    subtitle: 'Curated hampers, chocolates & scented candles',
    cta: 'Browse Gifts',
    ctaLink: '/gifts',
    bg: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=400&fit=crop',
    order: 3,
    active: true,
  },
];

const products = [
  {
    slug: 'p1',
    name: 'Classic Red Rose Bouquet',
    category: 'flowers',
    type: 'natural',
    description: 'A stunning arrangement of 12 premium red roses, perfect for expressing love and admiration.',
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&h=450&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1490750967868-88df5691cc71?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1477120128765-a0528148fed2?w=600&h=450&fit=crop',
    ],
    sizes: ['Small (6 stems)', 'Medium (12 stems)', 'Large (24 stems)', 'Grand (36 stems)'],
    tags: ['bestseller', 'romantic'],
    availableColors: ['Red', 'Pink', 'White', 'Yellow', 'Mixed'],
    allowCustomDescription: true,
    storeInventory: [
      { storeId: 'store-1', price: 45, stock: 20 },
      { storeId: 'store-2', price: 42, stock: 15 },
      { storeId: 'store-3', price: 48, stock: 8 },
    ],
  },
  {
    slug: 'p2',
    name: 'Sunflower Bliss Arrangement',
    category: 'flowers',
    type: 'natural',
    description: "Bright and cheerful sunflowers mixed with baby's breath, bringing joy to any room.",
    image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&h=450&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=600&h=450&fit=crop',
      'https://images.unsplash.com/photo-1444930694458-01babf71abfc?w=600&h=450&fit=crop',
    ],
    sizes: ['Petite', 'Standard', 'Deluxe'],
    tags: ['seasonal', 'cheerful'],
    availableColors: ['Yellow', 'Orange', 'Mixed'],
    allowCustomDescription: true,
    storeInventory: [
      { storeId: 'store-1', price: 35, stock: 30 },
      { storeId: 'store-2', price: 33, stock: 25 },
    ],
  },
  {
    slug: 'p3',
    name: 'Orchid Elegance',
    category: 'flowers',
    type: 'natural',
    description: 'Exotic orchids in a premium vase — a sophisticated gift for discerning tastes.',
    image: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=600&h=450&fit=crop',
    images: ['https://images.unsplash.com/photo-1585076641399-5c06d1b3365f?w=600&h=450&fit=crop'],
    sizes: ['Single Stem', 'Trio Vase', 'Statement Pot'],
    tags: ['premium', 'exotic'],
    availableColors: ['Purple', 'White', 'Pink', 'Yellow'],
    allowCustomDescription: true,
    storeInventory: [
      { storeId: 'store-1', price: 75, stock: 10 },
      { storeId: 'store-3', price: 80, stock: 6 },
    ],
  },
  {
    slug: 'p4',
    name: 'Silk Rose Arrangement',
    category: 'flowers',
    type: 'artificial',
    description: 'Lifelike silk roses that never wilt — a lasting keepsake for any occasion.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=450&fit=crop',
    images: [],
    sizes: ['Small', 'Medium', 'Large'],
    tags: ['artificial', 'lasting'],
    availableColors: ['Red', 'Pink', 'White', 'Purple'],
    allowCustomDescription: false,
    storeInventory: [
      { storeId: 'store-1', price: 55, stock: 40 },
      { storeId: 'store-2', price: 52, stock: 35 },
      { storeId: 'store-3', price: 58, stock: 20 },
    ],
  },
  {
    slug: 'p5',
    name: 'Luxury Chocolate & Flower Box',
    category: 'gifts',
    type: 'natural',
    description: 'A curated gift box with Belgian chocolates and a mini floral arrangement.',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=300&fit=crop',
    tags: ['bestseller', 'combo'],
    availableColors: [],
    allowCustomDescription: false,
    storeInventory: [
      { storeId: 'store-1', price: 65, stock: 12 },
      { storeId: 'store-2', price: 65, stock: 10 },
      { storeId: 'store-3', price: 68, stock: 7 },
    ],
  },
  {
    slug: 'p6',
    name: 'Personalised Hamper',
    category: 'gifts',
    type: 'natural',
    description: 'Build your own hamper with selected gourmet items, perfect for any celebration.',
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop',
    tags: ['personalised'],
    availableColors: [],
    allowCustomDescription: true,
    storeInventory: [
      { storeId: 'store-1', price: 89, stock: 18 },
      { storeId: 'store-2', price: 85, stock: 14 },
    ],
  },
  {
    slug: 'p7',
    name: 'Scented Candle Set',
    category: 'gifts',
    type: 'artificial',
    description: 'Three artisan soy candles in rose, lavender, and sandalwood scents.',
    image: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400&h=300&fit=crop',
    tags: ['aromatic', 'relaxing'],
    availableColors: [],
    allowCustomDescription: false,
    storeInventory: [
      { storeId: 'store-2', price: 42, stock: 25 },
      { storeId: 'store-3', price: 44, stock: 20 },
    ],
  },
  {
    slug: 'p8',
    name: 'Birthday Party Decoration Pack',
    category: 'parties',
    type: 'artificial',
    description: 'Complete decoration kit: balloons, streamers, table centrepiece, and floral arch.',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
    tags: ['birthday', 'complete-pack'],
    availableColors: ['Pink', 'Blue', 'Gold', 'Rainbow'],
    allowCustomDescription: true,
    storeInventory: [
      { storeId: 'store-1', price: 120, stock: 15 },
      { storeId: 'store-2', price: 115, stock: 12 },
    ],
  },
  {
    slug: 'p9',
    name: 'Wedding Floral Package',
    category: 'parties',
    type: 'natural',
    description: 'Bridal bouquet, centerpieces, and venue flowers — bespoke wedding floristry.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
    tags: ['wedding', 'bespoke', 'premium'],
    availableColors: ['White', 'Blush', 'Ivory', 'Red', 'Mixed'],
    allowCustomDescription: true,
    storeInventory: [
      { storeId: 'store-1', price: 450, stock: 5 },
      { storeId: 'store-3', price: 480, stock: 3 },
    ],
  },
  {
    slug: 'p10',
    name: 'Corporate Event Florals',
    category: 'parties',
    type: 'natural',
    description: 'Professional floral arrangements for conferences, launches, and corporate dining.',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop',
    tags: ['corporate', 'professional'],
    availableColors: [],
    allowCustomDescription: true,
    storeInventory: [
      { storeId: 'store-1', price: 200, stock: 8 },
      { storeId: 'store-2', price: 190, stock: 6 },
      { storeId: 'store-3', price: 210, stock: 4 },
    ],
  },
];

async function seed() {
  await connectDB();

  console.log('• Seeding admin…');
  const email = (process.env.ADMIN_EMAIL || 'admin@flowers.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin';
  let admin = await Admin.findOne({ email });
  if (admin) {
    admin.password = password;
    await admin.save();
    console.log(`   updated admin: ${email}`);
  } else {
    admin = await Admin.create({ email, password, name: 'Admin' });
    console.log(`   created admin: ${email}`);
  }

  console.log('• Seeding stores…');
  await Store.deleteMany({});
  await Store.insertMany(stores);
  console.log(`   inserted ${stores.length} stores`);

  console.log('• Seeding banners…');
  await Banner.deleteMany({});
  await Banner.insertMany(banners);
  console.log(`   inserted ${banners.length} banners`);

  console.log('• Seeding products…');
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`   inserted ${products.length} products`);

  console.log('\n✓ Seed complete.');
  console.log(`   Admin login: ${email} / ${password}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
