const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

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

// POST /api/v1/users - dodaj nowego użytkownika (tylko admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('POST /users request body:', req.body);
    const { first_name, last_name, email, phone, role, password } = req.body;
    
    // Validation
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Imię, nazwisko i email są wymagane'
      });
    }
    
    // Validate role
    const validRoles = ['admin', 'exhibitor', 'guest'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Nieprawidłowa rola. Dozwolone: admin, exhibitor, guest'
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
    
    // Use provided password or generate temporary one
    let userPassword;
    let isTemporaryPassword = false;
    
    if (password && password.trim()) {
      // Use password from form
      userPassword = password.trim();
      console.log('Using password from form');
    } else {
      // Generate temporary password
      userPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      isTemporaryPassword = true;
      console.log('Generated temporary password');
    }
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(userPassword, saltRounds);
    
    // Insert new user
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, phone, role, created_at
    `;
    
    const result = await db.query(insertQuery, [
      first_name, 
      last_name, 
      email, 
      phone || null,
      password_hash,
      role || 'exhibitor'
    ]);
    
    const newUser = result.rows[0];
    
    console.log('New user created:', {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      hasCustomPassword: !isTemporaryPassword
    });
    
    // Always send welcome email (with proper label if temporary vs custom password)
    try {
      const emailResult = await sendWelcomeEmail(
        newUser.email,
        newUser.first_name,
        newUser.last_name,
        userPassword,
        isTemporaryPassword
      );
      if (emailResult.success) {
        console.log('✅ Welcome email sent successfully to:', newUser.email);
      } else {
        console.log('⚠️ Failed to send welcome email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError);
    }
    
    const responseMessage = 'Nowy użytkownik został utworzony i wysłano email z danymi logowania';
    
    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        fullName: `${newUser.first_name} ${newUser.last_name}`,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
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
router.post('/:id/reset-password', verifyToken, requireAdmin, async (req, res) => {
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
    
    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    
    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password in database
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, id]
    );
    
    console.log(`Password reset for user: ${user.first_name} ${user.last_name} (${user.email})`);
    
    // Wyślij email z nowym hasłem
    try {
      const emailResult = await sendPasswordResetEmail(
        user.email,
        user.first_name,
        user.last_name,
        newPassword
      );
      
      if (emailResult.success) {
        console.log('✅ Password reset email sent successfully to:', user.email);
      } else {
        console.log('⚠️ Failed to send password reset email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError);
    }
    
    res.json({
      success: true,
      message: `Nowe hasło zostało wygenerowane i wysłane na adres ${user.email}`
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

// DELETE /api/v1/users/:id - usuń użytkownika (tylko admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userQuery = await db.query(
      'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
      [id]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie został znaleziony'
      });
    }
    
    const user = userQuery.rows[0];
    
    // Prevent deletion of the last admin user
    if (user.role === 'admin') {
      const adminCountQuery = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['admin']
      );
      
      const adminCount = parseInt(adminCountQuery.rows[0].count);
      
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Nie można usunąć ostatniego użytkownika admin'
        });
      }
    }
    
    // Delete user
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    console.log(`User deleted: ${user.first_name} ${user.last_name} (${user.email})`);
    
    res.json({
      success: true,
      message: `Użytkownik ${user.first_name} ${user.last_name} został usunięty`
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas usuwania użytkownika',
      message: error.message
    });
  }
});

module.exports = router; 