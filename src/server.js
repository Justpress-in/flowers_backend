require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const apiRouter = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

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
