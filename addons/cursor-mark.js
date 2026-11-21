// A normal cursor, with a viewfinder over the photographs.
//
// WHAT THIS REPLACES. cursor.js hid the real pointer (cursor: none) and drew
// its own: an 8px dot that tracked it, and a 34px ring deliberately eased in
// behind at RING_EASE = 0.16 so it trailed. Two problems, both of them real.
// An 8px dot is far less legible than the arrow the operating system draws,
// especially over a photograph; and a ring that is always catching up reads as
// lag rather than as design, because on any frame the browser is busy it stops
// where it is and then jumps. The site was spending a requestAnimationFrame
// loop making its own pointer worse than the free one.
//
// So the arrow comes back, everywhere, untouched. The flair moves to the one
// place it earns its keep: a photograph looks exactly the same whether or not
// it opens, so over anything that does open, the pointer becomes a viewfinder
// with a red centre. That was the honest job the old VIEW ring was doing.
//
// NO JAVASCRIPT RUNS AT POINTER TIME. It is a cursor property in a stylesheet,
// which the compositor draws; there is no loop to fall behind, nothing to
// resync after a slow frame, and no state to get stuck in. The failure mode is
// that a browser declines the image and shows zoom-in instead.
//
// VISIBILITY WAS THE OTHER COMPLAINT, so the mark is drawn twice: a heavy
// cream pass underneath and the ink pass on top of it. On a dark photograph
// the cream reads; on a pale one the ink does. A single-colour cursor
// disappears into half the pictures on this site.

import { defineAddon, css } from '../lib/util.js';

const CREAM = '#f6eed5';
const INK = '#243230';
const RED = '#e23318';

// 28px, hotspot dead centre at 14,14. Kept under 32px because Windows refuses
// to render a cursor larger than that, and a cursor that silently vanishes on
// one platform is worse than a smaller one everywhere.
const viewfinder = () => {
  const brackets = 'M3.5 10V3.5H10 M18 3.5H24.5V10 M24.5 18V24.5H18 M10 24.5H3.5V18';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">`
    + `<path d="${brackets}" fill="none" stroke="${CREAM}" stroke-width="4"`
    + ` stroke-linecap="round" stroke-linejoin="round" opacity="0.92"/>`
    + `<circle cx="14" cy="14" r="4.2" fill="${CREAM}" opacity="0.92"/>`
    + `<path d="${brackets}" fill="none" stroke="${INK}" stroke-width="1.6"`
    + ` stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="14" cy="14" r="2.3" fill="${RED}"/>`
    + `</svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}") 14 14, zoom-in`;
};

// The same markup the old VIEW state was pointed at: /stills and /venues are
// Fluid Engine image blocks, the film and paint galleries are real gallery
// sections. Both spellings, or the film gallery gets nothing.
const PHOTO = 'a.sqs-block-image-link, a.gallery-masonry-lightbox-link, '
  + 'a.gallery-grid-lightbox-link, a.gallery-lightbox-link';

defineAddon('cursor-mark', () => {
  // A cursor image is meaningless to a finger, and setting one on a touch
  // device only risks a stray hover state surviving a tap.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  document.documentElement.classList.add('taro-cursor-mark');

  css('cursor-mark', `
    /* The viewfinder, and nothing else. Everything the browser already does
       well — the arrow, the I-beam in a field, the hand on a link — is left
       exactly as the visitor's own system draws it. */
    html.taro-cursor-mark :is(${PHOTO}),
    html.taro-cursor-mark :is(${PHOTO}) * { cursor: ${viewfinder()}; }
  `);
});
