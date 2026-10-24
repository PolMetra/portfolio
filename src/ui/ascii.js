import * as THREE from 'three';

// Wspólny "silnik ASCII": renderuje scenę 3D do maleńkiej tekstury
// i zamienia każdą komórkę (2×2 piksele) na znak według jasności.

export const RAMP = ['.', '.', ':', 'c', 'o', 's', 'S', '$', 'B'];

export class AsciiView {
  constructor(renderer, cols, rows, { ramp = RAMP, lo = 0.1, span = 0.72 } = {}) {
    this.renderer = renderer;
    this.cols = cols; this.rows = rows;
    this.ramp = ramp; this.lo = lo; this.span = span;
    this.rt = new THREE.WebGLRenderTarget(cols * 2, rows * 2, { depthBuffer: true });
    this.px = new Uint8Array(cols * 2 * rows * 2 * 4);
  }

  render(scene, camera) {
    const r = this.renderer;
    const prevTarget = r.getRenderTarget();
    const prevColor = r.getClearColor(new THREE.Color());
    const prevAlpha = r.getClearAlpha();
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(scene, camera);
    r.readRenderTargetPixels(this.rt, 0, 0, this.cols * 2, this.rows * 2, this.px);
    r.setRenderTarget(prevTarget);
    r.setClearColor(prevColor, prevAlpha);

    const W = this.cols * 2, px = this.px, ramp = this.ramp, n = ramp.length;
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
        v = Math.min(0.999, Math.max(0, (v - this.lo) / this.span));
        line += ramp[Math.floor(v * n)];
      }
      lines.push(line);
    }
    return lines;
  }
}
