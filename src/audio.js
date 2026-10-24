// Proceduralny dźwięk (bez plików).
//
// Szyny:
//   outdoor (morze, deszcz, wiatr, grzmoty, trzask błyskawicy, dudnienie)
//     → filtr "okna" (w wieży: przytłumione, jakby za szybą)
//   indoor  (świece — słychać je tylko w wieży)
//   ui      (blipy dialogu, dzwonki)
//   wszystko → kompresor (żadnych nagłych pików) → master (startuje cicho, łagodnie narasta)

const VOLUME = 0.55;        // docelowa głośność całości (0–1)
const FADE_IN = 6;          // ile sekund narasta dźwięk po wejściu na stronę

let ctx = null;
let master, comp, outdoor, windowLP, windowGain, indoor, ui, reverb, reverbSend;
let crackleGain, rumbleGain, rainBus, gustLFO;
let noiseL, noiseR, brownBuf;
let muted = false;
let isIndoor = false;
let dropTimer = null, candleTimer = null;

// ---------- bufory szumu ----------
function makeNoise(seconds, kind = 'white') {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0, b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else if (kind === 'pink') { b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; d[i] = (b0 + b1 + b2 + w * 0.06) * 1.6; }
    else d[i] = w;
  }
  return buf;
}

// pogłos generowany: zanikający szum stereo
function makeImpulse(seconds = 3.2, decay = 2.6) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function src(buffer, loop = true, rate = 1) {
  const s = ctx.createBufferSource();
  s.buffer = buffer; s.loop = loop; s.playbackRate.value = rate;
  if (loop) s.loopStart = Math.random() * buffer.duration * 0.5;
  return s;
}
function filt(type, freq, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  return f;
}
function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
function pan(v) { const p = ctx.createStereoPanner ? ctx.createStereoPanner() : gain(1); if (p.pan) p.pan.value = v; return p; }

// pętla szumu: źródło → filtr → [panorama] → głośność → cel
function loop(buffer, type, freq, level, dest, { q = 0.7, p = 0, rate = 1 } = {}) {
  const s = src(buffer, true, rate);
  const f = filt(type, freq, q);
  const g = gain(level);
  s.connect(f).connect(pan(p)).connect(g).connect(dest);
  s.start(0, Math.random() * buffer.duration);
  return { s, f, g };
}

// ---------- DESZCZ ----------
function buildRain() {
  rainBus = gain(0.6);
  rainBus.connect(outdoor);

  // szeroki szum kropel, osobno lewy i prawy kanał (przestrzeń)
  loop(noiseL, 'bandpass', 5200, 0.05, rainBus, { q: 0.4, p: -0.6 });
  loop(noiseR, 'bandpass', 4600, 0.05, rainBus, { q: 0.4, p: 0.6 });
  // "ciało" deszczu uderzającego o wodę
  loop(noiseL, 'bandpass', 1300, 0.07, rainBus, { q: 0.6, p: 0.2 });
  // morze i wiatr — niski szum
  const sea = loop(brownBuf, 'lowpass', 380, 0.26, outdoor);
  // podmuchy wiatru: wolne LFO na głośności i barwie deszczu
  gustLFO = ctx.createOscillator(); gustLFO.frequency.value = 0.07;
  const gustDepth = gain(0.35);
  gustLFO.connect(gustDepth).connect(rainBus.gain); gustDepth.gain.value = 0.22;
  const gust2 = ctx.createOscillator(); gust2.frequency.value = 0.045;
  const gustFreq = gain(160);
  gust2.connect(gustFreq).connect(sea.f.frequency);
  // świst wiatru
  const whistle = loop(noiseR, 'bandpass', 700, 0.018, outdoor, { q: 9 });
  const wl = ctx.createOscillator(); wl.frequency.value = 0.031;
  const wlg = gain(0.018); wl.connect(wlg).connect(whistle.g.gain);
  const wf = ctx.createOscillator(); wf.frequency.value = 0.05;
  const wfg = gain(220); wf.connect(wfg).connect(whistle.f.frequency);
  [gustLFO, gust2, wl, wf].forEach((o) => o.start());

  // pojedyncze krople: krótkie, losowe "tyknięcia" w różnych miejscach stereo
  const drop = () => {
    if (!ctx) return;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const t = ctx.currentTime + Math.random() * 0.08;
      const s = src(noiseL, false);
      const f = filt('bandpass', 1800 + Math.random() * 4500, 6 + Math.random() * 8);
      const g = gain(0);
      const amp = 0.05 + Math.random() * 0.1;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.05);
      s.connect(f).connect(pan(Math.random() * 2 - 1)).connect(g).connect(rainBus);
      s.start(t, Math.random() * 2); s.stop(t + 0.12);
    }
    dropTimer = setTimeout(drop, 25 + Math.random() * 90);
  };
  drop();
}

// ---------- ŚWIECE I KOMINEK (tylko w wieży) ----------
function buildCandles() {
  // cichy, ciepły szum płomienia z delikatnym "oddechem"
  const flame = loop(noiseR, 'bandpass', 420, 0.022, indoor, { q: 0.9 });
  const breathe = ctx.createOscillator(); breathe.frequency.value = 0.23;
  const bg = gain(0.008); breathe.connect(bg).connect(flame.g.gain); breathe.start();
  // kominek: niski szum ognia, który "oddycha"
  const roar = loop(brownBuf, 'lowpass', 240, 0.16, indoor);
  const rl = ctx.createOscillator(); rl.frequency.value = 0.17;
  const rlg = gain(0.05); rl.connect(rlg).connect(roar.g.gain); rl.start();
  const hiss = loop(noiseL, 'highpass', 6000, 0.008, indoor);
  void hiss;
  // trzaski knota: krótkie, suche kliknięcia, czasem seria
  const crack = () => {
    if (!ctx) return;
    if (isIndoor) {
      // czasem głębszy "strzał" wilgotnego polana z kominka
      if (Math.random() < 0.18) {
        const t = ctx.currentTime;
        const sp = src(noiseR, false);
        const f = filt('bandpass', 700 + Math.random() * 700, 1.4);
        const g = gain(0);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.1, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09 + Math.random() * 0.08);
        sp.connect(f).connect(pan(0.45)).connect(g).connect(indoor);
        sp.start(t, Math.random() * 2); sp.stop(t + 0.25);
      }
      const burst = Math.random() < 0.35 ? 2 + Math.floor(Math.random() * 4) : 1;
      for (let k = 0; k < burst; k++) {
        const t = ctx.currentTime + k * (0.02 + Math.random() * 0.05);
        const s = src(noiseL, false);
        const f = filt('highpass', 2500 + Math.random() * 3000);
        const g = gain(0);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.07, t + 0.001);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012 + Math.random() * 0.02);
        s.connect(f).connect(pan(Math.random() * 1.2 - 0.6)).connect(g).connect(indoor);
        s.start(t, Math.random() * 2); s.stop(t + 0.05);
      }
    }
    candleTimer = setTimeout(crack, 120 + Math.random() * 700);
  };
  crack();
}

export const Audio = {
  start() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    master = gain(0);
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6;
    comp.attack.value = 0.004; comp.release.value = 0.35;
    comp.connect(master).connect(ctx.destination);
    // łagodne wejście: zaczyna prawie od ciszy
    const now = ctx.currentTime;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(muted ? 0 : VOLUME * 0.35, now + 1.5);
    master.gain.linearRampToValueAtTime(muted ? 0 : VOLUME, now + FADE_IN);

    // szyna zewnętrzna przez filtr okna
    outdoor = gain(1);
    windowLP = filt('lowpass', 20000, 0.5);
    windowGain = gain(1);
    outdoor.connect(windowLP).connect(windowGain).connect(comp);
    indoor = gain(0); indoor.connect(comp);
    ui = gain(0.8); ui.connect(comp);

    // pogłos dla grzmotów
    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse();
    reverbSend = gain(0.5);
    reverbSend.connect(reverb).connect(outdoor);

    noiseL = makeNoise(4);
    noiseR = makeNoise(4.3);
    brownBuf = makeNoise(5, 'brown');

    buildRain();
    buildCandles();

    // trzask rysowanej błyskawicy i dudnienie wynurzania
    crackleGain = loop(noiseL, 'bandpass', 2600, 0, outdoor, { q: 1.2 }).g;
    rumbleGain = loop(brownBuf, 'lowpass', 85, 0, outdoor).g;
  },

  get ready() { return !!ctx; },

  toggleMute() {
    muted = !muted;
    if (master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(muted ? 0 : VOLUME, ctx.currentTime, 0.08);
    }
    return muted;
  },
  get muted() { return muted; },

  // w wieży: deszcz i burza przytłumione, jakby za oknem; słychać świece
  setIndoor(on) {
    isIndoor = on;
    if (!ctx) return;
    const t = ctx.currentTime;
    windowLP.frequency.cancelScheduledValues(t);
    windowLP.frequency.setTargetAtTime(on ? 650 : 20000, t, on ? 0.4 : 0.6);
    windowGain.gain.setTargetAtTime(on ? 0.55 : 1, t, 0.5);
    indoor.gain.setTargetAtTime(on ? 1 : 0, t, 0.8);
  },

  // grzmot: trzask (seria wyładowań) + uderzenie + toczący się pomruk z pogłosem.
  // power ~0.3 (daleko) … 1.5 (tuż obok), delay = odległość
  thunder(power = 1, delay = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const near = Math.min(1, power / 1.2);
    const side = Math.random() * 1.6 - 0.8;

    // 1) TRZASK — kilka bardzo krótkich wyładowań, im bliżej tym ostrzejszy
    const cracks = 2 + Math.floor(near * 5);
    for (let k = 0; k < cracks; k++) {
      const tk = t + k * (0.012 + Math.random() * 0.04);
      const s = src(noiseR, false);
      const f = filt('highpass', 900 + near * 1800);
      const g = gain(0);
      const amp = (0.35 + Math.random() * 0.4) * near * power;
      g.gain.setValueAtTime(0, tk);
      g.gain.linearRampToValueAtTime(amp, tk + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, tk + 0.05 + Math.random() * 0.08);
      s.connect(f).connect(pan(side + (Math.random() - 0.5) * 0.4)).connect(g);
      g.connect(outdoor); g.connect(reverbSend);
      s.start(tk, Math.random() * 3); s.stop(tk + 0.2);
    }

    // 2) UDERZENIE — niski "bum" (opadający sinus + niski szum)
    const boomT = t + 0.03;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(70, boomT);
    o.frequency.exponentialRampToValueAtTime(28, boomT + 0.9);
    const og = gain(0);
    og.gain.setValueAtTime(0, boomT);
    og.gain.linearRampToValueAtTime(0.55 * power, boomT + 0.03);
    og.gain.exponentialRampToValueAtTime(0.0001, boomT + 1.4);
    o.connect(og).connect(outdoor);
    o.start(boomT); o.stop(boomT + 1.5);

    // 3) POMRUK — długi, toczący się (modulacja amplitudy), szeroki w stereo
    const dur = 3 + power * 3;
    for (const [buf, p] of [[noiseL, side - 0.5], [noiseR, side + 0.5]]) {
      const s = src(buf, true, 0.6);
      const f = filt('lowpass', 900);
      f.frequency.setValueAtTime(500 + near * 900, t);
      f.frequency.exponentialRampToValueAtTime(60, t + dur);
      const g = gain(0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5 * power, t + 0.08 + (1 - near) * 0.5);
      g.gain.setTargetAtTime(0.22 * power, t + 0.4, 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      // toczenie: fale głośności nałożone na obwiednię
      const rollAmp = gain(1);
      const roll = ctx.createOscillator(); roll.frequency.value = 1.2 + Math.random() * 1.6;
      const rg = gain(0.4);
      roll.connect(rg).connect(rollAmp.gain);
      s.connect(f).connect(pan(Math.max(-1, Math.min(1, p)))).connect(g).connect(rollAmp);
      rollAmp.connect(outdoor); rollAmp.connect(reverbSend);
      s.start(t, Math.random() * 3); s.stop(t + dur + 0.1);
      roll.start(t); roll.stop(t + dur);
    }
  },

  crackle(on) {
    if (!ctx) return;
    crackleGain.gain.setTargetAtTime(on ? 0.12 + Math.random() * 0.1 : 0, ctx.currentTime, on ? 0.01 : 0.08);
  },

  rumble(level) {
    if (!ctx) return;
    rumbleGain.gain.setTargetAtTime(level * 0.8, ctx.currentTime, 0.3);
  },

  blip(pitch = 1) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square';
    o.frequency.value = (520 + Math.random() * 120) * pitch;
    const f = filt('lowpass', 2400);
    const g = gain(0);
    g.gain.setValueAtTime(0.03, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
    o.connect(f).connect(g).connect(ui);
    o.start(t); o.stop(t + 0.06);
  },

  chime() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1046].forEach((fr, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = fr;
      const g = gain(0);
      g.gain.setValueAtTime(0, t + i * 0.09);
      g.gain.linearRampToValueAtTime(0.05, t + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0005, t + i * 0.09 + 1.2);
      o.connect(g).connect(ui);
      o.start(t + i * 0.09); o.stop(t + i * 0.09 + 1.3);
    });
  },
};
