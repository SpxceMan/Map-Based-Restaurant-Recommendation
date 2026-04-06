const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { requireAdmin } = require('../middleware/auth');

// All admin routes require ADMIN role
router.use(requireAdmin);

// GET /api/admin/pending
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
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
      [req.params.id],
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Restaurant approved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
      [req.params.id],
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Restaurant rejected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/admin/restaurants/:id
router.delete('/restaurants/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(`DELETE FROM FAVORITES WHERE RESTAURANT_ID = :id`, [req.params.id], { autoCommit: true });
    await conn.execute(`DELETE FROM REVIEWS WHERE RESTAURANT_ID = :id`, [req.params.id], { autoCommit: true });
    await conn.execute(`DELETE FROM RESTAURANT_CUISINE WHERE RESTAURANT_ID = :id`, [req.params.id], { autoCommit: true });
    await conn.execute(`DELETE FROM RESTAURANTS WHERE RESTAURANT_ID = :id`, [req.params.id], { autoCommit: true });
    res.json({ success: true, message: 'Restaurant deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
