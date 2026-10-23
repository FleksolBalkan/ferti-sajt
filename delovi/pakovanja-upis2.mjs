// Jednokratno: svaki proizvod u svom delu, sa pravom fotografijom ambalaže i dugmetom „Poruči”.
// Uklanja zajednički blok .pakovanja, POLYFERT dobija foto + karticu pakovanja, UAN deo dobija karticu TRI 42N; početna: foto umesto nacrtanog kanistera.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const koren = join(dirname(fileURLToPath(import.meta.url)), '..');

const T = {
  sr: {
    polyAlt: 'Kanister POLYFERT 11-37 od 14 kg', triAlt: 'Kanister TRI 42N (UAN 32) od 20 l',
    poruci: 'Poruči', pak: 'Pakovanje', vece: 'Veće količine',
    polyPak: 'kanister 14 kg (10 l)', polyInfo: 'U kanisteru je 1,5 kg N i 5,2 kg P₂O₅ — dovoljno za oko 0,5 ha starta uz seme (20–25 l/ha).',
    polyVece: 'IBC kontejner 1000 l.',
    triOzn: 'UAN 32 u kanisteru', triH: 'TRI 42N', triUvod: 'Tečno azotno đubrivo UAN 32 u kanisteru od 20 l — tri forme azota, jedan snažan porast. Ferti Grow tehnologija.',
    triPak: 'kanister 20 l (≈ 26 kg, 8,4 kg N)', triInfo: 'Za prihranu manjih parcela, za povrće, voće i vinograde kroz zalivni sistem, i za probu pre prelaska na cisternu.',
    triVece: 'IBC kontejner 1000 l i cisterna na vašu adresu (oko 24 t); za skladištenje fleksibilni rezervoari — <a href="oprema.html">Oprema i alati</a>.',
  },
  hu: {
    polyAlt: '14 kg-os POLYFERT 11-37 kanna', triAlt: '20 l-es TRI 42N (UAN 32) kanna',
    poruci: 'Rendelés', pak: 'Csomagolás', vece: 'Nagyobb mennyiség',
    polyPak: '14 kg-os (10 l) kanna', polyInfo: 'A kannában 1,5 kg N és 5,2 kg P₂O₅ van — kb. 0,5 ha vetéssel egy menetben végzett starttrágyázásához elegendő (20–25 l/ha).',
    polyVece: '1000 l-es IBC-tartály.',
    triOzn: 'UAN 32 kannában', triH: 'TRI 42N', triUvod: 'UAN 32 folyékony nitrogénműtrágya 20 l-es kannában — három nitrogénforma, egy erőteljes növekedés. Ferti Grow technológia.',
    triPak: '20 l-es kanna (≈ 26 kg, 8,4 kg N)', triInfo: 'Kisebb táblák fejtrágyázásához, zöldséghez, gyümölcshöz és szőlőhöz öntözőrendszeren át, valamint próbához a tartálykocsira való átállás előtt.',
    triVece: '1000 l-es IBC-tartály és tartálykocsi az Ön címére (kb. 24 t); tároláshoz rugalmas tartályok — <a href="oprema.html">Felszerelés és eszközök</a>.',
  },
  ro: {
    polyAlt: 'Canistră POLYFERT 11-37 de 14 kg', triAlt: 'Canistră TRI 42N (UAN 32) de 20 l',
    poruci: 'Comandă', pak: 'Ambalaj', vece: 'Cantități mai mari',
    polyPak: 'canistră de 14 kg (10 l)', polyInfo: 'Canistra conține 1,5 kg N și 5,2 kg P₂O₅ — suficient pentru circa 0,5 ha de fertilizare la start odată cu semănatul (20–25 l/ha).',
    polyVece: 'container IBC de 1000 l.',
    triOzn: 'UAN 32 în canistră', triH: 'TRI 42N', triUvod: 'Îngrășământ lichid cu azot UAN 32 în canistră de 20 l — trei forme de azot, o singură creștere viguroasă. Tehnologia Ferti Grow.',
    triPak: 'canistră de 20 l (≈ 26 kg, 8,4 kg N)', triInfo: 'Pentru fertilizarea parcelelor mici, pentru legume, pomi și viță-de-vie prin sistemul de irigare și pentru o probă înainte de trecerea la cisternă.',
    triVece: 'container IBC de 1000 l și cisternă la adresa dumneavoastră (circa 24 t); pentru depozitare, rezervoare flexibile — <a href="oprema.html">Echipamente și unelte</a>.',
  },
};

const kartica = (t, pak, info, vece) => `<div class="poruci">
          <div class="poruci__tekst"><p><strong>${t.pak}:</strong> ${pak}</p><p class="napomena">${info}</p><p class="napomena"><strong>${t.vece}:</strong> ${vece}</p></div>
          <a class="dugme" href="kontakt.html" data-otvori-chat>${t.poruci}</a>
        </div>`;

for (const j of Object.keys(T)) {
  const t = T[j];
  // ── proizvodi.html
  let put = join(koren, 'strane', j, 'proizvodi.html');
  let s = readFileSync(put, 'utf8');
  // 1) ukloni zajednički blok
  s = s.replace(/    <div class="pakovanja" id="pakovanja">[\s\S]*?\n    <\/div>\n(?=  <\/div>\n<\/section>)/, '');
  if (s.includes('id="pakovanja"')) throw new Error(j + ': zajednički blok nije uklonjen');
  // 2) POLYFERT: prava fotografija umesto nacrtanog kanistera
  s = s.replace(/<div class="detalj__slika" aria-hidden="true">\n\s*<div class="kanister">[\s\S]*?<\/div>\n\s*<\/div>/,
    `<div class="detalj__slika detalj__slika--foto"><img src="{{KOREN}}img/polyfert-kanister.jpg" alt="${t.polyAlt}" width="480" height="800" loading="lazy"></div>`);
  if (!s.includes('polyfert-kanister.jpg')) throw new Error(j + ': POLYFERT slika nije zamenjena');
  // 3) POLYFERT: napomena o pakovanju → kartica sa dugmetom
  s = s.replace(/<p class="napomena"><strong>[^<]*<\/strong>[^\n]*(?:kanist|kanna|canist)[^\n]*IBC[^\n]*<\/p>\n(\s*)(?=<section class="ferti-start")/,
    (m, ind) => kartica(t, t.polyPak, t.polyInfo, t.polyVece) + '\n' + ind);
  if (!s.includes('class="poruci"')) throw new Error(j + ': POLYFERT kartica nije upisana');
  // 4) UAN deo: kartica TRI 42N posle dve kolone
  const k = s.indexOf('id="klasicna"');
  const z = s.lastIndexOf('  </div>\n</section>', k);
  const tri = `    <div class="detalj detalj--uan" id="tri-42n">
      <div class="detalj__slika detalj__slika--foto"><img src="{{KOREN}}img/tri42n-kanister.jpg" alt="${t.triAlt}" width="480" height="800" loading="lazy"></div>
      <div class="detalj__tekst">
        <span class="oznaka">${t.triOzn}</span>
        <h3>${t.triH}</h3>
        <p>${t.triUvod}</p>
        ${kartica(t, t.triPak, t.triInfo, t.triVece)}
      </div>
    </div>
`;
  if (!s.includes('id="tri-42n"')) s = s.slice(0, z) + tri + s.slice(z);
  s = s.replace(/<th scope="row">UAN 32 <small>[^<]*<\/small><\/th>/, '<th scope="row"><a href="#tri-42n">UAN 32</a></th>');
  writeFileSync(put, s);
  // ── index.html: foto umesto nacrtanog kanistera
  put = join(koren, 'strane', j, 'index.html');
  s = readFileSync(put, 'utf8');
  s = s.replace(/<div class="proizvod__slika" aria-hidden="true">\n\s*<div class="kanister">[\s\S]*?<\/div>\n\s*<\/div>/,
    `<div class="proizvod__slika proizvod__slika--foto"><img src="{{KOREN}}img/polyfert-kanister.jpg" alt="" width="480" height="800" loading="lazy"></div>`);
  if (!s.includes('polyfert-kanister.jpg')) throw new Error(j + ': početna — slika nije zamenjena');
  writeFileSync(put, s);
  console.log(j + ': gotovo');
}
