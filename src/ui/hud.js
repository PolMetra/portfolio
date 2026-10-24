// Surowe "techniczne" nakładki: dane burzy, dziennik zdarzeń, współrzędne kursora.

const pad = (n, l = 3) => String(Math.round(n)).padStart(l, '0');
const dots = (label, value, width = 24) => label + ' ' + '.'.repeat(Math.max(2, width - label.length - String(value).length)) + ' ' + value;

export class Hud {
  constructor() {
    this.stats = document.getElementById('hud-stats');
    this.logEl = document.getElementById('hud-log');
    this.coords = document.getElementById('hud-coords');
    this.chapter = document.getElementById('hud-chapter');
    this.bolts = 0;
    this.lines = [];
    this.acc = 1;
    this.wind = 22;
    addEventListener('pointermove', (e) => {
      if (this.coords) this.coords.textContent = `X ${pad(e.clientX, 4)} · Y ${pad(e.clientY, 4)}`;
    });
  }

  clock() {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
  }

  log(msg) {
    this.lines.unshift(`${this.clock()}  ${msg}`);
    this.lines.length = Math.min(this.lines.length, 9);
    this.logEl.innerHTML = this.lines.map((l, i) => `<div style="opacity:${(1 - i / 10).toFixed(2)}">${l}</div>`).join('');
  }

  bolt(where) {
    this.bolts++;
    this.log(`BŁYSKAWICA ${pad(this.bolts)} → ${where}`);
  }

  setChapter(s) { this.chapter.textContent = s; }

  update(dt, { charge, wave, flash }) {
    this.acc += dt;
    if (this.acc < 0.25) return;
    this.acc = 0;
    this.wind += (Math.random() - 0.5) * 2;
    this.wind = Math.max(14, Math.min(34, this.wind));
    this.stats.textContent = [
      'TEMPESTAS / BURZA',
      '────────────────────────',
      dots('FULMINA', pad(this.bolts)),
      dots('VENTUS', `NW ${this.wind.toFixed(1)} KT`),
      dots('UNDA', `${wave.toFixed(2)} M`),
      dots('VIS', `${Math.round(charge * 100)}%`),
      dots('LUX', flash > 0.3 ? '▮▮▮' : flash > 0.08 ? '▮▯▯' : '▯▯▯'),
      dots('HORA', this.clock()),
    ].join('\n');
  }
}
