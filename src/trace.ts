import { sfx } from './audio';

const FONT = '"Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif';
const CELL = 12;
const BRUSH = 26;
const NEEDED = 0.7;

/** Finger-tracing on a canvas. Calls onDone once enough of the glyph has been covered. */
export function mountTrace(host: HTMLElement, glyph: string, onDone: () => void) {
  const w = host.clientWidth;
  const h = host.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const canvas = document.createElement('canvas');
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.className = 'trace-canvas';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const fontSize = Math.min(h * 0.9, w * 0.8);
  const drawGlyph = (c: CanvasRenderingContext2D) => {
    c.font = `bold ${fontSize}px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(glyph, w / 2, h / 2 + fontSize * 0.05);
  };

  // Guide
  ctx.fillStyle = '#e8ecf4';
  drawGlyph(ctx);

  // Which grid cells lie inside the glyph?
  const mask = document.createElement('canvas');
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext('2d', { willReadFrequently: true })!;
  mctx.fillStyle = '#000';
  drawGlyph(mctx);
  const data = mctx.getImageData(0, 0, w, h).data;
  const targets: { x: number; y: number; done: boolean }[] = [];
  for (let y = CELL / 2; y < h; y += CELL) {
    for (let x = CELL / 2; x < w; x += CELL) {
      if (data[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 128) targets.push({ x, y, done: false });
    }
  }
  let covered = 0;
  let finished = false;

  const cover = (x: number, y: number) => {
    for (const t of targets) {
      if (!t.done && (t.x - x) ** 2 + (t.y - y) ** 2 <= BRUSH * BRUSH) {
        t.done = true;
        covered++;
      }
    }
    if (!finished && targets.length && covered / targets.length >= NEEDED) {
      finished = true;
      sfx.ok();
      setTimeout(onDone, 700);
    }
  };

  ctx.strokeStyle = '#ff7a59';
  ctx.lineWidth = BRUSH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let last: { x: number; y: number } | null = null;
  const pos = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    last = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(last.x + 0.1, last.y);
    ctx.stroke();
    cover(last.x, last.y);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!last) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    const steps = Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 8);
    for (let i = 1; i <= steps; i++) {
      cover(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps);
    }
    last = p;
  });
  const end = () => { last = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}
