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
