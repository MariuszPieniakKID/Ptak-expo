// Synchronizacja hal i numerów stoisk z HubSpota (lejek „Dział obsługi technicznej”)
// do przypisań wystawców (exhibitor_events). Kierunek wyłącznie HubSpot -> aplikacja.
//
// Przenosimy tylko dane jednoznaczne: nazwa targów w polu „Udział targów” równa nazwie
// wydarzenia (bez rozróżniania wielkości liter i odstępów), NIP firmy zgodny z NIP-em
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
let lastSuccessAt = null;
let lastFullAt = null;

const token = () => (process.env.HUBSPOT_TOKEN || '').trim();
const isEnabled = () => Boolean(token()) && process.env.HUBSPOT_SYNC_ENABLED !== 'false';
const normName = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
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

async function loadEventMapping() {
  const prop = await hs('/crm/v3/properties/deals/udzial_targow');
  const byName = new Map();
  for (const o of prop.options || []) {
    byName.set(normName(o.value), o.value);
    byName.set(normName(o.label), o.value);
  }
  const { rows } = await db.query(
    `SELECT e.id, e.name FROM exhibitions e
     WHERE COALESCE(e.end_date, e.start_date) >= CURRENT_DATE
       AND EXISTS (SELECT 1 FROM exhibitor_events ee WHERE ee.exhibition_id = e.id)
     ORDER BY e.start_date`
  );
  const matched = [];
  const unmatched = [];
  for (const e of rows) {
    const value = byName.get(normName(e.name));
    if (value) matched.push({ id: e.id, name: e.name.trim(), hsValue: value });
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
    { propertyName: 'udzial_targow', operator: 'EQ', value: ev.hsValue },
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
      toSync = matched.filter((e) => values.has(e.hsValue));
    }
    for (const ev of toSync) {
      await syncEvent(ev, problems, changes, stats);
      stats.events++;
    }
    if (full) for (const u of unmatched) problems.push({ eventId: u.id, event: u.name, type: 'nazwa_targow', info: 'Brak targów o tej nazwie w polu „Udział targów” w HubSpot' });
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
  }
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

module.exports = { runSync, startScheduler, isEnabled, isRunning: () => running };
