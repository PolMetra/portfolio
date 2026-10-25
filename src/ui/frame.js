// Iluminowana rama z kropek brajla, jak bordiura w średniowiecznym rękopisie:
// wijąca się łodyga z liśćmi bluszczu, zawijasami i jagodami na włoskowatych
// szypułkach, niebieskie kwiaty, medaliony w narożnikach i tarcze z literami AJ.
// Rama dopasowuje się sama do wielkości elementu (także po zmianie okna).

import { canvasToBraille, revealBraille } from './braille.js';

const BLANK = '⠀';

// powtarzalny los: ta sama rama przy każdym wczytaniu
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spiral(ctx, cx, cy, r, turns, dir, start) {
  ctx.beginPath();
  const steps = Math.round(50 * turns);
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const a = start + dir * k * turns * Math.PI * 2;
    const rr = r * (1 - k * 0.82);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
}

// liść bluszczu: trzy ostre klapy, wypełniony
function ivy(ctx, x, y, s, ang) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 0.28, -s * 0.1);
  ctx.lineTo(s * 0.34, -s * 0.48);
  ctx.lineTo(s * 0.58, -s * 0.2);
  ctx.lineTo(s, 0);
  ctx.lineTo(s * 0.58, s * 0.2);
  ctx.lineTo(s * 0.34, s * 0.48);
  ctx.lineTo(s * 0.28, s * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function berry(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

// tarcza (kształt "żelazka"), środek w (0,0)
export function shieldPts(w, h, n = 12) {
  const x1 = w / 2, y0 = -h / 2, ym = -h / 2 + h * 0.42, yb = h / 2;
  const right = [[x1, y0], [x1, ym]];
  for (let i = 1; i <= n; i++) {
    const t = i / n, a = (1 - t) ** 2, b = 2 * (1 - t) * t, c = t * t;
    right.push([a * x1 + b * x1, a * ym + b * (yb - h * 0.1) + c * yb]);
  }
  const left = right.slice(0, -1).reverse().map(([x, y]) => [-x, y]);
  return [...right, ...left];
}

function pathPts(ctx, pts, s = 1) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)));
  ctx.closePath();
}

// jeden odcinek bordiury w układzie lokalnym: oś x wzdłuż pasa, y w poprzek (|y| ≤ hb)
function vineSegment(v, a, L, hb, R) {
  if (L < hb * 0.8) return;
  const waves = Math.max(1, Math.round(L / (hb * 2.3)));
  const wl = L / waves, A = hb * 0.3;
  v.beginPath();
  for (let x = 0; x <= L; x += 1) {
    const y = A * Math.sin((x / wl) * Math.PI);
    x ? v.lineTo(x, y) : v.moveTo(x, y);
  }
  v.stroke();
  for (let i = 0; i < waves; i++) {
    const xc = (i + 0.5) * wl, side = i % 2 ? -1 : 1, cy = side * A;
    // zawijas po zewnętrznej stronie grzbietu fali
    const r = hb * (0.26 + R() * 0.08);
    const ex = xc + wl * 0.18, ey = cy + side * hb * 0.28;
    v.beginPath(); v.moveTo(xc - wl * 0.04, cy); v.quadraticCurveTo(xc + wl * 0.06, ey + side * hb * 0.08, ex, ey); v.stroke();
    spiral(v, ex + r, ey, r, 1.3, side, Math.PI);
    // liść przy zawijasie
    ivy(v, xc - wl * 0.12, cy + side * hb * 0.08, hb * 0.48, side > 0 ? Math.PI * 0.62 : -Math.PI * 0.62);
    // po wewnętrznej stronie: kwiat albo gałązka z liśćmi i jagodami
    if (R() < 0.42) {
      const fx = xc + wl * 0.02, fy = -side * hb * 0.5, rx = hb * 0.3, ry = hb * 0.22;
      v.beginPath(); v.moveTo(xc - wl * 0.12, cy * 0.4); v.quadraticCurveTo(xc - wl * 0.1, fy, fx - rx, fy); v.stroke();
      a.beginPath(); a.ellipse(fx, fy, rx, ry, 0, 0, Math.PI * 2); a.stroke();
      a.beginPath(); a.ellipse(fx, fy, rx * 0.42, ry * 0.42, 0, 0, Math.PI * 2); a.fill();
    } else {
      const sx = xc + wl * 0.08, sy = -side * A * 0.1, tx = xc + wl * 0.3, ty = -side * hb * 0.72;
      v.beginPath(); v.moveTo(sx, sy); v.quadraticCurveTo(sx, ty, tx, ty); v.stroke();
      ivy(v, sx + (tx - sx) * 0.35, sy + (ty - sy) * 0.55, hb * 0.38, side > 0 ? -Math.PI * 0.75 : Math.PI * 0.75);
      const br = Math.max(1.6, hb * 0.07);
      berry(v, tx + br * 1.6, ty, br); berry(v, tx + br * 0.4, ty - side * br * 1.8, br); berry(v, tx + br * 3, ty + side * br * 1.2, br);
    }
    // pojedyncze jagody na włoskowatej szypułce przy węźle fali
    if (i < waves - 1) {
      const nx = (i + 1) * wl, br = Math.max(1.4, hb * 0.06);
      v.beginPath(); v.moveTo(nx, 0); v.lineTo(nx + wl * 0.06, side * hb * 0.62); v.stroke();
      berry(v, nx + wl * 0.06, side * hb * 0.62 + side * br, br);
    }
  }
}

export class IlluminatedFrame {
  constructor(host, opts = {}) {
    this.host = host;
    this.o = { band: 50, bandMobile: 32, gap: 8, seed: 11, sideShields: 'auto', ...opts };
    host.classList.add('has-ill');
    this.root = document.createElement('div');
    this.root.className = 'ill';
    this.root.setAttribute('aria-hidden', 'true');
    this.vPre = document.createElement('pre'); this.vPre.className = 'ill-v';
    this.aPre = document.createElement('pre'); this.aPre.className = 'ill-a';
    this.badges = document.createElement('div'); this.badges.className = 'ill-badges';
    this.root.append(this.vPre, this.aPre, this.badges);
    host.prepend(this.root);
    this.shown = false;
    this.key = '';
    this.schedule = () => { cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(() => this.build()); };
    new ResizeObserver(this.schedule).observe(host);
    addEventListener('resize', this.schedule);
    if (document.fonts) document.fonts.ready.then(() => { this.key = ''; this.schedule(); });
    this.build();
  }

  measure() {
    const p = document.createElement('pre');
    p.className = 'ill-v';
    p.style.cssText = 'position:absolute;visibility:hidden;inset:auto;width:auto;height:auto';
    p.textContent = '⣿'.repeat(40) + '\n' + '⣿';
    this.root.appendChild(p);
    const r = p.getBoundingClientRect();
    p.remove();
    return { cw: r.width / 40 || 6, ch: r.height / 2 || 10 };
  }

  build() {
    const { cw, ch } = this.measure();
    const bp = innerWidth <= 760 ? this.o.bandMobile : this.o.band;
    const bc = Math.max(4, Math.round(bp / cw)), br = Math.max(2, Math.round(bp / ch));
    const bx = bc * cw, by = br * ch;
    const pad = `${Math.ceil(by + this.o.gap + ch)}px ${Math.ceil(bx + this.o.gap + cw)}px`;
    if (this.host.style.padding !== pad) this.host.style.padding = pad;
    const W = this.host.clientWidth, H = this.host.clientHeight;
    const cols = Math.floor(W / cw), rows = Math.floor(H / ch);
    if (cols < bc * 2 + 4 || rows < br * 2 + 2) return;
    const key = [cols, rows, bc, br, cw.toFixed(2)].join(':');
    if (key === this.key) return;
    this.key = key;
    const ox = (W - cols * cw) / 2, oy = (H - rows * ch) / 2;
    this.root.style.cssText = `left:${ox}px;top:${oy}px;width:${cols * cw}px;height:${rows * ch}px`;

    // płótna w kropkach, rysujemy w pikselach ekranu
    const DW = cols * 2, DH = rows * 4, Wp = cols * cw, Hp = rows * ch;
    const mk = () => { const c = document.createElement('canvas'); c.width = DW; c.height = DH; const x = c.getContext('2d', { willReadFrequently: true }); x.setTransform(2 / cw, 0, 0, 4 / ch, 0, 0); x.strokeStyle = x.fillStyle = '#fff'; x.lineCap = x.lineJoin = 'round'; return x; };
    const v = mk(), a = mk();
    const lw = Math.max(cw / 2, ch / 4) * 0.95; // ok. jedna kropka
    v.lineWidth = a.lineWidth = lw;

    // tarcze: na górze i dole zawsze, po bokach gdy jest miejsce
    const shields = [];
    const sh = by * 1.16, sw = sh * 0.8;
    shields.push({ x: Wp / 2, y: by / 2, w: sw, h: sh }, { x: Wp / 2, y: Hp - by / 2, w: sw, h: sh });
    const ssw = bx * 0.98, ssh = ssw * 1.22;
    const sideOk = this.o.sideShields === true || (this.o.sideShields === 'auto' && Hp - 2 * by > ssh * 4);
    if (sideOk) shields.push({ x: bx / 2, y: Hp / 2, w: ssw, h: ssh }, { x: Wp - bx / 2, y: Hp / 2, w: ssw, h: ssh });

    // segmenty bordiury (każdy w parze lustrzanej)
    const R = rng(this.o.seed + cols * 7 + rows * 13);
    const hbT = by * 0.46, hbS = bx * 0.46;
    const gT = sw / 2 + by * 0.18, gS = sideOk ? ssh / 2 + bx * 0.18 : 0;
    const LT = Wp / 2 - gT - bx, LS = Hp / 2 - gS - by;
    const seg = (m, L, hb, seed) => {
      for (const c of [v, a]) { c.save(); c.transform(...m); }
      const r = rng(seed);
      vineSegment(v, a, L, hb, r);
      for (const c of [v, a]) c.restore();
    };
    const s1 = Math.floor(R() * 1e6), s2 = Math.floor(R() * 1e6);
    // góra i dół (prawa połowa = odbicie lewej)
    seg([1, 0, 0, 1, bx, by / 2], LT, hbT, s1);
    seg([-1, 0, 0, 1, Wp - bx, by / 2], LT, hbT, s1);
    seg([1, 0, 0, -1, bx, Hp - by / 2], LT, hbT, s1 + 1);
    seg([-1, 0, 0, -1, Wp - bx, Hp - by / 2], LT, hbT, s1 + 1);
    // boki: od narożnika do środka, lewa i prawa jak w lustrze
    seg([0, 1, -1, 0, bx / 2, by], LS, hbS, s2);
    seg([0, -1, -1, 0, bx / 2, Hp - by], LS, hbS, s2 + 1);
    seg([0, 1, 1, 0, Wp - bx / 2, by], LS, hbS, s2);
    seg([0, -1, 1, 0, Wp - bx / 2, Hp - by], LS, hbS, s2 + 1);

    // narożne medaliony z rozetą
    const rr = Math.min(bx, by) * 0.42;
    for (const [cx, cy] of [[bx / 2, by / 2], [Wp - bx / 2, by / 2], [bx / 2, Hp - by / 2], [Wp - bx / 2, Hp - by / 2]]) {
      a.beginPath(); a.arc(cx, cy, rr, 0, Math.PI * 2); a.stroke();
      for (let k = 0; k < 6; k++) {
        const ang = k * Math.PI / 3 + Math.PI / 6;
        a.save(); a.translate(cx, cy); a.rotate(ang);
        a.beginPath(); a.moveTo(rr * 0.2, 0); a.quadraticCurveTo(rr * 0.5, -rr * 0.24, rr * 0.72, 0); a.quadraticCurveTo(rr * 0.5, rr * 0.24, rr * 0.2, 0); a.fill();
        a.restore();
      }
      berry(a, cx, cy, Math.max(1.6, rr * 0.12));
      v.save(); v.globalCompositeOperation = 'destination-out'; v.beginPath(); v.arc(cx, cy, rr + 3, 0, Math.PI * 2); v.fill(); v.restore();
    }

    // obrys tarcz (wypełnienie i litery robi HTML)
    for (const s of shields) {
      const pts = shieldPts(s.w, s.h);
      a.save(); a.translate(s.x, s.y);
      pathPts(a, pts, 1.12); a.stroke();
      a.restore();
      v.save(); v.globalCompositeOperation = 'destination-out'; v.translate(s.x, s.y); pathPts(v, pts, 1.3); v.fill(); v.restore();
      a.save(); a.globalCompositeOperation = 'destination-out'; a.translate(s.x, s.y); pathPts(a, pts, 0.98); a.fill(); a.restore();
    }

    // cienka linia wzdłuż wewnętrznej krawędzi
    v.save(); v.lineWidth = lw * 0.9;
    v.strokeRect(bx - 1, by - 1, Wp - 2 * bx + 2, Hp - 2 * by + 2);
    v.restore();
    // środek ramy zostaje pusty
    v.save(); v.globalCompositeOperation = 'destination-out'; v.fillRect(bx + 2, by + 2, Wp - 2 * bx - 4, Hp - 2 * by - 4); v.restore();

    const vRows = canvasToBraille(v, DW, DH, 100);
    const aRows = canvasToBraille(a, DW, DH, 100);
    // kwiaty, medaliony i tarcze mają pierwszeństwo przed łodygą
    this.vRows = vRows.map((r, y) => [...r].map((ch, x) => (aRows[y][x] !== BLANK ? BLANK : ch)).join(''));
    this.aRows = aRows;

    // tarcze w HTML: kobaltowe pole i litery AJ
    this.badges.innerHTML = '';
    for (const s of shields) {
      const pts = shieldPts(s.w, s.h);
      const b = document.createElement('div');
      b.className = 'ill-shield';
      b.style.cssText = `left:${s.x - s.w / 2}px;top:${s.y - s.h / 2}px;width:${s.w}px;height:${s.h}px;font-size:${s.h * 0.44}px;` +
        `clip-path:polygon(${pts.map(([x, y]) => `${((x / s.w + 0.5) * 100).toFixed(1)}% ${((y / s.h + 0.5) * 100).toFixed(1)}%`).join(',')})`;
      b.innerHTML = '<span>A</span><span>J</span>';
      this.badges.appendChild(b);
    }

    if (this.shown && !this.revealing) this.paint();
  }

  paint() {
    if (!this.vRows) return;
    this.vPre.textContent = this.vRows.join('\n');
    this.aPre.textContent = this.aRows.join('\n');
  }

  reveal(duration = 2.2) {
    this.shown = true;
    this.root.classList.add('show');
    if (!this.vRows) return;
    this.revealing = true;
    Promise.all([revealBraille(this.vPre, this.vRows, duration), revealBraille(this.aPre, this.aRows, duration * 0.8)])
      .then(() => { this.revealing = false; this.paint(); });
  }

  showInstant() {
    this.shown = true;
    this.root.classList.add('show', 'instant');
    this.paint();
  }
}
