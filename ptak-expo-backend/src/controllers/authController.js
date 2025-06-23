const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Test user credentials
const TEST_CREDENTIALS = {
  email: process.env.TEST_EMAIL || 'test@test.com',
  password: process.env.TEST_PASSWORD || 'test123'
};

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

// Login endpoint
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email i hasło są wymagane'
      });
    }

    // Check if using test credentials
    if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
      // Create test user response
      const testUser = {
        id: 1,
        email: TEST_CREDENTIALS.email,
        first_name: 'Test',
        last_name: 'User',
        role: 'exhibitor',
        company_name: 'Test Company'
      };

      const token = generateToken(testUser);

      return res.json({
        success: true,
        message: 'Logowanie zakończone pomyślnie',
        user: {
          id: testUser.id,
          email: testUser.email,
          firstName: testUser.first_name,
          lastName: testUser.last_name,
          role: testUser.role,
          companyName: testUser.company_name
        },
        token
      });
    }

    // If not test credentials, check database (when properly configured)
    if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://username:password@host/dbname?sslmode=require') {
      try {
        const result = await db.query(
          'SELECT * FROM users WHERE email = $1 AND is_active = true',
          [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'Nieprawidłowy email lub hasło'
          });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

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
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Brak tokenu autoryzacji'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({
      success: true,
      message: 'Token jest ważny',
      user: decoded
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token jest nieprawidłowy lub wygasł'
    });
  }
};

// Logout endpoint (for completeness)
const logout = async (req, res) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Wylogowano pomyślnie'
  });
};

module.exports = {
  login,
  verifyToken,
  logout
}; 