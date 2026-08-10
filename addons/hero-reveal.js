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

import { defineAddon, css } from '../lib/util.js';
// Declared locally rather than imported: see the note in lib/util.js about
// per-file cache skew breaking the module graph.
const LEAN = window.matchMedia('(hover: none)').matches;


const START_DELAY_MS = 550;
const LINE_MS = 2600;
const LINE_GAP_MS = 380;

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
    /* A focus pull rather than a rise: each line starts fractionally oversized
       and soft, then settles to exact size and sharp — like a lens finding
       focus, which suits a photographer's site.
       Deliberately no vertical movement. This script is fetched from another
       origin, so its CSS always lands after the browser has painted the hero
       in place; any downward start position is therefore visible as a snap
       down before the animation runs back up. Scale and blur have no such
       tell — the line is already where it belongs. */
    .taro-hero-line {
      opacity: 0;
      transform: scale(${LEAN ? 1.02 : 1.035});
      ${LEAN ? '' : 'filter: blur(10px);'}
      transition: opacity ${LINE_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) var(--d, 0ms),
                  transform ${LINE_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) var(--d, 0ms)
                  ${LEAN ? '' : `, filter ${LINE_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) var(--d, 0ms)`};
    }
    .taro-hero-line.is-in { opacity: 1; transform: none; filter: none; }

    @media (prefers-reduced-motion: reduce) {
      .taro-hero-line { opacity: 1; transform: none; filter: none; transition: none; }
    }
  `);

  // Delay is assigned by heading level, so the two headline lines arrive
  // together as one statement and the supporting lines follow in turn.
  //
  // Grouping by Squarespace block was tried first and does not work: the two
  // headlines sit in separate blocks in the mobile hero variant, so they went
  // back to chasing each other. Their shared tag is the thing that actually
  // identifies them as a pair.
  const ORDER = ['H1', 'H2', 'H3', 'H4', 'P'];
  const rank = (el) => {
    const i = ORDER.indexOf(el.tagName);
    return i === -1 ? ORDER.length : i;   // buttons and anything else come last
  };

  const tiers = [...new Set(lines.map(rank))].sort((a, b) => a - b);
  lines.forEach((el) => {
    el.classList.add('taro-hero-line');
    el.style.setProperty('--d', `${tiers.indexOf(rank(el)) * LINE_GAP_MS}ms`);
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
