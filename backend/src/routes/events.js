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
      `SELECT e.EVENT_ID, e.RESTAURANT_ID, e.EVENT_NAME, e.DESCRIPTION,
              e.EVENT_DATE, e.STATUS,
              r.NAME AS RESTAURANT_NAME
       FROM EVENTS e
       JOIN RESTAURANTS r ON e.RESTAURANT_ID = r.RESTAURANT_ID
       WHERE e.STATUS IN ('UPCOMING', 'ONGOING') AND r.STATUS = 'APPROVED'
       ORDER BY e.EVENT_DATE ASC`,
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
       FROM EVENTS
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

    // Verify the owner owns this restaurant
    if (user_role === 'OWNER') {
      const ownerCheck = await conn.execute(
        `SELECT ADDED_BY FROM RESTAURANTS WHERE RESTAURANT_ID = :rsid AND STATUS = 'APPROVED'`,
        { rsid: Number(restaurant_id) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
      }
      if (ownerCheck.rows[0].ADDED_BY !== user_id) {
        return res.status(403).json({ success: false, message: 'You can only create events for your own restaurants' });
      }
    }

    const seqRes = await conn.execute(
      `SELECT SEQ_EVENT_ID.NEXTVAL AS NID FROM DUAL`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const newId = seqRes.rows[0].NID;

    await conn.execute(
      `INSERT INTO EVENTS (EVENT_ID, RESTAURANT_ID, OWNER_ID, EVENT_NAME, DESCRIPTION, EVENT_DATE, STATUS)
       VALUES (:evid, :rsid, :owid, :evnm, :evdesc, TO_DATE(:evdt, 'YYYY-MM-DD'), 'UPCOMING')`,
      {
        evid: newId,
        rsid: Number(restaurant_id),
        owid: Number(user_id),
        evnm: event_name,
        evdesc: description || null,
        evdt: event_date
      },
      { autoCommit: true }
    );

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

    if (user_role === 'OWNER') {
      const check = await conn.execute(
        `SELECT OWNER_ID FROM EVENTS WHERE EVENT_ID = :evid`,
        { evid: Number(req.params.id) },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Event not found' });
      if (check.rows[0].OWNER_ID !== user_id) {
        return res.status(403).json({ success: false, message: 'You can only delete your own events' });
      }
    }

    await conn.execute(
      `DELETE FROM EVENTS WHERE EVENT_ID = :evid`,
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

module.exports = router;
