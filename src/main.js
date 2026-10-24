import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { createOcean } from './scene/ocean.js';
import { createSky } from './scene/sky.js';
import { createCastle } from './scene/castle.js';
import { LightningSystem } from './scene/lightning.js';
import { Rain, Splash } from './scene/effects.js';
import { createPost } from './scene/post.js';
import { Wizard } from './ui/wizard.js';
import { Dialog } from './ui/dialog.js';
const CANCEL = Dialog.CANCEL;
import { Title } from './ui/title.js';
import { Hud } from './ui/hud.js';
import { bandOrnament, revealBraille } from './ui/braille.js';
import { Tower } from './tower/index.js';

// ============================================================
//  SCENA
// ============================================================
const FOG = 0x0d0822;
const FOG_DENSITY = 0.0075;
const MOON_DIR = new THREE.Vector3(-0.5, 0.55, -0.65);

const scene = new THREE.Scene();
scene.background = new THREE.Color(FOG);
scene.fog = new THREE.FogExp2(FOG, FOG_DENSITY);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.5, 2000);
const CAM_BASE = new THREE.Vector3(0, 16, 100);
camera.position.copy(CAM_BASE);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.getElementById('stage').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x7a80ff, 0x140a28, 0.9));
const moon = new THREE.DirectionalLight(0x9aa8ff, 1.6);
moon.position.copy(MOON_DIR).multiplyScalar(200);
scene.add(moon);
// kontra z tyłu — fioletowa obwódka sylwetki zamku
const rim = new THREE.DirectionalLight(0xa060ff, 1.4);
rim.position.set(30, 60, -120);
scene.add(rim);
// światło od strony kamery, żeby zamek nie był płaską sylwetką
const front = new THREE.DirectionalLight(0xc8d0ff, 1.3);
front.position.set(80, 60, 140);
scene.add(front);
const boltLight = new THREE.PointLight(0xc9a0ff, 0, 260, 1);
scene.add(boltLight);

const sky = createSky(FOG);
scene.add(sky);
const ocean = createOcean(FOG, FOG_DENSITY, MOON_DIR);
scene.add(ocean);

const manager = new THREE.LoadingManager();
const castle = createCastle(CONFIG, manager);
const CASTLE_DOWN = -80;
castle.root.position.y = CASTLE_DOWN;
scene.add(castle.root);

const lightning = new LightningSystem(scene);
const rain = new Rain(scene);
const splash = new Splash(scene);

let post;
function resize() {
  const h = Math.min(CONFIG.renderHeight, innerHeight);
  const w = Math.round(h * innerWidth / innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  if (!post) post = createPost(renderer, scene, camera, w, h);
  else post.composer.setSize(w, h);
}
resize();
addEventListener('resize', resize);

// ============================================================
//  UI
// ============================================================
const wizard = new Wizard(document.getElementById('wizard-ascii'), renderer);
document.querySelector('.wiz-name').textContent = CONFIG.wizardName;
document.querySelector('.dlg-who').textContent = CONFIG.wizardName;
const hud = new Hud();

const dialog = new Dialog(document.getElementById('dialog'), wizard);
const title = new Title(document.getElementById('title'), CONFIG);
const fade = document.getElementById('fade');
let mode = 'storm'; // storm | tower
const tower = new Tower({
  renderer, post, dialog, wizard, hud, audio: Audio, config: CONFIG,
  onExit: () => goStorm(),
});
window.__portfolio = { tower, dialog }; // podgląd w konsoli przeglądarki
const boot = document.getElementById('boot');
const skipBtn = document.getElementById('skip');
const muteBtn = document.getElementById('mute');
const callBtn = document.getElementById('call');
const isTouch = matchMedia('(pointer: coarse)').matches;

muteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const m = Audio.toggleMute();
  muteBtn.textContent = m ? '[DŹWIĘK: NIE]' : '[DŹWIĘK: TAK]';
});

// ============================================================
//  STAN GRY
// ============================================================
const state = {
  phase: 'boot',      // boot | intro | draw | summon | free
  charge: 0,
  milestone: 0,
  flash: 0,
  shake: 0,
  impact: 0,
  summonT: 0,
  rise: 0,            // 0..1 wynurzenie zamku
  nextAmbient: 4,
  time: 0,
};

let chargeResolve = null;
const VISITED = 'arkanus.visited';
const store = {
  get() { try { return localStorage.getItem(VISITED); } catch { return null; } },
  set() { try { localStorage.setItem(VISITED, '1'); } catch { /* brak storage */ } },
};

function meterHTML() {
  const p = Math.min(1, state.charge / CONFIG.chargeNeeded);
  const n = 28, f = Math.round(p * n);
  return `VIS FULMINIS  [${'/'.repeat(f)}${'·'.repeat(n - f)}]  ${String(Math.round(p * 100)).padStart(3, ' ')}%`;
}

// ============================================================
//  SCENARIUSZ
// ============================================================
const W = CONFIG.wizardName;

async function intro() {
  state.phase = 'intro';
  await wait(1.2);

  if (store.get()) {
    const v = await dialog.say([
      { text: `Wróciłeś, wędrowcze! Burza wciąż pamięta twoją rękę.`, mood: 'happy' },
      { text: 'Przywołasz wieżę sam, czy mam ci ją od razu podać?', choices: [
        { label: 'I.    PRZYWOŁAM JĄ SAM', value: 'self' },
        { label: 'II.   OD RAZU DO WIEŻY', value: 'skip' },
      ] },
    ]);
    if (v === CANCEL) return;
    if (v === 'skip') { skipToEnd(); return; }
  } else {
    const r = await dialog.say([
      'Ach... gość! Dawno nikt nie zawitał na to przeklęte morze.',
      `Jestem ${W}, strażnik zatopionej wieży. Tak, zatopionej. Długa historia.`,
      'Morze pochłonęło ją w ostatnim sztormie. Tylko gniew nieba może wyrwać ją z głębin.',
    ]);
    if (r === CANCEL) return;
  }
  startDrawing();
}

function startDrawing() {
  if (state.phase !== 'intro') return;
  state.phase = 'draw';
  state.charge = 0;
  state.milestone = 0;
  const how = isTouch ? 'Przytrzymaj palec' : 'Przytrzymaj przycisk myszy';
  dialog.line({ text: `${how} i narysuj błyskawicę na niebie. Śmiało, nie gryzie... zbyt mocno.`, hold: true, mood: 'cast' });
  hud.log('INCANTATIO: FULMEN');
  dialog.setExtra(meterHTML());
  new Promise((r) => { chargeResolve = r; }).then(summon);
}

function onCharge(d) {
  if (state.phase !== 'draw') return;
  state.charge += d;
  dialog.setExtra(meterHTML());
  const p = state.charge / CONFIG.chargeNeeded;
  if (p > 0.35 && state.milestone === 0) {
    state.milestone = 1;
    dialog.line({ text: 'Dobrze! Czuję, jak niebo się budzi... Jeszcze!', hold: true, mood: 'happy' });
  } else if (p > 0.75 && state.milestone === 1) {
    state.milestone = 2;
    dialog.line({ text: 'Jeszcze odrobinę! Wieża już drży w głębinach!', hold: true, mood: 'cast' });
  }
  if (p >= 1 && chargeResolve) { const r = chargeResolve; chargeResolve = null; r(); }
}

function summon() {
  state.phase = 'summon';
  state.summonT = 0;
  dialog.setExtra('');
  dialog.close();
  lightning.end();
  Audio.crackle(false);
  store.set();
  hud.log('TURRIS SURGIT — WIEŻA SIĘ WYNURZA');
  hud.setChapter('CAP. I — TURRIS');
  wizard.set('cast');
}

// oś czasu przywołania, wołana co klatkę
function updateSummon(dt) {
  const t0 = state.summonT;
  const t = (state.summonT += dt);
  const at = (x) => t0 < x && t >= x;

  if (at(0.25)) { // WIELKIE UDERZENIE
    for (let i = 0; i < 4; i++) {
      lightning.strike(new THREE.Vector3((Math.random() - 0.5) * 30, 170, -20 + Math.random() * 10), new THREE.Vector3(0, 0, 0),
        { depth: 7, spread: 0.12, life: 1.2, jag: 0.8, branch: 0.12 });
    }
    flash(1.8, new THREE.Vector3(0, 1, -0.3));
    state.shake = 2.2;
    state.impact = 3;
    ocean.material.uniforms.uImpact.value.set(0, 0, 0);
    boltLight.position.set(0, 20, 10);
    splash.emitRing(6, 160, 1.4);
    Audio.thunder(1.5);
  }
  if (at(0.6)) { flash(1.0); Audio.thunder(0.8, 0.1); }
  if (t > 0.9 && t < 7.2) {
    const k = Math.min(1, (t - 0.9) / 6.0);
    state.rise = 1 - Math.pow(1 - k, 3); // ease-out
    state.shake = Math.max(state.shake, 0.5 * (1 - k) + 0.1);
    if (Math.random() < 0.7) splash.emitRing(19, 6, 0.8 + (1 - k));
    Audio.rumble(0.9 * (1 - k * 0.6));
  }
  if (at(5.2)) { title.reveal(); Audio.chime(); }
  if (at(7.2)) {
    Audio.rumble(0);
    state.rise = 1;
    state.phase = 'free';
    afterSummon();
  }
}

async function afterSummon() {
  await wait(1.6);
  await dialog.say([
    { text: `Oto ona — Wieża Portfolio! Tu spoczywają wszystkie dzieła, które stworzył ${CONFIG.name}.`, mood: 'point' },
    'Burza jest teraz twoja. Ciskaj błyskawicami do woli — kryształ na szczycie wieży je wyłapie.',
  ]);
  menu();
}

async function menu() {
  callBtn.classList.remove('show');
  const v = await dialog.line({ text: 'Co robimy dalej, wędrowcze?', choices: [
    { label: 'I.    WEJDŹ DO WIEŻY', value: 'enter' },
    { label: 'II.   ARTSTATION ↗', value: 'art' },
    { label: 'III.  ZOSTAŃ I PODZIWIAJ BURZĘ', value: 'stay' },
  ] });
  if (v === 'enter') { goTower(); return; }
  if (v === 'art') {
    window.open(CONFIG.artstation, '_blank', 'noopener');
    return menu();
  }
  dialog.close();
  callBtn.classList.add('show');
}

callBtn.addEventListener('click', (e) => { e.stopPropagation(); menu(); });

// ============================================================
//  PRZEJŚCIA: morze <-> wnętrze wieży
// ============================================================
async function goTower() {
  if (mode === 'tower') return;
  dialog.cancel();
  dialog.close();
  callBtn.classList.remove('show');
  Audio.thunder(0.8);
  flash(1.2);
  fade.classList.add('on');
  await wait(0.9);
  mode = 'tower';
  post.renderPass.scene = tower.scene;
  post.renderPass.camera = tower.camera;
  tower.camera.aspect = innerWidth / innerHeight;
  tower.camera.updateProjectionMatrix();
  document.getElementById('title').classList.add('away');
  fade.classList.remove('on');
  tower.enter();
}

async function goStorm() {
  fade.classList.add('on');
  await wait(0.9);
  mode = 'storm';
  post.renderPass.scene = scene;
  post.renderPass.camera = camera;
  document.getElementById('title').classList.remove('away');
  hud.setChapter('CAP. I — TURRIS');
  fade.classList.remove('on');
  await wait(0.6);
  menu();
}

function skipToEnd() {
  if (mode !== 'storm') return;
  if (state.phase === 'summon' || state.phase === 'free' || state.phase === 'boot') return;
  chargeResolve = null;
  dialog.cancel();
  dialog.setExtra('');
  dialog.close();
  state.phase = 'free';
  state.rise = 1;
  title.showInstant();
  hud.setChapter('CAP. I — TURRIS');
  hud.log('TURRIS SURGIT — WIEŻA SIĘ WYNURZA');
  flash(1.2);
  Audio.thunder(1);
  store.set();
  menu();
}
skipBtn.addEventListener('click', (e) => { e.stopPropagation(); skipToEnd(); skipBtn.classList.add('hide'); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') { skipToEnd(); skipBtn.classList.add('hide'); } });

// ============================================================
//  BŁYSKAWICE — wejście
// ============================================================
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const drawPlane = new THREE.Plane();
const hit = new THREE.Vector3();
let drawing = false, downInfo = null, strokeLen = 0;
const mouse = { x: 0, y: 0 };

function pointOnPlane(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  // pionowa płaszczyzna przechodząca przez zamek, zwrócona do kamery
  const n = new THREE.Vector3(camera.position.x, 0, camera.position.z).normalize();
  drawPlane.set(n, 0);
  if (!raycaster.ray.intersectPlane(drawPlane, hit)) return null;
  hit.y = Math.max(hit.y, 1.0);
  return hit.clone();
}

const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', (e) => {
  if (state.phase === 'boot' || mode !== 'storm') return;
  canvas.setPointerCapture(e.pointerId);
  downInfo = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
  const p = pointOnPlane(e.clientX, e.clientY);
  if (!p) return;
  drawing = true;
  strokeLen = 0;
  lightning.begin(p);
  Audio.crackle(true);
});
canvas.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
  if (!drawing || mode !== 'storm') return;
  if (downInfo) downInfo.moved += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
  const p = pointOnPlane(e.clientX, e.clientY);
  if (!p) return;
  const d = lightning.extend(p);
  if (d > 0) {
    strokeLen += d;
    onCharge(d);
    boltLight.position.copy(p);
    boltLight.intensity = 3 + Math.random() * 5;
    state.flash = Math.max(state.flash, 0.18 + Math.random() * 0.25);
    Audio.crackle(true);
  }
});

function endStroke(e) {
  if (!drawing) return;
  drawing = false;
  Audio.crackle(false);
  const end = lightning.end();
  const quick = downInfo && performance.now() - downInfo.t < 300 && strokeLen < 3;
  downInfo = null;
  if (quick) { dialog.advance(); return; }
  if (!end || strokeLen < 4) return;

  if (state.rise > 0.95) {
    // wyładowanie w kryształ na szczycie wieży
    const c = castle.crystalWorld(new THREE.Vector3());
    lightning.strike(end, c, { depth: 5, spread: 0.2, life: 0.45 });
    castle.glow = 1;
    hud.bolt('TURRIS / KRYSZTAŁ');
    flash(0.4, c.clone().sub(camera.position));
    boltLight.position.copy(c);
  } else {
    // wyładowanie w morze
    const to = new THREE.Vector3(end.x + (Math.random() - 0.5) * 10, 0, end.z + (Math.random() - 0.5) * 6);
    lightning.strike(end, to, { depth: 5, spread: 0.18, life: 0.45 });
    ocean.material.uniforms.uImpact.value.copy(to);
    state.impact = 1.6;
    splash.emitAt(to, 40);
    hud.bolt(`MARE  x${to.x >= 0 ? '+' : ''}${to.x.toFixed(1)}`);
    flash(0.45, to.clone().sub(camera.position));
    boltLight.position.copy(to).y += 6;
  }
  boltLight.intensity = 12;
  state.shake = Math.max(state.shake, 0.35);
  Audio.thunder(0.55 + Math.min(0.4, strokeLen / 150));
}
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);

function flash(v, dir) {
  state.flash = Math.max(state.flash, v);
  if (dir) sky.material.uniforms.uFlashDir.value.copy(dir).normalize();
}

// odległe błyski burzy
function ambientStorm(dt) {
  state.nextAmbient -= dt;
  if (state.nextAmbient > 0) return;
  state.nextAmbient = 4 + Math.random() * 8;
  const ang = (Math.random() - 0.5) * 2.2;
  const far = new THREE.Vector3(Math.sin(ang) * 320, 0, -Math.cos(ang) * 320 - 60);
  const dir = far.clone().setY(120).sub(camera.position);
  flash(0.35 + Math.random() * 0.3, dir);
  setTimeout(() => flash(0.5, dir), 90 + Math.random() * 120);
  if (Math.random() < 0.6) lightning.strike(far.clone().setY(220), far, { depth: 6, spread: 0.15, life: 0.35, jag: 1.5 });
  Audio.thunder(0.3 + Math.random() * 0.25, 0.8 + Math.random() * 1.5);
}

// ============================================================
//  START
// ============================================================
function smooth(x) { return x * x * (3 - 2 * x); }
function wait(s) { return new Promise((r) => setTimeout(r, s * 1000)); }

async function bootSequence() {
  const out = boot.querySelector('.boot-log');
  revealBraille(boot.querySelector('.boot-orn'), bandOrnament(40, 4), 1.4);
  const lines = [
    `CODEX ${W.toUpperCase()} · TOMUS I`,
    '────────────────────────────────',
    'PERGAMIN .................... OK',
    'ATRAMENT KOBALTOWY .......... OK',
    'CHMURY BURZOWE .............. OK',
    'MORZE WZBURZONE ............. OK',
    `MAGUS ${W.toUpperCase().padEnd(10, ' ')} ............ OBUDZONY`,
  ];
  for (const l of lines) {
    out.textContent += l + '\n';
    await wait(l ? 0.14 : 0.05);
  }
  boot.classList.add('ready');
  const go = (e) => {
    if (e.type === 'keydown' && !['Enter', ' '].includes(e.key)) return;
    removeEventListener('keydown', go);
    boot.removeEventListener('pointerdown', go);
    Audio.start();
    Audio.thunder(0.9);
    flash(1.2);
    boot.classList.add('gone');
    setTimeout(() => boot.remove(), 900);
    skipBtn.classList.add('show');
    document.body.classList.add('live');
    hud.log('LIBER APERTUS — KSIĘGA OTWARTA');
    intro();
  };
  addEventListener('keydown', go);
  boot.addEventListener('pointerdown', go);
}
bootSequence();

// ============================================================
//  PĘTLA
// ============================================================
const clock = new THREE.Clock();
const look = new THREE.Vector3();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = (state.time += dt);

  if (mode === 'tower') {
    tower.update(dt, t);
    post.ps2.uniforms.uTime.value = t;
    post.ps2.uniforms.uGain.value = 1.0 + tower.flash * 0.25;
    wizard.update(dt);
    dialog.update(dt);
    hud.update(dt, { charge: 1, wave: 0, flash: tower.flash });
    post.composer.render(dt);
    return;
  }

  if (state.phase === 'summon') updateSummon(dt);
  if (state.phase !== 'boot') ambientStorm(dt);

  // kamera: dryf łodzi + paralaksa myszy + wstrząsy
  state.shake *= Math.exp(-dt * 2.5);
  const sh = state.shake;
  // po przywołaniu kamera odpływa, żeby zamek zmieścił się nad oknem dialogu
  const back = smooth(state.rise);
  camera.position.set(
    CAM_BASE.x + Math.sin(t * 0.23) * 9 + mouse.x * 3 + (Math.random() - 0.5) * sh,
    CAM_BASE.y + back * 4 + Math.sin(t * 0.6) * 1.6 + Math.sin(t * 1.7) * 0.4 + (Math.random() - 0.5) * sh,
    CAM_BASE.z + back * 78 + Math.cos(t * 0.17) * 4,
  );
  look.set(0, 24 + back * 27 - mouse.y * 3, 0);
  camera.lookAt(look);
  camera.rotateZ(Math.sin(t * 0.5) * 0.02);
  sky.position.copy(camera.position);

  // zamek
  castle.root.position.y = CASTLE_DOWN * (1 - state.rise) + Math.sin(t * 0.8) * 0.15 * state.rise;
  castle.root.rotation.y = 0.35;
  castle.update(dt, t);

  // błyski
  state.flash *= Math.exp(-dt * 5.5);
  state.impact *= Math.exp(-dt * 4);
  boltLight.intensity *= Math.exp(-dt * 7);
  const f = state.flash;
  const ou = ocean.material.uniforms;
  ou.uTime.value = t;
  ou.uFlash.value = f;
  ou.uImpactStrength.value = state.impact;
  ou.uCastle.value = Math.min(1, state.rise * 1.5) * (state.phase === 'summon' ? 1 : 0.45);
  sky.material.uniforms.uTime.value = t;
  sky.material.uniforms.uFlash.value = f;
  moon.intensity = 1.6 + f * 6;
  post.ps2.uniforms.uFlash.value = f;
  post.ps2.uniforms.uGain.value = 1.0 + f * 0.35;
  post.ps2.uniforms.uTime.value = t;

  lightning.update(dt);
  rain.update(dt, f);
  splash.update(dt);
  wizard.flash = Math.max(wizard.flash, f * 0.6);
  wizard.update(dt);
  hud.update(dt, { charge: Math.min(1, state.charge / CONFIG.chargeNeeded), wave: 3.2 + Math.sin(t * 0.7) * 0.9 + Math.sin(t * 1.9) * 0.3, flash: f });
  dialog.update(dt);
  title.update(dt);

  post.composer.render(dt);
}
tick();
