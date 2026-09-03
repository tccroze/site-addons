// The Pacific Air Show tile, given the title every other tile already has.
//
// The gallery tiles on /stills and /venues carry a hover title: the picture
// darkens under a 40% wash and the gallery's name comes up in TAN Nimbus,
// centred. It is built in Squarespace's Custom CSS as a ::after on the image
// link, and the rule names each block by id — ten of them, one per tile.
//
// The Pacific Air Show tile is in none of those lists. It sits apart from the
// grid at the foot of /stills, which is how it came to be missed, and it is
// the only photograph on the page that stays silent when you point at it.
//
// This is the one rule, written to match the other ten exactly: same font,
// size, tracking, wash and timing, read straight off the live stylesheet.
//
// Keyed to the href, not the block id. Every other rule of this kind names
// #block-0bcfef0df8e11de67cb5, which is an id Squarespace mints when the block
// is created and mints afresh if the block is ever deleted and re-added — at
// which point the title silently disappears. The destination cannot change
// without the tile ceasing to be the Pacific Air Show tile, so the href is the
// stabler handle by some distance.
//
// If these are ever easier to keep in one place, this rule can move into the
// Custom CSS beside the other ten: add the block id to each of that group's
// four selector lists and give it its own content line. Nothing here would
// need to change except deleting the file and its import.

import { defineAddon, css } from '../lib/util.js';

// Both paths. The tile is authored with the hyphenated path, which 404s, and
// link-repair rewrites it to the real one — so which href this rule has to
// match depends on whether that rewrite has run yet. Matching both means the
// title never blinks out in the moment between the two.
const TILES = [
  'a.sqs-block-image-link[href="/pacific-air-show"]',
  'a.sqs-block-image-link[href="/pacificairshow"]',
];

/* Each selector gets its own suffix and the list is joined afterwards.
 * Interpolating a comma-separated list straight into a rule silently breaks
 * it: a rule written as "LIST .fluidImageOverlay" reads as "the first tile,
 * OR an overlay inside the second", so the first selector would style the
 * link itself rather than the wash inside it. */
const sel = (suffix) => TILES.map((t) => t + suffix).join(', ');

defineAddon('tile-title', () => {
  if (!document.querySelector(TILES.join(', '))) return;

  css('tile-title', `
    /* The wash. Squarespace ships this overlay on every fluid image and leaves
       it transparent; the site's own rule is what gives it the 40% black. */
    ${sel(' .fluidImageOverlay')} {
      opacity: 0 !important;
      background-color: rgba(0, 0, 0, 0.4) !important;
      transition: opacity 0.3s ease;
    }

    ${sel('::after')} {
      content: "Pacific Air Show";
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-family: tan---nimbus-regular-webfont-tn3woj !important;
      font-weight: 700;
      font-size: 1.4rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      line-height: 1.4;
      /* The /stills group sets white-space: nowrap, which is safe for one
         word. Three words at 1.1rem would run past the edge of a phone, so
         this follows the /venues group instead — the one written for names
         like THE MILKMAN'S DAUGHTER — and is allowed to wrap. */
      text-align: center;
      white-space: normal;
      width: 90%;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 2;
      pointer-events: none;
    }

    ${sel(':hover .fluidImageOverlay')},
    ${sel(':focus-visible .fluidImageOverlay')} { opacity: 1 !important; }
    ${sel(':hover::after')},
    ${sel(':focus-visible::after')} { opacity: 1 !important; }

    /* A phone has no hover, so the other ten simply show their titles all the
       time below 768px. This does the same, at the same size. */
    @media screen and (max-width: 767px) {
      ${sel(' .fluidImageOverlay')} { opacity: 1 !important; }
      ${sel('::after')} { opacity: 1 !important; font-size: 1.1rem !important; }
    }
  `);
});
