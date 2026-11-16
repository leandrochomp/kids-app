export const rint = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export const pick = <T>(xs: readonly T[]): T => xs[rint(0, xs.length - 1)];

export function shuffle<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rint(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const sample = <T>(xs: readonly T[], n: number): T[] => shuffle(xs).slice(0, n);

export const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** Build n steps with make(), avoiding exact repeats where possible. */
export function unique<T>(make: () => T, n: number, key: (t: T) => string): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (let tries = 0; out.length < n && tries < 60; tries++) {
    const t = make();
    const k = key(t);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  }
  while (out.length < n) out.push(make());
  return out;
}
