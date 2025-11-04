-- Migration: Add access_code to invitation_recipients
-- Date: 2025-11-04
-- Purpose: Store QR access codes for invitations to enable verification

-- 1. Add access_code column to invitation_recipients
ALTER TABLE invitation_recipients 
ADD COLUMN IF NOT EXISTS access_code VARCHAR(255);

-- 2. Add index for fast lookups during QR verification
CREATE INDEX IF NOT EXISTS idx_invitation_recipients_access_code 
ON invitation_recipients(access_code);

-- 3. Add exhibition_id column if not exists (for easier queries)
ALTER TABLE invitation_recipients 
ADD COLUMN IF NOT EXISTS exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE;

-- 4. Add exhibitor_id column if not exists (already should exist but making sure)
ALTER TABLE invitation_recipients
ADD COLUMN IF NOT EXISTS exhibitor_id INTEGER REFERENCES exhibitors(id) ON DELETE SET NULL;

-- 5. Create index on exhibition_id for performance
CREATE INDEX IF NOT EXISTS idx_invitation_recipients_exhibition_id 
ON invitation_recipients(exhibition_id);

-- 6. Create index on exhibitor_id for performance  
CREATE INDEX IF NOT EXISTS idx_invitation_recipients_exhibitor_id
ON invitation_recipients(exhibitor_id);

-- Note: Existing invitation_recipients rows will have NULL access_code
-- They can be regenerated using the regenerate script or by resending invitations

