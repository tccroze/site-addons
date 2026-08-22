// The venues hero, in the site's own language.
//
// That page sells to restaurants and cafes, and it was the most stock thing
// on the site: a good photograph with a headline typeset over it and a hard
// horizontal cut to cream underneath. The homepage now speaks torn watercolour
// paper; this makes the venues page speak it too.
//
// The photograph is torn off along a deckle, and the headline slides under
// that torn edge as you scroll — the type going behind the paper, not merely
// fading out.
//
// ONE MASK, ON THE WRAPPER. Both effects are the same mask. Squarespace's
// content wrapper holds the photograph block AND the two type blocks, so a
// single sheet-shaped mask worn by the wrapper tears the picture and cuts the
// type at exactly the same edge — they cannot drift apart, because there is
// only one edge. Masking the blocks individually would clip each at its own
// box the moment it travelled outside (mask-clip is border-box), which is the
// mistake dune-reveal.js records in its header; masking the wrapper is that
// file's fix, reused.
//
// NO PER-PIXEL SILHOUETTE. The obvious reading of "type sinks behind the
// building" is a traced roofline. dune-reveal.js documents at length why that
// fails on this kind of frame: a wide line crossing a broken, non-level edge
// — trees on the left, umbrellas on the right — is cut into half-letters, and
// stray glyphs strand in the gaps. The torn edge is a shape this file draws
// itself, so it is known exactly and is close to level. The type goes behind
// something real and cannot fragment.
//
// Nothing is destructive: the markup is untouched apart from a class and a
// transform, every write is inline and reversible, and if the photograph is
// ever moved or removed the add-on stands down and the page is stock again.

import { defineAddon, css } from '../lib/util.js';

// The torn band, as fractions of the photograph's height. Shallower than the
// homepage's (0.24): that one is a full-bleed panorama with room to spare,
// this is a shorter hero where a deep tear would eat the venue itself.
const TEAR = 0.13;
const TEAR_START = 0.30;   // where the edge sits at the left, inside the band
const TEAR_END = 0.62;     // and at the right — the gap is the diagonal
const TEAR_AMP = 0.30;     // how far the noise rides off that baseline
const CELLS = 3;           // undulations across the width; more reads as pinking shears
const SINK = 0.42;         // how far the type travels, as a fraction of the photo
const EASE = 0.30;         // the one lag constant the whole site shares
const FRAME = 1000 / 60;

/** Smoothly-interpolated value noise over a 256-cell table, seeded. */
function noise(seed) {
  let s = seed >>> 0;
  const table = Array.from({ length: 256 }, () =>
    (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  return (u) => {
    const i = Math.floor(u), f = u - i;
    const a = table[i & 255], b = table[(i + 1) & 255];
    return a + (b - a) * (f * f * (3 - 2 * f));
  };
}

/** Several octaves, so the edge has both a slow wander and fine fibre. */
function fbm(seed, octaves = 5) {
  const layers = Array.from({ length: octaves }, (_, i) => noise(seed + i * 7919));
  return (t) => {
    let sum = 0, amp = 1, freq = CELLS, norm = 0;
    for (const n of layers) {
      sum += amp * (n(t * freq) - 0.5);
      norm += amp;
      amp *= 0.52; freq *= 2.1;
    }
    return sum / norm;
  };
}

/**
 * What to KEEP: square on three sides, torn along the bottom. Drawn in the
 * wrapper's own pixels, with the tear placed at the photograph's lower edge.
 * Runs well past the sides and the top so the mask cannot shave the picture.
 */
function sheetPath(w, h, photoTop, photoH, seed = 7) {
  const f = fbm(seed);
  const band = photoH * TEAR;
  const base = photoTop + photoH - band;
  const pad = w * 0.08;
  const steps = Math.max(60, Math.round(w / 12));
  const top = -Math.max(80, photoTop + 40);
  let d = `M${(-pad).toFixed(1)},${top.toFixed(1)}`;
  for (let i = 0; i <= steps; i++) {
    const x = -pad + ((w + 2 * pad) * i) / steps;
    const t = x / w;
    const y = base + (TEAR_START + (TEAR_END - TEAR_START) * t + TEAR_AMP * f(t)) * band;
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `${d} L${(w + pad).toFixed(1)},${top.toFixed(1)} Z`;
}

/** The deckle: a coarse tear, then a fine fray on top of it. Both passes are
 *  needed — one alone gives a wobbly but smooth outline, which reads as a cut. */
const deckle = (id) =>
  `<filter id="${id}" x="-10%" y="-40%" width="120%" height="180%" color-interpolation-filters="sRGB">` +
  `<feTurbulence type="fractalNoise" baseFrequency="0.011 0.042" numOctaves="4" seed="11" result="a"/>` +
  `<feDisplacementMap in="SourceGraphic" in2="a" scale="18" xChannelSelector="R" yChannelSelector="G" result="b"/>` +
  `<feTurbulence type="fractalNoise" baseFrequency="0.09 0.24" numOctaves="3" seed="4" result="c"/>` +
  `<feDisplacementMap in="b" in2="c" scale="5" xChannelSelector="R" yChannelSelector="G"/>` +
  `</filter>`;

defineAddon('venue-hero', () => {
  if (!/^\/venues\/?$/i.test(location.pathname)) return;

  const section = [...document.querySelectorAll('section[data-section-id]')]
    .filter((s) => !s.closest('footer'))
    .find((s) => getComputedStyle(s).display !== 'none');
  if (!section) return;

  const wrapper = section.querySelector('.content-wrapper');
  if (!wrapper) return;

  // The photograph: the widest image block in the hero. Anything narrower is
  // not the full-bleed hero shot and tearing it would be nonsense.
  const photoBlock = [...section.querySelectorAll('.fe-block')]
    .filter((b) => b.querySelector('img'))
    .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  if (!photoBlock) return;
  if (photoBlock.getBoundingClientRect().width < window.innerWidth * 0.8) return;

  // The type that sinks: every block in this section carrying a heading or a
  // paragraph. If there is none, the tear alone is still worth having.
  const movers = [...section.querySelectorAll('.fe-block')]
    .filter((b) => b !== photoBlock && b.querySelector('h1, h2, h3, h4, p'));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  css('venue-hero', `
    .taro-venue-sheet {
      -webkit-mask-image: var(--taro-venue-mask);   mask-image: var(--taro-venue-mask);
      -webkit-mask-size: 100% 100%;                 mask-size: 100% 100%;
      -webkit-mask-repeat: no-repeat;               mask-repeat: no-repeat;
    }
    .taro-venue-move { will-change: transform; }
    /* Fluid Engine's grid carries overflow: clip, which would slice the torn
       edge off flat at the cell boundary — the one thing a tear must never
       look like. Opened for this section only. */
    .taro-venue-open { overflow: visible !important; }

    @media (prefers-reduced-motion: reduce) {
      .taro-venue-move { transform: none !important; }
    }
  `);

  // Open every clipping ancestor between the photograph and the section.
  for (let n = photoBlock.parentElement; n && n !== section; n = n.parentElement) {
    if (!/^visible/.test(getComputedStyle(n).overflow)) n.classList.add('taro-venue-open');
  }

  wrapper.classList.add('taro-venue-sheet');
  movers.forEach((b) => b.classList.add('taro-venue-move'));

  let travel = 0, span = 1, maskW = 0, maskH = 0;

  const buildMask = () => {
    const wrap = wrapper.getBoundingClientRect();
    const photo = photoBlock.getBoundingClientRect();
    const w = Math.round(wrap.width), h = Math.round(wrap.height);
    if (!w || !h || !photo.height) return false;
    // Rebuilt only when the box actually changes: the path is a few hundred
    // points and the data URI is kilobytes, so this must not run per frame.
    if (w === maskW && h === maskH) return true;
    maskW = w; maskH = h;
    const d = sheetPath(w, h, photo.top - wrap.top, photo.height);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      deckle('d') + `<path d="${d}" fill="#fff" filter="url(#d)"/></svg>`;
    wrapper.style.setProperty('--taro-venue-mask',
      `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`);
    return true;
  };

  const measure = () => {
    const photo = photoBlock.getBoundingClientRect();
    travel = SINK * photo.height;
    // The gesture lasts as long as the hero is leaving the screen.
    span = Math.max(240, photo.bottom + window.scrollY - window.innerHeight * 0.15);
    buildMask();
  };

  const progress = () => {
    const start = 0;
    const p = (window.scrollY - start) / span;
    return Math.max(0, Math.min(1, p));
  };

  const render = (p) => {
    const y = travel * p;
    const t = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    movers.forEach((b) => { b.style.transform = t; });
  };

  let shown = 0, last = 0, raf = 0;
  const step = (now) => {
    const target = progress();
    const dt = last ? Math.min(80, now - last) : FRAME;
    last = now;
    shown += (target - shown) * (1 - Math.pow(1 - EASE, dt / FRAME));
    if (Math.abs(target - shown) < 0.0004) shown = target;
    render(shown);
    raf = shown === target ? 0 : requestAnimationFrame(step);
  };

  const request = () => {
    if (reduced.matches) { shown = progress(); render(shown); return; }
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(step);
  };

  const relayout = () => { measure(); shown = progress(); render(shown); };

  relayout();
  const img = photoBlock.querySelector('img');
  if (img && !img.complete) img.addEventListener('load', relayout, { once: true });
  window.addEventListener('load', relayout);
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', relayout, { passive: true });
  if (typeof ResizeObserver === 'function') new ResizeObserver(relayout).observe(section);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout).catch(() => {});
});
