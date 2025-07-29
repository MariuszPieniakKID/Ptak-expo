const { pool } = require('../config/database');

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
      is_template = false
    } = req.body;

    if (!exhibitionId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Exhibition ID, tytuł i treść są wymagane'
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Błąd autoryzacji - brak danych użytkownika'
      });
    }

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
            is_template = $12,
            updated_at = NOW()
          WHERE id = $1 AND exhibition_id = $2
          RETURNING *
        `;
        values = [
          invitationId, exhibitionId, title, content, greeting,
          company_info, contact_person, contact_email, contact_phone,
          booth_info, special_offers, is_template
        ];
      } else {
        // Create new invitation
        query = `
          INSERT INTO invitation_templates (
            exhibition_id, invitation_type, title, content, greeting,
            company_info, contact_person, contact_email, contact_phone,
            booth_info, special_offers, is_template, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `;
        values = [
          exhibitionId, invitation_type, title, content, greeting,
          company_info, contact_person, contact_email, contact_phone,
          booth_info, special_offers, is_template, userId
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
          e.title as exhibition_title
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