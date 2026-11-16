import { loadSettings } from './progress';
import { slug } from './phrases.ts';

// Recorded clips (see scripts/make-audio.mjs). Missing ones fall back to the tablet's voice.
const clips = import.meta.glob('./clips/*.m4a', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  ok: () => { tone(660, 0, 0.14); tone(880, 0.1, 0.22); },
  bad: () => { tone(220, 0, 0.22, 'triangle', 0.14); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3)),
  tap: () => tone(520, 0, 0.06, 'sine', 0.1),
};

let current: HTMLAudioElement | null = null;
let token = 0;

function playClip(url: string): Promise<void> {
  return new Promise((done) => {
    const a = new Audio(url);
    a.volume = 1;
    current = a;
    a.onended = a.onpause = a.onerror = () => done();
    a.play().catch(() => done());
  });
}

function sayWithTablet(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  return new Promise((done) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.85;
    u.volume = 1;
    u.onend = u.onerror = () => done();
    speechSynthesis.speak(u);
  });
}

/** Speak phrases one after another; a new call interrupts the previous one. */
export async function speak(...texts: string[]) {
  if (!loadSettings().voice) return;
  const me = ++token;
  current?.pause();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  for (const text of texts) {
    if (me !== token) return;
    const url = clips[`./clips/${slug(text)}.m4a`];
    await (url ? playClip(url) : sayWithTablet(text));
  }
}
