// Proceduralny dźwięk (bez plików): szum burzy, deszcz, grzmoty,
// trzask rysowanej błyskawicy, dudnienie wynurzania i "blipy" dialogu.

let ctx = null;
let master, crackleGain, rumbleGain;
let noiseBuf = null;
let muted = false;

function makeNoise(seconds = 3, brown = false) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return buf;
}

function loopNoise(buffer, filterType, freq, gain, q = 0.7) {
  const src = ctx.createBufferSource();
  src.buffer = buffer; src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start();
  return g;
}

export const Audio = {
  start() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
    noiseBuf = makeNoise(3);
    const brown = makeNoise(4, true);
    loopNoise(brown, 'lowpass', 420, 0.55);           // szum morza / wiatru
    loopNoise(noiseBuf, 'highpass', 3500, 0.035);     // deszcz
    crackleGain = loopNoise(noiseBuf, 'bandpass', 2400, 0, 1.5); // trzask pioruna
    rumbleGain = loopNoise(brown, 'lowpass', 90, 0);  // dudnienie zamku
  },

  get ready() { return !!ctx; },

  toggleMute() {
    muted = !muted;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05);
    return muted;
  },
  get muted() { return muted; },

  thunder(power = 1, delay = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    // trzask
    const s1 = ctx.createBufferSource(); s1.buffer = noiseBuf;
    const f1 = ctx.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = 900;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.5 * power, t + 0.01);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    s1.connect(f1).connect(g1).connect(master);
    s1.start(t); s1.stop(t + 0.5);
    // grzmot
    const s2 = ctx.createBufferSource(); s2.buffer = noiseBuf; s2.loop = true;
    const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass';
    f2.frequency.setValueAtTime(700, t);
    f2.frequency.exponentialRampToValueAtTime(70, t + 3 * power + 0.5);
    const g2 = ctx.createGain();
    const dur = 2 + power * 2.5;
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(0.9 * power, t + 0.06);
    g2.gain.setTargetAtTime(0.35 * power, t + 0.2, 0.3);
    g2.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s2.connect(f2).connect(g2).connect(master);
    s2.start(t); s2.stop(t + dur + 0.1);
  },

  crackle(on) {
    if (!ctx) return;
    crackleGain.gain.setTargetAtTime(on ? 0.16 + Math.random() * 0.12 : 0, ctx.currentTime, on ? 0.01 : 0.08);
  },

  rumble(level) {
    if (!ctx) return;
    rumbleGain.gain.setTargetAtTime(level, ctx.currentTime, 0.3);
  },

  blip(pitch = 1) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square';
    o.frequency.value = (520 + Math.random() * 120) * pitch;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.035, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.06);
  },

  chime() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.09);
      g.gain.linearRampToValueAtTime(0.06, t + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0005, t + i * 0.09 + 1.2);
      o.connect(g).connect(master);
      o.start(t + i * 0.09); o.stop(t + i * 0.09 + 1.3);
    });
  },
};
