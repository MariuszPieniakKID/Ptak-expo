const db = require('../config/database');

/**
 * Verify QR code and return access information
 * GET /api/v1/qr-verify/:code
 */
const verifyQRCode = async (req, res) => {
  try {
    const { code } = req.params;

    // Validate input
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Kod QR jest wymagany'
      });
    }

    // Search for the access code in exhibitor_people table
    const result = await db.query(`
      SELECT 
        p.id,
        p.full_name,
        p.position,
        p.email,
        p.access_code,
        p.created_at,
        e.id as exhibitor_id,
        e.company_name,
        e.nip,
        ex.id as exhibition_id,
        ex.name as exhibition_name,
        ex.start_date,
        ex.end_date,
        ex.location,
        ex.status as exhibition_status
      FROM exhibitor_people p
      LEFT JOIN exhibitors e ON p.exhibitor_id = e.id
      LEFT JOIN exhibitions ex ON p.exhibition_id = ex.id
      WHERE p.access_code = $1
      LIMIT 1
    `, [code.trim()]);

    // If code not found
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Kod QR nie został znaleziony w systemie'
      });
    }

    const person = result.rows[0];

    // Format dates for better readability
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    };

    // Return success with person and exhibition details
    return res.status(200).json({
      success: true,
      valid: true,
      message: 'Kod QR jest poprawny',
      data: {
        person: {
          id: person.id,
          fullName: person.full_name,
          position: person.position,
          email: person.email,
          registeredAt: person.created_at
        },
        exhibitor: {
          id: person.exhibitor_id,
          companyName: person.company_name,
          nip: person.nip
        },
        exhibition: {
          id: person.exhibition_id,
          name: person.exhibition_name,
          startDate: formatDate(person.start_date),
          endDate: formatDate(person.end_date),
          location: person.location,
          status: person.exhibition_status
        },
        accessCode: person.access_code,
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[qrVerifyController] Error verifying QR code:', error);
    return res.status(500).json({
      success: false,
      valid: false,
      message: 'Wystąpił błąd podczas weryfikacji kodu QR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  verifyQRCode
};

