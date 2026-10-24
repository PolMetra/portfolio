// MULTIPLICATIO — kursor rozmnaża się w kalejdoskop (6 kopii wokół środka ekranu).
// Zwoje uciekają przed prawdziwym kursorem, więc łapać trzeba klonami.

const CLONES = 6;
const CATCH_R = 30;
const FLEE_R = 170;

export class MultiplyGame {
  constructor(layer, { count, onCatch, onDone }) {
    this.layer = layer;
    this.count = count;
    this.onCatch = onCatch;
    this.onDone = onDone;
    this.running = false;
    this.pointer = { x: innerWidth / 2 + 120, y: innerHeight / 2 };
    this.onMove = (e) => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; };
  }

  start(alreadyCaught = new Set()) {
    this.layer.innerHTML = '';
    this.layer.classList.add('on');
    this.running = true;
    this.caught = new Set(alreadyCaught);
    // klony kursora
    this.clones = [];
    for (let i = 0; i < CLONES; i++) {
      const c = document.createElement('div');
      c.className = 'clone' + (i === 0 ? ' real' : '');
      c.textContent = i === 0 ? '✛' : '✛';
      this.layer.appendChild(c);
      this.clones.push({ el: c, x: 0, y: 0 });
    }
    // zwoje
    this.scrolls = [];
    for (let i = 0; i < this.count; i++) {
      if (this.caught.has(i)) continue;
      const el = document.createElement('div');
      el.className = 'scroll';
      el.textContent = ['⌠≡⌡', '[≡]', '⟦≡⟧', '{≡}'][i % 4];
      this.layer.appendChild(el);
      const a = Math.random() * Math.PI * 2;
      this.scrolls.push({
        i, el,
        x: innerWidth * 0.4 + Math.cos(a) * innerWidth * 0.22,
        y: innerHeight / 2 + Math.sin(a) * innerHeight * 0.3,
        vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80,
        t: Math.random() * 10,
      });
    }
    addEventListener('pointermove', this.onMove);
    addEventListener('pointerdown', this.onMove);
  }

  stop() {
    this.running = false;
    removeEventListener('pointermove', this.onMove);
    removeEventListener('pointerdown', this.onMove);
    this.layer.classList.remove('on');
    setTimeout(() => { if (!this.running) this.layer.innerHTML = ''; }, 600);
  }

  update(dt, t) {
    if (!this.running) return;
    const W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2;
    // kalejdoskop: obrót pozycji kursora wokół środka ekranu
    const dx = this.pointer.x - cx, dy = this.pointer.y - cy;
    this.clones.forEach((c, k) => {
      const a = (k / CLONES) * Math.PI * 2;
      const wob = k ? Math.sin(t * 3 + k) * 4 : 0;
      c.x = cx + dx * Math.cos(a) - dy * Math.sin(a) + wob;
      c.y = cy + dx * Math.sin(a) + dy * Math.cos(a) + wob;
      c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
    });

    for (let s = this.scrolls.length - 1; s >= 0; s--) {
      const o = this.scrolls[s];
      o.t += dt;
      // błądzenie
      o.vx += Math.sin(o.t * 1.3 + o.i) * 60 * dt;
      o.vy += Math.cos(o.t * 1.1 + o.i * 2) * 60 * dt;
      // ucieczka przed prawdziwym kursorem
      const rx = o.x - this.pointer.x, ry = o.y - this.pointer.y;
      const rd = Math.hypot(rx, ry);
      if (rd < FLEE_R) {
        const f = (1 - rd / FLEE_R) * 1600;
        o.vx += (rx / (rd + 1)) * f * dt;
        o.vy += (ry / (rd + 1)) * f * dt;
      }
      // trzymaj się z dala od krawędzi
      const m = 60;
      const right = this.rightBound ? this.rightBound() : W;
      if (o.x < m) o.vx += 400 * dt; if (o.x > right - m) o.vx -= 600 * dt;
      if (o.y < m + 40) o.vy += 400 * dt; if (o.y > H - m) o.vy -= 400 * dt;
      o.vx *= Math.exp(-dt * 1.2); o.vy *= Math.exp(-dt * 1.2);
      const sp = Math.hypot(o.vx, o.vy), max = 340;
      if (sp > max) { o.vx *= max / sp; o.vy *= max / sp; }
      o.x += o.vx * dt; o.y += o.vy * dt;
      o.el.style.transform = `translate(${o.x}px, ${o.y}px)`;

      // złapanie przez klon (nie przez prawdziwy kursor)
      for (let k = 1; k < this.clones.length; k++) {
        const c = this.clones[k];
        if (Math.hypot(c.x - o.x, c.y - o.y) < CATCH_R) {
          this.caught.add(o.i);
          o.el.classList.add('caught');
          const el = o.el;
          setTimeout(() => el.remove(), 700);
          this.scrolls.splice(s, 1);
          this.onCatch(o.i, o.x, o.y);
          break;
        }
      }
    }
    if (this.scrolls.length === 0) { this.stop(); this.onDone(); }
  }
}
