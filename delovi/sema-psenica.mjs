// Shema prihrane ozime pšenice UAN-om — „3D” SVG sa biljkama po fenofazama (BBCH), normama u l/ha i preračunom u kg.
// Pokretanje:  node delovi/sema-psenica.mjs   → upisuje SVG u strane/{sr,hu,ro}/primena.html umesto <!--SEMA-PSENICA-->…<!--/SEMA-PSENICA-->
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const koren = join(dirname(fileURLToPath(import.meta.url)), '..');
const N_PO_L = 0.39;   // kg N u 1 l UAN N30 (gustina 1,3 kg/l × 30 %)
const KG_PO_L = 1.3;   // kg đubriva u 1 l

const JEZICI = {
  sr: {
    naslov: 'Raspored prihrana ozime pšenice UAN-om N30',
    faze: ['Nicanje', 'Izdanak', 'Bokorenje', 'Bokorenje', '1. kolence', '2. kolence', '3. kolence', 'List zastavičar', '', 'Klasanje', 'Cvetanje', '', 'Nalivanje zrna', 'Zrelost'],
    bbch: 'BBCH skala',
    doze: [
      { naslov: 'Nulta prihrana', pod: 'pre setve · čist UAN 1 : 0' },
      { naslov: '1. prihrana', pod: 'bokorenje · čist UAN' },
      { naslov: '2. prihrana', pod: 'vlatanje · UAN + voda 1 : 2 – 1 : 4' },
      { naslov: '3. prihrana', pod: 'cvetanje · UAN + voda 1 : 3 – 1 : 4' },
    ],
    lha: 'l/ha', kgN: 'kg N/ha', kg: 'kg UAN/ha',
    legenda: '1 l UAN N30 = 1,3 kg = 0,39 kg N',
  },
  hu: {
    naslov: 'Az őszi búza UAN N30 fejtrágyázásának ütemezése',
    faze: ['Kelés', 'Hajtás', 'Bokrosodás', 'Bokrosodás', '1. nódusz', '2. nódusz', '3. nódusz', 'Zászlós levél', '', 'Kalászolás', 'Virágzás', '', 'Szemtelítődés', 'Érés'],
    bbch: 'BBCH-skála',
    doze: [
      { naslov: 'Nulladik fejtrágya', pod: 'vetés előtt · tiszta UAN 1 : 0' },
      { naslov: '1. fejtrágya', pod: 'bokrosodás · tiszta UAN' },
      { naslov: '2. fejtrágya', pod: 'szárba indulás · UAN + víz 1 : 2 – 1 : 4' },
      { naslov: '3. fejtrágya', pod: 'virágzás · UAN + víz 1 : 3 – 1 : 4' },
    ],
    lha: 'l/ha', kgN: 'kg N/ha', kg: 'kg UAN/ha',
    legenda: '1 l UAN N30 = 1,3 kg = 0,39 kg N',
  },
  ro: {
    naslov: 'Calendarul fertilizărilor grâului de toamnă cu UAN N30',
    faze: ['Răsărire', 'Lăstar', 'Înfrățire', 'Înfrățire', 'Nod 1', 'Nod 2', 'Nod 3', 'Frunza stindard', '', 'Înspicare', 'Înflorire', '', 'Umplerea bobului', 'Maturitate'],
    bbch: 'Scara BBCH',
    doze: [
      { naslov: 'Fertilizare zero', pod: 'înainte de semănat · UAN pur 1 : 0' },
      { naslov: 'Fertilizarea 1', pod: 'înfrățire · UAN pur' },
      { naslov: 'Fertilizarea 2', pod: 'împăiere · UAN + apă 1 : 2 – 1 : 4' },
      { naslov: 'Fertilizarea 3', pod: 'înflorire · UAN + apă 1 : 3 – 1 : 4' },
    ],
    lha: 'l/ha', kgN: 'kg N/ha', kg: 'kg UAN/ha',
    legenda: '1 l UAN N30 = 1,3 kg = 0,39 kg N',
  },
};

// fenofaze: BBCH, visina (px), tip (klica | bokor | stablo | klas | zreo)
const FAZE = [
  { b: '0', h: 16, t: 'klica' }, { b: '10', h: 34, t: 'klica' },
  { b: '21', h: 50, t: 'bokor' }, { b: '30', h: 64, t: 'bokor' },
  { b: '31', h: 96, t: 'stablo' }, { b: '32', h: 126, t: 'stablo' }, { b: '33', h: 156, t: 'stablo' },
  { b: '37', h: 184, t: 'stablo' }, { b: '39', h: 204, t: 'stablo' },
  { b: '50–59', h: 226, t: 'klas' }, { b: '60', h: 236, t: 'klas' }, { b: '69', h: 240, t: 'klas' },
  { b: '71–77', h: 240, t: 'zlat' }, { b: '78–99', h: 234, t: 'zreo' },
];
// doze: raspon faza (indeksi), litri, visina kartice
const DOZE = [
  { od: 0, do: 1, l: [80, 100], y: 300, boja: '#8a6a45' },
  { od: 2, do: 3, l: [150, 200], y: 226, boja: '#37752c' },
  { od: 4, do: 8, l: [100, 120], y: 122, boja: '#557f2a' },
  { od: 9, do: 11, l: [10, 50], y: 56, boja: '#7d8020' },
];

const W = 1200, TLO = 436, X0 = 70, KORAK = 80;
const x = i => X0 + i * KORAK;
const z = n => String(Math.round(n)).replace('.', ',');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function biljka(i, f) {
  const cx = x(i), h = f.h, zel = f.t === 'zreo' ? '#c9a93c' : f.t === 'zlat' ? '#9aa23a' : '#3f8a2c';
  const svet = f.t === 'zreo' ? '#e6cc6a' : f.t === 'zlat' ? '#c7cf5a' : '#79c25a';
  const tam = f.t === 'zreo' ? '#9c7f22' : f.t === 'zlat' ? '#6f7a22' : '#2d6a1f';
  let s = `<ellipse cx="${cx}" cy="${TLO + 2}" rx="${10 + h / 10}" ry="4" fill="#000" opacity=".18"/>`;
  // list kao ispunjena oštrica (dve kubne krive) sa senčenom i svetlom stranom + nerv
  const list = (bx, by, dx, dy, w) => {
    const d = Math.hypot(dx, dy), nx = -dy / d, ny = dx / d, tx = bx + dx, ty = by + dy;
    const c1 = [bx + dx * .25 + nx * w, by + dy * .25 + ny * w], c2 = [bx + dx * .7 + nx * w * .9, by + dy * .7 + ny * w * .9];
    const c3 = [bx + dx * .7 - nx * w * .9, by + dy * .7 - ny * w * .9], c4 = [bx + dx * .25 - nx * w, by + dy * .25 - ny * w];
    const r = v => v.map(n => n.toFixed(1)).join(" ");
    return `<path d="M${bx} ${by} C${r(c1)} ${r(c2)} ${tx.toFixed(1)} ${ty.toFixed(1)} C${r(c3)} ${r(c4)} ${bx} ${by}z" fill="${svet}" stroke="${tam}" stroke-width="1.2" stroke-linejoin="round"/><path d="M${bx} ${by} C${r(c1)} ${r(c2)} ${tx.toFixed(1)} ${ty.toFixed(1)}" fill="none" stroke="${tam}" stroke-width="2.2" opacity=".55"/><path d="M${bx} ${by} Q${(bx + dx * .5).toFixed(1)} ${(by + dy * .45).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}" fill="none" stroke="${zel}" stroke-width="1" opacity=".8"/>`;
  };
  if (f.t === 'klica') {
    s += `<path d="M${cx} ${TLO} v-${h}" stroke="${zel}" stroke-width="2.5" stroke-linecap="round"/>`;
    s += list(cx, TLO - h * .5, -12, -h * .45, 2.5) + list(cx, TLO - h * .7, 10, -h * .4, 2.5);
    return s;
  }
  if (f.t === 'bokor') {
    for (const k of [-16, -8, 0, 8, 16]) s += `<path d="M${cx} ${TLO} q${k * .6} -${h * .5} ${k} -${h}" fill="none" stroke="${tam}" stroke-width="5" stroke-linecap="round"/><path d="M${cx} ${TLO} q${k * .6} -${h * .5} ${k} -${h}" fill="none" stroke="${svet}" stroke-width="2.6" stroke-linecap="round"/>`;
    return s;
  }
  // stablo: stabljika + listovi naizmenično + eventualno klas
  const sw = 3 + h / 80;
  s += `<path d="M${cx} ${TLO} v-${h}" stroke="${tam}" stroke-width="${sw}" stroke-linecap="round"/><path d="M${cx - sw * .25} ${TLO} v-${h}" stroke="${svet}" stroke-width="${sw * .4}" stroke-linecap="round" opacity=".8"/>`;
  const n = Math.min(6, 2 + Math.floor(h / 40));
  for (let k = 0; k < n; k++) {
    const by = TLO - h * (0.22 + k * 0.62 / n), str = k % 2 ? 1 : -1, dl = 22 + h / 9;
    s += list(cx, by, str * dl, -(dl * .9), 4.5);
  }
  if (f.t === 'klas' || f.t === 'zlat' || f.t === 'zreo') {
    const ky = TLO - h, rot = f.t === 'zreo' ? ' transform="rotate(-28 ' + cx + ' ' + ky + ')"' : '';
    let klas = `<g${rot}><ellipse cx="${cx}" cy="${ky - 16}" rx="6" ry="20" fill="${zel}"/><ellipse cx="${cx - 2}" cy="${ky - 18}" rx="2.5" ry="16" fill="${svet}" opacity=".8"/>`;
    for (let a = -3; a <= 3; a++) klas += `<path d="M${cx + a * 1.6} ${ky - 30 + Math.abs(a) * 4} l${a * 2.2} -14" stroke="${tam}" stroke-width="1" />`;
    for (let r = 0; r < 5; r++) klas += `<path d="M${cx - 6} ${ky - 30 + r * 7} h12" stroke="${tam}" stroke-width="1" opacity=".7"/>`;
    s += klas + '</g>';
  }
  return s;
}

function kartica(d, J, k) {
  const t = J.doze[k];
  const kgN = d.l.map(v => v * N_PO_L), kg = d.l.map(v => v * KG_PO_L);
  const x1 = x(d.od) - 34, x2 = x(d.do) + 34, w = 262;
  const kx = Math.min(x1, W - w - 10), ky = d.y, sy = ky + 96;
  return `<g filter="url(#senka)"><rect x="${kx}" y="${ky}" width="${w}" height="86" rx="12" fill="url(#kart)" stroke="${d.boja}" stroke-width="1.5"/><rect x="${kx}" y="${ky}" width="7" height="86" rx="3" fill="${d.boja}"/></g>
<text x="${kx + 18}" y="${ky + 22}" font-size="15" font-weight="800" fill="#1f2a22">${esc(t.naslov)}</text>
<text x="${kx + 18}" y="${ky + 40}" font-size="11.5" fill="#57625a">${esc(t.pod)}</text>
<text x="${kx + 18}" y="${ky + 66}" font-size="21" font-weight="800" fill="${d.boja}">${z(d.l[0])}–${z(d.l[1])} ${J.lha}</text>
<text x="${kx + 18}" y="${ky + 80}" font-size="12" fill="#1f2a22"><tspan font-weight="700">= ${z(kgN[0])}–${z(kgN[1])} ${J.kgN}</tspan>  (${z(kg[0])}–${z(kg[1])} ${J.kg})</text>
<path d="M${x1} ${sy} H${x2 - 10}" stroke="${d.boja}" stroke-width="4" stroke-linecap="round" opacity=".9"/><path d="M${x2 - 14} ${sy - 8} L${x2} ${sy} L${x2 - 14} ${sy + 8} z" fill="${d.boja}"/>
<path d="M${x1} ${sy} V${TLO - 2}" stroke="${d.boja}" stroke-width="1.5" stroke-dasharray="4 4" opacity=".55"/><path d="M${x2} ${sy} V${TLO - 2}" stroke="${d.boja}" stroke-width="1.5" stroke-dasharray="4 4" opacity=".55"/>`;
}

function svg(j) {
  const J = JEZICI[j];
  let s = `<svg viewBox="0 0 ${W} 560" role="img" aria-label="${esc(J.naslov)}" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="nebo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f9f2"/><stop offset="1" stop-color="#e9efdc"/></linearGradient>
<linearGradient id="tlo-gore" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9a775"/><stop offset="1" stop-color="#a8865a"/></linearGradient>
<linearGradient id="tlo-lice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a45"/><stop offset="1" stop-color="#5e4630"/></linearGradient>
<linearGradient id="kart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f3f5ec"/></linearGradient>
<filter id="senka" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1f2a22" flood-opacity=".22"/></filter>
</defs>
<rect width="${W}" height="560" rx="18" fill="url(#nebo)"/>
<text x="24" y="34" font-size="20" font-weight="800" fill="#1f2a22">${esc(J.naslov)}</text>
<text x="${W - 24}" y="34" font-size="13" text-anchor="end" fill="#57625a">${esc(J.legenda)}</text>
<!-- tlo kao blok -->
<polygon points="20,${TLO} ${W - 20},${TLO} ${W - 60},${TLO - 26} 60,${TLO - 26}" fill="url(#tlo-gore)"/>
<rect x="20" y="${TLO}" width="${W - 40}" height="46" fill="url(#tlo-lice)"/>
<polygon points="${W - 20},${TLO} ${W - 60},${TLO - 26} ${W - 60},${TLO + 20} ${W - 20},${TLO + 46}" fill="#4a3624"/>
`;
  FAZE.forEach((f, i) => { s += biljka(i, f); });
  FAZE.forEach((f, i) => {
    s += `<text x="${x(i)}" y="${TLO + 64}" font-size="11.5" text-anchor="middle" fill="#1f2a22">${esc(J.faze[i])}</text><text x="${x(i)}" y="${TLO + 84}" font-size="12" font-weight="700" text-anchor="middle" fill="#57625a">${f.b}</text>`;
  });
  s += `<text x="${x(0) - 46}" y="${TLO + 84}" font-size="11" text-anchor="end" font-style="italic" fill="#57625a">${esc(J.bbch)}</text>`;
  DOZE.forEach((d, k) => { s += kartica(d, J, k); });
  return s + '</svg>';
}

for (const j of Object.keys(JEZICI)) {
  const put = join(koren, 'strane', j, 'primena.html');
  const html = readFileSync(put, 'utf8');
  const re = /<!--SEMA-PSENICA-->[\s\S]*?<!--\/SEMA-PSENICA-->/;
  if (!re.test(html)) { console.error(`${j}: nema <!--SEMA-PSENICA--> u primena.html`); continue; }
  writeFileSync(put, html.replace(re, () => `<!--SEMA-PSENICA-->${svg(j)}<!--/SEMA-PSENICA-->`));
  console.log(`${j}: shema upisana`);
}
