// Synchronizacja hal, numerów stoisk i metrażu z HubSpota (lejek „Dział obsługi technicznej”)
// do przypisań wystawców (exhibitor_events). Kierunek wyłącznie HubSpot -> aplikacja.
//
// Łącznikiem jest transakcja HubSpot podpięta do stoiska (exhibitor_events.hubspot_deal_id) –
// wtedy NIP i nazwa firmy nie mają znaczenia. Stoiska bez podpiętej transakcji obsługuje
// dotychczasowy mechanizm: „Udział targów” ze słownika targów + NIP firmy, jedno stoisko po obu
// stronach. Gdy przy tym NIP i numer stoiska się zgadzają, transakcja podpina się sama.
// Wszystko niejednoznaczne trafia do listy problemów do poprawienia w HubSpocie.

const db = require('../config/database');

const API = 'https://api.hubapi.com';
const DOT_PIPELINE = process.env.HUBSPOT_STAND_PIPELINE_ID || '208540643';
const INTERVAL_MIN = Math.max(2, parseInt(process.env.HUBSPOT_SYNC_INTERVAL_MIN || '10', 10) || 10);
const FULL_EVERY_HOURS = 24;
const DEAL_PROPS = ['dealname', 'pipeline', 'udzial_targow', 'hala_', 'numer_stoiska', 'metraz', 'hs_lastmodifieddate'];
const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID || '139679331';
const dealUrl = (id) => `https://app-eu1.hubspot.com/contacts/${PORTAL_ID}/record/0-3/${id}`;
const HALLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STAND_RE = /^([A-Z]\d+(\.\d+)?[A-Z]{0,2}|[A-Z]-?TZ-?\d+)$/i;

let running = false;
let fullRequested = false;
let lastSuccessAt = null;
let lastFullAt = null;

const token = () => (process.env.HUBSPOT_TOKEN || '').trim();
const hasToken = () => Boolean(token());
const isEnabled = () => hasToken() && process.env.HUBSPOT_SYNC_ENABLED !== 'false';
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

// Firmy powiązane z transakcjami: { dealId: [{ name, nip }] }.
async function companiesForDeals(dealIds) {
  const dealToCompanies = {};
  for (let i = 0; i < dealIds.length; i += 100) {
    const j = await hs('/crm/v4/associations/deals/companies/batch/read', { inputs: dealIds.slice(i, i + 100).map((id) => ({ id })) });
    for (const r of j.results || []) dealToCompanies[r.from.id] = r.to.map((t) => String(t.toObjectId));
  }
  const companyIds = [...new Set(Object.values(dealToCompanies).flat())];
  const companies = {};
  for (let i = 0; i < companyIds.length; i += 100) {
    const j = await hs('/crm/v3/objects/companies/batch/read', {
      properties: ['name', 'nip', 'nip__sklonowano_'], inputs: companyIds.slice(i, i + 100).map((id) => ({ id })),
    });
    for (const c of j.results || []) {
      companies[c.id] = { name: c.properties.name || '', nip: nipDigits(c.properties.nip__sklonowano_ || c.properties.nip) };
    }
  }
  const result = {};
  for (const [dealId, cids] of Object.entries(dealToCompanies)) result[dealId] = cids.map((c) => companies[c]).filter(Boolean);
  return result;
}

// Transakcje po numerach. Po scaleniu w HubSpot stary numer prowadzi do transakcji docelowej
// (z innym id) – zwracamy ją pod starym numerem, a id docelowe jest w deal.id.
async function fetchDealsById(ids) {
  const out = {};
  const unique = [...new Set(ids.map(String))];
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const j = await hs('/crm/v3/objects/deals/batch/read', { properties: [...DEAL_PROPS, 'hs_merged_object_ids'], inputs: chunk.map((id) => ({ id })) });
    for (const d of j.results || []) {
      out[d.id] = d;
      for (const old of String(d.properties.hs_merged_object_ids || '').split(';').filter(Boolean)) {
        if (chunk.includes(old)) out[old] = d;
      }
    }
  }
  return out;
}

// Numer transakcji z linku HubSpot („…/record/0-3/123”, „…/deal/123”) albo z samego numeru.
function dealIdFromInput(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/(?:record\/0-3|\/deals?)\/(\d{5,})/i) || s.match(/^(\d{5,})$/);
  return m ? m[1] : null;
}

function parseArea(raw) {
  const n = Number(String(raw ?? '').replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
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

// Hala z pola „Hala” w HubSpot („D”, „Hala D”, przy historii zmian ostatnia wartość).
function parseHall(raw) {
  const parts = String(raw || '').split(/\s*(?:-+>|=+>|>|,|;|\/)\s*/).map((p) => p.trim()).filter(Boolean);
  const v = (parts[parts.length - 1] || '').toUpperCase().replace(/^HALA\s*/, '');
  if (!v) return { ok: true, hall: null };
  return HALLS.includes(v) ? { ok: true, hall: `Hala ${v}` } : { ok: false };
}

// Separatory historii zmian stoiska w HubSpot: „->”, „-->”, „=>”, „>”, przecinek, średnik, „/”,
// „ - ” ze spacjami oraz „-” między dwoma numerami (np. D1.01-D2.01). „=” i „+” nie są separatorami.
const STAND_SEPARATORS = /\s*(?:-+>|=+>|>|,|;|\/)\s*|\s+-\s+|(?<=\d[a-z]?)-(?=[a-z]\d)/i;
const tidyStand = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Numer stoiska z HubSpot: pojedynczy 1:1, przy historii zmian (np. „D48-> E53 -> D66”) ostatni.
function parseStand(raw) {
  const v = String(raw || '').trim();
  if (STAND_RE.test(v)) return tidyStand(v);
  const parts = v.split(STAND_SEPARATORS)
    .map((p) => (p || '').replace(/\s+/g, '').replace(/^[=-]+|[=-]+$/g, ''))
    .filter(Boolean);
  const last = parts[parts.length - 1] || '';
  return STAND_RE.test(last) ? tidyStand(last) : null;
}

const sameText = (a, b) => String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase();
const sameArea = (a, b) => (a === null || a === undefined || a === '' ? null : Number(a)) === (b === null || b === undefined ? null : Number(b));

// Odczyt transakcji: { ok, hall, stand, area } albo { ok: false, type, info } gdy danych nie da się użyć.
function readDeal(deal) {
  const p = deal.properties || {};
  const rawStand = String(p.numer_stoiska || '').trim();
  if (!rawStand) return { ok: false, type: 'brak_stoiska', info: 'Transakcja nie ma numeru stoiska' };
  const stand = parseStand(rawStand);
  if (!stand) return { ok: false, type: 'format_stoiska', info: 'Nie da się odczytać numeru stoiska (np. „=”, „+”, spacje w środku, litery spoza alfabetu łacińskiego)' };
  const hall = parseHall(p.hala_);
  if (!hall.ok) return { ok: false, type: 'format_hali', info: `Hala spoza listy ${HALLS.join(', ')}` };
  return { ok: true, hall: hall.hall, stand, area: parseArea(p.metraz) };
}

// Zapisuje halę, stoisko i metraż z transakcji na stoisku; zmianę odnotowuje w historii.
async function applyDealToStand(t, deal, read, eventName, changes, stats) {
  const newHall = read.hall || t.hall_name;
  const newArea = read.area ?? (t.booth_area === null || t.booth_area === undefined ? null : Number(t.booth_area));
  if (sameText(t.stand_number, read.stand) && sameText(t.hall_name, newHall) && sameArea(t.booth_area, newArea)) {
    if (stats) stats.unchanged++;
    return false;
  }
  await db.query('UPDATE exhibitor_events SET hall_name = $2, stand_number = $3, booth_area = $4 WHERE id = $1', [t.id, newHall, read.stand, newArea]);
  await db.query(
    `INSERT INTO hubspot_stand_changes (exhibitor_event_id, exhibitor_id, exhibition_id, hubspot_deal_id, old_hall, new_hall, old_stand, new_stand, old_area, new_area)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [t.id, t.exhibitor_id, t.exhibition_id, deal.id, t.hall_name, newHall, t.stand_number, read.stand, t.booth_area, newArea]
  );
  if (changes) changes.push({ firma: t.company_name, event: eventName, stare: `${t.hall_name || ''} / ${t.stand_number || ''}`, nowe: `${newHall || ''} / ${read.stand}` });
  if (stats) stats.updated++;
  return true;
}

async function linkStand(participationId, dealId, source, by) {
  await db.query(
    `UPDATE exhibitor_events SET hubspot_deal_id = $2, hubspot_link_source = $3, hubspot_linked_by = $4, hubspot_linked_at = NOW() WHERE id = $1`,
    [participationId, dealId, dealId ? source : null, dealId ? by || null : null]
  );
}

const STAND_COLUMNS = `ee.id, ee.exhibitor_id, ee.exhibition_id, ee.hall_name, ee.stand_number, ee.booth_area, ee.hubspot_deal_id,
  x.company_name, regexp_replace(COALESCE(x.nip, ''), '\\D', '', 'g') AS nip`;

async function syncEvent(ev, problems, changes, stats) {
  const { rows: ours } = await db.query(
    `SELECT ${STAND_COLUMNS} FROM exhibitor_events ee JOIN exhibitors x ON x.id = ee.exhibitor_id WHERE ee.exhibition_id = $1`, [ev.id]
  );

  // 1. Stoiska z podpiętą transakcją – wyłącznie po transakcji.
  const linked = ours.filter((r) => r.hubspot_deal_id);
  const linkedDeals = linked.length ? await fetchDealsById(linked.map((r) => r.hubspot_deal_id)) : {};
  for (const t of linked) {
    const deal = linkedDeals[t.hubspot_deal_id];
    const base = { eventId: ev.id, event: ev.name, dealId: t.hubspot_deal_id, firma: t.company_name, participationId: t.id };
    stats.dealsChecked++;
    if (!deal) { problems.push({ ...base, type: 'transakcja_brak', info: 'Podpiętej transakcji nie ma w HubSpot (usunięta) – podepnij inną' }); continue; }
    if (String(deal.id) !== String(t.hubspot_deal_id)) {
      await db.query('UPDATE exhibitor_events SET hubspot_deal_id = $2 WHERE id = $1', [t.id, String(deal.id)]);
      t.hubspot_deal_id = String(deal.id);
    }
    Object.assign(base, { deal: deal.properties.dealname, hala: deal.properties.hala_ || '', stoisko: deal.properties.numer_stoiska || '' });
    if (ev.hsValues.length && deal.properties.udzial_targow && !ev.hsValues.some((v) => sameText(v, deal.properties.udzial_targow))) {
      problems.push({ ...base, type: 'transakcja_inne_targi', info: `Transakcja dotyczy targów „${deal.properties.udzial_targow}”, które w słowniku nie są przypisane do tego wydarzenia` });
      continue;
    }
    const read = readDeal(deal);
    if (!read.ok) { problems.push({ ...base, type: read.type, info: read.info }); continue; }
    await applyDealToStand(t, deal, read, ev.name, changes, stats);
  }

  // 2. Stoiska bez transakcji – dotychczasowe dopasowanie po NIP (do czasu podpięcia).
  const unlinked = ours.filter((r) => !r.hubspot_deal_id);
  if (!unlinked.length || !ev.hsValues.length) return;
  const touched = new Set();
  const reportUntouched = () => {
    for (const t of unlinked) {
      if (touched.has(t.id)) continue;
      problems.push({ eventId: ev.id, event: ev.name, firma: t.company_name, participationId: t.id, stoisko: t.stand_number || '', hala: t.hall_name || '',
        type: 'stoisko_bez_transakcji', info: 'Do stoiska nie pasuje żadna transakcja z HubSpot – podepnij ją w Powiązaniach' });
    }
  };
  const linkedIds = new Set(linked.map((r) => String(r.hubspot_deal_id)));
  const allDeals = (await searchDeals([
    { propertyName: 'pipeline', operator: 'EQ', value: DOT_PIPELINE },
    { propertyName: 'udzial_targow', operator: 'IN', values: ev.hsValues },
  ])).filter((d) => String(d.properties.numer_stoiska || '').trim());
  const deals = allDeals.filter((d) => !linkedIds.has(String(d.id)));
  if (!deals.length) { reportUntouched(); return; }
  const dealCompanies = await companiesForDeals(deals.map((d) => d.id));
  const dealById = new Map(deals.map((d) => [d.id, d]));
  const reads = new Map(deals.map((d) => [d.id, readDeal(d)]));
  const consumed = new Set();
  const autoLink = async (t, deal) => {
    await linkStand(t.id, deal.id, 'auto', null);
    stats.autoLinked++;
    touched.add(t.id);
    consumed.add(deal.id);
    await applyDealToStand(t, deal, reads.get(deal.id), ev.name, changes, stats);
  };

  const byNip = new Map();
  for (const d of deals) {
    const nips = [...new Set((dealCompanies[d.id] || []).map((c) => c.nip).filter(Boolean))];
    const base = { eventId: ev.id, event: ev.name, dealId: d.id, deal: d.properties.dealname, hala: d.properties.hala_ || '', stoisko: d.properties.numer_stoiska };
    if (nips.length !== 1 || nips[0].length !== 10) { problems.push({ ...base, type: 'nip_hubspot', info: nips.length ? `NIP w HubSpot: ${nips.join(', ')}` : 'Firma w HubSpot bez NIP' }); continue; }
    if (!byNip.has(nips[0])) byNip.set(nips[0], []);
    byNip.get(nips[0]).push({ ...base, nip: nips[0] });
  }

  const oursByNip = new Map();
  for (const r of unlinked) {
    if (!oursByNip.has(r.nip)) oursByNip.set(r.nip, []);
    oursByNip.get(r.nip).push(r);
  }

  for (const [nip, group] of byNip) {
    stats.dealsChecked += group.length;
    const targets = oursByNip.get(nip) || [];
    if (!targets.length) { stats.notAssigned++; continue; }
    const firma = targets[0].company_name;

    // NIP i numer stoiska zgodne = pewne dopasowanie, także gdy firma ma kilka stoisk lub kilka transakcji.
    let paired = 0;
    for (const t of targets) {
      const sameStandDeals = group.filter((g) => reads.get(g.dealId).ok && sameText(reads.get(g.dealId).stand, t.stand_number));
      const sameStandTargets = targets.filter((o) => sameText(o.stand_number, t.stand_number));
      if (sameStandDeals.length === 1 && sameStandTargets.length === 1) {
        await autoLink(t, dealById.get(sameStandDeals[0].dealId));
        paired++;
      }
    }
    const restT = targets.filter((t) => !touched.has(t.id));
    const restD = group.filter((g) => !consumed.has(g.dealId));
    if (!restT.length || !restD.length) continue;
    for (const t of restT) touched.add(t.id);

    const first = restD[0];
    const standValues = [...new Set(restD.map((g) => (reads.get(g.dealId).stand || String(g.stoisko).trim()).toUpperCase()))];
    if (standValues.length > 1) { problems.push({ ...first, firma, type: 'kilka_deali', info: `Kilka deali z różnymi stoiskami: ${restD.map((d) => `${d.hala} / ${d.stoisko}`).join('; ')}` }); continue; }
    // Litera stoiska nie wyznacza hali – po zmianie numeracji np. stoisko B17 stoi w hali D.
    const read = reads.get(first.dealId);
    if (!read.ok) { problems.push({ ...first, firma, type: read.type, info: read.info }); continue; }
    if (restT.length > 1 || paired) {
      problems.push({ ...first, firma, type: 'kilka_stoisk', info: `Wystawca ma w aplikacji stoiska ${restT.map((t) => t.stand_number || '-').join(', ')} bez pary w HubSpot (transakcja: ${first.stoisko}) – podepnij transakcję w Powiązaniach` });
      continue;
    }
    // Jedna transakcja i jedno stoisko z tym NIP-em (stoisko zmienione w HubSpot) – przenosimy dane i podpinamy.
    if (restD.length === 1) await autoLink(restT[0], dealById.get(first.dealId));
    else await applyDealToStand(restT[0], dealById.get(first.dealId), read, ev.name, changes, stats);
  }

  // 3. Bez zgodnego NIP-u: numer stoiska jednoznaczny po obu stronach i podobna nazwa firmy.
  const appCount = new Map();
  for (const r of ours) { const k = String(r.stand_number || '').trim().toUpperCase(); if (k) appCount.set(k, (appCount.get(k) || 0) + 1); }
  const hsByStand = new Map();
  for (const d of allDeals) {
    const s = parseStand(d.properties.numer_stoiska);
    if (s) hsByStand.set(s.toUpperCase(), [...(hsByStand.get(s.toUpperCase()) || []), d]);
  }
  for (const t of unlinked) {
    const k = String(t.stand_number || '').trim().toUpperCase();
    if (touched.has(t.id) || !k || appCount.get(k) !== 1) continue;
    const cands = hsByStand.get(k) || [];
    if (cands.length !== 1) continue;
    const d = dealById.get(cands[0].id);
    if (!d || consumed.has(d.id) || !reads.get(d.id).ok) continue;
    const hsNames = [d.properties.dealname, ...(dealCompanies[d.id] || []).map((c) => c.name)];
    if (namesSimilar(t.company_name, hsNames, d.properties.udzial_targow)) await autoLink(t, d);
  }
  reportUntouched();
}

// Słowa, które nie odróżniają firm (formy prawne, ogólniki); nie liczą się przy porównaniu nazw.
const NAME_STOP_WORDS = new Set([
  'spolka', 'ograniczona', 'odpowiedzialnoscia', 'akcyjna', 'jawna', 'komandytowa', 'komandytowo', 'cywilna', 'partnerska',
  'oddzial', 'polsce', 'polska', 'poland', 'polish', 'group', 'grupa', 'ltd', 'limited', 'gmbh', 'inc', 'llc', 'sro', 'spa', 'srl',
  'company', 'corp', 'corporation', 'international', 'trade', 'trading', 'service', 'services', 'serwis', 'firma', 'przedsiebiorstwo',
  'produkcyjno', 'produkcyjne', 'handlowe', 'handlowo', 'uslugowe', 'uslugowo', 'technologies', 'technology', 'tech', 'systems',
  'system', 'solutions', 'expo', 'targi', 'warsaw', 'warszawa', 'the', 'and', 'organizacji', 'holding', 'europe', 'industrial',
  'industry', 'machinery', 'equipment', 'design', 'studio', 'plus', 'pro', 'center', 'centrum', 'fair', 'show', 'days', 'week',
  'uab', 'sia', 'jsc', 'ooo', 'kft', 'doo', 'sas', 'sarl', 'bvba', 'oyj', 'aps', 'llp', 'plc', 'pvt', 'private', 'srl', 'gmbh',
  'industries', 'manufacturing', 'products', 'product', 'partners', 'partner', 'media', 'power', 'auto', 'energy', 'energia',
  'invest', 'investment', 'investments', 'global', 'world', 'euro', 'eco', 'eko', 'bio', 'agro', 'food', 'home', 'green',
  'export', 'import', 'consulting', 'marketing', 'barter', 'stoisko', 'stoiskiem',
]);
const nameTokens = (s) => String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !NAME_STOP_WORDS.has(w));

// Nazwa firmy z aplikacji a nazwy z HubSpot (transakcja, firmy): wspólne znaczące słowo
// albo identyczna nazwa po usunięciu znaków. Słowa z nazwy targów (zawartej w nazwie transakcji) pomijamy.
function namesSimilar(appName, hsNames, eventName) {
  const eventWords = new Set(nameTokens(eventName));
  const ours = new Set(nameTokens(appName).filter((w) => !eventWords.has(w)));
  const compact = normName(appName);
  return hsNames.some((n) => {
    if (compact.length >= 4 && normName(n) === compact) return true;
    return nameTokens(n).some((w) => !eventWords.has(w) && ours.has(w));
  });
}

// Podpina (albo odpina, dealId = null) transakcję do stoiska i od razu przenosi z niej dane.
// Zwraca { ok, deal, read, changed } albo { ok: false, error }.
async function setStandDeal(participationId, rawDeal, { source = 'manual', by = null, deal: prefetched = null } = {}) {
  const { rows: [t] } = await db.query(
    `SELECT ${STAND_COLUMNS}, e.name AS exhibition_name FROM exhibitor_events ee
     JOIN exhibitors x ON x.id = ee.exhibitor_id JOIN exhibitions e ON e.id = ee.exhibition_id WHERE ee.id = $1`, [participationId]
  );
  if (!t) return { ok: false, error: 'Nie znaleziono stoiska' };
  if (rawDeal === null || rawDeal === undefined || String(rawDeal).trim() === '') {
    await linkStand(participationId, null);
    return { ok: true, unlinked: true };
  }
  const dealId = dealIdFromInput(rawDeal);
  if (!dealId) return { ok: false, error: 'To nie wygląda na link ani numer transakcji HubSpot' };
  if (!hasToken()) {
    await linkStand(participationId, dealId, source, by);
    return { ok: true, dealId, offline: true };
  }
  const deal = prefetched || (await fetchDealsById([dealId]))[dealId];
  if (!deal) return { ok: false, error: `Nie ma w HubSpot transakcji ${dealId}` };
  await linkStand(participationId, String(deal.id), source, by);
  const read = readDeal(deal);
  // Tak samo jak synchronizacja: transakcji z targów spoza słownika tego wydarzenia nie przenosimy.
  const { rows: dict } = await db.query('SELECT hs_value FROM hubspot_event_dictionary WHERE exhibition_id = $1', [t.exhibition_id]);
  const dealEvent = deal.properties.udzial_targow;
  if (dict.length && dealEvent && !dict.some((r) => sameText(r.hs_value, dealEvent))) {
    return {
      ok: true, dealId: String(deal.id), deal: describeDeal(deal), read, changed: false,
      warning: `Transakcja dotyczy targów „${String(dealEvent).trim()}”, a nie „${t.exhibition_name}” – dane stoiska nie zostały przeniesione`,
    };
  }
  const changed = read.ok ? await applyDealToStand(t, deal, read, t.exhibition_name, null, null) : false;
  return { ok: true, dealId: String(deal.id), deal: describeDeal(deal), read, changed, warning: read.ok ? null : `${read.info} – dane stoiska nie zostały przeniesione` };
}

function describeDeal(deal, companies) {
  const p = deal.properties || {};
  const read = readDeal(deal);
  return {
    dealId: String(deal.id),
    url: dealUrl(deal.id),
    name: p.dealname || '',
    event: p.udzial_targow || '',
    hallRaw: p.hala_ || '',
    standRaw: p.numer_stoiska || '',
    hall: read.ok ? read.hall : null,
    stand: read.ok ? read.stand : null,
    area: parseArea(p.metraz),
    problem: read.ok ? null : read.info,
    companies: companies || undefined,
  };
}

async function runSync({ mode = 'auto' } = {}) {
  if (!isEnabled()) return { skipped: 'Synchronizacja wyłączona (brak HUBSPOT_TOKEN lub HUBSPOT_SYNC_ENABLED=false)' };
  if (running) return { skipped: 'Synchronizacja już trwa' };
  running = true;
  const startedAt = new Date();
  const full = mode === 'full' || !lastSuccessAt || !lastFullAt || startedAt - lastFullAt > FULL_EVERY_HOURS * 3600 * 1000;
  const { rows: [run] } = await db.query(`INSERT INTO hubspot_sync_runs (mode) VALUES ($1) RETURNING id`, [full ? 'full' : 'incremental']);
  const stats = { events: 0, dealsChecked: 0, unchanged: 0, updated: 0, notAssigned: 0, autoLinked: 0 };
  const problems = [];
  const changes = [];
  try {
    const { matched, unmatched } = await loadEventMapping();
    // Targi spoza słownika też synchronizujemy, ale tylko stoiska z podpiętą transakcją.
    const { rows: withLinks } = await db.query(
      `SELECT DISTINCT exhibition_id FROM exhibitor_events WHERE hubspot_deal_id IS NOT NULL AND exhibition_id = ANY($1::int[])`,
      [unmatched.map((u) => u.id)]
    );
    const linkedIds = new Set(withLinks.map((r) => r.exhibition_id));
    let toSync = [...matched, ...unmatched.filter((u) => linkedIds.has(u.id)).map((u) => ({ ...u, hsValues: [] }))];
    if (!full) {
      const since = new Date(lastSuccessAt.getTime() - 5 * 60 * 1000);
      const changed = await searchDeals([
        { propertyName: 'pipeline', operator: 'EQ', value: DOT_PIPELINE },
        { propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(since.getTime()) },
      ]);
      const values = new Set(changed.map((d) => String(d.properties.udzial_targow || '').trim().toUpperCase()).filter(Boolean));
      const { rows: touched } = await db.query(
        'SELECT DISTINCT exhibition_id FROM exhibitor_events WHERE hubspot_deal_id = ANY($1::text[])', [changed.map((d) => String(d.id))]
      );
      const touchedIds = new Set(touched.map((r) => r.exhibition_id));
      toSync = toSync.filter((e) => touchedIds.has(e.id) || e.hsValues.some((v) => values.has(String(v).trim().toUpperCase())));
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
  db.query(`UPDATE hubspot_sync_runs SET finished_at = NOW(), error = 'Przerwana przez restart serwera' WHERE finished_at IS NULL`).catch(() => {});
  setTimeout(() => runSync().catch(() => {}), 60 * 1000);
  setInterval(() => runSync().catch(() => {}), INTERVAL_MIN * 60 * 1000);
}

module.exports = {
  runSync, startScheduler, isEnabled, hasToken, isRunning: () => running, refreshDictionary, requestFullSync,
  hs, searchDeals, companiesForDeals, fetchDealsById, dealIdFromInput, describeDeal, setStandDeal, linkStand,
  parseStand, normName, nipDigits, namesSimilar, dealUrl, DOT_PIPELINE, DEAL_PROPS,
};
