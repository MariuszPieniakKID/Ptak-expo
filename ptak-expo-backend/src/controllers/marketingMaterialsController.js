const path = require('path');
const { pool } = require('../config/database');

// List marketing materials (benefits) by exhibition
const listByExhibition = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
    if (!exhibitionId) {
      return res.status(400).json({ success: false, message: 'Exhibition ID jest wymagane' });
    }

    const result = await pool.query(
      `SELECT id, title, description, file_url, file_type, tags, is_public, created_at
       FROM marketing_materials
       WHERE exhibition_id = $1
       ORDER BY created_at DESC`,
      [exhibitionId]
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error listing marketing materials:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas pobierania benefitów', error: error.message });
  }
};

// Create marketing material (benefit) for exhibition
const createForExhibition = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    if (!exhibitionId || !title || !description) {
      return res.status(400).json({ success: false, message: 'Exhibition ID, tytuł i treść (opis) są wymagane' });
    }

    const storedRelativePath = file ? path.join('/uploads', 'marketing-materials', file.filename) : null;
    const mimeType = file ? (file.mimetype || null) : null;

    const insert = await pool.query(
      `INSERT INTO marketing_materials (title, description, file_url, file_type, exhibition_id, is_public)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, title, description, file_url, file_type, created_at`,
      [title, description, storedRelativePath, mimeType, exhibitionId]
    );

    return res.status(201).json({ success: true, message: 'Benefit został utworzony', data: insert.rows[0] });
  } catch (error) {
    console.error('Error creating marketing material:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas tworzenia benefitu', error: error.message });
  }
};

module.exports = {
  listByExhibition,
  createForExhibition,
  updateById: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
      const file = req.file;

      if (!id) {
        return res.status(400).json({ success: false, message: 'ID jest wymagane' });
      }

      let query = 'UPDATE marketing_materials SET ';
      const values = [];
      const sets = [];
      if (title !== undefined) { sets.push(`title = $${sets.length + 1}`); values.push(title); }
      if (description !== undefined) { sets.push(`description = $${sets.length + 1}`); values.push(description); }
      if (file) {
        const storedRelativePath = path.join('/uploads', 'marketing-materials', file.filename);
        sets.push(`file_url = $${sets.length + 1}`); values.push(storedRelativePath);
        sets.push(`file_type = $${sets.length + 1}`); values.push(file.mimetype || null);
      }
      sets.push(`updated_at = NOW()`);
      query += sets.join(', ') + ` WHERE id = $${values.length + 1} RETURNING id, title, description, file_url, file_type, updated_at`;
      values.push(id);

      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Benefit nie znaleziony' });
      }
      return res.status(200).json({ success: true, message: 'Benefit zaktualizowany', data: result.rows[0] });
    } catch (error) {
      console.error('Error updating marketing material:', error);
      return res.status(500).json({ success: false, message: 'Błąd podczas aktualizacji benefitu', error: error.message });
    }
  },
  deleteById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID jest wymagane' });
      }
      const del = await pool.query('DELETE FROM marketing_materials WHERE id = $1 RETURNING id', [id]);
      if (del.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Benefit nie znaleziony' });
      }
      return res.status(200).json({ success: true, message: 'Benefit usunięty' });
    } catch (error) {
      console.error('Error deleting marketing material:', error);
      return res.status(500).json({ success: false, message: 'Błąd podczas usuwania benefitu', error: error.message });
    }
  }
};


