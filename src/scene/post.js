import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Łańcuch: render w niskiej rozdzielczości (PS2) -> bloom -> smużenie klatek
// -> tone mapping -> druk kobaltowy z ditheringiem.

// Druk kobaltowy: jasność obrazu mapowana na 5 farb (atrament → kobalt → kość)
// z ditheringiem Bayera i ziarnem — jak sitodruk / risograf.
const PrintShader = {
  uniforms: {
    tDiffuse: { value: null },
    uFlash: { value: 0 },
    uTime: { value: 0 },
    uGain: { value: 1.0 },
    // wartości sRGB (ten przebieg działa już po konwersji koloru)
    uPalette: { value: [
      '#050817', // atrament
      '#0b1d73', // głęboki kobalt
      '#1838c0', // kobalt
      '#5f7ee6', // jasny kobalt
      '#ece5d3', // kość słoniowa
    ].map((h) => new THREE.Color(h).convertLinearToSRGB()) },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uFlash;
    uniform float uTime;
    uniform float uGain;
    uniform vec3 uPalette[5];
    varying vec2 vUv;

    float bayer4(vec2 p) {
      int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0));
      int i = x + y * 4;
      float m[16];
      m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;
      m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
      for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.0;
      return 0.5;
    }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 7.1) * 43758.5453); }

    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float lum = dot(c, vec3(0.3, 0.55, 0.15));
      // lekka winieta + ziarno papieru
      vec2 q = vUv - 0.5;
      lum *= 1.0 - dot(q, q) * 0.7;
      lum += (hash(gl_FragCoord.xy) - 0.5) * 0.035;
      lum = clamp(pow(lum * uGain, 0.85), 0.0, 1.0);

      float s = lum * 4.0;
      float i = floor(s);
      float f = s - i;
      if (f > bayer4(gl_FragCoord.xy)) i += 1.0;
      i = clamp(i, 0.0, 4.0);
      vec3 col = uPalette[0];
      if (i > 0.5) col = uPalette[1];
      if (i > 1.5) col = uPalette[2];
      if (i > 2.5) col = uPalette[3];
      if (i > 3.5) col = uPalette[4];
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function createPost(renderer, scene, camera, w, h) {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 1.0, 0.55, 0.72);
  composer.addPass(bloom);
  const after = new AfterimagePass(0.68);
  composer.addPass(after);
  composer.addPass(new OutputPass());
  const ps2 = new ShaderPass(PrintShader);
  composer.addPass(ps2);
  return { composer, bloom, after, ps2 };
}
