-- PTAK EXPO Database Schema
-- Database initialization script

-- Users table - all system users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'guest', -- 'exhibitor', 'admin', 'guest'
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'banned'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exhibitions table - trade fair events
CREATE TABLE IF NOT EXISTS exhibitions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(255),
    max_exhibitors INTEGER,
    registration_deadline DATE,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'active', 'completed', 'cancelled'
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exhibition registrations - who's participating
CREATE TABLE IF NOT EXISTS exhibition_registrations (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    booth_number VARCHAR(20),
    booth_size VARCHAR(20),
    special_requirements TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exhibition_id, user_id)
);

-- Documents table - exhibition documents
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500),
    file_type VARCHAR(50),
    category VARCHAR(100), -- 'regulations', 'forms', 'guidelines', 'brochures'
    is_public BOOLEAN DEFAULT false,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing materials table - promotional content
CREATE TABLE IF NOT EXISTS marketing_materials (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_type VARCHAR(50), -- 'banner', 'logo', 'brochure', 'video', 'image'
    file_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    is_approved BOOLEAN DEFAULT false,
    uploaded_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications table - system announcements
CREATE TABLE IF NOT EXISTS communications (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'announcement', -- 'announcement', 'alert', 'reminder', 'newsletter'
    target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'exhibitors', 'admins'
    is_urgent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert test data
INSERT INTO users (email, password_hash, role, first_name, last_name, company_name) 
VALUES (
    'test@test.com', 
    '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', -- test123
    'exhibitor',
    'Test',
    'User',
    'Test Company'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, role, first_name, last_name) 
VALUES (
    'admin@ptak-expo.com', 
    '$2a$10$hX.pUgc6uWoiNIpwY3pKi.sfuYiYsVuu5LSkqDElNNHUPDIbCT6Tu', -- admin123
    'admin',
    'Admin',
    'PTAK EXPO'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, role, first_name, last_name) 
VALUES (
    'test.admin@ptak-expo.com', 
    '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', -- test123
    'admin',
    'Test Admin',
    'PTAK EXPO'
) ON CONFLICT (email) DO NOTHING;

-- Insert additional test users for user management page
INSERT INTO users (email, password_hash, role, first_name, last_name, phone) 
VALUES (
    'magda.masny@warsawexpo.eu', 
    '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', -- test123
    'exhibitor',
    'Magda',
    'Masny',
    '+48 518 739 122'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, role, first_name, last_name, phone) 
VALUES (
    'quang.thuy@warsawexpo.eu', 
    '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', -- test123
    'exhibitor',
    'Quang',
    'Thuy',
    '+48 518 739 123'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, role, first_name, last_name, phone) 
VALUES (
    'anna.dereszowska@warsawexpo.eu', 
    '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', -- test123
    'exhibitor',
    'Anna',
    'Dereszowska',
    '+48 518 739 124'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, role, first_name, last_name, phone) 
VALUES (
    'marian.pienkowski@warsawexpo.eu', 
    '$2a$10$NLrhOzCPxUW1Xw/ylXHfwew4XJO90LnkqS.5VuI/kEy7jEU2CLT5G', -- test123
    'exhibitor',
    'Marian',
    'Pienkowski',
    '+48 518 739 125'
) ON CONFLICT (email) DO NOTHING;

-- Exhibitor branding files table - store branding assets for each exhibitor
CREATE TABLE IF NOT EXISTS exhibitor_branding_files (
    id SERIAL PRIMARY KEY,
    exhibitor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
    file_type VARCHAR(100) NOT NULL, -- 'kolorowe_tlo_logo_wydarzenia', 'tlo_wydarzenia_logo_zaproszenia', 'biale_logo_identyfikator', 'banner_wystawcy_800', 'banner_wystawcy_1200', 'logo_ptak_expo', 'dokumenty_brandingowe'
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    dimensions VARCHAR(50), -- e.g., '305x106', '800x800', etc.
    is_approved BOOLEAN DEFAULT false,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exhibitor_id, exhibition_id, file_type) -- Only one file per type per exhibitor per exhibition
);

-- Trade info table - exhibition trade information
CREATE TABLE IF NOT EXISTS trade_info (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
    exhibitor_start_time TIME,
    exhibitor_end_time TIME,
    visitor_start_time TIME,
    visitor_end_time TIME,
    guest_service_phone VARCHAR(50),
    security_phone VARCHAR(50),
    build_type VARCHAR(100),
    trade_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exhibition_id) -- Only one trade info per exhibition
);

-- Trade build days table - build schedule
CREATE TABLE IF NOT EXISTS trade_build_days (
    id SERIAL PRIMARY KEY,
    trade_info_id INTEGER REFERENCES trade_info(id) ON DELETE CASCADE,
    build_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade spaces table - exhibition spaces/halls
CREATE TABLE IF NOT EXISTS trade_spaces (
    id SERIAL PRIMARY KEY,
    trade_info_id INTEGER REFERENCES trade_info(id) ON DELETE CASCADE,
    space_name VARCHAR(255),
    hall_name VARCHAR(255),
    file_path VARCHAR(500),
    original_filename VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitation templates table - exhibition invitation templates management
CREATE TABLE IF NOT EXISTS invitation_templates (
    id SERIAL PRIMARY KEY,
    exhibition_id INTEGER REFERENCES exhibitions(id) ON DELETE CASCADE,
    invitation_type VARCHAR(100) DEFAULT 'standard', -- 'standard', 'vip', 'exhibitor', 'guest'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    greeting TEXT, -- "Szanowna Pani / Szanowny Panie"
    company_info TEXT,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    booth_info TEXT, -- Information about booth/stand
    special_offers TEXT, -- Special offers or benefits
    vip_value TEXT, -- dodatkowa wartość zaproszenia VIP
    is_template BOOLEAN DEFAULT false, -- Whether this is a template for future use
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitation recipients table - track who received invitations
CREATE TABLE IF NOT EXISTS invitation_recipients (
    id SERIAL PRIMARY KEY,
    invitation_template_id INTEGER REFERENCES invitation_templates(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_company VARCHAR(255),
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'maybe'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_exhibitions_status ON exhibitions(status);
CREATE INDEX IF NOT EXISTS idx_exhibition_registrations_exhibition_id ON exhibition_registrations(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_registrations_user_id ON exhibition_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_exhibition_id ON documents(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_marketing_materials_exhibition_id ON marketing_materials(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_communications_exhibition_id ON communications(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_branding_files_exhibitor_id ON exhibitor_branding_files(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_branding_files_exhibition_id ON exhibitor_branding_files(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_branding_files_type ON exhibitor_branding_files(file_type);
CREATE INDEX IF NOT EXISTS idx_trade_info_exhibition_id ON trade_info(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_trade_build_days_trade_info_id ON trade_build_days(trade_info_id);
CREATE INDEX IF NOT EXISTS idx_trade_spaces_trade_info_id ON trade_spaces(trade_info_id);
CREATE INDEX IF NOT EXISTS idx_invitations_exhibition_id ON invitation_templates(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_invitations_type ON invitation_templates(invitation_type);
CREATE INDEX IF NOT EXISTS idx_invitation_recipients_invitation_id ON invitation_recipients(invitation_template_id);
CREATE INDEX IF NOT EXISTS idx_invitation_recipients_email ON invitation_recipients(recipient_email); 