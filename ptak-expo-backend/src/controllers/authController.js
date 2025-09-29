
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Exhibitor login endpoint (for ptak-expo-web)
const exhibitorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Exhibitor login

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email i hasło są wymagane'
      });
    }

    // Check database for user
    if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://username:password@host/dbname?sslmode=require') {
      try {
        // Query database for exhibitor with case-insensitive email
        const normalizedEmail = (email || '').trim().toLowerCase();
        let result;
        try {
          result = await db.query(
            'SELECT * FROM users WHERE LOWER(email) = $1 AND status = $2',
            [normalizedEmail, 'active']
          );
        } catch (statusError) {
          result = await db.query(
            'SELECT * FROM users WHERE LOWER(email) = $1',
            [normalizedEmail]
          );
        }

        // Query result
        if (result.rows.length > 0) {
          // Found user
          
          // Check if user has status column and if it's active
          if (result.rows[0].status && result.rows[0].status !== 'active') {
            // Inactive account
            return res.status(401).json({
              success: false,
              message: 'Konto jest nieaktywne'
            });
          }
        }
        if (result.rows.length === 0) {
          // No user found in users table – try exhibitors as fallback
          try {
            const exq = await db.query('SELECT * FROM exhibitors WHERE LOWER(email) = $1 LIMIT 1', [normalizedEmail]);
            if (exq.rows.length > 0) {
              const ex = exq.rows[0];
              if (ex.status && ex.status !== 'active') {
                return res.status(401).json({ success: false, message: 'Konto jest nieaktywne' });
              }
              const ok = ex.password_hash ? await bcrypt.compare(password, ex.password_hash) : false;
              if (ok) {
                // Upsert to users to keep auth consistent
                try {
                  await db.query(
                    `INSERT INTO users (email, password_hash, role, first_name, last_name, company_name, phone, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (email)
                     DO UPDATE SET 
                       password_hash = EXCLUDED.password_hash,
                       role = 'exhibitor',
                       first_name = EXCLUDED.first_name,
                       last_name = EXCLUDED.last_name,
                       company_name = EXCLUDED.company_name,
                       phone = EXCLUDED.phone,
                       status = 'active'`,
                    [
                      normalizedEmail,
                      ex.password_hash,
                      'exhibitor',
                      (ex.contact_person || '').split(' ')[0] || ex.contact_person || '',
                      (ex.contact_person || '').split(' ').slice(1).join(' ') || '',
                      ex.company_name || null,
                      ex.phone || null,
                      'active'
                    ]
                  );
                } catch (e) {
                  console.warn('users upsert (fallback) failed:', e?.message || e);
                }
                const mergedUser = {
                  id: ex.id,
                  email: ex.email,
                  role: 'exhibitor',
                  first_name: (ex.contact_person || '').split(' ')[0] || ex.contact_person || '',
                  last_name: (ex.contact_person || '').split(' ').slice(1).join(' ') || '',
                  company_name: ex.company_name || null,
                };
                const token = generateToken(mergedUser);
                return res.json({
                  success: true,
                  message: 'Logowanie zakończone pomyślnie',
                  user: {
                    id: mergedUser.id,
                    email: mergedUser.email,
                    firstName: mergedUser.first_name,
                    lastName: mergedUser.last_name,
                    role: mergedUser.role,
                    companyName: mergedUser.company_name
                  },
                  token
                });
              }
            }
          } catch (e) {
            console.warn('exhibitors (fallback) query failed:', e?.message || e);
          }
          return res.status(401).json({ success: false, message: 'Nieprawidłowy email lub hasło' });
        }

        const user = result.rows[0];
        // User found
        
        // Sprawdź czy użytkownik ma uprawnienia wystawcy
        if (user.role !== 'exhibitor') {
          // Not exhibitor
          return res.status(403).json({
            success: false,
            message: 'Dostęp tylko dla wystawców'
          });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        // Password check

        if (!isPasswordValid) {
          // If password mismatch, try exhibitors table and resync users password if valid there
          try {
            const exq = await db.query('SELECT * FROM exhibitors WHERE LOWER(email) = $1 LIMIT 1', [normalizedEmail]);
            if (exq.rows.length > 0) {
              const ex = exq.rows[0];
              if (ex.status && ex.status !== 'active') {
                return res.status(401).json({ success: false, message: 'Konto jest nieaktywne' });
              }
              const ok = ex.password_hash ? await bcrypt.compare(password, ex.password_hash) : false;
              if (ok) {
                try {
                  await db.query('UPDATE users SET password_hash = $1, role = $2, status = $3, updated_at = NOW() WHERE LOWER(email) = $4', [ex.password_hash, 'exhibitor', 'active', normalizedEmail]);
                } catch (e) {
                  console.warn('users password sync failed:', e?.message || e);
                }
                const token = generateToken({ ...user, role: 'exhibitor' });
                return res.json({
                  success: true,
                  message: 'Logowanie zakończone pomyślnie',
                  user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: 'exhibitor',
                    companyName: user.company_name
                  },
                  token
                });
              }
            }
          } catch (e) {
            console.warn('exhibitors fallback (password) failed:', e?.message || e);
          }
          return res.status(401).json({ success: false, message: 'Nieprawidłowy email lub hasło' });
        }

        const token = generateToken(user);
        return res.json({
          success: true,
          message: 'Logowanie zakończone pomyślnie',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            companyName: user.company_name
          },
          token
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    // If database not configured or user not found
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy email lub hasło'
    });

  } catch (error) {
    console.error('Exhibitor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas logowania'
    });
  }
};

// Admin login endpoint (for ptak-expo-frontend)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Admin login

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email i hasło są wymagane'
      });
    }

    // Check database for user
    if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://username:password@host/dbname?sslmode=require') {
      try {
        // Query database for user
        
        let result;
        
        // Try with status column first
        try {
          // Try query WITH status field
          result = await db.query(
            'SELECT * FROM users WHERE email = $1 AND status = $2',
            [email.toLowerCase(), 'active']
          );
          // Query with status succeeded
        } catch (statusError) {
          // Fallback without status column
          result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
          );
          // Simple query succeeded
        }

        // Query result
        if (result.rows.length > 0) {
          // Found user
          
          // Check if user has status column and if it's active
          if (result.rows[0].status && result.rows[0].status !== 'active') {
            // Inactive account
            return res.status(401).json({
              success: false,
              message: 'Konto jest nieaktywne'
            });
          }
        }
        if (result.rows.length === 0) {
          // No user found
          return res.status(401).json({
            success: false,
            message: 'Nieprawidłowy email lub hasło'
          });
        }

        const user = result.rows[0];
        // User found
        
        // Sprawdź czy użytkownik ma uprawnienia administratora
        if (user.role !== 'admin') {
          // Not admin
          return res.status(403).json({
            success: false,
            message: 'Dostęp tylko dla administratorów'
          });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        // Password check

        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Nieprawidłowy email lub hasło'
          });
        }

        const token = generateToken(user);
        return res.json({
          success: true,
          message: 'Logowanie zakończone pomyślnie',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            companyName: user.company_name
          },
          token
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    // If database not configured or user not found
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy email lub hasło'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas logowania'
    });
  }
};

// Verify token endpoint
const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Brak tokenu autoryzacji'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token nie został podany'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return res.json({
      success: true,
      message: 'Token jest prawidłowy',
      user: decoded
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy token'
    });
  }
};

// Logout endpoint
const logout = async (req, res) => {
  try {
    // For JWT tokens, logout is handled client-side by removing the token
    // In a production app, you might want to implement a token blacklist
    return res.json({
      success: true,
      message: 'Wylogowanie zakończone pomyślnie'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd serwera podczas wylogowania'
    });
  }
};

module.exports = {
  login,
  exhibitorLogin,
  verifyToken,
  logout
}; 