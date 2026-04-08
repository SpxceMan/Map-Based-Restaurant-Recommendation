const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { createToken, verifyToken } = require('../middleware/auth');

// POST /api/users/register
router.post('/register', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { username, email, password_hash, role } = req.body;
    const userRole = (role === 'OWNER') ? 'OWNER' : 'USER';

    if (!username || !email || !password_hash) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // NOTE: Do NOT use :uid (Oracle reserved), :role (Oracle reserved), :name (reserved)
    // Safe bind names used: :usid, :uname, :email, :phash, :urole
    const check = await conn.execute(
      `SELECT USER_ID FROM USERS WHERE EMAIL = :email OR USERNAME = :uname`,
      { email, uname: username },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or username already exists' });
    }

    const seqRes = await conn.execute(
      `SELECT SEQ_USER_ID.NEXTVAL AS NID FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const newId = seqRes.rows[0].NID;

    await conn.execute(
      `INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE)
       VALUES (:usid, :uname, :email, :phash, :urole)`,
      { usid: newId, uname: username, email, phash: password_hash, urole: userRole },
      { autoCommit: true }
    );

    res.status(201).json({ success: true, message: 'User registered successfully', user_id: newId });
  } catch (err) {
    console.error('POST /users/register error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { email, password_hash } = req.body;

    const result = await conn.execute(
      `SELECT USER_ID, USERNAME, EMAIL, ROLE FROM USERS
       WHERE EMAIL = :email AND PASSWORD_HASH = :phash`,
      { email, phash: password_hash },
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
    res.status(500).json({ success: false, message: err.message || 'Database error' });
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
       LEFT JOIN REVIEWS rv ON r.RESTAURANT_ID = rv.RESTAURANT_ID AND rv.STATUS = 'APPROVED'
       WHERE f.USER_ID = :usid
       GROUP BY r.RESTAURANT_ID, r.NAME, r.ADDRESS, r.PRICE_RANGE, f.ADDED_AT
       ORDER BY f.ADDED_AT DESC`,
      { usid: Number(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /users/:id/favorites error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/users/:id/favorites — auth required
router.post('/:id/favorites', async (req, res) => {
  let conn;
  try {
    const token = req.headers['x-auth-token'];
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

    const authUser = verifyToken(token);
    if (!authUser) return res.status(401).json({ success: false, message: 'Invalid or expired session' });

    if (authUser.userId !== parseInt(req.params.id, 10)) {
      return res.status(403).json({ success: false, message: "Cannot modify another user's favorites" });
    }

    const { restaurant_id } = req.body;
    if (!restaurant_id) {
      return res.status(400).json({ success: false, message: 'restaurant_id is required' });
    }

    conn = await getConnection();

    const seqRes = await conn.execute(
      `SELECT SEQ_FAVORITE_ID.NEXTVAL AS NID FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const newId = seqRes.rows[0].NID;

    // CRITICAL: :uid and :rid are Oracle reserved words — use :fvuid and :fvrid instead
    await conn.execute(
      `INSERT INTO FAVORITES (FAVORITE_ID, USER_ID, RESTAURANT_ID) VALUES (:fvid, :fvuid, :fvrid)`,
      { fvid: newId, fvuid: Number(authUser.userId), fvrid: Number(restaurant_id) },
      { autoCommit: true }
    );

    res.status(201).json({ success: true, message: 'Added to favourites' });
  } catch (err) {
    if (err.errorNum === 1 || (err.message && err.message.includes('ORA-00001'))) {
      return res.status(409).json({ success: false, message: 'Already in favourites' });
    }
    console.error('POST /users/:id/favorites error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;