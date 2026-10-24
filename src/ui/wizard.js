import * as THREE from 'three';

// Czarodziej jako prawdziwa bryła 3D, renderowana do maleńkiej tekstury
// i zamieniana na znaki — jak sylwetka ze znaków B / S / c.
// Gdy zrobisz własny model czarodzieja, podmień buildWizard() na GLTFLoader:
// shader ASCII zadziała z każdą bryłą.

const RAMP = ['.', '.', ':', 'c', 'o', 's', 'S', '$', 'B'];
const CELL_ASPECT = 0.6; // szerokość/wysokość znaku przy line-height: 1

const cloth = new THREE.MeshLambertMaterial({ color: 0xb8b8b8, flatShading: true, side: THREE.DoubleSide });
const skin = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
const hair = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
const wood = new THREE.MeshLambertMaterial({ color: 0x9a9a9a, flatShading: true });
const orbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

function along(mesh, len) { // cylinder/stożek od (0,0,0) wzdłuż +X
  mesh.geometry.rotateZ(-Math.PI / 2);
  mesh.geometry.translate(len / 2, 0, 0);
  return mesh;
}

function buildWizard() {
  const root = new THREE.Group();

  // szata — bryła obrotowa z fałdami
  const prof = [[0, 0], [0.38, 0], [0.37, 0.06], [0.3, 0.5], [0.24, 0.95], [0.21, 1.25], [0.18, 1.42], [0.11, 1.53], [0, 1.56]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const robeGeo = new THREE.LatheGeometry(prof, 22);
  const base = robeGeo.attributes.position.array.slice();
  const robe = new THREE.Mesh(robeGeo, cloth);
  root.add(robe);

  // kaptur / kołnierz
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 5, 10), cloth);
  collar.rotation.x = Math.PI / 2; collar.position.y = 1.52;
  root.add(collar);

  const headG = new THREE.Group();
  headG.position.y = 1.6;
  root.add(headG);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), skin);
  head.position.y = 0.08;
  headG.add(head);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 4), skin);
  nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.07, 0.12);
  headG.add(nose);

  // broda — długa, do pasa
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.75, 7), hair);
  beard.geometry.rotateX(Math.PI); beard.geometry.translate(0, -0.36, 0);
  beard.position.set(0, 0.02, 0.07);
  headG.add(beard);
  // włosy z tyłu
  const locks = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 7), hair);
  locks.geometry.rotateX(Math.PI); locks.geometry.translate(0, -0.2, 0);
  locks.position.set(0, 0.05, -0.05);
  headG.add(locks);

  // kapelusz: szerokie rondo + wygięty stożek
  const hat = new THREE.Group();
  hat.position.y = 0.16;
  headG.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.025, 14), cloth);
  brim.rotation.x = 0.12;
  hat.add(brim);
  const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 9, 1, true), cloth);
  cone1.geometry.translate(0, 0.21, 0);
  hat.add(cone1);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 7), cloth);
  tip.geometry.translate(0, 0.16, 0);
  tip.position.y = 0.36; tip.rotation.z = -0.55; tip.rotation.x = -0.25;
  hat.add(tip);

  // ramię wskazujące (prawe, w stronę +X)
  const armR = new THREE.Group();
  armR.position.set(0.17, 1.42, 0.02);
  root.add(armR);
  const sleeveR = along(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.06, 0.5, 8, 1, true), cloth), 0.5);
  armR.add(sleeveR);
  const drape = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6, 1, true), cloth); // zwisający rękaw
  drape.geometry.rotateX(Math.PI); drape.geometry.translate(0, -0.2, 0);
  drape.position.set(0.4, -0.05, 0);
  armR.add(drape);
  const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 0), skin);
  hand.position.set(0.54, 0, 0);
  armR.add(hand);
  const finger = along(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.11, 4), skin), 0.11);
  finger.position.set(0.56, 0.01, 0);
  armR.add(finger);

  // ramię z laską (lewe)
  const armL = new THREE.Group();
  armL.position.set(-0.17, 1.42, 0.02);
  root.add(armL);
  const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 0.55, 8, 1, true), cloth);
  sleeveL.geometry.translate(0, -0.27, 0);
  sleeveL.rotation.z = -0.35; sleeveL.rotation.x = -0.35;
  armL.add(sleeveL);

  const staff = new THREE.Group();
  staff.position.set(-0.36, 0, 0.2);
  root.add(staff);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 2.15, 5), wood);
  pole.position.y = 1.07;
  staff.add(pole);
  const knot = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 4, 8), wood);
  knot.position.y = 2.17; knot.rotation.y = 0.6;
  staff.add(knot);
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), orbMat);
  orb.position.y = 2.17;
  staff.add(orb);

  return { root, robe, robeGeo, base, headG, beard, hat, armR, staff, orb };
}

export class Wizard {
  constructor(el, renderer, { cols = 66, rows = 80 } = {}) {
    this.el = el;
    this.renderer = renderer;
    this.cols = cols; this.rows = rows;
    this.mood = 'idle';
    this.talking = false;
    this.flash = 0;
    this.t = 0;
    this.acc = 0;
    this.armAngle = -1.15;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(31.5, (cols * CELL_ASPECT) / rows, 0.1, 50);
    this.camera.position.set(0.22, 1.3, 4.9);
    this.camera.lookAt(0.22, 1.27, 0);

    // mocne światło boczne = wyraźny podział na B (światło) i . (cień)
    this.key = new THREE.DirectionalLight(0xffffff, 3.2);
    this.key.position.set(3, 2.5, 1.5);
    this.scene.add(this.key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.18);
    fill.position.set(-3, 0.5, 2);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.6);
    rim.position.set(-2, 2, -3);
    this.scene.add(rim);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.06));

    this.w = buildWizard();
    this.scene.add(this.w.root);

    // 2× supersampling: każdy znak to średnia z 2×2 pikseli
    this.rt = new THREE.WebGLRenderTarget(cols * 2, rows * 2, { depthBuffer: true });
    this.px = new Uint8Array(cols * 2 * rows * 2 * 4);
  }

  set(mood) { this.mood = mood; }

  animate(dt) {
    const t = (this.t += dt);
    const w = this.w;
    // powolny obrót, jak na obrotowym postumencie
    w.root.rotation.y = 0.25 + Math.sin(t * 0.35) * 0.3;
    w.root.position.y = Math.sin(t * 1.1) * 0.006;

    // ramię: opuszczone (idle) / wskazuje (talk) / w górę (cast)
    let target = -1.1;
    if (this.mood === 'happy') target = 0.1;
    if (this.mood === 'point') target = 0.25;
    if (this.mood === 'cast') target = 0.95 + Math.sin(t * 9) * 0.05;
    if (this.talking && this.mood === 'idle') target = -0.15 + Math.sin(t * 2.2) * 0.12;
    this.armAngle += (target - this.armAngle) * Math.min(1, dt * 4);
    w.armR.rotation.z = this.armAngle;
    w.armR.rotation.y = -0.25;

    // głowa: mówienie = kiwanie
    const nod = this.talking ? Math.sin(t * 13) * 0.05 + Math.sin(t * 5.3) * 0.03 : 0;
    w.headG.rotation.x = 0.08 + nod;
    w.headG.rotation.z = Math.sin(t * 0.7) * 0.04;
    w.beard.rotation.z = Math.sin(t * 1.9) * 0.06;
    w.beard.rotation.x = Math.sin(t * 1.3) * 0.05 - nod * 0.5;
    w.hat.rotation.z = Math.sin(t * 1.5 + 1) * 0.04;

    // szata faluje na wietrze
    const p = w.robeGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const bx = w.base[i * 3], by = w.base[i * 3 + 1], bz = w.base[i * 3 + 2];
      const low = Math.max(0, 1 - by / 1.2);
      const ang = Math.atan2(bz, bx);
      const fold = 1 + Math.sin(ang * 7) * 0.05 * low;
      p.setXYZ(i, bx * fold + Math.sin(t * 2.4 + by * 3) * 0.035 * low, by, bz * fold + Math.cos(t * 2 + by * 2.5) * 0.02 * low);
    }
    p.needsUpdate = true;

    // kula na lasce: świeci przy rzucaniu czaru
    const glow = this.mood === 'cast' ? 1.6 + Math.random() * 1.2 : 1 + this.flash;
    w.orb.scale.setScalar(glow);
    this.key.intensity = 2.4 + this.flash * 4;
  }

  update(dt) {
    this.flash *= Math.exp(-dt * 5);
    this.animate(dt);
    this.acc += dt;
    if (this.acc < 1 / 15) return; // ~15 klatek ASCII na sekundę
    this.acc = 0;
    this.draw();
  }

  draw() {
    const r = this.renderer;
    const prevTarget = r.getRenderTarget();
    const prevClear = r.getClearAlpha();
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(this.scene, this.camera);
    r.readRenderTargetPixels(this.rt, 0, 0, this.cols * 2, this.rows * 2, this.px);
    r.setRenderTarget(prevTarget);
    r.setClearAlpha(prevClear);

    const W = this.cols * 2, px = this.px;
    const lines = [];
    for (let y = this.rows - 1; y >= 0; y--) { // tekstura jest odwrócona w pionie
      let line = '';
      for (let x = 0; x < this.cols; x++) {
        let lum = 0, a = 0;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
          const i = ((y * 2 + dy) * W + x * 2 + dx) * 4;
          lum += (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / 255;
          a += px[i + 3] / 255;
        }
        lum /= 4; a /= 4;
        if (a < 0.3) { line += ' '; continue; }
        // tekstura jest liniowa -> sRGB, potem kontrast
        let v = Math.pow(lum, 1 / 2.2);
        v = Math.min(0.999, Math.max(0, (v - 0.1) / 0.72));
        line += RAMP[Math.floor(v * RAMP.length)];
      }
      lines.push(line);
    }
    // iskry wokół kuli przy rzucaniu czaru
    if (this.mood === 'cast') this.sparks(lines);
    this.el.textContent = lines.join('\n');
  }

  sparks(lines) {
    // pozycja kuli na ekranie
    const v = new THREE.Vector3();
    this.w.orb.getWorldPosition(v).project(this.camera);
    const cx = Math.round((v.x * 0.5 + 0.5) * this.cols);
    const cy = Math.round((1 - (v.y * 0.5 + 0.5)) * this.rows);
    const chars = ['*', '+', '\'', '`', '.', '×'];
    const g = lines.map((l) => l.split(''));
    for (let k = 0; k < 10; k++) {
      const x = cx + Math.round((Math.random() - 0.5) * 12);
      const y = cy + Math.round((Math.random() - 0.5) * 7);
      if (g[y] && g[y][x] === ' ') g[y][x] = chars[(Math.random() * chars.length) | 0];
    }
    g.forEach((r, i) => { lines[i] = r.join(''); });
  }
}
