import * as THREE from 'three';
import { AsciiView } from '../ui/ascii.js';

// Kruk-posłaniec: bryła 3D przeliczana na znaki (jak czarodziej).
// Krąży po wolnej części ekranu, dopóki gość nie wyśle listu;
// potem chwyta list i odlatuje za krawędź ekranu.

const ink = new THREE.MeshLambertMaterial({ color: 0xe6e6e6, flatShading: true, side: THREE.DoubleSide });
const dark = new THREE.MeshLambertMaterial({ color: 0xa8a8a8, flatShading: true, side: THREE.DoubleSide });
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const paper = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

// skrzydło w płaszczyźnie XZ: x = rozpiętość od barku, y = cięciwa (dodatnie = przód)
function poly(points) {
  const sh = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  const g = new THREE.ShapeGeometry(sh);
  g.rotateX(Math.PI / 2); // krawędź natarcia do przodu (+z), lotki do tyłu
  return g;
}
const INNER = [[0, 0.34], [1.0, 0.3], [1.0, -0.34], [0.78, -0.5], [0.55, -0.4], [0.3, -0.52], [0, -0.42]];
// dłoń z pięcioma rozcapierzonymi lotkami
const OUTER = [[0, 0.3], [0.5, 0.27], [0.95, 0.12], [1.42, -0.12], [1.16, -0.14], [1.34, -0.32], [1.06, -0.27],
  [1.16, -0.48], [0.9, -0.38], [0.94, -0.6], [0.7, -0.45], [0.66, -0.62], [0.45, -0.46], [0.2, -0.44], [0, -0.34]];

function buildRaven() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // tułów: wydłużona elipsoida
  const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), ink);
  torso.scale.set(0.72, 0.62, 1.35);
  body.add(torso);
  // głowa + dziób
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), ink);
  head.position.set(0, 0.16, 0.78);
  body.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.46, 4), dark);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.1, 1.15);
  body.add(beak);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), eyeMat);
    eye.position.set(s * 0.2, 0.24, 0.92);
    body.add(eye);
  }
  // ogon: wachlarz
  const tailShape = new THREE.Shape();
  tailShape.moveTo(-0.12, 0); tailShape.lineTo(0.12, 0); tailShape.lineTo(0.38, -0.85);
  tailShape.lineTo(0.12, -0.75); tailShape.lineTo(0, -0.9); tailShape.lineTo(-0.12, -0.75); tailShape.lineTo(-0.38, -0.85);
  const tailG = new THREE.ShapeGeometry(tailShape); tailG.rotateX(Math.PI / 2);
  const tail = new THREE.Mesh(tailG, dark);
  tail.position.set(0, 0.02, -0.6);
  body.add(tail);

  // skrzydła: ramię + dłoń (dwa segmenty, żeby machanie było miękkie)
  const wings = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.28, 0.12, 0.1);
    shoulder.scale.x = side;
    body.add(shoulder);
    const inner = new THREE.Mesh(poly(INNER), ink);
    shoulder.add(inner);
    const elbow = new THREE.Group();
    elbow.position.x = 0.95;
    shoulder.add(elbow);
    const outer = new THREE.Mesh(poly(OUTER), dark);
    elbow.add(outer);
    wings.push({ shoulder, elbow });
  }

  // list w szponach (pokazywany przy odlocie)
  const letter = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.38), paper);
  letter.position.set(0, -0.45, 0.2);
  letter.rotation.x = -0.3;
  letter.visible = false;
  body.add(letter);

  return { root, body, wings, head, tail, letter };
}

export class Raven {
  constructor(el, renderer, { cols = 64, rows = 34 } = {}) {
    this.el = el;
    this.cols = cols; this.rows = rows;
    this.view = new AsciiView(renderer, cols, rows, { lo: 0.06, span: 0.7 });
    this.scene = new THREE.Scene();
    // kamera lekko z góry — widać płaszczyzny skrzydeł, nie tylko ich krawędzie
    this.camera = new THREE.PerspectiveCamera(34, (cols * 0.6) / rows, 0.1, 40);
    this.camera.position.set(0, 4.9, 5.0);
    this.camera.lookAt(0, 0, 0);
    const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(1, 6, 2); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(-3, 1, -2); this.scene.add(rim);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    this.r = buildRaven();
    this.scene.add(this.r.root);

    this.active = false;
    this.state = 'off';    // off | arrive | circle | depart
    this.t = 0;
    this.acc = 0;
    this.x = -300; this.y = 200; this.vx = 0; this.vy = 0;
    this.bounds = () => ({ left: 0, right: innerWidth, top: 0, bottom: innerHeight });
  }

  summon() {
    this.active = true;
    this.state = 'arrive';
    this.t = 0;
    this.r.letter.visible = false;
    const b = this.bounds();
    this.x = b.left - 200; this.y = b.top + 80;
    this.el.classList.add('on');
  }

  // odlot z listem; resolve po zniknięciu za ekranem
  depart() {
    if (!this.active) return Promise.resolve();
    this.state = 'depart';
    this.t = 0;
    this.r.letter.visible = true;
    // zabezpieczenie: przy słabym sprzęcie kruk może lecieć wolniej, więc chowamy go najpóźniej po 3 s
    clearTimeout(this.goneTimer);
    this.goneTimer = setTimeout(() => { if (this.state === 'depart') this.hide(); }, 3000);
    return new Promise((res) => { this.onGone = res; });
  }

  hide() {
    this.active = false;
    this.state = 'off';
    this.el.classList.remove('on');
    this.el.textContent = '';
    if (this.onGone) { const f = this.onGone; this.onGone = null; f(); }
  }

  update(dt, time) {
    if (!this.active) return;
    this.t += dt;
    const b = this.bounds();
    const cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2;
    const rx = Math.max(60, (b.right - b.left) / 2 - this.cols * 4.5), ry = Math.max(40, (b.bottom - b.top) / 2 - this.rows * 6);

    // cel ruchu
    let tx, ty, speed = 3;
    if (this.state === 'arrive' || this.state === 'circle') {
      // ósemka (krzywa Lissajous) po wolnej części ekranu
      const a = this.t * 0.45;
      tx = cx + Math.sin(a) * rx;
      ty = cy + Math.sin(a * 2) * ry * 0.6 - ry * 0.15;
      if (this.state === 'arrive' && this.t > 2.5) this.state = 'circle';
      speed = this.state === 'arrive' ? 1.6 : 2.2;
    } else if (this.state === 'depart') {
      tx = b.right + 400; ty = b.top - 300; speed = 2.6 + this.t * 3;
    }
    const px = this.x, py = this.y;
    this.x += (tx - this.x) * Math.min(1, dt * speed);
    this.y += (ty - this.y) * Math.min(1, dt * speed);
    this.vx = (this.x - px) / Math.max(dt, 1e-3);
    this.vy = (this.y - py) / Math.max(dt, 1e-3);
    if (this.state === 'depart' && (this.x > innerWidth + 50 || this.y < -this.rows * 14)) { this.hide(); return; }

    // poza: zwrot w stronę lotu, przechył na zakrętach, machanie skrzydłami
    const r = this.r;
    // zawsze ujęcie 3/4: dziób w stronę lotu, ale nigdy idealnie bokiem ani tyłem
    if (Math.abs(this.vx) > 15) this.facing = Math.sign(this.vx);
    const yawGoal = (this.facing || 1) * 0.6;
    r.root.rotation.y += (yawGoal - r.root.rotation.y) * Math.min(1, dt * 3);
    r.root.rotation.z += (-Math.tanh(this.vx / 600) * 0.18 - r.root.rotation.z) * Math.min(1, dt * 3);
    r.root.rotation.x += ((Math.tanh(this.vy / 400) * 0.25) - r.root.rotation.x) * Math.min(1, dt * 3);
    const climbing = this.vy < -40 || this.state === 'depart';
    const rate = climbing ? 11 : 7;
    const ph = time * rate;
    const flap = Math.sin(ph);
    for (const w of r.wings) {
      w.shoulder.rotation.z = flap * 0.6 + 0.15;
      w.elbow.rotation.z = Math.sin(ph - 0.9) * 0.45;
    }
    r.body.position.y = -flap * 0.12;
    r.head.rotation.y = Math.sin(time * 1.7) * 0.25;
    r.tail.rotation.x = Math.sin(time * 2.3) * 0.12;

    this.el.style.transform = `translate(${Math.round(this.x)}px, ${Math.round(this.y)}px) translate(-50%, -50%)`;

    this.acc += dt;
    if (this.acc < 1 / 15) return;
    this.acc = 0;
    this.el.textContent = this.view.render(this.scene, this.camera).join('\n');
  }
}
