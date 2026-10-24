const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { verifyToken, requireAdmin, forgetUserStatus } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail, sendExhibitorPasswordResetEmail } = require('../utils/emailService');
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

// Panel wystawcy loguje po exhibitors.password_hash, więc hasło ustawione wystawcy w „Użytkownikach”
// musi trafić też tam – inaczej działa tylko w tabeli users i nie da się nim zalogować.
const ustawHasloWystawcy = async (email, passwordHash) => {
  const r = await db.query(
    'UPDATE exhibitors SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2) RETURNING id',
    [passwordHash, email]
  );
  return r.rowCount;
};

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

    // Opcjonalny filtr po roli, np. ?role=admin (używane m.in. do listy opiekunów wystaw)
    const roleFilter = typeof req.query.role === 'string' ? req.query.role.trim().toLowerCase() : '';
    const params = [];
    let whereClause = '';
    if (roleFilter) {
      params.push(roleFilter);
      whereClause = `WHERE LOWER(role) = $${params.length}`;
    }

    const query = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        avatar_url,
        status,
        created_at,
        updated_at
      FROM users 
      ${whereClause}
      ORDER BY last_name, first_name
    `;
    
    const result = await db.query(query, params);
    
    console.log(`Found ${result.rows.length} users${roleFilter ? ` (role=${roleFilter})` : ''}`);
    
    // Format the response
    const users = result.rows.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone || 'Brak numeru',
      role: user.role,
      status: user.status || 'active',
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
      'SELECT email, first_name, last_name, role FROM users WHERE id = $1',
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
    const isExhibitor = user.role === 'exhibitor' && (await ustawHasloWystawcy(user.email, password_hash)) > 0;
    
    console.log(`Password reset for user: ${user.first_name} ${user.last_name} (${user.email})`);
    
    // Wyślij email z nowym hasłem
    try {
      const emailResult = isExhibitor
        ? await sendExhibitorPasswordResetEmail(
          user.email,
          user.first_name,
          user.last_name,
          newPassword,
          `${process.env.EXHIBITOR_PANEL_URL || 'https://wystawca.exhibitorlist.warsawexpo.eu'}/login`
        )
        : await sendPasswordResetEmail(
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
    const existsQuery = await db.query('SELECT id, email, role FROM users WHERE id = $1', [id]);
    if (existsQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Użytkownik nie został znaleziony'
      });
    }
    const existing = existsQuery.rows[0];
    let newPasswordHash = null;

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
      newPasswordHash = await bcrypt.hash(password, saltRounds);
      pushField('password_hash', newPasswordHash);
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

    if (newPasswordHash && existing.role === 'exhibitor') {
      await ustawHasloWystawcy(existing.email, newPasswordHash);
    }

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

// Wszystko, co wskazuje na konto pracownika. Twarde usunięcie zerowałoby te powiązania
// (stoiska traciłyby opiekuna, historia autora), dlatego takie konto można tylko dezaktywować.
const USER_REFERENCES = [
  { label: 'stoiska jako opiekun', sql: 'SELECT COUNT(*)::int AS n FROM exhibitor_events WHERE supervisor_user_id = $1' },
  { label: 'wpisy w historii', sql: 'SELECT COUNT(*)::int AS n FROM activity_logs WHERE user_id = $1' },
  { label: 'zatwierdzone pliki brandingu', sql: 'SELECT COUNT(*)::int AS n FROM exhibitor_branding_files WHERE approved_by = $1' },
  { label: 'dodane dokumenty wystawców', sql: 'SELECT COUNT(*)::int AS n FROM exhibitor_documents WHERE uploaded_by = $1' },
  { label: 'dokumenty', sql: 'SELECT COUNT(*)::int AS n FROM documents WHERE user_id = $1' },
  { label: 'komunikaty', sql: 'SELECT COUNT(*)::int AS n FROM communications WHERE user_id = $1 OR created_by = $1' },
  { label: 'szablony zaproszeń', sql: 'SELECT COUNT(*)::int AS n FROM invitation_templates WHERE created_by = $1' },
  { label: 'zaproszenia', sql: 'SELECT COUNT(*)::int AS n FROM invitations WHERE exhibitor_id = $1' },
];

const countReferences = async (client, userId) => {
  const found = [];
  for (const ref of USER_REFERENCES) {
    const r = await client.query(ref.sql, [userId]);
    if (r.rows[0].n > 0) found.push({ label: ref.label, count: r.rows[0].n });
  }
  return found;
};

const UPCOMING_STANDS_SQL = `
  SELECT e.id AS exhibition_id, e.name AS exhibition_name, e.start_date, COUNT(*)::int AS stands
  FROM exhibitor_events ee
  JOIN exhibitions e ON e.id = ee.exhibition_id
  WHERE ee.supervisor_user_id = $1 AND (e.end_date IS NULL OR e.end_date >= CURRENT_DATE)
  GROUP BY e.id, e.name, e.start_date
  ORDER BY e.start_date NULLS LAST, e.name`;

const countActiveAdmins = async (client, exceptId) => {
  const r = await client.query(
    `SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin' AND COALESCE(status, 'active') = 'active' AND id <> $1`,
    [exceptId]
  );
  return r.rows[0].n;
};

// Przepisuje opiekuna stoisk na nadchodzących targach; zakończone targi zostają przy dotychczasowej osobie.
const reassignUpcomingStands = async (client, fromId, toId) => {
  const target = await client.query(
    `SELECT id FROM users WHERE id = $1 AND role = 'admin' AND COALESCE(status, 'active') = 'active'`,
    [toId]
  );
  if (target.rows.length === 0) {
    const err = new Error('Nowy opiekun musi być aktywnym pracownikiem');
    err.status = 400;
    throw err;
  }
  const r = await client.query(
    `UPDATE exhibitor_events ee SET supervisor_user_id = $2
     FROM exhibitions e
     WHERE e.id = ee.exhibition_id AND ee.supervisor_user_id = $1
       AND (e.end_date IS NULL OR e.end_date >= CURRENT_DATE)`,
    [fromId, toId]
  );
  return r.rowCount;
};

// GET /api/v1/users/:id/assignments - co jest przypisane do konta (przed dezaktywacją / usunięciem)
router.get('/:id/assignments', verifyToken, requireAdmin, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    const u = await client.query('SELECT id FROM users WHERE id = $1', [id]);
    if (u.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Użytkownik nie został znaleziony' });
    }
    const upcoming = await client.query(UPCOMING_STANDS_SQL, [id]);
    const references = await countReferences(client, id);
    res.json({
      success: true,
      data: {
        upcomingStands: upcoming.rows.reduce((s, r) => s + r.stands, 0),
        upcomingByExhibition: upcoming.rows.map((r) => ({
          exhibitionId: r.exhibition_id,
          exhibitionName: r.exhibition_name,
          startDate: r.start_date,
          stands: r.stands,
        })),
        references,
        canDelete: references.length === 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user assignments:', error);
    res.status(500).json({ success: false, error: 'Błąd podczas sprawdzania powiązań użytkownika' });
  } finally {
    client.release();
  }
});

// PATCH /api/v1/users/:id/status - aktywuj / dezaktywuj konto, opcjonalnie przepisując stoiska
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    const status = String(req.body?.status || '');
    const reassignTo = req.body?.reassignTo ? parseInt(req.body.reassignTo, 10) : null;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status musi mieć wartość active lub inactive' });
    }

    const u = await client.query('SELECT id, first_name, last_name, role, status FROM users WHERE id = $1', [id]);
    if (u.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Użytkownik nie został znaleziony' });
    }
    const user = u.rows[0];
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

    if (status === 'inactive') {
      if (Number(req.user.id) === id && req.user.role === 'admin') {
        return res.status(400).json({ success: false, error: 'Nie możesz dezaktywować własnego konta' });
      }
      if (user.role === 'admin' && (await countActiveAdmins(client, id)) === 0) {
        return res.status(400).json({ success: false, error: 'Nie można dezaktywować ostatniego aktywnego pracownika' });
      }
      if (reassignTo && reassignTo === id) {
        return res.status(400).json({ success: false, error: 'Wybierz innego pracownika jako nowego opiekuna' });
      }
    }

    await client.query('BEGIN');
    let reassigned = 0;
    if (status === 'inactive' && reassignTo) {
      reassigned = await reassignUpcomingStands(client, id, reassignTo);
    }
    await client.query('UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1', [id, status]);
    await client.query('COMMIT');
    forgetUserStatus(id);

    console.log(`[users] ${status === 'inactive' ? 'Dezaktywowano' : 'Aktywowano'} konto ${fullName} (id ${id}) przez ${req.user.email}${reassigned ? `, przepisano ${reassigned} stoisk na id ${reassignTo}` : ''}`);
    res.json({
      success: true,
      message: status === 'inactive'
        ? `Konto ${fullName} zostało dezaktywowane${reassigned ? `, przepisano stoiska: ${reassigned}` : ''}`
        : `Konto ${fullName} jest znów aktywne`,
      data: { id, status, reassigned },
    });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Error changing user status:', error);
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Błąd podczas zmiany statusu użytkownika' });
  } finally {
    client.release();
  }
});

// POST /api/v1/users/:id/reassign-stands - przepisz stoiska z nadchodzących targów na innego pracownika
router.post('/:id/reassign-stands', verifyToken, requireAdmin, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    const toId = parseInt(req.body?.toUserId, 10);
    if (!toId || toId === id) {
      return res.status(400).json({ success: false, error: 'Wybierz innego pracownika jako nowego opiekuna' });
    }
    await client.query('BEGIN');
    const reassigned = await reassignUpcomingStands(client, id, toId);
    await client.query('COMMIT');
    res.json({ success: true, message: `Przepisano stoiska: ${reassigned}`, data: { reassigned } });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('Error reassigning stands:', error);
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Błąd podczas przepisywania stoisk' });
  } finally {
    client.release();
  }
});

// DELETE /api/v1/users/:id - usuń użytkownika (tylko admin, tylko konto bez powiązań)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    const userQuery = await client.query(
      'SELECT id, first_name, last_name, email, role, status FROM users WHERE id = $1',
      [id]
    );
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Użytkownik nie został znaleziony' });
    }
    const user = userQuery.rows[0];

    if (Number(req.user.id) === id && req.user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Nie możesz usunąć własnego konta' });
    }
    if (user.role === 'admin' && (user.status || 'active') === 'active' && (await countActiveAdmins(client, id)) === 0) {
      return res.status(400).json({ success: false, error: 'Nie można usunąć ostatniego aktywnego pracownika' });
    }

    const references = await countReferences(client, id);
    if (references.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Tego konta nie można usunąć, bo ma powiązania (${references.map((r) => `${r.label}: ${r.count}`).join(', ')}). Dezaktywuj je zamiast usuwać.`,
        references,
      });
    }

    await client.query('DELETE FROM users WHERE id = $1', [id]);
    forgetUserStatus(id);
    console.log(`User deleted: ${user.first_name} ${user.last_name} (${user.email}) przez ${req.user.email}`);
    res.json({ success: true, message: `Użytkownik ${user.first_name} ${user.last_name} został usunięty` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Błąd podczas usuwania użytkownika', message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
