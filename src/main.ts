import { registerSW } from 'virtual:pwa-register';
import './style.css';
import { LESSONS, TOPICS } from './lessons';
import type { Lesson, Step } from './types';
import { sfx, speak } from './audio';
import { phrase, PRAISE, RETRY } from './phrases.ts';
import { loadProgress, loadSettings, resetProgress, saveSettings, saveStars } from './progress';
import { mountTrace } from './trace';
import { pick } from './util';

registerSW({ immediate: true });

const app = document.getElementById('app')!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- Path ----------------------------------------------------------------
function showPath() {
  const { stars } = loadProgress();
  const unlocked = (i: number) => i === 0 || (stars[LESSONS[i - 1].id] ?? 0) > 0;
  const current = LESSONS.findIndex((l) => !(stars[l.id] > 0));
  const total = Object.values(stars).reduce((a, b) => a + b, 0);

  const nodes = LESSONS.map((l, i) => {
    const earned = stars[l.id] ?? 0;
    const side = ['left', 'mid', 'right', 'mid'][i % 4];
    const cls = ['node', side, unlocked(i) ? '' : 'locked', i === current ? 'current' : ''].join(' ');
    return `<button class="${cls}" data-i="${i}" aria-label="${TOPICS[l.topic].title}">
      <span class="bubble">${unlocked(i) ? TOPICS[l.topic].icon : '🔒'}</span>
      <span class="stars">${[1, 2, 3].map((s) => (s <= earned ? '★' : '☆')).join('')}</span>
    </button>`;
  }).join('');

  app.innerHTML = `<div class="screen path">
    <header class="top"><span class="mascot">🐻</span><span class="total">⭐ ${total}</span>
      <button class="icon gear" id="gear" aria-label="Parents">⚙️</button></header>
    <main class="trail">${nodes}</main></div>`;

  app.querySelector('.node.current')?.scrollIntoView({ block: 'center' });

  app.querySelectorAll<HTMLButtonElement>('.node').forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      if (!unlocked(i)) {
        b.classList.remove('wobble');
        void b.offsetWidth;
        b.classList.add('wobble');
        sfx.bad();
        return;
      }
      sfx.tap();
      startLesson(LESSONS[i]);
    }),
  );

  document.getElementById('gear')!.addEventListener('click', parentGate);
}

/** Adult check: a sum a 5-year-old can't do yet, then the parent screen. */
function parentGate() {
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  const answer = a + b;
  const options = [...new Set([answer, answer + 1, answer - 1, answer + 2, answer - 2])]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  if (!options.includes(answer)) options[0] = answer;
  const gate = document.createElement('div');
  gate.className = 'overlay';
  gate.innerHTML = `<div class="modal"><h2>Parents only</h2><p>What is ${a} + ${b}?</p>
    <div class="row">${options.sort(() => Math.random() - 0.5).map((n) => `<button class="btn" data-n="${n}">${n}</button>`).join('')}</div>
    <button class="btn danger" id="cancel">Cancel</button></div>`;
  document.body.appendChild(gate);
  gate.querySelector('#cancel')!.addEventListener('click', () => gate.remove());
  gate.querySelectorAll<HTMLButtonElement>('[data-n]').forEach((btn) =>
    btn.addEventListener('click', () => {
      gate.remove();
      if (Number(btn.dataset.n) === answer) showParent();
    }),
  );
}

function showParent() {
  const { stars } = loadProgress();
  const done = LESSONS.filter((l) => stars[l.id] > 0).length;
  const settings = loadSettings();
  const panel = document.createElement('div');
  panel.className = 'overlay';
  panel.innerHTML = `<div class="modal">
    <h2>Parents</h2>
    <p>${done} of ${LESSONS.length} lessons completed.</p>
    <label class="row"><input type="checkbox" id="voice" ${settings.voice ? 'checked' : ''}/> Spoken prompts</label>
    <button class="btn danger" id="reset">Reset progress</button>
    <button class="btn" id="close">Close</button></div>`;
  document.body.appendChild(panel);
  panel.querySelector('#voice')!.addEventListener('change', (e) =>
    saveSettings({ voice: (e.target as HTMLInputElement).checked }),
  );
  panel.querySelector('#reset')!.addEventListener('click', () => {
    if (confirm('Erase all stars and start over?')) {
      resetProgress();
      panel.remove();
      showPath();
    }
  });
  panel.querySelector('#close')!.addEventListener('click', () => panel.remove());
}

// ---- Lesson --------------------------------------------------------------
const stepKey = (s: Step) =>
  s.kind === 'choice' ? s.prompt + s.answer + (s.stimulus ?? '')
  : s.kind === 'trace' ? s.glyph
  : s.kind === 'spell' ? s.word
  : s.cards.map((c) => c.html).join('');

async function startLesson(lesson: Lesson) {
  let mistakes = 0;
  let bonus = 0; // adapts: up after a clean answer, down after a slip
  const seen = new Set<string>();

  for (let i = 0; i < lesson.count; i++) {
    const difficulty = Math.min(5, Math.max(1, lesson.base + bonus));
    let step = lesson.gen(difficulty, i);
    for (let tries = 0; tries < 20 && seen.has(stepKey(step)); tries++) step = lesson.gen(difficulty, i);
    seen.add(stepKey(step));

    let slips = 0;
    const quit = await runStep(step, i, lesson.count, () => slips++);
    if (quit) return showPath();
    mistakes += slips;
    bonus = Math.min(2, Math.max(-1, bonus + (slips === 0 ? 1 : -1)));
  }
  const earned = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
  saveStars(lesson.id, earned);
  await showResult(earned);
  showPath();
}

function stepBody(step: Step): string {
  switch (step.kind) {
    case 'choice':
      return `<div id="stim">${step.stimulus ?? ''}</div><div class="options n${step.options.length}${step.phase2 ? ' hidden' : ''}">${step.options
        .map((o) => `<button class="opt" data-v="${o.value}">${o.html}</button>`)
        .join('')}</div>`;
    case 'trace':
      return '<div class="trace-host"></div>';
    case 'memory':
      return `<div class="cards">${step.cards
        .map((c, i) => `<button class="card" data-i="${i}"><span class="face">${c.html}</span><span class="back">❓</span></button>`)
        .join('')}</div>`;
    case 'spell':
      return `<div class="stimulus emoji">${step.emoji}</div>
        <div class="slots">${[...step.word].map(() => '<span class="slot-l"></span>').join('')}</div>
        <div class="options tiles">${step.tiles.map((t) => `<button class="opt tile" data-l="${t}">${t.toUpperCase()}</button>`).join('')}</div>`;
  }
}

/** Resolves true if the child quit the lesson. */
function runStep(step: Step, index: number, total: number, onMistake: () => void): Promise<boolean> {
  return new Promise((resolve) => {
    app.innerHTML = `<div class="screen lesson">
      <header class="top"><button class="icon" id="quit" aria-label="Back">✕</button>
        <div class="bar"><i style="width:${(index / total) * 100}%"></i></div></header>
      <main><div class="prompt"><button class="icon speak" id="replay" aria-label="Repeat">🔊</button>
        <span id="ptext">${step.prompt}</span></div>${stepBody(step)}</main></div>`;

    let spokenNow = step.spoken;
    document.getElementById('quit')!.addEventListener('click', () => resolve(true));
    document.getElementById('replay')!.addEventListener('click', () => speak(spokenNow));
    speak(spokenNow);

    const advance = async (reveal?: string) => {
      sfx.ok();
      speak(...(reveal ? [reveal] : []), pick(PRAISE));
      await sleep(1400);
      resolve(false);
    };

    switch (step.kind) {
      case 'trace':
        mountTrace(app.querySelector<HTMLElement>('.trace-host')!, step.glyph, () => {
          speak(pick(PRAISE));
          setTimeout(() => resolve(false), 900);
        });
        return;

      case 'memory': {
        const cards = app.querySelectorAll<HTMLButtonElement>('.card');
        const pairs = step.cards.length / 2;
        let open: number[] = [];
        let matched = 0;
        let misses = 0;
        let busy = false;
        cards.forEach((card, i) =>
          card.addEventListener('click', () => {
            if (busy || open.includes(i) || card.classList.contains('done')) return;
            card.classList.add('open');
            sfx.tap();
            open.push(i);
            if (open.length < 2) return;
            const [a, b] = open;
            open = [];
            if (step.cards[a].pair === step.cards[b].pair) {
              cards[a].classList.add('done');
              cards[b].classList.add('done');
              sfx.ok();
              if (++matched === pairs) void advance();
            } else {
              busy = true;
              if (++misses > pairs) onMistake();
              setTimeout(() => {
                cards[a].classList.remove('open');
                cards[b].classList.remove('open');
                busy = false;
              }, 1000);
            }
          }),
        );
        return;
      }

      case 'spell': {
        const slots = app.querySelectorAll<HTMLElement>('.slot-l');
        let filled = 0;
        app.querySelectorAll<HTMLButtonElement>('.tile').forEach((tile) =>
          tile.addEventListener('click', () => {
            if (tile.disabled) return;
            if (tile.dataset.l === step.word[filled]) {
              slots[filled].textContent = tile.dataset.l!.toUpperCase();
              tile.disabled = true;
              tile.classList.add('right');
              if (++filled === step.word.length) void advance(phrase.reveal(step.word));
              else sfx.tap();
            } else {
              onMistake();
              sfx.bad();
              tile.classList.remove('wrong');
              void tile.offsetWidth;
              tile.classList.add('wrong');
              speak(pick(RETRY));
            }
          }),
        );
        return;
      }

      case 'choice': {
        if (step.phase2) {
          const p = step.phase2;
          const ptext = document.getElementById('ptext')!;
          const stim = document.getElementById('stim')!;
          const options = app.querySelector('.options')!;
          setTimeout(() => {
            if (!ptext.isConnected) return; // child already left this step
            ptext.textContent = p.prompt;
            stim.innerHTML = p.stimulus;
            options.classList.remove('hidden');
            spokenNow = p.spoken;
            speak(p.spoken);
          }, p.after);
        }
        let locked = false;
        app.querySelectorAll<HTMLButtonElement>('.opt').forEach((btn) =>
          btn.addEventListener('click', () => {
            if (locked || btn.disabled) return;
            if (btn.dataset.v === step.answer) {
              locked = true;
              btn.classList.add('right');
              app.querySelectorAll<HTMLButtonElement>('.opt').forEach((b) => b !== btn && (b.disabled = true));
              void advance(step.reveal);
            } else {
              onMistake();
              btn.disabled = true;
              btn.classList.add('wrong');
              sfx.bad();
              speak(pick(RETRY));
            }
          }),
        );
      }
    }
  });
}

async function showResult(stars: number) {
  app.innerHTML = `<div class="screen result"><div class="confetti">🎉</div>
    <h1>${stars === 3 ? 'Perfect!' : 'Great job!'}</h1>
    <div class="big-stars">${[1, 2, 3].map((s) => `<span class="${s <= stars ? 'on' : ''}" style="--d:${s * 0.25}s">★</span>`).join('')}</div>
    <button class="btn" id="go">Continue</button></div>`;
  sfx.win();
  speak(stars === 3 ? phrase.perfect : PRAISE[0]);
  await new Promise<void>((r) => document.getElementById('go')!.addEventListener('click', () => r()));
}

showPath();
