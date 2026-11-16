// Every phrase the app speaks. The audio script records exactly allPhrases().
// Imports use .ts extensions so Node can run scripts/make-audio.mjs directly.
import { COLOR_MIX, COLORS, LETTERS, SPELL_WORDS, TRACE_POOLS, WORDS } from './content.ts';
import { SHAPES_BY_LEVEL } from './shapes.ts';

export const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Well done!', 'Super!', 'Yes!'];
export const RETRY = ['Try again!', 'Oops, try another one!', 'Almost! Try again!'];

export const phrase = {
  bigLetter: 'Tap the big, capital letter',
  smallLetter: 'Tap the small letter',
  howMany: 'How many do you see?',
  perfect: 'Perfect! Three stars!',
  whatNext: 'What comes next?',
  whatMissing: 'What is missing?',
  odd: 'Which one is different?',
  remember: 'Remember these!',
  matchPairs: 'Find the matching pairs',
  biggest: 'Which number is the biggest?',
  more: 'Which group has more?',
  sides3: 'Which shape has 3 sides?',
  sides4: 'Which shape has 4 sides?',
  noCorners: 'Which shape has no corners?',
  fivePoints: 'Which shape has 5 points?',
  tapShape: (s: string) => `Tap the ${s}`,
  tapNumber: (n: number) => `Tap the number ${n}`,
  tapColor: (c: string) => `Tap the ${c} one`,
  mix: (a: string, b: string) => `What color do ${a} and ${b} make?`,
  matchSmall: (big: string) => `Which small letter matches the big letter ${big}?`,
  matchBig: (small: string) => `Which big letter matches the small letter ${small}?`,
  startsWith: (letter: string) => `Which one starts with the letter ${letter}?`,
  startsWithWord: (word: string) => `Which letter does ${word} start with?`,
  reveal: (word: string) => `${word}!`,
  trace: (g: string) => `Trace the ${/\d/.test(g) ? 'number' : 'letter'} ${g}`,
  add: (a: number, b: number) => `What is ${a} plus ${b}?`,
  sub: (a: number, b: number) => `What is ${a} minus ${b}?`,
  spell: (word: string) => `Spell ${word}`,
};

export function allPhrases(): string[] {
  const shapes = new Set(SHAPES_BY_LEVEL.flat());
  const sums: [number, number][] = [];
  const diffs: [number, number][] = [];
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      if (a + b <= 10) sums.push([a, b]);
      if (b < a) diffs.push([a, b]);
    }
  }
  const all = [
    ...PRAISE,
    ...RETRY,
    ...[
      phrase.bigLetter, phrase.smallLetter, phrase.howMany, phrase.perfect, phrase.whatNext,
      phrase.whatMissing, phrase.odd, phrase.remember, phrase.matchPairs, phrase.biggest,
      phrase.more, phrase.sides3, phrase.sides4, phrase.noCorners, phrase.fivePoints,
    ],
    ...[...shapes].map(phrase.tapShape),
    ...Array.from({ length: 20 }, (_, i) => phrase.tapNumber(i + 1)),
    ...Object.keys(COLORS).map(phrase.tapColor),
    ...COLOR_MIX.map(([a, b]) => phrase.mix(a, b)),
    ...LETTERS.map(phrase.matchSmall),
    ...LETTERS.map((l) => phrase.matchBig(l.toLowerCase())),
    ...WORDS.map(([l]) => phrase.startsWith(l)),
    ...WORDS.map(([, w]) => phrase.startsWithWord(w)),
    ...WORDS.map(([, w]) => phrase.reveal(w)),
    ...TRACE_POOLS.flat().map(phrase.trace),
    ...sums.map(([a, b]) => phrase.add(a, b)),
    ...diffs.map(([a, b]) => phrase.sub(a, b)),
    ...SPELL_WORDS.map(([w]) => phrase.spell(w)),
    ...SPELL_WORDS.map(([w]) => phrase.reveal(w)),
  ];
  return [...new Set(all)];
}

/** File name for a phrase. Lone letters keep their case so "O" and "o" don't collide. */
export const slug = (text: string) =>
  text
    .replace(/\b[A-Z]\b/g, (m) => `_${m.toLowerCase()}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^-+|-+$/g, '');
