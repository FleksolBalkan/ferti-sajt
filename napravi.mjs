// Sklapa sajt na više jezika: strane/<jezik>/*.html + delovi/osnova.html + delovi/jezici.json -> docs/
//   srpski -> docs/, mađarski -> docs/hu/, rumunski -> docs/ro/ (folder iz jezici.json)
// Pokretanje:  node napravi.mjs
// Svaka strana počinje komentarom sa podacima:  <!--{"naslov":"…","opis":"…"}-->
//   neobavezno: "dodatno" (HTML u <head>, npr. JSON-LD), "noindex": true
// U osnova.html: {{T:kljuc}} = tekst iz jezici.json, {{KOREN}} = put do korena sajta ('' ili '../').
// docs/ se pri svakom pokretanju pravi iznova — ne menjati ga ručno. Fajlovi koji moraju u koren objave
// (robots.txt, verifikacija za Google…) idu u staticno/; docs/CNAME (domen na GitHub Pages) se čuva sam.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, renameSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Adresa sajta kad dobije domen (npr. 'https://www.fertishop.rs/'). Dok je prazna, nema canonical/og:url/og:image/hreflang.
const ADRESA_SAJTA = process.env.ADRESA_SAJTA || '';
// Koren sajta na hostingu — za stranu 404, koja se prikazuje na bilo kojoj dubini adrese.
// '/' za sopstveni domen ili Render; '/ime-repoa/' za GitHub Pages projektnu stranu bez domena.
const BAZA = process.env.BAZA || '/';

const koren = dirname(fileURLToPath(import.meta.url));
const izlaz = join(koren, 'docs');
const novo = join(koren, 'docs.novo');
const osnova = readFileSync(join(koren, 'delovi', 'osnova.html'), 'utf8');
const jezici = JSON.parse(readFileSync(join(koren, 'delovi', 'jezici.json'), 'utf8'));
const godina = String(new Date().getFullYear());
const GLAVNI = 'sr';

const escAtr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const putDo = (j, ime) => (jezici[j].folder ? jezici[j].folder + '/' : '') + ime;   // od korena sajta

// 1) pročitaj i proveri sve strane svih jezika pre nego što se išta dira
const strane = {};
for (const j of Object.keys(jezici)) {
  const dir = join(koren, 'strane', j);
  if (!existsSync(dir)) { if (j === GLAVNI) throw new Error(`nema foldera strane/${j}`); strane[j] = []; continue; }
  strane[j] = readdirSync(dir).filter(f => f.endsWith('.html')).map(ime => {
    const sirovo = readFileSync(join(dir, ime), 'utf8');
    const m = sirovo.match(/^\s*<!--(\{[\s\S]*?\})-->\s*/);
    if (!m) throw new Error(`${j}/${ime}: nema zaglavlja <!--{"naslov":…}-->`);
    let podaci;
    try { podaci = JSON.parse(m[1]); } catch (e) { throw new Error(`${j}/${ime}: neispravan JSON u zaglavlju — ${e.message}`); }
    if (typeof podaci.naslov !== 'string' || !podaci.naslov.trim()) throw new Error(`${j}/${ime}: nedostaje "naslov"`);
    if (typeof podaci.opis !== 'string' || !podaci.opis.trim()) throw new Error(`${j}/${ime}: nedostaje "opis"`);
    return { ime, podaci, sadrzaj: sirovo.slice(m[0].length) };
  });
}
const ima = (j, ime) => strane[j].some(s => s.ime === ime);

// ── Naslovna kompozicija: fotografija + zeleni talas + okrugla slika + šestougaone ikone (delovi/naslovne.json).
// Tekst (naslov, uvod, mrvice, dugmad) ostaje u strani — uzima se iz postojeće sekcije .hero ili .traka-strane.
const naslovne = JSON.parse(readFileSync(join(koren, 'delovi', 'naslovne.json'), 'utf8'));
const SIMBOL = {
  kap: '<path d="M30 13s-8 9-8 15a8 8 0 0 0 16 0c0-6-8-15-8-15z" fill="none" stroke="#fff" stroke-width="2.2"/>',
  list: '<path d="M21 34c0-11 7-18 19-19-1 12-8 19-19 19zM21 34l10-10" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  dron: '<g fill="none" stroke="#fff" stroke-width="2"><rect x="26" y="23" width="8" height="6" rx="1.5"/><path d="M26 24l-6-4M34 24l6-4M26 28l-6 4M34 28l6 4"/><ellipse cx="19" cy="19" rx="5" ry="1.6"/><ellipse cx="41" cy="19" rx="5" ry="1.6"/><ellipse cx="19" cy="33" rx="5" ry="1.6"/><ellipse cx="41" cy="33" rx="5" ry="1.6"/></g>',
  senzor: '<g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M20 22a14 14 0 0 1 20 0M23.5 26a9 9 0 0 1 13 0M27 30a4 4 0 0 1 6 0"/><circle cx="30" cy="34" r="1.6" fill="#fff"/></g>',
  kamion: '<g fill="none" stroke="#fff" stroke-width="2"><path d="M16 20h17v12H16zM33 24h6l4 4v4H33"/><circle cx="21" cy="34" r="2.5"/><circle cx="38" cy="34" r="2.5"/></g>',
};
function ikona(n) {
  const unutra = SIMBOL[n] || `<text x="30" y="32" text-anchor="middle" font-size="17" font-weight="800" fill="#fff" font-family="Arial,sans-serif">${n}</text>`;
  return `<svg viewBox="0 0 60 52" aria-hidden="true" focusable="false"><path d="M15 1h30l14 25-14 25H15L1 26z" fill="rgba(20,48,31,.35)" stroke="#fff" stroke-width="1.6"/>${unutra}</svg>`;
}
function slikaIliMesto(klasa, put, opis, KOREN, pozicija) {
  if (put) return `<div class="${klasa}" style="background-image:url('${KOREN}${put}')${pozicija ? ';background-position:' + pozicija : ''}" aria-hidden="true"></div>`;
  return `<div class="${klasa} mesto-za-sliku" aria-hidden="true"><span>📷 Fotografija: ${escAtr(opis || '—')}</span></div>`;
}
function naslovna(ime, sadrzaj, KOREN) {
  const c = naslovne[ime];
  if (!c) return sadrzaj;
  let tekst = null, labela = '';
  const mHero = sadrzaj.match(/<section class="hero"[^>]*>\s*<div class="okvir">\s*<div class="hero__sadrzaj">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/);
  const mTraka = sadrzaj.match(/<section class="traka-strane">\s*<div class="okvir">([\s\S]*?)<\/div>\s*<\/section>/);
  const m = mHero || mTraka;
  if (!m) return sadrzaj;
  tekst = m[1];
  const h1 = tekst.match(/<h1[^>]*id="([^"]+)"/);
  if (h1) labela = ` aria-labelledby="${h1[1]}"`;
  const ikone = (c.ikone || []).length ? `<div class="naslovna__ikone" aria-hidden="true">${c.ikone.map(ikona).join('')}</div>` : '';
  const blok = `<section class="naslovna${c.pocetna ? ' naslovna--pocetna' : ''}"${labela}>
  ${slikaIliMesto('naslovna__foto', c.slika, c.slikaOpis, KOREN, c.pozicija)}
  ${ikone}
  <div class="naslovna__telo">
    <svg class="naslovna__talas" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 140V70C240 10 520 0 760 40s520 70 680 10v90z" fill="#c9cc3f"/>
      <path d="M0 140V88C250 30 520 22 760 60s520 64 680 6v74z" fill="#2f6b2a"/>
    </svg>
    ${c.krug !== undefined && (c.krug || c.krugOpis) ? slikaIliMesto('naslovna__krug', c.krug, c.krugOpis, KOREN) : ''}
    <div class="okvir naslovna__tekst">${tekst}</div>
    <svg class="naslovna__dno" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 60V40C300 0 600 0 900 26s400 30 540 0v34z" fill="#c9cc3f"/></svg>
  </div>
</section>`;
  return sadrzaj.replace(m[0], () => blok);
}

// 2) sklopi u privremeni folder
rmSync(novo, { recursive: true, force: true });
mkdirSync(novo, { recursive: true });
cpSync(join(koren, 'staticno'), novo, { recursive: true });

let ukupno = 0;
for (const j of Object.keys(jezici)) {
  const J = jezici[j];
  const KOREN = J.folder ? '../' : '';
  const dirIzlaz = J.folder ? join(novo, J.folder) : novo;
  mkdirSync(dirIzlaz, { recursive: true });

  for (const { ime, podaci, sadrzaj } of strane[j]) {
    if (ime === '404.html' && j !== GLAVNI) continue;
    // birač jezika: ista strana na drugom jeziku (ili njegova početna ako prevod te strane ne postoji)
    const veze = Object.keys(jezici).filter(k => strane[k].length).map(k => {
      const cilj = ima(k, ime) ? ime : 'index.html';
      const href = KOREN + putDo(k, cilj);
      const tren = k === j ? ' aria-current="true"' : '';
      return `<a href="${href}" lang="${jezici[k].lang}" hreflang="${jezici[k].lang}"${tren}><span aria-hidden="true">${jezici[k].kod}</span><span class="vidljivo-citacu">${jezici[k].naziv}</span></a>`;
    }).join('');
    const izborJezika = `<nav class="jezici" aria-label="${escAtr(J.t.jezik)}">${veze}</nav>`;

    const url = ADRESA_SAJTA ? ADRESA_SAJTA + putDo(j, ime === 'index.html' ? '' : ime) : '';
    let meta = '';
    if (url && !podaci.noindex) {
      meta = `<link rel="canonical" href="${escAtr(url)}">\n<meta property="og:url" content="${escAtr(url)}">\n` +
        `<meta property="og:image" content="${escAtr(ADRESA_SAJTA)}img/og.png">\n<meta property="og:image:width" content="1200">\n` +
        `<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n` +
        Object.keys(jezici).filter(k => ima(k, ime)).map(k =>
          `<link rel="alternate" hreflang="${jezici[k].lang}" href="${escAtr(ADRESA_SAJTA + putDo(k, ime === 'index.html' ? '' : ime))}">`).join('\n') +
        (ima(GLAVNI, ime) ? `\n<link rel="alternate" hreflang="x-default" href="${escAtr(ADRESA_SAJTA + putDo(GLAVNI, ime === 'index.html' ? '' : ime))}">` : '');
    }

    // funkcije kao zamena: znak $ u tekstu se ne tumači kao poseban obrazac
    let html = osnova
      .replace(/\{\{T:([a-z_]+)\}\}/g, (_, k) => {
        const v = J.t[k] ?? jezici[GLAVNI].t[k];
        if (v == null) throw new Error(`jezici.json: nema teksta "${k}"`);
        return escAtr(v);
      })
      .replaceAll('{{NASLOV}}', () => escAtr(podaci.naslov))
      .replaceAll('{{OPIS}}', () => escAtr(podaci.opis))
      .replaceAll('{{LANG}}', () => J.lang)
      .replaceAll('{{JEZIK}}', () => j)
      .replaceAll('{{OG_LOCALE}}', () => J.og)
      .replaceAll('{{KOREN}}', () => KOREN)
      .replaceAll('{{GODINA}}', () => godina)
      .replace('{{JEZICI}}', () => izborJezika)
      .replace('{{DODATNO_ZAGLAVLJE}}', () => [meta, podaci.dodatno || ''].filter(Boolean).join('\n'))
      .replace('{{SADRZAJ}}', () => naslovna(ime, sadrzaj, KOREN).replaceAll('{{KOREN}}', KOREN));
    // stavka menija za ovu stranu dobija aria-current
    html = html.split(`<a class="meni-veza" href="${ime}"`).join(`<a class="meni-veza" href="${ime}" aria-current="page"`);
    if (podaci.noindex) html = html.replace('</title>', '</title>\n<meta name="robots" content="noindex">');
    // 404 se servira na bilo kojoj dubini adrese — relativne putanje vode od korena sajta
    if (ime === '404.html') {
      html = html.replace(/(\s(?:href|src))="(?![a-z][a-z0-9+.-]*:|#|\/)([^"]*)"/gi, (_, a, u) => `${a}="${BAZA}${u}"`);
    }
    const ostalo = html.match(/\{\{[A-Z_]+(?::[a-z_]+)?\}\}/);
    if (ostalo) throw new Error(`${j}/${ime}: ostao nezamenjen ${ostalo[0]}`);

    writeFileSync(join(dirIzlaz, ime), html);
    ukupno++;
  }
  console.log(`✓ ${j}: ${strane[j].length} strana`);
}
writeFileSync(join(novo, '.nojekyll'), '');
if (existsSync(join(izlaz, 'CNAME')) && !existsSync(join(novo, 'CNAME'))) cpSync(join(izlaz, 'CNAME'), join(novo, 'CNAME'));

// 3) tek kad je sve sklopljeno, zameni docs/
rmSync(izlaz, { recursive: true, force: true });
renameSync(novo, izlaz);
console.log(`Gotovo: ${ukupno} strana u docs/` + (ADRESA_SAJTA ? ` (adresa ${ADRESA_SAJTA})` : ''));
