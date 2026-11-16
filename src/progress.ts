const KEY = 'little-learners/v1';
const SETTINGS_KEY = 'little-learners/settings';

export type Progress = { stars: Record<string, number> };
export type Settings = { voice: boolean };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: progress just won't persist */
  }
}

export const loadProgress = (): Progress => read<Progress>(KEY, { stars: {} });
export const loadSettings = (): Settings => read<Settings>(SETTINGS_KEY, { voice: true });
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);

export function saveStars(id: string, stars: number) {
  const p = loadProgress();
  p.stars[id] = stars; // latest round counts, even if lower than before
  write(KEY, p);
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
