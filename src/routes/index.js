const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/admins', require('./admins'));
router.use('/admin-users', require('./adminUsers'));
router.use('/users', require('./userAuth'));
router.use('/cart', require('./cart'));
router.use('/products', require('./products'));
router.use('/stores', require('./stores'));
router.use('/orders', require('./orders'));
router.use('/events', require('./events'));
router.use('/banners', require('./banners'));
router.use('/upload', require('./upload'));
router.use('/settings', require('./settings'));
router.use('/coupons', require('./coupons'));
router.use('/packages', require('./packages'));
router.use('/reviews', require('./reviews'));
router.use('/blogs', require('./blogs'));
router.use('/offers', require('./offers'));
router.use('/testimonials', require('./testimonials'));
router.use('/delivery-partners', require('./deliveryPartners'));
router.use('/bookings', require('./bookings'));
router.use('/price-tiers', require('./priceTiers'));
router.use('/cities', require('./cities'));
router.use('/home-colours', require('./homeColours'));
router.use('/collections', require('./collections'));

router.get('/', (_req, res) => {
  res.json({
    name: 'BloomNest API',
    version: '2.0.0',
    endpoints: {
      auth: ['POST /api/auth/login', 'POST /api/auth/refresh', 'POST /api/auth/logout', 'GET /api/auth/me'],
      admins: ['GET /api/admins', 'POST /api/admins', 'PUT/PATCH/DELETE /api/admins/:id'],
      adminUsers: ['GET /api/admin-users', 'GET /api/admin-users/:id', 'DELETE /api/admin-users/:id'],
      users: ['POST /api/users/register', 'POST /api/users/login', 'POST /api/users/refresh', 'GET/PATCH /api/users/me'],
      cart: ['GET/DELETE /api/cart', 'POST /api/cart/items', 'PATCH/DELETE /api/cart/items/:id', 'POST /api/cart/merge'],
      products: ['GET /api/products[/:id]', 'POST/PUT/DELETE (admin)'],
      stores: ['GET /api/stores', 'POST/PUT/DELETE (admin)'],
      orders: ['GET /api/orders (admin)', 'GET /api/orders/mine (user)', 'POST /api/orders/checkout (user)', 'PATCH /api/orders/:id/status'],
      events: ['GET/POST/PUT/DELETE /api/events'],
      banners: ['GET /api/banners', 'POST/PUT/DELETE (admin)'],
      settings: ['GET /api/settings', 'PUT /api/settings (admin)'],
      coupons: ['GET /api/coupons (admin)', 'POST/PUT/DELETE (admin)', 'POST /api/coupons/redeem (user)', 'GET /api/coupons/public'],
      packages: ['GET /api/packages[/:id]', 'POST/PUT/DELETE (admin)'],
      reviews: ['GET /api/reviews/product/:productId', 'POST /api/reviews (user)', 'GET /api/reviews (admin)', 'PATCH /api/reviews/:id/status (admin)'],
      blogs: ['GET /api/blogs[/:id]', 'POST/PUT/DELETE (admin)'],
      offers: ['GET /api/offers', 'POST/PUT/DELETE (admin)'],
      testimonials: ['GET /api/testimonials', 'POST/PUT/DELETE (admin)'],
      deliveryPartners: ['GET /api/delivery-partners', 'POST/PUT/DELETE (admin)'],
      bookings: ['POST /api/bookings', 'GET /api/bookings (admin)', 'GET /api/bookings/mine (user)', 'PUT/DELETE /api/bookings/:id'],
      priceTiers: ['GET /api/price-tiers', 'POST/PUT/DELETE (admin)'],
      cities: ['GET /api/cities', 'POST/PUT/DELETE (admin)'],
      homeColours: ['GET /api/home-colours', 'POST/PUT/DELETE (admin)'],
      collections: ['GET /api/collections[?kind=showstopper|pair]', 'GET /api/collections/:id (hydrated)', 'POST/PUT/DELETE (admin)'],
      upload: ['POST /api/upload (admin)', 'POST /api/upload/multiple (admin)'],
    },
  });
});

module.exports = router;
