const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { requireOwner, requireAuth } = require('../middleware/auth');

// GET /api/restaurants — public, approved only
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT
         r.RESTAURANT_ID, r.NAME, r.LATITUDE, r.LONGITUDE,
         r.ADDRESS, r.PRICE_RANGE, r.PHONE, r.WEBSITE,
         ROUND(NVL(AVG(rv.RATING), 0), 1) AS AVG_RATING,
         COUNT(rv.REVIEW_ID) AS REVIEW_COUNT
       FROM RESTAURANTS r
       LEFT JOIN REVIEWS rv ON r.RESTAURANT_ID = rv.RESTAURANT_ID AND rv.STATUS = 'APPROVED'
       WHERE r.STATUS = 'APPROVED'
       GROUP BY
         r.RESTAURANT_ID, r.NAME, r.LATITUDE, r.LONGITUDE,
         r.ADDRESS, r.PRICE_RANGE, r.PHONE, r.WEBSITE
       ORDER BY AVG_RATING DESC, r.NAME ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const restaurants = result.rows;

    if (restaurants.length > 0) {
      const ids = restaurants.map(r => r.RESTAURANT_ID);
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
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/restaurants/:id — public
router.get('/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT
         r.RESTAURANT_ID, r.NAME, r.LATITUDE, r.LONGITUDE,
         r.ADDRESS, r.PRICE_RANGE, r.PHONE, r.WEBSITE,
         ROUND(NVL(AVG(rv.RATING), 0), 1) AS AVG_RATING,
         COUNT(rv.REVIEW_ID) AS REVIEW_COUNT
       FROM RESTAURANTS r
       LEFT JOIN REVIEWS rv ON r.RESTAURANT_ID = rv.RESTAURANT_ID AND rv.STATUS = 'APPROVED'
       WHERE r.RESTAURANT_ID = :rsid AND r.STATUS = 'APPROVED'
       GROUP BY
         r.RESTAURANT_ID, r.NAME, r.LATITUDE, r.LONGITUDE,
         r.ADDRESS, r.PRICE_RANGE, r.PHONE, r.WEBSITE`,
      { rsid: Number(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const restaurant = result.rows[0];
    const cuisineResult = await conn.execute(
      `SELECT c.NAME FROM CUISINES c
       JOIN RESTAURANT_CUISINE rc ON c.CUISINE_ID = rc.CUISINE_ID
       WHERE rc.RESTAURANT_ID = :rsid`,
      { rsid: Number(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    restaurant.CUISINES = cuisineResult.rows.map(c => c.NAME);

    res.json({ success: true, data: restaurant });
  } catch (err) {
    console.error('GET /restaurants/:id error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/restaurants — OWNER only
router.post('/', requireOwner, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { name, latitude, longitude, address, price_range, phone, website, cuisines } = req.body;
    const user_id = req.authUser.userId;

    if (!name || !latitude || !longitude || !address) {
      return res.status(400).json({ success: false, message: 'name, latitude, longitude, address are required' });
    }

    // Sync sequence past current max to avoid ORA-00001 on PK after failed retries
    const maxRes = await conn.execute(
      `SELECT NVL(MAX(RESTAURANT_ID), 0) AS MAXID FROM RESTAURANTS`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const maxId = maxRes.rows[0].MAXID;

    let newId;
    // Keep pulling NEXTVAL until we're safely past the current max
    do {
      const seqRes = await conn.execute(
        `SELECT SEQ_RESTAURANT_ID.NEXTVAL AS NID FROM DUAL`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      newId = seqRes.rows[0].NID;
    } while (newId <= maxId);

    // CRITICAL: :uid, :rid, :name are Oracle reserved words.
    // All bind names use prefix 'rs' (restaurant) to guarantee no conflicts.
    await conn.execute(
      `INSERT INTO RESTAURANTS
         (RESTAURANT_ID, NAME, LATITUDE, LONGITUDE, ADDRESS, PRICE_RANGE, PHONE, WEBSITE, ADDED_BY, STATUS)
       VALUES
         (:rsid, :rsnm, :rslat, :rslng, :rsaddr, :rsprc, :rsph, :rsweb, :rsuid, 'PENDING')`,
      {
        rsid:  newId,
        rsnm:  name,
        rslat: parseFloat(latitude),
        rslng: parseFloat(longitude),
        rsaddr: address,
        rsprc: price_range || '$$',
        rsph:  phone || null,
        rsweb: website || null,
        rsuid: Number(user_id)
      },
      { autoCommit: false }
    );

    // Link cuisines by name lookup
    if (cuisines && cuisines.length > 0) {
      for (const cuisineName of cuisines) {
        const cRes = await conn.execute(
          `SELECT CUISINE_ID FROM CUISINES WHERE UPPER(NAME) = UPPER(:csnm)`,
          { csnm: cuisineName },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (cRes.rows.length > 0) {
          await conn.execute(
            `INSERT INTO RESTAURANT_CUISINE (RESTAURANT_ID, CUISINE_ID) VALUES (:rsid, :csid)`,
            { rsid: newId, csid: cRes.rows[0].CUISINE_ID },
            { autoCommit: false }
          );
        }
      }
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'Restaurant submitted for admin approval', restaurant_id: newId });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
    console.error('POST /restaurants error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});
// PUT /api/restaurants/:id — Owner submits update request (per-field)
router.put('/:id', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const user_id = req.authUser.userId;
    const user_role = req.authUser.role;
    const restaurantId = Number(req.params.id);

    if (user_role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Only owners can request updates' });
    }

    // Verify ownership
    const ownerCheck = await conn.execute(
      `SELECT NAME, ADDRESS, PHONE, WEBSITE, PRICE_RANGE, ADDED_BY
       FROM RESTAURANTS WHERE RESTAURANT_ID = :rsid AND STATUS = 'APPROVED'`,
      { rsid: restaurantId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    if (ownerCheck.rows[0].ADDED_BY !== user_id) {
      return res.status(403).json({ success: false, message: 'You can only update your own restaurants' });
    }

    const current = ownerCheck.rows[0];
    const { name, address, phone, website, price_range } = req.body;
    const updatableFields = { NAME: name, ADDRESS: address, PHONE: phone, WEBSITE: website, PRICE_RANGE: price_range };

    let requestCount = 0;
    for (const [field, newValue] of Object.entries(updatableFields)) {
      if (newValue !== undefined && newValue !== current[field]) {
        const seqRes = await conn.execute(
          `SELECT SEQ_REQUEST_ID.NEXTVAL AS NID FROM DUAL`,
          [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        await conn.execute(
          `INSERT INTO UPDATE_REQUESTS (REQUEST_ID, RESTAURANT_ID, OWNER_ID, FIELD_NAME, OLD_VALUE, NEW_VALUE, STATUS)
           VALUES (:reqid, :rsid, :owid, :fld, :oldv, :newv, 'PENDING')`,
          {
            reqid: seqRes.rows[0].NID,
            rsid: restaurantId,
            owid: user_id,
            fld: field,
            oldv: current[field] || null,
            newv: newValue || null
          },
          { autoCommit: false }
        );
        requestCount++;
      }
    }

    if (requestCount === 0) {
      return res.json({ success: true, message: 'No changes detected' });
    }

    await conn.commit();
    res.json({ success: true, message: `${requestCount} update request(s) submitted for admin review` });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) {} }
    console.error('PUT /restaurants/:id error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;