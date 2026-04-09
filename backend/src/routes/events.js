const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/connection');
const oracledb = require('oracledb');
const { requireAuth } = require('../middleware/auth');

// GET /api/events — all upcoming/ongoing events (public)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM VW_ACTIVE_EVENTS ORDER BY EVENT_DATE ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /events error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/events/restaurant/:id — events for a specific restaurant (public)
router.get('/restaurant/:id', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT EVENT_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS, CREATED_AT
       FROM VW_RESTAURANT_EVENTS
       WHERE RESTAURANT_ID = :rsid
       ORDER BY EVENT_DATE ASC`,
      { rsid: Number(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /events/restaurant/:id error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/events — owner creates an event (no admin approval needed)
router.post('/', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { restaurant_id, event_name, description, event_date } = req.body;
    const user_id = req.authUser.userId;
    const user_role = req.authUser.role;

    if (user_role !== 'OWNER' && user_role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only owners can create events' });
    }

    if (!restaurant_id || !event_name || !event_date) {
      return res.status(400).json({ success: false, message: 'restaurant_id, event_name, and event_date are required' });
    }

    // Verify the owner owns this restaurant using function
    if (user_role === 'OWNER') {
      const ownerResult = await conn.execute(
        `SELECT FN_RESTAURANT_OWNER(:rsid) AS OWNER_ID FROM DUAL`,
        { rsid: Number(restaurant_id) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const ownerId = ownerResult.rows[0].OWNER_ID;

      if (ownerId === null) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }
      if (ownerId !== user_id) {
        return res.status(403).json({ success: false, message: 'You can only create events for your own restaurants' });
      }
    }

    // Create event using procedure
    const result = await conn.execute(
      `BEGIN SP_ADD_EVENT(:rsid, :owid, :evnm, :evdesc, :evdt, :new_id); END;`,
      {
        rsid: Number(restaurant_id),
        owid: Number(user_id),
        evnm: event_name,
        evdesc: description || null,
        evdt: event_date,
        new_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );

    const newId = result.outBinds.new_id;
    res.status(201).json({ success: true, message: 'Event created!', event_id: newId });
  } catch (err) {
    console.error('POST /events error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/events/:id — owner cancels event
router.delete('/:id', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const user_id = req.authUser.userId;
    const user_role = req.authUser.role;

    // Check event ownership using function (only for OWNER role)
    if (user_role === 'OWNER') {
      const ownerResult = await conn.execute(
        `SELECT FN_EVENT_OWNER(:evid) AS OWNER_ID FROM DUAL`,
        { evid: Number(req.params.id) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const eventOwnerId = ownerResult.rows[0].OWNER_ID;

      if (eventOwnerId === null) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      if (eventOwnerId !== user_id) {
        return res.status(403).json({ success: false, message: 'You can only delete your own events' });
      }
    }

    // Delete event using procedure
    await conn.execute(
      `BEGIN SP_DELETE_EVENT(:evid); END;`,
      { evid: Number(req.params.id) },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    console.error('DELETE /events/:id error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/events/:id — owner updates event
router.put('/:id', requireAuth, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const user_id = req.authUser.userId;
    const user_role = req.authUser.role;
    const event_id = Number(req.params.id);
    const { event_name, description, event_date, status } = req.body;

    // Check event ownership
    if (user_role === 'OWNER') {
      const ownerResult = await conn.execute(
        `SELECT FN_EVENT_OWNER(:evid) AS OWNER_ID FROM DUAL`,
        { evid: event_id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const eventOwnerId = ownerResult.rows[0].OWNER_ID;

      if (eventOwnerId === null) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }
      if (eventOwnerId !== user_id) {
        return res.status(403).json({ success: false, message: 'You can only update your own events' });
      }
    }

    await conn.execute(
      `BEGIN SP_UPDATE_EVENT(:evid, :enm, :edesc, :edt, :estatus); END;`,
      {
        evid: event_id,
        enm: event_name,
        edesc: description || null,
        edt: event_date,
        estatus: status || 'UPCOMING'
      },
      { autoCommit: true }
    );
    res.json({ success: true, message: 'Event updated successfully' });
  } catch (err) {
    console.error('PUT /events/:id error:', err);
    res.status(500).json({ success: false, message: err.message || 'Database error' });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
