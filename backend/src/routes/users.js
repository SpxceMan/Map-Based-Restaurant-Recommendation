const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { createToken, verifyToken, requireAuth } = require('../middleware/auth');

// POST /api/users/register
router.post('/register', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { username, email, password_hash, role, license_number } = req.body;
    const userRole = (role === 'OWNER') ? 'OWNER' : 'USER';

    if (!username || !email || !password_hash) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Owners must provide a license number
    if (userRole === 'OWNER' && (!license_number || !license_number.trim())) {
      return res.status(400).json({ success: false, message: 'License number is required for owner accounts' });
    }

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
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const newId = seqRes.rows[0].NID;

    // Owners start as PENDING, regular users are APPROVED immediately
    const userStatus = userRole === 'OWNER' ? 'PENDING' : 'APPROVED';

    await conn.execute(
      `INSERT INTO USERS (USER_ID, USERNAME, EMAIL, PASSWORD_HASH, ROLE, LICENSE_NUMBER, STATUS)
       VALUES (:usid, :uname, :email, :phash, :urole, :licno, :ustatus)`,
      {
        usid: newId, uname: username, email,
        phash: password_hash, urole: userRole,
        licno: userRole === 'OWNER' ? license_number.trim() : null,
        ustatus: userStatus
      },
      { autoCommit: true }
    );

    const message = userRole === 'OWNER'
      ? 'Owner account submitted for admin approval. You will be able to log in once approved.'
      : 'Account created! Please sign in.';

    res.status(201).json({ success: true, message, user_id: newId });
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
      `SELECT USER_ID, USERNAME, EMAIL, ROLE, STATUS FROM USERS
       WHERE EMAIL = :email AND PASSWORD_HASH = :phash`,
      { email, phash: password_hash },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Block pending/rejected owners
    if (user.ROLE === 'OWNER' && user.STATUS === 'PENDING') {
      return res.status(403).json({ success: false, message: 'Your owner account is pending admin approval. Please wait.' });
    }
    if (user.ROLE === 'OWNER' && user.STATUS === 'REJECTED') {
      return res.status(403).json({ success: false, message: 'Your owner account has been rejected. Contact support.' });
    }

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
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const newId = seqRes.rows[0].NID;

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

// GET /api/users/me/invites — check for pending admin invite
router.get('/me/invites', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ai.INVITE_ID, ai.STATUS, ai.CREATED_AT,
              u.USERNAME AS INVITED_BY_NAME
       FROM ADMIN_INVITES ai
       JOIN USERS u ON ai.INVITED_BY = u.USER_ID
       WHERE ai.INVITEE_ID = :usid AND ai.STATUS = 'PENDING'
       ORDER BY ai.CREATED_AT DESC`,
      { usid: Number(req.authUser.userId) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /users/me/invites error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/users/me/invites/:id/accept
router.put('/me/invites/:id/accept', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const userId = req.authUser.userId;
    const inviteId = Number(req.params.id);

    // Verify invite belongs to this user
    const check = await conn.execute(
      `SELECT INVITEE_ID FROM ADMIN_INVITES WHERE INVITE_ID = :invid AND STATUS = 'PENDING'`,
      { invid: inviteId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invite not found or already processed' });
    }
    if (check.rows[0].INVITEE_ID !== userId) {
      return res.status(403).json({ success: false, message: 'This invite is not for you' });
    }

    // Accept invite: update invite status + promote user to ADMIN
    await conn.execute(
      `UPDATE ADMIN_INVITES SET STATUS = 'ACCEPTED' WHERE INVITE_ID = :invid`,
      { invid: inviteId },
      { autoCommit: false }
    );
    await conn.execute(
      `UPDATE USERS SET ROLE = 'ADMIN' WHERE USER_ID = :usid`,
      { usid: userId },
      { autoCommit: false }
    );
    await conn.commit();

    // Return updated user data + new token with ADMIN role
    const userRes = await conn.execute(
      `SELECT USER_ID, USERNAME, EMAIL, ROLE, STATUS FROM USERS WHERE USER_ID = :usid`,
      { usid: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = userRes.rows[0];
    const token = createToken(user.USER_ID, user.ROLE);

    res.json({ success: true, message: 'You are now an admin!', data: user, token });
  } catch (err) {
    console.error('PUT /users/me/invites/:id/accept error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/users/me/invites/:id/decline
router.put('/me/invites/:id/decline', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const userId = req.authUser.userId;
    const inviteId = Number(req.params.id);

    const check = await conn.execute(
      `SELECT INVITEE_ID FROM ADMIN_INVITES WHERE INVITE_ID = :invid AND STATUS = 'PENDING'`,
      { invid: inviteId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invite not found or already processed' });
    }
    if (check.rows[0].INVITEE_ID !== userId) {
      return res.status(403).json({ success: false, message: 'This invite is not for you' });
    }

    await conn.execute(
      `UPDATE ADMIN_INVITES SET STATUS = 'DECLINED' WHERE INVITE_ID = :invid`,
      { invid: inviteId },
      { autoCommit: true }
    );

    res.json({ success: true, message: 'Invite declined' });
  } catch (err) {
    console.error('PUT /users/me/invites/:id/decline error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;