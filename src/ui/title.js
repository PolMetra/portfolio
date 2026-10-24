// Napis PORTFOLIO z blokowych znaków + imię i rola.
// Litery pojawiają się kolumna po kolumnie z "glitchem".

const FONT = {
  P: ['████ ', '█   █', '████ ', '█    ', '█    '],
  O: [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
  R: ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
  T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
  F: ['█████', '█    ', '████ ', '█    ', '█    '],
  L: ['█    ', '█    ', '█    ', '█    ', '█████'],
  I: ['███', ' █ ', ' █ ', ' █ ', '███'],
};

export function blockText(word) {
  const rows = ['', '', '', '', ''];
  [...word].forEach((ch, i) => {
    const g = FONT[ch] || FONT.I;
    for (let r = 0; r < 5; r++) rows[r] += (i ? ' ' : '') + g[r];
  });
  return rows;
}

const GLITCH = '▓▒░#%&@$';

export class Title {
  constructor(root, config) {
    this.root = root;
    this.logo = root.querySelector('.title-logo');
    this.nameEl = root.querySelector('.title-name');
    this.roleEl = root.querySelector('.title-role');
    this.rows = blockText('PORTFOLIO');
    this.width = this.rows[0].length;
    this.name = config.name;
    this.role = config.role;
    this.progress = -1;
  }

  reveal() {
    this.root.classList.add('show');
    this.progress = 0;
  }

  showInstant() {
    this.root.classList.add('show');
    this.progress = 1.0001;
    this.draw();
  }

  update(dt) {
    if (this.progress < 0 || this.progress > 1) return;
    this.progress = Math.min(1.0001, this.progress + dt / 2.2);
    this.draw();
  }

  draw() {
    const p = Math.min(1, this.progress);
    const col = Math.floor(p * (this.width + 6));
    const out = this.rows.map((row) =>
      [...row].map((ch, x) => {
        if (x < col - 6) return ch;
        if (x < col) return ch === ' ' ? ' ' : GLITCH[(Math.random() * GLITCH.length) | 0];
        return ' ';
      }).join(''));
    this.logo.textContent = out.join('\n');
    const np = Math.max(0, (this.progress - 0.55) / 0.45);
    const n = Math.floor(np * this.name.length);
    this.nameEl.textContent = this.name.slice(0, n) + (np < 1 && np > 0 ? '█' : '');
    this.roleEl.textContent = np >= 1 ? `[ ${this.role} ]` : '';
  }
}
