import * as THREE from 'three';

// Deszcz (ukośne kreski) i rozbryzgi wody przy wynurzaniu zamku.

export class Rain {
  constructor(scene, count = 1400) {
    this.count = count;
    this.box = { x: 160, y: 120, z: 200 };
    const pos = new Float32Array(count * 6);
    this.drops = [];
    for (let i = 0; i < count; i++) {
      this.drops.push({
        x: (Math.random() - 0.5) * this.box.x,
        y: Math.random() * this.box.y,
        z: 85 - Math.random() * this.box.z,
        s: 70 + Math.random() * 40,
        l: 1.5 + Math.random() * 2.5,
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.LineBasicMaterial({ color: 0x7a70b8, transparent: true, opacity: 0.35, fog: true });
    this.mesh = new THREE.LineSegments(g, this.mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.wind = -0.28;
  }
  update(dt, flash) {
    const arr = this.mesh.geometry.attributes.position.array;
    for (let i = 0; i < this.count; i++) {
      const d = this.drops[i];
      d.y -= d.s * dt;
      d.x += d.s * this.wind * dt;
      if (d.y < -2) { d.y = this.box.y; d.x = (Math.random() - 0.5) * this.box.x; }
      const o = i * 6;
      arr[o] = d.x; arr[o + 1] = d.y; arr[o + 2] = d.z;
      arr[o + 3] = d.x - this.wind * d.l; arr[o + 4] = d.y + d.l; arr[o + 5] = d.z;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mat.opacity = 0.3 + flash * 0.5;
  }
}

export class Splash {
  constructor(scene, count = 700) {
    this.count = count;
    this.p = [];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.mat = new THREE.PointsMaterial({ color: 0xbbb0ff, size: 1.6, sizeAttenuation: true, transparent: true, opacity: 0.85 });
    this.mesh = new THREE.Points(g, this.mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    for (let i = 0; i < count; i++) this.p.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, alive: false });
    this.next = 0;
  }
  emitRing(radius, n, power = 1) {
    for (let k = 0; k < n; k++) {
      const q = this.p[this.next];
      this.next = (this.next + 1) % this.count;
      const a = Math.random() * Math.PI * 2;
      const r = radius * (0.8 + Math.random() * 0.4);
      q.x = Math.cos(a) * r; q.z = Math.sin(a) * r; q.y = 0;
      const out = 4 + Math.random() * 10;
      q.vx = Math.cos(a) * out; q.vz = Math.sin(a) * out;
      q.vy = (12 + Math.random() * 22) * power;
      q.alive = true;
    }
  }
  emitAt(pos, n) {
    for (let k = 0; k < n; k++) {
      const q = this.p[this.next];
      this.next = (this.next + 1) % this.count;
      q.x = pos.x; q.y = 0.5; q.z = pos.z;
      const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 8;
      q.vx = Math.cos(a) * s; q.vz = Math.sin(a) * s; q.vy = 8 + Math.random() * 14;
      q.alive = true;
    }
  }
  update(dt) {
    const arr = this.mesh.geometry.attributes.position.array;
    for (let i = 0; i < this.count; i++) {
      const q = this.p[i];
      if (q.alive) {
        q.vy -= 30 * dt;
        q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
        if (q.y < -1) { q.alive = false; q.y = -999; }
      }
      arr[i * 3] = q.x; arr[i * 3 + 1] = q.y; arr[i * 3 + 2] = q.z;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }
}
