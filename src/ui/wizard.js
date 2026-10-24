// Czarodziej ASCII — portret w panelu CRT.
// Stany: idle (mruga), talk (rusza ustami), happy, cast (iskry z laski i kapelusza).

const BODY = String.raw`
               *
              /|
             / *\
            /  . \
           / *   .\
          /________\_
       ~~=============~~
          (  @   @  )
          (    <    )
          \  \___/  /
         _\\\\|||////_
        / \\\\|||//// \
       /  / \\\|||/// \ \
      /  /   \\\|///   \ \
     /__/     \\|//     \_\
`.split('\n').slice(1, -1);

const STAFF = ['  . ', ' (@)', ' /|\\', '  | ', '  | ', '  | ', '  | ', '  | ', '  | ', '  | ', ' _|_', '-(__)', '  | ', '  | ', '  | '];

const EYES = { open: '(  @   @  )', blink: '(  -   -  )', happy: '(  ^   ^  )', wide: '(  O   O  )' };
const MOUTH = { closed: '\\  \\___/  /', open: '\\   (O)   /', smile: '\\  \\___/  /', small: '\\   ---   /' };
const SPARK = ['*', '+', '.', '\'', '`', '°'];

export class Wizard {
  constructor(el) {
    this.el = el;
    this.mood = 'idle';      // idle | talk | happy | cast
    this.talking = false;
    this.blinkT = 2;
    this.mouthT = 0;
    this.mouthOpen = false;
    this.t = 0;
    this.render();
  }

  set(mood) { this.mood = mood; }

  update(dt) {
    this.t += dt;
    this.blinkT -= dt;
    if (this.talking) {
      this.mouthT -= dt;
      if (this.mouthT <= 0) { this.mouthOpen = !this.mouthOpen; this.mouthT = 0.07 + Math.random() * 0.09; }
    } else this.mouthOpen = false;
    // ~12 fps, jak w starych menu
    this.frameT = (this.frameT || 0) + dt;
    if (this.frameT > 0.08) { this.frameT = 0; this.render(); }
  }

  render() {
    const rows = BODY.map((r) => r.split(''));
    const put = (row, str) => {
      const line = BODY[row];
      const target = row === 7 ? line.indexOf('(') : line.indexOf('\\');
      for (let i = 0; i < str.length; i++) rows[row][target + i] = str[i];
    };
    let eyes = EYES.open;
    if (this.mood === 'happy') eyes = EYES.happy;
    if (this.mood === 'cast') eyes = EYES.wide;
    if (this.blinkT < 0) { eyes = EYES.blink; if (this.blinkT < -0.12) this.blinkT = 2 + Math.random() * 3; }
    put(7, eyes);
    let mouth = this.mouthOpen ? MOUTH.open : (this.mood === 'cast' ? MOUTH.small : MOUTH.closed);
    put(9, mouth);

    let lines = rows.map((r, i) => r.join('').padEnd(25) + STAFF[i]);

    // delikatne kołysanie całej postaci
    const sway = Math.sin(this.t * 1.3) > 0.6 ? ' ' : '';
    lines = lines.map((l) => sway + l);

    // iskry przy rzucaniu czaru (orb laski i czubek kapelusza)
    if (this.mood === 'cast') {
      const grid = lines.map((l) => l.padEnd(34).split(''));
      const orbX = 26 + sway.length + 1, orbY = 1;
      for (let k = 0; k < 7; k++) {
        const x = orbX + Math.round((Math.random() - 0.5) * 7);
        const y = orbY + Math.round((Math.random() - 0.5) * 4);
        if (grid[y] && grid[y][x] === ' ') grid[y][x] = SPARK[(Math.random() * SPARK.length) | 0];
      }
      for (let k = 0; k < 3; k++) {
        const x = 15 + sway.length + Math.round((Math.random() - 0.5) * 6);
        const y = Math.round(Math.random() * 2);
        if (grid[y] && grid[y][x] === ' ') grid[y][x] = SPARK[(Math.random() * SPARK.length) | 0];
      }
      lines = grid.map((r) => r.join(''));
      const orb = lines[1];
      lines[1] = orb.replace('(@)', Math.random() > 0.5 ? '(*)' : '(@)');
    }

    // obcięcie lewego marginesu, żeby portret był zwarty
    this.el.textContent = lines.map((l) => l.slice(3)).join('\n');
  }
}
