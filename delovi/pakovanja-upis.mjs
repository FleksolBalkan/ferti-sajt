// Jednokratno: istaknuta pakovanja (POLYFERT 11-37 kanister 14 kg, TRI 42N = UAN 32 kanister 20 l) na strani Proizvodi, SR/HU/RO.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const koren = join(dirname(fileURLToPath(import.meta.url)), '..');

const T = {
  sr: {
    poly: '<p class="napomena"><strong>Pakovanje:</strong> kanister od 14 kg (10 l) — u njemu je 1,5 kg N i 5,2 kg P₂O₅; za veće količine IBC kontejner 1000 l.</p>',
    th: 'UAN 32 <small>(TRI 42N, kanister 20 l)</small>',
    alt: 'Kanisteri POLYFERT 11-37 od 14 kg i TRI 42N (UAN 32) od 20 l',
    cap: 'Pakovanja za manja gazdinstva i probu na jednoj parceli: POLYFERT 11-37 u kanisteru od 14 kg i TRI 42N (UAN 32) u kanisteru od 20 l.',
    ozn: 'Pakovanja', h: 'Istaknuta pakovanja',
    li: [
      '<strong>TRI 42N</strong> — UAN 32 u kanisteru od 20 l (≈ 26 kg, 8,4 kg N). Tri forme azota, jedan snažan porast — Ferti Grow tehnologija. Za prihranu manjih parcela, povrća, voća i vinograda kroz zalivni sistem.',
      '<strong>POLYFERT 11-37</strong> — kanister od 14 kg (10 l), dovoljan za oko 0,5 ha starta uz seme (20–25 l/ha). U njemu je 1,5 kg N i 5,2 kg P₂O₅.',
      '<strong>Veće količine</strong> — IBC kontejner od 1000 l i cisterna na vašu adresu; za skladištenje fleksibilni rezervoari na strani <a href="oprema.html">Oprema i alati</a>.',
    ],
    cta: 'Zatražite ponudu',
  },
  hu: {
    poly: '<p class="napomena"><strong>Csomagolás:</strong> 14 kg-os (10 l) kanna — benne 1,5 kg N és 5,2 kg P₂O₅; nagyobb mennyiséghez 1000 l-es IBC-tartály.</p>',
    th: 'UAN 32 <small>(TRI 42N, 20 l-es kanna)</small>',
    alt: '14 kg-os POLYFERT 11-37 és 20 l-es TRI 42N (UAN 32) kannák',
    cap: 'Csomagolások kisebb gazdaságoknak és egy táblán való próbához: POLYFERT 11-37 14 kg-os kannában és TRI 42N (UAN 32) 20 l-es kannában.',
    ozn: 'Csomagolások', h: 'Kiemelt csomagolások',
    li: [
      '<strong>TRI 42N</strong> — UAN 32 20 l-es kannában (≈ 26 kg, 8,4 kg N). Három nitrogénforma, egy erőteljes növekedés — Ferti Grow technológia. Kisebb táblák, zöldség, gyümölcs és szőlő fejtrágyázásához öntözőrendszeren át.',
        '<strong>POLYFERT 11-37</strong> — 14 kg-os (10 l) kanna, kb. 0,5 ha vetéssel egy menetben végzett starttrágyázásához elegendő (20–25 l/ha). Benne 1,5 kg N és 5,2 kg P₂O₅.',
      '<strong>Nagyobb mennyiségek</strong> — 1000 l-es IBC-tartály és tartálykocsi az Ön címére; tároláshoz rugalmas tartályok a <a href="oprema.html">Felszerelés és eszközök</a> oldalon.',
    ],
    cta: 'Kérjen ajánlatot',
  },
  ro: {
    poly: '<p class="napomena"><strong>Ambalaj:</strong> canistră de 14 kg (10 l) — conține 1,5 kg N și 5,2 kg P₂O₅; pentru cantități mai mari, container IBC de 1000 l.</p>',
    th: 'UAN 32 <small>(TRI 42N, canistră 20 l)</small>',
    alt: 'Canistre POLYFERT 11-37 de 14 kg și TRI 42N (UAN 32) de 20 l',
    cap: 'Ambalaje pentru fermele mai mici și pentru o probă pe o singură parcelă: POLYFERT 11-37 în canistră de 14 kg și TRI 42N (UAN 32) în canistră de 20 l.',
    ozn: 'Ambalaje', h: 'Ambalaje recomandate',
    li: [
      '<strong>TRI 42N</strong> — UAN 32 în canistră de 20 l (≈ 26 kg, 8,4 kg N). Trei forme de azot, o singură creștere viguroasă — tehnologia Ferti Grow. Pentru fertilizarea parcelelor mici, a legumelor, pomilor și viței-de-vie prin sistemul de irigare.',
      '<strong>POLYFERT 11-37</strong> — canistră de 14 kg (10 l), suficientă pentru circa 0,5 ha de fertilizare la start odată cu semănatul (20–25 l/ha). Conține 1,5 kg N și 5,2 kg P₂O₅.',
      '<strong>Cantități mai mari</strong> — container IBC de 1000 l și cisternă la adresa dumneavoastră; pentru depozitare, rezervoare flexibile pe pagina <a href="oprema.html">Echipamente și unelte</a>.',
    ],
    cta: 'Solicitați o ofertă',
  },
};

for (const j of Object.keys(T)) {
  const t = T[j], put = join(koren, 'strane', j, 'proizvodi.html');
  let s = readFileSync(put, 'utf8');
  if (s.includes('id="pakovanja"')) { console.log(j + ': već upisano'); continue; }
  // 1) POLYFERT pakovanje — pre Ferti-start sekcije
  const a = s.indexOf('<section class="ferti-start"');
  if (a < 0) throw new Error(j + ': nema ferti-start');
  s = s.slice(0, a) + t.poly + '\n        ' + s.slice(a);
  // 2) red UAN 32 u tabeli
  s = s.replace('<th scope="row">UAN 32</th>', `<th scope="row">${t.th}</th>`);
  // 3) blok sa fotografijom posle dve kolone u sekciji #tecna
  const k = s.indexOf('id="klasicna"');
  const z = s.lastIndexOf('  </div>\n</section>', k);
  if (k < 0 || z < 0) throw new Error(j + ': nema kraja sekcije tecna');
  const blok = `    <div class="pakovanja" id="pakovanja">
      <figure class="ilustracija pakovanja__foto">
        <img src="{{KOREN}}img/pakovanja-kanisteri.jpg" alt="${t.alt}" width="1200" height="800" loading="lazy">
        <figcaption>${t.cap}</figcaption>
      </figure>
      <div>
        <span class="oznaka">${t.ozn}</span>
        <h3>${t.h}</h3>
        <ul class="spisak-kvacica">
${t.li.map(x => '          <li>' + x + '</li>').join('\n')}
        </ul>
        <div class="dugmad"><a class="dugme" href="kontakt.html" data-otvori-chat>${t.cta}</a></div>
      </div>
    </div>
`;
  s = s.slice(0, z) + blok + s.slice(z);
  writeFileSync(put, s);
  console.log(j + ': upisano');
}
