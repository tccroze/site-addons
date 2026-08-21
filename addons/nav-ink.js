// Nav ink: a hand-drawn ink stroke under each top-nav link.
//
// Hovering a link draws a short teal stroke in beneath it, left to right, the
// way a pen moves; leaving lets the ink lift off again. The current page's
// link keeps its stroke permanently, at about half strength, in place of
// Squarespace's stock one-pixel rule — a typeset underline looked borrowed on
// a site whose identity is torn watercolour paper.
//
// Every link wears its own stroke. The path is generated here at init from a
// little seeded noise — a filled ribbon rather than a stroked line, so its
// weight wanders between roughly 2 and 3px and both ends taper the way a nib
// lands and lifts, which is what separates "ink" from "underline". The seed is
// the link's href, so the strokes differ from one another but STILLS always
// wears the same stroke on every page: the mark seen on hover from the
// homepage is the mark that stays once you arrive.
//
// Desktop pointer only. Hover means nothing on a phone, where the nav lives
// inside Squarespace's burger menu anyway, and on a tablet a hover stroke left
// behind after a tap would read as a stuck state.
//
// No layout shift and nothing per frame: the stroke is an absolutely
// positioned span tucked under the baseline, and every state change is a CSS
// transition of transform and opacity only. The one measurement — each link's
// width — is taken once, at init, before any span is added.

import { defineAddon, css } from '../lib/util.js';

const TEAL = '#85b7b2';
const BAND = 8;            // px: the strip the stroke lives in; also the SVG viewBox height
const WEIGHT = 2.5;        // px: nominal ink weight — the wobble takes it ~2–3
const STEP = 7;            // px between control points: how often the line wanders
const HERE_OPACITY = 0.55; // the current page's resting mark
const IN_MS = 260;
const OUT_MS = 180;
const EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';

// FNV-1a, so the same href always yields the same seed.
function hashOf(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: tiny, seedable, and plenty for wobble.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (v) => Math.round(v * 100) / 100;

// A smooth curve through a run of points, as cubic Béziers (Catmull-Rom).
// Straight segments between points seven pixels apart show their corners
// even at this weight; the curve is what makes it read as one movement.
function through(pts) {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i];
    const p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} `
       + `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} `
       + `${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/**
 * One stroke, as a CSS background-image value. Drawn in pixel units at the
 * link's measured width so the wander has the same pitch under a short word
 * and a long one; preserveAspectRatio="none" then lets it stretch with the
 * vw-sized header type after a resize, which is a few percent and invisible.
 */
function strokeImage(width, seed) {
  const rnd = rng(seed);
  const n = Math.max(6, Math.round(width / STEP));
  const tilt = (rnd() - 0.5) * 1.4;   // one end sits a touch higher than the other
  const bow = (rnd() - 0.5) * 1.2;    // and there is a gentle arc between them
  const top = [], bottom = [];
  let drift = 0, weight = 0;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // Random walks pulled back towards zero: the line wanders, never far.
    drift += (rnd() - 0.5) * 0.9 - drift * 0.35;
    weight += (rnd() - 0.5) * 0.5 - weight * 0.35;
    const y = Math.min(BAND - 1.8, Math.max(1.8,
      BAND / 2 + tilt * (u - 0.5) + bow * Math.sin(u * Math.PI) + drift));
    // A nib lands and lifts: thin at both ends, full weight quickly between.
    const taper = Math.pow(Math.sin(u * Math.PI), 0.3);
    const half = Math.max(0.15, ((WEIGHT + weight) * taper) / 2);
    top.push([u * width, y - half]);
    bottom.push([u * width, y + half]);
  }
  bottom.reverse();
  const d = `M${f(top[0][0])} ${f(top[0][1])}${through(top)}`
          + `L${f(bottom[0][0])} ${f(bottom[0][1])}${through(bottom)}Z`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${BAND}' `
            + `preserveAspectRatio='none'><path fill='${TEAL}' d='${d}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

defineAddon('nav-ink', () => {
  // Pointer-driven, so only where there is a real pointer — the same gate as
  // cursor.js. A device does not change its pointer mid-visit, so this one is
  // read once.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  // Reduced motion is different: the OS setting can flip mid-session. The
  // hover transitions are zeroed by a media query in the CSS below, which the
  // browser re-evaluates live; this MediaQueryList is consulted at the one
  // decision JS makes itself — whether the current-page mark draws in on
  // arrival or simply appears.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Squarespace renders the nav twice — once in the desktop header, once in
  // the mobile one, hidden — and marks the current page on both with
  // header-nav-item--active and aria-current. The hidden copy costs nothing
  // to decorate and would look wrong undecorated if a breakpoint ever showed
  // it, so both get the treatment.
  const links = [...document.querySelectorAll('#header .header-nav-item > a[href]')];
  if (!links.length) return;

  css('nav-ink', `
    /* Only once JS has built the strokes does the stock underline stand
       down, so the page is never without a current-page mark. position:
       relative on a static link moves nothing. */
    html.taro-ink-on #header .header-nav-item > a { position: relative; }
    html.taro-ink-on #header .header-nav-item--active > a { background-image: none; }

    .taro-ink {
      --taro-ink-in: ${IN_MS}ms;
      --taro-ink-out: ${OUT_MS}ms;
      position: absolute;
      left: 0;
      right: 0;
      bottom: -2px;
      height: ${BAND}px;
      pointer-events: none;
      background-repeat: no-repeat;
      background-size: 100% 100%;
      transform: scaleX(0);
      transform-origin: 0 50%;
      opacity: 0;
      /* Leaving: the ink lifts (opacity), and only once it has gone does the
         stroke snap back to nothing, ready to draw in again from the left.
         Retracting it instead needed a flipped transform-origin, and a leave
         mid-draw then jumped the half-drawn line to the other end. */
      transition: opacity var(--taro-ink-out) ${EASE},
                  transform 0s linear var(--taro-ink-out);
    }

    /* The current page: drawn and kept, at half strength. */
    .taro-ink--here {
      transform: scaleX(1);
      opacity: ${HERE_OPACITY};
      transition: opacity var(--taro-ink-out) ${EASE},
                  transform var(--taro-ink-in) ${EASE};
    }

    /* Drawing in. Keyboard focus earns it on any device; hover only where
       hover is real. The current page's stroke is already drawn, so there
       hovering simply deepens the ink. */
    #header .header-nav-item > a:focus-visible > .taro-ink {
      transform: scaleX(1);
      opacity: 1;
      transition: transform var(--taro-ink-in) ${EASE}, opacity 0s;
    }
    #header .header-nav-item > a:focus-visible > .taro-ink--here {
      transition: transform var(--taro-ink-in) ${EASE}, opacity var(--taro-ink-in) ${EASE};
    }
    @media (hover: hover) and (pointer: fine) {
      #header .header-nav-item > a:hover > .taro-ink {
        transform: scaleX(1);
        opacity: 1;
        transition: transform var(--taro-ink-in) ${EASE}, opacity 0s;
      }
      #header .header-nav-item > a:hover > .taro-ink--here {
        transition: transform var(--taro-ink-in) ${EASE}, opacity var(--taro-ink-in) ${EASE};
      }
    }

    /* The stroke still appears and the current page is still marked — those
       are information, not motion — but nothing animates. */
    @media (prefers-reduced-motion: reduce) {
      .taro-ink { --taro-ink-in: 0s; --taro-ink-out: 0s; }
    }
  `);

  // Current page, by Squarespace's own markers first, with a path match as the
  // fallback for any page they miss. A bare "/" only ever matches itself.
  const herePath = location.pathname.replace(/\/+$/, '') || '/';
  const isHere = (a) => {
    if (a.parentElement.classList.contains('header-nav-item--active')) return true;
    if (a.getAttribute('aria-current') === 'page') return true;
    let path;
    try { path = new URL(a.href, location.href).pathname.replace(/\/+$/, '') || '/'; }
    catch (e) { return false; }
    return path === herePath || (path !== '/' && herePath.startsWith(`${path}/`));
  };

  // Measure every link before touching any of them, so the reads are one
  // batch and never interleave with the writes below. The hidden copy has no
  // box; it gets a nominal width, which is fine because it stretches to fit.
  const widths = links.map((a) => Math.round(a.offsetWidth) || 100);

  const marks = [];
  links.forEach((a, i) => {
    const ink = document.createElement('span');
    ink.className = 'taro-ink';
    ink.setAttribute('aria-hidden', 'true');
    ink.style.backgroundImage = strokeImage(widths[i], hashOf(a.getAttribute('href')));
    a.appendChild(ink);
    if (isHere(a)) marks.push(ink);
  });

  // Hand over from Squarespace's rule to ours. The mark's class goes on two
  // frames later, once the span's resting style has been computed, so the
  // change is a transition — the stroke draws itself in as the page arrives.
  // Under reduced motion it is simply there.
  document.documentElement.classList.add('taro-ink-on');
  const settle = () => marks.forEach((m) => m.classList.add('taro-ink--here'));
  if (reduceMotion.matches) settle();
  else requestAnimationFrame(() => requestAnimationFrame(settle));
});
