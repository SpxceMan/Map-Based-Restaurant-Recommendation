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
      `SELECT * FROM VW_PENDING_OWNERS ORDER BY CREATED_AT ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/admin/owners/active
router.get('/owners/active', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM VW_ACTIVE_OWNERS ORDER BY CREATED_AT ASC`,
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
      `BEGIN SP_APPROVE_OWNER(:usid); END;`,
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
      `BEGIN SP_REJECT_OWNER(:usid); END;`,
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
    await conn.execute(
      `BEGIN SP_DELETE_OWNER(:id); END;`,
      { id: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Owner and their restaurants deleted' });
  } catch (err) {
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
      `SELECT * FROM VW_PENDING_RESTAURANTS ORDER BY CREATED_AT ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/admin/restaurants/active — approved restaurants
router.get('/restaurants/active', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM VW_RESTAURANTS_WITH_RATING ORDER BY NAME ASC`,
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
      `BEGIN SP_APPROVE_RESTAURANT(:id); END;`,
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
      `BEGIN SP_REJECT_RESTAURANT(:id); END;`,
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
    await conn.execute(
      `BEGIN SP_DELETE_RESTAURANT(:id); END;`,
      { id: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Restaurant deleted' });
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
      `SELECT * FROM VW_PENDING_UPDATE_REQUESTS ORDER BY CREATED_AT ASC`,
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

    const result = await conn.execute(
      `BEGIN SP_APPLY_UPDATE_REQUEST(:reqid, :status, :field_name); END;`,
      {
        reqid: reqId,
        status: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 20 },
        field_name: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 50 }
      },
      { autoCommit: true }
    );

    const status = result.outBinds.status;
    const fieldName = result.outBinds.field_name;

    if (status === 'NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Update request not found' });
    }
    if (status === 'INVALID_FIELD') {
      return res.status(400).json({ success: false, message: 'Invalid field name' });
    }

    res.json({ success: true, message: `${fieldName} updated successfully` });
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
      `BEGIN SP_REJECT_UPDATE_REQUEST(:reqid); END;`,
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
      `SELECT * FROM VW_INVITABLE_USERS ORDER BY USERNAME ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/admin/users/all — list all active regular users
router.get('/users/all', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM VW_ALL_REGULAR_USERS ORDER BY CREATED_AT DESC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/admin/users/:id — remove user and their data
router.delete('/users/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN SP_DELETE_USER(:id); END;`,
      { id: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'User deleted' });
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

    // Check user role using function
    const roleResult = await conn.execute(
      `SELECT FN_GET_USER_ROLE(:usid) AS ROLE FROM DUAL`,
      { usid: Number(user_id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const userRole = roleResult.rows[0].ROLE;

    if (userRole === null) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (userRole !== 'USER') {
      return res.status(400).json({ success: false, message: 'Can only invite regular users' });
    }

    // Send invite using procedure
    await conn.execute(
      `BEGIN SP_SEND_ADMIN_INVITE(:invtee, :invby, :new_id); END;`,
      {
        invtee: Number(user_id),
        invby: Number(invitedBy),
        new_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
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
      `SELECT * FROM VW_ALL_INVITES ORDER BY CREATED_AT DESC`,
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
