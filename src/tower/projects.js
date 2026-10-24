import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Modele projektów: zastępcze bryły (dopóki nie wstawisz swoich .glb)
// + przełączanie materiałów dla Transmutacji: 0 drut, 1 glina, 2 dzieło.

const L = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0, flatShading: true, ...o });
const E = (c) => new THREE.MeshBasicMaterial({ color: c });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

const BUILDERS = {
  tower() {
    const g = new THREE.Group();
    const stone = L(0x8d8a80), roof = L(0x9c3b2a), wood = L(0x5b3a22);
    g.add(mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 9), L(0x55604a), 0, 0.25, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.5, 2.0, 8), stone, 0, 1.5, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.6, 0.55, 0.25, 8), stone, 0, 2.6, 0));
    g.add(mesh(new THREE.ConeGeometry(0.62, 0.9, 8), roof, 0, 3.15, 0));
    const door = mesh(new THREE.BoxGeometry(0.22, 0.4, 0.1), wood, 0, 0.7, 0.47); g.add(door);
    for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(0.1, 0.18, 0.1), E(0xffc35a), Math.sin(i * 2) * 0.44, 1.3 + i * 0.4, Math.cos(i * 2) * 0.44));
    return g;
  },
  golem() {
    const g = new THREE.Group();
    const rock = L(0x6f6a5d), moss = L(0x4f7a32), eye = E(0x6ff2ff);
    g.add(mesh(new THREE.DodecahedronGeometry(0.75, 0), rock, 0, 1.2, 0));
    g.add(mesh(new THREE.DodecahedronGeometry(0.42, 0), rock, 0, 2.15, 0.05));
    g.add(mesh(new THREE.DodecahedronGeometry(0.5, 0), moss, 0, 1.55, -0.25));
    for (const s of [-1, 1]) {
      g.add(mesh(new THREE.DodecahedronGeometry(0.32, 0), rock, s * 0.95, 1.4, 0));
      g.add(mesh(new THREE.DodecahedronGeometry(0.36, 0), moss, s * 1.05, 0.75, 0.05));
      g.add(mesh(new THREE.DodecahedronGeometry(0.34, 0), rock, s * 0.38, 0.3, 0));
      g.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), eye, s * 0.14, 2.2, 0.38));
    }
    return g;
  },
  reliquary() {
    const g = new THREE.Group();
    const gold = L(0xc9a03c, { metalness: 0.6, roughness: 0.35 }), red = L(0x7a1626), gem = E(0x3f7bff);
    g.add(mesh(new THREE.BoxGeometry(1.6, 0.18, 1.0), gold, 0, 0.09, 0));
    g.add(mesh(new THREE.BoxGeometry(1.4, 0.8, 0.85), red, 0, 0.6, 0));
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.12, 0.95), gold, 0, 1.05, 0));
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.45, 4, 1), gold);
    lid.rotation.z = Math.PI / 2; lid.rotation.x = Math.PI / 4; lid.scale.set(1, 1, 0.75); lid.position.y = 1.3;
    g.add(lid);
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), gold, 0, 1.95, 0));
    g.add(mesh(new THREE.BoxGeometry(0.36, 0.1, 0.1), gold, 0, 2.05, 0));
    g.add(mesh(new THREE.OctahedronGeometry(0.16, 0), gem, 0, 0.62, 0.45));
    for (const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.09, 6, 4), gold, s * 0.75, 0.0, 0.45));
    return g;
  },
  lantern() {
    const g = new THREE.Group();
    const brass = L(0xb08a3e, { metalness: 0.7, roughness: 0.3 }), glass = E(0xff9a3c);
    g.add(mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.2, 8), brass, 0, 0.1, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.3, 8), glass, 0, 0.9, 0));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      g.add(mesh(new THREE.BoxGeometry(0.07, 1.35, 0.07), brass, Math.cos(a) * 0.5, 0.9, Math.sin(a) * 0.5));
    }
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.62, 0.45, 8), brass, 0, 1.75, 0));
    g.add(mesh(new THREE.TorusGeometry(0.22, 0.05, 5, 12), brass, 0, 2.15, 0));
    return g;
  },
};

// dopasowanie bryły do kuli o promieniu 1, środek w (0,0,0)
function normalize(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  // wydłużone modele (np. motocykl) mogą być dłuższe, żeby nie wyglądały na zapałkę
  const dims = [size.x, size.y, size.z].sort((a, b) => a - b);
  const elong = Math.min(1.6, Math.max(1, dims[2] / (dims[1] || 1) / 1.6));
  const s = (1.7 * elong) / dims[2];
  const pivot = new THREE.Group();
  obj.position.sub(c);
  pivot.add(obj);
  pivot.scale.setScalar(s);
  return pivot;
}

// DRUT: ciemna bryła (zasłania tylne krawędzie) + jasna siatka na wierzchu
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x0a1230, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
// krawędzie konstrukcyjne (ostre załamania) — czytelne nawet przy setkach tysięcy trójkątów
// kolor poniżej progu poświaty (bloom), żeby gęste krawędzie nie zlewały się w plamę
const edgeMat = new THREE.LineBasicMaterial({ color: 0xaab4d8, transparent: true, opacity: 0.9, depthWrite: false });
const wireMat = new THREE.MeshBasicMaterial({ color: 0xdfe3f2, wireframe: true, transparent: true, opacity: 0.95, depthWrite: false });
// GLINA: jasna, matowa, z wyraźnym cieniowaniem fasetek
const clayMat = new THREE.MeshStandardMaterial({ color: 0xa8a49c, roughness: 0.85, flatShading: true });

export class ProjectModel {
  constructor(project, manager) {
    this.root = new THREE.Group();
    this.stage = 2;
    this.wireMode = project.wireframe || 'auto';
    this.setContent(normalize(BUILDERS[project.placeholder || 'tower']()));
    if (project.model) {
      new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder).load(project.model, (gltf) => {
        // opcjonalny kolor/połysk z config.js (gdy materiał z Blendera nie ma tekstur)
        if (project.color || project.roughness !== undefined) {
          gltf.scene.traverse((o) => {
            if (!o.isMesh) return;
            o.material = o.material.clone();
            if (project.color) o.material.color.set(project.color);
            if (project.roughness !== undefined) o.material.roughness = project.roughness;
            if (project.metalness !== undefined) o.material.metalness = project.metalness;
          });
        }
        this.root.remove(this.content);
        const pivot = normalize(gltf.scene);
        pivot.userData.real = true;
        this.setContent(pivot);
      }, undefined, () => console.warn('Nie wczytano modelu', project.model));
    }
  }

  setContent(obj) {
    this.content = obj;
    this.edgesBuilt = false; // nowy model (np. po wczytaniu .glb) liczy krawędzie od nowa
    this.meshes = [];
    obj.traverse((o) => { if (o.isMesh && !o.userData.isWire) this.meshes.push(o); });
    // gęsty sculpt w niskiej rozdzielczości zlewa się w białą plamę,
    // więc im więcej trójkątów, tym delikatniejsza siatka
    const tris = this.meshes.reduce((n, m) => n + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, 0);
    const wire = wireMat.clone();
    wire.opacity = Math.min(0.6, Math.max(0.04, 0.95 * Math.sqrt(1500 / Math.max(tris, 1))));
    this.dense = tris > 60000;
    this.tris = tris;
    for (const m of this.meshes) {
      m.userData.orig = m.material;
      // nakładka z siatką dzielona z tą samą geometrią
      const w = new THREE.Mesh(m.geometry, wire);
      w.userData.isWire = true;
      w.visible = false;
      w.renderOrder = 2;
      m.add(w);
      m.userData.wire = w;
    }
    obj.traverse((o) => o.layers.enable(1)); // warstwa 1 = nakładka z prawdziwymi kolorami
    this.root.add(obj);
    this.setStage(this.stage);
  }

  // 0 drut, 1 glina, 2 dzieło
  // 0 drut, 1 glina, 2 dzieło.
  // Na etapie 2 w głównym (kobaltowym) przebiegu zostaje glina — daje tę samą poświatę
  // i tło co etap 2 — a prawdziwe kolory dorysowuje nakładka (withTrueColors).
  setStage(s) {
    this.stage = s;
    if (s === 0) this.buildEdges();
    for (const m of this.meshes) {
      m.material = s === 0 ? shadowMat : clayMat;
      // w gęstych modelach siatka trójkątów to szum, kształt niosą krawędzie
      // w gęstych modelach: krawędzie na częściach z ostrymi załamaniami, siatka trójkątów na gładkich
      // wireframe: 'edges' w config.js = same krawędzie (dla gęstych modeli hard-surface)
      m.userData.wire.visible = s === 0 && this.wireMode !== 'edges';
      if (m.userData.edges) m.userData.edges.visible = s === 0 && (this.edgeRich || !this.dense || this.wireMode === 'edges');
      // przezroczyste elementy (folia, szkło) w siatce i glinie zasłaniałyby wnętrze, więc je chowamy
      const glass = m.userData.orig && m.userData.orig.transparent;
      m.visible = !(glass && s < 2);
    }
  }

  // liczone dopiero przy pierwszym wejściu w etap siatki (gęste modele liczą się chwilę)
  buildEdges() {
    if (this.edgesBuilt) return;
    this.edgesBuilt = true;
    let segs = 0;
    for (const m of this.meshes) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, this.dense ? 55 : 28), edgeMat);
      e.userData.isWire = true;
      e.renderOrder = 3;
      e.layers.enable(1);
      m.add(e);
      m.userData.edges = e;
      const ms = e.geometry.attributes.position.count / 2;
      const mt = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
      m.userData.edgeRich = ms > mt * 0.04; // ta część ma wyraźne krawędzie
      segs += ms;
    }
    // gładki sculpt (np. smok) prawie nie ma ostrych krawędzi: zostaje przy siatce trójkątów
    this.edgeRich = segs > this.tris * 0.04;

  }

  withTrueColors(fn) {
    for (const m of this.meshes) { m.material = m.userData.orig; m.visible = true; if (m.userData.edges) m.userData.edges.visible = false; }
    fn();
    this.setStage(this.stage);
  }
}
