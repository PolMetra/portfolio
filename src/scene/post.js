import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Łańcuch "PS2": render w niskiej rozdzielczości -> miękki bloom ->
// smużenie klatek (ghosting) -> tone mapping -> 16-bitowy kolor z ditheringiem.

const PS2Shader = {
  uniforms: {
    tDiffuse: { value: null },
    uFlash: { value: 0 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uFlash;
    uniform float uTime;
    varying vec2 vUv;

    float bayer4(vec2 p) {
      int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0));
      int i = x + y * 4;
      float m[16];
      m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;
      m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
      for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.0;
      return 0.0;
    }

    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      // lekki "lift" cieni w fiolet
      c = c + vec3(0.012, 0.004, 0.03) * (1.0 - c);
      // błysk całego ekranu
      c += uFlash * 0.12 * vec3(0.8, 0.7, 1.0);
      // winieta
      vec2 q = vUv - 0.5;
      c *= 1.0 - dot(q, q) * 0.9;
      // 5 bitów na kanał (jak 16-bitowy framebuffer) + dithering Bayera
      float levels = 31.0;
      float d = bayer4(gl_FragCoord.xy) - 0.5;
      c = floor(c * levels + 0.5 + d) / levels;
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
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
  const ps2 = new ShaderPass(PS2Shader);
  composer.addPass(ps2);
  return { composer, bloom, after, ps2 };
}
