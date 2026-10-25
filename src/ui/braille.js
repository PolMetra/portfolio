// Ornamenty z kropek brajla: rysujemy wić roślinną na ukrytym płótnie,
// a potem każdy blok 2×4 piksele zamieniamy na jeden znak brajla (U+2800).

const BITS = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]];

export function canvasToBraille(ctx, w, h, threshold = 110) {
  const data = ctx.getImageData(0, 0, w, h).data;
  const rows = [];
  for (let y = 0; y < h; y += 4) {
    let line = '';
    for (let x = 0; x < w; x += 2) {
      let code = 0;
      for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 2; dx++) {
        const px = x + dx, py = y + dy;
        if (px < w && py < h && data[(py * w + px) * 4 + 3] > threshold) code |= BITS[dy][dx];
      }
      line += code ? String.fromCharCode(0x2800 + code) : '⠀';
    }
    rows.push(line);
  }
  return rows;
}

function spiral(ctx, cx, cy, r, turns, dir = 1, start = 0) {
  ctx.beginPath();
  const steps = 60 * turns;
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const a = start + dir * k * turns * Math.PI * 2;
    const rr = r * (1 - k * 0.85);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
}

function leaf(ctx, x, y, len, ang) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.35, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.35, 0, 0);
  ctx.stroke();
  ctx.restore();
}

// pozioma wić: rozeta w środku, po bokach falujący pęd z zawijasami
function drawBand(ctx, W, H) {
  const cx = W / 2, cy = H / 2;
  ctx.lineWidth = 1.15;
  ctx.strokeStyle = '#fff';
  // rozeta
  ctx.beginPath(); ctx.arc(cx, cy, H * 0.16, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 4; i++) leaf(ctx, cx, cy, H * 0.42, i * Math.PI / 2 + Math.PI / 4);
  for (const s of [1, -1]) {
    ctx.save();
    ctx.translate(cx, 0); ctx.scale(s, 1); ctx.translate(-cx, 0);
    // pęd
    ctx.beginPath();
    const x0 = cx + H * 0.5, x1 = W - 4;
    for (let x = x0; x <= x1; x += 1) {
      const k = (x - x0) / (x1 - x0);
      const y = cy + Math.sin(k * Math.PI * 3) * H * 0.18 * (1 - k * 0.5);
      x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    // zawijasy na grzbietach fali
    for (let j = 0; j < 3; j++) {
      const k = (j + 0.25) / 3;
      const x = x0 + k * (x1 - x0);
      const up = j % 2 === 0 ? -1 : 1;
      spiral(ctx, x + H * 0.12, cy + up * H * 0.22, H * 0.2 * (1 - k * 0.35), 1.4, up, up > 0 ? -Math.PI / 2 : Math.PI / 2);
      leaf(ctx, x - H * 0.08, cy - up * H * 0.12, H * 0.28, up * -0.9 + Math.PI);
    }
    // zakończenie
    spiral(ctx, x1 - H * 0.14, cy, H * 0.14, 1.2, 1, Math.PI);
    ctx.restore();
  }
}

// pionowa wić (jak u inspiracji): łodyga z zawijasami na zmianę po bokach
function drawVine(ctx, W, H) {
  ctx.lineWidth = 1.15;
  ctx.strokeStyle = '#fff';
  const cx = W / 2;
  ctx.beginPath();
  for (let y = 4; y < H - 4; y++) {
    const x = cx + Math.sin(y / H * Math.PI * 4) * W * 0.12;
    y === 4 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  const n = Math.max(2, Math.floor(H / (W * 0.9)));
  for (let i = 0; i < n; i++) {
    const y = (i + 0.5) / n * H;
    const side = i % 2 ? 1 : -1;
    const x = cx + Math.sin(y / H * Math.PI * 4) * W * 0.12;
    spiral(ctx, x + side * W * 0.24, y, W * 0.22, 1.5, side, side > 0 ? Math.PI : 0);
    leaf(ctx, x, y + W * 0.15, W * 0.3, side > 0 ? Math.PI * 0.75 : Math.PI * 0.25);
  }
  spiral(ctx, cx + W * 0.1, 10, W * 0.25, 1.6, 1, Math.PI);
}

function render(cols, rows, draw, flip = false) {
  const W = cols * 2, H = rows * 4;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (flip) { ctx.translate(0, H); ctx.scale(1, -1); }
  draw(ctx, W, H);
  return canvasToBraille(ctx, W, H);
}

export const bandOrnament = (cols = 46, rows = 4, flip = false) => render(cols, rows, drawBand, flip);
export const vineOrnament = (cols = 8, rows = 40) => render(cols, rows, drawVine);

// odbicie góra-dół gotowego ornamentu (kolejność wierszy i kropki w każdym znaku)
export function flipBraille(rows) {
  return rows.slice().reverse().map((r) => [...r].map((ch) => {
    const c = ch.charCodeAt(0) - 0x2800;
    if (c < 0 || c > 0xff) return ch;
    let o = 0;
    for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 2; dx++) if (c & BITS[dy][dx]) o |= BITS[3 - dy][dx];
    return String.fromCharCode(0x2800 + o);
  }).join(''));
}

// stopniowe "wyrysowanie" ornamentu: znaki pojawiają się w losowej kolejności
export function revealBraille(el, rows, duration = 1.6) {
  const cells = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '⠀') cells.push([y, x]); }));
  cells.sort(() => Math.random() - 0.5);
  const grid = rows.map((r) => [...r].map(() => '⠀'));
  const t0 = performance.now();
  return new Promise((res) => {
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / (duration * 1000));
      const n = Math.floor(k * cells.length);
      for (let i = 0; i < n; i++) { const [y, x] = cells[i]; grid[y][x] = rows[y][x]; }
      el.textContent = grid.map((r) => r.join('')).join('\n');
      if (k < 1) requestAnimationFrame(step); else res();
    };
    step();
  });
}
