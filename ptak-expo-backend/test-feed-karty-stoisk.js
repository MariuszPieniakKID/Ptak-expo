// Test publicznych feedów dla firmy z kilkoma stoiskami na jednych targach.
// Porównuje nową wersję (NOWY) ze starą (STARY) i sprawdza, że:
//  - exhibitorId jest unikalny w obrębie targów, pierwsze stoisko zachowuje id konta,
//  - karta kolejnego stoiska pokazuje jego dane (opis, stoisko, osoby),
//  - dla firm z jednym stoiskiem feed jest identyczny jak wcześniej (poza nowymi polami).
// Użycie: NOWY=http://localhost:3011 STARY=http://localhost:3012 WYDARZENIE=160 WYSTAWCA=1978 STOISKO=22209 node test-feed-karty-stoisk.js

const NOWY = process.env.NOWY || 'http://localhost:3011';
const STARY = process.env.STARY || 'http://localhost:3012';
const EV = process.env.WYDARZENIE || '160';
const WYSTAWCA = process.env.WYSTAWCA;
const STOISKO = process.env.STOISKO;
const REGRESJA = (process.env.REGRESJA || '17,49,69,124').split(',');
const PRZESUNIECIE = 1000000;

let bledy = 0;
const ok = (warunek, opis) => { console.log(`${warunek ? '✅' : '❌'} ${opis}`); if (!warunek) bledy++; };
const get = async (base, path) => { const r = await fetch(base + path); return { status: r.status, body: r.headers.get('content-type')?.includes('json') ? await r.json() : await r.text() }; };
const host = (u) => new URL(u).host;
const lista = (b) => b.exhibitors || [];
const bezNowychPol = (o) => JSON.parse(JSON.stringify(o, (k, v) => (['accountId', 'account_id', 'stand_id', 'generatedAt'].includes(k) ? undefined : v))
  .split(host(NOWY)).join('HOST').split(host(STARY)).join('HOST'));
const wgStoiska = (b) => ({ ...b, exhibitors: lista(b).map(bezNowychPol).sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y))) });
const idKarty = (x) => x.exhibitorId || x.exhibitor_id;

(async () => {
  const idDrugiego = String(PRZESUNIECIE + Number(STOISKO));
  for (const kind of ['feed.json', 'exhibitors.json', 'exhibitors']) {
    const [n, s] = [await get(NOWY, `/public/exhibitions/${EV}/${kind}`), await get(STARY, `/public/exhibitions/${EV}/${kind}`)];
    const ln = lista(n.body), ls = lista(s.body);
    ok(ln.length === ls.length, `${kind}: tyle samo pozycji (${ln.length})`);
    ok(new Set(ln.map(idKarty)).size === ln.length, `${kind}: exhibitorId unikalny`);
    const firmy = ln.filter((x) => (x.accountId || x.account_id) === String(WYSTAWCA));
    ok(firmy.length === 2 && firmy.some((x) => idKarty(x) === String(WYSTAWCA)) && firmy.some((x) => idKarty(x) === idDrugiego),
      `${kind}: firma ${WYSTAWCA} ma karty ${WYSTAWCA} i ${idDrugiego}`);
    const inne = (l) => lista(wgStoiska({ exhibitors: l.filter((x) => (x.accountId || x.account_id || idKarty(x)) !== String(WYSTAWCA)) }));
    ok(JSON.stringify(inne(ln)) === JSON.stringify(inne(ls)), `${kind}: pozostałe firmy bez zmian względem starej wersji`);
    if (kind === 'exhibitors.json') {
      const drugie = ln.find((x) => idKarty(x) === idDrugiego), pierwsze = ln.find((x) => idKarty(x) === String(WYSTAWCA));
      ok(drugie.people.length === 1 && drugie.people[0].full_name === 'Osoba Drugie Stoisko', `${kind}: drugie stoisko ma tylko swoją osobę`);
      ok(!pierwsze.people.some((p) => p.full_name === 'Osoba Drugie Stoisko'), `${kind}: pierwsze stoisko nie pokazuje osoby drugiego`);
    }
  }

  const d2 = (await get(NOWY, `/public/exhibitions/${EV}/exhibitors/${idDrugiego}.json`)).body;
  ok(d2.exhibitorId === idDrugiego && d2.accountId === String(WYSTAWCA), 'karta drugiego stoiska: identyfikatory');
  ok(d2.companyInfo.description === 'OPIS DRUGIEGO STOISKA' && d2.stand.standNumber === 'F9.99', 'karta drugiego stoiska: własny opis i numer stoiska');
  ok(d2.people.length === 1 && d2.people[0].full_name === 'Osoba Drugie Stoisko', 'karta drugiego stoiska: tylko jej osoby');

  const [d1n, d1s] = [(await get(NOWY, `/public/exhibitions/${EV}/exhibitors/${WYSTAWCA}.json`)).body, (await get(STARY, `/public/exhibitions/${EV}/exhibitors/${WYSTAWCA}.json`)).body];
  ok(d1n.stand.standId !== String(STOISKO) && d1n.companyInfo.description !== 'OPIS DRUGIEGO STOISKA', 'karta pierwszego stoiska: dane pierwszego');
  ok(!d1n.people.some((p) => p.full_name === 'Osoba Drugie Stoisko'), 'karta pierwszego stoiska: bez osoby drugiego');
  ok(JSON.stringify(bezNowychPol(d1n)) === JSON.stringify(bezNowychPol({ ...d1s, people: d1s.people.filter((p) => p.full_name !== 'Osoba Drugie Stoisko') })), 'karta pierwszego stoiska: poza tym jak wcześniej');
  ok((await get(NOWY, `/public/exhibitions/${EV}/exhibitors/${PRZESUNIECIE + 1}.json`)).status === 404, 'nieistniejące stoisko: 404');

  const rss = (await get(NOWY, `/public/exhibitions/${EV}/exhibitors/${idDrugiego}.rss`)).body;
  ok(typeof rss === 'string' && rss.includes('OPIS DRUGIEGO STOISKA') && rss.includes(`exhibitors/${idDrugiego}.json`), 'RSS drugiego stoiska');
  const index = (await get(NOWY, '/public')).body;
  ok(index.includes(`exhibitors/${idDrugiego}.json`), 'strona indeksu linkuje kartę drugiego stoiska');

  for (const ev of REGRESJA) {
    for (const kind of ['feed.json', 'exhibitors.json', 'exhibitors']) {
      const [n, s] = [await get(NOWY, `/public/exhibitions/${ev}/${kind}`), await get(STARY, `/public/exhibitions/${ev}/${kind}`)];
      ok(JSON.stringify(bezNowychPol(wgStoiska(n.body))) === JSON.stringify(bezNowychPol(wgStoiska(s.body))), `regresja ${ev} ${kind}: identycznie (${lista(n.body).length} pozycji)`);
    }
  }
  console.log(bledy ? `\n❌ Błędów: ${bledy}` : '\n✅ Wszystkie testy przeszły');
  process.exit(bledy ? 1 : 0);
})();
