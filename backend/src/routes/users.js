const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { createToken } = require('../middleware/auth');

// POST /api/users/register
router.post('/register', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { username, email, password_hash } = req.body;

    if (!username || !email || !password_hash) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const check = await conn.execute(
      `SELECT USER_ID FROM USERS WHERE EMAIL = :email OR USERNAME = :username`,
      [email, username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or username already exists' });
    }

    const result = await conn.execute(
      `INSERT INTO USERS (USERNAME, EMAIL, PASSWORD_HASH, ROLE)
       VALUES (:username, :email, :password_hash, 'USER')
       RETURNING USER_ID INTO :id`,
      { username, email, password_hash, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );

    res.status(201).json({ success: true, message: 'User registered successfully', user_id: result.outBinds.id[0] });
  } catch (err) {
    console.error('POST /users/register error:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/users/login — returns user data + session token
router.post('/login', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { email, password_hash } = req.body;

    const result = await conn.execute(
      `SELECT USER_ID, USERNAME, EMAIL, ROLE FROM USERS
       WHERE EMAIL = :email AND PASSWORD_HASH = :password_hash`,
      [email, password_hash],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const token = createToken(user.USER_ID, user.ROLE);

    res.json({ success: true, data: user, token });
  } catch (err) {
    console.error('POST /users/login error:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/users/:id/favorites
router.get('/:id/favorites', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT r.RESTAURANT_ID, r.NAME, r.ADDRESS, r.PRICE_RANGE,
              ROUND(NVL(AVG(rv.RATING),0),1) AS AVG_RATING
       FROM FAVORITES f
       JOIN RESTAURANTS r ON f.RESTAURANT_ID = r.RESTAURANT_ID
       LEFT JOIN REVIEWS rv ON r.RESTAURANT_ID = rv.RESTAURANT_ID
       WHERE f.USER_ID = :id
       GROUP BY r.RESTAURANT_ID, r.NAME, r.ADDRESS, r.PRICE_RANGE
       ORDER BY f.ADDED_AT DESC`,
      [req.params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/users/:id/favorites
router.post('/:id/favorites', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { restaurant_id } = req.body;
    await conn.execute(
      `INSERT INTO FAVORITES (USER_ID, RESTAURANT_ID) VALUES (:uid, :rid)`,
      [req.params.id, restaurant_id],
      { autoCommit: true }
    );
    res.status(201).json({ success: true, message: 'Added to favorites' });
  } catch (err) {
    if (err.errorNum === 1) {
      return res.status(409).json({ success: false, message: 'Already in favorites' });
    }
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
