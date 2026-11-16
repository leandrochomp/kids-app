// Pure data shared by the lessons and the audio generator script. No imports.

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const COLORS: Record<string, string> = {
  red: '#ef233c',
  blue: '#3a86ff',
  yellow: '#ffd60a',
  green: '#38b000',
  orange: '#fb8500',
  purple: '#8338ec',
  pink: '#ff70a6',
  brown: '#8d5524',
};

/** [first, second, result] */
export const COLOR_MIX: [string, string, string][] = [
  ['red', 'blue', 'purple'],
  ['blue', 'yellow', 'green'],
  ['red', 'yellow', 'orange'],
];

export const WORDS: [string, string, string][] = [
  ['A', 'apple', '🍎'], ['B', 'ball', '⚽'], ['C', 'cat', '🐱'], ['D', 'dog', '🐶'],
  ['E', 'egg', '🥚'], ['F', 'fish', '🐟'], ['G', 'grapes', '🍇'], ['H', 'hat', '🎩'],
  ['I', 'ice cream', '🍦'], ['K', 'kite', '🪁'], ['L', 'lion', '🦁'], ['M', 'moon', '🌙'],
  ['O', 'orange', '🍊'], ['P', 'pig', '🐷'], ['R', 'rabbit', '🐰'], ['S', 'sun', '☀️'],
  ['T', 'tree', '🌳'], ['U', 'umbrella', '☂️'], ['W', 'whale', '🐳'], ['Z', 'zebra', '🦓'],
];

/** [word, emoji] */
export const SPELL_WORDS: [string, string][] = [
  ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['pig', '🐷'], ['hat', '🎩'], ['bus', '🚌'],
  ['fox', '🦊'], ['bee', '🐝'], ['car', '🚗'], ['cow', '🐮'], ['ant', '🐜'], ['bat', '🦇'],
  ['hen', '🐔'], ['key', '🔑'],
  ['fish', '🐟'], ['frog', '🐸'], ['duck', '🦆'], ['bird', '🐦'], ['lion', '🦁'], ['star', '⭐'],
  ['milk', '🥛'], ['tree', '🌳'], ['moon', '🌙'], ['bear', '🐻'],
];

export const CATEGORIES: Record<string, string[]> = {
  animals: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐵', '🐯', '🦁', '🐮', '🐷', '🐸', '🐔', '🐧', '🦉', '🐴', '🐘', '🦒', '🦓', '🐨', '🐢', '🦋', '🐝', '🐞'],
  fruit: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍐', '🍒', '🍍', '🥝', '🍋', '🍑', '🥕', '🌽', '🥦', '🍅'],
  vehicles: ['🚗', '🚌', '🚲', '🚂', '✈️', '🚀', '🚜', '🚒', '🚑', '🚓', '⛵', '🚁', '🏍️', '🚕'],
  sea: ['🐟', '🐙', '🐳', '🐬', '🦀', '🐠', '🦈', '🐚', '🦞'],
  food: ['🍕', '🍔', '🍟', '🍦', '🍪', '🍩', '🍰', '🥐', '🍿', '🧀', '🍞', '🥚'],
  nature: ['🌸', '🌻', '🌳', '🌵', '🍄', '🌈', '☀️', '🌙', '⭐', '☁️', '🔥', '❄️'],
  toys: ['⚽', '🎈', '🎁', '🧸', '🪁', '🎸', '🥁', '🎨', '🎩', '👑', '🏀', '🎺'],
};

/** Categories that are easy to confuse, for the hardest odd-one-out questions. */
export const CLOSE_PAIRS: [string, string][] = [
  ['animals', 'sea'],
  ['fruit', 'food'],
  ['vehicles', 'animals'],
];

/** Tracing pools, easiest first: numbers, capitals, small letters. */
export const TRACE_POOLS = [
  '12345'.split(''),
  'LTIHEFAOCUVXYZ'.split(''),
  'oclitvuxzsjw'.split(''),
];
