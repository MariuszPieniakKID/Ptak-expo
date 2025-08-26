const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin, requireExhibitorOrAdmin } = require('../middleware/auth');

// GET /api/exhibitions/user-events - Pobierz wydarzenia zalogowanego wystawcy (user z role=exhibitor)
router.get('/user-events', verifyToken, requireExhibitorOrAdmin, async (req, res) => {
  try {
    console.log(`Fetching events for user ${req.user.id} (${req.user.email})`);
    
    // Sprawdzamy czy user ma przypisane události przez powiązanie user->exhibitor->exhibitor_events
    // Jeśli nie, to zwracamy wszystkie wydarzenia jako fallback (user może wybrać)
    
    let result;
    
    // Próbujemy znaleźć exhibitora powiązanego z tym userem (po email)
    const exhibitorResult = await db.query(`
      SELECT e.id as exhibitor_id 
      FROM exhibitors e 
      WHERE e.email = $1
    `, [req.user.email]);
    
    if (exhibitorResult.rows.length > 0) {
      // Jeśli znajdziemy exhibitora, pobieramy jego wydarzenia
      const exhibitorId = exhibitorResult.rows[0].exhibitor_id;
      console.log(`Found linked exhibitor ${exhibitorId} for user ${req.user.email}`);
      
      result = await db.query(`
        SELECT 
          e.id,
          e.name,
          e.description,
          e.start_date,
          e.end_date,
          e.location,
          e.status,
          e.created_at,
          e.updated_at
        FROM exhibitions e
        INNER JOIN exhibitor_events ee ON e.id = ee.exhibition_id
        WHERE ee.exhibitor_id = $1
        ORDER BY e.start_date ASC
      `, [exhibitorId]);
      
      console.log(`Found ${result.rows.length} assigned events for exhibitor ${exhibitorId}`);
    } else {
      // Jeśli nie ma powiązanego exhibitora, zwracamy wszystkie wydarzenia jako fallback
      console.log(`No linked exhibitor found for user ${req.user.email}, returning all events`);
      
      result = await db.query(`
        SELECT 
          e.id,
          e.name,
          e.description,
          e.start_date,
          e.end_date,
          e.location,
          e.status,
          e.created_at,
          e.updated_at
        FROM exhibitions e
        ORDER BY e.start_date ASC
        LIMIT 3
      `);
      
      console.log(`Found ${result.rows.length} events (fallback - all events)`);
    }
    
    // Format the response with proper date formatting
    const events = result.rows.map(event => ({
      id: event.id,
      name: event.name,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location,
      status: event.status,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }));
    
    res.json({
      success: true,
      data: events,
      count: events.length
    });
    
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user events',
      message: error.message 
    });
  }
});

// GET /api/exhibitions - Pobierz wszystkie wystawy
router.get('/', async (req, res) => {
  try {
    console.log('Fetching exhibitions from database...');
    
    const result = await db.query(`
      SELECT 
        e.id,
        e.name,
        e.description,
        e.start_date,
        e.end_date,
        e.location,
        e.status,
        e.created_at,
        e.updated_at,
        (
          SELECT ebf.file_name
          FROM exhibitor_branding_files ebf
          WHERE ebf.exhibition_id = e.id
            AND ebf.exhibitor_id IS NULL
            AND ebf.file_type = 'event_logo'
          ORDER BY ebf.created_at DESC
          LIMIT 1
        ) AS event_logo_file_name
      FROM exhibitions e
      ORDER BY e.start_date ASC
    `);
    
    console.log(`Found ${result.rows.length} exhibitions`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    res.status(500).json({ error: 'Failed to fetch exhibitions' });
  }
});

// IMPORTANT: Specific routes must come BEFORE dynamic routes like /:id
// This route must be placed before /:id route to prevent conflicts

// GET /api/exhibitions/:id - Pobierz konkretną wystawę
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        id,
        name,
        description,
        start_date,
        end_date,
        location,
        status,
        created_at,
        updated_at
      FROM exhibitions 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching exhibition:', error);
    res.status(500).json({ error: 'Failed to fetch exhibition' });
  }
});

// POST /api/exhibitions - Dodaj nową wystawę (tylko admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, start_date, end_date, location, status = 'planned' } = req.body;
    
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Name, start_date and end_date are required' });
    }
    
    const result = await db.query(`
      INSERT INTO exhibitions (name, description, start_date, end_date, location, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, description, start_date, end_date, location, status]);
    
    console.log('New exhibition created with ID:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating exhibition:', error);
    res.status(500).json({ error: 'Failed to create exhibition' });
  }
});

// PUT /api/exhibitions/:id - Aktualizuj wystawę (tylko admin)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date, location, status } = req.body;
    
    const result = await db.query(`
      UPDATE exhibitions 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        location = COALESCE($5, location),
        status = COALESCE($6, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, description, start_date, end_date, location, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    
    console.log('Exhibition updated:', result.rows[0].id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating exhibition:', error);
    res.status(500).json({ error: 'Failed to update exhibition' });
  }
});

// DELETE /api/exhibitions/:id - Usuń wystawę kompletnie (tylko admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { id } = req.params;
    
    console.log(`Starting complete deletion of exhibition ${id}`);
    
    await client.query('BEGIN');
    
    // 1. Sprawdź czy wystawa istnieje
    const exhibitionCheck = await client.query(
      'SELECT id, name FROM exhibitions WHERE id = $1',
      [id]
    );
    
    if (exhibitionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    
    const exhibition = exhibitionCheck.rows[0];
    console.log(`Deleting exhibition: ${exhibition.name}`);
    
    // 2. Usuń pliki brandingowe z dysku
    const brandingFiles = await client.query(
      'SELECT file_path FROM exhibitor_branding_files WHERE exhibition_id = $1',
      [id]
    );
    
    console.log(`Found ${brandingFiles.rows.length} branding files to delete`);
    
    for (const file of brandingFiles.rows) {
      try {
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join(__dirname, '../..', file.file_path);
        await fs.unlink(filePath);
        console.log(`Deleted file: ${file.file_path}`);
      } catch (fileError) {
        console.warn(`Failed to delete file: ${file.file_path}`, fileError.message);
      }
    }
    
    // 3. Usuń foldery brandingowe wystawców dla tego wydarzenia
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const exhibitorBrandingDir = path.join(__dirname, '../../uploads/exhibitors');
      
      // Znajdź wszystkich wystawców dla tego wydarzenia
      const exhibitorsResult = await client.query(`
        SELECT DISTINCT e.id 
        FROM exhibitors e 
        JOIN exhibitor_events ee ON e.id = ee.exhibitor_id 
        WHERE ee.exhibition_id = $1
      `, [id]);
      
      for (const exhibitor of exhibitorsResult.rows) {
        const exhibitorBrandingPath = path.join(exhibitorBrandingDir, exhibitor.id.toString(), 'branding');
        try {
          await fs.rmdir(exhibitorBrandingPath, { recursive: true });
          console.log(`Deleted branding directory: ${exhibitorBrandingPath}`);
        } catch (dirError) {
          console.warn(`Failed to delete directory: ${exhibitorBrandingPath}`, dirError.message);
        }
      }
    } catch (error) {
      console.warn('Error cleaning up branding directories:', error.message);
    }
    
    // 4. Usuń dane z tabel w odpowiedniej kolejności (od najmniej do najbardziej ważnych)
    
    // Usuń recipientów zaproszeń
    await client.query(`
      DELETE FROM invitation_recipients 
      WHERE invitation_template_id IN (
        SELECT id FROM invitation_templates WHERE exhibition_id = $1
      )
    `, [id]);
    console.log('Deleted invitation recipients');
    
    // Usuń szablony zaproszeń
    await client.query('DELETE FROM invitation_templates WHERE exhibition_id = $1', [id]);
    console.log('Deleted invitation templates');
    
    // Usuń space'y targowe
    await client.query(`
      DELETE FROM trade_spaces 
      WHERE trade_info_id IN (
        SELECT id FROM trade_info WHERE exhibition_id = $1
      )
    `, [id]);
    console.log('Deleted trade spaces');
    
    // Usuń dni budowy
    await client.query(`
      DELETE FROM trade_build_days 
      WHERE trade_info_id IN (
        SELECT id FROM trade_info WHERE exhibition_id = $1
      )
    `, [id]);
    console.log('Deleted trade build days');
    
    // Usuń informacje targowe
    await client.query('DELETE FROM trade_info WHERE exhibition_id = $1', [id]);
    console.log('Deleted trade info');
    
    // Usuń pliki brandingowe z bazy
    await client.query('DELETE FROM exhibitor_branding_files WHERE exhibition_id = $1', [id]);
    console.log('Deleted branding files from database');
    
    // Usuń powiązania wystawca-wydarzenie
    await client.query('DELETE FROM exhibitor_events WHERE exhibition_id = $1', [id]);
    console.log('Deleted exhibitor events relations');
    
    // Usuń komunikaty
    await client.query('DELETE FROM communications WHERE exhibition_id = $1', [id]);
    console.log('Deleted communications');
    
    // Usuń materiały marketingowe
    await client.query('DELETE FROM marketing_materials WHERE exhibition_id = $1', [id]);
    console.log('Deleted marketing materials');
    
    // Usuń dokumenty
    await client.query('DELETE FROM documents WHERE exhibition_id = $1', [id]);
    console.log('Deleted documents');
    
    // Usuń zaproszenia (stare)
    await client.query('DELETE FROM invitations WHERE exhibition_id = $1', [id]);
    console.log('Deleted old invitations');
    
    // 5. Na końcu usuń samą wystawę
    await client.query('DELETE FROM exhibitions WHERE id = $1', [id]);
    console.log('Deleted exhibition');
    
    await client.query('COMMIT');
    
    console.log(`✅ Complete deletion of exhibition ${id} (${exhibition.name}) finished successfully`);
    
    res.json({ 
      success: true,
      message: `Wydarzenie "${exhibition.name}" zostało całkowicie usunięte wraz z wszystkimi danymi i plikami`,
      deletedExhibition: {
        id: parseInt(id),
        name: exhibition.name
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting exhibition completely:', error);
    res.status(500).json({ 
      error: 'Failed to delete exhibition completely',
      message: error.message 
    });
  } finally {
    client.release();
  }
});

module.exports = router; 