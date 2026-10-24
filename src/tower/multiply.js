// MULTIPLICATIO — gra z kursorami (klasyczna strzałka jak z Windowsa 98).
//
// Zasady:
//  • Pole gry jest podzielone na segmenty (3 × 2). Prawdziwy kursor jest w tym,
//    nad którym akurat jesteś.
//  • KLIKNIĘCIE rozmnaża kursor: klon pojawia się w kolejnym wolnym segmencie
//    i powtarza (z małym opóźnieniem) ruchy prawdziwego kursora — w tym samym
//    miejscu swojego segmentu. Klon słabnie i znika po kilku sekundach.
//  • Zwój łapie się tylko KLONEM, przytrzymując go nad zwojem przez chwilę.
//    Przed prawdziwym kursorem zwoje uciekają, więc samo machanie nic nie daje.

const COLS = 3, ROWS = 2;
const MAX_CLONES = 3;      // ile klonów naraz
const CLONE_LIFE = 9;      // sekundy życia klona
const ECHO = 0.22;         // opóźnienie powtarzania ruchu (s)
const CATCH_R = 30;        // promień chwytu klona (px)
const DWELL = 0.8;         // ile trzeba przytrzymać klona nad zwojem (s)
const FLEE_R = 150;        // od prawdziwego kursora zwoje uciekają

// strzałka Windows 98: biała z czarnym obrysem, piksel w piksel
const ARROW = `<svg viewBox="0 0 12 19" width="18" height="28.5" shape-rendering="crispEdges" aria-hidden="true">
  <path d="M0 0V16L4 12L7 18H9V17L6 11H11Z" fill="#fff" stroke="#000" stroke-width="1" stroke-linejoin="miter" vector-effect="non-scaling-stroke"/>
</svg>`;
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
      if (e.target.closest && e.target.closest('#panel, #dialog, #hud-btns, #book')) return;
      this.onMove(e);
      this.spawn();
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
    this.trail = [];       // historia ruchu prawdziwego kursora (do opóźnionego echa)
    this.clones = [];

    // siatka segmentów
    this.grid = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const g = document.createElement('div');
      g.className = 'seg';
      g.innerHTML = `<span>${ROMAN[i]}</span>`;
      this.layer.appendChild(g);
      this.grid.push(g);
    }

    // prawdziwy kursor
    this.real = document.createElement('div');
    this.real.className = 'w98 real';
    this.real.innerHTML = ARROW;
    this.layer.appendChild(this.real);

    // zwoje
    this.scrolls = [];
    for (let i = 0; i < this.count; i++) {
      if (this.caught.has(i)) continue;
      const el = document.createElement('div');
      el.className = 'scroll';
      el.innerHTML = `<b>${['⌠≡⌡', '[≡]', '⟦≡⟧', '{≡}'][i % 4]}</b><i></i>`;
      this.layer.appendChild(el);
      const s = this.seg(i % (COLS * ROWS));
      this.scrolls.push({
        i, el, bar: el.querySelector('i'),
        x: s.x + s.w * (0.25 + Math.random() * 0.5),
        y: s.y + s.h * (0.25 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120,
        t: Math.random() * 10, hold: 0,
      });
    }
    addEventListener('pointermove', this.onMove);
    addEventListener('pointerdown', this.onDown);
  }

  // kliknięcie: nowy klon w kolejnym wolnym segmencie
  spawn() {
    const here = this.segAt(this.pointer.x, this.pointer.y);
    const used = new Set(this.clones.map((c) => c.seg));
    let seg = -1;
    for (let k = 1; k < COLS * ROWS; k++) {
      const s = (here + k) % (COLS * ROWS);
      if (!used.has(s)) { seg = s; break; }
    }
    if (this.clones.length >= MAX_CLONES || seg < 0) {
      // za dużo klonów: najstarszy znika
      const old = this.clones.shift();
      old.el.remove();
      if (seg < 0) seg = old.seg;
    }
    const el = document.createElement('div');
    el.className = 'w98 clone';
    el.innerHTML = ARROW + `<em>${ROMAN[seg]}</em>`;
    this.layer.appendChild(el);
    this.clones.push({ el, seg, born: this.time, x: -99, y: -99 });
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

  // pozycja prawdziwego kursora sprzed `delay` sekund
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

    // segmenty
    const here = this.segAt(p.x, p.y);
    this.grid.forEach((g, i) => {
      const s = this.seg(i);
      g.style.cssText = `left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px`;
      g.classList.toggle('here', i === here);
      g.classList.toggle('used', this.clones.some((c) => c.seg === i));
    });
    this.real.style.transform = `translate(${p.x}px, ${p.y}px)`;

    // klony: echo ruchu w swoim segmencie
    const e = this.echo(ECHO);
    const from = this.seg(this.segAt(e.x, e.y));
    const lx = (e.x - from.x) / from.w, ly = (e.y - from.y) / from.h;
    for (let k = this.clones.length - 1; k >= 0; k--) {
      const c = this.clones[k];
      const age = this.time - c.born;
      if (age > CLONE_LIFE) { c.el.remove(); this.clones.splice(k, 1); continue; }
      const s = this.seg(c.seg);
      c.x = s.x + lx * s.w; c.y = s.y + ly * s.h;
      const same = c.seg === here; // klon w tym samym polu co ręka — uśpiony
      c.active = !same;
      const fade = age > CLONE_LIFE - 2 ? (CLONE_LIFE - age) / 2 : 1;
      c.el.style.opacity = (same ? 0.25 : 0.9) * fade * (age > CLONE_LIFE - 2 && Math.sin(age * 20) > 0 ? 0.6 : 1);
      c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
    }

    const a = this.area();
    for (let s = this.scrolls.length - 1; s >= 0; s--) {
      const o = this.scrolls[s];
      o.t += dt;
      // błądzenie
      o.vx += Math.sin(o.t * 1.3 + o.i) * 90 * dt;
      o.vy += Math.cos(o.t * 1.1 + o.i * 2) * 90 * dt;
      // ucieczka przed prawdziwym kursorem
      const rx = o.x - p.x, ry = o.y - p.y, rd = Math.hypot(rx, ry);
      if (rd < FLEE_R) {
        const f = (1 - rd / FLEE_R) * 2200;
        o.vx += (rx / (rd + 1)) * f * dt;
        o.vy += (ry / (rd + 1)) * f * dt;
      }
      // granice pola gry
      const m = 40;
      if (o.x < a.x + m) o.vx += 500 * dt; if (o.x > a.x + a.w - m) o.vx -= 500 * dt;
      if (o.y < a.y + m) o.vy += 500 * dt; if (o.y > a.y + a.h - m) o.vy -= 500 * dt;
      o.vx *= Math.exp(-dt * 1.0); o.vy *= Math.exp(-dt * 1.0);
      const sp = Math.hypot(o.vx, o.vy), max = 260;
      if (sp > max) { o.vx *= max / sp; o.vy *= max / sp; }
      o.x += o.vx * dt; o.y += o.vy * dt;

      // przytrzymanie klonem
      const over = this.clones.some((c) => c.active && Math.hypot(c.x - o.x, c.y - o.y) < CATCH_R);
      o.hold = over ? o.hold + dt : Math.max(0, o.hold - dt * 1.5);
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
