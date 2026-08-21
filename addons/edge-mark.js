// Margin furniture down the left edge of the homepage.
//
// Two pieces, fixed to the viewport and centred on its height: a line of
// micro-caps set up the margin — TARO CROZE — NAIROBI — in the site's body
// face, and under it a hairline that inks in from the top as the page is read,
// the way a printer's register mark or a rule in a book's gutter would sit.
// Both live in a column 24px wide at x = 0, where nothing else on the page
// ever is: every Squarespace section keeps a gutter of at least ~39px, and
// only the full-bleed photographs run out to the edge — which is exactly where
// a mark in the margin is meant to cross the picture.
//
// The caps are cream and blend with mix-blend-mode: difference, so the same
// element reads dark on the paper, pale on the dark footer and inverted on a
// photograph, without ever being told what it sits on. Checked band by band on
// the live page at 1440×900: near-black on the cream, pale cream on the
// rgb(36,50,48) bands and the footer, deep teal on the #85b7b2 tiles section,
// teal on the red CTA, and orange over the blue sky of the hero — that last
// one is the cost of the blend (a hue inversion, loud for a moment against
// the cleanest blue on the page) and it is accepted, because the flat ink it
// would replace is all but invisible on the dark bands and the red, which is
// a worse failure for a mark that is meant to be read anywhere. BLEND below
// is the one-line flip to the flat #7a745f if that judgement changes. Two
// things about the blend are load-bearing and easy to lose:
//
//   - The caps and the rail are SEPARATE fixed elements, appended straight to
//     <body>, not children of one wrapper. A blend is computed against the
//     backdrop inside the element's own parent stacking context, and
//     position: fixed always opens a stacking context — so a shared wrapper
//     would isolate the caps from the page and they would blend with nothing
//     but the wrapper's transparent box. Siblings of <body> see the page.
//   - The rail is kept OUT of the blend. Teal under difference on cream comes
//     out a muddy brown; the hairline is plain teal and stays teal.
//
// The progress value is a pure function of scroll position and is written as a
// transform, nothing else — no CSS transition over it, because a scroll-driven
// value is already the animation and a transition layered on top reads as a
// catch-up stutter on each wheel notch (scroll-reveal.js documents this). The
// document height it is measured against is cached on load and resize and
// refreshed on a slow interval, the same backstop signature.js uses: lazy
// images keep growing the page without announcing it, and scrollHeight must
// not be read on the scroll path.
//
// Desktop only, from 1100px up, and the homepage only — on a phone the margin
// is content, not furniture. Under prefers-reduced-motion nothing changes but
// the entrance: there is no animation in the fill to switch off, since the
// line simply stands wherever the page is, instantly.
//
// Progressive enhancement: everything here is additive. No JS, no mark — the
// stock page is untouched and nothing waits on this file to become visible.

import { defineAddon, css } from '../lib/util.js';

const TEXT = 'TARO CROZE — NAIROBI';
const MIN_WIDTH = 1100;      // px; below this the whole thing stands down
const AXIS = 12;             // px from the left edge to the centre of the column
const CAPS_PX = 10;          // type size
const TRACKING = '0.3em';
const CREAM = '#f6eed5';     // blended: dark on the paper, pale on the footer
const FIXED_INK = '#7a745f'; // used instead if BLEND is turned off
const BLEND = true;          // flip to false to drop mix-blend-mode for a flat colour
const TEAL = '#85b7b2';
const RAIL_PX = 140;         // length of the hairline
const RAIL_GAP = 22;         // px between the end of the caps and the top of the rail
const FADE_MS = 900;         // entrance, so the column does not pop in over a painted page
const REMEASURE_MS = 1000;   // how often the cached document height is checked

defineAddon('edge-mark', () => {
  if (location.pathname !== '/') return;
  if (document.querySelector('.taro-edge-caps')) return;   // idempotent

  // Kept as MediaQueryLists, not frozen booleans. A window can be dragged
  // across 1100px and the OS motion setting can change mid-visit; the scroll
  // path consults .matches at decision time and the change listeners below
  // bring the state up to date the moment either flips.
  const wide = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The body face, sampled from a real paragraph: Squarespace sets it on the
  // content, not on <body>, which reports a generic sans-serif, and the
  // uploaded family name is a hash that changes on re-upload — so it is read
  // back live rather than written down here (the same reasoning as
  // masked-intro's subline). The CSS below carries a var() fallback for the
  // case where no paragraph is found.
  const para = document.querySelector('#sections .sqs-html-content p, .sqs-html-content p, p');
  const paraStyle = para ? getComputedStyle(para) : null;

  css('edge-mark', `
    /* Hidden by default and switched on by width, so below ${MIN_WIDTH}px the
       elements are never laid out or painted — the phone pays nothing. */
    .taro-edge-caps, .taro-edge-rail {
      display: none;
      position: fixed;
      left: ${AXIS}px;
      pointer-events: none;
      user-select: none;        /* furniture: select-all should not sweep it up */
      z-index: 20;              /* over the header (10) and the pinned intro (4);
                                   far under the page-transition veil and cursor */
      opacity: 0;
      transition: opacity ${FADE_MS}ms ease;
    }
    .taro-edge-caps.is-in, .taro-edge-rail.is-in { opacity: 1; }
    @media (min-width: ${MIN_WIDTH}px) {
      .taro-edge-caps, .taro-edge-rail { display: block; }
    }

    /* Set vertically and turned so it reads upward from the foot of the
       column — the convention for a label in a book's margin. The box is one
       line-height wide and the text's length tall; translate(-50%, -50%)
       centres it on the axis and on the viewport's height, and the rotation
       happens about that same centre, so the box does not move when turned. */
    .taro-edge-caps {
      top: 50%;
      margin: 0;
      transform: translate(-50%, -50%) rotate(180deg);
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      line-height: 1;
      font-family: var(--body-font-font-family, var(--paragraphFontFamily, 'Helvetica Neue', Arial, sans-serif));
      font-size: ${CAPS_PX}px;
      font-weight: 500;
      letter-spacing: ${TRACKING};
      text-transform: uppercase;
      -webkit-font-smoothing: antialiased;
      ${BLEND
        ? `color: ${CREAM}; mix-blend-mode: difference;`
        : `color: ${FIXED_INK};`}
    }

    /* The rail: a faint full-length track, and the ink that fills it. The ink
       is scaled from its top so the fill runs downward as the page does. Its
       top edge is set from JS once the caps have been measured — the text's
       length depends on the face and the tracking, so it is not known here. */
    .taro-edge-rail {
      top: calc(50% + var(--taro-edge-drop, 120px));
      width: 1px;
      height: ${RAIL_PX}px;
      margin-left: -0.5px;     /* centre a 1px rule on the axis */
      background: ${TEAL}47;   /* ~28% — the unfilled track */
    }
    .taro-edge-ink {
      position: absolute;
      inset: 0;
      background: ${TEAL};
      transform-origin: 50% 0;
      transform: scaleY(0);
      will-change: transform;  /* one 1x${RAIL_PX} layer; the cheapest hint there is */
    }

    @media (prefers-reduced-motion: reduce) {
      .taro-edge-caps, .taro-edge-rail { transition: none; }
    }
  `);

  const caps = document.createElement('span');
  caps.className = 'taro-edge-caps';
  caps.setAttribute('aria-hidden', 'true');   // decoration; the name is in the header already
  caps.textContent = TEXT;
  if (paraStyle) {
    caps.style.fontFamily = paraStyle.fontFamily;
    caps.style.fontWeight = paraStyle.fontWeight;
  }

  const rail = document.createElement('span');
  rail.className = 'taro-edge-rail';
  rail.setAttribute('aria-hidden', 'true');
  const ink = document.createElement('i');
  ink.className = 'taro-edge-ink';
  rail.appendChild(ink);

  document.body.append(caps, rail);

  // Cached geometry — everything a scroll frame needs, measured only on the
  // events that can change it. maxScroll is the one figure the fill is
  // computed against; capsDrop places the rail under the caps. Both are layout
  // reads, so neither happens on the scroll path.
  let maxScroll = 0;
  let lastDrop = -1;
  const remeasure = () => {
    if (!wide.matches) return;   // hidden: display:none, nothing to measure
    maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    // offsetHeight is the untransformed box — the text's length, regardless of
    // the rotation — so half of it plus the gap is where the rail begins.
    const drop = Math.round(caps.offsetHeight / 2 + RAIL_GAP);
    if (drop !== lastDrop) {
      lastDrop = drop;
      rail.style.setProperty('--taro-edge-drop', `${drop}px`);
    }
  };

  let queued = false;
  const update = () => {
    queued = false;
    if (!wide.matches) return;
    // Unscrollable means there is nothing to measure progress against; a line
    // that reads "finished" is truer there than one that reads "not started".
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 1;
    ink.style.transform = `scaleY(${progress.toFixed(4)})`;
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  const refresh = () => { remeasure(); request(); };

  window.addEventListener('scroll', () => { if (wide.matches) request(); }, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('load', refresh);
  // Crossing the width threshold in either direction: the CSS shows or hides
  // the column on its own; this just brings the numbers and the fill current,
  // since nothing was measured while it was hidden.
  wide.addEventListener?.('change', refresh);
  // A flip of the motion setting has no fill animation to stop, but the entrance
  // fade is CSS and answers the media query live. Requesting a frame keeps the
  // line honest if the flip coincided with a scroll.
  reduceMotion.addEventListener?.('change', request);
  // The caps are set in a webfont that may not have arrived yet; its metrics
  // decide where the rail begins, so measure again once the faces are in.
  document.fonts?.ready?.then(refresh).catch(() => {});
  // The document keeps growing as lazy images and the intro's stage are sized,
  // and nothing announces it. A slow interval keeps the cached height honest
  // and costs one layout read a second — nothing at all while layout is clean.
  setInterval(refresh, REMEASURE_MS);

  refresh();
  // Two frames so the starting opacity is painted before the transition runs;
  // without that the fade is skipped and the column simply appears.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    caps.classList.add('is-in');
    rail.classList.add('is-in');
  }));
});
