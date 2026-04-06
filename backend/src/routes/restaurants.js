const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');

// STEP 2 + 4: GET /api/restaurants
// Returns restaurant_id, name, latitude, longitude, price_range, avg_rating (computed via SQL AVG)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT
         r.RESTAURANT_ID,
         r.NAME,
         r.LATITUDE,
         r.LONGITUDE,
         r.ADDRESS,
         r.PRICE_RANGE,
         r.PHONE,
         r.WEBSITE,
         ROUND(NVL(AVG(rv.RATING), 0), 1) AS AVG_RATING,
         COUNT(rv.REVIEW_ID)              AS REVIEW_COUNT
       FROM RESTAURANTS r
       LEFT JOIN REVIEWS rv ON r.RESTAURANT_ID = rv.RESTAURANT_ID
       WHERE r.STATUS = 'APPROVED'
       GROUP BY
         r.RESTAURANT_ID, r.NAME, r.LATITUDE, r.LONGITUDE,
         r.ADDRESS, r.PRICE_RANGE, r.PHONE, r.WEBSITE
       ORDER BY AVG_RATING DESC, r.NAME ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /restaurants error:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/restaurants/:id — single restaurant detail + cuisines + reviews
router.get('/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { id } = req.params;

    const result = await conn.execute(
      `SELECT
         r.RESTAURANT_ID, r.NAME, r.LATITUDE, r.LONGITUDE,
         r.ADDRESS, r.PRICE_RANGE, r.PHONE, r.WEBSITE,
         ROUND(NVL(AVG(rv.RATING), 0), 1) AS AVG_RATING,
         COUNT(rv.REVIEW_ID)              AS REVIEW_COUNT
       FROM RESTAURANTS r
       LEFT JOIN REVIEWS rv ON r.RESTAURANT_ID = rv.RESTAURANT_ID
       WHERE r.RESTAURANT_ID = :id AND r.STATUS = 'APPROVED'
       GROUP BY
         r.RESTAURANT_ID, r.NAME, r.LATITUDE, r.LONGITUDE,
         r.ADDRESS, r.PRICE_RANGE, r.PHONE, r.WEBSITE`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const restaurant = result.rows[0];

    const cuisineResult = await conn.execute(
      `SELECT c.NAME FROM CUISINES c
       JOIN RESTAURANT_CUISINE rc ON c.CUISINE_ID = rc.CUISINE_ID
       WHERE rc.RESTAURANT_ID = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    restaurant.CUISINES = cuisineResult.rows.map(c => c.NAME);

    const reviewResult = await conn.execute(
      `SELECT rv.RATING, rv.COMMENT, rv.CREATED_AT, u.USERNAME
       FROM REVIEWS rv JOIN USERS u ON rv.USER_ID = u.USER_ID
       WHERE rv.RESTAURANT_ID = :id
       ORDER BY rv.CREATED_AT DESC`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    restaurant.REVIEWS = reviewResult.rows;

    res.json({ success: true, data: restaurant });
  } catch (err) {
    console.error('GET /restaurants/:id error:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/restaurants — submit new restaurant (pending approval)
router.post('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { name, latitude, longitude, address, price_range, phone, website, user_id } = req.body;

    if (!name || !latitude || !longitude || !address) {
      return res.status(400).json({ success: false, message: 'name, latitude, longitude, address are required' });
    }

    const result = await conn.execute(
      `INSERT INTO RESTAURANTS (NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, WEBSITE, ADDED_BY, STATUS)
       VALUES (:name, :lat, :lng, :address, :price_range, :phone, :website, :user_id, 'PENDING')
       RETURNING RESTAURANT_ID INTO :id`,
      {
        name, lat: latitude, lng: longitude, address,
        price_range: price_range || '$$',
        phone: phone || null,
        website: website || null,
        user_id: user_id || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    res.status(201).json({
      success: true,
      message: 'Restaurant submitted for approval',
      restaurant_id: result.outBinds.id[0]
    });
  } catch (err) {
    console.error('POST /restaurants error:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
