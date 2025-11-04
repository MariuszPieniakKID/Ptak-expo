const db = require('../config/database');
const QRCode = require('qrcode');

/**
 * Get QR code for a specific person
 * GET /api/v1/qr-codes/person/:personId
 * Query params: format=json|image (default: json)
 */
const getPersonQRCode = async (req, res) => {
  try {
    const { personId } = req.params;
    const format = req.query.format || 'json'; // json or image

    // Validate personId
    const personIdInt = parseInt(personId, 10);
    if (!Number.isInteger(personIdInt) || personIdInt <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowe ID osoby'
      });
    }

    // Fetch person with access code
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
        ex.id as exhibition_id,
        ex.name as exhibition_name
      FROM exhibitor_people p
      LEFT JOIN exhibitors e ON p.exhibitor_id = e.id
      LEFT JOIN exhibitions ex ON p.exhibition_id = ex.id
      WHERE p.id = $1
      LIMIT 1
    `, [personIdInt]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Osoba nie została znaleziona'
      });
    }

    const person = result.rows[0];

    if (!person.access_code) {
      return res.status(404).json({
        success: false,
        message: 'Brak wygenerowanego kodu QR dla tej osoby'
      });
    }

    // Return as image PNG
    if (format === 'image') {
      try {
        console.log('[qrCodesController] Generating QR for access_code:', person.access_code);
        const qrImage = await QRCode.toBuffer(person.access_code, {
          type: 'png',
          width: 512,
          margin: 2,
          errorCorrectionLevel: 'M'
        });
        
        console.log('[qrCodesController] QR image generated successfully, size:', qrImage.length);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="qr-${person.id}-${person.full_name.replace(/\s+/g, '-')}.png"`);
        return res.send(qrImage);
      } catch (qrError) {
        console.error('[qrCodesController] Error generating QR image:', qrError);
        console.error('[qrCodesController] Error stack:', qrError.stack);
        return res.status(500).json({
          success: false,
          message: 'Błąd podczas generowania obrazu QR',
          error: qrError.message
        });
      }
    }

    // Return as JSON (default)
    return res.status(200).json({
      success: true,
      data: {
        personId: person.id,
        fullName: person.full_name,
        position: person.position,
        email: person.email,
        accessCode: person.access_code,
        exhibitor: {
          id: person.exhibitor_id,
          companyName: person.company_name
        },
        exhibition: {
          id: person.exhibition_id,
          name: person.exhibition_name
        },
        qrCodeUrl: `/api/v1/qr-codes/person/${person.id}?format=image`,
        createdAt: person.created_at
      }
    });

  } catch (error) {
    console.error('[qrCodesController] Error fetching person QR code:', error);
    return res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania kodu QR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all QR codes for an exhibition
 * GET /api/v1/qr-codes/exhibition/:exhibitionId
 * Query params: 
 *   - format=json|zip (default: json)
 *   - exhibitorId=123 (optional filter)
 */
const getExhibitionQRCodes = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
    const format = req.query.format || 'json';
    const exhibitorIdFilter = req.query.exhibitorId ? parseInt(req.query.exhibitorId, 10) : null;

    // Validate exhibitionId
    const exhibitionIdInt = parseInt(exhibitionId, 10);
    if (!Number.isInteger(exhibitionIdInt) || exhibitionIdInt <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowe ID wydarzenia'
      });
    }

    // Check if exhibition exists
    const exResult = await db.query(
      'SELECT id, name, start_date, end_date FROM exhibitions WHERE id = $1',
      [exhibitionIdInt]
    );

    if (exResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Wydarzenie nie zostało znalezione'
      });
    }

    const exhibition = exResult.rows[0];

    // Build query to get codes from BOTH exhibitor_people and invitation_recipients
    // Using UNION to combine both sources
    let query = `
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
        'exhibitor_people' as source
      FROM exhibitor_people p
      LEFT JOIN exhibitors e ON p.exhibitor_id = e.id
      WHERE p.exhibition_id = $1
        AND p.access_code IS NOT NULL
    `;
    
    const params = [exhibitionIdInt];
    
    if (exhibitorIdFilter && Number.isInteger(exhibitorIdFilter)) {
      query += ' AND p.exhibitor_id = $2';
      params.push(exhibitorIdFilter);
    }
    
    // Add UNION to include invitation_recipients
    query += `
      UNION ALL
      SELECT 
        r.id,
        r.recipient_name as full_name,
        'Gość (zaproszenie)' as position,
        r.recipient_email as email,
        r.access_code,
        r.created_at,
        e.id as exhibitor_id,
        e.company_name,
        e.nip,
        'invitation' as source
      FROM invitation_recipients r
      LEFT JOIN exhibitors e ON r.exhibitor_id = e.id
      WHERE r.exhibition_id = $1
        AND r.access_code IS NOT NULL
    `;
    
    // Add exhibitor filter for invitations too if specified
    if (exhibitorIdFilter && Number.isInteger(exhibitorIdFilter)) {
      query += ` AND r.exhibitor_id = $${params.length}`;
    }
    
    query += ' ORDER BY company_name, full_name';

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Brak kodów QR dla tego wydarzenia',
        data: {
          exhibition: {
            id: exhibition.id,
            name: exhibition.name
          },
          qrCodes: [],
          count: 0
        }
      });
    }

    const people = result.rows;

    // Return as JSON with all codes
    if (format === 'json') {
      const qrCodes = people.map(person => ({
        personId: person.id,
        fullName: person.full_name,
        position: person.position,
        email: person.email,
        accessCode: person.access_code,
        exhibitor: {
          id: person.exhibitor_id,
          companyName: person.company_name,
          nip: person.nip
        },
        qrCodeUrl: `/api/v1/qr-codes/person/${person.id}?format=image`,
        createdAt: person.created_at
      }));

      return res.status(200).json({
        success: true,
        data: {
          exhibition: {
            id: exhibition.id,
            name: exhibition.name,
            startDate: exhibition.start_date,
            endDate: exhibition.end_date
          },
          qrCodes,
          count: qrCodes.length
        }
      });
    }

    // Return as ZIP archive with all QR images
    if (format === 'zip') {
      try {
        const archiver = require('archiver');
        const archive = archiver('zip', { zlib: { level: 9 } });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="qr-codes-exhibition-${exhibitionIdInt}.zip"`);

        archive.pipe(res);

        // Generate QR code for each person and add to archive
        for (const person of people) {
          try {
            const qrImage = await QRCode.toBuffer(person.access_code, {
              type: 'png',
              width: 512,
              margin: 2,
              errorCorrectionLevel: 'M'
            });

            const safeCompanyName = (person.company_name || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
            const safePersonName = person.full_name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
            const fileName = `${safeCompanyName}-${safePersonName}-${person.id}.png`;

            archive.append(qrImage, { name: fileName });
          } catch (qrError) {
            console.error(`[qrCodesController] Error generating QR for person ${person.id}:`, qrError);
            // Continue with next person
          }
        }

        await archive.finalize();
        return;

      } catch (zipError) {
        console.error('[qrCodesController] Error creating ZIP archive:', zipError);
        return res.status(500).json({
          success: false,
          message: 'Błąd podczas tworzenia archiwum ZIP'
        });
      }
    }

    // Invalid format
    return res.status(400).json({
      success: false,
      message: 'Nieprawidłowy format. Użyj: json lub zip'
    });

  } catch (error) {
    console.error('[qrCodesController] Error fetching exhibition QR codes:', error);
    return res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania kodów QR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get QR codes for current exhibitor (authenticated)
 * GET /api/v1/qr-codes/my-codes
 * Query params: exhibitionId (optional)
 */
const getMyQRCodes = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Brak autoryzacji'
      });
    }

    // Get exhibitor ID
    const exRes = await db.query('SELECT id, company_name FROM exhibitors WHERE email = $1 LIMIT 1', [userEmail]);
    if (exRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Wystawca nie został znaleziony'
      });
    }

    const exhibitorId = exRes.rows[0].id;
    const companyName = exRes.rows[0].company_name;
    const exhibitionId = req.query.exhibitionId ? parseInt(req.query.exhibitionId, 10) : null;

    // Build query
    let query = `
      SELECT 
        p.id,
        p.full_name,
        p.position,
        p.email,
        p.access_code,
        p.created_at,
        ex.id as exhibition_id,
        ex.name as exhibition_name
      FROM exhibitor_people p
      LEFT JOIN exhibitions ex ON p.exhibition_id = ex.id
      WHERE p.exhibitor_id = $1
        AND p.access_code IS NOT NULL
    `;
    
    const params = [exhibitorId];
    
    if (exhibitionId && Number.isInteger(exhibitionId)) {
      query += ' AND p.exhibition_id = $2';
      params.push(exhibitionId);
    }
    
    query += ' ORDER BY ex.start_date DESC, p.created_at DESC';

    const result = await db.query(query, params);

    const qrCodes = result.rows.map(person => ({
      personId: person.id,
      fullName: person.full_name,
      position: person.position,
      email: person.email,
      accessCode: person.access_code,
      exhibition: {
        id: person.exhibition_id,
        name: person.exhibition_name
      },
      qrCodeUrl: `/api/v1/qr-codes/person/${person.id}?format=image`,
      createdAt: person.created_at
    }));

    return res.status(200).json({
      success: true,
      data: {
        exhibitor: {
          id: exhibitorId,
          companyName
        },
        qrCodes,
        count: qrCodes.length
      }
    });

  } catch (error) {
    console.error('[qrCodesController] Error fetching my QR codes:', error);
    return res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas pobierania kodów QR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getPersonQRCode,
  getExhibitionQRCodes,
  getMyQRCodes
};

