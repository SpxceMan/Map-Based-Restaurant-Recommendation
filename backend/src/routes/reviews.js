const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { requireAuth } = require('../middleware/auth');

// POST /api/reviews
router.post('/', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { restaurant_id, rating, comment } = req.body;
    const user_id = req.authUser.userId;
    const user_role = req.authUser.role;

    if (user_role !== 'USER') {
      return res.status(403).json({ success: false, message: 'Only customers can leave reviews' });
    }

    if (!restaurant_id || !rating) {
      return res.status(400).json({ success: false, message: 'Missing required fields: restaurant_id, rating' });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // CRITICAL: :uid is an Oracle reserved word (pseudocolumn = current session user ID).
    // :rid is also potentially unsafe. Use fully prefixed unique names: :rvrid, :rvuid etc.
    const restCheck = await conn.execute(
      `SELECT STATUS FROM RESTAURANTS WHERE RESTAURANT_ID = :rvrid`,
      { rvrid: Number(restaurant_id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (restCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    if (restCheck.rows[0].STATUS !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot review a non-approved restaurant' });
    }

    const dupCheck = await conn.execute(
      `SELECT REVIEW_ID FROM REVIEWS WHERE RESTAURANT_ID = :rvrid AND USER_ID = :rvuid`,
      { rvrid: Number(restaurant_id), rvuid: Number(user_id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (dupCheck.rows.length > 0) {
      await conn.execute(
        `UPDATE REVIEWS
         SET RATING = :rvrat, REVIEW_TEXT = :rvtxt, STATUS = 'APPROVED', CREATED_AT = SYSTIMESTAMP
         WHERE RESTAURANT_ID = :rvrid AND USER_ID = :rvuid`,
        {
          rvrat: ratingNum,
          rvtxt: comment || null,
          rvrid: Number(restaurant_id),
          rvuid: Number(user_id)
        },
        { autoCommit: true }
      );
      return res.json({ success: true, message: 'Review updated successfully' });
    }

    const seqRes = await conn.execute(
      `SELECT SEQ_REVIEW_ID.NEXTVAL AS NID FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const newId = seqRes.rows[0].NID;

    await conn.execute(
      `INSERT INTO REVIEWS (REVIEW_ID, RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT, STATUS)
       VALUES (:rvid, :rvrid, :rvuid, :rvrat, :rvtxt, 'APPROVED')`,
      {
        rvid:  newId,
        rvrid: Number(restaurant_id),
        rvuid: Number(user_id),
        rvrat: ratingNum,
        rvtxt: comment || null
      },
      { autoCommit: true }
    );

    res.status(201).json({ success: true, message: 'Review published!' });
  } catch (err) {
    console.error('POST /reviews error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/reviews/restaurant/:id
router.get('/restaurant/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT rv.REVIEW_ID, rv.RATING, rv.REVIEW_TEXT AS "REVIEW_COMMENT", rv.CREATED_AT,
              u.USERNAME, u.USER_ID
       FROM REVIEWS rv
       JOIN USERS u ON rv.USER_ID = u.USER_ID
       WHERE rv.RESTAURANT_ID = :rvrid AND rv.STATUS = 'APPROVED'
       ORDER BY rv.CREATED_AT DESC`,
      { rvrid: Number(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /reviews/restaurant/:id error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;