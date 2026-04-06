const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { requireAuth } = require('../middleware/auth');

// GET /api/restaurants — public
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

    const restaurants = result.rows;

    // Attach cuisine arrays to each restaurant
    if (restaurants.length > 0) {
      const ids = restaurants.map(r => r.RESTAURANT_ID);
      // Oracle doesn't support IN (:array) directly, use a subquery approach
      const placeholders = ids.map((_, i) => `:id${i}`).join(',');
      const binds = {};
      ids.forEach((id, i) => { binds[`id${i}`] = id; });

      const cuisineResult = await conn.execute(
        `SELECT rc.RESTAURANT_ID, c.NAME
         FROM RESTAURANT_CUISINE rc
         JOIN CUISINES c ON rc.CUISINE_ID = c.CUISINE_ID
         WHERE rc.RESTAURANT_ID IN (${placeholders})`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      // Group cuisines by restaurant ID
      const cuisineMap = {};
      cuisineResult.rows.forEach(row => {
        if (!cuisineMap[row.RESTAURANT_ID]) cuisineMap[row.RESTAURANT_ID] = [];
        cuisineMap[row.RESTAURANT_ID].push(row.NAME);
      });
      restaurants.forEach(r => { r.CUISINES = cuisineMap[r.RESTAURANT_ID] || []; });
    }

    res.json({ success: true, data: restaurants });
  } catch (err) {
    console.error('GET /restaurants error:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/restaurants/:id — public
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
      `SELECT rv.RATING, rv.REVIEW_TEXT AS COMMENT, rv.CREATED_AT, u.USERNAME
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

// POST /api/restaurants — admin only (auth required)
router.post('/', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { name, latitude, longitude, address, price_range, phone, website } = req.body;
    const user_id = req.authUser.userId; // from verified token

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
        user_id,
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
