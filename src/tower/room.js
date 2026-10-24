import * as THREE from 'three';

// Komnata na szczycie wieży: kamienne ściany, okno na burzę, postument
// z kryształową kulą, biurko z przedmiotami do lewitacji i kruk.

const F = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o });

function m(geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  return o;
}

// szkło kuli: poświata na krawędziach + mgiełka w środku
const ballMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uGlow: { value: 0 } },
  vertexShader: /* glsl */`
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vP = position;
      vN = normalize(mat3(modelMatrix) * normal);
      vV = normalize(cameraPosition - wp.xyz);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime; uniform float uGlow;
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main() {
      float f = pow(1.0 - abs(dot(vN, vV)), 2.5);
      float swirl = sin(vP.y * 6.0 + uTime * 1.5 + sin(vP.x * 5.0 + uTime)) * 0.5 + 0.5;
      float a = f * 0.9 + swirl * 0.06 + uGlow * 0.25;
      gl_FragColor = vec4(vec3(0.75, 0.8, 1.0) * a, 1.0);
    }`,
});

export function buildRoom() {
  const scene = new THREE.Scene();
  const FOG = 0x0a1030;
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 40, 90);

  scene.add(new THREE.HemisphereLight(0x9aa6e8, 0x2a2430, 1.1));
  const moon = new THREE.DirectionalLight(0xbfc8ff, 1.3);
  moon.position.set(0, 20, -40); // światło z okna
  scene.add(moon);
  const fill = new THREE.DirectionalLight(0x8090c0, 0.5);
  fill.position.set(20, 25, 30);
  scene.add(fill);

  // ściany i podłoga
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 40, 14, 4, true), F(0x7a8098, { side: THREE.BackSide }));
  wall.position.y = 20;
  scene.add(wall);
  // fugi — pierścienie kamieni
  for (let y = 3; y < 40; y += 4.5) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(25.8, 25.8, 0.25, 14, 1, true), F(0x2a2f44, { side: THREE.BackSide }));
    ring.position.y = y; scene.add(ring);
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(26, 14), F(0x585c74));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  // płyty podłogi
  for (let r = 6; r < 26; r += 6) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.2, 28), F(0x232740));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; scene.add(ring);
  }
  // belki stropu
  for (let i = 0; i < 6; i++) {
    const b = m(new THREE.BoxGeometry(52, 1, 1.2), F(0x2e2a30), 0, 34, 0);
    b.rotation.y = i * Math.PI / 6; scene.add(b);
  }

  // OKNO (tylna ściana) — jasny prostokąt z łukiem, za nim błyski burzy
  const win = new THREE.Group();
  win.position.set(0, 15, -25.2);
  scene.add(win);
  const skyMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.42, 0.9) });
  const winShape = new THREE.Shape();
  winShape.moveTo(-4, -7); winShape.lineTo(4, -7); winShape.lineTo(4, 3);
  winShape.absarc(0, 3, 4, 0, Math.PI, false); winShape.lineTo(-4, -7);
  win.add(new THREE.Mesh(new THREE.ShapeGeometry(winShape, 12), skyMat));
  const frameMat = F(0x1c1e2c);
  win.add(m(new THREE.BoxGeometry(0.5, 14.5, 0.6), frameMat, 0, -0.5, 0.2));
  win.add(m(new THREE.BoxGeometry(8.4, 0.5, 0.6), frameMat, 0, -1, 0.2));
  win.add(m(new THREE.BoxGeometry(10, 1, 2), F(0x4a4e64), 0, -7.4, 0.8)); // parapet
  const winLight = new THREE.PointLight(0xc0c8ff, 0, 40, 1.2);
  winLight.position.set(0, 15, -18);
  scene.add(winLight);

  // POSTUMENT + KULA (środek)
  const pedestal = new THREE.Group();
  scene.add(pedestal);
  pedestal.add(m(new THREE.CylinderGeometry(2.6, 3.2, 1, 8), F(0x4c5068), 0, 0.5, 0));
  pedestal.add(m(new THREE.CylinderGeometry(1.1, 1.5, 5.2, 8), F(0x6a6f88), 0, 3.6, 0));
  pedestal.add(m(new THREE.CylinderGeometry(2.0, 1.2, 0.9, 8), F(0x4c5068), 0, 6.6, 0));
  // szpony trzymające kulę
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2;
    const claw = m(new THREE.ConeGeometry(0.28, 2.2, 4), F(0x8a8070), Math.cos(a) * 1.6, 7.6, Math.sin(a) * 1.6);
    claw.rotation.z = Math.cos(a) * 0.5; claw.rotation.x = -Math.sin(a) * 0.5;
    pedestal.add(claw);
  }
  const BALL_Y = 9.3;
  const ball = m(new THREE.SphereGeometry(2.3, 32, 20), ballMat, 0, BALL_Y, 0);
  ball.renderOrder = 10;
  scene.add(ball);
  const ballLight = new THREE.PointLight(0xc8d2ff, 1.2, 16, 1.5);
  ballLight.position.set(0, BALL_Y + 1, 3);
  scene.add(ballLight);

  // świece wokół postumentu
  const flames = [];
  const candleMat = F(0xe8e0cc), flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 2.0, 1.2) });
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + 0.3;
    const r = 5 + (i % 2) * 1.2, h = 0.8 + (i % 3) * 0.6;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    scene.add(m(new THREE.CylinderGeometry(0.18, 0.2, h, 6), candleMat, x, h / 2, z));
    const fl = m(new THREE.ConeGeometry(0.12, 0.35, 5), flameMat, x, h + 0.2, z);
    scene.add(fl); flames.push(fl);
  }
  const candleLight = new THREE.PointLight(0xffd8a0, 2.2, 22, 1.4);
  candleLight.position.set(0, 2.5, 4);
  scene.add(candleLight);

  // BIURKO (lewa strona) z przedmiotami
  const desk = new THREE.Group();
  desk.position.set(-15, 0, -6);
  desk.rotation.y = 0.75;
  scene.add(desk);
  const woodD = F(0x5a4838);
  desk.add(m(new THREE.BoxGeometry(11, 0.6, 5), woodD, 0, 4.6, 0));
  for (const [x, z] of [[-5, -2], [5, -2], [-5, 2], [5, 2]]) desk.add(m(new THREE.BoxGeometry(0.6, 4.4, 0.6), woodD, x, 2.2, z));
  const deskLight = new THREE.PointLight(0xffd8a0, 1.6, 16, 1.4);
  deskLight.position.set(-11, 9, -2);
  scene.add(deskLight);
  // regał za biurkiem
  const shelf = new THREE.Group();
  shelf.position.set(-19, 0, -14); shelf.rotation.y = 0.9;
  scene.add(shelf);
  shelf.add(m(new THREE.BoxGeometry(10, 16, 2.4), F(0x3a3028), 0, 8, 0));
  for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) {
    const h = 1.6 + ((k * 7 + r * 3) % 5) * 0.25;
    shelf.add(m(new THREE.BoxGeometry(0.8, h, 1.8), F([0x6a3a30, 0x3a4a6a, 0x5a5a40, 0x7a6a50][(k + r) % 4]), -4 + k * 1, 1.6 + r * 3.8 + h / 2, 0.4));
  }

  // przedmioty do lewitacji (pozycje względem biurka)
  const items = [];
  const addItem = (name, obj, x, z) => {
    obj.position.set(x, 4.9, z);
    obj.userData = { name, baseY: 4.9, baseX: x, lift: 0, burst: 0 };
    // własne kopie materiałów, żeby rozjaśnianie nie przenosiło się na świece w komnacie
    obj.traverse((m) => { if (m.isMesh && m.material.emissive) m.material = m.material.clone(); });
    desk.add(obj); items.push(obj);
  };
  const book = new THREE.Group();
  book.add(m(new THREE.BoxGeometry(2.2, 0.55, 1.6), F(0x6a2a28), 0, 0.28, 0));
  book.add(m(new THREE.BoxGeometry(2.05, 0.45, 1.5), F(0xe8e0c8), 0.08, 0.28, 0));
  addItem('KSIĘGA', book, -3.8, 0.4);
  const hour = new THREE.Group();
  hour.add(m(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 6), F(0x6a5040), 0, 0.08, 0));
  const lower = m(new THREE.ConeGeometry(0.55, 0.9, 8), F(0xc0c8e0), 0, 0.6, 0);
  lower.rotation.x = Math.PI; hour.add(lower);
  hour.add(m(new THREE.ConeGeometry(0.55, 0.9, 8), F(0xc0c8e0), 0, 1.5, 0));
  hour.add(m(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 6), F(0x6a5040), 0, 2.0, 0));
  addItem('KLEPSYDRA', hour, -1.4, -1);
  const flask = new THREE.Group();
  flask.add(m(new THREE.SphereGeometry(0.75, 10, 8), F(0x5a9a8a), 0, 0.75, 0));
  flask.add(m(new THREE.CylinderGeometry(0.2, 0.25, 0.8, 6), F(0x5a9a8a), 0, 1.7, 0));
  flask.add(m(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 6), F(0x6a5040), 0, 2.15, 0));
  addItem('FLAKON', flask, 0.9, 0.6);
  const candle = new THREE.Group();
  candle.add(m(new THREE.CylinderGeometry(0.55, 0.65, 0.2, 8), F(0x8a7a50), 0, 0.1, 0));
  candle.add(m(new THREE.CylinderGeometry(0.25, 0.27, 1.6, 6), candleMat, 0, 1.0, 0));
  const cf = m(new THREE.ConeGeometry(0.13, 0.4, 5), flameMat, 0, 2.0, 0); candle.add(cf); flames.push(cf);
  addItem('ŚWIECA', candle, 3.0, -1.1);
  const quill = new THREE.Group();
  quill.add(m(new THREE.CylinderGeometry(0.35, 0.3, 0.55, 8), F(0x1a1a24), 0, 0.28, 0));
  const feather = m(new THREE.ConeGeometry(0.22, 2.4, 4), F(0xece4d4), 0.3, 1.5, 0);
  feather.rotation.z = -0.35; feather.scale.z = 0.25; quill.add(feather);
  addItem('PIÓRO', quill, 4.4, 1.0);
  const itemHalo = new THREE.PointLight(0xc8d2ff, 0, 7, 1.5);
  scene.add(itemHalo);

  // ---------- REGAŁY wzdłuż ścian ----------
  // a = kąt na ścianie (0 = okno, + w prawo, − w lewo), regał zwrócony do środka komnaty
  const BOOK_COLS = [0x6a3a30, 0x3a4a6a, 0x5a5a40, 0x7a6a50, 0x4a2c3c, 0x2e4a44, 0x8a7a5a];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  function bookcase(a, w = 9, h = 18, r = 24.2) {
    const g = new THREE.Group();
    g.position.set(Math.sin(a) * r, 0, -Math.cos(a) * r);
    g.rotation.y = -a;
    const wood = F(0x3a3028), dark = F(0x241c18);
    g.add(m(new THREE.BoxGeometry(w, h, 0.4), dark, 0, h / 2, -1.1));       // plecy
    g.add(m(new THREE.BoxGeometry(0.5, h, 2.6), wood, -w / 2, h / 2, 0));   // boki
    g.add(m(new THREE.BoxGeometry(0.5, h, 2.6), wood, w / 2, h / 2, 0));
    g.add(m(new THREE.BoxGeometry(w + 1, 0.7, 3), wood, 0, h + 0.35, 0));   // gzyms
    const rows = Math.floor(h / 3.6);
    for (let rI = 0; rI < rows; rI++) {
      const y = 0.4 + rI * 3.6;
      g.add(m(new THREE.BoxGeometry(w, 0.3, 2.4), wood, 0, y, 0));
      // książki: różne wysokości, kolory, czasem przerwa albo przechylona
      let x = -w / 2 + 0.45;
      while (x < w / 2 - 0.6) {
        if (rnd() < 0.08) { x += 0.9; continue; }
        const bw = 0.35 + rnd() * 0.35, bh = 1.8 + rnd() * 1.2;
        const book = m(new THREE.BoxGeometry(bw, bh, 1.6 + rnd() * 0.5), F(BOOK_COLS[Math.floor(rnd() * BOOK_COLS.length)]), x + bw / 2, y + 0.15 + bh / 2, 0.1);
        if (rnd() < 0.07) { book.rotation.z = -0.35; book.position.x += 0.25; book.position.y -= 0.12; x += 0.4; }
        g.add(book);
        x += bw + 0.03;
      }
      if (rnd() < 0.3) g.add(m(new THREE.IcosahedronGeometry(0.45, 0), F(0xc8c0b0), w / 2 - 1, y + 0.6, 0.2)); // czaszka/kamień
    }
    scene.add(g);
    return g;
  }
  bookcase(-0.42, 7, 20);
  bookcase(0.42, 7, 20);
  bookcase(-1.25, 9, 17);
  bookcase(-1.7, 9, 17);
  bookcase(1.35, 9, 17);
  bookcase(1.8, 9, 15);
  // stos książek na podłodze przy regale
  for (let i = 0; i < 6; i++) {
    const b = m(new THREE.BoxGeometry(2.2, 0.5, 1.6), F(BOOK_COLS[i % BOOK_COLS.length]), -19 + (i % 2) * 0.2, 0.25 + i * 0.5, -3 + (i % 3) * 0.15);
    b.rotation.y = i * 0.4; scene.add(b);
  }

  // ---------- KOMINEK z fotelem ----------
  const hearth = new THREE.Group();
  const HA = 0.82; // kąt na ścianie
  hearth.position.set(Math.sin(HA) * 24.4, 0, -Math.cos(HA) * 24.4);
  hearth.rotation.y = -HA;
  scene.add(hearth);
  const brick = F(0x6a6a7c), brickDark = F(0x3a3a48), soot = F(0x0c0c12);
  hearth.add(m(new THREE.BoxGeometry(11, 9, 3.2), brick, 0, 4.5, 0));            // korpus
  hearth.add(m(new THREE.BoxGeometry(6, 5.2, 0.2), soot, 0, 2.6, 1.65));         // palenisko (czarna tylna ściana)
  for (const sx of [-1, 1]) hearth.add(m(new THREE.BoxGeometry(0.8, 5.6, 1.6), brickDark, sx * 3.4, 2.8, 2.3)); // boczne filary
  hearth.add(m(new THREE.BoxGeometry(12.5, 0.9, 4), brickDark, 0, 9.2, 0.4));    // półka
  hearth.add(m(new THREE.BoxGeometry(7.6, 0.9, 1.8), brickDark, 0, 5.6, 2.3));   // nadproże
  hearth.add(m(new THREE.BoxGeometry(13, 0.5, 6), brickDark, 0, 0.25, 1.8));     // posadzka przed kominkiem
  hearth.add(m(new THREE.BoxGeometry(7, 22, 2.4), brick, 0, 20, -0.4));          // komin
  // drobiazgi na półce
  hearth.add(m(new THREE.CylinderGeometry(0.25, 0.3, 1.4, 6), F(0xe8e0cc), -4.5, 10.3, 0.6));
  hearth.add(m(new THREE.SphereGeometry(0.7, 8, 6), F(0x5a9a8a), 4.2, 10.3, 0.6));
  hearth.add(m(new THREE.BoxGeometry(1.6, 1.8, 0.9), F(0x6a5040), 1.8, 10.5, 0.4));
  // polana
  const logMat = F(0x4a3020);
  for (const [x, rz, ry] of [[-1, 0.1, 0.3], [1, -0.1, -0.3], [0, 0, 1.4]]) {
    const lg = m(new THREE.CylinderGeometry(0.4, 0.45, 4, 6), logMat, x * 0.9, 0.9 + (ry > 1 ? 0.6 : 0), 2.4);
    lg.rotation.z = Math.PI / 2 + rz; lg.rotation.y = ry; hearth.add(lg);
  }
  // płomienie: jasne stożki (bloom + druk dają z nich plamę światła)
  const fireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 0.8, 0.4) });
  const fireCore = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.4, 0.9) });
  const fire = [];
  for (let i = 0; i < 7; i++) {
    const f = m(new THREE.ConeGeometry(0.35 + (i % 3) * 0.15, 1.6 + (i % 4) * 0.5, 5), i % 3 === 0 ? fireCore : fireMat, -1.6 + i * 0.55, 2.1, 2.3 + (i % 2) * 0.3);
    f.userData.base = f.position.y; f.userData.h = 1 + (i % 4) * 0.3;
    hearth.add(f); fire.push(f);
  }
  const fireLight = new THREE.PointLight(0xffb070, 4, 34, 1.3);
  fireLight.position.set(0, 3, 5);
  hearth.add(fireLight);
  // iskry
  const emberN = 40, emberPos = new Float32Array(emberN * 3);
  const embers = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: new THREE.Color(1.6, 1.1, 0.6), size: 0.16 }));
  embers.geometry.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  embers.userData.v = Array.from({ length: emberN }, () => ({ x: (Math.random() - 0.5) * 3, y: Math.random() * 6, z: 2.2 + Math.random() * 0.6, s: 1 + Math.random() * 2 }));
  hearth.add(embers);

  // fotel uszak, odwrócony w stronę ognia
  const chair = new THREE.Group();
  chair.position.set(-5.5, 0, 9);      // w układzie kominka: z boku, przed ogniem
  chair.rotation.y = Math.PI + 0.6;    // przodem do ognia
  hearth.add(chair);
  const fabric = F(0x5a2a30), fabricDark = F(0x3e1c22), legMat = F(0x2a1e16);
  chair.add(m(new THREE.BoxGeometry(4.6, 1.6, 4.2), fabric, 0, 2.3, 0));          // siedzisko
  chair.add(m(new THREE.BoxGeometry(4.2, 0.6, 3.6), fabricDark, 0, 3.4, 0.2));    // poduszka
  chair.add(m(new THREE.BoxGeometry(4.6, 6.4, 1.0), fabric, 0, 5.2, -1.8));       // oparcie
  for (const sx of [-1, 1]) {
    chair.add(m(new THREE.BoxGeometry(0.9, 2.2, 4.2), fabricDark, sx * 2.5, 3.6, 0));     // podłokietniki
    chair.add(m(new THREE.BoxGeometry(0.9, 2.6, 1.6), fabric, sx * 2.3, 7.4, -1.3));      // "uszy"
    for (const sz of [-1, 1]) chair.add(m(new THREE.BoxGeometry(0.4, 1.5, 0.4), legMat, sx * 2, 0.75, sz * 1.8));
  }
  // koc przewieszony przez podłokietnik i książka na siedzisku
  const blanket = m(new THREE.BoxGeometry(1.1, 2.4, 3), F(0x7a6a50), 2.9, 3.2, 0.3); blanket.rotation.z = 0.2; chair.add(blanket);
  const openBook = m(new THREE.BoxGeometry(1.6, 0.25, 1.2), F(0xe8e0c8), -0.4, 3.8, 0.6); openBook.rotation.y = 0.5; chair.add(openBook);
  // dywan między kominkiem a fotelem
  const rug = new THREE.Mesh(new THREE.CircleGeometry(6, 8), F(0x4a2028));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.03, 7); hearth.add(rug);
  const rugEdge = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.6, 8), F(0x8a6a40));
  rugEdge.rotation.x = -Math.PI / 2; rugEdge.position.copy(rug.position); rugEdge.position.y = 0.05; hearth.add(rugEdge);

  // pył w powietrzu
  const dustN = 300, dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (Math.random() - 0.5) * 44; dustPos[i * 3 + 1] = Math.random() * 30; dustPos[i * 3 + 2] = (Math.random() - 0.5) * 44; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xc8d0ff, size: 0.12, transparent: true, opacity: 0.6 }));
  scene.add(dust);

  // TŁO WIZJI: ciemna sfera wokół oglądanego dzieła — reszta komnaty gaśnie,
  // a model odcina się od tła na każdym etapie transmutacji
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x02040c, side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const voidSphere = new THREE.Mesh(new THREE.SphereGeometry(13, 32, 16), voidMat);
  voidSphere.position.set(0, 14.2, 0);
  voidSphere.renderOrder = 5;
  voidSphere.visible = false;
  scene.add(voidSphere);

  // światło do oglądania dzieła (włączane w trybie Visio)
  const showLight = new THREE.DirectionalLight(0xfff4e0, 0);
  showLight.position.set(8, 18, 16);
  showLight.target.position.set(0, 14.2, 0);
  scene.add(showLight, showLight.target);
  const showRim = new THREE.DirectionalLight(0xa0b0ff, 0);
  showRim.position.set(-10, 14, -6);
  showRim.target.position.set(0, 12.7, 0);
  scene.add(showRim, showRim.target);

  return {
    showLight, showRim, voidSphere, voidMat, fire, fireLight, embers,
    scene, ball, ballMat, BALL_Y, ballLight, flames, candleLight, deskLight, winLight, skyMat, items, itemHalo, desk,
    dust, win,
  };
}
