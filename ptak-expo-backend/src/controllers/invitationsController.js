const { pool } = require('../config/database');
const { buildIdentifierPdf } = require('../utils/identifierPdf');

// Get invitations for exhibition
const getInvitations = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
    
    if (!exhibitionId) {
      return res.status(400).json({
        success: false,
        message: 'Exhibition ID jest wymagane'
      });
    }

    console.log(`Fetching invitations for exhibition ${exhibitionId}...`);
    
    const client = await pool.connect();
    try {
      // Get all invitations for this exhibition
      const invitationsQuery = `
        SELECT 
          i.*,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM invitation_templates i
        LEFT JOIN users u ON i.created_by = u.id
        WHERE i.exhibition_id = $1 
        AND i.is_active = true
        ORDER BY i.created_at DESC
      `;
      
      const invitationsResult = await client.query(invitationsQuery, [exhibitionId]);
      
      if (invitationsResult.rows.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Brak zaproszeń dla tego wydarzenia',
          data: {
            invitations: [],
            hasInvitations: false
          }
        });
      }

      // Get recipient statistics for each invitation
      const invitationsWithStats = await Promise.all(
        invitationsResult.rows.map(async (invitation) => {
          const statsQuery = `
            SELECT 
              COUNT(*) as total_recipients,
              COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as sent_count,
              COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened_count,
              COUNT(CASE WHEN response_status = 'accepted' THEN 1 END) as accepted_count
            FROM invitation_recipients 
            WHERE invitation_template_id = $1
          `;
          
          const statsResult = await client.query(statsQuery, [invitation.id]);
          return {
            ...invitation,
            stats: statsResult.rows[0] || {
              total_recipients: 0,
              sent_count: 0,
              opened_count: 0,
              accepted_count: 0
            }
          };
        })
      );

      res.status(200).json({
        success: true,
        message: 'Zaproszenia pobrane pomyślnie',
        data: {
          invitations: invitationsWithStats,
          hasInvitations: true,
          totalCount: invitationsWithStats.length
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania zaproszeń',
      error: error.message
    });
  }
};

// Create or update invitation
const saveInvitation = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
    const {
      invitation_type = 'standard',
      title,
      content,
      greeting,
      company_info,
      contact_person,
      contact_email,
      contact_phone,
      booth_info,
      special_offers,
      vip_value,
      is_template = false
    } = req.body;

    if (!exhibitionId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Exhibition ID, tytuł i treść są wymagane'
      });
    }

    // Admin może tworzyć zaproszenia bez przypisywania do siebie
    const userId = req.user?.id || null;

    console.log(`Creating/updating invitation for exhibition ${exhibitionId}...`);
    
    const client = await pool.connect();
    try {
      // Check if invitation already exists for this exhibition and type
      const existingQuery = `
        SELECT id FROM invitation_templates 
        WHERE exhibition_id = $1 AND invitation_type = $2 AND is_active = true
      `;
      const existingResult = await client.query(existingQuery, [exhibitionId, invitation_type]);

      let query, values;
      
      if (existingResult.rows.length > 0) {
        // Update existing invitation
        const invitationId = existingResult.rows[0].id;
        query = `
          UPDATE invitation_templates SET
            title = $3,
            content = $4,
            greeting = $5,
            company_info = $6,
            contact_person = $7,
            contact_email = $8,
            contact_phone = $9,
            booth_info = $10,
            special_offers = $11,
            vip_value = $12,
            is_template = $13,
            updated_at = NOW()
          WHERE id = $1 AND exhibition_id = $2
          RETURNING *
        `;
        values = [
          invitationId, exhibitionId, title, content, greeting,
          company_info, contact_person, contact_email, contact_phone,
          booth_info, special_offers, vip_value || null, is_template
        ];
      } else {
        // Create new invitation
        query = `
          INSERT INTO invitation_templates (
            exhibition_id, invitation_type, title, content, greeting,
            company_info, contact_person, contact_email, contact_phone,
            booth_info, special_offers, vip_value, is_template, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `;
        values = [
          exhibitionId, invitation_type, title, content, greeting,
          company_info, contact_person, contact_email, contact_phone,
          booth_info, special_offers, vip_value || null, is_template, null  // Nie przypisuj do konkretnego użytkownika
        ];
      }

      const result = await client.query(query, values);
      
      res.status(200).json({
        success: true,
        message: existingResult.rows.length > 0 
          ? 'Zaproszenie zostało zaktualizowane pomyślnie'
          : 'Zaproszenie zostało utworzone pomyślnie',
        data: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error saving invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas zapisywania zaproszenia',
      error: error.message
    });
  }
};

// Get single invitation by ID
const getInvitationById = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    if (!invitationId) {
      return res.status(400).json({
        success: false,
        message: 'Invitation ID jest wymagane'
      });
    }

    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          i.*,
          u.first_name || ' ' || u.last_name as created_by_name,
          e.name as exhibition_title
        FROM invitation_templates i
        LEFT JOIN users u ON i.created_by = u.id
        LEFT JOIN exhibitions e ON i.exhibition_id = e.id
        WHERE i.id = $1 AND i.is_active = true
      `;
      
      const result = await client.query(query, [invitationId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Zaproszenie nie zostało znalezione'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Zaproszenie pobrane pomyślnie',
        data: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching invitation by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania zaproszenia',
      error: error.message
    });
  }
};

// Delete invitation
const deleteInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    if (!invitationId) {
      return res.status(400).json({
        success: false,
        message: 'Invitation ID jest wymagane'
      });
    }

    const client = await pool.connect();
    try {
      // Soft delete - set is_active to false
      const query = `
        UPDATE invitation_templates SET 
          is_active = false, 
          updated_at = NOW()
        WHERE id = $1 AND is_active = true
        RETURNING id
      `;
      
      const result = await client.query(query, [invitationId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Zaproszenie nie zostało znalezione'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Zaproszenie zostało usunięte pomyślnie'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas usuwania zaproszenia',
      error: error.message
    });
  }
};

module.exports = {
  getInvitations,
  saveInvitation,
  getInvitationById,
  deleteInvitation
}; 

// ========== NEW: Send invitation to recipient using a template ==========
const { sendEmail } = require('../utils/emailService');

// POST /api/v1/invitations/:exhibitionId/send
const sendInvitation = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
    const { templateId, recipientName, recipientEmail } = req.body || {};

    if (!exhibitionId || !templateId || !recipientEmail) {
      return res.status(400).json({ success: false, message: 'Wymagane: exhibitionId, templateId, recipientEmail' });
    }

    const client = await pool.connect();
    try {
      // Validate template belongs to exhibition and is active
      const tplRes = await client.query(
        `SELECT t.*, e.name AS exhibition_name
         FROM invitation_templates t
         JOIN exhibitions e ON e.id = t.exhibition_id
         WHERE t.id = $1 AND t.exhibition_id = $2 AND t.is_active = true`,
        [templateId, exhibitionId]
      );
      if (tplRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Szablon zaproszenia nie został znaleziony' });
      }
      const tpl = tplRes.rows[0];

      // Compose email
      const subject = `Zaproszenie – ${tpl.exhibition_name || 'PTAK WARSAW EXPO'}`;
      const greeting = (tpl.greeting || '').trim();
      const namePart = (recipientName || '').trim();
      const greetingLine = greeting ? `${greeting}${namePart ? ' ' + namePart : ''},` : (namePart ? `${namePart},` : '');
      const contentHtml = (tpl.content || '').trim();
      const companyInfo = (tpl.company_info || '').trim();
      const contactBlock = [tpl.contact_person, tpl.contact_email, tpl.contact_phone].filter(Boolean).join(' • ');

      // Resolve benefits (marketing materials) content
      let offersBlock = '';
      try {
        const ids = (tpl.special_offers && typeof tpl.special_offers === 'string')
          ? String(tpl.special_offers).split(',').map((s) => Number(String(s).trim())).filter((n) => !Number.isNaN(n))
          : [];
        if (ids.length > 0) {
          const q = await client.query(
            `SELECT id, title, description, file_url FROM marketing_materials WHERE exhibition_id = $1 AND id = ANY($2::int[])`,
            [exhibitionId, ids]
          );
          if (q.rows.length > 0) {
            // Build HTML with images
            const proto = String(req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http'));
            const host = (req.headers['x-forwarded-host'] || req.get('host') || '').toString();
            const base = (process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim())
              ? process.env.PUBLIC_BASE_URL.trim().replace(/\/$/, '')
              : `${proto}://${host}`;
            
            const list = q.rows.map((b) => {
              let imageHtml = '';
              if (b.file_url) {
                const imageUrl = `${base}${b.file_url}`;
                imageHtml = `<div style="text-align:center;margin:12px 0;"><img src="${imageUrl}" alt="${b.title}" style="max-width:100%;max-height:200px;height:auto;display:inline-block;border-radius:4px;" /></div>`;
              }
              return `<li style="margin-bottom:20px;padding:12px;background:#f9f9f9;border-radius:8px;">${imageHtml}<div style="margin-top:8px;"><strong>${b.title}</strong>${b.description ? '<br/>' + b.description : ''}</div></li>`;
            }).join('');
            offersBlock = `<h4>Oferta specjalna:</h4><ul style="list-style-type:none;padding:0;">${list}</ul>`;
          }
        }
      } catch {}

      // Invitations header image from branding: prefer 'mailing_header_800x300', fallback to legacy 'tlo_wydarzenia_logo_zaproszenia'
      let headerImageUrl = null;
      try {
        const f = await client.query(
          `SELECT file_path FROM exhibitor_branding_files 
           WHERE exhibitor_id IS NULL AND exhibition_id = $1 
             AND file_type IN ('mailing_header_800x300', 'tlo_wydarzenia_logo_zaproszenia')
           ORDER BY CASE file_type 
                      WHEN 'mailing_header_800x300' THEN 0 
                      WHEN 'tlo_wydarzenia_logo_zaproszenia' THEN 1 
                    END, created_at DESC 
           LIMIT 1`,
          [exhibitionId]
        );
        if (f.rows.length > 0 && f.rows[0].file_path) {
          const fileName = String(f.rows[0].file_path).split('/').pop();
          // Build absolute URL: prefer PUBLIC_BASE_URL, otherwise infer from request
          const proto = String(req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http'));
          const host = (req.headers['x-forwarded-host'] || req.get('host') || '').toString();
          const base = (process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim())
            ? process.env.PUBLIC_BASE_URL.trim().replace(/\/$/, '')
            : `${proto}://${host}`;
          headerImageUrl = `${base}/api/v1/exhibitor-branding/serve/global/${encodeURIComponent(fileName)}`;
        }
      } catch {}

      const headerImgHtml = headerImageUrl ? `<div style=\"text-align:center;margin-bottom:16px;background:#f5f5f5;padding:20px;\"><img alt=\"header\" src=\"${headerImageUrl}\" style=\"max-width:100%;height:auto;display:inline-block;\"/></div>` : '';

      const html = `<!doctype html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;color:#333;line-height:1.5;\">${headerImgHtml}
        ${greetingLine ? `<p>${greetingLine}</p>` : ''}
        ${contentHtml ? `<div>${contentHtml.replace(/\n/g, '<br/>')}</div>` : ''}
        ${tpl.booth_info ? `<p style=\"margin-top:12px;\"><strong>Stoisko:</strong> ${tpl.booth_info}</p>` : ''}
        ${offersBlock}
        ${companyInfo ? `<p style=\"margin-top:16px;\">${companyInfo.replace(/\n/g, '<br/>')}</p>` : ''}
        ${contactBlock ? `<p style=\"margin-top:8px;color:#555;\">${contactBlock}</p>` : ''}
      </body></html>`;

      // Resolve exhibitorId for current user BEFORE inserting recipient
      let exhibitorId = null;
      if (req.user && req.user.role !== 'admin') {
        // Map by email
        const me = await client.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
        exhibitorId = me.rows?.[0]?.id || null;
        if (!exhibitorId) {
          const rel = await client.query('SELECT exhibitor_id FROM exhibitor_events WHERE supervisor_user_id = $1 LIMIT 1', [req.user.id]);
          exhibitorId = rel.rows?.[0]?.exhibitor_id || null;
        }
      }

      // Insert recipient row first (to keep record even if email fails)
      // Set exhibitor_id if sent by exhibitor (NULL if sent by admin for test)
      const insRes = await client.query(
        `INSERT INTO invitation_recipients (
           invitation_template_id, recipient_email, recipient_name, recipient_company, sent_at, response_status, exhibitor_id
         ) VALUES ($1, $2, $3, $4, NOW(), 'pending', $5)
         RETURNING id, created_at`,
        [templateId, recipientEmail, recipientName || null, null, exhibitorId]
      );
      const recipientRow = insRes.rows[0];

      // Generate proper accessCode according to QR algorithm
      // Format: [Exhibition Name][Exhibition ID (4 digits)][Exhibitor ID with "w" (4 digits)][Entry ID (9 digits)][rnd + 6 digits][Entry ID repeated]
      let generatedAccessCode = null;
      try {
        const eventCode = String(tpl.exhibition_name || '').replace(/\s+/g, ' ').trim();
        const eventIdPadded = String(exhibitionId).padStart(4, '0');
        const exhibitorIdPadded = 'w' + String(exhibitorId || 0).padStart(3, '0');
        const entryId = (() => {
          const ts = Date.now().toString().slice(-6);
          const rnd = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
          return ts.slice(0,3) + rnd.slice(0,3) + ts.slice(3);
        })();
        const rndSuffix = 'rnd' + Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
        generatedAccessCode = `${eventCode}${eventIdPadded}${exhibitorIdPadded}${entryId}${rndSuffix}${entryId}`;
        console.log('[sendInvitation] Generated accessCode:', generatedAccessCode);
      } catch (e) {
        console.warn('[sendInvitation] Failed to generate accessCode, using fallback:', e?.message);
        generatedAccessCode = `INVITE${exhibitionId}${recipientRow.id}${Date.now()}`;
      }

      // Attempt to create e-identifier (exhibitor_people) and generate PDF attachment
      let attachments = undefined;
      try {
        // Admin may optionally pass exhibitorId in body to attach person under a specific exhibitor
        if (!exhibitorId) {
          const bodyExhibitorId = req.body && req.body.exhibitorId ? parseInt(req.body.exhibitorId, 10) : null;
          if (Number.isInteger(bodyExhibitorId)) {
            exhibitorId = bodyExhibitorId;
          }
        }

        const personFullName = (recipientName && String(recipientName).trim()) || String(recipientEmail).split('@')[0];

        if (exhibitorId) {
          // Ensure exhibitor_people table exists (ignore error if not)
          try {
            await client.query(
              `INSERT INTO exhibitor_people (exhibitor_id, exhibition_id, full_name, position, email, access_code)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [exhibitorId, parseInt(exhibitionId, 10), personFullName, 'Gość', recipientEmail, generatedAccessCode]
            );
          } catch (e) {
            console.warn('[sendInvitation] exhibitor_people insert failed:', e?.message || e);
          }
        }

        // Build Identifier PDF (compact A6) using event branding if available
        const pdfBuffer = await buildIdentifierPdf(
          client,
          parseInt(exhibitionId, 10),
          { personName: personFullName, personEmail: recipientEmail, accessCode: generatedAccessCode, personType: 'Gość' },
          exhibitorId || undefined
        );

        if (pdfBuffer) {
          attachments = [{ filename: 'e-identyfikator.pdf', content: pdfBuffer, contentType: 'application/pdf' }];
        }
      } catch (e) {
        console.warn('[sendInvitation] e-identifier generation error:', e?.message || e);
      }

      // Send email via SMTP (with identifier PDF if generated)
      const mailResult = await sendEmail({ to: recipientEmail, subject, html, attachments });
      if (!mailResult.success) {
        // Keep DB row; report error
        return res.status(500).json({ success: false, message: 'Nie udało się wysłać zaproszenia', error: mailResult.error });
      }

      return res.json({
        success: true,
        message: 'Zaproszenie wysłane',
        data: {
          id: recipientRow.id,
          recipientEmail,
          recipientName: recipientName || null,
          invitationType: tpl.invitation_type || 'standard',
          status: 'wysłane',
          sentAt: recipientRow.created_at
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error sending invitation:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas wysyłania zaproszenia', error: error.message });
  }
};

// GET /api/v1/invitations/:exhibitionId/recipients
const listRecipientsByExhibition = async (req, res) => {
  try {
    const { exhibitionId } = req.params;
    if (!exhibitionId) {
      return res.status(400).json({ success: false, message: 'Exhibition ID jest wymagane' });
    }

    // If exhibitor is requesting, restrict to recipients linked to this exhibitor for this exhibition
    let rows;
    if (req.user && req.user.role === 'exhibitor') {
      // resolve exhibitor_id by user email
      const exq = await pool.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
      const exhibitorId = exq.rows?.[0]?.id || null;
      if (!exhibitorId) {
        return res.json({ success: true, data: [] });
      }
      // Only count invitations actually sent by THIS exhibitor (not test invitations from admin)
      rows = await pool.query(
        `SELECT r.id, r.recipient_email, r.recipient_name, r.sent_at, r.response_status,
                t.invitation_type, t.title
         FROM invitation_recipients r
         JOIN invitation_templates t ON t.id = r.invitation_template_id
         WHERE t.exhibition_id = $1
           AND r.exhibitor_id = $2
         ORDER BY r.created_at DESC`,
        [exhibitionId, exhibitorId]
      );
    } else {
      // admin or other roles: optionally filter by exhibitorId if provided
      const exhibitorIdParam = req.query.exhibitorId ? parseInt(req.query.exhibitorId, 10) : null;
      
      if (exhibitorIdParam) {
        // Admin requesting specific exhibitor's recipients (only those sent by exhibitor, not test invitations)
        rows = await pool.query(
          `SELECT r.id, r.recipient_email, r.recipient_name, r.sent_at, r.response_status,
                  t.invitation_type, t.title
           FROM invitation_recipients r
           JOIN invitation_templates t ON t.id = r.invitation_template_id
           WHERE t.exhibition_id = $1
             AND r.exhibitor_id = $2
           ORDER BY r.created_at DESC`,
          [exhibitionId, exhibitorIdParam]
        );
      } else {
        // Admin requesting all recipients for exhibition
        rows = await pool.query(
          `SELECT r.id, r.recipient_email, r.recipient_name, r.sent_at, r.response_status,
                  t.invitation_type, t.title
           FROM invitation_recipients r
           JOIN invitation_templates t ON t.id = r.invitation_template_id
           WHERE t.exhibition_id = $1
           ORDER BY r.created_at DESC`,
          [exhibitionId]
        );
      }
    }

    const data = rows.rows.map((r) => ({
      id: r.id,
      recipientEmail: r.recipient_email,
      recipientName: r.recipient_name,
      invitationType: r.invitation_type || 'standard',
      templateTitle: r.title,
      status: r.sent_at ? 'wysłane' : (r.response_status || 'pending'),
      sentAt: r.sent_at
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error listing invitation recipients:', error);
    return res.status(500).json({ success: false, message: 'Błąd podczas pobierania listy zaproszeń' });
  }
};

// GET /api/v1/invitations/admin/all
// Admin endpoint to fetch all invitations with comprehensive filtering and statistics
const getAllInvitationsAdmin = async (req, res) => {
  try {
    const { exhibitionId, exhibitorId, status, search, sortBy = 'sent_at', sortOrder = 'desc' } = req.query;

    const client = await pool.connect();
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (exhibitionId) {
        whereConditions.push(`t.exhibition_id = $${paramIndex}`);
        queryParams.push(exhibitionId);
        paramIndex++;
      }

      if (exhibitorId) {
        whereConditions.push(`r.exhibitor_id = $${paramIndex}`);
        queryParams.push(exhibitorId);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`r.response_status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (search && search.trim()) {
        whereConditions.push(`(
          r.recipient_email ILIKE $${paramIndex} OR 
          r.recipient_name ILIKE $${paramIndex} OR 
          r.recipient_company ILIKE $${paramIndex} OR
          ex.company_name ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Validate sortBy to prevent SQL injection
      const validSortColumns = ['sent_at', 'recipient_email', 'recipient_name', 'company_name', 'exhibition_name'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'sent_at';
      const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Main query to fetch all invitations with details
      // Build ORDER BY clause based on sortColumn
      let orderByClause = 'r.sent_at';
      if (sortColumn === 'recipient_email') orderByClause = 'r.recipient_email';
      else if (sortColumn === 'recipient_name') orderByClause = 'r.recipient_name';
      else if (sortColumn === 'company_name') orderByClause = 'ex.company_name';
      else if (sortColumn === 'exhibition_name') orderByClause = 'e.name';
      
      const query = `
        SELECT 
          r.id,
          r.recipient_email,
          r.recipient_name,
          r.recipient_company,
          r.sent_at,
          r.opened_at,
          r.responded_at,
          r.response_status,
          r.created_at,
          t.id as template_id,
          t.title as template_title,
          t.invitation_type,
          e.id as exhibition_id,
          e.name as exhibition_name,
          e.start_date as exhibition_start_date,
          e.end_date as exhibition_end_date,
          ex.id as exhibitor_id,
          ex.company_name,
          ex.email as exhibitor_email,
          ex.phone as exhibitor_phone
        FROM invitation_recipients r
        LEFT JOIN invitation_templates t ON r.invitation_template_id = t.id
        LEFT JOIN exhibitions e ON t.exhibition_id = e.id
        LEFT JOIN exhibitors ex ON r.exhibitor_id = ex.id
        ${whereClause}
        ORDER BY ${orderByClause} ${sortDirection} NULLS LAST, r.id DESC
      `;

      const result = await client.query(query, queryParams);

      // Get summary statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_invitations,
          COUNT(CASE WHEN r.sent_at IS NOT NULL THEN 1 END) as sent_count,
          COUNT(CASE WHEN r.opened_at IS NOT NULL THEN 1 END) as opened_count,
          COUNT(CASE WHEN r.response_status = 'accepted' THEN 1 END) as accepted_count,
          COUNT(CASE WHEN r.response_status = 'pending' THEN 1 END) as pending_count,
          COUNT(DISTINCT r.exhibitor_id) as unique_exhibitors,
          COUNT(DISTINCT t.exhibition_id) as unique_exhibitions
        FROM invitation_recipients r
        LEFT JOIN invitation_templates t ON r.invitation_template_id = t.id
        LEFT JOIN exhibitors ex ON r.exhibitor_id = ex.id
        ${whereClause}
      `;

      const statsResult = await client.query(statsQuery, queryParams);
      const stats = statsResult.rows[0];

      return res.json({
        success: true,
        data: result.rows,
        summary: {
          totalInvitations: parseInt(stats.total_invitations) || 0,
          sent: parseInt(stats.sent_count) || 0,
          opened: parseInt(stats.opened_count) || 0,
          accepted: parseInt(stats.accepted_count) || 0,
          pending: parseInt(stats.pending_count) || 0,
          uniqueExhibitors: parseInt(stats.unique_exhibitors) || 0,
          uniqueExhibitions: parseInt(stats.unique_exhibitions) || 0
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching all invitations:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania zaproszeń',
      error: error.message
    });
  }
};

// GET /api/v1/invitations/admin/export-csv
// Export invitations to CSV with same filtering as getAllInvitationsAdmin
const exportInvitationsCSV = async (req, res) => {
  try {
    const { exhibitionId, exhibitorId, status, search } = req.query;

    const client = await pool.connect();
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Build WHERE conditions (same as getAllInvitationsAdmin)
      if (exhibitionId) {
        whereConditions.push(`t.exhibition_id = $${paramIndex}`);
        queryParams.push(exhibitionId);
        paramIndex++;
      }

      if (exhibitorId) {
        whereConditions.push(`r.exhibitor_id = $${paramIndex}`);
        queryParams.push(exhibitorId);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`r.response_status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (search && search.trim()) {
        whereConditions.push(`(
          r.recipient_email ILIKE $${paramIndex} OR 
          r.recipient_name ILIKE $${paramIndex} OR 
          r.recipient_company ILIKE $${paramIndex} OR
          ex.company_name ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          r.id,
          r.recipient_email,
          r.recipient_name,
          r.recipient_company,
          r.sent_at,
          r.opened_at,
          r.responded_at,
          r.response_status,
          t.title as template_title,
          t.invitation_type,
          e.name as exhibition_name,
          e.start_date as exhibition_start_date,
          e.end_date as exhibition_end_date,
          ex.company_name,
          ex.email as exhibitor_email,
          ex.phone as exhibitor_phone
        FROM invitation_recipients r
        LEFT JOIN invitation_templates t ON r.invitation_template_id = t.id
        LEFT JOIN exhibitions e ON t.exhibition_id = e.id
        LEFT JOIN exhibitors ex ON r.exhibitor_id = ex.id
        ${whereClause}
        ORDER BY r.sent_at DESC, r.id DESC
      `;

      const result = await client.query(query, queryParams);

      // Build CSV
      const headers = [
        'ID',
        'Email odbiorcy',
        'Nazwa odbiorcy',
        'Firma odbiorcy',
        'Data wysłania',
        'Data otwarcia',
        'Data odpowiedzi',
        'Status',
        'Typ zaproszenia',
        'Tytuł szablonu',
        'Nazwa wydarzenia',
        'Data rozpoczęcia',
        'Data zakończenia',
        'Firma wystawcy',
        'Email wystawcy',
        'Telefon wystawcy'
      ];

      let csv = headers.join(',') + '\n';

      result.rows.forEach(row => {
        const formatDate = (date) => date ? new Date(date).toLocaleString('pl-PL') : '';
        const escapeCSV = (str) => {
          if (str === null || str === undefined) return '';
          const stringValue = String(str);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        };

        const values = [
          escapeCSV(row.id),
          escapeCSV(row.recipient_email),
          escapeCSV(row.recipient_name),
          escapeCSV(row.recipient_company),
          escapeCSV(formatDate(row.sent_at)),
          escapeCSV(formatDate(row.opened_at)),
          escapeCSV(formatDate(row.responded_at)),
          escapeCSV(row.response_status),
          escapeCSV(row.invitation_type),
          escapeCSV(row.template_title),
          escapeCSV(row.exhibition_name),
          escapeCSV(formatDate(row.exhibition_start_date)),
          escapeCSV(formatDate(row.exhibition_end_date)),
          escapeCSV(row.company_name),
          escapeCSV(row.exhibitor_email),
          escapeCSV(row.exhibitor_phone)
        ];

        csv += values.join(',') + '\n';
      });

      // Set headers for CSV download
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="zaproszenia-${timestamp}.csv"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Add BOM for proper Excel UTF-8 support
      res.write('\uFEFF');
      res.write(csv);
      res.end();

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error exporting invitations CSV:', error);
    return res.status(500).json({
      success: false,
      message: 'Błąd podczas eksportowania zaproszeń do CSV',
      error: error.message
    });
  }
};

module.exports.sendInvitation = sendInvitation;
module.exports.listRecipientsByExhibition = listRecipientsByExhibition;
module.exports.getAllInvitationsAdmin = getAllInvitationsAdmin;
module.exports.exportInvitationsCSV = exportInvitationsCSV;