const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { requireAdmin } = require('../middleware/auth');

// All admin routes require ADMIN role
router.use(requireAdmin);

// ============================================================
// PENDING OWNERS
// ============================================================

// GET /api/admin/owners/pending
router.get('/owners/pending', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT USER_ID, USERNAME, EMAIL, LICENSE_NUMBER, CREATED_AT
       FROM USERS
       WHERE ROLE = 'OWNER' AND STATUS = 'PENDING'
       ORDER BY CREATED_AT ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/admin/owners/:id/approve
router.put('/owners/:id/approve', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE USERS SET STATUS = 'APPROVED' WHERE USER_ID = :usid AND ROLE = 'OWNER'`,
      { usid: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Owner approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/admin/owners/:id/reject
router.put('/owners/:id/reject', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE USERS SET STATUS = 'REJECTED' WHERE USER_ID = :usid AND ROLE = 'OWNER'`,
      { usid: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Owner rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/admin/owners/:id — remove owner + all their restaurants
router.delete('/owners/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const id = Number(req.params.id);
    // Delete owner's restaurants (cascades to reviews, favorites, events, etc)
    await conn.execute(`DELETE FROM EVENTS WHERE OWNER_ID = :id`, { id }, { autoCommit: false });
    await conn.execute(`DELETE FROM UPDATE_REQUESTS WHERE OWNER_ID = :id`, { id }, { autoCommit: false });
    await conn.execute(
      `DELETE FROM FAVORITES WHERE RESTAURANT_ID IN (SELECT RESTAURANT_ID FROM RESTAURANTS WHERE ADDED_BY = :id)`,
      { id }, { autoCommit: false }
    );
    await conn.execute(
      `DELETE FROM REVIEWS WHERE RESTAURANT_ID IN (SELECT RESTAURANT_ID FROM RESTAURANTS WHERE ADDED_BY = :id)`,
      { id }, { autoCommit: false }
    );
    await conn.execute(
      `DELETE FROM RESTAURANT_CUISINE WHERE RESTAURANT_ID IN (SELECT RESTAURANT_ID FROM RESTAURANTS WHERE ADDED_BY = :id)`,
      { id }, { autoCommit: false }
    );
    await conn.execute(`DELETE FROM RESTAURANTS WHERE ADDED_BY = :id`, { id }, { autoCommit: false });
    await conn.execute(`DELETE FROM USERS WHERE USER_ID = :id AND ROLE = 'OWNER'`, { id }, { autoCommit: false });
    await conn.commit();
    res.json({ success: true, message: 'Owner and their restaurants deleted' });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ============================================================
// PENDING RESTAURANTS
// ============================================================

// GET /api/admin/pending — pending restaurants
router.get('/pending', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT r.RESTAURANT_ID, r.NAME, r.ADDRESS, r.LATITUDE, r.LONGITUDE,
              r.PRICE_RANGE, r.PHONE, r.WEBSITE, r.CREATED_AT,
              u.USERNAME AS SUBMITTED_BY
       FROM RESTAURANTS r
       LEFT JOIN USERS u ON r.ADDED_BY = u.USER_ID
       WHERE r.STATUS = 'PENDING'
       ORDER BY r.CREATED_AT ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/admin/restaurants/:id/approve
router.put('/restaurants/:id/approve', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE RESTAURANTS SET STATUS = 'APPROVED' WHERE RESTAURANT_ID = :id`,
      { id: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Restaurant approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/admin/restaurants/:id/reject
router.put('/restaurants/:id/reject', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE RESTAURANTS SET STATUS = 'REJECTED' WHERE RESTAURANT_ID = :id`,
      { id: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Restaurant rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/admin/restaurants/:id
router.delete('/restaurants/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const id = Number(req.params.id);
    await conn.execute(`DELETE FROM EVENTS WHERE RESTAURANT_ID = :id`, { id }, { autoCommit: false });
    await conn.execute(`DELETE FROM UPDATE_REQUESTS WHERE RESTAURANT_ID = :id`, { id }, { autoCommit: false });
    await conn.execute(`DELETE FROM FAVORITES WHERE RESTAURANT_ID = :id`, { id }, { autoCommit: false });
    await conn.execute(`DELETE FROM REVIEWS WHERE RESTAURANT_ID = :id`, { id }, { autoCommit: false });
    await conn.execute(`DELETE FROM RESTAURANT_CUISINE WHERE RESTAURANT_ID = :id`, { id }, { autoCommit: false });
    await conn.execute(`DELETE FROM RESTAURANTS WHERE RESTAURANT_ID = :id`, { id }, { autoCommit: false });
    await conn.commit();
    res.json({ success: true, message: 'Restaurant deleted' });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ============================================================
// PENDING REVIEWS
// ============================================================

router.get('/reviews/pending', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT rv.REVIEW_ID, rv.RATING, rv.REVIEW_TEXT, rv.CREATED_AT,
              rv.STATUS AS REVIEW_STATUS,
              u.USERNAME AS REVIEWER,
              r.NAME AS RESTAURANT_NAME, r.RESTAURANT_ID
       FROM REVIEWS rv
       JOIN USERS u ON rv.USER_ID = u.USER_ID
       JOIN RESTAURANTS r ON rv.RESTAURANT_ID = r.RESTAURANT_ID
       WHERE rv.STATUS = 'PENDING'
       ORDER BY rv.CREATED_AT ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

router.put('/reviews/:id/approve', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE REVIEWS SET STATUS = 'APPROVED' WHERE REVIEW_ID = :id`,
      { id: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Review approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

router.put('/reviews/:id/reject', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE REVIEWS SET STATUS = 'REJECTED' WHERE REVIEW_ID = :id`,
      { id: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Review rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ============================================================
// UPDATE REQUESTS
// ============================================================

// GET /api/admin/update-requests
router.get('/update-requests', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ur.REQUEST_ID, ur.RESTAURANT_ID, ur.FIELD_NAME,
              ur.OLD_VALUE, ur.NEW_VALUE, ur.STATUS, ur.CREATED_AT,
              r.NAME AS RESTAURANT_NAME,
              u.USERNAME AS OWNER_NAME
       FROM UPDATE_REQUESTS ur
       JOIN RESTAURANTS r ON ur.RESTAURANT_ID = r.RESTAURANT_ID
       JOIN USERS u ON ur.OWNER_ID = u.USER_ID
       WHERE ur.STATUS = 'PENDING'
       ORDER BY ur.CREATED_AT ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/admin/update-requests/:id/approve — apply the change
router.put('/update-requests/:id/approve', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const reqId = Number(req.params.id);

    // Get the request details
    const reqRes = await conn.execute(
      `SELECT RESTAURANT_ID, FIELD_NAME, NEW_VALUE FROM UPDATE_REQUESTS WHERE REQUEST_ID = :reqid AND STATUS = 'PENDING'`,
      { reqid: reqId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Update request not found' });
    }

    const { RESTAURANT_ID, FIELD_NAME, NEW_VALUE } = reqRes.rows[0];

    // Whitelist of updatable fields to prevent SQL injection
    const allowedFields = ['NAME', 'ADDRESS', 'PHONE', 'WEBSITE', 'PRICE_RANGE'];
    if (!allowedFields.includes(FIELD_NAME)) {
      return res.status(400).json({ success: false, message: 'Invalid field name' });
    }

    // Apply the update
    await conn.execute(
      `UPDATE RESTAURANTS SET ${FIELD_NAME} = :newval WHERE RESTAURANT_ID = :rsid`,
      { newval: NEW_VALUE, rsid: RESTAURANT_ID },
      { autoCommit: false }
    );

    // Mark request as approved
    await conn.execute(
      `UPDATE UPDATE_REQUESTS SET STATUS = 'APPROVED' WHERE REQUEST_ID = :reqid`,
      { reqid: reqId },
      { autoCommit: false }
    );

    await conn.commit();
    res.json({ success: true, message: `${FIELD_NAME} updated successfully` });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/admin/update-requests/:id/reject
router.put('/update-requests/:id/reject', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE UPDATE_REQUESTS SET STATUS = 'REJECTED' WHERE REQUEST_ID = :reqid`,
      { reqid: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Update request rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ============================================================
// ADMIN INVITES
// ============================================================

// GET /api/admin/users — list regular users for invite selection
router.get('/users', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT u.USER_ID, u.USERNAME, u.EMAIL, u.ROLE, u.CREATED_AT
       FROM USERS u
       WHERE u.ROLE = 'USER' AND u.STATUS = 'APPROVED'
       AND u.USER_ID NOT IN (
         SELECT INVITEE_ID FROM ADMIN_INVITES WHERE STATUS = 'PENDING'
       )
       ORDER BY u.USERNAME ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/admin/invites — send admin invite
router.post('/invites', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { user_id } = req.body;
    const invitedBy = req.authUser.userId;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }

    // Check user exists and is a regular USER
    const userCheck = await conn.execute(
      `SELECT ROLE FROM USERS WHERE USER_ID = :usid`,
      { usid: Number(user_id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (userCheck.rows[0].ROLE !== 'USER') {
      return res.status(400).json({ success: false, message: 'Can only invite regular users' });
    }

    const seqRes = await conn.execute(
      `SELECT SEQ_INVITE_ID.NEXTVAL AS NID FROM DUAL`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const newId = seqRes.rows[0].NID;

    await conn.execute(
      `INSERT INTO ADMIN_INVITES (INVITE_ID, INVITEE_ID, INVITED_BY, STATUS)
       VALUES (:invid, :invtee, :invby, 'PENDING')`,
      { invid: newId, invtee: Number(user_id), invby: Number(invitedBy) },
      { autoCommit: true }
    );

    res.status(201).json({ success: true, message: 'Admin invite sent' });
  } catch (err) {
    if (err.errorNum === 1 || (err.message && err.message.includes('ORA-00001'))) {
      return res.status(409).json({ success: false, message: 'User already has a pending invite' });
    }
    console.error('POST /admin/invites error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/admin/invites — list all invites
router.get('/invites', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ai.INVITE_ID, ai.STATUS, ai.CREATED_AT,
              u1.USERNAME AS INVITEE_NAME, u1.EMAIL AS INVITEE_EMAIL,
              u2.USERNAME AS INVITED_BY_NAME
       FROM ADMIN_INVITES ai
       JOIN USERS u1 ON ai.INVITEE_ID = u1.USER_ID
       JOIN USERS u2 ON ai.INVITED_BY = u2.USER_ID
       ORDER BY ai.CREATED_AT DESC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
