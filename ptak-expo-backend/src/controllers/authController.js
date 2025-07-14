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

// Login endpoint
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔍 LOGIN ATTEMPT - Backend Version 3.0 - STATUS FIELD FIXED');
    console.log('🔍 Login attempt for email:', email);
    console.log('🔍 Request headers:', req.headers);

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
        console.log('🔍 Querying database for user:', email.toLowerCase());
        console.log('🔍 Using SIMPLE QUERY without STATUS field (Railway compatibility)');
        const result = await db.query(
          'SELECT * FROM users WHERE email = $1',
          [email.toLowerCase()]
        );

        console.log('🔍 Query result:', result.rows.length, 'rows found');
        if (result.rows.length > 0) {
          console.log('🔍 Found user:', result.rows[0].email, 'role:', result.rows[0].role);
        }
        if (result.rows.length === 0) {
          console.log('🔍 No user found with email:', email.toLowerCase());
          return res.status(401).json({
            success: false,
            message: 'Nieprawidłowy email lub hasło'
          });
        }

        const user = result.rows[0];
        console.log('🔍 User found:', user.email, 'role:', user.role);
        console.log('🔍 Stored password hash:', user.password_hash);
        
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('🔍 Password valid:', isPasswordValid);

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
  verifyToken,
  logout
}; 