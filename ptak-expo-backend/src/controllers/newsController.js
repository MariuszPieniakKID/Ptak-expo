const db = require('../config/database');

// GET /api/v1/news/:exhibitionId
exports.listByExhibition = async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    if (Number.isNaN(exhibitionId)) {
      return res.status(400).json({ success: false, message: 'Invalid exhibitionId' });
    }

    // Collect activity items from multiple sources
    const items = [];

    // 1) Global branding files (admin-added assets)
    try {
      const branding = await db.pool.query(
        `SELECT file_type, original_name, created_at
         FROM exhibitor_branding_files
         WHERE exhibition_id = $1 AND exhibitor_id IS NULL
         ORDER BY created_at DESC
         LIMIT 50`,
        [exhibitionId]
      );
      for (const row of branding.rows) {
        items.push({
          kind: 'branding_global',
          title: 'Dodano plik brandingowy',
          description: `${row.original_name || row.file_type || 'Plik'}`,
          timestamp: row.created_at,
        });
      }
    } catch {}

    // 2) Trade info updated
    try {
      const ti = await db.pool.query(
        `SELECT updated_at FROM trade_info WHERE exhibition_id = $1`,
        [exhibitionId]
      );
      if (ti.rows.length > 0) {
        const ts = ti.rows[0].updated_at;
        if (ts) {
          items.push({
            kind: 'trade_info',
            title: 'Zaktualizowano informacje targowe',
            description: 'Godziny, kontakt lub komunikat',
            timestamp: ts,
          });
        }
      }
    } catch {}

    // 3) Trade plan files (spaces) created
    try {
      const spaces = await db.pool.query(
        `SELECT s.original_filename, s.created_at
         FROM trade_spaces s
         JOIN trade_info ti ON ti.id = s.trade_info_id
         WHERE ti.exhibition_id = $1
         ORDER BY s.created_at DESC
         LIMIT 50`,
        [exhibitionId]
      );
      for (const row of spaces.rows) {
        items.push({
          kind: 'trade_plan_file',
          title: 'Dodano plan hali/stoiska',
          description: `${row.original_filename || 'Plik planu'}`,
          timestamp: row.created_at,
        });
      }
    } catch {}

    // 4) Trade events created/updated
    try {
      const events = await db.pool.query(
        `SELECT name, created_at, updated_at
         FROM trade_events
         WHERE exhibition_id = $1
         ORDER BY GREATEST(COALESCE(updated_at, created_at), created_at) DESC
         LIMIT 100`,
        [exhibitionId]
      );
      for (const row of events.rows) {
        const ts = row.updated_at || row.created_at;
        items.push({
          kind: row.updated_at ? 'trade_event_update' : 'trade_event_create',
          title: row.updated_at ? 'Zaktualizowano wydarzenie targowe' : 'Dodano wydarzenie targowe',
          description: row.name || 'Wydarzenie',
          timestamp: ts,
        });
      }
    } catch {}

    // 5) Communications targeted to this exhibition and current user (exhibitor)
    try {
      const cm = await db.pool.query(
        `SELECT title, content, created_at
         FROM communications
         WHERE exhibition_id = $1
           AND (user_id IS NULL OR user_id = $2)
         ORDER BY created_at DESC
         LIMIT 100`,
        [exhibitionId, req.user?.id || 0]
      );
      for (const row of cm.rows) {
        items.push({
          kind: 'communication',
          title: row.title || 'Komunikat',
          description: row.content || '',
          timestamp: row.created_at,
        });
      }
    } catch {}

    // Sort by timestamp desc and limit
    const sorted = items
      .filter(i => i && i.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    return res.json({ success: true, data: sorted });
  } catch (error) {
    console.error('❌ news list error:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas pobierania aktualności' });
  }
};


