#!/usr/bin/env node

/**
 * Skrypt do eksportu wszystkich wystawców z Railway do CSV
 * Eksportuje dane z tabeli exhibitors wraz z przypisanymi wydarzeniami
 */

require('dotenv').config(); // Wczytaj .env z bieżącego katalogu (ptak-expo-backend)
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Konfiguracja połączenia z Railway
const getDatabaseUrl = () => {
  // Jesteśmy w Railway
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🔍 Railway environment detected');
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      return process.env.DATABASE_URL;
    }
    if (process.env.DATABASE_PUBLIC_URL && process.env.DATABASE_PUBLIC_URL.trim()) {
      return process.env.DATABASE_PUBLIC_URL;
    }
  }
  
  // Fallback na DATABASE_URL (może być ustawiony lokalnie do Railway DB)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  throw new Error('❌ DATABASE_URL nie jest ustawiony. Ustaw zmienną środowiskową DATABASE_URL z connection stringiem do Railway.');
};

// Funkcja do escapowania wartości CSV
const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Jeśli zawiera przecinek, cudzysłów lub nową linię, otaczamy cudzysłowem
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Funkcja do formatowania daty
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString();
};

async function exportExhibitorsToCSV() {
  let pool;
  
  try {
    const databaseUrl = getDatabaseUrl();
    console.log('🔍 Łączenie z bazą danych Railway...');
    
    // Konfiguracja SSL dla Railway
    let sslOption = false;
    try {
      const urlObj = new URL(databaseUrl);
      const host = urlObj.hostname || '';
      const isInternalHost = host.endsWith('railway.internal');
      if (!isInternalHost) {
        sslOption = { rejectUnauthorized: false };
      }
    } catch (e) {
      sslOption = { rejectUnauthorized: false };
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslOption,
      connectionTimeoutMillis: 30000,
    });
    
    // Test połączenia
    await pool.query('SELECT NOW()');
    console.log('✅ Połączono z bazą danych Railway');
    
    // Pobierz wszystkich wystawców wraz z ich wydarzeniami
    console.log('🔍 Pobieranie danych wystawców...');
    
    const query = `
      SELECT 
        e.id,
        e.nip,
        e.company_name,
        e.address,
        e.postal_code,
        e.city,
        e.contact_person,
        e.contact_role,
        e.phone,
        e.email,
        e.status,
        e.created_at,
        e.updated_at,
        STRING_AGG(DISTINCT ex.name, '; ') as exhibitions,
        STRING_AGG(DISTINCT ex.id::text, '; ') as exhibition_ids,
        STRING_AGG(DISTINCT 
          CASE 
            WHEN ex.start_date IS NOT NULL THEN TO_CHAR(ex.start_date, 'YYYY-MM-DD')
            ELSE NULL
          END, 
        '; ') as exhibition_dates,
        STRING_AGG(DISTINCT ee.hall_name, '; ') as halls,
        STRING_AGG(DISTINCT ee.stand_number, '; ') as stand_numbers,
        STRING_AGG(DISTINCT ee.booth_area::text, '; ') as booth_areas,
        STRING_AGG(DISTINCT 
          CASE 
            WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL 
            THEN TRIM(CONCAT(u.first_name, ' ', u.last_name))
            ELSE NULL
          END, 
        '; ') as supervisors
      FROM exhibitors e
      LEFT JOIN exhibitor_events ee ON e.id = ee.exhibitor_id
      LEFT JOIN exhibitions ex ON ee.exhibition_id = ex.id
      LEFT JOIN users u ON ee.supervisor_user_id = u.id
      GROUP BY 
        e.id, e.nip, e.company_name, e.address, e.postal_code, 
        e.city, e.contact_person, e.contact_role, e.phone, 
        e.email, e.status, e.created_at, e.updated_at
      ORDER BY e.company_name
    `;
    
    const result = await pool.query(query);
    console.log(`✅ Pobrano ${result.rows.length} wystawców`);
    
    if (result.rows.length === 0) {
      console.log('⚠️  Brak wystawców w bazie danych');
      return;
    }
    
    // Przygotuj CSV
    const headers = [
      'ID',
      'NIP',
      'Nazwa Firmy',
      'Adres',
      'Kod Pocztowy',
      'Miasto',
      'Osoba Kontaktowa',
      'Rola Osoby Kontaktowej',
      'Telefon',
      'Email',
      'Status',
      'Wydarzenia (nazwy)',
      'Wydarzenia (ID)',
      'Daty Wydarzeń',
      'Hale',
      'Numery Stoisk',
      'Powierzchnie Stoisk (m²)',
      'Opiekunowie',
      'Data Utworzenia',
      'Data Aktualizacji'
    ];
    
    const csvRows = [headers.map(escapeCsv).join(',')];
    
    // Dodaj wiersze z danymi
    for (const row of result.rows) {
      const csvRow = [
        row.id,
        row.nip,
        row.company_name,
        row.address,
        row.postal_code,
        row.city,
        row.contact_person,
        row.contact_role,
        row.phone,
        row.email,
        row.status,
        row.exhibitions || '',
        row.exhibition_ids || '',
        row.exhibition_dates || '',
        row.halls || '',
        row.stand_numbers || '',
        row.booth_areas || '',
        row.supervisors || '',
        formatDate(row.created_at),
        formatDate(row.updated_at)
      ];
      
      csvRows.push(csvRow.map(escapeCsv).join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    // Zapisz do pliku
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `exhibitors_railway_${timestamp}.csv`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, '\uFEFF' + csvContent, 'utf8'); // BOM dla prawidłowego wyświetlania polskich znaków w Excel
    
    console.log(`\n✅ Eksport zakończony pomyślnie!`);
    console.log(`📄 Plik: ${filename}`);
    console.log(`📍 Ścieżka: ${filepath}`);
    console.log(`📊 Wyeksportowano ${result.rows.length} wystawców\n`);
    
    // Pokaż przykładowe dane
    console.log('📋 Przykładowe dane (pierwsze 3 wystawców):');
    result.rows.slice(0, 3).forEach((row, idx) => {
      console.log(`\n${idx + 1}. ${row.company_name}`);
      console.log(`   NIP: ${row.nip}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Telefon: ${row.phone}`);
      console.log(`   Wydarzenia: ${row.exhibitions || 'Brak'}`);
    });
    
  } catch (error) {
    console.error('❌ Błąd podczas eksportu:', error);
    console.error('Szczegóły:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔌 Rozłączono z bazą danych');
    }
  }
}

// Uruchom skrypt
console.log('🚀 Rozpoczynam eksport wystawców z Railway do CSV...\n');
exportExhibitorsToCSV();

