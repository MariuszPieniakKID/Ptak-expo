const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// File type configurations with dimensions and allowed formats
const FILE_TYPES = {
  'kolorowe_tlo_logo_wydarzenia': {
    name: 'Kolorowe tło z logiem wydarzenia (E-Identyfikator wystawcy)',
    dimensions: '305x106',
    allowedFormats: ['png', 'jpg', 'jpeg'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  'tlo_wydarzenia_logo_zaproszenia': {
    name: 'Tło wydarzenia z logiem (E-zaproszenia)',
    dimensions: '152x106',
    allowedFormats: ['png', 'svg'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  'biale_logo_identyfikator': {
    name: 'Białe Logo (E-Identyfikator)',
    dimensions: '104x34',
    allowedFormats: ['png', 'svg'],
    maxSize: 2 * 1024 * 1024 // 2MB
  },
  'banner_wystawcy_800': {
    name: 'Banner dla wystawcy z miejscem na logo',
    dimensions: '800x800',
    allowedFormats: ['png', 'jpg', 'jpeg'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  'banner_wystawcy_1200': {
    name: 'Banner dla wystawcy z miejscem na logo (duży)',
    dimensions: '1200x1200',
    allowedFormats: ['png', 'jpg', 'jpeg'],
    maxSize: 15 * 1024 * 1024 // 15MB
  },
  'logo_ptak_expo': {
    name: 'Logo PTAK EXPO',
    dimensions: '200x200',
    allowedFormats: ['png', 'jpg', 'jpeg'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  'dokumenty_brandingowe': {
    name: 'Dokumenty brandingowe dla wystawcy',
    dimensions: null,
    allowedFormats: ['pdf'],
    maxSize: 20 * 1024 * 1024 // 20MB
  }
};

// Create uploads directory structure
const ensureUploadDir = async (exhibitorId) => {
  const uploadDir = path.join(__dirname, '../../uploads/exhibitors', exhibitorId.toString(), 'branding');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    return uploadDir;
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw new Error('Failed to create upload directory');
  }
};

// Upload branding file
const uploadBrandingFile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { exhibitorId, exhibitionId, fileType } = req.body;
    const uploadedFile = req.file;

    // Validate required fields
    if (!exhibitorId || !exhibitionId || !fileType) {
      return res.status(400).json({
        error: 'Missing required fields: exhibitorId, exhibitionId, fileType'
      });
    }

    // Validate file type
    if (!FILE_TYPES[fileType]) {
      return res.status(400).json({
        error: 'Invalid file type'
      });
    }

    // Validate file was uploaded
    if (!uploadedFile) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const config = FILE_TYPES[fileType];
    
    // Validate file format
    const fileExtension = path.extname(uploadedFile.originalname).toLowerCase().slice(1);
    if (!config.allowedFormats.includes(fileExtension)) {
      return res.status(400).json({
        error: `Invalid file format. Allowed formats: ${config.allowedFormats.join(', ')}`
      });
    }

    // Validate file size
    if (uploadedFile.size > config.maxSize) {
      return res.status(400).json({
        error: `File too large. Maximum size: ${config.maxSize / 1024 / 1024}MB`
      });
    }

    // Verify exhibitor exists and current user has access
    const exhibitorCheck = await client.query(
      'SELECT id, role FROM users WHERE id = $1 AND role = $2',
      [exhibitorId, 'exhibitor']
    );

    if (exhibitorCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Exhibitor not found'
      });
    }

    // Admin ma dostęp do wszystkich plików - nie sprawdzamy ownership
    const currentUser = req.user; // Set by verifyToken middleware
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Only admins can manage branding files.'
      });
    }

    // Verify exhibition exists
    const exhibitionCheck = await client.query(
      'SELECT id FROM exhibitions WHERE id = $1',
      [exhibitionId]
    );

    if (exhibitionCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Exhibition not found'
      });
    }

    // Generate unique filename
    const uniqueFilename = `${uuidv4()}_${Date.now()}.${fileExtension}`;
    const uploadDir = await ensureUploadDir(exhibitorId);
    const filePath = path.join(uploadDir, uniqueFilename);
    const relativePath = path.join('uploads/exhibitors', exhibitorId.toString(), 'branding', uniqueFilename);

    // Move uploaded file to final location
    await fs.rename(uploadedFile.path, filePath);

    // Delete existing file of same type (if any)
    const existingFile = await client.query(
      'SELECT file_path FROM exhibitor_branding_files WHERE exhibitor_id = $1 AND exhibition_id = $2 AND file_type = $3',
      [exhibitorId, exhibitionId, fileType]
    );

    if (existingFile.rows.length > 0) {
      const oldFilePath = path.join(__dirname, '../..', existingFile.rows[0].file_path);
      try {
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.warn('Failed to delete old file:', error.message);
      }
    }

    // Save file info to database
    const result = await client.query(
      `INSERT INTO exhibitor_branding_files 
       (exhibitor_id, exhibition_id, file_type, file_name, original_name, file_path, file_size, mime_type, dimensions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (exhibitor_id, exhibition_id, file_type) 
       DO UPDATE SET 
         file_name = EXCLUDED.file_name,
         original_name = EXCLUDED.original_name,
         file_path = EXCLUDED.file_path,
         file_size = EXCLUDED.file_size,
         mime_type = EXCLUDED.mime_type,
         dimensions = EXCLUDED.dimensions,
         updated_at = NOW()
       RETURNING *`,
      [exhibitorId, exhibitionId, fileType, uniqueFilename, uploadedFile.originalname, 
       relativePath, uploadedFile.size, uploadedFile.mimetype, config.dimensions]
    );

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: result.rows[0].id,
        fileType: result.rows[0].file_type,
        fileName: result.rows[0].file_name,
        originalName: result.rows[0].original_name,
        filePath: result.rows[0].file_path,
        fileSize: result.rows[0].file_size,
        mimeType: result.rows[0].mime_type,
        dimensions: result.rows[0].dimensions,
        createdAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error uploading branding file:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
};

// Get branding files for exhibitor and exhibition
const getBrandingFiles = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { exhibitorId, exhibitionId } = req.params;

    if (!exhibitorId || !exhibitionId) {
      return res.status(400).json({
        error: 'Missing required parameters: exhibitorId, exhibitionId'
      });
    }

    const result = await client.query(
      `SELECT 
         id, file_type, file_name, original_name, file_path, file_size, 
         mime_type, dimensions, is_approved, created_at, updated_at
       FROM exhibitor_branding_files 
       WHERE exhibitor_id = $1 AND exhibition_id = $2
       ORDER BY file_type, created_at DESC`,
      [exhibitorId, exhibitionId]
    );

    // Group files by type
    const filesByType = {};
    result.rows.forEach(file => {
      filesByType[file.file_type] = {
        id: file.id,
        fileType: file.file_type,
        fileName: file.file_name,
        originalName: file.original_name,
        filePath: file.file_path,
        fileSize: file.file_size,
        mimeType: file.mime_type,
        dimensions: file.dimensions,
        isApproved: file.is_approved,
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        config: FILE_TYPES[file.file_type]
      };
    });

    res.json({
      success: true,
      exhibitorId: parseInt(exhibitorId),
      exhibitionId: parseInt(exhibitionId),
      files: filesByType,
      fileTypes: FILE_TYPES
    });

  } catch (error) {
    console.error('Error fetching branding files:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
};

// Delete branding file
const deleteBrandingFile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { fileId } = req.params;
    const { exhibitorId } = req.body;

    if (!fileId) {
      return res.status(400).json({
        error: 'Missing required parameter: fileId'
      });
    }

    // Get file info - admin ma dostęp do wszystkich plików
    const fileResult = await client.query(
      'SELECT * FROM exhibitor_branding_files WHERE id = $1',
      [fileId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({
        error: 'File not found'
      });
    }

    const file = fileResult.rows[0];
    const filePath = path.join(__dirname, '../..', file.file_path);

    // Delete file from filesystem
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Failed to delete file from filesystem:', error.message);
    }

    // Delete from database
    await client.query(
      'DELETE FROM exhibitor_branding_files WHERE id = $1',
      [fileId]
    );

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting branding file:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
};

// Serve branding file
const serveBrandingFile = async (req, res) => {
  try {
    const { exhibitorId, fileName } = req.params;
    
    if (!exhibitorId || !fileName) {
      return res.status(400).json({
        error: 'Missing required parameters'
      });
    }

    const filePath = path.join(__dirname, '../../uploads/exhibitors', exhibitorId.toString(), 'branding', fileName);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        error: 'File not found'
      });
    }

    // Set CORS headers for images - use set() to override defaults
    res.set({
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    });
    
    // Serve file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Error serving branding file:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = {
  uploadBrandingFile,
  getBrandingFiles,
  deleteBrandingFile,
  serveBrandingFile,
  FILE_TYPES
}; 