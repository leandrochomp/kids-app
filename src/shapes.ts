export const SHAPES_BY_LEVEL: string[][] = [
  ['circle', 'square', 'triangle'],
  ['circle', 'square', 'triangle', 'rectangle', 'star'],
  ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'diamond', 'oval'],
];

function star(): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 19 : 45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(54 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}"/>`;
}

const PATHS: Record<string, string> = {
  circle: '<circle cx="50" cy="50" r="42"/>',
  square: '<rect x="12" y="12" width="76" height="76" rx="3"/>',
  rectangle: '<rect x="4" y="24" width="92" height="52" rx="3"/>',
  triangle: '<polygon points="50,8 93,88 7,88"/>',
  diamond: '<polygon points="50,4 93,50 50,96 7,50"/>',
  oval: '<ellipse cx="50" cy="50" rx="46" ry="30"/>',
  heart: '<path d="M50 90 C8 58 4 30 24 17 C40 8 50 22 50 30 C50 22 60 8 76 17 C96 30 92 58 50 90 Z"/>',
  star: star(),
};

export const shapeSvg = (name: string, fill = '#4d96ff', rotate = 0) =>
  `<svg viewBox="0 0 100 100" class="shape" fill="${fill}" aria-label="${name}"${
    rotate ? ` style="transform:rotate(${rotate}deg)"` : ''
  }>${PATHS[name]}</svg>`;
