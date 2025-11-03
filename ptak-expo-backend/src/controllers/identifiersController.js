const db = require('../config/database');
const { buildIdentifierPdf } = require('../utils/identifierPdf');
const archiver = require('archiver');

/**
 * Get identifier PDF for a specific person
 * GET /api/v1/identifiers/person/:personId
 */
const getPersonIdentifier = async (req, res) => {
  try {
    const { personId } = req.params;

    // Validate personId
    const personIdInt = parseInt(personId, 10);
    if (!Number.isInteger(personIdInt) || personIdInt <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowe ID osoby'
      });
    }

    // Fetch person with all needed data
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

    console.log('[identifiersController] Generating PDF for person:', person.id, person.full_name);

    // Generate PDF using existing utility
    const pdfBuffer = await buildIdentifierPdf(
      db,
      person.exhibition_id,
      {
        personName: person.full_name,
        personEmail: person.email || '',
        accessCode: person.access_code || '',
        personType: person.position || 'Gość'
      },
      person.exhibitor_id
    );

    if (!pdfBuffer) {
      console.error('[identifiersController] Failed to generate PDF for person:', person.id);
      return res.status(500).json({
        success: false,
        message: 'Nie udało się wygenerować identyfikatora'
      });
    }

    console.log('[identifiersController] PDF generated successfully, size:', pdfBuffer.length);

    // Send PDF
    const safeFileName = `identyfikator-${person.full_name.replace(/[^a-zA-Z0-9-]/g, '_')}-${person.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error('[identifiersController] Error fetching person identifier:', error);
    console.error('[identifiersController] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas generowania identyfikatora',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all identifiers for an exhibition as ZIP
 * GET /api/v1/identifiers/exhibition/:exhibitionId
 * Query params: 
 *   - exhibitorId=123 (optional filter)
 */
const getExhibitionIdentifiers = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
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

    // Build query with optional exhibitor filter
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
        e.nip
      FROM exhibitor_people p
      LEFT JOIN exhibitors e ON p.exhibitor_id = e.id
      WHERE p.exhibition_id = $1
    `;
    
    const params = [exhibitionIdInt];
    
    if (exhibitorIdFilter && Number.isInteger(exhibitorIdFilter)) {
      query += ' AND p.exhibitor_id = $2';
      params.push(exhibitorIdFilter);
    }
    
    query += ' ORDER BY e.company_name, p.full_name';

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Brak osób zarejestrowanych dla tego wydarzenia'
      });
    }

    const people = result.rows;

    console.log(`[identifiersController] Generating ${people.length} identifiers for exhibition ${exhibitionIdInt}`);

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    const safeExhibitionName = (exhibition.name || 'wydarzenie').replace(/[^a-zA-Z0-9-]/g, '_');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="identyfikatory-${safeExhibitionName}-${exhibitionIdInt}.zip"`);

    archive.pipe(res);

    // Generate PDF for each person and add to archive
    let successCount = 0;
    for (const person of people) {
      try {
        const pdfBuffer = await buildIdentifierPdf(
          db,
          exhibitionIdInt,
          {
            personName: person.full_name,
            personEmail: person.email || '',
            accessCode: person.access_code || '',
            personType: person.position || 'Gość'
          },
          person.exhibitor_id
        );

        if (pdfBuffer) {
          const safeCompanyName = (person.company_name || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
          const safePersonName = person.full_name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
          const fileName = `${safeCompanyName}-${safePersonName}-${person.id}.pdf`;

          archive.append(pdfBuffer, { name: fileName });
          successCount++;
        } else {
          console.warn(`[identifiersController] Failed to generate PDF for person ${person.id}`);
        }
      } catch (pdfError) {
        console.error(`[identifiersController] Error generating identifier for person ${person.id}:`, pdfError);
        // Continue with next person
      }
    }

    console.log(`[identifiersController] Successfully generated ${successCount}/${people.length} identifiers`);

    await archive.finalize();
    return;

  } catch (error) {
    console.error('[identifiersController] Error fetching exhibition identifiers:', error);
    console.error('[identifiersController] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas generowania identyfikatorów',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get identifiers for current exhibitor (authenticated)
 * GET /api/v1/identifiers/my-identifiers
 * Query params: exhibitionId (optional)
 * Returns: ZIP archive with all PDFs
 */
const getMyIdentifiers = async (req, res) => {
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
    `;
    
    const params = [exhibitorId];
    
    if (exhibitionId && Number.isInteger(exhibitionId)) {
      query += ' AND p.exhibition_id = $2';
      params.push(exhibitionId);
    }
    
    query += ' ORDER BY ex.start_date DESC, p.created_at DESC';

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Brak zarejestrowanych osób'
      });
    }

    const people = result.rows;

    console.log(`[identifiersController] Generating ${people.length} identifiers for exhibitor ${exhibitorId}`);

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    const safeCompanyName = (companyName || 'wystawca').replace(/[^a-zA-Z0-9-]/g, '_');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="identyfikatory-${safeCompanyName}.zip"`);

    archive.pipe(res);

    // Generate PDF for each person and add to archive
    let successCount = 0;
    for (const person of people) {
      try {
        const pdfBuffer = await buildIdentifierPdf(
          db,
          person.exhibition_id,
          {
            personName: person.full_name,
            personEmail: person.email || '',
            accessCode: person.access_code || '',
            personType: person.position || 'Gość'
          },
          exhibitorId
        );

        if (pdfBuffer) {
          const safePersonName = person.full_name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
          const safeExhibitionName = (person.exhibition_name || 'wydarzenie').replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 30);
          const fileName = `${safeExhibitionName}-${safePersonName}-${person.id}.pdf`;

          archive.append(pdfBuffer, { name: fileName });
          successCount++;
        } else {
          console.warn(`[identifiersController] Failed to generate PDF for person ${person.id}`);
        }
      } catch (pdfError) {
        console.error(`[identifiersController] Error generating identifier for person ${person.id}:`, pdfError);
        // Continue with next person
      }
    }

    console.log(`[identifiersController] Successfully generated ${successCount}/${people.length} identifiers`);

    await archive.finalize();
    return;

  } catch (error) {
    console.error('[identifiersController] Error fetching my identifiers:', error);
    console.error('[identifiersController] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Wystąpił błąd podczas generowania identyfikatorów',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getPersonIdentifier,
  getExhibitionIdentifiers,
  getMyIdentifiers
};

