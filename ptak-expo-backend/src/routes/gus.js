const express = require('express');
const router = express.Router();
const https = require('https');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Helper to normalize and validate NIP
function normalizeNip(raw) {
  return String(raw || '').trim().replace(/^PL/i, '').replace(/\s|-/g, '');
}

function isValidNip(nip) {
  return /^\d{10}$/.test(nip);
}

// Simple address parser to extract street, postal code and city from a single string
function parseAddress(address) {
  const original = String(address || '');
  let addressLine = original;
  let postalCode = '';
  let city = '';

  const parts = original.split(',').map((p) => p.trim()).filter(Boolean);
  const postalCityRegex = /(\d{2}-\d{3})\s+([A-Za-zÀ-žąćęłńóśżźĄĆĘŁŃÓŚŻŹ\-\.\'\s]+)/;

  for (const p of [...parts].reverse()) {
    const m = p.match(postalCityRegex);
    if (m) {
      postalCode = m[1];
      city = m[2].trim();
      break;
    }
  }

  if (!postalCode) {
    const m = original.match(postalCityRegex);
    if (m) {
      postalCode = m[1];
      city = m[2].trim();
    }
  }

  if (postalCode) {
    addressLine = parts.filter((p) => !p.includes(postalCode)).join(', ');
    if (!addressLine) {
      addressLine = original.replace(postalCityRegex, '').replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').trim();
    }
  }

  return { addressLine: addressLine.trim(), postalCode, city };
}

// GET /api/v1/gus/company/:nip
// Admin-only: fetch company data by NIP using MF White List API and map to fields used by frontend
router.get('/company/:nip', verifyToken, requireAdmin, async (req, res) => {
  try {
    const nip = normalizeNip(req.params.nip);
    if (!isValidNip(nip)) {
      return res.status(400).json({ success: false, message: 'Nieprawidłowy NIP' });
    }

    const date = new Date().toISOString().slice(0, 10);
    const url = `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${date}`;

    https
      .get(url, (r) => {
        let body = '';
        r.on('data', (chunk) => (body += chunk));
        r.on('end', () => {
          try {
            const json = JSON.parse(body);
            const subject = json?.result?.subject;
            if (!subject) {
              const msg = json?.message || 'Nie znaleziono danych dla podanego NIP';
              return res.json({ success: false, message: msg });
            }

            const addr = subject.workingAddress || subject.residenceAddress || '';
            const parsed = parseAddress(addr);

            const data = {
              companyName: subject.name || '',
              address: parsed.addressLine || '',
              postalCode: parsed.postalCode || '',
              city: parsed.city || '',
              regon: subject.regon || null,
              statusVat: subject.statusVat || null,
            };

            return res.json({ success: true, data });
          } catch (e) {
            return res.status(500).json({ success: false, message: 'Błąd podczas parsowania odpowiedzi GUS/MF', details: String(e?.message || e) });
          }
        });
      })
      .on('error', (err) => {
        return res.status(502).json({ success: false, message: 'Błąd podczas połączenia z API GUS/MF', details: String(err?.message || err) });
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Błąd serwera podczas pobierania danych z GUS', details: String(error?.message || error) });
  }
});

module.exports = router;


