const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// Base directory for uploads; on Railway point this to a mounted volume (e.g., /data/uploads)
const getUploadsBase = () => {
  const base = process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, '../../uploads');
  return base;
};

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
  'event_logo': {
    name: 'Logo wydarzenia (lista i szczegóły wydarzenia)',
    dimensions: null,
    allowedFormats: ['png', 'jpg', 'jpeg', 'svg'],
    maxSize: 5 * 1024 * 1024 // 5MB
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
const ensureUploadDir = async (exhibitorId, exhibitionId) => {
  let uploadDir;
  const uploadsBase = getUploadsBase();
  
  if (exhibitorId) {
    // Individual exhibitor files
    uploadDir = path.join(uploadsBase, 'exhibitors', exhibitorId.toString(), 'branding');
  } else {
    // Global exhibition files
    uploadDir = path.join(uploadsBase, 'exhibitions', exhibitionId.toString(), 'branding');
  }
  
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

    // Validate required fields (exhibitorId is optional for global event files)
    if (!exhibitionId || !fileType) {
      return res.status(400).json({
        error: 'Missing required fields: exhibitionId, fileType'
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

    // Verify exhibitor exists in exhibitors table (only if exhibitorId is provided)
    if (exhibitorId) {
      const exhibitorCheck = await client.query(
        'SELECT id, company_name FROM exhibitors WHERE id = $1',
        [exhibitorId]
      );

      if (exhibitorCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Exhibitor not found'
        });
      }
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
    const uploadDir = await ensureUploadDir(exhibitorId, exhibitionId);
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Set relative path based on whether it's individual or global file
    // Store path relative to uploads base (without leading 'uploads' folder)
    const relativePath = exhibitorId 
      ? path.join('exhibitors', exhibitorId.toString(), 'branding', uniqueFilename)
      : path.join('exhibitions', exhibitionId.toString(), 'branding', uniqueFilename);

    // Move uploaded file to final location; also read into buffer for DB fallback
    let tempBuffer = null;
    try {
      // Try fast move; if cross-device, fall back to copy+unlink
      await fs.rename(uploadedFile.path, filePath);
    } catch (renameErr) {
      if (renameErr && renameErr.code === 'EXDEV') {
        const data = await fs.readFile(uploadedFile.path);
        await fs.writeFile(filePath, data);
        await fs.unlink(uploadedFile.path);
        tempBuffer = data;
      } else {
        throw renameErr;
      }
    }

    // Delete existing file of same type (if any) - legacy code, will be replaced by new logic below
    const legacyExistingFile = await client.query(
      'SELECT file_path FROM exhibitor_branding_files WHERE exhibitor_id = $1 AND exhibition_id = $2 AND file_type = $3',
      [exhibitorId, exhibitionId, fileType]
    );

    if (legacyExistingFile.rows.length > 0) {
      const uploadsBase = getUploadsBase();
      const oldStored = legacyExistingFile.rows[0].file_path || '';
      const normalized = oldStored.startsWith('uploads/') ? oldStored.replace(/^uploads\//, '') : oldStored;
      const oldFilePath = path.join(uploadsBase, normalized);
      try {
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.warn('Failed to delete old file:', error.message);
      }
    }

    // Check if file of same type already exists and delete it
    const existingFileQuery = exhibitorId 
      ? 'SELECT * FROM exhibitor_branding_files WHERE exhibitor_id = $1 AND exhibition_id = $2 AND file_type = $3'
      : 'SELECT * FROM exhibitor_branding_files WHERE exhibitor_id IS NULL AND exhibition_id = $1 AND file_type = $2';
    
    const existingFileParams = exhibitorId 
      ? [exhibitorId, exhibitionId, fileType]
      : [exhibitionId, fileType];
    
    const existingFile = await client.query(existingFileQuery, existingFileParams);
    
    if (existingFile.rows.length > 0) {
      // Delete existing file from filesystem
      const uploadsBase = getUploadsBase();
      const oldStored = existingFile.rows[0].file_path || '';
      const normalized = oldStored.startsWith('uploads/') ? oldStored.replace(/^uploads\//, '') : oldStored;
      const oldFilePath = path.join(uploadsBase, normalized);
      try {
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.warn('Failed to delete existing file:', error.message);
      }
      
      // Delete existing record from database
      const deleteQuery = exhibitorId 
        ? 'DELETE FROM exhibitor_branding_files WHERE exhibitor_id = $1 AND exhibition_id = $2 AND file_type = $3'
        : 'DELETE FROM exhibitor_branding_files WHERE exhibitor_id IS NULL AND exhibition_id = $1 AND file_type = $2';
      
      await client.query(deleteQuery, existingFileParams);
    }

    // Save file info to database
    const result = await client.query(
      `INSERT INTO exhibitor_branding_files 
       (exhibitor_id, exhibition_id, file_type, file_name, original_name, file_path, file_size, mime_type, dimensions, file_blob)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [exhibitorId, exhibitionId, fileType, uniqueFilename, uploadedFile.originalname, 
       relativePath, uploadedFile.size, uploadedFile.mimetype, config.dimensions, tempBuffer]
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
  // Get branding files
  const client = await pool.connect();
  
  try {
    const { exhibitorId, exhibitionId } = req.params;

    if (!exhibitorId || !exhibitionId) {
      return res.status(400).json({
        error: 'Missing required parameters: exhibitorId, exhibitionId'
      });
    }

    let query, params;
    
    if (exhibitorId === 'global') {
      // Get global event branding files (exhibitor_id IS NULL)
      query = `SELECT 
         id, file_type, file_name, original_name, file_path, file_size, 
         mime_type, dimensions, is_approved, created_at, updated_at
       FROM exhibitor_branding_files 
       WHERE exhibitor_id IS NULL AND exhibition_id = $1
       ORDER BY file_type, created_at DESC`;
      params = [parseInt(exhibitionId)];
    } else {
      // Get exhibitor-specific branding files
      query = `SELECT 
         id, file_type, file_name, original_name, file_path, file_size, 
         mime_type, dimensions, is_approved, created_at, updated_at
       FROM exhibitor_branding_files 
       WHERE exhibitor_id = $1 AND exhibition_id = $2
       ORDER BY file_type, created_at DESC`;
      params = [parseInt(exhibitorId), parseInt(exhibitionId)];
    }

    const result = await client.query(query, params);

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
      exhibitorId: exhibitorId === 'global' ? 0 : parseInt(exhibitorId), // Use 0 for global files
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
  // Serve branding file
  try {
    const { exhibitorId, fileName } = req.params;
    
    if (!exhibitorId || !fileName) {
      return res.status(400).json({
        error: 'Missing required parameters'
      });
    }

    let filePath;
    let fileRow = null;
    if (exhibitorId === 'global') {
      // For global files, we need the exhibition ID - extract from file metadata or use different approach
      // For now, let's find the file in the database first
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT file_path, mime_type, file_blob FROM exhibitor_branding_files WHERE exhibitor_id IS NULL AND file_name = $1',
          [fileName]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'File not found' });
        }
        fileRow = result.rows[0];
        {
          const uploadsBase = getUploadsBase();
          const stored = fileRow.file_path || '';
          const normalized = stored.startsWith('uploads/') ? stored.replace(/^uploads\//, '') : stored;
          filePath = path.join(uploadsBase, normalized);
        }
      } finally {
        client.release();
      }
    } else {
      // Look up row for exhibitor-specific file as well
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT file_path, mime_type, file_blob FROM exhibitor_branding_files WHERE exhibitor_id = $1 AND file_name = $2',
          [parseInt(exhibitorId), fileName]
        );
        if (result.rows.length > 0) {
          fileRow = result.rows[0];
          const uploadsBase = getUploadsBase();
          const stored = fileRow.file_path || '';
          const normalized = stored.startsWith('uploads/') ? stored.replace(/^uploads\//, '') : stored;
          filePath = path.join(uploadsBase, normalized);
        } else {
          // Fallback to expected path if DB row not found
          const uploadsBase = getUploadsBase();
          filePath = path.join(uploadsBase, 'exhibitors', exhibitorId.toString(), 'branding', fileName);
        }
      } finally {
        client.release();
      }
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      // If file missing on filesystem but blob exists in DB, stream from DB
      if (fileRow && fileRow.file_blob) {
        if (fileRow.mime_type) res.set('Content-Type', fileRow.mime_type);
        res.set('Accept-Ranges', 'bytes');
        return res.end(fileRow.file_blob);
      }
      return res.status(404).json({ error: 'File not found' });
    }

    // Set permissive CORS/CORP headers for serving files to allowed frontends
    const requestOrigin = req.headers.origin;
    res.set('Access-Control-Allow-Credentials', 'true');
    if (requestOrigin) {
      res.set('Access-Control-Allow-Origin', requestOrigin);
    }
    // Ensure resource can be embedded cross-origin (for images in frontend)
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
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