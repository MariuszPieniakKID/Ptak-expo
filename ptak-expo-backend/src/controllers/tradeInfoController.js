const { pool } = require('../config/database');

const saveTradeInfo = async (req, res) => {
  try {
    console.log('🔍 Saving trade info for exhibition:', req.params.exhibitionId);
    console.log('🔍 Trade info data:', req.body);

    const exhibitionId = parseInt(req.params.exhibitionId);
    const { 
      tradeHours, 
      contactInfo, 
      buildDays, 
      buildType, 
      tradeSpaces, 
      tradeMessage 
    } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete existing trade info for this exhibition
      await client.query(
        'DELETE FROM trade_info WHERE exhibition_id = $1',
        [exhibitionId]
      );

      // Insert new trade info
      const tradeInfoResult = await client.query(`
        INSERT INTO trade_info (
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
        RETURNING id
      `, [
        exhibitionId,
        tradeHours.exhibitorStart,
        tradeHours.exhibitorEnd,
        tradeHours.visitorStart,
        tradeHours.visitorEnd,
        contactInfo.guestService,
        contactInfo.security,
        buildType,
        tradeMessage
      ]);

      const tradeInfoId = tradeInfoResult.rows[0].id;

      // Insert build days
      for (const day of buildDays) {
        if (day.date) {
          await client.query(`
            INSERT INTO trade_build_days (
              trade_info_id,
              build_date,
              start_time,
              end_time
            ) VALUES ($1, $2, $3, $4)
          `, [tradeInfoId, day.date, day.startTime, day.endTime]);
        }
      }

      // Insert trade spaces
      for (const space of tradeSpaces) {
        if (space.name || space.hallName) {
          await client.query(`
            INSERT INTO trade_spaces (
              trade_info_id,
              space_name,
              hall_name
            ) VALUES ($1, $2, $3)
          `, [tradeInfoId, space.name, space.hallName]);
        }
      }

      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Informacje targowe zostały zapisane pomyślnie',
        tradeInfoId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error saving trade info:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas zapisywania informacji targowych',
      error: error.message
    });
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
          hallName: space.hall_name || 'HALA A'
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

module.exports = {
  saveTradeInfo,
  getTradeInfo
}; 