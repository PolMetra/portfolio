// MULTIPLICATIO — gra z kursorami (klasyczna strzałka jak z Windowsa 98).
//
// Zasady:
//  • Pole gry jest podzielone na kafelki (3 × 2).
//  • KLIKNIĘCIE stawia kopię kursora w tym kafelku, w który klikasz
//    (ponowne kliknięcie w ten sam kafelek ją zabiera).
//  • Gdy prawdziwy kursor jest w innym kafelku, każda kopia powtarza jego ruchy
//    w swoim kafelku, w tym samym miejscu (z lekkim opóźnieniem).
//  • Uskrzydlony zwój łapie się kopią, przytrzymując ją nad nim przez chwilę.
//    Przed prawdziwym kursorem zwoje odlatują, więc samo machanie nic nie daje.

const COLS = 3, ROWS = 2;
const MAX_CLONES = 3;      // ile kopii naraz
const ECHO = 0.12;         // opóźnienie powtarzania ruchu (s)
const CATCH_R = 52;        // promień chwytu kopii (px)
const GLOW_R = 90;         // od tej odległości zwój zaczyna świecić
const DWELL = 0.5;         // ile trzeba przytrzymać kopię nad zwojem (s)
const FLEE_R = 130;        // od prawdziwego kursora zwoje odlatują

// strzałka Windows 98: biała z czarnym obrysem, piksel w piksel
const ARROW = `<svg viewBox="0 0 12 19" width="18" height="28.5" shape-rendering="crispEdges" aria-hidden="true">
  <path d="M0 0V16L4 12L7 18H9V17L6 11H11Z" fill="#fff" stroke="#000" stroke-width="1" stroke-linejoin="miter" vector-effect="non-scaling-stroke"/>
</svg>`;
// małe skrzydełko (lewe; prawe to odbicie w CSS)
const WING = `<svg viewBox="0 0 22 14" width="22" height="14" aria-hidden="true"><path d="M22 8C17 1 9 0 0 2c4 1 6 3 7 5-3 0-5 1-6 3 4-1 7 0 9 2 1-2 3-3 5-3-1 2-1 3 0 5 2-3 5-4 7-6z" fill="currentColor"/></svg>`;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export class MultiplyGame {
  constructor(layer, { count, onCatch, onDone }) {
    this.layer = layer;
    this.count = count;
    this.onCatch = onCatch;
    this.onDone = onDone;
    this.running = false;
    this.pointer = { x: innerWidth * 0.3, y: innerHeight * 0.4 };
    this.rightBound = null;
    this.onMove = (e) => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; };
    this.onDown = (e) => {
      if (!this.running) return;
      if (e.target.closest && e.target.closest('#panel, #dialog, #hud-btns, #book, #tower-nav')) return;
      this.onMove(e);
      this.toggleClone(this.segAt(e.clientX, e.clientY));
    };
  }

  area() {
    const right = this.rightBound ? this.rightBound() : innerWidth;
    return { x: 0, y: 50, w: Math.max(200, right), h: innerHeight - 50 };
  }

  seg(i) {
    const a = this.area();
    const w = a.w / COLS, h = a.h / ROWS;
    return { x: a.x + (i % COLS) * w, y: a.y + Math.floor(i / COLS) * h, w, h };
  }

  segAt(x, y) {
    const a = this.area();
    const c = Math.min(COLS - 1, Math.max(0, Math.floor((x - a.x) / (a.w / COLS))));
    const r = Math.min(ROWS - 1, Math.max(0, Math.floor((y - a.y) / (a.h / ROWS))));
    return r * COLS + c;
  }

  start(alreadyCaught = new Set()) {
    this.layer.innerHTML = '';
    this.layer.classList.add('on');
    this.running = true;
    this.caught = new Set(alreadyCaught);
    this.time = 0;
    this.trail = [];
    this.clones = [];

    this.grid = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const g = document.createElement('div');
      g.className = 'seg';
      g.innerHTML = `<span>${ROMAN[i]}</span><em>kliknij, by postawić kopię</em>`;
      this.layer.appendChild(g);
      this.grid.push(g);
    }

    this.real = document.createElement('div');
    this.real.className = 'w98 real';
    this.real.innerHTML = ARROW;
    this.layer.appendChild(this.real);

    // uskrzydlone zwoje, każdy w innym kafelku
    this.scrolls = [];
    const free = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    let k = 0;
    for (let i = 0; i < this.count; i++) {
      if (this.caught.has(i)) continue;
      const el = document.createElement('div');
      el.className = 'scroll';
      el.innerHTML = `<span class="wing l">${WING}</span><b>⌠≡⌡</b><span class="wing r">${WING}</span><i></i>`;
      el.style.setProperty('--flap', `${0.28 + Math.random() * 0.12}s`);
      this.layer.appendChild(el);
      const s = this.seg(free[k++ % free.length]);
      this.scrolls.push({
        i, el, bar: el.querySelector('i'),
        x: s.x + s.w * (0.3 + Math.random() * 0.4),
        y: s.y + s.h * (0.3 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
        t: Math.random() * 10, hold: 0,
      });
    }
    addEventListener('pointermove', this.onMove);
    addEventListener('pointerdown', this.onDown);
  }

  // kliknięcie w kafelek: postaw tam kopię albo ją zabierz
  toggleClone(seg) {
    const at = this.clones.findIndex((c) => c.seg === seg);
    if (at >= 0) { this.clones[at].el.remove(); this.clones.splice(at, 1); this.flashSeg(seg); return; }
    if (this.clones.length >= MAX_CLONES) { const old = this.clones.shift(); old.el.remove(); }
    const el = document.createElement('div');
    el.className = 'w98 clone';
    el.innerHTML = ARROW + `<em>${ROMAN[seg]}</em>`;
    this.layer.appendChild(el);
    this.clones.push({ el, seg, x: -99, y: -99 });
    this.flashSeg(seg);
  }

  flashSeg(i) {
    const g = this.grid[i];
    g.classList.remove('pulse'); void g.offsetWidth; g.classList.add('pulse');
  }

  stop() {
    this.running = false;
    removeEventListener('pointermove', this.onMove);
    removeEventListener('pointerdown', this.onDown);
    this.layer.classList.remove('on');
    setTimeout(() => { if (!this.running) this.layer.innerHTML = ''; }, 600);
  }

  echo(delay) {
    const target = this.time - delay;
    for (let i = this.trail.length - 1; i >= 0; i--) if (this.trail[i].t <= target) return this.trail[i];
    return this.trail[0] || { x: this.pointer.x, y: this.pointer.y };
  }

  update(dt) {
    if (!this.running) return;
    this.time += dt;
    const p = this.pointer;
    this.trail.push({ t: this.time, x: p.x, y: p.y });
    while (this.trail.length > 2 && this.trail[0].t < this.time - 1) this.trail.shift();

    const here = this.segAt(p.x, p.y);
    this.grid.forEach((g, i) => {
      const s = this.seg(i);
      g.style.cssText = `left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px`;
      g.classList.toggle('here', i === here);
      g.classList.toggle('used', this.clones.some((c) => c.seg === i));
    });
    this.real.style.transform = `translate(${p.x}px, ${p.y}px)`;

    // kopie: powtarzają ruch w swoim kafelku
    const e = this.echo(ECHO);
    const from = this.seg(this.segAt(e.x, e.y));
    const lx = (e.x - from.x) / from.w, ly = (e.y - from.y) / from.h;
    for (const c of this.clones) {
      const s = this.seg(c.seg);
      c.x = s.x + lx * s.w; c.y = s.y + ly * s.h;
      c.active = c.seg !== here; // kopia w tym samym kafelku co ręka śpi
      c.el.style.opacity = c.active ? 0.95 : 0.25;
      c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
    }

    const a = this.area();
    for (let s = this.scrolls.length - 1; s >= 0; s--) {
      const o = this.scrolls[s];
      o.t += dt;
      // spokojne krążenie
      o.vx += Math.sin(o.t * 1.1 + o.i) * 50 * dt;
      o.vy += Math.cos(o.t * 0.9 + o.i * 2) * 50 * dt;
      // odlot przed prawdziwym kursorem
      const rx = o.x - p.x, ry = o.y - p.y, rd = Math.hypot(rx, ry);
      if (rd < FLEE_R) {
        const f = (1 - rd / FLEE_R) * 1500;
        o.vx += (rx / (rd + 1)) * f * dt;
        o.vy += (ry / (rd + 1)) * f * dt;
      }
      const m = 50;
      if (o.x < a.x + m) o.vx += 400 * dt; if (o.x > a.x + a.w - m) o.vx -= 400 * dt;
      if (o.y < a.y + m) o.vy += 400 * dt; if (o.y > a.y + a.h - m) o.vy -= 400 * dt;
      o.vx *= Math.exp(-dt * 1.4); o.vy *= Math.exp(-dt * 1.4);
      const sp = Math.hypot(o.vx, o.vy), max = 190;
      if (sp > max) { o.vx *= max / sp; o.vy *= max / sp; }
      o.x += o.vx * dt; o.y += o.vy * dt;

      // najbliższa aktywna kopia: poświata i przytrzymanie
      let near = Infinity;
      for (const c of this.clones) if (c.active) near = Math.min(near, Math.hypot(c.x - o.x, c.y - o.y));
      const over = near < CATCH_R;
      const glow = Math.max(0, 1 - near / GLOW_R);
      o.hold = over ? o.hold + dt : Math.max(0, o.hold - dt * 1.5);
      o.el.style.setProperty('--glow', glow.toFixed(2));
      o.el.classList.toggle('held', over);
      o.bar.style.width = `${Math.min(100, (o.hold / DWELL) * 100)}%`;
      o.el.style.transform = `translate(${o.x}px, ${o.y}px)`;

      if (o.hold >= DWELL) {
        this.caught.add(o.i);
        o.el.classList.add('caught');
        const el = o.el;
        setTimeout(() => el.remove(), 700);
        this.scrolls.splice(s, 1);
        this.onCatch(o.i, o.x, o.y);
      }
    }
    if (this.scrolls.length === 0) { this.stop(); this.onDone(); }
  }
}
