// Wielostoiskowość: jedno konto wystawcy może mieć wiele uczestnictw, także w tym samym
// wydarzeniu (firma kupuje dwa stoiska), a dane katalogowe są trzymane per uczestnictwo.
//
// Uczestnictwem jest wiersz `exhibitor_events` – ta tabela ma już własne `id`, więc nowa
// encja nie jest potrzebna. Blokadą było wyłącznie ograniczenie UNIQUE.
//
// Kolumny `exhibitor_id`/`exhibition_id` zostają w tabelach potomnych i są nadal wypełniane,
// dzięki czemu starsze zapytania (aplikacja mobilna, publiczne feedy) działają bez zmian.

// Tabele trzymające dane konkretnego stoiska – po usunięciu uczestnictwa nie mają sensu.
const CASCADE_TABLES = [
  'exhibitor_catalog_entries',
  'exhibitor_people',
  'trade_events',
  'exhibitor_branding_files',
  'exhibitor_awards',
];

// Tabele z historią (dokumenty, wysłane zaproszenia) – nie kasujemy ich razem ze stoiskiem.
const SET_NULL_TABLES = [
  'exhibitor_documents',
  'invitation_recipients',
  'invitations',
];

const tableExists = async (pool, table) => {
  const res = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
    [table]
  );
  return res.rows.length > 0;
};

const hasColumn = async (pool, table, column) => {
  const res = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2 LIMIT 1`,
    [table, column]
  );
  return res.rows.length > 0;
};

const applyMultiStandMigration = async (pool) => {
  // 1. NIP przestaje być identyfikatorem – firma z dwoma stoiskami nie musi już zakładać
  //    drugiego konta z podmienionym NIP-em. Tożsamością konta jest id oraz e-mail (login).
  await pool.query(`ALTER TABLE exhibitors DROP CONSTRAINT IF EXISTS exhibitors_nip_key`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_exhibitors_nip ON exhibitors(nip)`);

  // 2. Wiele uczestnictw w tym samym wydarzeniu.
  await pool.query(`
    ALTER TABLE exhibitor_events
    DROP CONSTRAINT IF EXISTS exhibitor_events_exhibitor_id_exhibition_id_key
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_exhibitor_events_exhibitor_exhibition
    ON exhibitor_events(exhibitor_id, exhibition_id)
  `);

  // 3. Powiązanie danych z konkretnym stoiskiem.
  const linkTable = async (table, onDelete) => {
    if (!(await tableExists(pool, table))) {
      console.log(`   ⏭️  Pomijam ${table} (tabela nie istnieje)`);
      return;
    }
    if (!(await hasColumn(pool, table, 'exhibition_id')) || !(await hasColumn(pool, table, 'exhibitor_id'))) {
      console.log(`   ⏭️  Pomijam ${table} (brak kolumn wystawcy/wydarzenia)`);
      return;
    }

    await pool.query(`
      ALTER TABLE ${table}
      ADD COLUMN IF NOT EXISTS participation_id INTEGER
        REFERENCES exhibitor_events(id) ON DELETE ${onDelete}
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_${table}_participation
      ON ${table}(participation_id)
    `);

    // Uzupełnienie dla danych istniejących: do tej pory para (wystawca, wydarzenie) mogła
    // mieć tylko jedno uczestnictwo, więc dopasowanie jest jednoznaczne. MIN(id) chroni
    // migrację przy ponownym uruchomieniu, gdy stoisk jest już kilka.
    const res = await pool.query(`
      UPDATE ${table} t
      SET participation_id = (
        SELECT MIN(ee.id) FROM exhibitor_events ee
        WHERE ee.exhibitor_id = t.exhibitor_id AND ee.exhibition_id = t.exhibition_id
      )
      WHERE t.participation_id IS NULL
        AND t.exhibitor_id IS NOT NULL
        AND t.exhibition_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM exhibitor_events ee
          WHERE ee.exhibitor_id = t.exhibitor_id AND ee.exhibition_id = t.exhibition_id
        )
    `);
    console.log(`   ✅ ${table}: powiązano ${res.rowCount} wierszy ze stoiskiem`);
  };

  for (const table of CASCADE_TABLES) {
    await linkTable(table, 'CASCADE');
  }
  for (const table of SET_NULL_TABLES) {
    await linkTable(table, 'SET NULL');
  }

  // 4. Jedno stoisko = jeden wpis katalogowy. Wpisy globalne (participation_id IS NULL)
  //    zostają nietknięte i nadal służą jako dane domyślne firmy.
  //    Indeks zakładamy tylko przy czystych danych – inaczej start serwera by się wywalił.
  const dupes = await pool.query(`
    SELECT participation_id, count(*) AS ile
    FROM exhibitor_catalog_entries
    WHERE participation_id IS NOT NULL
    GROUP BY participation_id
    HAVING count(*) > 1
  `);
  if (dupes.rows.length === 0) {
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_entry_participation
      ON exhibitor_catalog_entries(participation_id)
      WHERE participation_id IS NOT NULL
    `);
    console.log('   ✅ Wpisy katalogowe: jeden wpis na stoisko (indeks unikalny)');
  } else {
    const lista = dupes.rows.map((r) => `${r.participation_id}(${r.ile})`).join(', ');
    console.warn(`   ⚠️  Pomijam indeks unikalny wpisów katalogowych – zduplikowane stoiska: ${lista}`);
  }
};

module.exports = { applyMultiStandMigration };
