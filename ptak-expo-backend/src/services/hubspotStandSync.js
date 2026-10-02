// Synchronizacja hal i numerów stoisk z HubSpota (lejek „Dział obsługi technicznej”)
// do przypisań wystawców (exhibitor_events). Kierunek wyłącznie HubSpot -> aplikacja.
//
// Przenosimy tylko dane jednoznaczne: wartość pola „Udział targów” przypisana do wydarzenia
// w słowniku targów (hubspot_event_dictionary), NIP firmy zgodny z NIP-em
// wystawcy, jedno stoisko po obu stronach i poprawny format hali oraz numeru stoiska.
// Wszystko inne trafia do listy problemów do poprawienia w HubSpocie.

const db = require('../config/database');

const API = 'https://api.hubapi.com';
const DOT_PIPELINE = process.env.HUBSPOT_STAND_PIPELINE_ID || '208540643';
const INTERVAL_MIN = Math.max(2, parseInt(process.env.HUBSPOT_SYNC_INTERVAL_MIN || '10', 10) || 10);
const FULL_EVERY_HOURS = 24;
const DEAL_PROPS = ['dealname', 'pipeline', 'udzial_targow', 'hala_', 'numer_stoiska', 'hs_lastmodifieddate'];
const HALLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STAND_RE = /^([A-Z]\d+(\.\d+)?[A-Z]{0,2}|[A-Z]-?TZ-?\d+)$/i;

let running = false;
let fullRequested = false;
let lastSuccessAt = null;
let lastFullAt = null;

const token = () => (process.env.HUBSPOT_TOKEN || '').trim();
const isEnabled = () => Boolean(token()) && process.env.HUBSPOT_SYNC_ENABLED !== 'false';
const normName = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const nipDigits = (s) => String(s || '').replace(/\D/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function hs(path, body) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(API + path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 || res.status >= 500) { await sleep(1500 * (attempt + 1)); continue; }
    const text = await res.text();
    if (!res.ok) throw new Error(`HubSpot ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  }
  throw new Error(`HubSpot: przekroczono liczbę prób dla ${path}`);
}

async function searchDeals(filters) {
  const deals = [];
  let after;
  do {
    const j = await hs('/crm/v3/objects/deals/search', {
      filterGroups: [{ filters }], properties: DEAL_PROPS, limit: 100, ...(after ? { after } : {}),
    });
    deals.push(...j.results);
    after = j.paging && j.paging.next && j.paging.next.after;
    if (deals.length >= 9900) break;
    await sleep(220);
  } while (after);
  return deals;
}

async function nipsForDeals(dealIds) {
  const dealToCompanies = {};
  for (let i = 0; i < dealIds.length; i += 100) {
    const j = await hs('/crm/v4/associations/deals/companies/batch/read', { inputs: dealIds.slice(i, i + 100).map((id) => ({ id })) });
    for (const r of j.results || []) dealToCompanies[r.from.id] = r.to.map((t) => String(t.toObjectId));
  }
  const companyIds = [...new Set(Object.values(dealToCompanies).flat())];
  const companyNip = {};
  for (let i = 0; i < companyIds.length; i += 100) {
    const j = await hs('/crm/v3/objects/companies/batch/read', {
      properties: ['nip', 'nip__sklonowano_'], inputs: companyIds.slice(i, i + 100).map((id) => ({ id })),
    });
    for (const c of j.results || []) companyNip[c.id] = nipDigits(c.properties.nip__sklonowano_ || c.properties.nip);
  }
  const result = {};
  for (const [dealId, cids] of Object.entries(dealToCompanies)) {
    result[dealId] = [...new Set(cids.map((c) => companyNip[c]).filter(Boolean))];
  }
  return result;
}

// Pobiera opcje pola „Udział targów” do słownika: nowe dopisuje, znikające oznacza,
// a nieprzypisane (poza celowo wyczyszczonymi przez admina) przypisuje po identycznej nazwie
// (bez wielkości liter, spacji i znaków typu „-”, „&”).
async function refreshDictionary() {
  const prop = await hs('/crm/v3/properties/deals/udzial_targow');
  const options = (prop.options || []).filter((o) => String(o.value || '').trim());
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: before } = await client.query('SELECT hs_value FROM hubspot_event_dictionary');
    const known = new Set(before.map((r) => r.hs_value));
    for (const o of options) {
      await client.query(
        `INSERT INTO hubspot_event_dictionary (hs_value, hs_label, hs_hidden, removed_in_hs)
         VALUES ($1, $2, $3, FALSE)
         ON CONFLICT (hs_value) DO UPDATE SET hs_label = EXCLUDED.hs_label, hs_hidden = EXCLUDED.hs_hidden, removed_in_hs = FALSE`,
        [o.value, o.label || o.value, Boolean(o.hidden)]
      );
    }
    await client.query(
      'UPDATE hubspot_event_dictionary SET removed_in_hs = TRUE WHERE NOT (hs_value = ANY($1::text[]))',
      [options.map((o) => o.value)]
    );

    const { rows: exhibitions } = await client.query('SELECT id, name FROM exhibitions');
    const byName = new Map();
    for (const e of exhibitions) {
      const k = normName(e.name);
      byName.set(k, byName.has(k) ? null : e.id);
    }
    const { rows: open } = await client.query(
      `SELECT id, hs_value, hs_label FROM hubspot_event_dictionary
       WHERE exhibition_id IS NULL AND source IS DISTINCT FROM 'manual'`
    );
    let autoAssigned = 0;
    for (const r of open) {
      const id = byName.get(normName(r.hs_label)) || byName.get(normName(r.hs_value));
      if (!id) continue;
      await client.query(
        `UPDATE hubspot_event_dictionary SET exhibition_id = $2, source = 'auto', updated_by = NULL, updated_at = NOW() WHERE id = $1`,
        [r.id, id]
      );
      autoAssigned++;
    }
    await client.query('COMMIT');
    return { options: options.length, added: options.filter((o) => !known.has(o.value)).length, autoAssigned };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function loadEventMapping() {
  await refreshDictionary();
  const { rows } = await db.query(
    `SELECT e.id, e.name, array_remove(array_agg(d.hs_value ORDER BY d.hs_value), NULL) AS hs_values
     FROM exhibitions e
     LEFT JOIN hubspot_event_dictionary d ON d.exhibition_id = e.id
     WHERE COALESCE(e.end_date, e.start_date) >= CURRENT_DATE
       AND EXISTS (SELECT 1 FROM exhibitor_events ee WHERE ee.exhibition_id = e.id)
     GROUP BY e.id, e.name, e.start_date
     ORDER BY e.start_date`
  );
  const matched = [];
  const unmatched = [];
  for (const e of rows) {
    if (e.hs_values.length) matched.push({ id: e.id, name: e.name.trim(), hsValues: e.hs_values });
    else unmatched.push({ id: e.id, name: e.name.trim() });
  }
  return { matched, unmatched };
}

function parseHall(raw) {
  const v = String(raw || '').trim().toUpperCase();
  if (!v) return { ok: true, hall: null };
  return HALLS.includes(v) ? { ok: true, hall: `Hala ${v}` } : { ok: false };
}

async function syncEvent(ev, problems, changes, stats) {
  const deals = (await searchDeals([
    { propertyName: 'pipeline', operator: 'EQ', value: DOT_PIPELINE },
    { propertyName: 'udzial_targow', operator: 'IN', values: ev.hsValues },
  ])).filter((d) => String(d.properties.numer_stoiska || '').trim());
  if (!deals.length) return;
  const dealNips = await nipsForDeals(deals.map((d) => d.id));

  const byNip = new Map();
  for (const d of deals) {
    const nips = dealNips[d.id] || [];
    const base = { eventId: ev.id, event: ev.name, dealId: d.id, deal: d.properties.dealname, hala: d.properties.hala_ || '', stoisko: d.properties.numer_stoiska };
    if (nips.length !== 1 || nips[0].length !== 10) { problems.push({ ...base, type: 'nip_hubspot', info: nips.length ? `NIP w HubSpot: ${nips.join(', ')}` : 'Firma w HubSpot bez NIP' }); continue; }
    if (!byNip.has(nips[0])) byNip.set(nips[0], []);
    byNip.get(nips[0]).push({ ...base, nip: nips[0] });
  }

  const { rows: ours } = await db.query(
    `SELECT ee.id, ee.exhibitor_id, ee.hall_name, ee.stand_number, x.company_name,
            regexp_replace(COALESCE(x.nip, ''), '\\D', '', 'g') AS nip
     FROM exhibitor_events ee JOIN exhibitors x ON x.id = ee.exhibitor_id
     WHERE ee.exhibition_id = $1`, [ev.id]
  );
  const oursByNip = new Map();
  for (const r of ours) {
    if (!oursByNip.has(r.nip)) oursByNip.set(r.nip, []);
    oursByNip.get(r.nip).push(r);
  }

  for (const [nip, hsDeals] of byNip) {
    stats.dealsChecked += hsDeals.length;
    const first = hsDeals[0];
    const standValues = [...new Set(hsDeals.map((d) => String(d.stoisko).trim().toUpperCase()))];
    const hallValues = [...new Set(hsDeals.map((d) => String(d.hala).trim().toUpperCase()))];
    const targets = oursByNip.get(nip) || [];
    if (!targets.length) { stats.notAssigned++; continue; }
    if (standValues.length > 1 || hallValues.length > 1) { problems.push({ ...first, type: 'kilka_deali', info: `Kilka deali z różnymi stoiskami: ${hsDeals.map((d) => `${d.hala} / ${d.stoisko}`).join('; ')}` }); continue; }
    const stand = String(first.stoisko).trim();
    if (!STAND_RE.test(stand)) { problems.push({ ...first, firma: targets[0].company_name, type: 'format_stoiska', info: 'Numer stoiska w niepoprawnym formacie (np. historia zmian, spacje, litery spoza alfabetu łacińskiego)' }); continue; }
    const hall = parseHall(first.hala);
    if (!hall.ok) { problems.push({ ...first, firma: targets[0].company_name, type: 'format_hali', info: `Hala spoza listy ${HALLS.join(', ')}` }); continue; }
    if (targets.length > 1) {
      const already = targets.some((t) => String(t.stand_number || '').trim().toUpperCase() === stand.toUpperCase());
      if (!already) problems.push({ ...first, firma: targets[0].company_name, type: 'kilka_stoisk', info: `Wystawca ma w aplikacji ${targets.length} stoiska na tych targach (${targets.map((t) => t.stand_number).join(', ')}), w HubSpot jedno` });
      continue;
    }
    const t = targets[0];
    const newHall = hall.hall || t.hall_name;
    const sameStand = String(t.stand_number || '').trim().toUpperCase() === stand.toUpperCase();
    const sameHall = String(t.hall_name || '').trim().toUpperCase() === String(newHall || '').trim().toUpperCase();
    if (sameStand && sameHall) { stats.unchanged++; continue; }
    await db.query('UPDATE exhibitor_events SET hall_name = $2, stand_number = $3 WHERE id = $1', [t.id, newHall, stand]);
    await db.query(
      `INSERT INTO hubspot_stand_changes (exhibitor_event_id, exhibitor_id, exhibition_id, hubspot_deal_id, old_hall, new_hall, old_stand, new_stand)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [t.id, t.exhibitor_id, ev.id, first.dealId, t.hall_name, newHall, t.stand_number, stand]
    );
    changes.push({ firma: t.company_name, event: ev.name, stare: `${t.hall_name || ''} / ${t.stand_number || ''}`, nowe: `${newHall || ''} / ${stand}` });
    stats.updated++;
  }
}

async function runSync({ mode = 'auto' } = {}) {
  if (!isEnabled()) return { skipped: 'Synchronizacja wyłączona (brak HUBSPOT_TOKEN lub HUBSPOT_SYNC_ENABLED=false)' };
  if (running) return { skipped: 'Synchronizacja już trwa' };
  running = true;
  const startedAt = new Date();
  const full = mode === 'full' || !lastSuccessAt || !lastFullAt || startedAt - lastFullAt > FULL_EVERY_HOURS * 3600 * 1000;
  const { rows: [run] } = await db.query(`INSERT INTO hubspot_sync_runs (mode) VALUES ($1) RETURNING id`, [full ? 'full' : 'incremental']);
  const stats = { events: 0, dealsChecked: 0, unchanged: 0, updated: 0, notAssigned: 0 };
  const problems = [];
  const changes = [];
  try {
    const { matched, unmatched } = await loadEventMapping();
    let toSync = matched;
    if (!full) {
      const since = new Date(lastSuccessAt.getTime() - 5 * 60 * 1000);
      const changed = await searchDeals([
        { propertyName: 'pipeline', operator: 'EQ', value: DOT_PIPELINE },
        { propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(since.getTime()) },
      ]);
      const values = new Set(changed.map((d) => d.properties.udzial_targow).filter(Boolean));
      toSync = matched.filter((e) => e.hsValues.some((v) => values.has(v)));
    }
    for (const ev of toSync) {
      await syncEvent(ev, problems, changes, stats);
      stats.events++;
    }
    if (full) for (const u of unmatched) problems.push({ eventId: u.id, event: u.name, type: 'nazwa_targow', info: 'Targi nie mają odpowiednika w słowniku targów HubSpot – przypisz je w słowniku' });
    await db.query(
      `UPDATE hubspot_sync_runs SET finished_at = NOW(), stats = $2, problems = $3, changes = $4 WHERE id = $1`,
      [run.id, JSON.stringify(stats), full ? JSON.stringify(problems) : null, JSON.stringify(changes)]
    );
    lastSuccessAt = startedAt;
    if (full) lastFullAt = startedAt;
    if (stats.updated || full) console.log(`🔄 HubSpot (${full ? 'pełna' : 'przyrostowa'}): wydarzeń ${stats.events}, zmian ${stats.updated}, bez zmian ${stats.unchanged}, problemów ${problems.length}`);
    return { runId: run.id, full, stats, problems: problems.length, changes };
  } catch (e) {
    console.error('❌ Synchronizacja HubSpot nie powiodła się:', e.message);
    await db.query(`UPDATE hubspot_sync_runs SET finished_at = NOW(), error = $2, stats = $3, changes = $4 WHERE id = $1`, [run.id, e.message, JSON.stringify(stats), JSON.stringify(changes)]).catch(() => {});
    return { runId: run.id, error: e.message };
  } finally {
    running = false;
    if (fullRequested) {
      fullRequested = false;
      setTimeout(() => runSync({ mode: 'full' }).catch(() => {}), 1000);
    }
  }
}

// Po zmianie słownika potrzebna jest pełna synchronizacja; jeśli jakaś trwa, ruszy zaraz po niej.
function requestFullSync() {
  if (!isEnabled()) return false;
  if (running) fullRequested = true;
  else runSync({ mode: 'full' }).catch(() => {});
  return true;
}

function startScheduler() {
  if (!isEnabled()) {
    console.log('ℹ️ Synchronizacja stoisk z HubSpot wyłączona (brak HUBSPOT_TOKEN lub HUBSPOT_SYNC_ENABLED=false)');
    return;
  }
  console.log(`🔄 Synchronizacja stoisk z HubSpot co ${INTERVAL_MIN} min`);
  setTimeout(() => runSync().catch(() => {}), 60 * 1000);
  setInterval(() => runSync().catch(() => {}), INTERVAL_MIN * 60 * 1000);
}

module.exports = { runSync, startScheduler, isEnabled, isRunning: () => running, refreshDictionary, requestFullSync };
