// The mobile menu opens like a sheet of paper laid over the page.
//
// Stock Squarespace opens the overlay as one 400ms fade with the link list
// riding up 20px underneath it — everything arrives at once, as a slab. Two
// changes here: the sheet gets a torn bottom edge, so it reads as the same
// watercolour paper as the rest of the site rather than a coloured panel, and
// the links come in one after another, each rising the last few pixels as it
// fades up. Closing is the reverse at twice the speed with no stagger — an
// exit that takes as long as an entrance feels like the menu is reluctant to
// go.
//
// There is no click handling and no state of our own. Squarespace toggles
// body.header--menu-open (and burger--active on the button) and everything
// here hangs off that class through CSS transitions, which run in both
// directions for free. The burger-to-X is Squarespace's own 250ms rotate and
// is left alone.
//
// Progressive enhancement: every rule is scoped under html.taro-menu-paper,
// which only this file sets, so if the script never loads the menu is stock.
// The one real hazard is the links' resting state — opacity 0 until the open
// class lands. Should Squarespace ever rename that class the links would be
// invisible in an open menu, so a tiny MutationObserver on the burger checks,
// once per open, that the body class arrived with it, and stands the whole
// add-on down if it did not.

import { defineAddon, css } from '../lib/util.js';

const RISE_PX = 14;       // how far each link rises as it fades in
const IN_MS = 420;
const OUT_MS = 200;
const STAGGER_MS = 60;
const MAX_ITEMS = 12;     // nth-child delays are written out this far

// The torn strip: one tile, repeated across the bottom of the sheet. 420px
// wide so a phone shows roughly one tile and a tablet two — the features stay
// the same physical size everywhere, which a stretched-to-width mask would not.
// The top TEAR_SOLID px of the tile are always paper; the solid layer above it
// overlaps into that band so no hairline can open where the two layers meet.
const TEAR_W = 420;
const TEAR_H = 72;
const TEAR_SOLID = 14;
// How many undulations the coarsest octave makes across one tile. Three reads
// as torn; many more and it is pinking shears.
const CELLS = 3;

/**
 * Seeded value noise whose lattice wraps every `period` cells, so a curve
 * sampled over one period meets itself exactly and the strip tiles with no
 * seam. Octave frequencies are whole multiples of the tile, for the same reason.
 */
function noise(seed, period) {
  let s = seed >>> 0;
  const table = Array.from({ length: period }, () =>
    (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  return (u) => {
    const i = Math.floor(u), f = u - i;
    const a = table[i % period], b = table[(i + 1) % period];
    return a + (b - a) * (f * f * (3 - 2 * f));
  };
}

/** Several octaves of it: a slow wander, then finer and finer fibre. */
function fbm(seed, octaves = 6) {
  const layers = [];
  for (let k = 0, cells = CELLS; k < octaves; k++, cells *= 2) {
    layers.push({ n: noise(seed + k * 7919, cells), cells });
  }
  return (t) => {
    let sum = 0, amp = 1, norm = 0;
    for (const { n, cells } of layers) {
      sum += amp * (n(t * cells) - 0.5);
      norm += amp;
      amp *= 0.5;
    }
    return sum / norm;   // roughly -0.35 .. 0.35
  };
}

/**
 * The strip as an SVG data URI: paper from the top down to a ragged line,
 * nothing below it. It is alpha that masks, so the fill colour is arbitrary.
 * A half-transparent stroke along the same line, half of it hanging below the
 * edge, is the fibre — a pixel or two where the paper thins before it ends.
 * No filters: at this size a displacement map adds nothing the octaves do not.
 */
function tearMask() {
  // Seed 17 with these gains keeps the edge between ~20px and ~62px of the
  // 72 without ever hitting the clamps; a clamped run is a flat, and a flat
  // reads as a cut.
  const f = fbm(17);
  const steps = TEAR_W / 2;
  const mid = TEAR_H * 0.58, amp = TEAR_H * 1.5;
  const lo = TEAR_SOLID, hi = TEAR_H - 2;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = Math.min(hi, Math.max(lo, mid + amp * f(t)));
    pts.push(`${(t * TEAR_W).toFixed(1)},${y.toFixed(1)}`);
  }
  const edge = pts.join(' L');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TEAR_W}" height="${TEAR_H}" viewBox="0 0 ${TEAR_W} ${TEAR_H}">` +
    `<path d="M0,0 L${edge} L${TEAR_W},0 Z" fill="#fff"/>` +
    `<path d="M${edge}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linejoin="round"/>` +
    `</svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

defineAddon('menu-paper', () => {
  const menu = document.querySelector('.header-menu');
  const burger = document.querySelector('.header-burger-btn');
  if (!menu || !burger || !menu.querySelector('.header-menu-nav-item')) return;

  // Delays for the stagger, one rule per position. nth-child rather than a
  // per-item inline style so there is nothing to keep in sync if Squarespace
  // re-renders the list; anything past MAX_ITEMS shares the last delay.
  let delays = '';
  for (let i = 2; i <= MAX_ITEMS; i++) {
    delays += `html.taro-menu-paper .header--menu-open .header-menu-nav-item:nth-child(${i}) { transition-delay: ${(i - 1) * STAGGER_MS}ms; }\n`;
  }
  delays += `html.taro-menu-paper .header--menu-open .header-menu-nav-item:nth-child(n+${MAX_ITEMS + 1}) { transition-delay: ${(MAX_ITEMS - 1) * STAGGER_MS}ms; }\n`;

  // Reduced motion is a media query rather than a matchMedia read because the
  // whole effect is CSS: the browser re-evaluates the query the moment the OS
  // setting flips, which is as live as a check can be. Under it, none of the
  // motion rules apply and Squarespace's own fade is what runs. The tear is
  // not motion and stays.
  css('menu-paper', `
    @media (prefers-reduced-motion: no-preference) {
      /* Squarespace slides the whole list up 20px over 600ms on open. Stacked
         under a per-link rise it doubled the travel and blurred the stagger
         into a drift, so the list is held still and the links do the moving. */
      html.taro-menu-paper .header-menu .header-menu-nav-list {
        transform: none;
        transition: none;
      }
      html.taro-menu-paper .header-menu-nav-item {
        opacity: 0;
        transform: translateY(${RISE_PX}px);
        transition: opacity ${OUT_MS}ms cubic-bezier(.4, 0, .6, 1),
                    transform ${OUT_MS}ms cubic-bezier(.4, 0, .6, 1);
      }
      html.taro-menu-paper .header--menu-open .header-menu-nav-item {
        opacity: 1;
        transform: none;
        transition: opacity ${IN_MS}ms cubic-bezier(.2, .6, .3, 1),
                    transform ${IN_MS}ms cubic-bezier(.2, .6, .3, 1);
      }
      ${delays}
    }
  `);

  // The mask is two layers that add: a plain block covering all but the last
  // strip of the sheet, and the torn tile repeated along the bottom. Sized from
  // the bottom up in px (capped for short landscape viewports) so the tear is
  // the same depth whatever the screen height. If the browser cannot parse the
  // sizes the declaration is dropped and both layers fall back to covering the
  // element — no tear, but nothing clipped either.
  if (CSS.supports('mask-image', 'linear-gradient(#000, #000)')
   || CSS.supports('-webkit-mask-image', 'linear-gradient(#000, #000)')) {
    const tear = tearMask();
    css('menu-paper-tear', `
      html.taro-menu-paper .header-menu {
        --taro-tear-h: min(${TEAR_H}px, 9vh);
        -webkit-mask-image: linear-gradient(#000, #000), ${tear};
                mask-image: linear-gradient(#000, #000), ${tear};
        -webkit-mask-size: 100% calc(100% - var(--taro-tear-h) + ${TEAR_SOLID - 2}px), auto var(--taro-tear-h);
                mask-size: 100% calc(100% - var(--taro-tear-h) + ${TEAR_SOLID - 2}px), auto var(--taro-tear-h);
        -webkit-mask-position: 0 0, 0 100%;
                mask-position: 0 0, 0 100%;
        -webkit-mask-repeat: no-repeat, repeat-x;
                mask-repeat: no-repeat, repeat-x;
      }
    `);
  }

  document.documentElement.classList.add('taro-menu-paper');

  // The self-check. Squarespace sets burger--active and body.header--menu-open
  // in the same tick; if the button ever goes active and the body class has
  // not arrived by the next frame, the convention has changed under us and the
  // resting opacity:0 would hide the links. Drop the root class and everything
  // above reverts to stock at once — mid-open, if need be.
  if (typeof MutationObserver === 'undefined') return;
  const mo = new MutationObserver(() => {
    if (!burger.classList.contains('burger--active')) return;
    requestAnimationFrame(() => {
      if (document.body.classList.contains('header--menu-open')) return;
      document.documentElement.classList.remove('taro-menu-paper');
      mo.disconnect();
      console.warn('[taro] menu-paper: open class did not arrive; standing down');
    });
  });
  mo.observe(burger, { attributes: true, attributeFilter: ['class'] });
});
