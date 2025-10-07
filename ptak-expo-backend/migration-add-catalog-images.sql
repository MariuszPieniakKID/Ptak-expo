-- Migration: Add 'catalog_images' to document_source CHECK constraint
-- Date: 2025-10-07
-- Description: Allows catalog_images as a valid document_source type for logo and product images

-- Drop existing constraint
ALTER TABLE exhibitor_documents 
DROP CONSTRAINT IF EXISTS exhibitor_documents_document_source_check;

-- Add updated constraint with catalog_images
ALTER TABLE exhibitor_documents 
ADD CONSTRAINT exhibitor_documents_document_source_check 
CHECK (document_source IN ('admin_exhibitor_card', 'exhibitor_self', 'admin_other', 'exhibitor_checklist_materials', 'catalog_images'));

