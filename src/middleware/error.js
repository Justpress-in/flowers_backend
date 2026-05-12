function notFound(req, res, next) {
  res.status(404).json({ message: `Not found — ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error('[error]', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Server error';
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate value',
      fields: Object.keys(err.keyValue || {}),
    });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
