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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_exhibitions_status ON exhibitions(status);
CREATE INDEX IF NOT EXISTS idx_exhibition_registrations_exhibition_id ON exhibition_registrations(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_exhibition_registrations_user_id ON exhibition_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_exhibition_id ON documents(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_marketing_materials_exhibition_id ON marketing_materials(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_communications_exhibition_id ON communications(exhibition_id); 