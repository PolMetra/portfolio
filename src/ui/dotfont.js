// Krój z kropek połączonych przewężkami (jak w matrycy punktowej, gdzie sąsiednie
// kropki zlewają się w kreskę). Siatka 5 × 7, dwa wiersze nad literą na akcenty.
// Rysowany na płótnie: drawDotText(canvas, 'PROTOKÓŁ M3RLIN', { pitch, color }).

const G = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['111', '010', '010', '010', '010', '010', '111'],
  J: ['00111', '00001', '00001', '00001', '00001', '10001', '01110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  Ł: ['01000', '01000', '01010', '01100', '11000', '01000', '01111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  Ó: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
};
// akcenty: kropki w dwóch wierszach nad literą [wiersz -2..-1, kolumna]
const ACCENT = { Ó: [[-2, 3], [-1, 2]] };

// zamienia tekst na listę kropek [x, y] w jednostkach siatki
export function layoutDots(text) {
  const dots = [];
  let x = 0;
  for (const ch of text.toUpperCase()) {
    const g = G[ch] || G[' '];
    g.forEach((row, y) => [...row].forEach((b, i) => { if (b === '1') dots.push([x + i, y + 2]); }));
    for (const [ay, ax] of ACCENT[ch] || []) dots.push([x + ax, ay + 2]);
    x += g[0].length + 1;
  }
  return { dots, cols: Math.max(0, x - 1), rows: 9 };
}

// rysuje kropki z przewężkami do sąsiadów; `k` (0..1) odsłania kolumny od lewej
export function drawDotText(canvas, lines, { pitch = 8, color = '#ece5d3', shadow = null, k = 1, lineGap = 1 } = {}) {
  const L = (Array.isArray(lines) ? lines : [lines]).map(layoutDots);
  const cols = Math.max(...L.map((l) => l.cols)), rows = L.length * 9 + (L.length - 1) * lineGap;
  const dpr = Math.min(2, devicePixelRatio || 1), pad = 4;
  const w = cols * pitch + pad * 2, h = rows * pitch + pad * 2;
  if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  const all = [];
  L.forEach((l, li) => l.dots.forEach(([x, y]) => all.push([x, y + li * (9 + lineGap)])));
  const on = new Set(all.map(([x, y]) => x + ',' + y));
  const has = (x, y) => on.has(x + ',' + y);
  const lim = cols * k;
  const paint = (ox, oy, col) => {
    c.fillStyle = c.strokeStyle = col;
    c.lineCap = 'round';
    c.lineWidth = pitch * 0.5;
    const P = (v) => pad + (v + 0.5) * pitch;
    for (const [x, y] of all) {
      if (x > lim) continue;
      c.beginPath(); c.arc(P(x) + ox, P(y) + oy, pitch * 0.42, 0, Math.PI * 2); c.fill();
      // przewężki: w prawo, w dół, a po skosie tylko gdy nie ma drogi prostej
      const links = [[1, 0], [0, 1]];
      if (!has(x + 1, y) && !has(x, y + 1)) links.push([1, 1]);
      if (!has(x - 1, y) && !has(x, y + 1)) links.push([-1, 1]);
      for (const [dx, dy] of links) {
        if (!has(x + dx, y + dy) || x + dx > lim) continue;
        if (dx && dy && (has(x + dx, y) || has(x, y + dy))) continue;
        c.beginPath(); c.moveTo(P(x) + ox, P(y) + oy); c.lineTo(P(x + dx) + ox, P(y + dy) + oy); c.stroke();
      }
    }
  };
  if (shadow) paint(pitch * 0.35, pitch * 0.35, shadow);
  paint(0, 0, color);
  return { w, h, cols };
}
