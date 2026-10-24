import * as THREE from 'three';

// Proceduralne niebo burzowe: gradient + przesuwające się chmury (fbm),
// chmury podświetlane od środka przy błyskawicach.

const vertex = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww; // zawsze na "nieskończoności"
}
`;

const fragment = /* glsl */`
uniform float uTime;
uniform float uFlash;
uniform vec3 uFlashDir;
uniform vec3 uFogColor;
varying vec3 vDir;

float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main() {
  vec3 d = normalize(vDir);
  float up = max(d.y, 0.0);

  // rzut na "sufit" chmur
  vec2 uv = d.xz / (d.y + 0.12) * 1.4;
  uv += vec2(uTime * 0.025, uTime * 0.012);
  float c = fbm(uv);
  float c2 = fbm(uv * 2.3 - uTime * 0.04);
  float clouds = smoothstep(0.35, 0.85, c * 0.75 + c2 * 0.35);

  vec3 top = vec3(0.010, 0.006, 0.030);
  vec3 col = mix(uFogColor, top, smoothstep(0.0, 0.55, up));
  vec3 cloudCol = vec3(0.09, 0.06, 0.20);
  col = mix(col, cloudCol, clouds * smoothstep(-0.02, 0.25, d.y));

  // błysk: chmury rozświetlone od środka wokół kierunku błyskawicy
  float near = pow(max(dot(d, normalize(uFlashDir)), 0.0), 6.0);
  float lit = uFlash * (0.15 + 1.3 * near) * (0.25 + clouds * 1.2);
  col += lit * vec3(0.55, 0.40, 1.0);

  // horyzont tonie w mgle
  col = mix(uFogColor * (1.0 + uFlash * 1.2), col, smoothstep(-0.05, 0.18, d.y));

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export function createSky(fogColor) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uFlash: { value: 0 },
      uFlashDir: { value: new THREE.Vector3(0, 0.5, -1) },
      uFogColor: { value: new THREE.Color(fogColor) },
    },
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}
