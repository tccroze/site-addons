// Gallery tiles that Squarespace's Custom CSS never learned about.
//
// The tiles on /stills and /venues carry a hover title: the picture darkens
// under a 40% wash and the gallery's name comes up in TAN Nimbus, centred.
// That is built in the site's Custom CSS as a ::after on the image link, and
// the rule names each block by id — ten of them, one per tile, spread across
// four selector lists plus a content line each.
//
// Which means every tile added after those lists were written arrives silent.
// Two have: the Pacific Air Show tile at the foot of /stills, and the Gold
// Coast street photography tile below it. This file is where they are named,
// in the same voice as the other ten: same font, size, tracking, wash and
// timing, read off the live stylesheet rather than guessed.
//
// Keyed to the href, not the block id. Every rule of this kind in the Custom
// CSS names #block-0bcfef0df8e11de67cb5 and the like, which is an id
// Squarespace mints when a block is created and mints afresh if that block is
// ever deleted and re-added — at which point the title silently disappears. A
// tile's destination cannot change without it ceasing to be that tile, so the
// href is the stabler handle by some distance.
//
// To name the next one: add a line to TITLES. To fold these back into the
// Custom CSS instead, add each block id to that group's four selector lists,
// give it a content line, and delete this file and its import.

import { defineAddon, css } from '../lib/util.js';

const TITLES = {
  // The air show tile is authored with a path that 404s and link-repair
  // rewrites it, so both spellings are listed: which one this rule has to
  // match depends on whether that rewrite has run yet, and covering both
  // means the title never blinks out in the moment between them.
  '/pacific-air-show': 'Pacific Air Show',
  '/pacificairshow': 'Pacific Air Show',
  '/goldcoaststreet': 'Gold Coast Street Photography',
};

const linkFor = (href) => `a.sqs-block-image-link[href="${href}"]`;

/* Each selector takes its suffix before the list is joined. Interpolating a
 * comma-separated list straight into a rule silently breaks it: written as
 * "LIST .fluidImageOverlay" it reads as "the first tile, OR an overlay inside
 * the second", so the first selector styles the link instead of the wash. */
const sel = (suffix) => Object.keys(TITLES)
  .map((href) => linkFor(href) + suffix).join(', ');

defineAddon('tile-title', () => {
  const present = Object.keys(TITLES).filter((h) => document.querySelector(linkFor(h)));
  if (!present.length) return;

  css('tile-title', `
    /* The wash. Squarespace ships this overlay on every fluid image and leaves
       it transparent; the site's own rule is what gives it the 40% black. */
    ${sel(' .fluidImageOverlay')} {
      opacity: 0 !important;
      background-color: rgba(0, 0, 0, 0.4) !important;
      transition: opacity 0.3s ease;
    }

    ${sel('::after')} {
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
         word. "Gold Coast Street Photography" at the phone size would run well
         past the edge, so this follows the /venues group instead — the rule
         written for names like THE MILKMAN'S DAUGHTER — and is allowed to
         wrap inside 90% of the tile. */
      text-align: center;
      white-space: normal;
      width: 90%;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 2;
      pointer-events: none;
    }

    ${Object.entries(TITLES)
      .map(([href, name]) => `${linkFor(href)}::after { content: "${name}"; }`)
      .join('\n    ')}

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
