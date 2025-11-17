const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/v1/activity-logs
// Pobierz logi aktywności z filtrowaniem
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, entityType, action, page = 0, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        al.*,
        u.first_name,
        u.last_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Filtrowanie po dacie
    if (startDate) {
      query += ` AND al.created_at >= $${paramCount}`;
      params.push(new Date(startDate));
      paramCount++;
    }
    
    if (endDate) {
      query += ` AND al.created_at <= $${paramCount}`;
      params.push(new Date(endDate));
      paramCount++;
    }
    
    // Filtrowanie po typie encji
    if (entityType) {
      query += ` AND al.entity_type = $${paramCount}`;
      params.push(entityType);
      paramCount++;
    }
    
    // Filtrowanie po akcji
    if (action) {
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }
    
    // Sortowanie i paginacja
    query += ` ORDER BY al.created_at DESC`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), Number(page) * Number(limit));
    
    const result = await db.query(query, params);
    
    // Pobierz całkowitą liczbę logów dla paginacji
    let countQuery = `SELECT COUNT(*) FROM activity_logs al WHERE 1=1`;
    const countParams = [];
    let countParamNum = 1;
    
    if (startDate) {
      countQuery += ` AND al.created_at >= $${countParamNum}`;
      countParams.push(new Date(startDate));
      countParamNum++;
    }
    
    if (endDate) {
      countQuery += ` AND al.created_at <= $${countParamNum}`;
      countParams.push(new Date(endDate));
      countParamNum++;
    }
    
    if (entityType) {
      countQuery += ` AND al.entity_type = $${countParamNum}`;
      countParams.push(entityType);
      countParamNum++;
    }
    
    if (action) {
      countQuery += ` AND al.action = $${countParamNum}`;
      countParams.push(action);
      countParamNum++;
    }
    
    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać logów aktywności'
    });
  }
});

module.exports = router;

