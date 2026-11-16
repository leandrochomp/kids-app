export type Option = { value: string; html: string };

export type Question = {
  kind: 'choice';
  prompt: string;
  spoken: string;
  stimulus?: string;
  options: Option[];
  answer: string;
  reveal?: string;
  /** Shown after `after` ms in place of the first prompt and stimulus; options stay hidden until then. */
  phase2?: { prompt: string; spoken: string; stimulus: string; after: number };
};

export type Trace = { kind: 'trace'; glyph: string; prompt: string; spoken: string };

export type Memory = {
  kind: 'memory';
  prompt: string;
  spoken: string;
  cards: { pair: string; html: string }[];
};

export type Spell = {
  kind: 'spell';
  prompt: string;
  spoken: string;
  word: string;
  emoji: string;
  tiles: string[];
};

export type Step = Question | Trace | Memory | Spell;

export type TopicId =
  | 'case' | 'shapes' | 'numbers' | 'colors' | 'sounds' | 'trace'
  | 'patterns' | 'odd' | 'memory' | 'math' | 'words';

export type Lesson = {
  id: string;
  topic: TopicId;
  /** Starting difficulty 1-5; the lesson adapts around it. */
  base: number;
  count: number;
  gen: (difficulty: number, index: number) => Step;
};
