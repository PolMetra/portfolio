import * as THREE from 'three';

// Błyskawice: rysowana ścieżka (ręka gracza) jest co klatkę "elektryzowana" —
// losowe odchylenia + gałęzie. Linie mają 1 px, ale przy niskiej rozdzielczości
// i bloomie robią się grube i świecące jak w grach z PS2.

const MAX_VERTS = 6000;

const coreMat = new THREE.LineBasicMaterial({ color: new THREE.Color(3.2, 3.0, 3.6), fog: false });
const glowMat = new THREE.LineBasicMaterial({ color: new THREE.Color(1.4, 0.35, 3.0), fog: false, transparent: true, opacity: 0.9 });

function rnd(a = 1) { return (Math.random() - 0.5) * 2 * a; }

class Bolt {
  constructor(scene, points, { jag = 1.2, branchChance = 0.12, life = 0.6, live = false } = {}) {
    this.points = points;      // punkty kontrolne (Vector3)
    this.jag = jag;
    this.branchChance = branchChance;
    this.maxLife = life;
    this.life = life;
    this.live = live;          // true = gracz wciąż rysuje
    this.timer = 0;
    this.scene = scene;
    this.layers = [coreMat, glowMat].map((m) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_VERTS * 3), 3));
      g.setDrawRange(0, 0);
      const l = new THREE.LineSegments(g, m);
      l.frustumCulled = false;
      scene.add(l);
      return l;
    });
    this.rebuild();
  }

  rebuild() {
    const pts = this.points;
    if (pts.length < 2) { this.layers.forEach((l) => l.geometry.setDrawRange(0, 0)); return; }
    this.layers.forEach((layer, li) => {
      const arr = layer.geometry.attributes.position.array;
      let n = 0;
      const push = (a, b) => {
        if (n + 6 > arr.length) return;
        arr[n++] = a.x; arr[n++] = a.y; arr[n++] = a.z;
        arr[n++] = b.x; arr[n++] = b.y; arr[n++] = b.z;
      };
      const extra = li === 0 ? 0 : 0.5;
      let prev = pts[0].clone();
      const tmp = new THREE.Vector3();
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const len = a.distanceTo(b);
        const steps = Math.max(1, Math.floor(len / 1.6));
        for (let s = 1; s <= steps; s++) {
          tmp.lerpVectors(a, b, s / steps);
          const last = i === pts.length - 1 && s === steps;
          const cur = tmp.clone();
          if (!last) cur.add(new THREE.Vector3(rnd(this.jag + extra), rnd(this.jag + extra), rnd((this.jag + extra) * 0.5)));
          push(prev, cur);
          // gałąź
          if (li === 0 && Math.random() < this.branchChance) {
            let bp = cur.clone();
            const dir = new THREE.Vector3(rnd(1), -Math.random() * 1.2, rnd(0.5)).normalize();
            const segs = 3 + Math.floor(Math.random() * 4);
            for (let k = 0; k < segs; k++) {
              const np = bp.clone().addScaledVector(dir, 1.5 + Math.random() * 2).add(new THREE.Vector3(rnd(0.9), rnd(0.9), rnd(0.4)));
              push(bp, np);
              bp = np;
            }
          }
          prev = cur;
        }
      }
      layer.geometry.attributes.position.needsUpdate = true;
      layer.geometry.setDrawRange(0, n / 3);
    });
  }

  update(dt) {
    this.timer += dt;
    if (!this.live) this.life -= dt;
    // migotanie ~25 Hz
    if (this.timer > 0.04) { this.timer = 0; this.rebuild(); }
    const k = this.live ? 1 : Math.max(0, this.life / this.maxLife);
    const vis = this.live || Math.random() < 0.35 + k * 0.6;
    this.layers[0].visible = vis;
    this.layers[1].visible = vis && Math.random() > 0.15;
    return this.life > 0;
  }

  dispose() {
    this.layers.forEach((l) => { this.scene.remove(l); l.geometry.dispose(); });
  }
}

// błyskawica od A do B z podziałem "midpoint displacement"
export function jaggedPath(a, b, depth = 5, spread = 0.18) {
  let pts = [a.clone(), b.clone()];
  let off = a.distanceTo(b) * spread;
  for (let d = 0; d < depth; d++) {
    const next = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const m = pts[i - 1].clone().lerp(pts[i], 0.5).add(new THREE.Vector3(rnd(off), rnd(off * 0.4), rnd(off * 0.6)));
      next.push(m, pts[i]);
    }
    pts = next;
    off *= 0.55;
  }
  return pts;
}

export class LightningSystem {
  constructor(scene) {
    this.scene = scene;
    this.bolts = [];
    this.active = null;
  }

  begin(p) {
    this.active = new Bolt(this.scene, [p.clone()], { live: true, jag: 1.0, branchChance: 0.1 });
    this.bolts.push(this.active);
  }

  // zwraca długość dodanego odcinka (energia)
  extend(p) {
    if (!this.active) return 0;
    const pts = this.active.points;
    const last = pts[pts.length - 1];
    const d = last.distanceTo(p);
    if (d < 1.2) return 0;
    pts.push(p.clone());
    // ograniczamy długość "żywej" ścieżki — stary ogon odpada jako osobny piorun
    if (pts.length > 70) {
      const tail = pts.splice(0, 35);
      tail.push(pts[0].clone());
      this.bolts.push(new Bolt(this.scene, tail, { life: 0.35 }));
    }
    this.active.rebuild();
    return d;
  }

  end() {
    if (!this.active) return null;
    const b = this.active;
    b.live = false;
    b.life = b.maxLife = 0.55;
    this.active = null;
    return b.points.length > 1 ? b.points[b.points.length - 1].clone() : null;
  }

  strike(from, to, { depth = 6, spread = 0.2, life = 0.5, jag = 0.5, branch = 0.08 } = {}) {
    const bolt = new Bolt(this.scene, jaggedPath(from, to, depth, spread), { life, jag, branchChance: branch });
    this.bolts.push(bolt);
    return bolt;
  }

  update(dt) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      if (!b.update(dt)) { b.dispose(); this.bolts.splice(i, 1); }
    }
  }
}
