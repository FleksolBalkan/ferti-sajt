# Ferti Shop — sajt

Statičan sajt (HTML + CSS + malo JavaScript-a), bez servera i bez baze. Raspored po uzoru na velike sajtove proizvođača đubriva; tekstovi su sa Google sajta Ferti Shop-a i iz kartica znanja u aplikaciji TRANZIT.

## Kako se menja

- Tekst strane: `strane/*.html`. Svaka strana počinje redom `<!--{"naslov":"…","opis":"…"}-->`;
  neobavezno još `"dodatno"` (HTML u `<head>`, npr. JSON-LD na početnoj) i `"noindex": true` (strana 404).
- Zaglavlje, meni i podnožje (zajedničko za sve strane): `delovi/osnova.html`.
- Izgled: `staticno/css/stil.css`. Meni i tabele: `staticno/js/sajt.js`. Slike: `staticno/img/`.
- Posle izmene: `node napravi.mjs` (Node 18 ili noviji) — sklapa gotov sajt u `docs/`.
  Skripta prvo proveri sve strane; ako nešto ne valja, javi koja strana i `docs/` ostaje netaknut.

`docs/` se pri svakom sklapanju pravi iznova — ne menjati ga ručno. Fajlovi koji moraju u koren objave
(`robots.txt`, verifikacioni fajl za Google…) idu u `staticno/`. Fajl `docs/CNAME` (domen na GitHub Pages) se čuva sam.

## Asistent (oblačić)

`staticno/js/oblacic.js` — dugme „Pitajte nas” dole desno na svakoj strani. Na prvi klik otvara stranicu
`https://tranzit-eu.onrender.com/chat` (chatbot iz TRANZIT-a) u prozorčiću; na telefonu preko celog ekrana.
Adresa se menja u `delovi/osnova.html` (atribut `data-chat`). Svaki link sa atributom `data-otvori-chat` takođe
otvara razgovor (Ctrl/Shift+klik i dalje otvara stranu Kontakt). Ako server ne odgovori, prozor nudi telefone
i „Pokušaj ponovo”.

## Objava

Folder `docs/` je ceo sajt. Može na bilo koji besplatan statički hosting:
- GitHub Pages: grana `main`, folder `/docs`.
- Render Static Site: „Build command” `node napravi.mjs`, „Publish directory” `docs`.

Dve promenljive pri sklapanju (`ADRESA_SAJTA=… node napravi.mjs`):
- `ADRESA_SAJTA` — kad sajt dobije domen (npr. `https://www.primer.rs/`): dodaje canonical, og:url i sliku
  `img/og.png` za deljenje linka. Dok je prazna, ti tagovi se ne pišu.
- `BAZA` — koren sajta za stranu 404: `/` (podrazumevano) za sopstveni domen ili Render,
  `/ime-repoa/` za GitHub Pages bez domena.
