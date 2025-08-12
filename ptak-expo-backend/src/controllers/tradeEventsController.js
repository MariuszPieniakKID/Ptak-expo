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
    console.log('🔍 [trade-events] listByExhibition', { exhibitionId, user: req.user?.email });
    if (Number.isNaN(exhibitionId)) {
      return res.status(400).json({ success: false, message: 'Invalid exhibitionId' });
    }
    const result = await db.query(
      `SELECT id, exhibition_id, name, event_date, start_time, end_time, hall, description, type
       FROM trade_events WHERE exhibition_id = $1 ORDER BY event_date ASC, start_time ASC`,
      [exhibitionId]
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

    const { name, eventDate, startTime, endTime, hall, description, type } = req.body;
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
      `INSERT INTO trade_events (exhibition_id, name, event_date, start_time, end_time, hall, description, type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [exhibitionId, name, eventDate, normStart, normEnd, hall || null, description || null, type]
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


