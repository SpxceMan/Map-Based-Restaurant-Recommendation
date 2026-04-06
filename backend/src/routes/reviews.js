const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { requireAuth } = require('../middleware/auth');

// POST /api/reviews - Submit a review (auth required)
router.post('/', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { restaurant_id, rating, comment } = req.body;
    const user_id = req.authUser.userId; // from verified token, not client body

    if (!restaurant_id || !rating) {
      return res.status(400).json({ success: false, message: 'Missing required fields: restaurant_id, rating' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const restCheck = await conn.execute(
      `SELECT STATUS FROM RESTAURANTS WHERE RESTAURANT_ID = :id`,
      [restaurant_id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (restCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    if (restCheck.rows[0].STATUS !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot review a non-approved restaurant' });
    }

    const dupCheck = await conn.execute(
      `SELECT REVIEW_ID FROM REVIEWS WHERE RESTAURANT_ID = :rid AND USER_ID = :uid`,
      [restaurant_id, user_id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (dupCheck.rows.length > 0) {
      await conn.execute(
        `UPDATE REVIEWS SET RATING = :rating, REVIEW_TEXT = :review_text, CREATED_AT = SYSDATE
         WHERE RESTAURANT_ID = :rid AND USER_ID = :uid`,
        { rating, review_text: comment || null, rid: restaurant_id, uid: user_id },
        { autoCommit: true }
      );
      return res.json({ success: true, message: 'Review updated successfully' });
    }

    await conn.execute(
      `INSERT INTO REVIEWS (RESTAURANT_ID, USER_ID, RATING, REVIEW_TEXT)
       VALUES (:rid, :uid, :rating, :review_text)`,
      { rid: restaurant_id, uid: user_id, rating, review_text: comment || null },
      { autoCommit: true }
    );

    res.status(201).json({ success: true, message: 'Review submitted successfully' });
  } catch (err) {
    console.error('POST /reviews error:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/reviews/restaurant/:id - public
router.get('/restaurant/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT rv.REVIEW_ID, rv.RATING, rv.REVIEW_TEXT AS COMMENT, rv.CREATED_AT,
              u.USERNAME, u.USER_ID
       FROM REVIEWS rv
       JOIN USERS u ON rv.USER_ID = u.USER_ID
       WHERE rv.RESTAURANT_ID = :id
       ORDER BY rv.CREATED_AT DESC`,
      [req.params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /reviews/restaurant/:id error:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
