// Wielostoiskowość: jedno konto wystawcy może mieć wiele uczestnictw, także w tym samym
// wydarzeniu (firma kupuje dwa stoiska), a dane katalogowe są trzymane per uczestnictwo.
//
// Uczestnictwem jest wiersz `exhibitor_events` – ta tabela ma już własne `id`, więc nowa
// encja nie jest potrzebna. Blokadą było wyłącznie ograniczenie UNIQUE.
//
// Kolumny `exhibitor_id`/`exhibition_id` zostają w tabelach potomnych i są nadal wypełniane,
// dzięki czemu starsze zapytania (aplikacja mobilna, publiczne feedy) działają bez zmian.

// Tabele, których dane wiążemy ze stoiskiem.
//
// Wszędzie używamy ON DELETE SET NULL. Dotąd odłączenie wystawcy od wydarzenia usuwało
// wyłącznie wiersz `exhibitor_events`, a dane (osoby, harmonogram, nagrody, logo, katalog)
// zostawały i wracały po ponownym przypisaniu. Kaskada odbierałaby dane wspólne dla całego
// wydarzenia przy usunięciu jednego z dwóch stoisk, więc zachowujemy dotychczasowe działanie.
const LINKED_TABLES = [
  'exhibitor_catalog_entries',
  'exhibitor_people',
  'trade_events',
  'exhibitor_branding_files',
  'exhibitor_awards',
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
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2 LIMIT 1`,
    [table, column]
  );
  return res.rows.length > 0;
};

// Klucz obcy ustawiamy pod własną nazwą i z wybraną akcją usunięcia. Kolumna mogła powstać
// wcześniej z inną akcją (np. CASCADE), dlatego najpierw zdejmujemy istniejące klucze.
const ensureForeignKey = async (pool, table) => {
  const istniejace = await pool.query(
    `SELECT con.conname
     FROM pg_constraint con
     JOIN pg_class rel ON rel.oid = con.conrelid
     JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
     WHERE con.contype = 'f' AND rel.relname = $1 AND att.attname = 'participation_id'`,
    [table]
  );
  for (const { conname } of istniejace.rows) {
    await pool.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS "${conname}"`);
  }
  await pool.query(`
    ALTER TABLE ${table}
    ADD CONSTRAINT ${table}_participation_fk
    FOREIGN KEY (participation_id) REFERENCES exhibitor_events(id) ON DELETE SET NULL
  `);
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
  const linkTable = async (table) => {
    if (!(await tableExists(pool, table))) {
      console.log(`   ⏭️  Pomijam ${table} (tabela nie istnieje)`);
      return;
    }
    if (!(await hasColumn(pool, table, 'exhibition_id')) || !(await hasColumn(pool, table, 'exhibitor_id'))) {
      console.log(`   ⏭️  Pomijam ${table} (brak kolumn wystawcy/wydarzenia)`);
      return;
    }

    const kolumnaByla = await hasColumn(pool, table, 'participation_id');
    await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS participation_id INTEGER`);
    await ensureForeignKey(pool, table);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_${table}_participation
      ON ${table}(participation_id)
    `);

    // Uzupełnienie danych historycznych robimy dokładnie raz – przy zakładaniu kolumny.
    // Do tej pory para (wystawca, wydarzenie) mogła mieć tylko jedno uczestnictwo, więc
    // dopasowanie jest jednoznaczne. Powtarzanie backfillu przy każdym starcie serwera
    // podpinałoby pod pierwsze stoisko wiersze świadomie odpięte (np. po usunięciu
    // drugiego stoiska), a w katalogu dawałoby dwa wpisy dla jednego stoiska.
    if (kolumnaByla) {
      console.log(`   ⏭️  ${table}: kolumna już istniała, backfill pominięty`);
      return;
    }

    // W katalogu jedno stoisko może mieć tylko jeden wpis. Gdyby para wystawca+wydarzenie
    // miała ich kilka (zastane dane), bierzemy ten, który aplikacja dziś pokazuje –
    // najświeżej zapisany; pozostałe zostają nieprzypisane.
    const bezDuplikatu = table === 'exhibitor_catalog_entries'
      ? `AND t.id = (
           SELECT inny.id FROM exhibitor_catalog_entries inny
           WHERE inny.exhibitor_id = t.exhibitor_id AND inny.exhibition_id = t.exhibition_id
           ORDER BY inny.updated_at DESC NULLS LAST, inny.id DESC
           LIMIT 1
         )
         AND NOT EXISTS (
           SELECT 1 FROM exhibitor_catalog_entries juz
           WHERE juz.participation_id = (
             SELECT MIN(ee.id) FROM exhibitor_events ee
             WHERE ee.exhibitor_id = t.exhibitor_id AND ee.exhibition_id = t.exhibition_id
           )
         )`
      : '';

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
        ${bezDuplikatu}
    `);
    console.log(`   ✅ ${table}: powiązano ${res.rowCount} wierszy ze stoiskiem`);
  };

  for (const table of LINKED_TABLES) {
    await linkTable(table);
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
