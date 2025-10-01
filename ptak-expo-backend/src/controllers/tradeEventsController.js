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
    let result;
    if (req.user?.role === 'exhibitor') {
      // Map user email to exhibitor id
      const me = await db.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
      effectiveExhibitorId = me.rows?.[0]?.id || null;
      // Exhibitor should see official events (exhibitor_id IS NULL) and their own
      result = await db.query(
        `SELECT t.id, t.exhibition_id, t.exhibitor_id, t.name, t.event_date, t.start_time, t.end_time, t.hall, t.organizer, t.description, t.type, t.link, t.event_source,
                ea.stand_number as booth_number
         FROM trade_events t
         LEFT JOIN event_assignments ea ON t.exhibitor_id = ea.exhibitor_id AND t.exhibition_id = ea.exhibition_id
         WHERE t.exhibition_id = $1 
           AND (t.exhibitor_id IS NULL OR t.exhibitor_id = $2)
         ORDER BY t.event_date ASC, t.start_time ASC`,
        [exhibitionId, effectiveExhibitorId]
      );
    } else {
      // Admin/others: allow optional exhibitor filter
      result = await db.query(
        `SELECT t.id, t.exhibition_id, t.exhibitor_id, t.name, t.event_date, t.start_time, t.end_time, t.hall, t.organizer, t.description, t.type, t.link, t.event_source,
                ea.stand_number as booth_number
         FROM trade_events t
         LEFT JOIN event_assignments ea ON t.exhibitor_id = ea.exhibitor_id AND t.exhibition_id = ea.exhibition_id
         WHERE t.exhibition_id = $1 
           AND ($2::int IS NULL OR t.exhibitor_id = $2)
         ORDER BY t.event_date ASC, t.start_time ASC`,
        [exhibitionId, effectiveExhibitorId]
      );
    }
    // Convert event_date from Date object to YYYY-MM-DD string
    const formattedRows = result.rows.map(row => ({
      ...row,
      event_date: row.event_date instanceof Date 
        ? row.event_date.toISOString().slice(0, 10) 
        : (row.event_date || '').toString().slice(0, 10)
    }));
    console.log('📅 [trade-events] Sample formatted event:', formattedRows[0]);
    return res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('❌ listByExhibition error:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas pobierania wydarzeń targowych' });
  }
};

exports.create = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    // Minimal log; detailed debug removed
    if (Number.isNaN(exhibitionId)) {
      return res.status(400).json({ success: false, message: 'Invalid exhibitionId' });
    }

    const { name, eventDate, startTime, endTime, hall, description, type, organizer, link, eventSource } = req.body;
    let exhibitorId = req.body.exhibitorId ?? req.body.exhibitor_id ?? null;
    const event_source = eventSource || 'official_events'; // Default to official_events if not specified
    // If exhibitor role, force ownership
    if (req.user?.role === 'exhibitor') {
      const me = await db.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
      exhibitorId = me.rows?.[0]?.id ?? null;
    }
    if (!name || !eventDate || !startTime || !endTime || !type) {
      return res.status(400).json({ success: false, message: 'Brak wymaganych pól' });
    }

    // Accept any eventDate without limiting to exhibition range
    const toDateOnly = (v) => {
      if (!v) return '';
      if (v instanceof Date) {
        const y = v.getFullYear();
        const m = String(v.getMonth() + 1).padStart(2, '0');
        const d = String(v.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      const s = String(v);
      const match = s.match(/\d{4}-\d{2}-\d{2}/);
      if (match) return match[0];
      const parsed = new Date(s);
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
    };
    const eventDateStr = toDateOnly(eventDate);
    if (!eventDateStr) {
      return res.status(400).json({ success: false, message: 'Nieprawidłowa data wydarzenia' });
    }

    const normStart = normalizeTime(startTime);
    const normEnd = normalizeTime(endTime);

    await client.query('BEGIN');
    const insert = await client.query(
      `INSERT INTO trade_events (exhibition_id, exhibitor_id, name, event_date, start_time, end_time, hall, organizer, description, type, link, event_source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [exhibitionId, exhibitorId || null, name, eventDateStr, normStart, normEnd, hall || null, organizer || null, description || null, type, link || null, event_source]
    );
    await client.query('COMMIT');
    // No verbose success log
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
    // If exhibitor user, enforce ownership
    if (req.user?.role === 'exhibitor') {
      const me = await db.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
      const myId = me.rows?.[0]?.id ?? null;
      console.log('🔍 [trade-events] Exhibitor attempting delete:', { myId, eventId, exhibitionId });
      if (!myId) return res.status(403).json({ success: false, message: 'Brak uprawnień' });
      
      // First check if event exists and who owns it
      const existing = await db.query('SELECT * FROM trade_events WHERE id = $1 AND exhibition_id = $2', [eventId, exhibitionId]);
      console.log('🔍 [trade-events] Event to delete:', existing.rows[0]);
      
      const del = await db.query(
        'DELETE FROM trade_events WHERE id = $1 AND exhibition_id = $2 AND exhibitor_id = $3 RETURNING *',
        [eventId, exhibitionId, myId]
      );
      if (del.rowCount === 0) {
        console.log('❌ [trade-events] Delete failed - event not found or wrong owner');
        const debugInfo = existing.rows[0] ? 
          `Wydarzenie istnieje ale należy do exhibitor_id=${existing.rows[0].exhibitor_id}, a ty masz id=${myId}` :
          'Wydarzenie nie istnieje';
        return res.status(404).json({ 
          success: false, 
          message: 'Nie znaleziono wydarzenia do usunięcia',
          debug: debugInfo,
          eventData: existing.rows[0] || null
        });
      }
      console.log('✅ [trade-events] deleted (owner)', del.rows[0]);
      return res.json({ success: true, message: 'Usunięto wydarzenie', data: del.rows[0] });
    }
    // Admin or other roles: delete without owner restriction
    const del = await db.query('DELETE FROM trade_events WHERE id = $1 AND exhibition_id = $2 RETURNING *', [eventId, exhibitionId]);
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


// Update trade event (admin and exhibitor-owner)
exports.update = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    const eventId = parseInt(req.params.eventId, 10);
    console.log('🔧 [trade-events] update request', { exhibitionId, eventId, body: req.body, user: req.user?.email });
    if (Number.isNaN(exhibitionId) || Number.isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }

    const { name, eventDate, startTime, endTime, hall, description, type, organizer, link } = req.body;
    // We require basic fields for consistency with create
    if (!name || !eventDate || !startTime || !endTime || !type) {
      return res.status(400).json({ success: false, message: 'Brak wymaganych pól' });
    }

    // Ensure event exists and belongs to exhibition; fetch exhibitor owner
    const existing = await db.query('SELECT id, exhibitor_id FROM trade_events WHERE id = $1 AND exhibition_id = $2', [eventId, exhibitionId]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Nie znaleziono wydarzenia' });
    }

    // If exhibitor user, enforce ownership
    if (req.user?.role === 'exhibitor') {
      const me = await db.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
      const myId = me.rows?.[0]?.id ?? null;
      const ownerId = existing.rows[0].exhibitor_id ?? null;
      if (!myId || !ownerId || myId !== ownerId) {
        return res.status(403).json({ success: false, message: 'Brak uprawnień do edycji tego wydarzenia' });
      }
    }

    // Accept any eventDate without limiting to exhibition range
    const toDateOnly = (v) => {
      if (!v) return '';
      if (v instanceof Date) {
        const y = v.getFullYear();
        const m = String(v.getMonth() + 1).padStart(2, '0');
        const d = String(v.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      const s = String(v);
      const match = s.match(/\d{4}-\d{2}-\d{2}/);
      if (match) return match[0];
      const parsed = new Date(s);
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
    };
    const eventDateStr = toDateOnly(eventDate);
    if (!eventDateStr) {
      return res.status(400).json({ success: false, message: 'Nieprawidłowa data wydarzenia' });
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
           link = $9,
           updated_at = NOW()
       WHERE id = $10 AND exhibition_id = $11
       RETURNING *`,
      [name, eventDateStr, normStart, normEnd, hall || null, organizer || null, description || null, type, link || null, eventId, exhibitionId]
    );
    await client.query('COMMIT');
    console.log('✅ [trade-events] updated', upd.rows[0]);
    return res.json({ success: true, data: upd.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ update trade_event error:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas aktualizacji wydarzenia targowego' });
  } finally {
    client.release();
  }
};

