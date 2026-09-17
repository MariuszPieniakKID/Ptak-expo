// Uczestnictwo = jedno stoisko wystawcy na jednym wydarzeniu (wiersz `exhibitor_events`).
// Jedno konto może mieć wiele uczestnictw, również dwa w tym samym wydarzeniu.
//
// Dane katalogowe (logo, opis, produkty, marki) są kopiowane przy zakładaniu nowego
// stoiska, ale od tej chwili żyją własnym życiem – edycja jednego stoiska nie rusza
// pozostałych.

const db = require('../config/database');

// Kolumny wpisu katalogowego kopiowane na nowe stoisko.
const COPIED_CATALOG_COLUMNS = [
  'name',
  'display_name',
  'logo',
  'description',
  'why_visit',
  'contact_info',
  'website',
  'socials',
  'contact_email',
  'catalog_tags',
  'brands',
  'industries',
  'products',
  'catalog_contact_person',
  'catalog_contact_phone',
  'catalog_contact_email',
];

// Dane wystawcy są dziś rozbite na dwa poziomy: wpis globalny trzyma dane firmy
// (nazwa, logo, opis), a wpis przy wydarzeniu produkty i branże. Panel czyta je scalone
// – „wydarzenie nad globalnym" – więc kopia na nowe stoisko musi scalić je tak samo,
// inaczej nowy kafelek byłby bez logo albo bez produktów.
const TEXT_COLUMNS = COPIED_CATALOG_COLUMNS.filter((c) => c !== 'products');

const findCatalogSource = async (client, exhibitorId, exhibitionId) => {
  // Źródłem jest najświeższe uczestnictwo – najpierw inne stoisko na tym samym
  // wydarzeniu, potem poprzednie targi.
  const merged = TEXT_COLUMNS
    .map((col) => `COALESCE(NULLIF(ev.${col}, ''), gl.${col}) AS ${col}`)
    .join(',\n       ');

  const res = await client.query(
    `WITH ev AS (
       SELECT * FROM exhibitor_catalog_entries
       WHERE exhibitor_id = $1 AND exhibition_id IS NOT NULL
       ORDER BY (exhibition_id = $2) DESC, updated_at DESC NULLS LAST
       LIMIT 1
     ), gl AS (
       SELECT * FROM exhibitor_catalog_entries
       WHERE exhibitor_id = $1 AND exhibition_id IS NULL
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 1
     )
     SELECT ${merged},
       CASE
         WHEN jsonb_typeof(ev.products) = 'array' AND jsonb_array_length(ev.products) > 0 THEN ev.products
         ELSE gl.products
       END AS products,
       (ev.id IS NOT NULL OR gl.id IS NOT NULL) AS ma_zrodlo
     FROM (SELECT 1) x
     LEFT JOIN ev ON true
     LEFT JOIN gl ON true`,
    [exhibitorId, exhibitionId]
  );

  const row = res.rows[0];
  return row && row.ma_zrodlo ? row : null;
};

// Zakłada wpis katalogowy nowego stoiska jako kopię dotychczasowych danych firmy.
const seedCatalogEntry = async (client, { exhibitorId, exhibitionId, participationId }) => {
  const existing = await client.query(
    'SELECT id FROM exhibitor_catalog_entries WHERE participation_id = $1 LIMIT 1',
    [participationId]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const source = await findCatalogSource(client, exhibitorId, exhibitionId);
  if (!source) return null;

  // `products` to jsonb – bez jawnego JSON.stringify sterownik zamieniłby tablicę JS
  // na literał tablicy Postgresa i zapis by się wywalił.
  const values = COPIED_CATALOG_COLUMNS.map((col) => {
    const value = source[col];
    if (col === 'products') return value === null || value === undefined ? null : JSON.stringify(value);
    return value;
  });
  const placeholders = COPIED_CATALOG_COLUMNS
    .map((col, i) => (col === 'products' ? `$${i + 4}::jsonb` : `$${i + 4}`))
    .join(', ');

  const res = await client.query(
    `INSERT INTO exhibitor_catalog_entries
       (exhibitor_id, exhibition_id, participation_id, ${COPIED_CATALOG_COLUMNS.join(', ')})
     VALUES ($1, $2, $3, ${placeholders})
     RETURNING id`,
    [exhibitorId, exhibitionId, participationId, ...values]
  );
  return res.rows[0].id;
};

// Tworzy nowe stoisko wraz z kopią danych katalogowych.
const createParticipation = async (
  { exhibitorId, exhibitionId, supervisorUserId, hallName, standNumber, boothArea },
  client = db
) => {
  // Limit i blokada zaproszeń są ustawieniem firmy na wydarzeniu, więc kolejne stoisko
  // przejmuje je z pierwszego. Inaczej nowe stoisko z domyślnymi wartościami zdjęłoby
  // administratorowi blokadę wysyłki zaproszeń.
  const zaproszenia = await client.query(
    `SELECT invitation_limit, invitations_enabled FROM exhibitor_events
     WHERE exhibitor_id = $1 AND exhibition_id = $2
     ORDER BY id ASC LIMIT 1`,
    [exhibitorId, exhibitionId]
  );
  const ustawienia = zaproszenia.rows[0] || null;

  const res = await client.query(
    `INSERT INTO exhibitor_events
       (exhibitor_id, exhibition_id, supervisor_user_id, hall_name, stand_number, booth_area,
        invitation_limit, invitations_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 50), COALESCE($8, true))
     RETURNING *`,
    [
      exhibitorId,
      exhibitionId,
      supervisorUserId || null,
      hallName || null,
      standNumber || null,
      boothArea === undefined || boothArea === null || boothArea === '' ? null : Number(boothArea),
      ustawienia ? ustawienia.invitation_limit : null,
      ustawienia ? ustawienia.invitations_enabled : null,
    ]
  );
  const participation = res.rows[0];

  try {
    await seedCatalogEntry(client, {
      exhibitorId,
      exhibitionId,
      participationId: participation.id,
    });
  } catch (e) {
    // Brak kopii danych nie może blokować przypisania do wydarzenia.
    console.warn('⚠️ Nie udało się skopiować danych katalogowych na nowe stoisko:', e.message);
  }

  return participation;
};

const updateParticipation = async (
  participationId,
  { supervisorUserId, hallName, standNumber, boothArea },
  client = db
) => {
  const res = await client.query(
    `UPDATE exhibitor_events
     SET supervisor_user_id = $2,
         hall_name = $3,
         stand_number = $4,
         booth_area = $5
     WHERE id = $1
     RETURNING *`,
    [
      participationId,
      supervisorUserId || null,
      hallName || null,
      standNumber || null,
      boothArea === undefined || boothArea === null || boothArea === '' ? null : Number(boothArea),
    ]
  );
  return res.rows[0] || null;
};

const listParticipations = async (exhibitorId, exhibitionId = null, client = db) => {
  const params = [exhibitorId];
  let filter = '';
  if (exhibitionId) {
    params.push(exhibitionId);
    filter = 'AND ee.exhibition_id = $2';
  }
  const res = await client.query(
    `SELECT ee.*, e.name AS exhibition_name, e.start_date, e.end_date
     FROM exhibitor_events ee
     JOIN exhibitions e ON e.id = ee.exhibition_id
     WHERE ee.exhibitor_id = $1 ${filter}
     ORDER BY e.start_date DESC NULLS LAST, ee.id ASC`,
    params
  );
  return res.rows;
};

// Endpointy, które dostają wyłącznie `exhibitionId` (aplikacja mobilna, starsze widoki),
// pracują na pierwszym stoisku wystawcy w tym wydarzeniu.
const resolveParticipationId = async (
  { exhibitorId, exhibitionId, participationId },
  client = db
) => {
  const explicit = parseInt(participationId, 10);
  const exhibition = parseInt(exhibitionId, 10);

  if (Number.isInteger(explicit)) {
    // Stoisko musi należeć do tego konta i do tego wydarzenia. Panel pamięta wybór
    // stoiska między podstronami, więc bez sprawdzenia wydarzenia zapamiętane stoisko
    // z innych targów podmieniałoby dane pod niewłaściwym wydarzeniem.
    const params = [explicit, exhibitorId];
    let filtrWydarzenia = '';
    if (Number.isInteger(exhibition)) {
      params.push(exhibition);
      filtrWydarzenia = 'AND exhibition_id = $3';
    }
    const res = await client.query(
      `SELECT id FROM exhibitor_events WHERE id = $1 AND exhibitor_id = $2 ${filtrWydarzenia}`,
      params
    );
    if (res.rows.length > 0) return res.rows[0].id;
    // Stoisko nie pasuje do wydarzenia – pracujemy na pierwszym stoisku tego wydarzenia.
  }

  if (!Number.isInteger(exhibition)) return null;

  const res = await client.query(
    `SELECT id FROM exhibitor_events
     WHERE exhibitor_id = $1 AND exhibition_id = $2
     ORDER BY id ASC LIMIT 1`,
    [exhibitorId, exhibition]
  );
  return res.rows.length > 0 ? res.rows[0].id : null;
};

// Liczba wszystkich stoisk konta (na wszystkich wydarzeniach).
const countAllParticipations = async (exhibitorId, client = db) => {
  const res = await client.query(
    'SELECT count(*)::int AS ile FROM exhibitor_events WHERE exhibitor_id = $1',
    [exhibitorId]
  );
  return res.rows[0].ile;
};

const countParticipations = async (exhibitorId, exhibitionId, client = db) => {
  const res = await client.query(
    'SELECT count(*)::int AS ile FROM exhibitor_events WHERE exhibitor_id = $1 AND exhibition_id = $2',
    [exhibitorId, exhibitionId]
  );
  return res.rows[0].ile;
};

module.exports = {
  createParticipation,
  updateParticipation,
  listParticipations,
  resolveParticipationId,
  countParticipations,
  countAllParticipations,
  seedCatalogEntry,
};
