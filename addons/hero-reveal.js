// Hero reveal — every line settles into place in sequence on load.
//
// This replaces an earlier mask wipe, where each line slid up from behind
// overflow:hidden. That read as mechanical, needed the heading's children
// rewrapped in a span, and clipped descenders. This version touches no markup
// at all: it animates the existing elements, so nothing about Squarespace's
// typography or line wrapping can be disturbed.
//
// Everything with text in the hero takes part — the two headlines, the
// supporting line and the strapline underneath — rather than headings alone.
//
// The homepage carries two hero variants (Squarespace "content mode" swaps a
// desktop and a mobile copy), so this picks whichever one is visible.

import { defineAddon, css, LEAN } from '../lib/util.js';

const START_DELAY_MS = 220;
const LINE_MS = 1900;
const LINE_GAP_MS = 240;

defineAddon('hero-reveal', () => {
  if (location.pathname !== '/') return;

  const hero = [...document.querySelectorAll('section[data-section-id]')]
    .find((s) => s.getBoundingClientRect().height > 0);
  if (!hero) return;

  const lines = [...hero.querySelectorAll('h1, h2, h3, h4, p, .sqs-block-button-element')]
    .filter((el) => el.innerText.trim() && el.getBoundingClientRect().height > 0)
    // Keep only the outermost of any nested matches, so a line never animates twice.
    .filter((el, _, all) => !all.some((other) => other !== el && other.contains(el)));
  if (!lines.length) return;

  css('hero-reveal', `
    .taro-hero-line {
      opacity: 0;
      transform: translateY(${LEAN ? 18 : 26}px);
      ${LEAN ? '' : 'filter: blur(9px);'}
      transition: opacity ${LINE_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) var(--d, 0ms),
                  transform ${LINE_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) var(--d, 0ms)
                  ${LEAN ? '' : `, filter ${LINE_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) var(--d, 0ms)`};
    }
    .taro-hero-line.is-in { opacity: 1; transform: none; filter: none; }

    @media (prefers-reduced-motion: reduce) {
      .taro-hero-line { opacity: 1; transform: none; filter: none; transition: none; }
    }
  `);

  lines.forEach((el, i) => {
    el.classList.add('taro-hero-line');
    el.style.setProperty('--d', `${i * LINE_GAP_MS}ms`);
  });

  // Failsafe: the hero is the first thing anyone sees, so it must never be left
  // hidden by a missed frame or an interrupted load.
  const showAll = () => lines.forEach((el) => el.classList.add('is-in'));
  setTimeout(showAll, START_DELAY_MS + 3000);

  // Two frames so the browser paints the starting state before animating —
  // without this the transition is skipped and the lines simply appear.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    setTimeout(showAll, START_DELAY_MS);
  }));
});
