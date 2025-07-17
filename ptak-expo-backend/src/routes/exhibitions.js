const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// GET /api/exhibitions - Pobierz wszystkie wystawy
router.get('/', async (req, res) => {
  try {
    console.log('Fetching exhibitions from database...');
    
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
      ORDER BY start_date ASC
    `);
    
    console.log(`Found ${result.rows.length} exhibitions`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    res.status(500).json({ error: 'Failed to fetch exhibitions' });
  }
});

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

// POST /api/exhibitions - Dodaj nową wystawę (wymaga autoryzacji)
router.post('/', verifyToken, async (req, res) => {
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

// PUT /api/exhibitions/:id - Aktualizuj wystawę (wymaga autoryzacji)
router.put('/:id', verifyToken, async (req, res) => {
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

// DELETE /api/exhibitions/:id - Usuń wystawę (wymaga autoryzacji)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM exhibitions 
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    
    console.log('Exhibition deleted:', id);
    res.json({ message: 'Exhibition deleted successfully' });
  } catch (error) {
    console.error('Error deleting exhibition:', error);
    res.status(500).json({ error: 'Failed to delete exhibition' });
  }
});

module.exports = router; 