export type Track = { id: string; hits: number[]; vol: number; on: boolean };
export type SongState = { tracks: Track[]; bpm: number };

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
const samples: Record<string, AudioBuffer> = {};
const customs: { id: string; name: string }[] = [];
export const getCustoms = () => customs.slice();
export const customName = (id: string) => customs.find((c) => c.id === id)?.name ?? '내 소리';
let engineT0 = 0;
let engineStepDur = 0.15;
export function currentStep() {
  if (!ctx) return 0;
  return ((((ctx.currentTime - engineT0) / engineStepDur) % 16) + 16) % 16;
}

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.start();
  return () =>
    new Promise<{ id: string; name: string } | null>((resolve) => {
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        try {
          const buf = await getCtx().decodeAudioData(await new Blob(chunks).arrayBuffer());
          const n = customs.length + 1;
          const c = { id: `rec${n}`, name: `내 소리 ${n}` };
          samples[c.id] = buf;
          customs.push(c);
          resolve(c);
        } catch {
          resolve(null);
        }
      };
      if (rec.state !== 'inactive') rec.stop();
    });
}

const SAMPLE_IDS = ['keyboard', 'water', 'oven', 'cat', 'pot', 'zipper', 'door'];

export function preloadSamples() {
  const c = getCtx();
  SAMPLE_IDS.forEach((id) => {
    if (samples[id]) return;
    fetch(`${import.meta.env.BASE_URL}audio/${id}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((b) => c.decodeAudioData(b))
      .then((buf) => {
        samples[id] = buf;
      })
      .catch(() => {});
  });
}

function getCtx() {
  if (!ctx) {
    ctx = new AudioContext();
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function env(c: AudioContext, t: number, peak: number, dur: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(c.destination);
  return g;
}

function osc(c: AudioContext, type: OscillatorType, f0: number, f1: number, t: number, dur: number, out: AudioNode) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  o.connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function hiss(c: AudioContext, t: number, dur: number, type: BiquadFilterType, f0: number, f1: number, out: AudioNode) {
  const s = c.createBufferSource();
  s.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  s.connect(f);
  f.connect(out);
  s.start(t, Math.random() * 0.5, dur + 0.02);
}

export function playVoice(id: string, vol: number, when?: number) {
  const c = getCtx();
  const t = when ?? c.currentTime;
  const v = vol * 0.8;
  const buf = samples[id];
  if (buf) {
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    const len = Math.min(buf.duration, 1.6);
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + Math.max(0, len - 0.08));
    g.gain.linearRampToValueAtTime(0.0001, t + len);
    src.connect(g);
    g.connect(c.destination);
    src.start(t, 0, len);
    return;
  }
  switch (id) {
    case 'keyboard': {
      const g = env(c, t, v, 0.06);
      hiss(c, t, 0.06, 'bandpass', 3200, 2400, g);
      break;
    }
    case 'water': {
      const g = env(c, t, v * 0.9, 0.18);
      osc(c, 'sine', 1400, 520, t, 0.16, g);
      break;
    }
    case 'oven': {
      const g = env(c, t, v * 0.5, 0.16);
      osc(c, 'sine', 1760, 1760, t, 0.14, g);
      break;
    }
    case 'cat': {
      const g = env(c, t, v * 0.5, 0.4);
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1100;
      f.Q.value = 2;
      f.connect(g);
      osc(c, 'sawtooth', 620, 880, t, 0.14, f);
      osc(c, 'sawtooth', 880, 420, t + 0.14, 0.24, f);
      break;
    }
    case 'pot': {
      const g = env(c, t, v * 0.45, 0.45);
      osc(c, 'square', 520, 515, t, 0.4, g);
      osc(c, 'square', 833, 828, t, 0.4, g);
      break;
    }
    case 'zipper': {
      const g = env(c, t, v * 0.6, 0.22);
      hiss(c, t, 0.22, 'highpass', 1500, 6000, g);
      break;
    }
    case 'door': {
      const g = env(c, t, v * 1.2, 0.3);
      osc(c, 'sine', 110, 45, t, 0.28, g);
      const g2 = env(c, t, v * 0.5, 0.1);
      hiss(c, t, 0.1, 'lowpass', 900, 200, g2);
      break;
    }
    default: {
      const g = env(c, t, v * 0.6, 0.12);
      osc(c, 'triangle', 440, 330, t, 0.1, g);
    }
  }
}

export function createEngine(get: () => SongState, onStep: (step: number) => void) {
  const c = getCtx();
  let step = 0;
  let next = c.currentTime + 0.06;
  engineT0 = next;
  engineStepDur = 60 / get().bpm / 4;
  const timers: number[] = [];
  const tick = () => {
    const s = get();
    const dur = 60 / s.bpm / 4;
    while (next < c.currentTime + 0.12) {
      const at = next;
      for (const tr of s.tracks) {
        if (!tr.on) continue;
        for (const p of tr.hits) if (Math.floor(p) === step) playVoice(tr.id, tr.vol, at + (p - step) * dur);
      }
      const cur = step;
      timers.push(window.setTimeout(() => onStep(cur), Math.max(0, (at - c.currentTime) * 1000)));
      if (timers.length > 64) timers.shift();
      next += dur;
      step = (step + 1) % 16;
    }
  };
  const id = window.setInterval(tick, 25);
  tick();
  return () => {
    window.clearInterval(id);
    timers.forEach(clearTimeout);
  };
}
