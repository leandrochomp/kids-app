// Records every phrase in src/phrases.ts to src/clips/*.m4a using the macOS voices.
//   npm run audio                      # only records missing clips
//   VOICE=Samantha RATE=165 FORCE=1 npm run audio   # re-record everything
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { allPhrases, slug } from '../src/phrases.ts';

const VOICE = process.env.VOICE ?? 'Samantha';
const RATE = process.env.RATE ?? '165';
const FORCE = !!process.env.FORCE;
const out = 'src/clips';
mkdirSync(out, { recursive: true });

// Spell out lone letters ("letter A", "small letter a") instead of reading them as words.
const forSay = (t) => t.replace(/\b([A-Za-z])\b/g, (m) => `[[char LTRL]]${m}[[char NORM]]`);

let made = 0;
const phrases = allPhrases();
for (const text of phrases) {
  const dest = join(out, `${slug(text)}.m4a`);
  if (!FORCE && existsSync(dest)) continue;
  const tmp = join(tmpdir(), `kids-${process.pid}.aiff`);
  execFileSync('say', ['-v', VOICE, '-r', RATE, '-o', tmp, forSay(text)]);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '48000', tmp, dest]);
  rmSync(tmp, { force: true });
  made++;
}
console.log(`${phrases.length} phrases, ${made} recorded with ${VOICE}`);
