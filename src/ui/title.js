import { IlluminatedFrame } from './frame.js';

// Strona tytułowa księgi: drzeworytowy inicjał, gotyckie "Portfolio",
// imię, rola i rok rzymskimi cyframi w iluminowanej ramie.

function roman(n) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

// "IMIĘ NAZWISKO" -> "Imię Nazwisko" (wersaliki w gotyku są nieczytelne)
function titleCase(s) {
  return s.toLocaleLowerCase('pl').replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase('pl'));
}

export class Title {
  constructor(root, config) {
    this.root = root;
    root.querySelector('.t-name').textContent = titleCase(config.name);
    root.querySelector('.t-role').textContent = config.role;
    root.querySelector('.t-anno').textContent = `ANNO DOMINI ${roman(new Date().getFullYear())}`;
    this.frame = new IlluminatedFrame(root.querySelector('.page'), { band: 46, bandMobile: 28, seed: 3 });
    this.shown = false;
  }

  reveal() {
    if (this.shown) return;
    this.shown = true;
    this.root.classList.add('show');
    this.frame.reveal(2.4);
  }

  showInstant() {
    this.shown = true;
    this.root.classList.add('show', 'instant');
    this.frame.showInstant();
  }

  update() {}
}
