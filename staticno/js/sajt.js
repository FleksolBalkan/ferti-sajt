/* Ferti Shop — meni na telefonu, podmeni „Proizvodi”, tabele koje se skroluju, senka zaglavlja. */
(function () {
  'use strict';
  var meniDugme = document.querySelector('.meni-dugme');
  var meni = document.getElementById('glavni-meni');

  function postaviMeni(otvoren) {
    if (!meni || !meniDugme) return;
    meni.classList.toggle('otvoren', otvoren);
    meniDugme.setAttribute('aria-expanded', String(otvoren));
  }
  if (meniDugme && meni) {
    meniDugme.addEventListener('click', function () {
      postaviMeni(meniDugme.getAttribute('aria-expanded') !== 'true');
    });
    // klik na stavku (i na sidro na istoj strani) zatvara meni na telefonu
    meni.addEventListener('click', function (e) {
      if (e.target.closest('a')) postaviMeni(false);
    });
  }

  /* Podmeni: dugme sa strelicom otvara/zatvara (.otvoren + aria-expanded). Na računaru se otvara i prelaskom miša;
     Escape ga sklanja i tada (.sklonjen) dok miš ili fokus ne napuste stavku. */
  var stavke = Array.prototype.slice.call(document.querySelectorAll('.ima-podmeni'));
  function postaviPodmeni(li, otvoren) {
    li.classList.toggle('otvoren', otvoren);
    var b = li.querySelector('.podmeni-dugme');
    if (b) b.setAttribute('aria-expanded', String(otvoren));
  }
  stavke.forEach(function (li) {
    var b = li.querySelector('.podmeni-dugme');
    if (b) b.addEventListener('click', function () {
      var otvoren = !li.classList.contains('otvoren');
      stavke.forEach(function (d) { if (d !== li) postaviPodmeni(d, false); });
      postaviPodmeni(li, otvoren);
      li.classList.toggle('sklonjen', !otvoren);
    });
    li.addEventListener('mouseenter', function () { li.classList.remove('sklonjen'); });
    li.addEventListener('mouseleave', function () { li.classList.remove('sklonjen'); });
    li.addEventListener('focusout', function (e) {
      if (li.contains(e.relatedTarget)) return;
      postaviPodmeni(li, false);
      li.classList.remove('sklonjen');
    });
  });
  document.addEventListener('click', function (e) {
    stavke.forEach(function (li) { if (!li.contains(e.target)) postaviPodmeni(li, false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    // prvo se sklanja podmeni koji se stvarno vidi (otvoren dugmetom ili mišem), tek sledeći Escape zatvara meni
    var sklonjen = false;
    stavke.forEach(function (li) {
      var pm = li.querySelector('.podmeni');
      var cs = pm && getComputedStyle(pm);
      if (!li.classList.contains('otvoren') && !(cs && cs.display !== 'none' && cs.visibility === 'visible')) return;
      postaviPodmeni(li, false);
      li.classList.add('sklonjen');
      sklonjen = true;
      var b = li.querySelector('.podmeni-dugme');
      if (b && li.contains(document.activeElement)) b.focus();
    });
    if (sklonjen) return;
    if (meni && meni.classList.contains('otvoren')) { postaviMeni(false); meniDugme.focus(); }
  });
  // na širem ekranu meni je uvek vidljiv — skini stanje sa telefona
  var siroko = window.matchMedia('(min-width: 961px)');
  var promena = function () { if (siroko.matches) postaviMeni(false); };
  if (siroko.addEventListener) siroko.addEventListener('change', promena); else if (siroko.addListener) siroko.addListener(promena);

  /* Tabela šira od ekrana skroluje se u svom omotu; tada omot dobija fokus i ime (za tastaturu i čitač ekrana). */
  var omoti = Array.prototype.slice.call(document.querySelectorAll('.tabela-omot'));
  function proveriTabele() {
    omoti.forEach(function (o) {
      var skrol = o.scrollWidth > o.clientWidth + 1;
      if (skrol) {
        var c = o.querySelector('caption');
        o.setAttribute('tabindex', '0');
        o.setAttribute('role', 'region');
        o.setAttribute('aria-label', (c ? c.textContent.trim() + ' — ' : '') + 'tabela, može da se pomera vodoravno');
      } else {
        o.removeAttribute('tabindex');
        o.removeAttribute('role');
        o.removeAttribute('aria-label');
      }
    });
  }
  if (omoti.length) {
    proveriTabele();
    var tajmer = null;
    window.addEventListener('resize', function () { clearTimeout(tajmer); tajmer = setTimeout(proveriTabele, 150); });
  }

  /* Kalkulator UAN 32 (početna): litri = ha × kg N/ha ÷ 0,42; tone = litri × 1,32 / 1000; m³ = litri / 1000 */
  var kalk = document.getElementById('kalk');
  if (kalk) {
    var fmt = function (n, d) { return isFinite(n) && n > 0 ? n.toLocaleString(document.documentElement.lang || 'sr', { maximumFractionDigits: d }) : '—'; };
    var racunaj = function () {
      var ha = parseFloat(String(document.getElementById('kalk-ha').value).replace(',', '.'));
      var n = parseFloat(String(document.getElementById('kalk-n').value).replace(',', '.'));
      var litri = ha * n / 0.42;
      document.getElementById('kalk-l').textContent = fmt(Math.round(litri / 10) * 10, 0);
      document.getElementById('kalk-t').textContent = fmt(litri * 1.32 / 1000, 1);
      document.getElementById('kalk-m3').textContent = fmt(Math.ceil(litri / 1000), 0);
    };
    kalk.addEventListener('input', racunaj);
    kalk.addEventListener('submit', function (e) { e.preventDefault(); });
    racunaj();
  }

  var zaglavlje = document.querySelector('.zaglavlje');
  if (zaglavlje) {
    var senka = function () { zaglavlje.classList.toggle('skrol', window.scrollY > 8); };
    window.addEventListener('scroll', senka, { passive: true });
    senka();
  }
})();

// 4s (vlasnik 8.11.2026): sličica sa data-uvecaj se na klik uvećava preko strane (ne otvara novu karticu); zatvara se klikom, dugmetom ✕ ili tasterom Esc
(function () {
  var linkovi = document.querySelectorAll('a[data-uvecaj]');
  if (!linkovi.length) return;
  var sloj = null;
  function zatvori() { if (sloj) { sloj.remove(); sloj = null; document.removeEventListener('keydown', taster); } }
  function taster(e) { if (e.key === 'Escape') zatvori(); }
  function otvori(a) {
    var img = a.querySelector('img'), fig = a.closest('figure'), opis = fig && fig.querySelector('figcaption');
    sloj = document.createElement('div');
    sloj.className = 'uvecanje';
    sloj.setAttribute('role', 'dialog');
    sloj.setAttribute('aria-modal', 'true');
    var velika = document.createElement('img');
    velika.src = a.getAttribute('href');
    velika.alt = img ? img.alt : '';
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'uvecanje__zatvori'; x.setAttribute('aria-label', 'Zatvori'); x.textContent = '✕';
    var okvir = document.createElement('figure');
    okvir.appendChild(velika);
    if (opis) { var p = document.createElement('figcaption'); p.innerHTML = opis.innerHTML; okvir.appendChild(p); }
    sloj.appendChild(x); sloj.appendChild(okvir);
    sloj.addEventListener('click', zatvori);
    document.addEventListener('keydown', taster);
    document.body.appendChild(sloj);
    x.focus();
  }
  linkovi.forEach(function (a) { a.addEventListener('click', function (e) { if (e.ctrlKey || e.metaKey || e.shiftKey) return; e.preventDefault(); otvori(a); }); });
})();

// FS1 (vlasnik 9.11.2026): obrazac „Zatražite ponudu” → TRANZIT CRM (POST /api/upit): kupac + osoba + događaj + interesovanja, firma dobija mejl „novi upit”
(function () {
  var forme = document.querySelectorAll('form[data-upit]');
  if (!forme.length) return;
  var API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:10099/api/upit' : 'https://tranzit-eu.onrender.com/api/upit';
  forme.forEach(function (f) {
    var poruka = f.querySelector('.upit__poruka'), dugme = f.querySelector('button[type=submit]'), tekstDugmeta = dugme.textContent;
    function javi(t, vrsta) { poruka.textContent = t; poruka.className = 'upit__poruka' + (vrsta ? ' upit__poruka--' + vrsta : ''); }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {}, el = f.elements;
      ['ime', 'telefon', 'mesto', 'kultura', 'ha', 'kada', 'sajt_adresa'].forEach(function (k) { if (el[k]) d[k] = el[k].value.trim(); });
      d.proizvodi = Array.prototype.filter.call(f.querySelectorAll('input[name=proizvodi]'), function (c) { return c.checked; }).map(function (c) { return c.value; });
      d.pristanak = !!(el.pristanak && el.pristanak.checked);
      d.izvor = f.getAttribute('data-izvor') || 'sajt'; d.jezik = f.getAttribute('data-jezik') || 'sr'; d.obrazac = f.getAttribute('data-obrazac') || null;
      var q = new URLSearchParams(location.search), k = q.get('k') || sessionStorage.getItem('fs_k'), c = q.get('c') || sessionStorage.getItem('fs_c'); if (k) d.k = k; if (c) d.c = c;
      if (!d.ime || d.telefon.replace(/\D/g, '').length < 8) { javi(f.getAttribute('data-obavezno'), 'greska'); (d.ime ? el.telefon : el.ime).focus(); return; }
      dugme.disabled = true; dugme.textContent = f.getAttribute('data-salje'); javi('');
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function () { f.reset(); javi(f.getAttribute('data-hvala'), 'ok'); })
        .catch(function () { javi(f.getAttribute('data-greska'), 'greska'); })
        .then(function () { dugme.disabled = false; dugme.textContent = tekstDugmeta; });
    });
  });
})();

// FS2/FS5 (vlasnik 9. i 10.11.2026): prozor „Zatražite ponudu”.
//   Telefon (≤ 760 px): NIKAD se ne otvara sam (Google: nametljivi prozori) — stalna traka pri dnu ga otvara na klik.
//   Računar: sam se otvara tek posle 50 % skrola ili 30 s, jednom po posetiocu (localStorage pamti da je zatvoren); ne na strani Kontakt.
//   Strana /ponuda (ponuda.html): baner i obrazac su deo strane, prozora nema.
//   Lični link ?k=…&c=… (kampanja) popunjava ime i telefon u svakom obrascu na strani i beleži „klik”.
(function () {
  var API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:10099/api/upit' : 'https://tranzit-eu.onrender.com/api/upit';
  var forme = document.querySelectorAll('form[data-upit]');
  var SR = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
  forme.forEach(function (f) {
    var sel = f.querySelector('select[name=kada][data-meseci]'); if (!sel || sel.options.length > 1) return;
    sel.getAttribute('data-meseci').split(',').forEach(function (m, i) { if (!m || !SR[i]) return; var op = document.createElement('option'); op.value = SR[i]; op.textContent = m.trim(); sel.appendChild(op); });
  });
  function cuvaj(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* privatni režim */ } }
  function trajno(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  // lični link iz kampanje: zapamti za celu posetu, popuni ime i telefon, upiši klik
  var q = new URLSearchParams(location.search), k = q.get('k'), licni = !!(k && /^[a-f0-9]{32}$/.test(k));
  if (licni) {
    cuvaj('fs_k', k); if (q.get('c')) cuvaj('fs_c', q.get('c'));
    fetch(API + '/k/' + k + (q.get('c') ? '?c=' + encodeURIComponent(q.get('c')) : '')).then(function (r) { return r.ok ? r.json() : null; }).then(function (o) {
      if (!o) return;
      forme.forEach(function (f) {
        if (o.ime && f.elements.ime && !f.elements.ime.value) f.elements.ime.value = o.ime;
        if (o.telefon && f.elements.telefon && !f.elements.telefon.value) f.elements.telefon.value = o.telefon;
      });
    }).catch(function () {});
  }
  var prozor = document.getElementById('ponuda-prozor');
  if (!prozor) return;
  var trake = document.querySelectorAll('[data-ponuda-otvori]'), pre = null;
  var mobilni = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
  function otvori() {
    pre = document.activeElement; prozor.hidden = false; document.documentElement.classList.add('ponuda-otvorena');
    trake.forEach(function (t) { t.setAttribute('aria-expanded', 'true'); });
    // FS4: fokus na X bez pomeranja — baner ostaje vidljiv od vrha, a na telefonu se ne otvara tastatura
    var kut = prozor.querySelector('.ponuda-prozor__kutija'); if (kut) kut.scrollTop = 0;
    var x = prozor.querySelector('[data-ponuda-smanji]'); if (x) setTimeout(function () { try { x.focus({ preventScroll: true }); } catch (e) { x.focus(); } }, 50);
  }
  function smanji() {
    prozor.hidden = true; document.documentElement.classList.remove('ponuda-otvorena'); trajno('fs_ponuda_zatvoren', '1');
    trake.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    if (pre && pre.focus) pre.focus();
  }
  trake.forEach(function (t) { t.addEventListener('click', function (e) { if (e.ctrlKey || e.metaKey) return; e.preventDefault(); otvori(); }); });
  prozor.querySelector('[data-ponuda-smanji]').addEventListener('click', smanji);
  prozor.addEventListener('click', function (e) { if (e.target === prozor) smanji(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !prozor.hidden) smanji(); });
  // samo računar: posle 50 % skrola ili 30 s, jednom po posetiocu; lični link (stari, na početnu) otvara odmah
  if (mobilni || /kontakt(\.html)?$/.test(location.pathname)) return;
  if (licni) { otvori(); return; }
  if (trajno('fs_ponuda_zatvoren')) return;
  var gotovo = false, sat = null;
  function auto() {
    if (gotovo) return; gotovo = true; clearTimeout(sat); window.removeEventListener('scroll', naSkrol);
    if (!trajno('fs_ponuda_zatvoren') && prozor.hidden) otvori();
  }
  function naSkrol() {
    var d = document.documentElement, max = d.scrollHeight - window.innerHeight;
    if (max > 0 && window.scrollY / max >= 0.5) auto();
  }
  sat = setTimeout(auto, 30000);
  window.addEventListener('scroll', naSkrol, { passive: true });
  // slika banera (lazy u skrivenom prozoru) se učita u miru posle strane, da prozor ne čeka sliku
  window.addEventListener('load', function () { var im = prozor.querySelector('img[loading=lazy]'); if (im) setTimeout(function () { im.loading = 'eager'; }, 1500); });
})();
