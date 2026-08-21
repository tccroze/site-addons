// Margin furniture down the left edge of the homepage.
//
// A 24px column at x = 0 carrying two marks: a line of micro-caps set up the
// margin — TARO CROZE — NAIROBI, reading from the foot of the column upward,
// the way a title reads off a book's spine — and beneath it a hairline rule in
// brand teal that inks in from the top as the page is read. Together they say
// "this is a printed object and you are somewhere inside it", which is a
// quieter way to carry the name a second time than another logo would be.
//
// WHERE IT SITS. x = 0..24 is the one column nothing else on this site uses:
// every Squarespace section keeps a gutter of ~39px or more, so the only thing
// the strip ever crosses is a full-bleed photograph — which is exactly where a
// mark in the margin belongs. Vertically the group hangs off the BOTTOM of the
// window rather than sitting centred on it: bottom-anchored, its distance from
// the fixed header grows one-for-one with the window height (centred it grows
// at half that rate, and on an 800px window it sat 50px lower than this does).
// The header is the one thing it must never touch, so that is the axis the
// layout is tuned against, and remeasure() below checks the clearance for real
// rather than trusting this arithmetic.
//
// COLOUR — the whole difficulty, and worth reading before changing it. The mark
// has to survive six grounds on one page: cream #f6eed5 (testimonials), dark
// #243230 (quote band, footer), teal #85b7b2 (the tiles section, 1412px of it),
// red #e23318 (the CTA), and two full-bleed photographs that between them own
// the first ~2900px of the scroll.
//
//   mix-blend-mode: difference was tried and REJECTED. It solves the flat bands
//   beautifully — cream ink comes out near-black on the paper and pale on the
//   dark — but the result over a photograph is |backdrop - ink|, i.e. a hue
//   inversion that crawls and changes colour as the picture moves: a blue sky
//   turns the caps orange. On a site whose subject is the photographs, and
//   where they are most of the page, that makes the quietest element the most
//   restless one. The red CTA is worse still: |#e23318 - #f6eed5| is (20,187,189),
//   a saturated cyan — the single loudest colour anywhere on the site, produced
//   by the piece of furniture that was supposed to whisper.
//
//   So: a fixed muted ink, #8a8171, a warm stone out of the paper family. Its
//   luminance is picked to sit near the geometric mean of the two extremes, so
//   the contrast is deliberately even and deliberately low — about 3.3:1 on the
//   cream and 3.5:1 on the dark, present but never insistent. Two soft halos do
//   the rest: a cream one for dark grounds, a dark one for light ones, each
//   invisible on the ground the other is for. The one ground where it goes
//   genuinely faint is the teal tiles section (~1.6:1) — accepted. Furniture
//   that fades on one band is fine; furniture that flickers cyan is not.
//
// COST. Nothing per frame but one transform write, and only while the mark is
// on screen. Every number the scroll path needs — the document height, where
// the film strip starts, how long the caps are, how tall the header is — is
// measured on load, resize, webfont arrival and a slow interval, the same
// backstop signature.js uses, because lazy images keep growing this page and
// nothing announces it. NOTHING is read from layout inside the scroll path.
//
// REDUCED MOTION. Both marks stay: the caps are a label and the rule is a
// position, and neither is motion. The fill has no transition on it at any
// time — a scroll-driven value already is the animation, and a transition
// layered over one reads as a stutter chasing every wheel notch (scroll-reveal
// documents the same trap). The only motion here is the entrance fade, which is
// CSS, and the media query at the bottom of the stylesheet switches it off
// live. There is deliberately no reduce-motion MediaQueryList in the JS: no
// decision in this file depends on it, and a stored-but-unused one only invites
// the next reader to think something is being handled that isn't.
//
// Progressive enhancement: entirely additive. No JS, no mark, and not one pixel
// of the stock page depends on this file.

import { defineAddon, css } from '../lib/util.js';

const TEXT = 'TARO CROZE — NAIROBI';

// Desktop pointer only, and only in a window with room for it. Written once and
// used by BOTH the stylesheet and the JS gate, so the two can never disagree
// about whether the strip is rendered — the CSS decides, the JS just asks.
const MEDIA = '(min-width: 1100px) and (min-height: 700px) and (hover: hover) and (pointer: fine)';

const STRIP_W = 24;          // px: the column the marks live in
const AXIS = 12;             // px from the left edge to the centre of the column
const CAPS_PX = 10;
const TRACKING = '0.3em';
const RAIL_LEN = 168;        // px: the length of the hairline
const RAIL_BOTTOM = 132;     // px from the foot of the window to the rail's end
const GAP = 22;              // px between the rail and the caps above it
const HEADER_CLEAR = 18;     // px the caps must keep clear of the header

const INK = '#8a8171';       // warm stone — see COLOUR above
const TEAL = '#85b7b2';
const CREAM_HALO = 'rgba(246, 238, 213, 0.28)';
const DARK_HALO = 'rgba(36, 50, 48, 0.34)';
const TRACK = 'rgba(36, 50, 48, 0.16)';

const FADE_MS = 600;
const REMEASURE_MS = 1000;
const BAND_CLEAR = 40;       // px of extra room kept between the rail and the film strip

defineAddon('edge-mark', () => {
  if (location.pathname !== '/') return;
  if (document.querySelector('.taro-edge')) return;   // idempotent

  // Kept as a live MediaQueryList, never flattened into a boolean at boot: a
  // window gets dragged across 1100px, a laptop gets a mouse plugged into it,
  // and a stale capture would leave the scroll handler doing work for a strip
  // that is display:none — or worse, standing down while it is visible.
  const mq = window.matchMedia(MEDIA);

  // The body face, sampled off a real paragraph. Squarespace sets the family on
  // the content rather than on <body> (which reports a generic sans), and the
  // uploaded family name is a hash that changes whenever the font is re-uploaded
  // — so it is read back live rather than written down here. Deliberately NOT
  // the display face: TAN Nimbus is for headings, and a caption in the margin
  // is body copy shrunk, not a small headline.
  const sample = document.querySelector('.sqs-html-content p')
              || document.querySelector('main p')
              || document.querySelector('p');
  const face = sample ? getComputedStyle(sample).fontFamily : '';

  css('edge-mark', `
    /* display:none is the default and the media query is the only thing that
       turns it on, so below the breakpoint — and on every touch device — these
       elements are never laid out, never painted, and cost a phone nothing. */
    .taro-edge {
      display: none;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: ${STRIP_W}px;
      pointer-events: none;
      user-select: none;          /* furniture: select-all must not sweep it up */
      /* Under the header (10) on purpose. The fit check below should mean the
         two never share space, but if it is ever wrong the header wins, which
         is the harmless way for that to fail. Still above the pinned intro
         (4–6) and the film strip (2), and far below the page-transition veil
         and the custom cursor. */
      z-index: 9;
      opacity: 0;
      transition: opacity ${FADE_MS}ms ease;
    }
    @media ${MEDIA} {
      .taro-edge { display: block; }
    }
    .taro-edge.is-in { opacity: 1; }
    /* Not enough headroom in this window for the caps to clear the header.
       Two classes beat the one in the media query on specificity alone — no
       !important needed, and none wanted. */
    .taro-edge.is-unfit { display: none; }
    /* A burger menu at this width would be unusual, but if one ever opens the
       margin is not the place to be arguing with it. Pure CSS, zero cost. */
    body.header--menu-open .taro-edge { opacity: 0; }

    /* Set vertically and turned 180° so it reads upward from the foot of the
       column. rotate() is about the box's own centre, so the box does not move
       when it turns; translateX(-50%) is what centres it on the axis. */
    .taro-edge__caps {
      position: absolute;
      left: ${AXIS}px;
      bottom: ${RAIL_BOTTOM + RAIL_LEN + GAP}px;
      transform: translateX(-50%) rotate(180deg);
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;        /* in vertical writing, wrapping breaks on the
                                     window's HEIGHT — nowrap or it folds */
      margin: 0;
      line-height: 1;
      font-size: ${CAPS_PX}px;
      /* 500, not 600: where the body family ships only 400 and 700, CSS font
         matching resolves a desired 500 downward to the 400 and never
         synthesises a bold — so this is the heaviest value that is still safe
         to ask for on a face we have not seen. */
      font-weight: 500;
      letter-spacing: ${TRACKING};
      text-transform: uppercase;
      -webkit-font-smoothing: antialiased;
      color: ${INK};
      /* Order matters: the cream halo is painted over the dark one, so on a
         dark ground it lifts the letters cleanly instead of being muddied. */
      text-shadow: 0 0 5px ${CREAM_HALO}, 0 0 4px ${DARK_HALO};
    }

    /* The rule: a faint groove the full length, and the ink that fills it from
       the top down. The groove reads on cream and teal and disappears on the
       dark bands, where the teal ink is doing all the talking anyway. */
    .taro-edge__rail {
      position: absolute;
      left: ${AXIS}px;
      bottom: ${RAIL_BOTTOM}px;
      width: 1px;
      height: ${RAIL_LEN}px;
      margin-left: -0.5px;        /* centre a 1px rule on a whole-pixel axis */
      background: ${TRACK};
    }
    .taro-edge__ink {
      position: absolute;
      inset: 0;
      background: ${TEAL};
      /* Gives the hairline an edge on the teal tiles section, where teal on
         teal would otherwise vanish. The shadow is inside the scaled element,
         so its blur squashes vertically with the fill — irrelevant, since it is
         the horizontal edge that separates the line from the ground. */
      box-shadow: 0 0 3px rgba(36, 50, 48, 0.26);
      transform-origin: 50% 0;
      transform: scaleY(0);
      /* No transition, ever. See REDUCED MOTION at the top of this file. */
    }
    /* One 1x${RAIL_LEN} compositor layer, and only while it is on screen —
       will-change pins a layer for as long as it is set, so it is granted with
       the class and withdrawn with it (parallax.js learned this the hard way). */
    .taro-edge.is-in .taro-edge__ink { will-change: transform; }

    @media (prefers-reduced-motion: reduce) {
      .taro-edge { transition: none; }
    }
    @media print {
      .taro-edge { display: none; }
    }
  `);

  const strip = document.createElement('div');
  strip.className = 'taro-edge';
  strip.setAttribute('aria-hidden', 'true');   // decoration: the name is already
                                               // in the header and the footer

  const caps = document.createElement('span');
  caps.className = 'taro-edge__caps';
  caps.textContent = TEXT;
  if (face) caps.style.fontFamily = face;

  const rail = document.createElement('span');
  rail.className = 'taro-edge__rail';
  const ink = document.createElement('i');
  ink.className = 'taro-edge__ink';
  rail.appendChild(ink);

  strip.append(caps, rail);
  document.body.appendChild(strip);

  const header = document.querySelector('#header');
  const footer = document.querySelector('footer');
  let band = null;             // the film strip, once film-strip.js has built it

  // Everything a scroll frame needs, and nothing a scroll frame measures.
  let capsLen = 0;             // length of the type, i.e. the caps box's height
  let fits = true;             // is there room above it for the header?
  let showFrom = 0;            // scroll y at which the mark fades in
  let hideFrom = Infinity;     // scroll y at which it retires before the film strip
  let fillEnd = 0;             // scroll y at which the rule reads full

  const remeasure = () => {
    if (!mq.matches) return;   // display:none — there is nothing to measure
    const vh = window.innerHeight;

    // offsetHeight is the untransformed box: the length of the type regardless
    // of the rotation. TRAP: only ever trust a non-zero reading. If the strip is
    // hidden this returns 0, which would shrink the group, satisfy the clearance
    // test, show the strip, measure it again — and oscillate once a second. The
    // last real measurement is kept instead.
    const len = caps.offsetHeight;
    if (len) capsLen = len;

    // offsetHeight again, not a rect: the header translates itself out of the
    // way on scroll-down, and a rect would report that transform as height 0
    // exactly when the header is about to come back.
    const headerH = header ? header.offsetHeight : 0;
    const capsTop = vh - (RAIL_BOTTOM + RAIL_LEN + GAP) - capsLen;
    fits = capsTop > headerH + HEADER_CLEAR;
    strip.classList.toggle('is-unfit', !fits);

    // One full screen of scrolling before it appears. The mark belongs to
    // reading, not to arriving: masked-intro owns the first screen and its pin
    // runs about 400px, so this clears it comfortably on any desktop window.
    showFrom = vh;

    // The film strip is built lazily on approach, so it does not exist at boot;
    // until it does the footer stands in, and the interval below picks the band
    // up within a second of it appearing — long before it can be scrolled to.
    if (!band) band = document.querySelector('.taro-film');
    const stop = band || footer;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);

    if (stop) {
      // Retire the moment the band's top edge would reach the foot of the rule.
      // BAND_CLEAR buys the fade enough scroll to finish first, so the mark is
      // gone before the contact sheet arrives rather than dissolving on top of it.
      const stopTop = window.scrollY + stop.getBoundingClientRect().top;
      hideFrom = Math.min(maxScroll, stopTop - vh + RAIL_BOTTOM - BAND_CLEAR);
    } else {
      hideFrom = maxScroll;
    }

    // The rule is full at the exact moment the mark stands down: its job is the
    // body of the page, and the contact sheet and the footer are the coda. Tying
    // the fill to maxScroll instead would leave it permanently short of full,
    // which reads as a progress bar that never finishes.
    fillEnd = hideFrom > 0 ? hideFrom : maxScroll;
  };

  // Live in every sense: the media query, the fit test, and a page long enough
  // to be worth tracking at all. The scroll handler asks this first and does
  // nothing else if it is false.
  const live = () => mq.matches && fits && hideFrom > showFrom + 60;

  let queued = false;
  let shown = false;
  let lastFill = '';

  const update = () => {
    queued = false;
    if (!live()) {
      if (shown) { shown = false; strip.classList.remove('is-in'); }
      return;
    }
    const y = window.scrollY;
    const show = y > showFrom && y < hideFrom;
    if (show !== shown) {
      shown = show;
      strip.classList.toggle('is-in', show);
    }
    // Nothing is drawn before the entrance — the rule is not on screen yet, and
    // writing to it every frame of the first screenful would be work for an
    // invisible element. Past hideFrom the write DOES continue for one frame:
    // the value clamps to 1, so the rule reads full while the mark fades out,
    // and every frame after that is a no-op on the guard below.
    if (y <= showFrom) return;
    const p = fillEnd > 0 ? Math.min(1, Math.max(0, y / fillEnd)) : 1;
    const s = p.toFixed(4);
    // Transform only, and only when the value actually moved — a repeated
    // identical write is still a style invalidation.
    if (s !== lastFill) {
      lastFill = s;
      ink.style.transform = `scaleY(${s})`;
    }
  };

  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  const refresh = () => { remeasure(); request(); };

  // Gated at the listener, not inside the frame: below the breakpoint, on a
  // phone, or on a window too short for it, scrolling this page costs one
  // property read and a return.
  window.addEventListener('scroll', () => { if (mq.matches) request(); }, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('load', refresh);
  // Crossing the breakpoint in either direction: the stylesheet shows or hides
  // the column by itself, this just brings the cached numbers current, since
  // nothing was measured while it was hidden.
  mq.addEventListener?.('change', refresh);
  // The caps are set in a webfont that may not have landed yet, and its metrics
  // decide the length of the type — which is what the header clearance is
  // computed from.
  document.fonts?.ready?.then(refresh).catch(() => {});
  // The page keeps growing as lazy images and the intro's stage are sized, and
  // the film strip appears out of nowhere near the bottom. A slow interval is
  // the backstop for both; scrollHeight must never be read on the scroll path.
  setInterval(() => { if (mq.matches) refresh(); }, REMEASURE_MS);

  refresh();
});
