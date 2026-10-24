const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Token admina żyje 7 dni, więc status konta trzeba sprawdzać przy każdym żądaniu –
// inaczej dezaktywowany pracownik miałby dostęp do końca ważności tokenu.
const STATUS_TTL_MS = 30 * 1000;
const statusCache = new Map();

const forgetUserStatus = (userId) => statusCache.delete(Number(userId));

const isAdminActive = async (userId) => {
  const id = Number(userId);
  const cached = statusCache.get(id);
  if (cached && cached.expires > Date.now()) return cached.active;
  const r = await db.query('SELECT status FROM users WHERE id = $1', [id]);
  const active = r.rows.length > 0 && (!r.rows[0].status || r.rows[0].status === 'active');
  statusCache.set(id, { active, expires: Date.now() + STATUS_TTL_MS });
  return active;
};

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  // Try to get token from Authorization header first
  if (authHeader) {
    token = authHeader.split(' ')[1]; // Remove 'Bearer ' prefix
  }
  
  // If no token in header, try query parameter (for file serving)
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token nie został podany'
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Nieprawidłowy token'
    });
  }

  if (decoded && decoded.role === 'admin') {
    try {
      if (!(await isAdminActive(decoded.id))) {
        return res.status(401).json({
          success: false,
          message: 'Konto jest nieaktywne'
        });
      }
    } catch (e) {
      console.error('[auth] Nie udało się sprawdzić statusu konta:', e.message);
      return res.status(503).json({ success: false, message: 'Chwilowy błąd serwera, spróbuj ponownie' });
    }
  }

  req.user = decoded;
  next();
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
  isAdminActive,
  forgetUserStatus,
  requireAdmin,
  requireExhibitorOrAdmin
}; 