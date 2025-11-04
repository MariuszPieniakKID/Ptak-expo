const db = require('../config/database');

/**
 * Verify QR code and return access information
 * GET /api/v1/qr-verify/:code
 */
const verifyQRCode = async (req, res) => {
  try {
    const { code } = req.params;

    // Validate input
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Kod QR jest wymagany'
      });
    }

    // Search for the access code in BOTH exhibitor_people and invitation_recipients tables
    // First try exhibitor_people
    let result = await db.query(`
      SELECT 
        p.id,
        p.full_name,
        p.position,
        p.email,
        p.access_code,
        p.created_at,
        e.id as exhibitor_id,
        e.company_name,
        e.nip,
        ex.id as exhibition_id,
        ex.name as exhibition_name,
        ex.start_date,
        ex.end_date,
        ex.location,
        ex.status as exhibition_status,
        'exhibitor_people' as source
      FROM exhibitor_people p
      LEFT JOIN exhibitors e ON p.exhibitor_id = e.id
      LEFT JOIN exhibitions ex ON p.exhibition_id = ex.id
      WHERE p.access_code = $1
      LIMIT 1
    `, [code.trim()]);

    // If not found in exhibitor_people, try invitation_recipients
    if (result.rows.length === 0) {
      result = await db.query(`
        SELECT 
          r.id,
          r.recipient_name as full_name,
          'Gość' as position,
          r.recipient_email as email,
          r.access_code,
          r.created_at,
          e.id as exhibitor_id,
          e.company_name,
          e.nip,
          ex.id as exhibition_id,
          ex.name as exhibition_name,
          ex.start_date,
          ex.end_date,
          ex.location,
          ex.status as exhibition_status,
          'invitation' as source
        FROM invitation_recipients r
        LEFT JOIN exhibitors e ON r.exhibitor_id = e.id
        LEFT JOIN exhibitions ex ON r.exhibition_id = ex.id
        WHERE r.access_code = $1
        LIMIT 1
      `, [code.trim()]);
    }

    // If code not found in either table, try FUZZY MATCHING for ALL exhibitions
    if (result.rows.length === 0) {
      console.log('[qrVerifyController] Code not found in database, trying fuzzy matching...');
      
      // Extract fixed parts from the scanned code
      const fuzzyMatch = tryFuzzyMatch(code.trim());
      
      if (fuzzyMatch.canMatch) {
        console.log(`[qrVerifyController] Fuzzy matching for exhibition ${fuzzyMatch.exhibitionId}, exhibitor ${fuzzyMatch.exhibitorId}`);
        
        // Search for invitation_recipients without access_code
        // Match PRECISELY by: exhibition_id + exhibitor_id
        // Only if there's EXACTLY ONE match (to avoid wrong person)
        
        if (!fuzzyMatch.exhibitorId || !fuzzyMatch.exhibitionId) {
          console.log('[qrVerifyController] ⚠️  Cannot fuzzy match - missing exhibition or exhibitor ID in code');
          return res.status(404).json({
            success: false,
            valid: false,
            message: 'Kod QR nie został znaleziony w systemie'
          });
        }
        
        const fuzzyQuery = `
          SELECT 
            r.id,
            r.recipient_name as full_name,
            'Gość (zaproszenie - odzyskane)' as position,
            r.recipient_email as email,
            r.access_code,
            r.created_at,
            e.id as exhibitor_id,
            e.company_name,
            e.nip,
            ex.id as exhibition_id,
            ex.name as exhibition_name,
            ex.start_date,
            ex.end_date,
            ex.location,
            ex.status as exhibition_status,
            'invitation_fuzzy' as source,
            r.sent_at
          FROM invitation_recipients r
          LEFT JOIN exhibitors e ON r.exhibitor_id = e.id
          LEFT JOIN exhibitions ex ON ex.id = r.exhibition_id
          WHERE r.exhibition_id = $1
            AND r.exhibitor_id = $2
            AND r.access_code IS NULL
          ORDER BY r.sent_at DESC
        `;
        
        const fuzzyResult = await db.query(fuzzyQuery, [fuzzyMatch.exhibitionId, fuzzyMatch.exhibitorId]);
        
        if (fuzzyResult.rows.length === 0) {
          console.log(`[qrVerifyController] ⚠️  No invitations found for exhibitor ${fuzzyMatch.exhibitorId} without access_code`);
        } else if (fuzzyResult.rows.length === 1) {
          // Perfect! Exactly one match
          const match = fuzzyResult.rows[0];
          console.log(`[qrVerifyController] ✅ EXACT match found for exhibitor ${fuzzyMatch.exhibitorId}`);
          console.log(`[qrVerifyController] Email: ${match.email}, Name: ${match.full_name}`);
          
          // Update invitation_recipients with the scanned access_code
          try {
            await db.query(
              `UPDATE invitation_recipients SET access_code = $1 WHERE id = $2`,
              [code.trim(), match.id]
            );
            console.log(`[qrVerifyController] ✅ Saved scanned code to database (ID: ${match.id})`);
            
            // Update result to include the saved code
            match.access_code = code.trim();
            result.rows = [match];
            
          } catch (updateErr) {
            console.error('[qrVerifyController] Failed to save fuzzy matched code:', updateErr);
            // Continue anyway - at least verify this time
            result.rows = [match];
          }
        } else {
          // Multiple matches - need to pick the right one
          console.log(`[qrVerifyController] ⚠️  Found ${fuzzyResult.rows.length} invitations for exhibitor ${fuzzyMatch.exhibitorId}`);
          console.log(`[qrVerifyController] Using the most recent one (sent_at DESC)`);
          
          const match = fuzzyResult.rows[0]; // Take the most recent
          
          // Update invitation_recipients with the scanned access_code
          try {
            await db.query(
              `UPDATE invitation_recipients SET access_code = $1 WHERE id = $2`,
              [code.trim(), match.id]
            );
            console.log(`[qrVerifyController] ✅ Saved code to most recent invitation (ID: ${match.id})`);
            console.log(`[qrVerifyController] Email: ${match.email}, Name: ${match.full_name}`);
            
            match.access_code = code.trim();
            result.rows = [match];
            
          } catch (updateErr) {
            console.error('[qrVerifyController] Failed to save code:', updateErr);
            result.rows = [match];
          }
        }
      }
    }

    // If code not found even with fuzzy matching
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Kod QR nie został znaleziony w systemie'
      });
    }

    const person = result.rows[0];
    console.log(`[qrVerifyController] QR code verified from source: ${person.source}`);

    // Format dates for better readability
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    };

    // Return success with person and exhibition details
    return res.status(200).json({
      success: true,
      valid: true,
      message: 'Kod QR jest poprawny',
      data: {
        person: {
          id: person.id,
          fullName: person.full_name,
          position: person.position,
          email: person.email,
          registeredAt: person.created_at
        },
        exhibitor: {
          id: person.exhibitor_id,
          companyName: person.company_name,
          nip: person.nip
        },
        exhibition: {
          id: person.exhibition_id,
          name: person.exhibition_name,
          startDate: formatDate(person.start_date),
          endDate: formatDate(person.end_date),
          location: person.location,
          status: person.exhibition_status
        },
        accessCode: person.access_code || code.trim(),
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[qrVerifyController] Error verifying QR code:', error);
    return res.status(500).json({
      success: false,
      valid: false,
      message: 'Wystąpił błąd podczas weryfikacji kodu QR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Try to extract fixed parts from QR code for fuzzy matching
 * Works for ALL exhibitions - dynamically extracts exhibition_id and exhibitor_id
 * Format: [Exhibition Name][ExhibitionID 4 digits][w + ExhibitorID 3 digits][EntryID][rnd+random][EntryID]
 */
function tryFuzzyMatch(code) {
  try {
    // Check if code contains "rnd" (marker for random part - validates it's our QR format)
    if (!code.includes('rnd')) {
      return { canMatch: false };
    }
    
    // Find first occurrence of 4 consecutive digits followed by 'w' and 3-4 more digits
    // This pattern identifies: [ExhibitionID 4 digits][w][ExhibitorID 3-4 digits]
    // Note: ExhibitorID can be 3 or 4 digits due to padStart not truncating large IDs
    const pattern = /(\d{4})w(\d{3,4})/;
    const match = code.match(pattern);
    
    if (!match) {
      console.log('[fuzzyMatch] Could not find exhibition/exhibitor ID pattern in code');
      return { canMatch: false };
    }
    
    const exhibitionIdStr = match[1]; // First 4 digits
    const exhibitorIdStr = match[2];  // 3-4 digits after 'w'
    
    const exhibitionId = parseInt(exhibitionIdStr, 10);
    const exhibitorId = parseInt(exhibitorIdStr, 10);
    
    // Extract exhibition name (everything before the exhibition ID)
    const exhibitionIdIndex = code.indexOf(exhibitionIdStr + 'w');
    const exhibitionName = code.substring(0, exhibitionIdIndex).trim();
    
    if (!exhibitionName || exhibitionId <= 0) {
      console.log('[fuzzyMatch] Invalid exhibition data extracted');
      return { canMatch: false };
    }
    
    console.log('[fuzzyMatch] ✅ Code matches QR pattern');
    console.log('[fuzzyMatch] Exhibition:', exhibitionName, '(ID:', exhibitionId + ')');
    console.log('[fuzzyMatch] Exhibitor ID:', exhibitorId);
    
    return {
      canMatch: true,
      exhibitionId: exhibitionId,
      exhibitorId: exhibitorId > 0 ? exhibitorId : null,
      exhibitionName: exhibitionName
    };
    
  } catch (err) {
    console.error('[fuzzyMatch] Error parsing code:', err);
    return { canMatch: false };
  }
}

module.exports = {
  verifyQRCode
};
