// CRM F5 OBRASCI (vlasnik 19./20.11.2026; nameštaj 20.11.2026) — zajednička skripta strane obrasca: ferti-shop.com/obrazac/<naziv>?izvor=fb (tester: &t=KOD).
// Pitanja dolaze sa servera (tabela ankete) — nov obrazac = nov red u bazi. Jedno pitanje po ekranu, veliki dugmići, bez menija sajta.
//   anketa      — kraj: „Želite besplatan proračun?” → kontakt uz pristanak (lid „anketa”). Jedan uređaj = jedan odgovor.
//   glasanje    — posle glasanja procenti; ko je već glasao vidi rezultat.
//   kalkulator  — broj odmah (isti alat kao AI agronom, „orijentaciono”, bez cena); „Celu računicu sa podelom po prihranama?” → kontakt → lid „obrazac”.
//   podsetnik   — kultura + telefon → SMS kad dođe rok; upis broja = pristanak; odjava NE.
(function () {
  var API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:10099/api/anketa/' : 'https://tranzit-eu.onrender.com/api/anketa/';
  var q = new URLSearchParams(location.search);
  // naziv obrasca: /obrazac/<naziv>/ (fascikla) ili /obrazac/?n=<naziv> (preusmerenje sa 404 za nove obrasce)
  var deo = location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '').split('/'), naziv = q.get('n') || (deo[deo.length - 2] === 'obrazac' ? deo[deo.length - 1] : 'anketa');
  if (!/^[a-z0-9-]{1,40}$/.test(naziv)) naziv = 'anketa';
  var izvor = (q.get('izvor') || 'sajt').replace(/[^a-z0-9_-]/gi, '').slice(0, 30) || 'sajt';
  var t = q.get('t'); if (t && !/^[A-Za-z0-9_-]{1,40}$/.test(t)) t = null;
  var kljucUredjaja = 'ferti_uredjaj', kljucGotovo = 'ferti_obrazac_' + naziv;
  function uredjaj() { try { var u = localStorage.getItem(kljucUredjaja); if (!u) { u = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem(kljucUredjaja, u); } return u; } catch (e) { return 'bez-pamcenja-' + Date.now() + '-' + Math.random().toString(36).slice(2); } }
  var app = document.getElementById('app'), A = null, odg = {}, korak = 0, red = [], racun = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function vidljivo(p) { if (!p.uslov) return true; if (p.uslov.nije != null) return odg[p.uslov.pitanje] != null && odg[p.uslov.pitanje] !== p.uslov.nije; return odg[p.uslov.pitanje] === p.uslov.jeste; }
  function sledeci(od) { for (var i = od; i < A.pitanja.length; i++) if (vidljivo(A.pitanja[i])) return i; return A.pitanja.length; }
  function napredak() { var n = A.pitanja.length + 1; return '<div class="napredak"><i style="width:' + Math.round(100 * Math.min(korak, n) / n) + '%"></i></div>'; }
  function gotovo() { try { localStorage.setItem(kljucGotovo, '1'); } catch (e) { /* bez pamćenja */ } }
  function dalje() { red.push(korak); korak = sledeci(korak + 1); prikazi(); }
  function nazadDugme() { var n = $('nazad'); if (n) n.onclick = function () { korak = red.pop(); prikazi(); }; }
  function zahtev(put, telo) {
    return fetch(API + put, telo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(telo) } : undefined)
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, d: d }; }); });
  }
  function nemaVeze() { app.innerHTML = '<h1>Nema veze sa serverom</h1><p>Pokušajte ponovo za minut.</p>'; }

  function prikazi() {
    if (korak >= A.pitanja.length) return krajPitanja();
    var p = A.pitanja[korak], h = napredak() + '<h1>' + esc(p.tekst) + '</h1>';
    if (p.tip === 'broj' || p.tip === 'tekst') {   // polje za upis (prinos, mesto)
      var v = odg[p.id] != null ? String(odg[p.id]).replace('.', ',') : '';
      h += '<input type="text" id="polje"' + (p.tip === 'broj' ? ' inputmode="decimal"' : ' autocomplete="address-level2"') + ' value="' + esc(v) + '" placeholder="' + esc(p.primer || '') + '">';
      if (p.jedinica) h += '<div class="napomena">' + esc(p.jedinica) + '</div>';
      h += '<button class="dugme" id="dalje">Dalje</button><div class="greska" id="gr"></div>';
      if (!p.obavezno) h += '<button class="nazad" id="preskoci">Preskoči ›</button>';
      if (red.length) h += '<button class="nazad" id="nazad">‹ Nazad</button>';
      app.innerHTML = h; nazadDugme();
      var polje = $('polje'); polje.focus();
      var potvrdi = function () {
        var s = polje.value.trim();
        if (p.tip === 'broj') {
          var n = Number(s.replace(',', '.').replace(/[^\d.]/g, ''));
          if (!s && !p.obavezno) { delete odg[p.id]; return dalje(); }
          if (!(n > 0) || (p.min != null && n < p.min) || (p.max != null && n > p.max)) { $('gr').textContent = 'Upišite broj' + (p.min != null && p.max != null ? ' od ' + String(p.min).replace('.', ',') + ' do ' + p.max : '') + (p.jedinica ? ' (' + p.jedinica + ')' : '') + '.'; return; }
          odg[p.id] = n;
        } else {
          if (!s && p.obavezno) { $('gr').textContent = 'Upišite odgovor.'; return; }
          if (s) odg[p.id] = s.slice(0, 80); else delete odg[p.id];
        }
        dalje();
      };
      $('dalje').onclick = potvrdi;
      polje.onkeydown = function (e) { if (e.key === 'Enter') potvrdi(); };
      var pr = $('preskoci'); if (pr) pr.onclick = function () { delete odg[p.id]; dalje(); };
      return;
    }
    var vise = p.tip === 'vise', izabrano = [].concat(odg[p.id] || []);
    p.opcije.forEach(function (o, i) { h += '<button class="izbor' + (izabrano.indexOf(o) >= 0 ? ' da' : '') + '" data-i="' + i + '">' + esc(o) + '</button>'; });
    if (vise) h += '<button class="dugme" id="dalje"' + (izabrano.length ? '' : ' disabled') + '>Dalje</button>';
    if (red.length) h += '<button class="nazad" id="nazad">‹ Nazad</button>';
    app.innerHTML = h;
    Array.prototype.forEach.call(app.querySelectorAll('.izbor'), function (b) {
      b.onclick = function () {
        var o = p.opcije[+b.getAttribute('data-i')];
        if (vise) { var l = [].concat(odg[p.id] || []); var k = l.indexOf(o); if (k >= 0) l.splice(k, 1); else l.push(o); odg[p.id] = l; prikazi(); }
        else { odg[p.id] = o; dalje(); }
      };
    });
    var d = $('dalje'); if (d) d.onclick = dalje;
    nazadDugme();
  }

  // posle poslednjeg pitanja — zavisi od vrste obrasca
  function krajPitanja() {
    if (A.tip === 'glasanje') return glasaj();
    if (A.tip === 'kalkulator') return izracunaj();
    if (A.tip === 'podsetnik') return telefonPodsetnika();
    return krajAnkete();
  }

  // ── ANKETA
  function krajAnkete() {
    var k = A.kraj || {};
    var h = napredak() + '<h1>' + esc(k.tekst || 'Hvala!') + '</h1>';
    h += '<button class="izbor" id="kda">Da</button><button class="izbor" id="kne">Ne, hvala</button>';
    if (red.length) h += '<button class="nazad" id="nazad">‹ Nazad</button>';
    app.innerHTML = h;
    $('kne').onclick = function () { posaljiAnketu(false); };
    $('kda').onclick = kontaktAnkete;
    nazadDugme();
  }
  function poljaKontakta(polja, naslovMejla) {
    var h = '';
    if (polja.indexOf('ime') >= 0) h += '<label>Ime i prezime</label><input type="text" id="ime" autocomplete="name">';
    if (polja.indexOf('telefon') >= 0) h += '<label>Telefon</label><input type="tel" id="tel" autocomplete="tel" inputmode="tel">';
    if (polja.indexOf('mejl') >= 0) h += '<label>' + esc(naslovMejla || 'Mejl') + '</label><input type="email" id="mejl" autocomplete="email">';
    if (polja.indexOf('mesto') >= 0) h += '<label>Mesto</label><input type="text" id="mesto" autocomplete="address-level2">';
    return h + '<div class="zamka"><label>Web</label><input type="text" id="web" tabindex="-1" autocomplete="off"></div>';
  }
  function vrednost(id) { var e = $(id); return e ? e.value.trim() : ''; }
  function kontaktAnkete() {
    var k = A.kraj || {}, polja = k.polja || ['ime', 'telefon', 'mejl', 'mesto'];
    app.innerHTML = napredak() + '<h1>Gde da pošaljemo proračun?</h1>' + poljaKontakta(polja, polja.indexOf('telefon') >= 0 ? 'ili mejl' : 'Mejl') +
      '<label class="pristanak"><input type="checkbox" id="ok"> ' + esc(k.pristanak || 'Saglasan sam da me Ferti Shop kontaktira zbog proračuna.') + '</label>' +
      '<button class="dugme" id="salji">Pošalji</button><div class="greska" id="gr"></div><button class="nazad" id="nazad">‹ Nazad</button>';
    $('nazad').onclick = krajAnkete;
    $('salji').onclick = function () {
      var tel = vrednost('tel'), mejl = vrednost('mejl');
      if (!tel && !mejl) { $('gr').textContent = 'Upišite telefon ili mejl.'; return; }
      if (!$('ok').checked) { $('gr').textContent = 'Potrebna je vaša saglasnost da vas kontaktiramo.'; return; }
      posaljiAnketu(true, { ime: vrednost('ime'), telefon: tel, mejl: mejl }, vrednost('mesto'), vrednost('web'));
    };
  }
  function posaljiAnketu(zeli, k, mesto, web) {
    app.innerHTML = '<p>Šaljem…</p>';
    var telo = { uredjaj: uredjaj(), izvor: izvor, odgovori: odg, zeli_proracun: zeli, pristanak: !!zeli, kontakt: k || null, mesto: mesto || null, web: web || '' };
    if (t) telo.t = t;
    zahtev(encodeURIComponent(naziv), telo).then(function (r) {
      if (r.ok || r.status === 409) gotovo();
      app.innerHTML = r.ok ? '<h1>Hvala!</h1><p>' + (zeli ? 'Javićemo vam se sa proračunom azota za vašu njivu.' : 'Vaši odgovori nam pomažu da savetujemo bolje.') + '</p><p>Dozu možete izračunati i odmah: <a href="https://ferti-shop.com/obrazac/kalkulator-azot">kalkulator azota</a> ili <a href="https://ferti-shop.com/asistent">AI agronom</a>.</p>'
        : '<h1>' + (r.status === 409 ? 'Hvala!' : 'Nešto nije u redu') + '</h1><p>' + esc((r.d && r.d.error) || 'Pokušajte ponovo za minut.') + '</p>';
    }).catch(nemaVeze);
  }

  // ── GLASANJE
  function prikaziRezultate(rez, naslov) {
    var k = A.kraj || {}, h = '<h1>' + esc(naslov || k.tekst || 'Rezultat glasanja') + '</h1>';
    (rez || []).forEach(function (p) {
      h += '<p><b>' + esc(p.tekst) + '</b><br><span class="napomena">' + p.glasova + ' ' + (p.glasova % 10 === 1 && p.glasova % 100 !== 11 ? 'glas' : 'glasova') + '</span></p><div class="rez">';
      p.opcije.forEach(function (o) {
        var moj = [].concat(odg[p.id] || []).indexOf(o.opcija) >= 0;
        h += '<div class="red"><span>' + (moj ? '<b>' : '') + esc(o.opcija) + (moj ? ' ✓</b>' : '') + '</span><span>' + o.procenat + ' %</span></div><div class="traka-r"><i style="width:' + o.procenat + '%"></i></div><div style="height:8px"></div>';
      });
      h += '</div>';
    });
    if (k.poziv && k.poziv.link) h += '<p>' + esc(k.poziv.tekst || '') + '</p><a class="dugme" href="' + esc(k.poziv.link) + '">Izračunaj</a>';
    app.innerHTML = h;
  }
  function glasaj() {
    app.innerHTML = '<p>Šaljem…</p>';
    var telo = { uredjaj: uredjaj(), izvor: izvor, odgovori: odg, web: '' }; if (t) telo.t = t;
    zahtev(encodeURIComponent(naziv), telo).then(function (r) {
      if (r.ok) { gotovo(); return prikaziRezultate(r.d.rezultati); }
      if (r.status === 409) { gotovo(); return vecGlasao(); }
      app.innerHTML = '<h1>Nešto nije u redu</h1><p>' + esc((r.d && r.d.error) || 'Pokušajte ponovo za minut.') + '</p>';
    }).catch(nemaVeze);
  }
  function vecGlasao() {
    zahtev(encodeURIComponent(naziv) + '/rezultati').then(function (r) { if (r.ok) prikaziRezultate(r.d.rezultati, 'Već ste glasali — ovako su glasali ratari:'); else app.innerHTML = '<h1>Hvala!</h1><p>Sa ovog uređaja je već glasano.</p>'; }).catch(nemaVeze);
  }

  // ── KALKULATOR AZOTA
  function izracunaj() {
    app.innerHTML = '<p>Računam…</p>';
    var telo = { uredjaj: uredjaj(), izvor: izvor, odgovori: odg, web: '' }; if (t) telo.t = t;
    zahtev(encodeURIComponent(naziv), telo).then(function (r) {
      if (!r.ok) { app.innerHTML = '<h1>Nešto nije u redu</h1><p>' + esc((r.d && r.d.error) || 'Pokušajte ponovo za minut.') + '</p><button class="dugme drugo" id="opet">Novi proračun</button>'; $('opet').onclick = ispocetka; return; }
      racun = { id: r.d.id, rezultat: r.d.rezultat || {} };
      prikaziRacun();
    }).catch(nemaVeze);
  }
  function prikaziRacun() {
    var k = A.kraj || {}, x = racun.rezultat, h = '<h1>Vaš broj</h1>';
    if (x.tekst) h += '<div class="broj">' + esc(x.tekst) + (x.izvor ? '<div class="izvor">Izvor: ' + esc(x.izvor) + '</div>' : '') + '</div>';
    else h += '<p>Za ovu kombinaciju nemamo pouzdan broj. Pitajte našeg <a href="https://ferti-shop.com/asistent">AI agronoma</a> — postaviće jedno-dva pitanja više.</p>';
    if (k.napomena) h += '<div class="napomena">' + esc(k.napomena) + '</div>';
    if (x.tekst) h += '<h1 style="margin-top:22px">' + esc(k.tekst || 'Celu računicu sa podelom po prihranama?') + '</h1><button class="izbor" id="kda">Da, pošaljite mi</button><button class="izbor" id="kne">Ne, hvala</button>';
    h += '<button class="dugme drugo" id="opet">Novi proračun</button>';
    app.innerHTML = h;
    $('opet').onclick = ispocetka;
    if ($('kda')) { $('kda').onclick = kontaktKalkulatora; $('kne').onclick = function () { app.innerHTML = '<h1>Hvala!</h1><p>Za podsetnik kad dođe rok za prihranu: <a href="https://ferti-shop.com/obrazac/podsetnik-prihrana">SMS podsetnik</a>.</p><button class="dugme drugo" id="opet">Novi proračun</button>'; $('opet').onclick = ispocetka; }; }
  }
  function kontaktKalkulatora() {
    var k = A.kraj || {};
    app.innerHTML = '<h1>Gde da pošaljemo celu računicu?</h1>' + poljaKontakta(k.polja || ['ime', 'telefon', 'mejl'], 'ili mejl') +
      '<label class="pristanak"><input type="checkbox" id="ok"> ' + esc(k.pristanak || 'Saglasan sam da me Ferti Shop kontaktira zbog računice.') + '</label>' +
      '<button class="dugme" id="salji">Pošalji</button><div class="greska" id="gr"></div><button class="nazad" id="nazad">‹ Nazad</button>';
    $('nazad').onclick = prikaziRacun;
    $('salji').onclick = function () {
      var tel = vrednost('tel'), mejl = vrednost('mejl');
      if (!tel && !mejl) { $('gr').textContent = 'Upišite telefon ili mejl.'; return; }
      if (!$('ok').checked) { $('gr').textContent = 'Potrebna je vaša saglasnost da vas kontaktiramo.'; return; }
      var telo = { uredjaj: uredjaj(), id: racun.id, pristanak: true, kontakt: { ime: vrednost('ime'), telefon: tel, mejl: mejl }, web: vrednost('web') };
      app.innerHTML = '<p>Šaljem…</p>';
      zahtev(encodeURIComponent(naziv) + '/kontakt', telo).then(function (r) {
        app.innerHTML = r.ok ? '<h1>Hvala!</h1><p>Javićemo vam se sa celom računicom i podelom po prihranama.</p><button class="dugme drugo" id="opet">Novi proračun</button>'
          : '<h1>Nešto nije u redu</h1><p>' + esc((r.d && r.d.error) || 'Pokušajte ponovo za minut.') + '</p><button class="dugme drugo" id="opet">Novi proračun</button>';
        $('opet').onclick = ispocetka;
      }).catch(nemaVeze);
    };
  }
  function ispocetka() { odg = {}; red = []; racun = null; korak = sledeci(0); prikazi(); }

  // ── PODSETNIK
  function telefonPodsetnika() {
    var k = A.kraj || {};
    app.innerHTML = napredak() + '<h1>Broj mobilnog za SMS podsetnik</h1>' +
      '<input type="tel" id="tel" autocomplete="tel" inputmode="tel" placeholder="06x xxx xxxx">' +
      '<div class="zamka"><label>Web</label><input type="text" id="web" tabindex="-1" autocomplete="off"></div>' +
      '<div class="napomena">' + esc(k.pristanak || 'Upisom broja pristajete na SMS podsetnik. Odjava: odgovorite NE.') + '</div>' +
      '<button class="dugme" id="salji">Upiši podsetnik</button><div class="greska" id="gr"></div><button class="nazad" id="nazad">‹ Nazad</button>';
    nazadDugme(); $('tel').focus();
    $('salji').onclick = function () {
      var tel = vrednost('tel');
      if (!/\d{6,}/.test(tel.replace(/\D/g, ''))) { $('gr').textContent = 'Upišite broj mobilnog telefona.'; return; }
      var telo = { uredjaj: uredjaj(), izvor: izvor, odgovori: odg, kontakt: { telefon: tel }, web: vrednost('web') }; if (t) telo.t = t;
      app.innerHTML = '<p>Šaljem…</p>';
      zahtev(encodeURIComponent(naziv), telo).then(function (r) {
        var dat = r.ok && r.d.rok ? r.d.rok.split('-').reverse().map(function (x) { return String(+x); }).join('. ') : '';
        app.innerHTML = r.ok ? '<h1>Upisano!</h1><p>Poslaćemo vam SMS kad dođe rok za prihranu (' + esc(odg.kultura) + ')' + (dat ? ', oko ' + esc(dat) : '') + '.</p><p>Do tada: <a href="https://ferti-shop.com/obrazac/kalkulator-azot">koliko azota za vašu njivu</a>.</p><button class="dugme drugo" id="jos">Podsetnik za drugu kulturu</button>'
          : '<h1>' + (r.status === 409 ? 'Već upisano' : 'Nešto nije u redu') + '</h1><p>' + esc((r.d && r.d.error) || 'Pokušajte ponovo za minut.') + '</p><button class="dugme drugo" id="jos">Druga kultura</button>';
        $('jos').onclick = ispocetka;
      }).catch(nemaVeze);
    };
  }

  // ── POČETAK: server na besplatnom planu se budi i do minut
  var pokusaj = 0;
  (function ucitaj() {
    zahtev(encodeURIComponent(naziv)).then(function (r) {
      if (!r.ok) { app.innerHTML = '<h1>Obrazac nije dostupan</h1><p>' + esc(r.d && r.d.error) + '</p>'; return; }
      A = r.d; $('naslov').textContent = A.naslov || 'Ferti Shop'; document.title = (A.naslov || 'Obrazac') + ' — Ferti Shop';
      var bio = false; try { bio = !!localStorage.getItem(kljucGotovo); } catch (e) { /* bez pamćenja */ }
      if (bio && A.tip === 'glasanje') return vecGlasao();
      if (bio && A.tip === 'anketa') { app.innerHTML = '<h1>Hvala!</h1><p>Sa ovog uređaja je već odgovoreno.</p>'; return; }
      if (A.tip === 'glasanje') { korak = sledeci(0); return prikazi(); }   // glasanje: odmah pitanje, bez uvoda
      app.innerHTML = '<h1>' + esc(A.naslov) + '</h1><p>' + esc(A.uvod || '') + '</p><button class="dugme" id="kreni">' + (A.tip === 'kalkulator' ? 'Izračunaj' : A.tip === 'podsetnik' ? 'Upiši podsetnik' : 'Počni') + '</button>';
      $('kreni').onclick = function () { korak = sledeci(0); prikazi(); };
    }).catch(function () { if (++pokusaj < 6) { app.innerHTML = '<p>Učitavam… (server se budi)</p>'; setTimeout(ucitaj, 10000); } else nemaVeze(); });
  })();
})();
