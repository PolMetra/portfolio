import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Proceduralny zamek-zastępca w stylu low-poly.
// Gdy będziesz mieć własny model, ustaw CONFIG.castleModel = 'assets/zamek.glb'.
// Ważne: obiekt o nazwie "Crystal" w Twoim modelu (jeśli istnieje) stanie się
// piorunochronem — tam będą uderzać błyskawice po przywołaniu zamku.

const stone = new THREE.MeshLambertMaterial({ color: 0x9aa0b8, flatShading: true });
const stoneDark = new THREE.MeshLambertMaterial({ color: 0x5c6280, flatShading: true });
const roof = new THREE.MeshLambertMaterial({ color: 0x3a4470, flatShading: true });
const rock = new THREE.MeshLambertMaterial({ color: 0x2c3044, flatShading: true });
const windowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.3, 0.45) });
const crystalMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.6, 3.0) });
const runeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.4, 2.2), transparent: true, opacity: 0.8 });

function tower(r, h, roofH, segs = 8) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, h, segs), stone);
  body.position.y = h / 2;
  g.add(body);
  // blanki
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.0, 1.6, segs), stoneDark);
  rim.position.y = h + 0.8;
  g.add(rim);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 1.35, roofH, segs), roof);
  cone.position.y = h + 1.6 + roofH / 2;
  g.add(cone);
  // okna
  const rows = Math.max(1, Math.floor(h / 9));
  for (let i = 0; i < rows; i++) {
    const a = (i * 2.4) + 0.4;
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.4), windowMat);
    w.position.set(Math.sin(a) * r * 0.93, h * 0.3 + i * 8, Math.cos(a) * r * 0.93);
    w.lookAt(0, w.position.y, 0);
    g.add(w);
  }
  g.userData.top = h + 1.6 + roofH;
  return g;
}

function buildProcedural() {
  const castle = new THREE.Group();

  // skała-wyspa: zdeformowany ikosaedr
  const rg = new THREE.IcosahedronGeometry(22, 1);
  const pos = rg.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 0.75 + 0.5 * Math.abs(Math.sin(v.x * 0.31) * Math.cos(v.z * 0.27 + v.y * 0.2));
    v.multiplyScalar(k);
    if (v.y > 6) v.y = 6 + (v.y - 6) * 0.25; // płaski szczyt pod zamek
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  rg.computeVertexNormals();
  const island = new THREE.Mesh(rg, rock);
  island.scale.set(1.15, 0.9, 1.0);
  island.position.y = -4;
  castle.add(island);

  // ostre skały wokół
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const s = new THREE.Mesh(new THREE.ConeGeometry(2 + (i % 3), 8 + (i % 4) * 4, 5), rock);
    s.position.set(Math.cos(a) * 24, 0, Math.sin(a) * 20);
    s.rotation.z = (i % 2 ? 1 : -1) * 0.25;
    castle.add(s);
  }

  // główna wieża czarodzieja
  const main = tower(5, 44, 16, 8);
  main.position.set(0, 3, -2);
  castle.add(main);

  // wieże boczne
  const t1 = tower(3.2, 24, 9, 7); t1.position.set(-13, 3, 2); castle.add(t1);
  const t2 = tower(2.8, 30, 10, 7); t2.position.set(12, 3, -4); castle.add(t2);
  const t3 = tower(2.2, 16, 7, 6); t3.position.set(6, 3, 9); castle.add(t3);

  // mury
  const wallA = new THREE.Mesh(new THREE.BoxGeometry(13, 9, 2.4), stoneDark);
  wallA.position.set(-6.5, 7, 0); wallA.rotation.y = -0.2; castle.add(wallA);
  const wallB = new THREE.Mesh(new THREE.BoxGeometry(12, 11, 2.4), stoneDark);
  wallB.position.set(6.5, 8, -3); wallB.rotation.y = 0.15; castle.add(wallB);

  // most-łuk między wieżą główną a boczną
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(9, 1.4, 2), stone);
  bridge.position.set(6, 30, -3); castle.add(bridge);

  // kryształ na szczycie = piorunochron
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(2.6, 0), crystalMat);
  crystal.name = 'Crystal';
  crystal.scale.y = 1.8;
  crystal.position.set(0, 3 + main.userData.top + 5, -2);
  castle.add(crystal);

  // pierścień run wokół kryształu
  const rune = new THREE.Mesh(new THREE.TorusGeometry(6, 0.18, 4, 24), runeMat);
  rune.name = 'Rune';
  rune.position.copy(crystal.position);
  rune.rotation.x = Math.PI / 2.3;
  castle.add(rune);

  return castle;
}

export function createCastle(config, manager) {
  const root = new THREE.Group();
  const proc = buildProcedural();
  root.add(proc);

  const api = {
    root,
    crystal: proc.getObjectByName('Crystal'),
    rune: proc.getObjectByName('Rune'),
    glow: 0,
    crystalWorld(target) {
      return api.crystal.getWorldPosition(target);
    },
    update(dt, t) {
      api.glow = Math.max(0, api.glow - dt * 1.5);
      const pulse = 1 + Math.sin(t * 2) * 0.08 + api.glow * 0.6;
      api.crystal.scale.set(pulse, 1.8 * pulse, pulse);
      api.crystal.rotation.y += dt * (0.6 + api.glow * 6);
      api.rune.rotation.z += dt * (0.4 + api.glow * 4);
      const k = 1 + api.glow * 2.5;
      crystalMat.color.setRGB(1.6 * k, 0.6 * k, 3.0 * k);
    },
  };

  if (config.castleModel) {
    new GLTFLoader(manager).load(config.castleModel, (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(config.castleModelScale);
      root.remove(proc);
      root.add(model);
      const c = model.getObjectByName('Crystal');
      if (c) api.crystal = c;
    });
  }

  return api;
}
