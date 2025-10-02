const pool = require('../config/database');

// GET /api/v1/trade-plan-links/:exhibitionId
const listLinks = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
    
    const result = await pool.query(
      `SELECT id, title, url, display_order, created_at, updated_at
       FROM trade_plan_links
       WHERE exhibition_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [exhibitionId]
    );
    
    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error listing trade plan links:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania linków'
    });
  }
};

// POST /api/v1/trade-plan-links/:exhibitionId
const createLink = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
    const { title, url } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'Tytuł i URL są wymagane'
      });
    }
    
    // Get max display_order for this exhibition
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(display_order), -1) as max_order FROM trade_plan_links WHERE exhibition_id = $1',
      [exhibitionId]
    );
    const nextOrder = maxOrder.rows[0].max_order + 1;
    
    const result = await pool.query(
      `INSERT INTO trade_plan_links (exhibition_id, title, url, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [exhibitionId, title, url, nextOrder]
    );
    
    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating trade plan link:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas tworzenia linku'
    });
  }
};

// PUT /api/v1/trade-plan-links/:linkId
const updateLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { title, url } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'Tytuł i URL są wymagane'
      });
    }
    
    const result = await pool.query(
      `UPDATE trade_plan_links
       SET title = $1, url = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [title, url, linkId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Link nie został znaleziony'
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating trade plan link:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas aktualizacji linku'
    });
  }
};

// DELETE /api/v1/trade-plan-links/:linkId
const deleteLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM trade_plan_links WHERE id = $1 RETURNING *',
      [linkId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Link nie został znaleziony'
      });
    }
    
    return res.json({
      success: true,
      message: 'Link został usunięty'
    });
  } catch (error) {
    console.error('Error deleting trade plan link:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas usuwania linku'
    });
  }
};

module.exports = {
  listLinks,
  createLink,
  updateLink,
  deleteLink
};

