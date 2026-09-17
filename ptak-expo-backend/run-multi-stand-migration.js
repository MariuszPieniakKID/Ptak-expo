#!/usr/bin/env node
// Ręczne uruchomienie migracji wielostoiskowości (ta sama, którą start serwera stosuje sam).
// Użycie: DATABASE_URL=postgres://... node run-multi-stand-migration.js

const { Pool } = require('pg');
const { applyMultiStandMigration } = require('./src/config/migrations/multiStandMigration');

const run = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Ustaw DATABASE_URL');
    process.exit(1);
  }

  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  const pool = new Pool({
    connectionString,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });

  try {
    const { rows } = await pool.query('SELECT current_database() AS db');
    console.log(`🎯 Baza: ${rows[0].db}`);
    await applyMultiStandMigration(pool);
    console.log('✅ Gotowe');
  } catch (e) {
    console.error('❌ Migracja nie powiodła się:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

run();
