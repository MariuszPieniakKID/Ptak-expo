const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs');

const saveTradeInfo = async (req, res) => {
  try {
    const exhibitionId = Number.parseInt(req.params.exhibitionId, 10);
    if (!Number.isFinite(exhibitionId)) {
      return res.status(400).json({ success: false, message: 'Nieprawidłowe ID wydarzenia' });
    }

    const body = req.body || {};
    const tradeHours = body.tradeHours || {};
    const contactInfo = body.contactInfo || {};
    const buildDays = Array.isArray(body.buildDays) ? body.buildDays : [];
    const buildType = body.buildType || null;
    const tradeSpaces = Array.isArray(body.tradeSpaces) ? body.tradeSpaces : [];
    const tradeMessage = body.tradeMessage || null;

    console.log('🔍 Saving trade info', {
      exhibitionId,
      tradeHours,
      contactInfo,
      buildDaysCount: buildDays.length,
      tradeSpacesCount: tradeSpaces.length,
      buildType,
      hasTradeMessage: Boolean(tradeMessage)
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure exhibition exists to avoid FK violation
      const exhibitionCheck = await client.query('SELECT id FROM exhibitions WHERE id = $1', [exhibitionId]);
      if (exhibitionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Wydarzenie nie istnieje' });
      }

      // Delete existing trade info (cascade removes related rows)
      await client.query('DELETE FROM trade_info WHERE exhibition_id = $1', [exhibitionId]);

      const exhibitorStart = tradeHours.exhibitorStart || null;
      const exhibitorEnd = tradeHours.exhibitorEnd || null;
      const visitorStart = tradeHours.visitorStart || null;
      const visitorEnd = tradeHours.visitorEnd || null;
      const guestService = contactInfo.guestService || null;
      const securityPhone = contactInfo.security || null;

      // Insert new trade info
      const tradeInfoResult = await client.query(
        `INSERT INTO trade_info (
           exhibition_id,
           exhibitor_start_time,
           exhibitor_end_time,
           visitor_start_time,
           visitor_end_time,
           guest_service_phone,
           security_phone,
           build_type,
           trade_message,
           created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING id`,
        [
          exhibitionId,
          exhibitorStart,
          exhibitorEnd,
          visitorStart,
          visitorEnd,
          guestService,
          securityPhone,
          buildType,
          tradeMessage
        ]
      );

      const tradeInfoId = tradeInfoResult.rows[0].id;

      // Insert build days (only valid dates)
      for (const day of buildDays) {
        const buildDate = day?.date || null;
        const startTime = day?.startTime || null;
        const endTime = day?.endTime || null;
        if (buildDate) {
          await client.query(
            `INSERT INTO trade_build_days (trade_info_id, build_date, start_time, end_time)
             VALUES ($1, $2, $3, $4)`,
            [tradeInfoId, buildDate, startTime, endTime]
          );
        }
      }

      // Insert trade spaces
      for (const space of tradeSpaces) {
        const spaceName = space?.name || space?.hallName || null;
        const hallName = space?.hallName || null;
        const filePath = space?.filePath || null;
        const originalFilename = space?.originalFilename || null;
        if (spaceName || hallName) {
          await client.query(
            `INSERT INTO trade_spaces (trade_info_id, space_name, hall_name, file_path, original_filename)
             VALUES ($1, $2, $3, $4, $5)`,
            [tradeInfoId, spaceName, hallName, filePath, originalFilename]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Informacje targowe zostały zapisane pomyślnie', tradeInfoId });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Error in trade info transaction:', err?.message, err?.stack);
      return res.status(500).json({
        success: false,
        message: 'Błąd podczas zapisywania informacji targowych',
        error: err?.message
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error saving trade info (outer):', error?.message, error?.stack);
    res.status(500).json({ success: false, message: 'Błąd podczas zapisywania informacji targowych', error: error?.message });
  }
};

const getTradeInfo = async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId);
    console.log('🔍 Getting trade info for exhibition:', exhibitionId);

    const client = await pool.connect();
    
    try {
      // Get main trade info
      const tradeInfoResult = await client.query(`
        SELECT * FROM trade_info WHERE exhibition_id = $1
      `, [exhibitionId]);

      if (tradeInfoResult.rows.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'Brak informacji targowych dla tego wydarzenia'
        });
      }

      const tradeInfo = tradeInfoResult.rows[0];

      // Get build days
      const buildDaysResult = await client.query(`
        SELECT * FROM trade_build_days WHERE trade_info_id = $1 ORDER BY build_date
      `, [tradeInfo.id]);

      // Get trade spaces
      const tradeSpacesResult = await client.query(`
        SELECT * FROM trade_spaces WHERE trade_info_id = $1
      `, [tradeInfo.id]);

      const responseData = {
        tradeHours: {
          exhibitorStart: tradeInfo.exhibitor_start_time,
          exhibitorEnd: tradeInfo.exhibitor_end_time,
          visitorStart: tradeInfo.visitor_start_time,
          visitorEnd: tradeInfo.visitor_end_time
        },
        contactInfo: {
          guestService: tradeInfo.guest_service_phone || '',
          security: tradeInfo.security_phone || ''
        },
        buildType: tradeInfo.build_type || 'Montaż indywidualny',
        tradeMessage: tradeInfo.trade_message || '',
        buildDays: buildDaysResult.rows.map((day, index) => ({
          id: (index + 1).toString(),
          date: day.build_date,
          startTime: day.start_time,
          endTime: day.end_time
        })),
        tradeSpaces: tradeSpacesResult.rows.map((space, index) => ({
          id: (index + 1).toString(),
          name: space.space_name || '',
          hallName: space.hall_name || 'HALA A',
          filePath: space.file_path || null,
          originalFilename: space.original_filename || null
        }))
      };

      res.json({
        success: true,
        data: responseData
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error getting trade info:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania informacji targowych',
      error: error.message
    });
  }
};

const uploadTradePlan = async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId);
    const spaceId = req.params.spaceId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Brak pliku do przesłania'
      });
    }

    console.log('🔍 Uploading trade plan for exhibition:', exhibitionId, 'space:', spaceId);
    console.log('🔍 File info:', req.file);

    const client = await pool.connect();
    
    try {
      // First get the trade_info_id for this exhibition
      const tradeInfoResult = await client.query(`
        SELECT id FROM trade_info WHERE exhibition_id = $1
      `, [exhibitionId]);

      if (tradeInfoResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nie znaleziono informacji targowych dla tego wydarzenia'
        });
      }

      const tradeInfoId = tradeInfoResult.rows[0].id;

      // Find the trade space by position (spaceId is actually the index/position from frontend)
      const tradeSpacesResult = await client.query(`
        SELECT * FROM trade_spaces WHERE trade_info_id = $1 ORDER BY id
      `, [tradeInfoId]);

      // Convert frontend spaceId to actual database record
      const spaceIndex = parseInt(spaceId) - 1; // Frontend IDs are 1-based
      if (spaceIndex < 0 || spaceIndex >= tradeSpacesResult.rows.length) {
        return res.status(404).json({
          success: false,
          message: 'Nie znaleziono przestrzeni targowej'
        });
      }

      const actualSpaceId = tradeSpacesResult.rows[spaceIndex].id;

      // Update the trade space with file information
      const updateResult = await client.query(`
        UPDATE trade_spaces 
        SET file_path = $1, original_filename = $2
        WHERE id = $3
        RETURNING *
      `, [req.file.path, req.file.originalname, actualSpaceId]);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nie znaleziono przestrzeni targowej'
        });
      }

      res.json({
        success: true,
        message: 'Plik został pomyślnie przesłany',
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          path: req.file.path,
          size: req.file.size
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error uploading trade plan:', error);
    
    // Clean up uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Błąd podczas przesyłania pliku',
      error: error.message
    });
  }
};

const downloadTradePlan = async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId);
    const spaceId = req.params.spaceId;

    console.log('🔍 Downloading trade plan for exhibition:', exhibitionId, 'space:', spaceId);

    const client = await pool.connect();
    
    try {
      // Get trade_info_id for this exhibition
      const tradeInfoResult = await client.query(`
        SELECT id FROM trade_info WHERE exhibition_id = $1
      `, [exhibitionId]);

      if (tradeInfoResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nie znaleziono informacji targowych dla tego wydarzenia'
        });
      }

      const tradeInfoId = tradeInfoResult.rows[0].id;

      // Find the trade space by position (spaceId is the index/position from frontend)
      const tradeSpacesResult = await client.query(`
        SELECT * FROM trade_spaces WHERE trade_info_id = $1 ORDER BY id
      `, [tradeInfoId]);

      // Convert frontend spaceId to actual database record
      const spaceIndex = parseInt(spaceId) - 1; // Frontend IDs are 1-based
      if (spaceIndex < 0 || spaceIndex >= tradeSpacesResult.rows.length) {
        return res.status(404).json({
          success: false,
          message: 'Nie znaleziono przestrzeni targowej'
        });
      }

      const space = tradeSpacesResult.rows[spaceIndex];
      
      // Get file information from database
      const result = { rows: [{ 
        file_path: space.file_path, 
        original_filename: space.original_filename 
      }] };

      if (result.rows.length === 0 || !result.rows[0].file_path) {
        return res.status(404).json({
          success: false,
          message: 'Nie znaleziono pliku dla tej przestrzeni targowej'
        });
      }

      const { file_path, original_filename } = result.rows[0];

      // Check if file exists on filesystem
      if (!fs.existsSync(file_path)) {
        return res.status(404).json({
          success: false,
          message: 'Plik nie istnieje na serwerze'
        });
      }

      // Set appropriate headers and send file
      res.setHeader('Content-Disposition', `attachment; filename="${original_filename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      res.sendFile(path.resolve(file_path));

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error downloading trade plan:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania pliku',
      error: error.message
    });
  }
};

module.exports = {
  saveTradeInfo,
  getTradeInfo,
  uploadTradePlan,
  downloadTradePlan
}; 