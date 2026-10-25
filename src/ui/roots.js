// Ekran startowy: magiczny kryształ, który obrastają korzenie. Wszystko z kropek brajla.
// Najpierw rysuje się obrys kryształu, potem z dołu wyrastają korzenie: rozchodzą się
// pod kryształem, wspinają po jego krawędziach i przerastają ściany. Na koniec kryształ
// mieni się spokojnie, dopóki ekran startowy nie zniknie.

import { canvasToBraille } from './braille.js';

const BLANK = '⠀';
const COLS = 36, ROWS = 15;
const GROW_START = 0.7, SPEED = 0.62; // start korzeni (s), prędkość wzrostu (wysokości kadru na sekundę)

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// równomierne próbkowanie łamanej co `step` px
function resample(pts, step) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const d = Math.hypot(bx - ax, by - ay);
    let s = step - carry;
    while (s <= d) { out.push([ax + (bx - ax) * (s / d), ay + (by - ay) * (s / d)]); s += step; }
    carry = d - (s - step);
  }
  return out;
}

export class CrystalRoots {
  constructor(el) {
    this.el = el;
    this.rootsPre = el.querySelector('.br-roots');
    this.crystalPre = el.querySelector('.br-crystal');
    this.running = false;
  }

  measure() {
    const p = this.rootsPre;
    p.textContent = '⣿'.repeat(COLS) + '\n' + '⣿';
    const r = p.getBoundingClientRect();
    return { cw: r.width / COLS || 7.8, ch: r.height / 2 || 13 };
  }

  setup() {
    const { cw, ch } = this.measure();
    this.cw = cw; this.ch = ch;
    const Wp = COLS * cw, Hp = ROWS * ch, u = Hp, cx = Wp / 2;
    this.Wp = Wp; this.Hp = Hp; this.u = u;
    const mk = () => {
      const c = document.createElement('canvas');
      c.width = COLS * 2; c.height = ROWS * 4;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.lineCap = x.lineJoin = 'round';
      x.strokeStyle = x.fillStyle = '#fff';
      return x;
    };
    this.rc = mk(); this.cc = mk(); this.sc = mk();
    this.toPx = [2 / cw, 0, 0, 4 / ch, 0, 0];
    this.dot = Math.max(cw / 2, ch / 4);

    // kryształ: wydłużony sześciokąt z fasetami
    const w = 0.21 * u, ridge = cx - 0.06 * u;
    this.crystal = {
      outline: [[cx, 0.03 * u], [cx + w, 0.22 * u], [cx + w, 0.6 * u], [cx, 0.8 * u], [cx - w, 0.6 * u], [cx - w, 0.22 * u], [cx, 0.03 * u]],
      facets: [
        [[cx, 0.03 * u], [ridge, 0.24 * u], [ridge, 0.62 * u], [cx, 0.8 * u]],
        [[cx - w, 0.22 * u], [ridge, 0.24 * u]],
        [[cx - w, 0.6 * u], [ridge, 0.62 * u]],
      ],
      face: [[cx, 0.03 * u], [ridge, 0.24 * u], [ridge, 0.62 * u], [cx, 0.8 * u], [cx + w, 0.6 * u], [cx + w, 0.22 * u]],
    };
    this.outlineLen = resample(this.crystal.outline, 1).length;

    // korzenie: łamane z czasem startu
    const R = rng(1789);
    const paths = [];
    const add = (pts, t0, width) => { const p = resample(pts, 1.5); paths.push({ pts: p, t0, width }); return p; };

    // 1) korzenie spod kryształu: rozchodzą się w dół i na boki, rozgałęziają
    const walk = (x, y, ang, len, t0, width, depth) => {
      const pts = [[x, y]];
      let a = ang;
      const steps = Math.round(len / 2.5);
      for (let i = 0; i < steps; i++) {
        a += (R() - 0.5) * 0.5;
        if (y > Hp - 4) a += (Math.cos(a) >= 0 ? -1 : 1) * 0.25 * Math.sign(Math.sin(a)); // przy dnie skręca w bok
        x += Math.cos(a) * 2.5; y += Math.sin(a) * 2.5;
        y = Math.min(y, Hp - 1.5);
        if (x < 2 || x > Wp - 2) break;
        pts.push([x, y]);
        if (depth < 2 && i > 4 && R() < 0.07) {
          const s = R() < 0.5 ? -1 : 1;
          walk(x, y, a + s * (0.5 + R() * 0.5), len * (0.35 + R() * 0.3), t0 + (i * 2.5) / (SPEED * u), Math.max(0.7, width * 0.7), depth + 1);
        }
      }
      add(pts, t0, width);
    };
    const n = 7;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1) - 0.5;
      walk(cx + k * 0.06 * u, 0.8 * u, Math.PI / 2 - k * 2.6, u * (0.45 + R() * 0.45), GROW_START + R() * 0.25, 1, 0);
    }

    // 2) korzenie pnące: z ziemi do krawędzi kryształu i w górę, z falowaniem przez krawędź
    const o = this.crystal.outline;
    const climb = (side, frac, t0, phase) => {
      const s = side; // -1 lewa, 1 prawa
      const base = [cx + s * (0.36 + R() * 0.1) * u, Hp - 2];
      const lower = s < 0 ? o[4] : o[2], upper = s < 0 ? o[5] : o[1], top = o[0];
      const end = [upper[0] + (top[0] - upper[0]) * frac, upper[1] + (top[1] - upper[1]) * frac];
      const raw = resample([base, [lower[0] + s * 0.06 * u, lower[1] + 0.12 * u], lower, upper, end], 1.5);
      const pts = raw.map(([x, y], i) => {
        const ramp = Math.min(1, i / 12);
        const wob = (Math.sin(i * 0.16 + phase) * 0.055 + s * 0.02) * u * ramp; // falą przechodzi przez krawędź
        return [x + wob, y];
      });
      add(pts, t0, 0.85);
      // zawijasy i odnóżki przerastające ścianę kryształu
      const tt = (i) => t0 + (i * 1.5) / (SPEED * u);
      for (let j = 0; j < 3; j++) {
        const i = Math.floor(pts.length * (0.45 + j * 0.17));
        if (!pts[i]) continue;
        const [x, y] = pts[i];
        const curl = [];
        const r = 0.035 * u + R() * 0.02 * u, dir = -s;
        for (let q = 0; q <= 28; q++) {
          const kk = q / 28, a = Math.PI + (s < 0 ? 0 : Math.PI) + dir * kk * Math.PI * 2.2;
          const rr = r * (1 - kk * 0.8);
          curl.push([x - s * r + Math.cos(a) * rr * -s, y + Math.sin(a) * rr]);
        }
        add([[x, y], ...curl], tt(i), 0.7);
        if (j === 1) {
          // odnóżka w poprzek ściany
          const dx = -s * (0.16 + R() * 0.08) * u;
          add([[x, y], [x + dx * 0.5, y - 0.03 * u], [x + dx, y + 0.02 * u]], tt(i) + 0.1, 0.7);
        }
      }
    };
    climb(-1, 0.55, GROW_START + 0.35, 0);
    climb(1, 0.8, GROW_START + 0.5, 1.7);
    climb(1, 0.2, GROW_START + 0.95, 4.4);
    this.paths = paths;
    this.growEnd = Math.max(...paths.map((p) => p.t0 + (p.pts.length * 1.5) / (SPEED * u)));
    this.sparks = [];
  }

  drawCrystal(t) {
    const c = this.cc, sc = this.sc;
    for (const x of [c, sc]) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, x.canvas.width, x.canvas.height); }
    // obrys rysuje się w 0.8 s
    c.setTransform(...this.toPx);
    c.lineWidth = this.dot * 1.1;
    const o = resample(this.crystal.outline, 1);
    const m = Math.floor(o.length * Math.min(1, t / 0.8));
    c.beginPath();
    for (let i = 0; i < m; i++) i ? c.lineTo(o[i][0], o[i][1]) : c.moveTo(o[i][0], o[i][1]);
    c.stroke();
    if (t < 0.6) return;
    const fa = Math.min(1, (t - 0.6) / 0.5);
    c.globalAlpha = fa;
    for (const f of this.crystal.facets) { c.beginPath(); f.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
    c.globalAlpha = 1;
    // mieniąca się jasna ściana: ukośne pasma kropek przesuwają się w górę
    const path = new Path2D();
    this.crystal.face.forEach(([x, y], i) => { const X = x * this.toPx[0], Y = y * this.toPx[3]; i ? path.lineTo(X, Y) : path.moveTo(X, Y); });
    path.closePath();
    const W = sc.canvas.width, H = sc.canvas.height, ph = Math.floor(t * 9);
    if (fa > 0.5) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!sc.isPointInPath(path, x + 0.5, y + 0.5)) continue;
        const band = (x + (H - y) + ph) % 7;
        if (band === 0 || (band === 1 && (x + y) % 2 === 0)) sc.fillRect(x, y, 1, 1);
      }
    }
    // iskry wokół kryształu
    if (t > this.growEnd * 0.6) {
      if (Math.random() < 0.18) {
        const cx = this.Wp / 2, u = this.u, a = Math.random() * Math.PI * 2, r = 0.24 * u + Math.random() * 0.12 * u;
        this.sparks.push({ x: (cx + Math.cos(a) * r * 1.3) * this.toPx[0], y: (0.4 * u + Math.sin(a) * r) * this.toPx[3], life: 0.5 });
      }
      for (const s of this.sparks) {
        const X = Math.round(s.x), Y = Math.round(s.y);
        sc.fillRect(X, Y, 1, 1);
        if (s.life > 0.25) { sc.fillRect(X - 1, Y, 1, 1); sc.fillRect(X + 1, Y, 1, 1); sc.fillRect(X, Y - 1, 1, 1); sc.fillRect(X, Y + 1, 1, 1); }
        s.life -= 1 / 30;
      }
      this.sparks = this.sparks.filter((s) => s.life > 0);
    }
  }

  drawRoots(t) {
    const c = this.rc;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    c.setTransform(...this.toPx);
    const per = 1.5 / (SPEED * this.u);
    for (const p of this.paths) {
      const m = Math.min(p.pts.length, Math.floor((t - p.t0) / per));
      if (m < 2) continue;
      c.lineWidth = this.dot * 0.8 * p.width;
      c.beginPath();
      for (let i = 0; i < m; i++) i ? c.lineTo(p.pts[i][0], p.pts[i][1]) : c.moveTo(p.pts[i][0], p.pts[i][1]);
      c.stroke();
    }
  }

  frame(t) {
    this.drawCrystal(t);
    this.drawRoots(t);
    const W = COLS * 2, H = ROWS * 4;
    const roots = canvasToBraille(this.rc, W, H, 100);
    const edge = canvasToBraille(this.cc, W, H, 100);
    const glow = canvasToBraille(this.sc, W, H, 100);
    // obrys kryształu zawsze na wierzchu, korzenie przykrywają tylko blask ściany
    this.rootsPre.textContent = roots.map((r, y) => [...r].map((ch, x) => (edge[y][x] !== BLANK ? BLANK : ch)).join('')).join('\n');
    this.crystalPre.textContent = edge.map((r, y) => [...r].map((ch, x) => (ch !== BLANK ? ch : roots[y][x] !== BLANK ? BLANK : glow[y][x])).join('')).join('\n');
  }

  start() {
    this.setup();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.frame(this.growEnd + 1); return this; }
    this.running = true;
    const t0 = performance.now();
    let last = 0;
    const loop = (now) => {
      if (!this.el.isConnected) { this.running = false; return; }
      if (now - last > 33) { last = now; this.frame((now - t0) / 1000); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return this;
  }
}
