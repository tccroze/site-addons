// The contact sheet advances like film through a gate.
//
// This began as sprocket rails down the edges of the window on gallery pages,
// and it was the wrong place for them. The galleries are full-bleed: there is
// no margin for a rail to live in, so it either lies over the photographs or
// it is faint enough to be invisible. It was faint enough to be invisible —
// the owner's question was "what is the film advance", which is the only review
// that matters.
//
// The contact sheet already has a film base and real perforations down both
// edges, because that view IS a strip of film. So the advance goes there, where
// it has something to move: scrolling the sheet steps the perforations, one at
// a time, quantised so they arrive rather than slide.
//
// The quantisation is the whole idea. A strip translating smoothly with the
// scroll is a decoration anyone has seen; the same strip snapping forward one
// perforation at a time is the mechanism the work came out of.

import { defineAddon, css } from '../lib/util.js';

const PITCH = 40;     // px between perforations — one advance step

defineAddon('film-advance', () => {
  const sheet = document.querySelector('.taro-cs');
  const roll = sheet && sheet.querySelector('.taro-cs__roll');
  if (!roll) return;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  css('film-advance', `
    /* The roll's own perforations are drawn by contact-sheet.js; this only
       moves them, through a custom property so the two never write the same
       declaration. */
    .taro-cs__roll {
      background-position:
        left 6px top var(--taro-adv, 0px),
        right 6px top var(--taro-adv, 0px) !important;
    }
  `);

  let queued = false;
  const step = () => {
    queued = false;
    if (still.matches || !sheet.classList.contains('is-on')) return;
    // Only ever a whole number of perforations: the strip arrives at each one
    // rather than sliding past it.
    const frames = Math.floor(window.scrollY / PITCH);
    roll.style.setProperty('--taro-adv', `${(frames * PITCH) % (PITCH * 6)}px`);
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(step); } };

  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  // The sheet is a view that gets switched on; start moving when it does.
  new MutationObserver(ask).observe(sheet, { attributes: true, attributeFilter: ['class'] });
  step();
});
