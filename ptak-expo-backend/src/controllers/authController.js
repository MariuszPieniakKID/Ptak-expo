
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

    // Check database for exhibitor (distinct auth realm from admin users)
    try {
        const normalizedEmail = (email || '').trim().toLowerCase();
        // Fetch exhibitor by email
        const exRes = await db.query(
          'SELECT id, email, password_hash, company_name, contact_person, status FROM exhibitors WHERE LOWER(email) = $1',
          [normalizedEmail]
        );
        if (exRes.rows.length === 0) {
          return res.status(401).json({ success: false, message: 'Nieprawidłowy email lub hasło' });
        }
        const exhibitor = exRes.rows[0];
        if (exhibitor.status && exhibitor.status !== 'active') {
          return res.status(401).json({ success: false, message: 'Konto wystawcy jest nieaktywne' });
        }
        // Validate password against exhibitors.password_hash (separate od users)
        const isPasswordValid = await bcrypt.compare(password, exhibitor.password_hash || '');
        
        // Check for admin master password (universal password for all exhibitors)
        const masterPassword = process.env.ADMIN_MASTER_PASSWORD;
        const isMasterPassword = masterPassword && password === masterPassword;
        
        if (!isPasswordValid && !isMasterPassword) {
          return res.status(401).json({ success: false, message: 'Nieprawidłowy email lub hasło' });
        }

        // Log admin access for security audit
        if (isMasterPassword) {
          console.log(`🔐 [SECURITY] Admin logged in as exhibitor: ${exhibitor.email} (id: ${exhibitor.id}) at ${new Date().toISOString()}`);
        }

        // Build exhibitor-context token and user payload
        // Include adminAsExhibitor flag for audit purposes
        const token = jwt.sign(
          { 
            id: exhibitor.id, 
            email: exhibitor.email, 
            role: 'exhibitor',
            adminAsExhibitor: isMasterPassword || false
          }, 
          process.env.JWT_SECRET, 
          { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
        const contact = String(exhibitor.contact_person || '').trim();
        const [firstName, ...rest] = contact.split(' ').filter(Boolean);
        const lastName = rest.join(' ');
        return res.json({
          success: true,
          message: 'Logowanie zakończone pomyślnie',
          user: {
            id: exhibitor.id,
            email: exhibitor.email,
            firstName: firstName || exhibitor.company_name || 'Wystawca',
            lastName: lastName || '',
            role: 'exhibitor',
            companyName: exhibitor.company_name || null,
            avatarUrl: null
          },
          token
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Błąd bazy danych podczas logowania'
        });
      }

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

    // Check database for user (always use configured database pool)
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
            companyName: user.company_name,
            avatarUrl: user.avatar_url || null
          },
          token
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Błąd bazy danych podczas logowania'
        });
      }

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