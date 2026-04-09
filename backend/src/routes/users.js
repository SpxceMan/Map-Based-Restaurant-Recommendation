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

    // Check if email/username already exists using function
    const check = await conn.execute(
      `SELECT FN_USER_EXISTS(:email, :uname) AS CNT FROM DUAL`,
      { email, uname: username },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (check.rows[0].CNT > 0) {
      return res.status(409).json({ success: false, message: 'Email or username already exists' });
    }

    // Owners start as PENDING, regular users are APPROVED immediately
    const userStatus = userRole === 'OWNER' ? 'PENDING' : 'APPROVED';

    // Register user using procedure
    const result = await conn.execute(
      `BEGIN SP_REGISTER_USER(:uname, :email, :phash, :urole, :licno, :ustatus, :new_id); END;`,
      {
        uname: username, email,
        phash: password_hash, urole: userRole,
        licno: userRole === 'OWNER' ? license_number.trim() : null,
        ustatus: userStatus,
        new_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    const newId = result.outBinds.new_id;

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

    // Authenticate using VW_USER_LOGIN view
    const result = await conn.execute(
      `SELECT USER_ID, USERNAME, EMAIL, ROLE, STATUS
       FROM VW_USER_LOGIN
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
      `SELECT RESTAURANT_ID, NAME, ADDRESS, PRICE_RANGE, AVG_RATING
       FROM VW_USER_FAVORITES
       WHERE USER_ID = :usid
       ORDER BY ADDED_AT DESC`,
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

    // Add favorite using procedure
    await conn.execute(
      `BEGIN SP_ADD_FAVORITE(:usid, :rsid, :new_id); END;`,
      {
        usid: Number(authUser.userId),
        rsid: Number(restaurant_id),
        new_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
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
      `SELECT INVITE_ID, STATUS, CREATED_AT, INVITED_BY_NAME
       FROM VW_USER_PENDING_INVITES
       WHERE INVITEE_ID = :usid
       ORDER BY CREATED_AT DESC`,
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

    // Verify invite ownership using function
    const inviteeResult = await conn.execute(
      `SELECT FN_INVITE_OWNER(:invid) AS INVITEE_ID FROM DUAL`,
      { invid: inviteId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const inviteeId = inviteeResult.rows[0].INVITEE_ID;

    if (inviteeId === null) {
      return res.status(404).json({ success: false, message: 'Invite not found or already processed' });
    }
    if (inviteeId !== userId) {
      return res.status(403).json({ success: false, message: 'This invite is not for you' });
    }

    // Accept invite using procedure (multi-DML: update invite + promote user)
    await conn.execute(
      `BEGIN SP_ACCEPT_INVITE(:invid, :usid); END;`,
      { invid: inviteId, usid: userId },
      { autoCommit: false }
    );
    await conn.commit();

    // Return updated user data using VW_USER_PROFILE view + new token
    const userRes = await conn.execute(
      `SELECT * FROM VW_USER_PROFILE WHERE USER_ID = :usid`,
      { usid: userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = userRes.rows[0];
    const token = createToken(user.USER_ID, user.ROLE);

    res.json({ success: true, message: 'You are now an admin!', data: user, token });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
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

    // Verify invite ownership using function
    const inviteeResult = await conn.execute(
      `SELECT FN_INVITE_OWNER(:invid) AS INVITEE_ID FROM DUAL`,
      { invid: inviteId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const inviteeId = inviteeResult.rows[0].INVITEE_ID;

    if (inviteeId === null) {
      return res.status(404).json({ success: false, message: 'Invite not found or already processed' });
    }
    if (inviteeId !== userId) {
      return res.status(403).json({ success: false, message: 'This invite is not for you' });
    }

    // Decline invite using procedure
    await conn.execute(
      `BEGIN SP_DECLINE_INVITE(:invid); END;`,
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