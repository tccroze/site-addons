// The burger menu, as a sheet of paper pulled down over the page.
//
// A phone visitor meets the stock Squarespace overlay: a transparent panel
// with seven links fading up together as one slab. It is the only place on the
// site that looks like a template. Two changes put it back in the site's own
// hand:
//
//   the surface  — cream page colour, torn along the bottom, so the menu reads
//                  as the same watercolour stock as the rest of the site and
//                  the page shows through underneath the tear;
//   the arrival  — the links come in one after another, each rising the last
//                  fourteen pixels as it fades up. Leaving, they go together
//                  and fast: an exit that takes as long as an entrance reads
//                  as a menu that will not close.
//
// There is no state and no click handling here. Squarespace owns the burger
// and puts `header--menu-open` on <body>; every rule below hangs off that
// class, so both directions come free from CSS transitions and there is
// nothing of ours to get stuck half-open. The burger-to-X is Squarespace's own
// animation and is left alone.
//
// Progressive enhancement: every rule is scoped under html.taro-menu-paper,
// which only this file sets, and it is set last. No JS, no rules, stock menu.
//
// The one real hazard is the links' resting state — opacity 0 until the open
// class lands. If Squarespace ever renames that class the menu would open
// empty, so the name is watched (see the stand-down at the bottom) and the
// whole add-on removes itself the moment it looks wrong.

import { defineAddon, css } from '../lib/util.js';

const CREAM = '#f6eed5';
const INK = '#243230';

const RISE_PX = 14;       // how far each link rises as it fades in
const IN_MS = 420;
const OUT_MS = 200;
const STAGGER_MS = 60;
const EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';

// Phone only, by instruction: the overlay is what a phone gets instead of the
// nav bar. Note what happens either side of this line if the site's burger
// breakpoint is not 767 — above it, none of these rules apply and the menu is
// stock, links visible and all. There is no width at which this file can hide
// something and then fail to bring it back.
const PHONE = '(max-width: 767px)';

// The torn strip. One tile, repeated across the bottom of the sheet: 420px
// wide, so a phone shows about one tile and a landscape phone two, and the
// teeth stay the same physical size on both. Stretching a single path to the
// viewport width instead would make the tear coarser on wider screens.
const TEAR_W = 420;
const TEAR_H = 72;
// Where the edge sits inside the tile, and how far it wanders, as fractions of
// the tile height. With the seed below these give a run from y=20.7 to y=66.2
// — clear of both clamps in tearMask(). That matters: a clamped run is a flat
// stretch, and a flat stretch reads as a scissor cut, which is the one thing
// this must not look like. Change the seed and check the range again.
const TEAR_MID = 0.55;
const TEAR_AMP = 1.5;
const TEAR_SEED = 24;
// How far the solid part of the mask overlaps the top of the tile. Anything
// from 0 up to the tile's highest point (20.7) closes the join invisibly;
// past that the overlap's own straight bottom edge starts showing through the
// peaks of the tear.
const TEAR_OVERLAP = 12;
// Undulations the coarsest octave makes across one tile. Three reads as torn.
// Ten reads as pinking shears — the count, not the amplitude, is what decides
// whether this looks handmade.
const CELLS = 3;
const OCTAVES = 5;

// mulberry32, same as nav-ink uses: small, seedable, and the only randomness
// in here. Everything is generated from one fixed seed so the tear is the same
// sheet on every open and on every page — a torn edge that reshuffled itself
// each time you tapped the burger would read as a glitch.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded value noise over a lattice that WRAPS every `period` cells, so a curve
 * sampled across exactly one period arrives back where it started and the tile
 * repeats with no seam. Smoothstep interpolation flattens the slope at every
 * lattice point, which makes the join continuous in the tangent too — without
 * that, the seam shows as a kink even when the heights match.
 *
 * This is masked-intro's noise() with the modulo added; that one samples a
 * fixed 256-cell table across a one-off path and has no reason to tile.
 */
function noise(seed, period) {
  const next = rng(seed);
  const table = Array.from({ length: period }, next);
  return (u) => {
    const i = Math.floor(u), f = u - i;
    const a = table[i % period], b = table[(i + 1) % period];
    return a + (b - a) * (f * f * (3 - 2 * f));
  };
}

/** Octaves of it: one slow wander, then finer and finer fibre on top. */
function fbm(seed) {
  const layers = [];
  for (let k = 0, cells = CELLS; k < OCTAVES; k++, cells *= 2) {
    // Each octave's period IS its cell count, so every one of them wraps at the
    // tile edge. Non-integer frequency ratios — masked-intro multiplies by 2.1
    // to avoid a lattice beat — cannot tile and are wrong here.
    layers.push({ n: noise(seed + k * 7919, cells), cells });
  }
  return (t) => {
    let sum = 0, amp = 1, norm = 0;
    for (const { n, cells } of layers) {
      sum += amp * (n(t * cells) - 0.5);
      norm += amp;
      amp *= 0.5;
    }
    return sum / norm;
  };
}

/**
 * The strip, as an SVG data URI: opaque from the top down to a ragged line and
 * nothing below it. Used as a mask, so it is the alpha that matters and the
 * fill colour is arbitrary — the cream comes from the element underneath.
 *
 * A part-transparent stroke follows the same line with half its width hanging
 * below it. That is the fibre: a pixel and a half where the paper thins out
 * before it stops. Without it the tear is ragged but hard-edged, which is
 * closer to a stencil than to paper.
 *
 * No feTurbulence displacement here, unlike masked-intro's full-bleed tear —
 * at 72px tall the octaves already carry the detail a filter would add, and a
 * filter on an image mask is a compositing cost paid on every open.
 */
function tearMask() {
  const f = fbm(TEAR_SEED);
  const steps = Math.round(TEAR_W / 2.5);
  const lo = 14, hi = TEAR_H - 2;   // clamps; see TEAR_MID/TEAR_AMP above
  /* THE TEAR MUST CLOSE AT BOTH ENDS.
   *
   * Squarespace insets page content by a gutter — 23px of the 390 on a phone —
   * so the strip this tear opens shows the photograph in the middle and bare
   * page either side of it. The photograph's own edge is dead straight, and a
   * torn line running into a straight vertical cut is the one join that reads
   * as a mistake: a little line standing up out of the tear, at the same place
   * on every page.
   *
   * So the tear closes. Across the outer twelfth at each end the edge is drawn
   * down to the full depth of the strip, which keeps the sheet solid over both
   * gutters and hides the cut entirely. Smoothstep, not a straight ramp — the
   * paper has to arrive at the corner rather than turn towards it.
   */
  /* Two distances, not one. The first attempt eased from the very edge and so
   * was only a fifth of the way down by the time it reached the gutter, which
   * left most of the cut still showing — measured, 20px of line became 15px.
   * The closure is now already complete when it crosses the gutter (HOLD) and
   * only then eases back out to the open tear (CLOSE). */
  const HOLD = 0.085;                        // solid to here: 33px of 390
  const CLOSE = 0.20;                        // fully open again by here
  const smooth = (u) => u * u * (3 - 2 * u);
  const taper = (t) => {
    const d = Math.min(t, 1 - t);            // distance from the nearer end
    if (d <= HOLD) return 1;
    if (d >= CLOSE) return 0;
    return 1 - smooth((d - HOLD) / (CLOSE - HOLD));
  };
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = Math.min(hi, Math.max(lo, TEAR_H * (TEAR_MID + TEAR_AMP * f(t))));
    // 1 at the very ends, 0 once clear of them: pull the edge to the bottom.
    const k = taper(t);
    pts.push(`${(t * TEAR_W).toFixed(1)},${(y + (TEAR_H - y) * k).toFixed(1)}`);
  }
  const edge = pts.join(' L');
  const svg =
    // preserveAspectRatio="none" IS LOad-BEARING. The strip is drawn 420x72 and
    // painted into 100% x --taro-menu-tear-h, which on a phone is 390x60 — a
    // different ratio. Left at its default of xMidYMid meet, the SVG letterboxes
    // itself inside that box: it scales by min(390/420, 60/72) = 0.833, renders
    // 350px wide, centres, and leaves 20px at each end carrying no mask at all.
    // That is not a soft edge, it is a rectangular hole the full depth of the
    // strip, punched through the corner of the sheet.
    //
    // It only appears on a short viewport, which is why it survived a round of
    // testing: at 844px tall the tear is 67.5px and the width ratio wins
    // (0.929 vs 0.938), so there is no horizontal gap. Real iOS Safari keeps
    // its toolbar over the bottom ~90px, so a phone is where it shows.
    // Tiling hid it too — the neighbouring tile filled the gap — so it arrived
    // with the switch to a single stretched strip.
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TEAR_W}" height="${TEAR_H}" `
    + `preserveAspectRatio="none" `
    + `viewBox="0 0 ${TEAR_W} ${TEAR_H}">`
    + `<path d="M0,0 L${edge} L${TEAR_W},0 Z" fill="#fff"/>`
    + `<path d="M${edge}" fill="none" stroke="#fff" stroke-opacity=".38" `
    + `stroke-width="3" stroke-linejoin="round"/>`
    + `</svg>`;
  // encodeURIComponent, not a raw string: the path is full of # and " and
  // spaces, any one of which ends the url() early.
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

defineAddon('menu-paper', () => {
  const menu = document.querySelector('.header-menu');
  if (!menu) return;
  const items = menu.querySelectorAll('.header-menu-nav-item');
  if (!items.length) return;

  // Deliberately NOT gated on a phone-width check in JS. Everything below is
  // either a stylesheet scoped to a media query or a couple of attributes, and
  // a visitor who rotates a tablet or drags a desktop window narrow crosses
  // the breakpoint without reloading. CSS re-evaluates; a JS width test taken
  // once at boot does not.

  // The stagger position, written once. The items are server-rendered and all
  // seven are here at DOMContentLoaded, so there is nothing to observe or
  // re-run. If Squarespace ever rebuilds this list the property goes with it
  // and every link falls back to --i: 0 — they arrive together, which is the
  // stock behaviour and not a broken one.
  items.forEach((el, i) => el.style.setProperty('--i', i));

  // The burger's own lines are about to be asked to sit on cream paper rather
  // than on whatever photograph they were coloured against, so they need our
  // ink while the menu is open. They are found by shape — an empty leaf <div>
  // — rather than by Squarespace's bun/patty class names, which have changed
  // more than once between template versions. Wrappers have element children;
  // screen-reader labels have text; the two or three lines have neither. If
  // the icon is an <svg> in some other version this finds nothing, and the
  // `color` rule below is what carries it instead.
  const burger = document.querySelector('.header-burger');
  if (burger) {
    burger.querySelectorAll('div').forEach((el) => {
      if (!el.firstElementChild && !el.textContent.trim()) el.classList.add('taro-menu-line');
    });
  }

  const tear = tearMask();

  css('menu-paper', `
    /* The data URI is parked in one custom property rather than written into
       both the prefixed and unprefixed mask declarations — it is 5.7KB. */
    html.taro-menu-paper { --taro-menu-tear: ${tear}; }

    @media ${PHONE} {
      /* ---- the sheet ---------------------------------------------------- */

      /* The paper is a ::before at z-index -1, which stays inside the menu only
         while the menu is a stacking context. It already is one — position
         fixed with z-index 1 — and this makes that a promise rather than a
         coincidence, because a -1 layer that escapes its context lands behind
         the page content and the sheet simply never appears. */
      html.taro-menu-paper .header-menu { isolation: isolate; }

      html.taro-menu-paper .header-menu::before {
        content: "";
        position: absolute;
        inset: 0;
        /* Behind the links, in front of the page. Painting order, not opacity:
           a positioned pseudo-element at z-index auto would paint ABOVE the
           in-flow nav items and put cream over the type. */
        z-index: -1;
        background: ${CREAM};
        /* Belt and braces. Taps on the sheet are already the menu's own, but
           nothing about a decorative layer should be in the hit path. */
        pointer-events: none;
        /* Depth of the torn strip. Capped in vh as well as px so a landscape
           phone does not end up with a tear taking a fifth of the sheet. */
        --taro-menu-tear-h: min(${TEAR_H}px, 8vh);
        /* Two mask layers that add up: a plain block covering everything above
           the strip, and the torn tile repeated along the bottom. The block
           overhangs the top of the tile by ${TEAR_OVERLAP}px so no hairline can
           open along the join. Sized from the bottom in px, so the tear is the
           same depth on a tall phone and a short one.
           If a browser cannot parse this the whole declaration drops and the
           sheet is a plain rectangle — no tear, but nothing clipped either. */
        -webkit-mask-image: linear-gradient(#000, #000), var(--taro-menu-tear);
                mask-image: linear-gradient(#000, #000), var(--taro-menu-tear);
        /* The strip is stretched to the sheet rather than tiled across it. It
           has to be: the tear now closes at its two ends, and a tile repeated
           across the width would close in the middle of the screen as well.
           At 420px drawn into 390 the teeth are squashed by under a tenth,
           which is not visible; a landscape phone stretches them and they stay
           organic, which is the whole requirement. */
        -webkit-mask-size: 100% calc(100% - var(--taro-menu-tear-h) + ${TEAR_OVERLAP}px),
                           100% var(--taro-menu-tear-h);
                mask-size: 100% calc(100% - var(--taro-menu-tear-h) + ${TEAR_OVERLAP}px),
                           100% var(--taro-menu-tear-h);
        -webkit-mask-position: 0 0, 0 100%;
                mask-position: 0 0, 0 100%;
        -webkit-mask-repeat: no-repeat, no-repeat;
                mask-repeat: no-repeat, no-repeat;
      }

      /* Squarespace's own background layer, if this template version still
         renders one. It measures transparent today, but if it ever carries a
         colour it sits under the tear and fills the strip the tear exists to
         open up. Inert when the element is absent. */
      html.taro-menu-paper .header-menu .header-menu-bg { background: transparent; }

      /* ---- ink ---------------------------------------------------------- */

      /* The overlay used to be transparent, so its type was coloured to read
         against the page behind it — which on the homepage is the dark green
         hero. On cream that same type could be invisible, and this is the one
         change in here that can lock someone in an open menu, so the links and
         the burger are given our ink outright. Doubling .header-menu-nav-item
         buys specificity: stock 7.1 has shipped nth-child rules on these
         items, and a bare class loses to them. */
      html.taro-menu-paper .header-menu .header-menu-nav-item.header-menu-nav-item a {
        color: ${INK};
      }
      html.taro-menu-paper body.header--menu-open .header-burger { color: ${INK}; }
      html.taro-menu-paper body.header--menu-open .header-burger .taro-menu-line {
        background-color: ${INK};
      }
      /* A text site title. An image logo cannot be recoloured from here — if
         the logo is a light PNG it will wash out against the sheet, and the
         fix is a dark logo variant in Squarespace, not CSS. */
      html.taro-menu-paper body.header--menu-open #header .header-title-text a { color: ${INK}; }

      /* ---- the links arriving ------------------------------------------- */

      /* Resting state, which is also the closing state: everything leaves
         together, in ${OUT_MS}ms, no stagger. A staggered close reads as the
         menu arguing about it. */
      html.taro-menu-paper .header-menu .header-menu-nav-item.header-menu-nav-item {
        opacity: 0;
        transform: translateY(${RISE_PX}px);
        transition: opacity ${OUT_MS}ms ${EASE}, transform ${OUT_MS}ms ${EASE};
        transition-delay: 0s;
      }
      html.taro-menu-paper body.header--menu-open .header-menu .header-menu-nav-item.header-menu-nav-item {
        opacity: 1;
        transform: none;
        transition-duration: ${IN_MS}ms;
        transition-delay: calc(var(--i, 0) * ${STAGGER_MS}ms);
      }
    }

    /* Reduced motion. The menu still opens and the tear is still there — a
       torn edge is not motion — but the links simply appear, together and
       without travel. A media query rather than a matchMedia read, so the
       browser re-evaluates it the moment the OS setting flips rather than
       honouring whatever was true at boot. Must stay after the block above:
       same specificity, later wins. */
    @media ${PHONE} and (prefers-reduced-motion: reduce) {
      html.taro-menu-paper .header-menu .header-menu-nav-item.header-menu-nav-item {
        transform: none;
        transition: opacity ${OUT_MS}ms linear;
      }
      html.taro-menu-paper body.header--menu-open .header-menu .header-menu-nav-item.header-menu-nav-item {
        transform: none;
        transition-duration: ${IN_MS}ms;
        transition-delay: 0s;
      }
    }
  `);

  // Everything above is scoped under this class, and it goes on last: until
  // this line runs there is no frame in which a link is hidden without its
  // delay already written.
  document.documentElement.classList.add('taro-menu-paper');

  // The stand-down. We are betting that `header--menu-open` on <body> is what
  // opens this menu; if that name ever changes, the resting opacity:0 above
  // would leave the menu opening empty. So: watch <body>'s class. The first
  // time it carries our name, the bet is settled and the observer stops. If it
  // instead takes some other menu-open-ish class, drop the root class — every
  // rule above reverts to stock in the same frame, mid-open if need be.
  //
  // This cannot catch Squarespace moving the class to a different element
  // entirely, but nothing can, and that change would break Squarespace's own
  // menu CSS long before it reached ours.
  if (typeof MutationObserver === 'undefined') return;
  const mo = new MutationObserver(() => {
    const body = document.body;
    if (body.classList.contains('header--menu-open')) { mo.disconnect(); return; }
    if (!/menu[-_]{0,2}open/i.test(body.className || '')) return;
    document.documentElement.classList.remove('taro-menu-paper');
    mo.disconnect();
    console.warn('[taro] menu-paper: the menu opened under an unfamiliar body class; standing down');
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
});
