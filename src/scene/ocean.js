import * as THREE from 'three';

// Wzburzone morze: fale Gerstnera liczone w vertex shaderze,
// płaskie cieniowanie (fasetki jak w grach z PS2), piana na grzbietach,
// rozświetlanie przez błyskawice i pierścień piany wokół zamku.

const vertex = /* glsl */`
uniform float uTime;
uniform float uStorm;
varying vec3 vWorld;
varying float vCrest;

// jedna fala Gerstnera: dir, stromość, długość
vec3 gerstner(vec2 p, vec2 dir, float steep, float len, inout float crest) {
  float k = 6.28318 / len;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(dir);
  float f = k * (dot(d, p) - c * uTime);
  float a = steep / k;
  crest += max(0.0, sin(f)) * steep;
  return vec3(d.x * a * cos(f), a * sin(f), d.y * a * cos(f));
}

void main() {
  vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
  vec2 xz = p.xz;
  float crest = 0.0;
  vec3 o = vec3(0.0);
  o += gerstner(xz, vec2( 1.0,  0.35), 0.22 * uStorm, 46.0, crest);
  o += gerstner(xz, vec2( 0.2,  1.0 ), 0.18 * uStorm, 31.0, crest);
  o += gerstner(xz, vec2(-0.7,  0.6 ), 0.14 * uStorm, 19.0, crest);
  o += gerstner(xz, vec2( 0.9, -0.4 ), 0.10 * uStorm, 11.0, crest);
  o += gerstner(xz, vec2(-0.3, -1.0 ), 0.07 * uStorm,  6.5, crest);
  p += o;
  vWorld = p;
  vCrest = crest;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;

const fragment = /* glsl */`
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uMoonDir;
uniform float uFlash;
uniform vec3 uImpact;
uniform float uImpactStrength;
uniform float uCastle;
uniform float uTime;
varying vec3 vWorld;
varying float vCrest;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

void main() {
  // fasetkowa normalna z pochodnych ekranowych => low-poly look
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  if (n.y < 0.0) n = -n;

  vec3 viewDir = normalize(cameraPosition - vWorld);
  vec3 deep    = vec3(0.012, 0.010, 0.040);
  vec3 shallow = vec3(0.060, 0.045, 0.160);

  float diff = max(dot(n, uMoonDir), 0.0);
  float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  vec3 col = mix(deep, shallow, diff * 0.8);
  col += fres * vec3(0.12, 0.10, 0.30);

  // odblask księżyca
  vec3 h = normalize(uMoonDir + viewDir);
  float spec = pow(max(dot(n, h), 0.0), 60.0);
  col += spec * vec3(0.55, 0.60, 1.0) * 0.8;

  // piana na grzbietach fal
  float foamN = noise(vWorld.xz * 0.35 + uTime * 0.3);
  float foam = smoothstep(0.42, 0.68, vCrest + foamN * 0.12);
  col = mix(col, vec3(0.45, 0.42, 0.68), foam * 0.4);

  // pierścień piany wokół wynurzającego się zamku
  float d = length(vWorld.xz);
  float ring = smoothstep(30.0, 20.0, d) * smoothstep(12.0, 18.0, d);
  float churn = noise(vWorld.xz * 0.5 - uTime * 1.5);
  col = mix(col, vec3(0.70, 0.68, 0.90), ring * uCastle * (0.35 + 0.65 * churn));

  // błysk burzy + punkt uderzenia pioruna
  col += uFlash * (0.06 + 0.35 * diff + fres * 0.4) * vec3(0.55, 0.45, 1.0);
  float imp = exp(-distance(vWorld, uImpact) * 0.06) * uImpactStrength;
  col += imp * vec3(0.9, 0.8, 1.6);

  // mgła exp2 (jak scene.fog)
  float dist = length(cameraPosition - vWorld);
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  col = mix(col, uFogColor * (1.0 + uFlash * 1.2), clamp(fog, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export function createOcean(fogColor, fogDensity, moonDir) {
  const geo = new THREE.PlaneGeometry(900, 900, 220, 220);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uTime: { value: 0 },
      uStorm: { value: 1.0 },
      uFogColor: { value: new THREE.Color(fogColor) },
      uFogDensity: { value: fogDensity },
      uMoonDir: { value: moonDir.clone().normalize() },
      uFlash: { value: 0 },
      uImpact: { value: new THREE.Vector3(0, -999, 0) },
      uImpactStrength: { value: 0 },
      uCastle: { value: 0 },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -150; // przesunięcie, żeby dalekie morze było przed kamerą
  mesh.frustumCulled = false;
  return mesh;
}
