const oracledb = require('oracledb');
require('dotenv').config();

// Use thin mode (no Oracle Client needed)
oracledb.initOracleClient = undefined;

let pool;

async function initPool() {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    });
    console.log('✅ Oracle DB connection pool created');
  } catch (err) {
    console.error('❌ Failed to create Oracle DB pool:', err.message);
    process.exit(1);
  }
}

async function getConnection() {
  if (!pool) throw new Error('Pool not initialized. Call initPool() first.');
  return await pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(10);
    console.log('Oracle DB pool closed');
  }
}

module.exports = { initPool, getConnection, closePool };
