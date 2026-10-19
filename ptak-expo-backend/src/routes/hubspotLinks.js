const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const db = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const sync = require('../services/hubspotStandSync');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const by = (req) => (req.user && req.user.email) || null;
const sameText = (a, b) => String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase();

const PROBLEM_LABELS = {
  transakcja_brak: 'Podpięta transakcja nie istnieje',
  transakcja_inne_targi: 'Transakcja z innych targów',
  stoisko_bez_transakcji: 'Stoisko bez transakcji',
  brak_stoiska: 'Transakcja bez numeru stoiska',
  nip_hubspot: 'Brak NIP w HubSpot',
  kilka_deali: 'Kilka transakcji z różnymi stoiskami',
  format_stoiska: 'Nieczytelny numer stoiska',
  format_hali: 'Nieczytelna hala',
  kilka_stoisk: 'Kilka stoisk w aplikacji',
  nazwa_targow: 'Targi spoza słownika',
};

router.use(verifyToken, requireAdmin);
router.use((req, res, next) => {
  if (!sync.hasToken()) return res.status(503).json({ success: false, error: 'Połączenie z HubSpot nie jest skonfigurowane' });
  return next();
});

async function hsValuesFor(exhibitionId) {
  const { rows } = await db.query('SELECT hs_value FROM hubspot_event_dictionary WHERE exhibition_id = $1', [exhibitionId]);
  return rows.map((r) => r.hs_value);
}

// Transakcje targów razem z firmami – pobierane raz na 2 minuty na wydarzenie.
const eventCache = new Map();
async function eventDeals(exhibitionId, fresh = false) {
  const hit = eventCache.get(exhibitionId);
  if (!fresh && hit && Date.now() - hit.at < 2 * 60 * 1000) return hit;
  const hsValues = await hsValuesFor(exhibitionId);
  const deals = hsValues.length
    ? await sync.searchDeals([
      { propertyName: 'pipeline', operator: 'EQ', value: sync.DOT_PIPELINE },
      { propertyName: 'udzial_targow', operator: 'IN', values: hsValues },
    ])
    : [];
  const companies = deals.length ? await sync.companiesForDeals(deals.map((d) => d.id)) : {};
  const entry = { at: Date.now(), hsValues, deals: deals.map((d) => sync.describeDeal(d, companies[d.id] || [])) };
  eventCache.set(exhibitionId, entry);
  return entry;
}

async function standsOf(exhibitionId) {
  const { rows } = await db.query(
    `SELECT ee.id AS participation_id, ee.exhibitor_id, ee.hall_name, ee.stand_number, ee.booth_area,
            ee.hubspot_deal_id, ee.hubspot_link_source, ee.hubspot_linked_by, ee.hubspot_linked_at,
            x.company_name, x.nip
     FROM exhibitor_events ee JOIN exhibitors x ON x.id = ee.exhibitor_id
     WHERE ee.exhibition_id = $1
     ORDER BY x.company_name, ee.stand_number NULLS LAST, ee.id`, [exhibitionId]
  );
  return rows;
}

// Podpowiedzi dla stoiska: numer stoiska +3, NIP +2, nazwa firmy +1. Pewne = stoisko i NIP.
function suggestFor(stand, deals) {
  const nip = sync.nipDigits(stand.nip);
  const name = sync.normName(stand.company_name);
  const out = [];
  for (const d of deals) {
    const reasons = [];
    let score = 0;
    if (stand.stand_number && d.stand && sameText(d.stand, stand.stand_number)) { score += 3; reasons.push('stoisko'); }
    if (nip && (d.companies || []).some((c) => c.nip === nip)) { score += 2; reasons.push('NIP'); }
    if (name && (d.companies || []).some((c) => sync.normName(c.name) === name || sync.normName(d.name).includes(name))) { score += 1; reasons.push('nazwa'); }
    if (score >= 2) out.push({ ...d, score, reasons, certain: reasons.includes('stoisko') && reasons.includes('NIP') });
  }
  out.sort((a, b) => b.score - a.score);
  // Pewna tylko wtedy, gdy nie ma drugiej równie dobrej.
  if (out[0] && out[0].certain && out[1] && out[1].score === out[0].score) out[0].certain = false;
  return out.slice(0, 3);
}

async function buildLinks(exhibitionId, fresh) {
  const [{ deals, hsValues }, stands] = await Promise.all([eventDeals(exhibitionId, fresh), standsOf(exhibitionId)]);
  const byId = new Map(deals.map((d) => [d.dealId, d]));
  const missing = stands.map((s) => s.hubspot_deal_id).filter((id) => id && !byId.has(id));
  if (missing.length) {
    const extra = await sync.fetchDealsById(missing);
    for (const d of Object.values(extra)) byId.set(String(d.id), { ...sync.describeDeal(d), otherEvent: true });
  }
  const linkedCount = new Map();
  for (const s of stands) if (s.hubspot_deal_id) linkedCount.set(s.hubspot_deal_id, (linkedCount.get(s.hubspot_deal_id) || 0) + 1);
  const rows = stands.map((s) => {
    const base = {
      participationId: s.participation_id, exhibitorId: s.exhibitor_id, companyName: s.company_name, nip: s.nip,
      hall: s.hall_name, stand: s.stand_number, area: s.booth_area === null ? null : Number(s.booth_area),
    };
    if (s.hubspot_deal_id) {
      return {
        ...base, status: 'linked', dealId: s.hubspot_deal_id, source: s.hubspot_link_source, linkedBy: s.hubspot_linked_by, linkedAt: s.hubspot_linked_at,
        deal: byId.get(s.hubspot_deal_id) || { dealId: s.hubspot_deal_id, url: sync.dealUrl(s.hubspot_deal_id), missing: true },
        sharedWith: (linkedCount.get(s.hubspot_deal_id) || 1) - 1,
      };
    }
    const suggestions = suggestFor(s, deals);
    return { ...base, status: suggestions[0] && suggestions[0].certain ? 'certain' : suggestions.length ? 'suggested' : 'none', suggestions };
  });
  const usedDeals = new Set(stands.map((s) => s.hubspot_deal_id).filter(Boolean));
  return { hsValues, rows, dealsTotal: deals.length, dealsUnlinked: deals.filter((d) => !usedDeals.has(d.dealId)), dealsById: byId };
}

// GET /api/v1/hubspot/deal?ref=<link lub numer> – podgląd transakcji
router.get('/deal', async (req, res) => {
  try {
    const id = sync.dealIdFromInput(req.query.ref);
    if (!id) return res.status(400).json({ success: false, error: 'To nie wygląda na link ani numer transakcji HubSpot' });
    const deal = (await sync.fetchDealsById([id]))[id];
    if (!deal) return res.status(404).json({ success: false, error: `Nie ma w HubSpot transakcji ${id}` });
    const companies = await sync.companiesForDeals([id]);
    return res.json({ success: true, deal: sync.describeDeal(deal, companies[id] || []) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/hubspot/deals/search?q=&exhibitionId= – wyszukiwanie po firmie, nazwie transakcji lub numerze stoiska
router.get('/deals/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ success: true, deals: [] });
    const exhibitionId = parseInt(req.query.exhibitionId, 10);
    if (exhibitionId) {
      const { deals } = await eventDeals(exhibitionId);
      const nq = sync.normName(q);
      const found = deals.filter((d) => sameText(d.stand, q) || sameText(d.standRaw, q)
        || sync.normName(d.name).includes(nq) || (d.companies || []).some((c) => sync.normName(c.name).includes(nq) || (c.nip && c.nip === sync.nipDigits(q))));
      if (found.length) return res.json({ success: true, deals: found.slice(0, 20) });
    }
    const j = await sync.hs('/crm/v3/objects/deals/search', {
      query: q, limit: 20, properties: sync.DEAL_PROPS,
      filterGroups: [{ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: sync.DOT_PIPELINE }] }],
    });
    const results = j.results || [];
    const companies = results.length ? await sync.companiesForDeals(results.map((d) => d.id)) : {};
    return res.json({ success: true, deals: results.map((d) => sync.describeDeal(d, companies[d.id] || [])) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/v1/hubspot/stands/:participationId/deal { deal: link | numer | null }
router.put('/stands/:participationId/deal', async (req, res) => {
  try {
    const result = await sync.setStandDeal(parseInt(req.params.participationId, 10), req.body ? req.body.deal : null, { source: 'manual', by: by(req) });
    if (!result.ok) return res.status(400).json({ success: false, error: result.error });
    eventCache.clear();
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/hubspot/links – trwające i przyszłe targi z liczbą podpiętych stoisk
router.get('/links', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT e.id, e.name, e.start_date, e.end_date,
              COUNT(ee.id)::int AS stands,
              COUNT(ee.hubspot_deal_id)::int AS linked,
              EXISTS (SELECT 1 FROM hubspot_event_dictionary d WHERE d.exhibition_id = e.id) AS in_dictionary
       FROM exhibitions e JOIN exhibitor_events ee ON ee.exhibition_id = e.id
       WHERE COALESCE(e.end_date, e.start_date) >= CURRENT_DATE
       GROUP BY e.id ORDER BY e.start_date NULLS LAST, e.name`
    );
    return res.json({ success: true, exhibitions: rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/hubspot/links/:exhibitionId – stoiska targów ze statusem powiązania i podpowiedziami
router.get('/links/:exhibitionId', async (req, res) => {
  try {
    const { hsValues, rows, dealsTotal, dealsUnlinked } = await buildLinks(parseInt(req.params.exhibitionId, 10), req.query.fresh === '1');
    return res.json({ success: true, hsValues, rows, dealsTotal, dealsUnlinked });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/hubspot/links/:exhibitionId/approve { items: [{ participationId, dealId }] } albo { allCertain: true }
router.post('/links/:exhibitionId/approve', async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    let items = Array.isArray(req.body && req.body.items) ? req.body.items : [];
    if (req.body && req.body.allCertain) {
      const { rows } = await buildLinks(exhibitionId, false);
      items = rows.filter((r) => r.status === 'certain').map((r) => ({ participationId: r.participationId, dealId: r.suggestions[0].dealId }));
    }
    const { rows: own } = await db.query('SELECT id FROM exhibitor_events WHERE exhibition_id = $1', [exhibitionId]);
    const allowed = new Set(own.map((r) => r.id));
    let linked = 0;
    const errors = [];
    for (const it of items) {
      const pid = parseInt(it.participationId, 10);
      if (!allowed.has(pid)) { errors.push({ participationId: pid, error: 'Stoisko z innych targów' }); continue; }
      const r = await sync.setStandDeal(pid, it.dealId, { source: 'approved', by: by(req) });
      if (r.ok) linked++; else errors.push({ participationId: pid, error: r.error });
    }
    eventCache.clear();
    return res.json({ success: true, linked, errors });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const COLS = {
  id: 'ID stoiska (nie zmieniaj)', firma: 'Firma', nip: 'NIP', hala: 'Hala', stoisko: 'Stoisko', metraz: 'Metraż',
  link: 'Link do transakcji HubSpot', podpowiedz: 'Podpowiedź', powod: 'Zgodność', status: 'Status',
};

// GET /api/v1/hubspot/links/:exhibitionId/export – XLSX do uzupełnienia linków
router.get('/links/:exhibitionId/export', async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    const { rows: [ex] } = await db.query('SELECT name FROM exhibitions WHERE id = $1', [exhibitionId]);
    if (!ex) return res.status(404).json({ success: false, error: 'Nie znaleziono wydarzenia' });
    const { rows, dealsUnlinked } = await buildLinks(exhibitionId, false);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Stoiska');
    ws.columns = [
      { header: COLS.id, key: 'id', width: 12 }, { header: COLS.firma, key: 'firma', width: 40 }, { header: COLS.nip, key: 'nip', width: 14 },
      { header: COLS.hala, key: 'hala', width: 7 }, { header: COLS.stoisko, key: 'stoisko', width: 10 }, { header: COLS.metraz, key: 'metraz', width: 9 },
      { header: COLS.link, key: 'link', width: 62 }, { header: COLS.podpowiedz, key: 'podpowiedz', width: 62 },
      { header: COLS.powod, key: 'powod', width: 18 }, { header: COLS.status, key: 'status', width: 16 },
    ];
    for (const r of rows) {
      const s = r.suggestions && r.suggestions[0];
      ws.addRow({
        id: r.participationId, firma: r.companyName, nip: r.nip || '', hala: r.hall || '', stoisko: r.stand || '', metraz: r.area,
        link: r.dealId ? sync.dealUrl(r.dealId) : '',
        podpowiedz: s ? `${s.url}  (${s.name}; ${s.hall || s.hallRaw || '-'} / ${s.stand || s.standRaw || '-'})` : '',
        powod: s ? s.reasons.join(' + ') : '',
        status: { linked: 'podpięte', certain: 'pewna podpowiedź', suggested: 'do sprawdzenia', none: 'brak podpowiedzi' }[r.status],
      });
    }
    ws.getRow(1).font = { bold: true };
    ws.getColumn('link').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5CC' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: 'A1', to: 'J1' };

    const wd = wb.addWorksheet('Transakcje bez stoiska');
    wd.columns = [
      { header: 'Link do transakcji', key: 'url', width: 62 }, { header: 'Transakcja', key: 'name', width: 40 },
      { header: 'Firma w HubSpot', key: 'firma', width: 40 }, { header: 'NIP', key: 'nip', width: 14 },
      { header: 'Hala', key: 'hala', width: 8 }, { header: 'Stoisko', key: 'stoisko', width: 12 }, { header: 'Metraż', key: 'metraz', width: 9 },
    ];
    for (const d of dealsUnlinked) {
      wd.addRow({
        url: d.url, name: d.name, firma: (d.companies || []).map((c) => c.name).join(', '), nip: (d.companies || []).map((c) => c.nip).filter(Boolean).join(', '),
        hala: d.hallRaw, stoisko: d.standRaw, metraz: d.area,
      });
    }
    wd.getRow(1).font = { bold: true };
    wd.views = [{ state: 'frozen', ySplit: 1 }];

    const fname = `Powiazania-HubSpot-${ex.name}`.replace(/[^\p{L}\p{N}\- ]/gu, '').trim().replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fname)}.xlsx`);
    await wb.xlsx.write(res);
    return res.end();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const cellText = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return String(v.hyperlink || v.text || (v.richText ? v.richText.map((t) => t.text).join('') : '') || v.result || '');
  return String(v);
};

// POST /api/v1/hubspot/links/:exhibitionId/import (plik XLSX) – ?apply=1 zapisuje, bez tego tylko podgląd
router.post('/links/:exhibitionId/import', upload.single('file'), async (req, res) => {
  try {
    const exhibitionId = parseInt(req.params.exhibitionId, 10);
    if (!req.file) return res.status(400).json({ success: false, error: 'Brak pliku' });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);
    const ws = wb.getWorksheet('Stoiska') || wb.worksheets[0];
    const header = {};
    ws.getRow(1).eachCell((c, i) => { header[cellText(c.value).trim()] = i; });
    if (!header[COLS.id] || !header[COLS.link]) {
      return res.status(400).json({ success: false, error: `Plik musi mieć kolumny „${COLS.id}” i „${COLS.link}” – użyj pliku z eksportu` });
    }
    const stands = await standsOf(exhibitionId);
    const byPid = new Map(stands.map((s) => [s.participation_id, s]));
    const changes = [];
    const errors = [];
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const pid = parseInt(cellText(row.getCell(header[COLS.id]).value), 10);
      if (!pid) return;
      const raw = cellText(row.getCell(header[COLS.link]).value).trim();
      const s = byPid.get(pid);
      if (!s) { errors.push({ row: n, error: `Stoisko ${pid} nie należy do tych targów` }); return; }
      const dealId = raw ? sync.dealIdFromInput(raw) : null;
      if (raw && !dealId) { errors.push({ row: n, companyName: s.company_name, stand: s.stand_number, error: `Nie rozpoznano linku: ${raw.slice(0, 80)}` }); return; }
      if ((dealId || null) === (s.hubspot_deal_id || null)) return;
      changes.push({ row: n, participationId: pid, companyName: s.company_name, stand: s.stand_number, hall: s.hall_name, oldDealId: s.hubspot_deal_id, dealId });
    });
    const ids = changes.map((c) => c.dealId).filter(Boolean);
    const found = ids.length ? await sync.fetchDealsById(ids) : {};
    const valid = [];
    for (const c of changes) {
      if (c.dealId && !found[c.dealId]) { errors.push({ row: c.row, companyName: c.companyName, stand: c.stand, error: `Nie ma w HubSpot transakcji ${c.dealId}` }); continue; }
      if (c.dealId) c.deal = sync.describeDeal(found[c.dealId]);
      valid.push(c);
    }
    if (req.query.apply !== '1') return res.json({ success: true, preview: true, changes: valid, errors });
    let applied = 0;
    for (const c of valid) {
      const r = await sync.setStandDeal(c.participationId, c.dealId, { source: 'import', by: by(req) });
      if (r.ok) applied++; else errors.push({ row: c.row, companyName: c.companyName, stand: c.stand, error: r.error });
    }
    eventCache.clear();
    return res.json({ success: true, applied, errors });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/hubspot/problems/export – lista problemów z ostatniej pełnej synchronizacji (XLSX)
router.get('/problems/export', async (req, res) => {
  try {
    const { rows: [run] } = await db.query(
      `SELECT started_at, problems FROM hubspot_sync_runs WHERE mode = 'full' AND finished_at IS NOT NULL AND error IS NULL ORDER BY started_at DESC LIMIT 1`
    );
    const problems = (run && run.problems) || [];
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Problemy');
    ws.columns = [
      { header: 'Rodzaj', key: 'rodzaj', width: 30 }, { header: 'Targi', key: 'event', width: 34 }, { header: 'Firma', key: 'firma', width: 36 },
      { header: 'Transakcja', key: 'deal', width: 36 }, { header: 'Hala', key: 'hala', width: 12 }, { header: 'Stoisko', key: 'stoisko', width: 16 },
      { header: 'Opis', key: 'info', width: 70 }, { header: 'Link do transakcji', key: 'url', width: 62 },
    ];
    for (const p of problems) {
      ws.addRow({
        rodzaj: PROBLEM_LABELS[p.type] || p.type, event: p.event || p.hsValue || '', firma: p.firma || '', deal: p.deal || '',
        hala: p.hala || '', stoisko: p.stoisko || '', info: p.info || '', url: p.dealId ? sync.dealUrl(p.dealId) : '',
      });
    }
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: 'A1', to: 'H1' };
    const day = run ? new Date(run.started_at).toISOString().slice(0, 10) : 'brak';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Problemy-HubSpot-${day}.xlsx"`);
    await wb.xlsx.write(res);
    return res.end();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
