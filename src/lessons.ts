import type { Lesson, Memory, Option, Question, Spell, Step, TopicId, Trace } from './types';
import { pick, range, rint, sample, shuffle } from './util';
import { SHAPES_BY_LEVEL, shapeSvg } from './shapes';
import {
  CATEGORIES, CLOSE_PAIRS, COLORS, COLOR_MIX, LETTERS, SPELL_WORDS, TRACE_POOLS, WORDS,
} from './content.ts';
import { phrase } from './phrases.ts';

export const TOPICS: Record<TopicId, { title: string; icon: string }> = {
  case: { title: 'Big & small letters', icon: '🔤' },
  shapes: { title: 'Shapes', icon: '🔷' },
  numbers: { title: 'Numbers', icon: '🔢' },
  colors: { title: 'Colors', icon: '🎨' },
  sounds: { title: 'First sounds', icon: '👂' },
  trace: { title: 'Tracing', icon: '✏️' },
  patterns: { title: 'Patterns', icon: '🧩' },
  odd: { title: 'Odd one out', icon: '🤔' },
  memory: { title: 'Memory', icon: '🃏' },
  math: { title: 'Counting math', icon: '➕' },
  words: { title: 'Spell words', icon: '🔠' },
};

// ---- Helpers ---------------------------------------------------------------
const glyph = (v: string, text = v): Option => ({ value: v, html: `<span class="glyph">${text}</span>` });
const choice = (q: Omit<Question, 'kind'>): Question => ({ kind: 'choice', ...q });
const optionCount = (d: number) => (d >= 3 ? 4 : 3);
const SHAPE_COLORS = ['#4d96ff', '#ef233c', '#38b000', '#ffb703', '#8338ec', '#ff70a6'];
const COUNTABLES = ['🍎', '🐟', '⭐', '🚗', '🐶', '🎈', '🍪', '🦆'];
const ALL_EMOJI = Object.values(CATEGORIES).flat();

/** `count` distinct numbers including n; close=true keeps the wrong ones near n. */
function numOptions(n: number, max: number, count: number, close: boolean): Option[] {
  const cand = close ? range(Math.max(1, n - 3), Math.min(max, n + 3)) : range(1, max);
  const others = sample(cand.filter((x) => x !== n), Math.min(count - 1, cand.length - 1));
  return shuffle([n, ...others]).map((x) => glyph(String(x)));
}

// ---- Big & small letters ---------------------------------------------------
const CONFUSABLE = ['bdpq', 'mnw', 'uv', 'ceo', 'ij', 'lit', 'hn'];

function caseQ(d: number): Question {
  const pool = LETTERS.slice(0, [8, 14, 20, 26, 26][d - 1]);
  const kind = pick(d === 1 ? ['cap', 'small'] : d === 2 ? ['cap', 'small', 'toSmall'] : ['cap', 'small', 'toSmall', 'toCap']);

  if (kind === 'cap' || kind === 'small') {
    const [a, b] = d === 1 ? sample(pool, 2) : [pick(pool), ''];
    const upper = glyph('up', a);
    const lower = glyph('low', (d === 1 ? b : a).toLowerCase());
    return choice({
      prompt: kind === 'cap' ? 'Tap the BIG letter' : 'Tap the small letter',
      spoken: kind === 'cap' ? phrase.bigLetter : phrase.smallLetter,
      options: shuffle([upper, lower]),
      answer: kind === 'cap' ? 'up' : 'low',
    });
  }

  const L = pick(pool);
  const group = d >= 4 ? CONFUSABLE.find((g) => g.includes(L.toLowerCase())) : undefined;
  const close = group ? [...group.toUpperCase()].filter((c) => c !== L && pool.includes(c)) : [];
  const rest = pool.filter((c) => c !== L && !close.includes(c));
  const others = [...shuffle(close), ...shuffle(rest)].slice(0, optionCount(d) - 1);

  if (kind === 'toSmall') {
    return choice({
      prompt: 'Find the small letter that matches',
      spoken: phrase.matchSmall(L),
      stimulus: `<div class="stimulus glyph">${L}</div>`,
      options: shuffle([L, ...others].map((c) => glyph(c, c.toLowerCase()))),
      answer: L,
    });
  }
  return choice({
    prompt: 'Find the big letter that matches',
    spoken: phrase.matchBig(L.toLowerCase()),
    stimulus: `<div class="stimulus glyph">${L.toLowerCase()}</div>`,
    options: shuffle([L, ...others].map((c) => glyph(c, c))),
    answer: L,
  });
}

// ---- Shapes ----------------------------------------------------------------
const SHAPE_FACTS = [
  { spoken: phrase.sides3, answers: ['triangle'] },
  { spoken: phrase.sides4, answers: ['square', 'rectangle', 'diamond'] },
  { spoken: phrase.noCorners, answers: ['circle', 'oval'] },
  { spoken: phrase.fivePoints, answers: ['star'] },
];

function shapeQ(d: number): Question {
  const pool = SHAPES_BY_LEVEL[Math.min(d, 3) - 1];
  const styled = d >= 3;
  const render = (s: string) =>
    shapeSvg(s, styled ? pick(SHAPE_COLORS) : '#4d96ff', styled ? pick([-15, 0, 15]) : 0);

  if (d >= 4 && Math.random() < 0.6) {
    const fact = pick(SHAPE_FACTS);
    const target = pick(fact.answers);
    const wrong = sample(pool.filter((s) => !fact.answers.includes(s)), 3);
    return choice({
      prompt: fact.spoken,
      spoken: fact.spoken,
      options: shuffle([target, ...wrong]).map((s) => ({ value: s, html: render(s) })),
      answer: target,
    });
  }

  const target = pick(pool);
  const others = sample(pool.filter((s) => s !== target), optionCount(d) - 1);
  return choice({
    prompt: phrase.tapShape(target),
    spoken: phrase.tapShape(target),
    options: shuffle([target, ...others]).map((s) => ({ value: s, html: render(s) })),
    answer: target,
  });
}

// ---- Numbers ---------------------------------------------------------------
function numberQ(d: number): Question {
  const max = [5, 8, 10, 15, 20][d - 1];
  const close = d >= 4;
  const count = optionCount(d);

  if (Math.random() < (d <= 2 ? 0.5 : 0.6)) {
    const countMax = Math.min(max, 12);
    const n = rint(1, countMax);
    return choice({
      prompt: phrase.howMany,
      spoken: phrase.howMany,
      stimulus: `<div class="stimulus count">${Array(n).fill(pick(COUNTABLES)).join('')}</div>`,
      options: numOptions(n, countMax, count, close),
      answer: String(n),
    });
  }
  const n = rint(1, max);
  return choice({
    prompt: phrase.tapNumber(n),
    spoken: phrase.tapNumber(n),
    options: numOptions(n, max, count, close),
    answer: String(n),
  });
}

// ---- Colors ----------------------------------------------------------------
const COLOR_NAMES = Object.keys(COLORS);
const swatch = (c: string): Option => ({
  value: c,
  html: `<span class="swatch" style="background:${COLORS[c]}"></span>`,
});

function colorQ(d: number): Question {
  if (d >= 3 && Math.random() < 0.5) {
    const [a, b, result] = pick(COLOR_MIX);
    const others = sample(COLOR_NAMES.filter((c) => c !== result), optionCount(d) - 1);
    return choice({
      prompt: phrase.mix(a, b),
      spoken: phrase.mix(a, b),
      stimulus: `<div class="stimulus mix"><span class="swatch" style="background:${COLORS[a]}"></span><b>+</b><span class="swatch" style="background:${COLORS[b]}"></span></div>`,
      options: shuffle([result, ...others]).map(swatch),
      answer: result,
    });
  }
  const pool = COLOR_NAMES.slice(0, d === 1 ? 3 : d === 2 ? 5 : 8);
  const target = pick(pool);
  const others = sample(pool.filter((c) => c !== target), optionCount(d) - 1);
  return choice({
    prompt: phrase.tapColor(target),
    spoken: phrase.tapColor(target),
    options: shuffle([target, ...others]).map(swatch),
    answer: target,
  });
}

// ---- First sounds ----------------------------------------------------------
function soundQ(d: number): Question {
  const pool = WORDS.slice(0, [7, 14, 20, 20, 20][d - 1]);
  const [letter, word, emoji] = pick(pool);
  const others = sample(pool.filter(([l]) => l !== letter), optionCount(d) - 1);

  if (d >= 3 && Math.random() < 0.5) {
    return choice({
      prompt: 'Which letter does it start with?',
      spoken: phrase.startsWithWord(word),
      stimulus: `<div class="stimulus emoji">${emoji}</div>`,
      options: shuffle([letter, ...others.map(([l]) => l)]).map((l) => glyph(l)),
      answer: letter,
    });
  }
  return choice({
    prompt: 'Which one starts with this letter?',
    spoken: phrase.startsWith(letter),
    stimulus: `<div class="stimulus glyph">${letter}</div>`,
    options: shuffle([[letter, word, emoji], ...others]).map(([, w, e]) => ({
      value: w,
      html: `<span class="emoji">${e}</span><small>${w}</small>`,
    })),
    answer: word,
    reveal: phrase.reveal(word),
  });
}

// ---- Tracing ---------------------------------------------------------------
function traceStep(d: number): Trace {
  const g = pick(TRACE_POOLS[d <= 2 ? 0 : d <= 4 ? 1 : 2]);
  const what = /\d/.test(g) ? 'number' : 'letter';
  return { kind: 'trace', glyph: g, prompt: `Trace the ${what}`, spoken: phrase.trace(g) };
}

// ---- Patterns --------------------------------------------------------------
const SYMBOLS = ['🔴', '🔵', '🟡', '🟢', '⭐', '❤️', '🍎', '🐟', '🌙', '🔷'];

const UNITS: Record<string, number[]> = {
  ab: [0, 1], aab: [0, 0, 1], abb: [0, 1, 1], abc: [0, 1, 2], abba: [0, 1, 1, 0],
};
const PATTERN_KINDS = [
  ['ab'],
  ['ab', 'aab', 'up1'],
  ['aab', 'abc', 'up2', 'letters'],
  ['abc', 'abb', 'down', 'miss', 'letters', 'up2'],
  ['abba', 'abc', 'up3', 'miss', 'letters2', 'down'],
];

function seqQuestion(shown: string[], hidden: number, answer: string, options: string[], missing: boolean): Question {
  const cells = shown
    .map((t, i) => (i === hidden ? '<span class="slot">?</span>' : `<span class="cell">${t}</span>`))
    .join('');
  const p = missing ? phrase.whatMissing : phrase.whatNext;
  return choice({
    prompt: p,
    spoken: p,
    stimulus: `<div class="stimulus seq">${cells}</div>`,
    options: shuffle(options).map((o) => glyph(o)),
    answer,
  });
}

function patternQ(d: number): Question {
  const kind = pick(PATTERN_KINDS[d - 1]);
  const count = optionCount(d);

  if (kind in UNITS) {
    const unit = UNITS[kind];
    const syms = sample(SYMBOLS, 3);
    const L = unit.length === 2 ? 5 : 2 * unit.length - 1;
    const seq = Array.from({ length: L + 1 }, (_, i) => syms[unit[i % unit.length]]);
    const answer = seq[L];
    const extras = shuffle([...syms, ...SYMBOLS].filter((s, i, a) => s !== answer && a.indexOf(s) === i));
    const options = [answer, ...extras.slice(0, count - 1)];
    return seqQuestion([...seq.slice(0, L), '?'], L, answer, options, false);
  }

  if (kind === 'letters' || kind === 'letters2') {
    const step = kind === 'letters' ? 1 : 2;
    const start = rint(0, LETTERS.length - 1 - 4 * step);
    const seq = [0, 1, 2, 3].map((i) => LETTERS[start + i * step]);
    const answer = seq[3];
    const near = LETTERS.filter((l) => l !== answer && Math.abs(LETTERS.indexOf(l) - LETTERS.indexOf(answer)) <= 3);
    return seqQuestion([...seq.slice(0, 3), '?'], 3, answer, [answer, ...sample(near, count - 1)], false);
  }

  if (kind === 'miss') {
    const step = pick([1, 2]);
    const start = rint(1, 4);
    const seq = [0, 1, 2, 3, 4].map((i) => start + i * step);
    const hidden = rint(1, 3);
    const answer = String(seq[hidden]);
    const near = range(Math.max(1, seq[hidden] - 3), seq[hidden] + 3).filter((x) => x !== seq[hidden]);
    return seqQuestion(seq.map(String), hidden, answer, [answer, ...sample(near, count - 1).map(String)], true);
  }

  const step = kind === 'down' ? -1 : Number(kind.slice(2));
  const start = kind === 'down' ? rint(5, 10) : rint(1, 4);
  const seq = [0, 1, 2, 3].map((i) => start + i * step);
  const next = start + 4 * step;
  const near = range(Math.max(1, next - 3), next + 3).filter((x) => x !== next);
  return seqQuestion([...seq.map(String), '?'], 4, String(next), [String(next), ...sample(near, count - 1).map(String)], false);
}

// ---- Odd one out -----------------------------------------------------------
function oddQ(d: number): Question {
  const count = d <= 2 ? 3 : 4;
  const oddAt = rint(0, count - 1);
  let items: string[];

  if (d <= 2) {
    const [a, b] = sample(SHAPES_BY_LEVEL[d - 1], 2);
    items = Array.from({ length: count }, (_, i) => shapeSvg(i === oddAt ? b : a));
  } else if (d === 3 && Math.random() < 0.5) {
    const [a, b] = sample(SHAPES_BY_LEVEL[2], 2);
    items = Array.from({ length: count }, (_, i) =>
      shapeSvg(i === oddAt ? b : a, pick(SHAPE_COLORS), pick([-15, 0, 15])),
    );
  } else if (d === 3) {
    const letters = sample(LETTERS, count);
    const smallIsOdd = Math.random() < 0.5;
    items = letters.map((l, i) => {
      const small = (i === oddAt) === smallIsOdd;
      return `<span class="glyph">${small ? l.toLowerCase() : l}</span>`;
    });
  } else {
    const [catA, catB] = d === 5 ? pick(CLOSE_PAIRS) : sample(Object.keys(CATEGORIES), 2);
    const same = sample(CATEGORIES[catA], count - 1);
    const odd = pick(CATEGORIES[catB]);
    items = [...same.slice(0, oddAt), odd, ...same.slice(oddAt)].map((e) => `<span class="emoji">${e}</span>`);
  }

  return choice({
    prompt: phrase.odd,
    spoken: phrase.odd,
    options: items.map((html, i) => ({ value: String(i), html })),
    answer: String(oddAt),
  });
}

// ---- Counting math ---------------------------------------------------------
const MATH_KINDS = [
  ['add5'],
  ['add5', 'more'],
  ['add10', 'sub5', 'more', 'biggest'],
  ['add10', 'sub10', 'biggest', 'more', 'sub5'],
  ['add10', 'sub10', 'biggest', 'sub10', 'add10'],
];

const groupOf = (e: string, n: number) => `<span>${e.repeat(n)}</span>`;

function mathQ(d: number): Question {
  const kind = pick(MATH_KINDS[d - 1]);
  const e = pick(COUNTABLES);
  const count = optionCount(d);

  if (kind === 'more') {
    const [x, y] = sample(range(1, d <= 3 ? 6 : 9), 2);
    return choice({
      prompt: phrase.more,
      spoken: phrase.more,
      options: shuffle([x, y]).map((n) => ({ value: String(n), html: `<span class="emoji group">${e.repeat(n)}</span>` })),
      answer: String(Math.max(x, y)),
    });
  }

  if (kind === 'biggest') {
    const ns = sample(range(1, d <= 3 ? 10 : 20), 3);
    return choice({
      prompt: phrase.biggest,
      spoken: phrase.biggest,
      options: ns.map((n) => glyph(String(n))),
      answer: String(Math.max(...ns)),
    });
  }

  const cap = kind.endsWith('5') ? 5 : 10;
  if (kind.startsWith('add')) {
    const a = rint(1, cap - 1);
    const b = rint(1, cap - a);
    const groups = d <= 3 ? `<div class="groups emoji">${groupOf(e, a)}<b>+</b>${groupOf(e, b)}</div>` : '';
    return choice({
      prompt: `${a} + ${b} = ?`,
      spoken: phrase.add(a, b),
      stimulus: `<div class="stimulus equation">${a} + ${b} = ?</div>${groups}`,
      options: numOptions(a + b, cap, count, true),
      answer: String(a + b),
    });
  }

  const a = rint(2, cap);
  const b = rint(1, a - 1);
  const groups = d <= 3 ? `<div class="groups emoji">${groupOf(e, a)}</div>` : '';
  return choice({
    prompt: `${a} − ${b} = ?`,
    spoken: phrase.sub(a, b),
    stimulus: `<div class="stimulus equation">${a} − ${b} = ?</div>${groups}`,
    options: numOptions(a - b, cap, count, true),
    answer: String(a - b),
  });
}

// ---- Memory ----------------------------------------------------------------
// Drop .png files into src/memory-images/ to use them as the memory cards.
const MEMORY_IMAGES = Object.values(
  import.meta.glob('./memory-images/*.png', { eager: true, query: '?url', import: 'default' }),
) as string[];
const imageCard = (url: string) => `<img class="photo" src="${url}" alt="" draggable="false">`;

function memoryStep(d: number): Memory {
  const n = [3, 3, 4, 5, 6][d - 1];
  const emoji = (e: string) => `<span class="emoji">${e}</span>`;
  const twin = (e: string): [string, string] => [emoji(e), emoji(e)];
  const shapePair = (s: string): [string, string] => [shapeSvg(s, '#4d96ff'), shapeSvg(s, '#4d96ff')];

  // Pictures only: more cards and more varied pictures as it gets harder.
  let pairs: [string, string][];
  if (d <= 2) pairs = sample([...CATEGORIES.animals, ...CATEGORIES.fruit], n).map(twin);
  else if (d <= 4) pairs = sample(ALL_EMOJI, n).map(twin);
  else pairs = [...sample(ALL_EMOJI, 4).map(twin), ...sample(SHAPES_BY_LEVEL[2], 2).map(shapePair)];

  if (MEMORY_IMAGES.length >= n) {
    pairs = sample(MEMORY_IMAGES, n).map((u): [string, string] => [imageCard(u), imageCard(u)]);
  }

  const cards = shuffle(pairs.flatMap(([a, b], i) => [{ pair: String(i), html: a }, { pair: String(i), html: b }]));
  return { kind: 'memory', prompt: phrase.matchPairs, spoken: phrase.matchPairs, cards };
}

function missingQ(d: number): Question {
  const n = [3, 3, 4, 5, 6][d - 1];
  const items = sample(ALL_EMOJI, n);
  const gone = pick(items);
  const left = items.filter((x) => x !== gone);
  const strip = (xs: string[]) => `<div class="stimulus count">${xs.join(' ')}</div>`;
  const extras = sample(ALL_EMOJI.filter((e) => !items.includes(e)), d >= 4 ? 3 : 2);
  return choice({
    prompt: phrase.remember,
    spoken: phrase.remember,
    stimulus: strip(items),
    options: shuffle([gone, ...extras]).map((e) => ({ value: e, html: `<span class="emoji">${e}</span>` })),
    answer: gone,
    phase2: { prompt: phrase.whatMissing, spoken: phrase.whatMissing, stimulus: strip(left), after: 3000 + n * 500 },
  });
}

// ---- Spell words -----------------------------------------------------------
function spellStep(d: number): Spell {
  const len = d >= 5 && Math.random() < 0.7 ? 4 : 3;
  const [word, emoji] = pick(SPELL_WORDS.filter(([w]) => w.length === len));
  const spare = sample(LETTERS.map((l) => l.toLowerCase()).filter((l) => !word.includes(l)), d >= 4 ? 3 : 2);
  return {
    kind: 'spell',
    prompt: 'Spell the word',
    spoken: phrase.spell(word),
    word,
    emoji,
    tiles: shuffle([...word, ...spare]),
  };
}

// ---- Lessons ---------------------------------------------------------------
const GEN: Record<TopicId, (d: number, i: number) => Step> = {
  case: caseQ,
  shapes: shapeQ,
  numbers: numberQ,
  colors: colorQ,
  sounds: soundQ,
  trace: traceStep,
  patterns: patternQ,
  odd: oddQ,
  memory: (d, i) => (i === 1 ? missingQ(d) : memoryStep(d)),
  math: mathQ,
  words: spellStep,
};

const COUNT: Partial<Record<TopicId, number>> = { trace: 3, memory: 3, words: 4 };

/** Each round is a bit harder than the last; lessons also adapt to how the child is doing. */
const ROUNDS: { base: number; topics: TopicId[] }[] = [
  { base: 2, topics: ['case', 'shapes', 'trace', 'numbers', 'patterns', 'colors'] },
  { base: 3, topics: ['sounds', 'odd', 'memory', 'math', 'case', 'trace'] },
  { base: 4, topics: ['words', 'patterns', 'memory', 'shapes', 'math', 'odd'] },
  { base: 5, topics: ['words', 'sounds', 'math', 'patterns', 'memory', 'trace'] },
];

export const LESSONS: Lesson[] = ROUNDS.flatMap((r, ri) =>
  r.topics.map((topic): Lesson => ({
    id: `${topic}-${ri + 1}`,
    topic,
    base: r.base,
    count: COUNT[topic] ?? 5,
    gen: GEN[topic],
  })),
);
