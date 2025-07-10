const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Brak tokenu autoryzacji'
    });
  }

  const token = authHeader.split(' ')[1]; // Remove 'Bearer ' prefix
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token nie został podany'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy token'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Dostęp tylko dla administratorów'
    });
  }
  next();
};

// Middleware to check if user is exhibitor or admin
const requireExhibitorOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'exhibitor' && req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      message: 'Dostęp tylko dla wystawców i administratorów'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireExhibitorOrAdmin
}; 