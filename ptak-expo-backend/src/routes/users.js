const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup avatar uploads (store in uploads/users/{id}/avatar)
const getUploadsBase = () => {
  try {
    if (process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim()) {
      const p = path.resolve(process.env.UPLOADS_DIR);
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      return p;
    }
  } catch {}
  const fallback = path.join(__dirname, '../../uploads');
  try { if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true }); } catch {}
  return fallback;
};

const avatarStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const userId = req.params.id;
      const dir = path.join(getUploadsBase(), 'users', String(userId), 'avatar');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (e) {
      cb(e);
    }
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `avatar${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Only PNG, JPEG, WEBP are allowed'));
  }
});

// Upload user avatar
router.post('/:id/avatar', verifyToken, requireAdmin, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Brak pliku' });
    }
    const uploadsBase = getUploadsBase();
    const relativePath = path.relative(path.join(__dirname, '../..'), path.join(uploadsBase, 'users', String(userId), 'avatar', req.file.filename));

    // Normalize to start with 'uploads/' for serving compatibility
    const normalized = relativePath.startsWith('uploads') ? relativePath : path.join('uploads', 'users', String(userId), 'avatar', req.file.filename);

    const result = await db.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id, avatar_url', [normalized, userId]);
    return res.json({ success: true, message: 'Avatar zapisany', data: { id: result.rows[0].id, avatarUrl: result.rows[0].avatar_url } });
  } catch (e) {
    console.error('Avatar upload error:', e);
    return res.status(500).json({ success: false, error: 'Błąd podczas zapisu avatara', message: e.message });
  }
});

// Serve user avatar (by id)
router.get('/:id/avatar', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const q = await db.query('SELECT avatar_url FROM users WHERE id = $1', [id]);
    if (q.rows.length === 0 || !q.rows[0].avatar_url) {
      return res.status(404).json({ success: false, error: 'Brak avatara' });
    }
    const uploadsBase = getUploadsBase();
    const stored = q.rows[0].avatar_url;
    const normalized = stored.startsWith('uploads/') ? stored.replace(/^uploads\//, '') : stored;
    const filePath = path.join(uploadsBase, normalized);
    return res.sendFile(filePath);
  } catch (e) {
    console.error('Serve avatar error:', e);
    return res.status(500).json({ success: false, error: 'Błąd podczas serwowania avatara' });
  }
});

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
        avatar_url,
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
      avatarUrl: user.avatar_url || null,
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
      RETURNING id, first_name, last_name, email, phone, role, created_at, avatar_url
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
    
    // Always send welcome email, but DO NOT block HTTP response
    try {
      console.log('[users] Scheduling welcome email to', newUser.email, 'temporary?', isTemporaryPassword);
      // Fire-and-forget to avoid blocking the request on SMTP latency
      Promise.resolve().then(async () => {
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
          console.warn('⚠️ Failed to send welcome email:', emailResult.error);
        }
      }).catch((emailError) => {
        console.error('❌ Error scheduling/sending welcome email:', emailError);
      });
    } catch (emailError) {
      console.error('❌ Error enqueueing welcome email:', emailError);
    }
    
    const responseMessage = 'Nowy użytkownik został utworzony. Email z danymi logowania zostanie wysłany.';
    
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
        avatarUrl: newUser.avatar_url || null,
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
      RETURNING id, first_name, last_name, email, phone, role, created_at, avatar_url
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
        avatarUrl: newUser.avatar_url || null,
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

// PUT /api/v1/users/:id - zaktualizuj dane użytkownika (tylko admin)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      password
    } = req.body || {};

    // Check if user exists
    const existsQuery = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existsQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie został znaleziony'
      });
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    let idx = 1;
    const pushField = (col, val) => {
      fields.push(`${col} = $${idx++}`);
      values.push(val);
    };

    if (first_name !== undefined) pushField('first_name', first_name);
    if (last_name !== undefined) pushField('last_name', last_name);
    if (email !== undefined) pushField('email', email);
    if (phone !== undefined) pushField('phone', phone);

    // Hash password if provided
    if (password !== undefined && password.trim() !== '') {
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      pushField('password_hash', password_hash);
    }

    pushField('updated_at', new Date());

    if (fields.length === 1) {
      // Only updated_at, no real changes
      return res.json({ success: true, message: 'Brak zmian do zapisania' });
    }

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING 
      id, first_name, last_name, email, phone, avatar_url, created_at, updated_at`;
    values.push(id);

    const result = await db.query(query, values);
    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Użytkownik zaktualizowany pomyślnie',
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone || 'Brak numeru',
        avatarUrl: user.avatar_url || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas aktualizacji użytkownika',
      message: error.message
    });
  }
});

// DELETE /api/v1/users/:id - usuń użytkownika (tylko admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;

    // Check if user exists
    const userQuery = await client.query(
      'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
      [id]
    );

    if (userQuery.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie został znaleziony'
      });
    }

    const user = userQuery.rows[0];

    // Prevent deletion of the last admin user
    if (user.role === 'admin') {
      const adminCountQuery = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['admin']
      );

      const adminCount = parseInt(adminCountQuery.rows[0].count);

      if (adminCount <= 1) {
        client.release();
        return res.status(400).json({
          success: false,
          error: 'Nie można usunąć ostatniego użytkownika admin'
        });
      }
    }

    await client.query('BEGIN');

    // Nullify/cleanup FK references to this user to avoid FK violations
    const cleanupStatements = [
      { sql: 'UPDATE exhibitor_events SET supervisor_user_id = NULL WHERE supervisor_user_id = $1', params: [id] },
      { sql: 'UPDATE exhibitor_branding_files SET approved_by = NULL WHERE approved_by = $1', params: [id] },
      { sql: 'UPDATE exhibitor_documents SET uploaded_by = NULL WHERE uploaded_by = $1', params: [id] },
      { sql: 'UPDATE documents SET user_id = NULL WHERE user_id = $1', params: [id] },
      { sql: 'UPDATE communications SET user_id = NULL WHERE user_id = $1', params: [id] },
      { sql: 'UPDATE invitation_templates SET created_by = NULL WHERE created_by = $1', params: [id] },
      { sql: 'UPDATE invitations SET exhibitor_id = NULL WHERE exhibitor_id = $1', params: [id] }
    ];

    for (const stmt of cleanupStatements) {
      try {
        await client.query(stmt.sql, stmt.params);
      } catch (e) {
        console.warn('[users.delete] FK cleanup warning for query:', stmt.sql, e?.message || e);
      }
    }

    // Delete user
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');

    console.log(`User deleted: ${user.first_name} ${user.last_name} (${user.email})`);

    client.release();
    res.json({
      success: true,
      message: `Użytkownik ${user.first_name} ${user.last_name} został usunięty`
    });

  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    client.release();
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd podczas usuwania użytkownika',
      message: error.message
    });
  }
});

module.exports = router; 