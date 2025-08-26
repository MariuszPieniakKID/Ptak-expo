const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET /api/v1/exhibitors - pobierz wszystkich wystawców (tylko admin)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching exhibitors from database...');
    
    const query = `
      SELECT DISTINCT
        e.id,
        e.nip,
        e.company_name,
        e.address,
        e.postal_code,
        e.city,
        e.contact_person,
        e.contact_role,
        e.phone,
        e.email,
        e.status,
        e.created_at,
        e.updated_at,
        first_event.start_date as nearest_event_date,
        COALESCE(first_event.name, 'Brak przypisanych wydarzeń') as event_names
      FROM exhibitors e
      LEFT JOIN LATERAL (
        SELECT ex.name, ex.start_date 
        FROM exhibitor_events ee 
        JOIN exhibitions ex ON ee.exhibition_id = ex.id 
        WHERE ee.exhibitor_id = e.id AND ex.end_date >= CURRENT_DATE
        ORDER BY ex.start_date ASC 
        LIMIT 1
      ) first_event ON true
      WHERE e.status = 'active'
      ORDER BY e.company_name
    `;
    
    const result = await db.query(query);
    
    console.log(`Found ${result.rows.length} exhibitors`);
    
    // Format the response
    const exhibitors = result.rows.map(row => ({
      id: row.id,
      nip: row.nip,
      companyName: row.company_name,
      address: row.address,
      postalCode: row.postal_code,
      city: row.city,
      contactPerson: row.contact_person,
      contactRole: row.contact_role,
      phone: row.phone,
      email: row.email,
      status: row.status,
      nearestEventDate: row.nearest_event_date,
      eventNames: row.event_names || 'Brak przypisanych wydarzeń',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(exhibitors);
  } catch (error) {
    console.error('Error fetching exhibitors:', error);
    res.status(500).json({ 
      error: 'Database error', 
      message: 'Unable to fetch exhibitors' 
    });
  }
});

// POST /api/v1/exhibitors - dodaj nowego wystawcę (tylko admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      nip, 
      companyName, 
      address, 
      postalCode, 
      city, 
      contactPerson, 
      contactRole, 
      phone, 
      email,
      password,
      exhibitionId 
    } = req.body;

    console.log('Creating new exhibitor:', { nip, companyName, email, exhibitionId });
    console.log('Received exhibitionId:', exhibitionId, 'Type:', typeof exhibitionId);

    // Validate required fields
    if (!nip || !companyName || !address || !postalCode || !city || !contactPerson || !contactRole || !phone || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'All fields are required' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Invalid password', 
        message: 'Hasło musi mieć co najmniej 6 znaków' 
      });
    }

    // Check if exhibitor with this NIP already exists
    const existingExhibitor = await db.query(
      'SELECT id FROM exhibitors WHERE nip = $1', 
      [nip]
    );

    if (existingExhibitor.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Exhibitor already exists', 
        message: 'Wystawca z tym numerem NIP już istnieje' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new exhibitor
    const query = `
      INSERT INTO exhibitors (nip, company_name, address, postal_code, city, contact_person, contact_role, phone, email, password_hash, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
      RETURNING 
        id, nip, company_name, address, postal_code, city, contact_person, contact_role, phone, email, status, created_at
    `;

    const result = await db.query(query, [
      nip,
      companyName,
      address,
      postalCode,
      city,
      contactPerson,
      contactRole,
      phone,
      email,
      passwordHash
    ]);

    // Also create user record for login authentication
    try {
      await db.query(
        'INSERT INTO users (email, password_hash, role, first_name, last_name, company_name, phone, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email) DO NOTHING',
        [email, passwordHash, 'exhibitor', contactPerson.split(' ')[0] || contactPerson, contactPerson.split(' ').slice(1).join(' ') || '', companyName, phone, 'active']
      );
      console.log('✅ User record created for exhibitor login');
    } catch (userError) {
      console.error('⚠️ Error creating user record (exhibitor can still be created):', userError);
    }

    const newExhibitor = result.rows[0];

    console.log('New exhibitor created with ID:', newExhibitor.id);

    // If exhibitionId is provided, assign exhibitor to exhibition
    if (exhibitionId) {
      try {
        console.log('Attempting to assign exhibitor', newExhibitor.id, 'to exhibition', exhibitionId);
        const assignResult = await db.query(
          'INSERT INTO exhibitor_events (exhibitor_id, exhibition_id) VALUES ($1, $2) ON CONFLICT (exhibitor_id, exhibition_id) DO NOTHING',
          [newExhibitor.id, exhibitionId]
        );
        console.log('Assignment result:', assignResult.rowCount, 'rows affected');
        console.log('Exhibitor assigned to exhibition:', exhibitionId);
      } catch (assignError) {
        console.error('Error assigning exhibitor to exhibition:', assignError);
        // Don't fail the entire operation if assignment fails
      }
    } else {
      console.log('No exhibitionId provided, skipping assignment');
    }

    // Format response
    const exhibitor = {
      id: newExhibitor.id,
      nip: newExhibitor.nip,
      companyName: newExhibitor.company_name,
      address: newExhibitor.address,
      postalCode: newExhibitor.postal_code,
      city: newExhibitor.city,
      contactPerson: newExhibitor.contact_person,
      contactRole: newExhibitor.contact_role,
      phone: newExhibitor.phone,
      email: newExhibitor.email,
      status: newExhibitor.status,
      createdAt: newExhibitor.created_at
    };

    res.status(201).json(exhibitor);
  } catch (error) {
    console.error('Error creating exhibitor:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'Exhibitor already exists', 
        message: 'Wystawca z tym numerem NIP już istnieje' 
      });
    }
    
    res.status(500).json({ 
      error: 'Database error', 
      message: 'Unable to create exhibitor' 
    });
  }
});

// DELETE /api/v1/exhibitors/:id - usuń wystawcę (tylko admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting exhibitor with ID:', id);

    // Check if exhibitor exists
    const exhibitor = await db.query(
      'SELECT id, company_name FROM exhibitors WHERE id = $1', 
      [id]
    );

    if (exhibitor.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Exhibitor not found', 
        message: 'Exhibitor does not exist' 
      });
    }

    // Delete exhibitor (this will cascade to exhibitor_events due to foreign key constraint)
    await db.query('DELETE FROM exhibitors WHERE id = $1', [id]);

    console.log('Exhibitor deleted successfully');
    
    res.json({ 
      message: 'Exhibitor deleted successfully',
      deletedExhibitor: {
        id: parseInt(id),
        companyName: exhibitor.rows[0].company_name
      }
    });
  } catch (error) {
    console.error('Error deleting exhibitor:', error);
    res.status(500).json({ 
      error: 'Database error', 
      message: 'Unable to delete exhibitor' 
    });
  }
});

// POST /api/v1/exhibitors/:id/assign-event - przypisz wystawcę do wydarzenia (tylko admin)
router.post('/:id/assign-event', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { exhibitionId } = req.body;
    
    if (!exhibitionId) {
      return res.status(400).json({
        success: false,
        error: 'Exhibition ID jest wymagane'
      });
    }
    
    console.log(`Assigning exhibitor ${id} to exhibition ${exhibitionId}`);
    
    // Sprawdź czy wystawca istnieje
    const exhibitorCheck = await db.query(
      'SELECT id, company_name FROM exhibitors WHERE id = $1',
      [id]
    );
    
    if (exhibitorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wystawca nie został znaleziony'
      });
    }
    
    // Sprawdź czy wydarzenie istnieje
    const exhibitionCheck = await db.query(
      'SELECT id, name FROM exhibitions WHERE id = $1',
      [exhibitionId]
    );
    
    if (exhibitionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wydarzenie nie zostało znalezione'
      });
    }
    
    // Przypisz wystawcę do wydarzenia (ON CONFLICT DO NOTHING żeby uniknąć duplikatów)
    const assignResult = await db.query(
      'INSERT INTO exhibitor_events (exhibitor_id, exhibition_id) VALUES ($1, $2) ON CONFLICT (exhibitor_id, exhibition_id) DO NOTHING RETURNING *',
      [id, exhibitionId]
    );
    
    const exhibitor = exhibitorCheck.rows[0];
    const exhibition = exhibitionCheck.rows[0];
    
    if (assignResult.rows.length > 0) {
      console.log(`✅ Exhibitor ${exhibitor.company_name} assigned to exhibition ${exhibition.name}`);
      res.json({
        success: true,
        message: `Wystawca "${exhibitor.company_name}" został przypisany do wydarzenia "${exhibition.name}"`,
        assignment: {
          exhibitorId: parseInt(id),
          exhibitorName: exhibitor.company_name,
          exhibitionId: parseInt(exhibitionId),
          exhibitionName: exhibition.name
        }
      });
    } else {
      console.log(`⚠️ Exhibitor ${exhibitor.company_name} already assigned to exhibition ${exhibition.name}`);
      res.json({
        success: true,
        message: `Wystawca "${exhibitor.company_name}" jest już przypisany do wydarzenia "${exhibition.name}"`,
        assignment: {
          exhibitorId: parseInt(id),
          exhibitorName: exhibitor.company_name,
          exhibitionId: parseInt(exhibitionId),
          exhibitionName: exhibition.name
        }
      });
    }
    
  } catch (error) {
    console.error('Error assigning exhibitor to event:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas przypisywania wystawcy do wydarzenia',
      message: error.message
    });
  }
});

// DELETE /api/v1/exhibitors/:id/assign-event/:exhibitionId - odłącz wystawcę od wydarzenia (tylko admin)
router.delete('/:id/assign-event/:exhibitionId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id, exhibitionId } = req.params;

    console.log(`Unassigning exhibitor ${id} from exhibition ${exhibitionId}`);

    // Sprawdź czy wystawca istnieje
    const exhibitorCheck = await db.query(
      'SELECT id, company_name FROM exhibitors WHERE id = $1',
      [id]
    );

    if (exhibitorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wystawca nie został znaleziony'
      });
    }

    // Sprawdź czy wydarzenie istnieje
    const exhibitionCheck = await db.query(
      'SELECT id, name FROM exhibitions WHERE id = $1',
      [exhibitionId]
    );

    if (exhibitionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wydarzenie nie zostało znalezione'
      });
    }

    // Usuń przypisanie (odłączenie)
    const deleteResult = await db.query(
      'DELETE FROM exhibitor_events WHERE exhibitor_id = $1 AND exhibition_id = $2',
      [id, exhibitionId]
    );

    const exhibitor = exhibitorCheck.rows[0];
    const exhibition = exhibitionCheck.rows[0];

    if (deleteResult.rowCount > 0) {
      console.log(`✅ Unassigned ${exhibitor.company_name} from ${exhibition.name}`);
      return res.json({
        success: true,
        message: `Wystawca "${exhibitor.company_name}" został odłączony od wydarzenia "${exhibition.name}"`
      });
    }

    console.log(`⚠️ No assignment found for exhibitor ${id} and exhibition ${exhibitionId}`);
    return res.json({
      success: true,
      message: `Wystawca nie był przypisany do tego wydarzenia`
    });
  } catch (error) {
    console.error('Error unassigning exhibitor from event:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd podczas odłączania wystawcy od wydarzenia',
      message: error.message
    });
  }
});

// GET /api/v1/exhibitors/:id - pobierz szczegóły wystawcy (tylko admin)
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Fetching exhibitor with ID:', id);

    const query = `
      SELECT 
        e.id,
        e.nip,
        e.company_name,
        e.address,
        e.postal_code,
        e.city,
        e.contact_person,
        e.contact_role,
        e.phone,
        e.email,
        e.status,
        e.created_at,
        e.updated_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ex.id,
              'name', ex.name,
              'start_date', ex.start_date,
              'end_date', ex.end_date,
              'location', ex.location,
              'status', ex.status
            )
          ) FILTER (WHERE ex.id IS NOT NULL), 
          '[]'
        ) as events
      FROM exhibitors e
      LEFT JOIN exhibitor_events ee ON e.id = ee.exhibitor_id
      LEFT JOIN exhibitions ex ON ee.exhibition_id = ex.id
      WHERE e.id = $1
      GROUP BY e.id, e.nip, e.company_name, e.address, e.postal_code, e.city, e.contact_person, e.contact_role, e.phone, e.email, e.status, e.created_at, e.updated_at
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Exhibitor not found', 
        message: 'Exhibitor does not exist' 
      });
    }

    const exhibitor = result.rows[0];

    // Format response
    const exhibitorData = {
      id: exhibitor.id,
      nip: exhibitor.nip,
      companyName: exhibitor.company_name,
      address: exhibitor.address,
      postalCode: exhibitor.postal_code,
      city: exhibitor.city,
      contactPerson: exhibitor.contact_person,
      contactRole: exhibitor.contact_role,
      phone: exhibitor.phone,
      email: exhibitor.email,
      status: exhibitor.status,
      events: exhibitor.events,
      createdAt: exhibitor.created_at,
      updatedAt: exhibitor.updated_at
    };

    res.json(exhibitorData);
  } catch (error) {
    console.error('Error fetching exhibitor:', error);
    res.status(500).json({ 
      error: 'Database error', 
      message: 'Unable to fetch exhibitor' 
    });
  }
});

module.exports = router; 