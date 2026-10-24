# Wieża Portfolio

Interaktywne portfolio 3D: gotycka księga, surowe ASCII i druk kobaltowy na scenie w rozdzielczości PS2. Gość trafia na wzburzone morze,
czarodziej ARKANUS uczy go rysować błyskawice, a energia burzy wyrywa z głębin
wieżę z napisem PORTFOLIO.

## Uruchomienie lokalne

Moduły ES nie działają z `file://`, więc potrzebny jest mały serwer:

```bash
python3 -m http.server 8000
# potem otwórz http://localhost:8000
```

## GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
Strona będzie pod `https://<użytkownik>.github.io/portfolio/`.

## Gdzie co zmienić

| Co | Gdzie |
|---|---|
| Imię, rola, link do ArtStation, imię czarodzieja | `src/config.js` |
| Pikseloza (wysokość renderu), ile trzeba narysować | `src/config.js` |
| Własny model zamku (.glb) | `src/config.js` → `castleModel` (obiekt o nazwie `Crystal` stanie się piorunochronem) |
| Dialogi i scenariusz | `src/main.js` (sekcja SCENARIUSZ) |
| Czarodziej (bryła 3D przeliczana na znaki) | `src/ui/wizard.js` |
| Strona tytułowa księgi | `index.html` (#title), `src/ui/title.js` |
| Ornamenty z kropek brajla | `src/ui/braille.js` |
| Nakładki techniczne (dane burzy, dziennik) | `src/ui/hud.js` |
| Morze / niebo (shadery) | `src/scene/ocean.js`, `src/scene/sky.js` |
| Paleta kobaltowa, dithering, bloom | `src/scene/post.js` |
| Kolory, kroje, układ | `style.css` |

## Struktura

```
index.html
style.css
src/
  config.js        ← Twoje dane
  main.js          ← scena, stany, scenariusz, pętla
  audio.js         ← proceduralny dźwięk (bez plików)
  scene/           ← ocean, niebo, zamek, błyskawice, deszcz, post-processing
  ui/              ← czarodziej ASCII, okno dialogowe, napis tytułowy
```

## Następne rozdziały (plan)

- Kryształowa kula — przeglądanie projektów
- Transmutacja — breakdown (wireframe → clay → final)
- Multiplikacja — klonowanie kursora, odsłania umiejętności
- Przywołanie — kontakt

## Kroje pisma

Hostowane lokalnie w `assets/fonts` (licencja SIL Open Font License):
UnifrakturMaguntia, Grenze Gotisch, IM Fell English SC, IBM Plex Mono.
