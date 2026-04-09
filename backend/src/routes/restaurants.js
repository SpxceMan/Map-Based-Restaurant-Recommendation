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
      `SELECT * FROM VW_RESTAURANTS_WITH_RATING
       ORDER BY AVG_RATING DESC, NAME ASC`,
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
        `SELECT RESTAURANT_ID, NAME
         FROM VW_RESTAURANT_CUISINES
         WHERE RESTAURANT_ID IN (${placeholders})`,
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
      `SELECT * FROM VW_RESTAURANTS_WITH_RATING
       WHERE RESTAURANT_ID = :rsid`,
      { rsid: Number(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const restaurant = result.rows[0];
    const cuisineResult = await conn.execute(
      `SELECT NAME FROM VW_RESTAURANT_CUISINES
       WHERE RESTAURANT_ID = :rsid`,
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

    // Use SP_ADD_RESTAURANT procedure (handles seq sync + cuisine linking)
    const result = await conn.execute(
      `BEGIN SP_ADD_RESTAURANT(:rsnm, :rslat, :rslng, :rsaddr, :rsprc, :rsph, :rsweb, :rsuid, :cuis, :new_id); END;`,
      {
        rsnm: name,
        rslat: parseFloat(latitude),
        rslng: parseFloat(longitude),
        rsaddr: address,
        rsprc: price_range || '$$',
        rsph: phone || null,
        rsweb: website || null,
        rsuid: Number(user_id),
        cuis: cuisines && cuisines.length > 0 ? cuisines.join(',') : null,
        new_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    const newId = result.outBinds.new_id;

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

    // Verify ownership using VW_RESTAURANT_EDIT_INFO view
    const ownerCheck = await conn.execute(
      `SELECT * FROM VW_RESTAURANT_EDIT_INFO WHERE RESTAURANT_ID = :rsid`,
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
        // Use SP_CREATE_UPDATE_REQUEST procedure
        await conn.execute(
          `BEGIN SP_CREATE_UPDATE_REQUEST(:rsid, :owid, :fld, :oldv, :newv, :new_id); END;`,
          {
            rsid: restaurantId,
            owid: user_id,
            fld: field,
            oldv: current[field] || null,
            newv: newValue || null,
            new_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
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