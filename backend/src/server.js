const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');
require('dotenv').config();

const { initPool } = require('./db/connection');
const restaurantsRouter = require('./routes/restaurants');
const reviewsRouter = require('./routes/reviews');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  // FIX: Must include 'x-auth-token' — this is the custom header the app uses for auth.
  // Without it, browser CORS preflight rejects requests that carry this header,
  // causing all protected endpoints to fail before reaching any route handler.
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Sync all sequences past current MAX IDs to prevent ORA-00001 after seed data
async function syncSequences() {
  const { getConnection } = require('./db/connection');
  let conn;
  try {
    conn = await getConnection();
    const pairs = [
      { seq: 'SEQ_USER_ID',       table: 'USERS',       col: 'USER_ID' },
      { seq: 'SEQ_RESTAURANT_ID', table: 'RESTAURANTS', col: 'RESTAURANT_ID' },
      { seq: 'SEQ_REVIEW_ID',     table: 'REVIEWS',     col: 'REVIEW_ID' },
      { seq: 'SEQ_CUISINE_ID',    table: 'CUISINES',    col: 'CUISINE_ID' },
      { seq: 'SEQ_FAVORITE_ID',   table: 'FAVORITES',   col: 'FAVORITE_ID' },
    ];
    for (const { seq, table, col } of pairs) {
      const maxRes = await conn.execute(
        `SELECT NVL(MAX(${col}), 0) AS MAXID FROM ${table}`,
        [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const maxId = maxRes.rows[0].MAXID;
      if (maxId > 0) {
        let curVal = 0;
        // Advance sequence until it's past the max existing ID
        while (curVal <= maxId) {
          const seqRes = await conn.execute(
            `SELECT ${seq}.NEXTVAL AS NID FROM DUAL`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          curVal = seqRes.rows[0].NID;
        }
        console.log(`  ✓ ${seq} synced to ${curVal} (max ${col} was ${maxId})`);
      }
    }
    console.log('✅ All sequences synced');
  } catch (err) {
    console.error('⚠️  Sequence sync warning:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

// Start server
async function start() {
  await initPool();
  await syncSequences();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;