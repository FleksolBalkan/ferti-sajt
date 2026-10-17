/* Oblačić za razgovor sa asistentom — dovoljan je jedan red na svakoj strani:
     <script src="js/oblacic.js" data-chat="https://tranzit-eu.onrender.com/chat" defer></script>
   Dugme stoji dole desno; na prvi klik otvara stranicu /chat sa servera u okviru (iframe), do tada se ništa ne učitava.
   Svaki element sa atributom data-otvori-chat (npr. „Zatražite ponudu”) takođe otvara razgovor;
   bez JavaScript-a (ili Ctrl/Shift+klikom) takav link vodi na svoju adresu (stranu Kontakt).
   Stranica /chat javlja „ferti-chat-spreman” kad se učita i „ferti-chat-zatvori” na Escape (postMessage). */
(function () {
  'use strict';
  if (window.__fertiOblacic) return;
  window.__fertiOblacic = true;

  var skripta = document.currentScript;
  var ADRESA = (skripta && skripta.getAttribute('data-chat')) || 'https://tranzit-eu.onrender.com/chat';
  var NASLOV = (skripta && skripta.getAttribute('data-naslov')) || 'Asistent';
  var POREKLO;
  try { POREKLO = new URL(ADRESA, location.href).origin; } catch (e) { return; }
  // na uskom ili niskom ekranu (i telefon položeno) prozor ide preko celog ekrana
  var PUN_EKRAN = '(max-width: 600px), (max-height: 500px)';

  // tekstovi po jeziku strane (<html lang>)
  var RECNIK = {
    sr: { pitajte: 'Pitajte nas', otvori: 'Pitajte nas — razgovor sa asistentom', zatvoriDug: 'Zatvori razgovor sa asistentom', zatvori: 'Zatvori razgovor',
      povezujem: 'Povezujem se sa asistentom…', budi: 'Asistent se budi, još samo malo…', nedostupan: 'Asistent trenutno nije dostupan. Pozovite nas ili pokušajte ponovo.', ponovo: 'Pokušaj ponovo' },
    hu: { pitajte: 'Kérdezzen', otvori: 'Kérdezzen — beszélgetés az asszisztenssel', zatvoriDug: 'Beszélgetés bezárása', zatvori: 'Bezárás',
      povezujem: 'Kapcsolódás az asszisztenshez…', budi: 'Az asszisztens ébred, még egy kis türelmet…', nedostupan: 'Az asszisztens jelenleg nem elérhető. Hívjon minket, vagy próbálja újra.', ponovo: 'Újra' },
    ro: { pitajte: 'Întrebați-ne', otvori: 'Întrebați-ne — conversație cu asistentul', zatvoriDug: 'Închide conversația cu asistentul', zatvori: 'Închide conversația',
      povezujem: 'Conectare la asistent…', budi: 'Asistentul pornește, încă puțin…', nedostupan: 'Asistentul nu este disponibil acum. Sunați-ne sau încercați din nou.', ponovo: 'Încercați din nou' }
  };
  var T = RECNIK[(document.documentElement.lang || 'sr').slice(0, 2).toLowerCase()] || RECNIK.sr;

  var css = [    '.fo-dugme{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:inline-flex;align-items:center;gap:10px;',
    'height:60px;padding:0 22px 0 18px;border:0;border-radius:999px;background:#37752c;color:#fff;cursor:pointer;',
    'font:700 16px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;',
    'box-shadow:0 10px 28px rgba(20,48,31,.35);transition:background .2s,transform .2s}',
    '.fo-dugme:hover{background:#14301f;transform:translateY(-2px)}',
    '.fo-dugme:focus-visible{outline:3px solid #14301f;outline-offset:3px;box-shadow:0 0 0 6px #fff}',
    '.fo-dugme svg{width:28px;height:28px;flex:none}',
    '.fo-dugme .fo-x{display:none}',
    '.fo-dugme[aria-expanded="true"] .fo-ob{display:none}',
    '.fo-dugme[aria-expanded="true"] .fo-x{display:block}',
    '.fo-tacka{position:absolute;top:6px;left:40px;width:12px;height:12px;border-radius:50%;background:#c9cc3f;border:2px solid #37752c}',
    '.fo-dugme[aria-expanded="true"] .fo-tacka,.fo-dugme[aria-expanded="true"] .fo-natpis{display:none}',
    '.fo-dugme[aria-expanded="true"]{width:60px;padding:0;justify-content:center}',
    '.fo-panel{position:fixed;right:20px;bottom:92px;z-index:2147483001;width:390px;height:min(620px,calc(100vh - 120px));',
    'border-radius:18px;overflow:hidden;background:#f2f5ef;box-shadow:0 24px 60px rgba(20,48,31,.35);',
    'opacity:0;transform:translateY(12px) scale(.98);transform-origin:bottom right;transition:opacity .18s,transform .18s}',
    '.fo-panel[hidden]{display:none}',
    '.fo-panel.fo-vidljiv{opacity:1;transform:none}',
    '.fo-okvir{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent;visibility:hidden}',
    '.fo-panel.fo-spreman .fo-okvir{visibility:visible}',
    '.fo-ucitava{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;',
    'padding:72px 24px 24px;text-align:center;background:#f2f5ef;color:#46524a;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}',
    '.fo-ucitava::before{content:"";position:absolute;left:0;right:0;top:0;height:66px;background:#14301f}',
    '.fo-panel.fo-spreman .fo-ucitava{display:none}',
    '.fo-krug{width:34px;height:34px;border-radius:50%;border:3px solid #dfe6d8;border-top-color:#37752c;animation:fo-vrti .9s linear infinite}',
    '.fo-greska .fo-krug{display:none}',
    '.fo-ucitava a,.fo-ucitava button{font-family:inherit;font-weight:700;font-size:15px;line-height:1.2;color:#fff;background:#37752c;border:0;border-radius:999px;',
    'padding:11px 18px;text-decoration:none;cursor:pointer;min-height:44px;display:inline-flex;align-items:center}',
    '.fo-ucitava a:focus-visible,.fo-ucitava button:focus-visible{outline:3px solid #14301f;outline-offset:2px}',
    '.fo-veze{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '@keyframes fo-vrti{to{transform:rotate(360deg)}}',
    '.fo-zatvori{position:absolute;top:14px;right:12px;z-index:2;width:40px;height:40px;border:0;border-radius:50%;',
    'background:rgba(20,48,31,.92);color:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 0 0 1px rgba(255,255,255,.35)}',
    '.fo-zatvori:hover{background:#37752c}',
    '.fo-zatvori:focus-visible{outline:3px solid #c9cc3f;outline-offset:2px}',
    '.fo-zatvori svg{width:18px;height:18px}',
    '@media ' + PUN_EKRAN + '{',
    '.fo-dugme{right:14px;bottom:14px;height:56px;padding:0 16px}',
    '.fo-dugme .fo-natpis{display:none}',
    '.fo-dugme[aria-expanded="true"]{display:none}',
    '.fo-panel{inset:0;right:0;bottom:0;width:100%;height:100%;border-radius:0}',
    'html.fo-otvoreno,html.fo-otvoreno body{overflow:hidden}}',
    '@media (prefers-reduced-motion:reduce){.fo-dugme,.fo-panel{transition:none}.fo-krug{animation:none}}',
    '@media print{.fo-dugme,.fo-panel{display:none!important}}'
  ].join('');

  var IKONA_OBLACIC = '<svg class="fo-ob" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" stroke-width="2.6"/></svg>';
  var IKONA_X = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function el(oznaka, svojstva, tekst) {
    var e = document.createElement(oznaka);
    for (var k in svojstva) e.setAttribute(k, svojstva[k]);
    if (tekst) e.textContent = tekst;
    return e;
  }

  function napravi() {
    var stil = document.createElement('style');
    stil.textContent = css;
    document.head.appendChild(stil);

    var dugme = el('button', { type: 'button', 'class': 'fo-dugme', 'aria-expanded': 'false', 'aria-controls': 'fo-panel',
      'aria-label': T.otvori });
    dugme.innerHTML = IKONA_OBLACIC + IKONA_X.replace('<svg ', '<svg class="fo-x" ') +
      '<span class="fo-tacka" aria-hidden="true"></span><span class="fo-natpis">' + T.pitajte + '</span>';

    var panel = el('div', { id: 'fo-panel', 'class': 'fo-panel', role: 'dialog', 'aria-label': NASLOV });
    panel.hidden = true;

    var ucitava = el('div', { 'class': 'fo-ucitava' });
    var krug = el('span', { 'class': 'fo-krug', 'aria-hidden': 'true' });
    var poruka = el('p', { 'class': 'fo-tekst', role: 'status', style: 'margin:0' }, T.povezujem);
    var veze = el('div', { 'class': 'fo-veze' });
    ucitava.appendChild(krug);
    ucitava.appendChild(poruka);
    ucitava.appendChild(veze);

    var zatvori = el('button', { type: 'button', 'class': 'fo-zatvori', 'aria-label': T.zatvori });
    zatvori.innerHTML = IKONA_X;

    var okvir = el('iframe', { 'class': 'fo-okvir', title: NASLOV });

    // redosled u DOM-u prati raspored: X na vrhu, pa razgovor
    panel.appendChild(ucitava);
    panel.appendChild(zatvori);
    panel.appendChild(okvir);
    document.body.appendChild(panel);
    document.body.appendChild(dugme);

    var spreman = false, tajmerSporo = null, tajmerGreska = null, otvarac = null, inertni = [];

    function pokaziGresku() {
      if (spreman) return;
      clearTimeout(tajmerSporo); clearTimeout(tajmerGreska);
      ucitava.classList.add('fo-greska');
      poruka.textContent = T.nedostupan;
      veze.textContent = '';
      veze.appendChild(el('a', { href: 'tel:+381692012001' }, '069 201 2001'));
      veze.appendChild(el('a', { href: 'tel:+381213411134' }, '021 341 1134'));
      var ponovo = el('button', { type: 'button' }, T.ponovo);
      ponovo.addEventListener('click', ucitaj);
      veze.appendChild(ponovo);
    }
    function ucitaj() {
      spreman = false;
      panel.classList.remove('fo-spreman');
      ucitava.classList.remove('fo-greska');
      veze.textContent = '';
      poruka.textContent = T.povezujem;
      clearTimeout(tajmerSporo); clearTimeout(tajmerGreska);
      // besplatan server se posle mirovanja budi i do minut — reci to posetiocu umesto praznog prozora
      tajmerSporo = setTimeout(function () { if (!spreman) poruka.textContent = T.budi; }, 6000);
      tajmerGreska = setTimeout(pokaziGresku, 60000);
      okvir.setAttribute('src', ADRESA);
    }
    // „load” stiže i za stranicu greške (502, odbijena veza) — ako posle njega ne stigne „spreman”, server ne radi
    okvir.addEventListener('load', function () {
      if (!okvir.getAttribute('src') || spreman) return;
      clearTimeout(tajmerGreska);
      tajmerGreska = setTimeout(pokaziGresku, 3000);
    });
    window.addEventListener('message', function (e) {
      if (e.source !== okvir.contentWindow || e.origin !== POREKLO || !e.data || typeof e.data !== 'object') return;
      if (e.data.tip === 'ferti-chat-spreman') {
        spreman = true;
        clearTimeout(tajmerSporo); clearTimeout(tajmerGreska);
        var bioFokus = panel.contains(document.activeElement);
        panel.classList.add('fo-spreman');
        if (bioFokus && document.activeElement !== zatvori) okvir.focus();
      } else if (e.data.tip === 'ferti-chat-zatvori') {
        zatvoriPanel();
      }
    });

    function pokaziPunEkran(da) {
      if (da) {
        panel.setAttribute('aria-modal', 'true');
        Array.prototype.forEach.call(document.body.children, function (d) {
          if (d === panel || d.tagName === 'SCRIPT' || d.tagName === 'STYLE' || d.inert) return;
          d.inert = true;
          inertni.push(d);
        });
      } else {
        panel.removeAttribute('aria-modal');
        inertni.forEach(function (d) { d.inert = false; });
        inertni = [];
      }
    }

    function otvori(izvor) {
      if (!okvir.getAttribute('src')) ucitaj();
      if (!panel.hidden) return;
      var a = document.activeElement;
      otvarac = izvor || (a && a !== document.body && !panel.contains(a) ? a : null);
      panel.hidden = false;
      document.documentElement.classList.add('fo-otvoreno');
      dugme.setAttribute('aria-expanded', 'true');
      dugme.setAttribute('aria-label', T.zatvoriDug);
      if (window.matchMedia && window.matchMedia(PUN_EKRAN).matches) pokaziPunEkran(true);
      requestAnimationFrame(function () { panel.classList.add('fo-vidljiv'); });
      setTimeout(function () { (spreman ? okvir : zatvori).focus(); }, 60);
    }
    function zatvoriPanel() {
      if (panel.hidden) return;
      var vrati = document.activeElement === okvir || panel.contains(document.activeElement) || document.activeElement === document.body;
      pokaziPunEkran(false);
      panel.classList.remove('fo-vidljiv');
      panel.hidden = true;
      document.documentElement.classList.remove('fo-otvoreno');
      dugme.setAttribute('aria-expanded', 'false');
      dugme.setAttribute('aria-label', T.otvori);
      if (vrati) {
        var cilj = otvarac && document.contains(otvarac) && otvarac.getClientRects().length ? otvarac : dugme;
        cilj.focus();
      }
      otvarac = null;
    }

    // okretanje telefona ili promena širine dok je prozor otvoren: uskladi zaključavanje strane iza
    if (window.matchMedia) {
      var mq = window.matchMedia(PUN_EKRAN);
      var naPromenu = function () { if (!panel.hidden) { pokaziPunEkran(false); if (mq.matches) pokaziPunEkran(true); } };
      if (mq.addEventListener) mq.addEventListener('change', naPromenu); else if (mq.addListener) mq.addListener(naPromenu);
    }

    dugme.addEventListener('click', function () { if (panel.hidden) otvori(dugme); else zatvoriPanel(); });
    zatvori.addEventListener('click', zatvoriPanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) zatvoriPanel();
    });
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-otvori-chat]') : null;
      if (!t || e.defaultPrevented) return;
      // Ctrl/Cmd/Shift/Alt+klik ili srednje dugme: link radi kao običan link (strana Kontakt u novoj kartici)
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      otvori(t);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', napravi);
  else napravi();
})();
