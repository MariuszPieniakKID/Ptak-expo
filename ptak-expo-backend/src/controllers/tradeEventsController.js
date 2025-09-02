const db = require('../config/database');

// Validate and normalize input
const normalizeTime = (value) => {
  if (!value) return null;
  const parts = String(value).split(':');
  const [h, m = '00', s = '00'] = parts;
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
};

exports.listByExhibition = async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    const exhibitorId = req.query.exhibitorId ? parseInt(req.query.exhibitorId, 10) : null;
    console.log('🔍 [trade-events] listByExhibition', { exhibitionId, exhibitorId, user: req.user?.email });
    if (Number.isNaN(exhibitionId)) {
      return res.status(400).json({ success: false, message: 'Invalid exhibitionId' });
    }
    // If exhibitor role, force exhibitorId to self
    let effectiveExhibitorId = exhibitorId;
    if (req.user?.role === 'exhibitor') {
      // Map user email to exhibitor id
      const me = await db.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
      effectiveExhibitorId = me.rows?.[0]?.id || null;
    }
    const result = await db.query(
      `SELECT id, exhibition_id, exhibitor_id, name, event_date, start_time, end_time, hall, organizer, description, type
       FROM trade_events 
       WHERE exhibition_id = $1 
         AND ($2::int IS NULL OR exhibitor_id = $2)
       ORDER BY event_date ASC, start_time ASC`,
      [exhibitionId, effectiveExhibitorId]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ listByExhibition error:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas pobierania wydarzeń targowych' });
  }
};

exports.create = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    console.log('🔍 [trade-events] create request', { exhibitionId, body: req.body, user: req.user?.email });
    if (Number.isNaN(exhibitionId)) {
      return res.status(400).json({ success: false, message: 'Invalid exhibitionId' });
    }

    const { name, eventDate, startTime, endTime, hall, description, type, organizer } = req.body;
    let exhibitorId = req.body.exhibitorId ?? req.body.exhibitor_id ?? null;
    // If exhibitor role, force ownership
    if (req.user?.role === 'exhibitor') {
      const me = await db.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
      exhibitorId = me.rows?.[0]?.id ?? null;
    }
    if (!name || !eventDate || !startTime || !endTime || !type) {
      return res.status(400).json({ success: false, message: 'Brak wymaganych pól' });
    }

    // Ensure eventDate within exhibition range (inclusive)
    const expo = await db.query('SELECT start_date, end_date FROM exhibitions WHERE id = $1', [exhibitionId]);
    if (expo.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono wydarzenia głównego' });
    }
    const { start_date: startDate, end_date: endDate } = expo.rows[0];
    const d = new Date(eventDate);
    const s = new Date(startDate);
    const e = new Date(endDate);
    // Compare on date only (ignore time)
    const onlyDate = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
    if (onlyDate(d) < onlyDate(s) || onlyDate(d) > onlyDate(e)) {
      console.log('⚠️  [trade-events] date out of range', { eventDate, startDate, endDate });
      return res.status(400).json({ success: false, message: 'Data wydarzenia musi mieścić się w zakresie dat targów' });
    }

    const normStart = normalizeTime(startTime);
    const normEnd = normalizeTime(endTime);

    await client.query('BEGIN');
    const insert = await client.query(
      `INSERT INTO trade_events (exhibition_id, exhibitor_id, name, event_date, start_time, end_time, hall, organizer, description, type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [exhibitionId, exhibitorId || null, name, eventDate, normStart, normEnd, hall || null, organizer || null, description || null, type]
    );
    await client.query('COMMIT');
    console.log('✅ [trade-events] created', insert.rows[0]);
    return res.json({ success: true, data: insert.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ create trade_event error:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas zapisywania wydarzenia targowego' });
  } finally {
    client.release();
  }
};

exports.remove = async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    const eventId = parseInt(req.params.eventId, 10);
    console.log('🗑️  [trade-events] delete request', { exhibitionId, eventId, user: req.user?.email });
    if (Number.isNaN(exhibitionId) || Number.isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }
    const del = await db.query(
      'DELETE FROM trade_events WHERE id = $1 AND exhibition_id = $2 RETURNING *',
      [eventId, exhibitionId]
    );
    if (del.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono wydarzenia do usunięcia' });
    }
    console.log('✅ [trade-events] deleted', del.rows[0]);
    return res.json({ success: true, message: 'Usunięto wydarzenie', data: del.rows[0] });
  } catch (error) {
    console.error('❌ delete trade_event error:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas usuwania wydarzenia targowego' });
  }
};


// Update trade event (admin only)
exports.update = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    const eventId = parseInt(req.params.eventId, 10);
    if (Number.isNaN(exhibitionId) || Number.isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }

    const { name, eventDate, startTime, endTime, hall, description, type, organizer } = req.body;
    // We require basic fields for consistency with create
    if (!name || !eventDate || !startTime || !endTime || !type) {
      return res.status(400).json({ success: false, message: 'Brak wymaganych pól' });
    }

    // Ensure event exists and belongs to exhibition
    const existing = await db.query('SELECT id FROM trade_events WHERE id = $1 AND exhibition_id = $2', [eventId, exhibitionId]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono wydarzenia' });
    }

    // Ensure eventDate within exhibition range (inclusive)
    const expo = await db.query('SELECT start_date, end_date FROM exhibitions WHERE id = $1', [exhibitionId]);
    if (expo.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono wydarzenia głównego' });
    }
    const { start_date: startDate, end_date: endDate } = expo.rows[0];
    const d = new Date(eventDate);
    const s = new Date(startDate);
    const e = new Date(endDate);
    const onlyDate = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
    if (onlyDate(d) < onlyDate(s) || onlyDate(d) > onlyDate(e)) {
      return res.status(400).json({ success: false, message: 'Data wydarzenia musi mieścić się w zakresie dat targów' });
    }

    const normStart = normalizeTime(startTime);
    const normEnd = normalizeTime(endTime);

    await client.query('BEGIN');
    const upd = await client.query(
      `UPDATE trade_events
       SET name = $1,
           event_date = $2,
           start_time = $3,
           end_time = $4,
           hall = $5,
           organizer = $6,
           description = $7,
           type = $8,
           updated_at = NOW()
       WHERE id = $9 AND exhibition_id = $10
       RETURNING *`,
      [name, eventDate, normStart, normEnd, hall || null, organizer || null, description || null, type, eventId, exhibitionId]
    );
    await client.query('COMMIT');
    return res.json({ success: true, data: upd.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ update trade_event error:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas aktualizacji wydarzenia targowego' });
  } finally {
    client.release();
  }
};

