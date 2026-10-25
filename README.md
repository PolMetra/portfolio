# Wieża Portfolio

Interaktywne portfolio 3D: gotycka księga, surowe ASCII i druk kobaltowy na scenie w rozdzielczości PS2. Gość trafia na wzburzone morze,
czarodziej M3rlin uczy go rysować błyskawice, a energia burzy wyrywa z głębin
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
| Projekty, umiejętności, o mnie, kontakt | `src/config.js` |
| Dialogi i scenariusz | `src/main.js` (morze), `src/tower/index.js` (wieża) |
| Komnata wieży (3D) | `src/tower/room.js` |
| Czarodziej (bryła 3D przeliczana na znaki) | `src/ui/wizard.js` |
| Strona tytułowa księgi | `index.html` (#title), `src/ui/title.js` |
| Iluminowane ramy (strona tytułowa, księga czarów) | `src/ui/frame.js` (grubość pasa: `band`, wzór: `seed`, tarcze AJ: `shields: true`) |
| Animacja kryształu obrastanego korzeniami (ekran startowy) | `src/ui/roots.js` |
| Ornamenty z kropek brajla | `src/ui/braille.js` (generator), `src/ui/ornaments.js` (własne wzory) |
| Kuźnia Ornamentów: rysowanie ornamentów z lustrem | `tools/ornament.html` (otwórz w przeglądarce, skopiuj tablicę JS do `src/ui/ornaments.js`) |
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

## Rozdziały (Księga Czarów)

| # | Rozdział | Jak działa |
|---|---|---|
| I | Burza | rysowanie błyskawic wynurza wieżę |
| II | Projekty | kryształowa kula, strzałki, kliknięcie = wpatrzenie się |
| III | Etapy pracy | suwak siatka → glina → gotowy model (w prawdziwych kolorach) |
| IV | Umiejętności | kliknięcie stawia kopię kursora (Win98) w wybranym kafelku; z innego kafelka kopia powtarza ruchy; uskrzydlony zwój łapie się, przytrzymując kopię nad nim |
| V | O mnie | przytrzymanie przedmiotu na biurku unosi go i odsłania fragment |
| VI | Kontakt | czarodziej przywołuje kruka ASCII, który krąży, dopóki nie wyślesz listu |

Każdy czar odpieczętowuje następny, a postęp jest zapamiętywany w przeglądarce.
„Zdejmij wszystkie pieczęcie” w księdze otwiera wszystko od razu (dla zabieganych).

## Jak dodać swoje projekty

1. Wrzuć pliki do `assets/projects/` (model `.glb`, rendery `.jpg`/`.webp`).
2. W `src/config.js` → `projects` uzupełnij tytuł, rok, opis i narzędzia,
   wpisz `model: 'assets/projects/nazwa.glb'` i `images: ['assets/projects/nazwa-1.jpg', …]`.
3. Transmutacja zadziała z każdym modelem automatycznie (drut i glina są generowane z jego geometrii).
   Model jest sam skalowany do kuli. Pilnuj rozmiaru: najlepiej do ~5 MB na model (Draco / tekstury 2K).

## Kroje pisma

Hostowane lokalnie w `assets/fonts` (licencja SIL Open Font License):
UnifrakturMaguntia, Grenze Gotisch, IM Fell English SC, IBM Plex Mono.
