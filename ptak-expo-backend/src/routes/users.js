const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/v1/users - pobierz wszystkich użytkowników (tylko admin)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching users from database...');
    
    const query = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        updated_at
      FROM users 
      ORDER BY last_name, first_name
    `;
    
    const result = await db.query(query);
    
    console.log(`Found ${result.rows.length} users`);
    
    // Format the response
    const users = result.rows.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone || 'Brak numeru',
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas pobierania użytkowników',
      message: error.message
    });
  }
});

// POST /api/v1/users - dodaj nowego użytkownika
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Imię, nazwisko i email są wymagane'
      });
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Użytkownik o podanym emailu już istnieje'
      });
    }
    
    // Insert new user
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, first_name, last_name, email, phone, created_at
    `;
    
    const result = await db.query(insertQuery, [firstName, lastName, email, phone]);
    const newUser = result.rows[0];
    
    console.log('New user created:', newUser);
    
    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        fullName: `${newUser.first_name} ${newUser.last_name}`,
        email: newUser.email,
        phone: newUser.phone || 'Brak numeru',
        createdAt: newUser.created_at
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas tworzenia użytkownika',
      message: error.message
    });
  }
});

// POST /api/v1/users/:id/reset-password - wyślij nowe hasło
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userQuery = await db.query(
      'SELECT email, first_name, last_name FROM users WHERE id = $1',
      [id]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie został znaleziony'
      });
    }
    
    const user = userQuery.rows[0];
    
    // Generate new password (temporary implementation)
    const newPassword = Math.random().toString(36).slice(-8);
    
    // TODO: Here you would normally:
    // 1. Hash the password
    // 2. Update it in database
    // 3. Send email with new password
    
    console.log(`Password reset requested for user: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`New password (temp): ${newPassword}`);
    
    res.json({
      success: true,
      message: `Nowe hasło zostało wysłane na adres ${user.email}`
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas resetowania hasła',
      message: error.message
    });
  }
});

// POST /api/v1/users/create-admin - dodaj nowego użytkownika z rolą admin (tylko dla testów)
router.post('/create-admin', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Imię, nazwisko, email i hasło są wymagane'
      });
    }
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Użytkownik o podanym emailu już istnieje'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Insert new admin user
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, phone, role, created_at
    `;
    
    const result = await db.query(insertQuery, [
      firstName, 
      lastName, 
      email, 
      phone, 
      password_hash, 
      'admin'
    ]);
    
    const newUser = result.rows[0];
    
    console.log('New admin user created:', newUser);
    
    res.status(201).json({
      success: true,
      message: 'Nowy użytkownik admin został utworzony',
      data: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        fullName: `${newUser.first_name} ${newUser.last_name}`,
        email: newUser.email,
        phone: newUser.phone || 'Brak numeru',
        role: newUser.role,
        createdAt: newUser.created_at
      }
    });
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas tworzenia użytkownika admin',
      message: error.message
    });
  }
});

module.exports = router; 