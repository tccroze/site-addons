// Hero headline reveal — each line wipes up from behind a mask, in sequence.
//
// The mask is made by giving the heading `overflow: hidden` and translating an
// inner wrapper up into view. Both the heading and the wrapper stay block-level,
// so line wrapping, alignment and Squarespace's own typography are untouched —
// which a display:inline-block wrapper would have broken.
//
// The homepage carries two hero variants (Squarespace "content mode" swaps a
// desktop and a mobile copy), so this deliberately picks the visible one.

import { defineAddon, css } from '../lib/util.js';

const START_DELAY_MS = 250;
const LINE_GAP_MS = 145;

defineAddon('hero-reveal', () => {
  if (location.pathname !== '/') return;

  const hero = [...document.querySelectorAll('section[data-section-id]')]
    .find((s) => s.getBoundingClientRect().height > 0);
  if (!hero) return;

  const lines = [...hero.querySelectorAll('h1, h2, h3, h4')]
    .filter((el) => el.innerText.trim() && el.getBoundingClientRect().height > 0);
  if (!lines.length) return;

  css('hero-reveal', `
    .taro-line { overflow: hidden; }
    /* Descenders would otherwise be clipped by the mask. */
    .taro-line__inner {
      display: block;
      padding-bottom: 0.14em;
      margin-bottom: -0.14em;
      transform: translateY(110%);
      transition: transform 1s cubic-bezier(0.16, 0.84, 0.3, 1) var(--d, 0ms);
      will-change: transform;
    }
    .taro-line.is-in .taro-line__inner { transform: translateY(0); }

    @media (prefers-reduced-motion: reduce) {
      .taro-line__inner { transform: none; transition: none; }
    }
  `);

  lines.forEach((el, i) => {
    if (el.querySelector('.taro-line__inner')) return;   // never double-wrap
    const inner = document.createElement('span');
    inner.className = 'taro-line__inner';
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
    el.classList.add('taro-line');
    inner.style.setProperty('--d', `${i * LINE_GAP_MS}ms`);
  });

  // Two frames so the browser paints the masked state before it animates —
  // without this the transition is skipped and the lines simply appear.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    setTimeout(() => lines.forEach((el) => el.classList.add('is-in')), START_DELAY_MS);
  }));
});
