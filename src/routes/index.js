const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/admins', require('./admins'));
router.use('/products', require('./products'));
router.use('/stores', require('./stores'));
router.use('/orders', require('./orders'));
router.use('/events', require('./events'));
router.use('/banners', require('./banners'));
router.use('/upload', require('./upload'));

router.get('/', (_req, res) => {
  res.json({
    name: 'BloomNest API',
    version: '1.0.0',
    endpoints: [
      'POST   /api/auth/login',
      'POST   /api/auth/refresh',
      'POST   /api/auth/logout',
      'GET    /api/auth/me',
      'GET    /api/admins              (admin)',
      'POST   /api/admins              (admin)',
      'PUT    /api/admins/:id          (admin)',
      'PATCH  /api/admins/:id/password (admin)',
      'DELETE /api/admins/:id          (admin)',
      'GET    /api/products',
      'GET    /api/products/:id',
      'POST   /api/products            (admin)',
      'PUT    /api/products/:id        (admin)',
      'DELETE /api/products/:id        (admin)',
      'GET    /api/stores',
      'POST   /api/stores              (admin)',
      'PUT    /api/stores/:id          (admin)',
      'DELETE /api/stores/:id          (admin)',
      'GET    /api/orders              (admin)',
      'POST   /api/orders',
      'PATCH  /api/orders/:id/status   (admin)',
      'GET    /api/events',
      'POST   /api/events',
      'PUT    /api/events/:id          (admin)',
      'DELETE /api/events/:id          (admin)',
      'GET    /api/banners',
      'POST   /api/banners             (admin)',
      'POST   /api/upload              (admin, multipart "image")',
      'POST   /api/upload/multiple     (admin, multipart "images")',
    ],
  });
});

module.exports = router;
