require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const apiRouter = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// Comma-separated CLIENT_ORIGIN env var, plus a safe set of defaults so the
// app works locally and on Render without extra wiring. Set CLIENT_ORIGIN in
// production to lock this down to your real frontend domain.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://localhost:4000,http://localhost:5002')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Render auto-assigns *.onrender.com subdomains; allow them unless CLIENT_ORIGIN
// is locked down with an explicit list (no '*' and no '.onrender.com' suffix).
const allowOnrenderByDefault = !allowedOrigins.some(
  (o) => o.includes('.onrender.com') || o === '*'
);

function isOriginAllowed(origin) {
  if (!origin) return true; // same-origin / server-to-server / curl
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (allowOnrenderByDefault && /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin)) {
    return true;
  }
  return false;
}

app.use(
  cors({
    // Returning `false` (instead of throwing) makes the cors middleware respond
    // without the Access-Control-Allow-Origin header. The browser then blocks
    // the request itself — no Express 500 with a missing-CORS body.
    origin: (origin, cb) => cb(null, isOriginAllowed(origin)),
    credentials: true,
  })
);
// Express 5 / path-to-regexp v6 reject a bare '*' route, so use a RegExp
// to short-circuit any preflight that slipped past the cors() middleware.
app.options(/.*/, cors());

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✓ BloomNest API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
