// EVOCATIO — gracz rysuje jednym ruchem zamknięty krąg przywołania.
// Sprawdzamy: czy kształt jest zamknięty, okrągły i dość duży.

export class RuneCanvas {
  constructor(canvas, { onResult }) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.onResult = onResult;
    this.pts = [];
    this.active = false;
    this.drawing = false;
    this.glow = 0;
    this.resize();
    addEventListener('resize', () => this.resize());
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      e.stopPropagation();
      canvas.setPointerCapture(e.pointerId);
      this.drawing = true; this.pts = [[e.clientX, e.clientY]]; this.glow = 0;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.drawing) return;
      const l = this.pts[this.pts.length - 1];
      if (Math.hypot(e.clientX - l[0], e.clientY - l[1]) > 3) this.pts.push([e.clientX, e.clientY]);
    });
    const up = () => {
      if (!this.drawing) return;
      this.drawing = false;
      const r = this.judge();
      this.result = r;
      this.onResult(r);
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }

  resize() {
    this.c.width = Math.round(innerWidth / 2);   // połowa rozdzielczości = pikselowa kreska
    this.c.height = Math.round(innerHeight / 2);
  }

  show() { this.active = true; this.pts = []; this.result = null; this.c.classList.add('on'); }
  hide() { this.active = false; this.c.classList.remove('on'); }

  judge() {
    const p = this.pts;
    if (p.length < 12) return { ok: false, why: 'short' };
    let cx = 0, cy = 0;
    p.forEach(([x, y]) => { cx += x; cy += y; });
    cx /= p.length; cy /= p.length;
    const rs = p.map(([x, y]) => Math.hypot(x - cx, y - cy));
    const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
    const sd = Math.sqrt(rs.reduce((a, r) => a + (r - mean) ** 2, 0) / rs.length);
    const gap = Math.hypot(p[0][0] - p[p.length - 1][0], p[0][1] - p[p.length - 1][1]);
    // ile kąta obiegło
    let sweep = 0;
    for (let i = 1; i < p.length; i++) {
      let d = Math.atan2(p[i][1] - cy, p[i][0] - cx) - Math.atan2(p[i - 1][1] - cy, p[i - 1][0] - cx);
      if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      sweep += d;
    }
    const turns = Math.abs(sweep) / (Math.PI * 2);
    if (mean < 60) return { ok: false, why: 'small' };
    if (turns < 0.85 || gap > mean * 0.6) return { ok: false, why: 'open' };
    if (sd / mean > 0.28) return { ok: false, why: 'crooked' };
    return { ok: true, cx, cy, r: mean };
  }

  update(dt, t) {
    const ctx = this.ctx, k = 0.5;
    ctx.clearRect(0, 0, this.c.width, this.c.height);
    if (!this.active && this.glow <= 0) return;
    ctx.strokeStyle = '#ece5d3';
    ctx.lineWidth = 2;
    ctx.lineCap = 'square';
    ctx.beginPath();
    this.pts.forEach(([x, y], i) => {
      const j = this.drawing ? (Math.random() - 0.5) * 1.2 : 0;
      i ? ctx.lineTo(x * k + j, y * k + j) : ctx.moveTo(x * k, y * k);
    });
    ctx.stroke();
    // udany krąg: runy wokół i drugi pierścień
    if (this.result && this.result.ok) {
      this.glow = Math.min(1, this.glow + dt * 1.5);
      const { cx, cy, r } = this.result;
      ctx.globalAlpha = this.glow;
      ctx.beginPath(); ctx.arc(cx * k, cy * k, r * k * 0.82, 0, Math.PI * 2); ctx.stroke();
      ctx.font = `${Math.round(r * k * 0.16)}px monospace`;
      ctx.fillStyle = '#ece5d3';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ';
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 + t * 0.4;
        ctx.fillText(runes[i], cx * k + Math.cos(a) * r * k * 0.91, cy * k + Math.sin(a) * r * k * 0.91);
      }
      // siedmioramienna gwiazda {7/3}
      ctx.beginPath();
      for (let i = 0; i <= 7; i++) {
        const a = -Math.PI / 2 + (i * 3 * Math.PI * 2) / 7 + t * 0.2;
        const x = cx * k + Math.cos(a) * r * k * 0.78, y = cy * k + Math.sin(a) * r * k * 0.78;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
