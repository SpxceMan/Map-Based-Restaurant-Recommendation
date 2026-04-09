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

    // Check restaurant status using function
    const statusResult = await conn.execute(
      `SELECT FN_RESTAURANT_STATUS(:rsid) AS STATUS FROM DUAL`,
      { rsid: Number(restaurant_id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const restStatus = statusResult.rows[0].STATUS;

    if (restStatus === null) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    if (restStatus !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot review a non-approved restaurant' });
    }

    // Check if review already exists using function
    const existsResult = await conn.execute(
      `SELECT FN_REVIEW_EXISTS(:rsid, :usid) AS REVIEW_ID FROM DUAL`,
      { rsid: Number(restaurant_id), usid: Number(user_id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const existingReviewId = existsResult.rows[0].REVIEW_ID;

    if (existingReviewId > 0) {
      // Update existing review using procedure
      await conn.execute(
        `BEGIN SP_UPDATE_REVIEW(:rsid, :usid, :rating, :rtxt); END;`,
        {
          rsid: Number(restaurant_id),
          usid: Number(user_id),
          rating: ratingNum,
          rtxt: comment || null
        },
        { autoCommit: true }
      );
      return res.json({ success: true, message: 'Review updated successfully' });
    }

    // Add new review using procedure
    await conn.execute(
      `BEGIN SP_ADD_REVIEW(:rsid, :usid, :rating, :rtxt, :new_id); END;`,
      {
        rsid: Number(restaurant_id),
        usid: Number(user_id),
        rating: ratingNum,
        rtxt: comment || null,
        new_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
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
      `SELECT REVIEW_ID, RATING, REVIEW_COMMENT, CREATED_AT, USERNAME, USER_ID
       FROM VW_RESTAURANT_REVIEWS
       WHERE RESTAURANT_ID = :rsid
       ORDER BY CREATED_AT DESC`,
      { rsid: Number(req.params.id) },
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