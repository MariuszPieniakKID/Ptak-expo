const db = require('../config/database');

/**
 * Pobiera najbliższą (nadchodzącą) wystawę dla danego wystawcy
 * @param {number} exhibitorId - ID wystawcy
 * @returns {Promise<Object|null>} - Obiekt wystawy lub null jeśli nie znaleziono
 */
const getNearestExhibitionForExhibitor = async (exhibitorId) => {
  try {
    const result = await db.query(`
      SELECT 
        ex.id,
        ex.name,
        ex.description,
        ex.start_date,
        ex.end_date,
        ex.location,
        ex.status
      FROM exhibitions ex
      INNER JOIN exhibitor_events ee ON ex.id = ee.exhibition_id
      WHERE ee.exhibitor_id = $1
        AND ex.end_date >= CURRENT_DATE
      ORDER BY ex.start_date ASC
      LIMIT 1
    `, [exhibitorId]);

    if (result.rows.length === 0) {
      // Brak nadchodzących wystaw, pobierz ostatnią przeszłą wystawę
      const pastResult = await db.query(`
        SELECT 
          ex.id,
          ex.name,
          ex.description,
          ex.start_date,
          ex.end_date,
          ex.location,
          ex.status
        FROM exhibitions ex
        INNER JOIN exhibitor_events ee ON ex.id = ee.exhibition_id
        WHERE ee.exhibitor_id = $1
        ORDER BY ex.start_date DESC
        LIMIT 1
      `, [exhibitorId]);

      return pastResult.rows.length > 0 ? pastResult.rows[0] : null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching nearest exhibition for exhibitor:', error);
    return null;
  }
};

/**
 * Pobiera domyślną nazwę wystawy jeśli nie znaleziono przypisanej wystawy
 * @returns {string} - Domyślna nazwa wystawy
 */
const getDefaultExhibitionName = () => {
  return process.env.DEFAULT_EXHIBITION_NAME || 'WARSAW INDUSTRY WEEK';
};

module.exports = {
  getNearestExhibitionForExhibitor,
  getDefaultExhibitionName
};

