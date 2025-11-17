const db = require('../config/database');

/**
 * Loguje aktywność użytkownika w systemie
 * @param {Object} params
 * @param {number} params.userId - ID użytkownika
 * @param {string} params.userEmail - Email użytkownika
 * @param {string} params.action - Akcja: 'create', 'update', 'delete', 'assign', 'unassign'
 * @param {string} params.entityType - Typ encji: 'event', 'exhibitor', 'user', 'invitation', itp.
 * @param {number} params.entityId - ID encji
 * @param {string} params.entityName - Nazwa encji (np. nazwa wydarzenia, firma wystawcy)
 * @param {string} params.details - Dodatkowe szczegóły (opcjonalne)
 */
async function logActivity({ userId, userEmail, action, entityType, entityId, entityName, details = null }) {
  try {
    await db.query(
      `INSERT INTO activity_logs (user_id, user_email, action, entity_type, entity_id, entity_name, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, userEmail, action, entityType, entityId, entityName, details]
    );
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    // Nie rzucamy błędu - logowanie nie powinno przerywać głównej operacji
  }
}

module.exports = { logActivity };

