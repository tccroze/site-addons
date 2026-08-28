// Scrolling a gallery advances like film through a gate.
//
// Every site scrolls smoothly and every site fades. Film does neither: it moves
// in discrete pulls, one frame at a time, and stops dead between them. So on
// the gallery pages a sprocket rail runs down the edge of the window and
// advances in steps as you scroll — quantised, not smoothed, so the movement
// reads as a mechanism rather than as parallax.
//
// WHY QUANTISED IS THE WHOLE POINT. A rail translating continuously with the
// scroll is a decoration anyone has seen; the same rail snapping forward one
// perforation at a time is the medium the work is made in. The step is the
// height of one perforation, so the holes always land where holes belong and
// the rail never appears to be halfway through one.
//
// It draws nothing that competes: ink at low opacity on the site's own paper,
// off the content entirely, out of the accessibility tree, and gone on narrow
// screens where there is no room beside the photographs. Under reduced motion
// the rail stays but stops advancing — the texture without the movement.

import { defineAddon, css } from '../lib/util.js';

const PITCH = 40;        // px between perforations — one advance step
const RAIL_W = 14;

defineAddon('film-advance', () => {
  if (!document.querySelector('.gallery-masonry')) return;
  if (window.matchMedia('(max-width: 900px)').matches) return;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  css('film-advance', `
    .taro-fa {
      position: fixed; top: 0; bottom: 0; width: ${RAIL_W}px;
      z-index: 4; pointer-events: none;
      /* One perforation per PITCH, drawn rather than imaged. */
      background-image: repeating-linear-gradient(to bottom,
        transparent 0 11px,
        rgba(36, 50, 48, 0.16) 11px 29px,
        transparent 29px ${PITCH}px);
      background-size: ${RAIL_W}px ${PITCH}px;
      background-repeat: repeat-y;
      transform: translate3d(0, var(--taro-fa, 0px), 0);
      will-change: transform;
      opacity: 0; transition: opacity 500ms ease;
    }
    .taro-fa.is-on { opacity: 1; }
    .taro-fa--l { left: 6px; }
    .taro-fa--r { right: 6px; }
    /* The contact sheet draws its own sprockets on the film base; two sets in
       one view would read as a mistake. */
    .taro-cs-on .taro-fa { opacity: 0; }
    @media (prefers-reduced-motion: reduce) {
      .taro-fa { transition: none; }
    }
  `);

  const rails = ['l', 'r'].map((side) => {
    const el = document.createElement('div');
    el.className = `taro-fa taro-fa--${side}`;
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    return el;
  });
  requestAnimationFrame(() => rails.forEach((r) => r.classList.add('is-on')));

  let queued = false;
  const step = () => {
    queued = false;
    if (still.matches) return;
    // The quantisation IS the effect: the rail is only ever at a whole number
    // of perforations, so it arrives at each one rather than sliding past it.
    const frames = Math.floor(window.scrollY / PITCH);
    const y = -((frames * PITCH) % (PITCH * 8));
    rails.forEach((r) => r.style.setProperty('--taro-fa', `${y}px`));
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(step); } };

  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  step();
});
