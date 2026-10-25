import { bandOrnament, flipBraille, revealBraille } from './braille.js';

// Strona tytułowa księgi: drzeworytowy inicjał, gotyckie "Portfolio",
// imię, rok rzymskimi cyframi i wici z kropek brajla.

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
  constructor(root, config, titleBand = null) {
    this.root = root;
    root.querySelector('.t-name').textContent = titleCase(config.name);
    root.querySelector('.t-role').textContent = config.role;
    root.querySelector('.t-anno').textContent = `ANNO DOMINI ${roman(new Date().getFullYear())}`;
    this.ornTop = root.querySelector('.orn-top');
    this.ornBot = root.querySelector('.orn-bot');
    this.band = titleBand || bandOrnament(44, 4);
    this.bandFlip = titleBand ? flipBraille(titleBand) : bandOrnament(44, 4, true);
    this.shown = false;
  }

  reveal() {
    if (this.shown) return;
    this.shown = true;
    this.root.classList.add('show');
    revealBraille(this.ornTop, this.band, 1.8);
    setTimeout(() => revealBraille(this.ornBot, this.bandFlip, 1.8), 1600);
  }

  showInstant() {
    this.shown = true;
    this.root.classList.add('show', 'instant');
    this.ornTop.textContent = this.band.join('\n');
    this.ornBot.textContent = this.bandFlip.join('\n');
  }

  update() {}
}
