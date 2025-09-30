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
            `SELECT id, title, description FROM marketing_materials WHERE exhibition_id = $1 AND id = ANY($2::int[])`,
            [exhibitionId, ids]
          );
          if (q.rows.length > 0) {
            const list = q.rows.map((b) => `<li><strong>${b.title}</strong>${b.description ? ' – ' + b.description : ''}</li>`).join('');
            offersBlock = `<h4>Oferta specjalna:</h4><ul>${list}</ul>`;
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

      const headerImgHtml = headerImageUrl ? `<div style=\"height:160px;overflow:hidden;margin-bottom:16px;\"><img alt=\"header\" src=\"${headerImageUrl}\" style=\"width:100%;height:100%;object-fit:cover;\"/></div>` : '';

      const html = `<!doctype html><html><head><meta charset=\"utf-8\"/></head><body style=\"font-family:Arial,sans-serif;color:#333;line-height:1.5;\">${headerImgHtml}
        ${greetingLine ? `<p>${greetingLine}</p>` : ''}
        ${contentHtml ? `<div>${contentHtml.replace(/\n/g, '<br/>')}</div>` : ''}
        ${tpl.booth_info ? `<p style=\"margin-top:12px;\"><strong>Stoisko:</strong> ${tpl.booth_info}</p>` : ''}
        ${offersBlock}
        ${companyInfo ? `<p style=\"margin-top:16px;\">${companyInfo.replace(/\n/g, '<br/>')}</p>` : ''}
        ${contactBlock ? `<p style=\"margin-top:8px;color:#555;\">${contactBlock}</p>` : ''}
      </body></html>`;

      // Insert recipient row first (to keep record even if email fails)
      const insRes = await client.query(
        `INSERT INTO invitation_recipients (
           invitation_template_id, recipient_email, recipient_name, recipient_company, sent_at, response_status
         ) VALUES ($1, $2, $3, $4, NOW(), 'pending')
         RETURNING id, created_at`,
        [templateId, recipientEmail, recipientName || null, null]
      );
      const recipientRow = insRes.rows[0];

      // Attempt to create e-identifier (exhibitor_people) and generate PDF attachment
      let attachments = undefined;
      try {
        // Resolve exhibitorId for current user
        let exhibitorId = null;
        if (req.user && req.user.role !== 'admin') {
          // Map by email
          const me = await client.query('SELECT id FROM exhibitors WHERE email = $1 LIMIT 1', [req.user.email]);
          exhibitorId = me.rows?.[0]?.id || null;
          if (!exhibitorId) {
            const rel = await client.query('SELECT exhibitor_id FROM exhibitor_events WHERE supervisor_user_id = $1 LIMIT 1', [req.user.id]);
            exhibitorId = rel.rows?.[0]?.exhibitor_id || null;
          }
        } else {
          // Admin may optionally pass exhibitorId in body to attach person under a specific exhibitor
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
              `INSERT INTO exhibitor_people (exhibitor_id, exhibition_id, full_name, position, email)
               VALUES ($1, $2, $3, $4, $5)`,
              [exhibitorId, parseInt(exhibitionId, 10), personFullName, 'Gość', recipientEmail]
            );
          } catch (e) {
            console.warn('[sendInvitation] exhibitor_people insert failed:', e?.message || e);
          }
        }

        // Build Identifier PDF (compact A6) using event branding if available
        const pdfBuffer = await buildIdentifierPdf(
          client,
          parseInt(exhibitionId, 10),
          { personName: personFullName, personEmail: recipientEmail, accessCode: String(recipientRow.id) },
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

    const rows = await pool.query(
      `SELECT r.id, r.recipient_email, r.recipient_name, r.sent_at, r.response_status,
              t.invitation_type, t.title
       FROM invitation_recipients r
       JOIN invitation_templates t ON t.id = r.invitation_template_id
       WHERE t.exhibition_id = $1
       ORDER BY r.created_at DESC`,
      [exhibitionId]
    );

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

module.exports.sendInvitation = sendInvitation;
module.exports.listRecipientsByExhibition = listRecipientsByExhibition;