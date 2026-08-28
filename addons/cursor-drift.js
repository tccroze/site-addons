// Large photographs lean toward the cursor.
//
// A few degrees of movement, weighted so the picture leads the pointer rather
// than chasing it: the image travels a small distance in the same direction you
// move, easing rather than tracking, so a still page feels alive without
// anything appearing to animate on its own.
//
// WHAT IT WILL NOT TOUCH:
//
//   The homepage. masked-intro and dune-reveal both compute geometry against
//   those photographs every frame — the ridge, the tear, where the copy has
//   sunk to — and an unexpected transform on the same element is exactly the
//   class of bug that took four attempts to clear out of the dune scene.
//
//   Anything parallax.js owns. That add-on already writes transform on the
//   homepage's image blocks; two add-ons writing one property is a fight
//   neither wins.
//
//   Gallery tiles, which gallery-hover scales on hover, and anything already
//   carrying a taro- class.
//
// Touch devices are excluded outright — there is no cursor to follow, and the
// drift would simply never fire. Reduced motion is honoured live rather than at
// boot, so turning it on mid-session stops the movement at the next frame.

import { defineAddon, css } from '../lib/util.js';

const MAX_SHIFT = 14;      // px at the far edge of the window
const SCALE = 1.035;       // covers the shift so no bare edge appears
const EASE = 0.08;         // per frame, toward the pointer
const MIN_W = 0.55;        // of viewport width, to count as a feature image
const MIN_H = 320;

defineAddon('cursor-drift', () => {
  if (location.pathname === '/') return;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  const candidates = () => [...document.querySelectorAll('.section-background img, .sqs-block-image img')]
    .filter((img) => {
      if (img.closest('#header') || img.closest('footer')) return false;
      if (img.closest('.gallery-masonry')) return false;
      if (/taro/.test(img.className) || /taro/.test(img.parentElement?.className || '')) return false;
      if (img.closest('[data-animation-role="image"]')) return false;   // parallax.js
      const r = img.getBoundingClientRect();
      return r.width >= innerWidth * MIN_W && r.height >= MIN_H;
    });

  let imgs = candidates();
  if (!imgs.length) return;

  css('cursor-drift', `
    .taro-drift {
      will-change: transform;
      transform: translate3d(var(--taro-dx, 0px), var(--taro-dy, 0px), 0) scale(${SCALE});
    }
    @media (prefers-reduced-motion: reduce) {
      .taro-drift { transform: none; }
    }
  `);
  imgs.forEach((i) => i.classList.add('taro-drift'));

  let tx = 0, ty = 0, cx = 0, cy = 0, running = false;

  const frame = () => {
    // Frame-rate independence is overkill for a 14px drift; what matters is
    // that it settles rather than jitters, so it stops when it is close enough.
    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;
    imgs.forEach((img) => {
      img.style.setProperty('--taro-dx', `${cx.toFixed(2)}px`);
      img.style.setProperty('--taro-dy', `${cy.toFixed(2)}px`);
    });
    if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) requestAnimationFrame(frame);
    else running = false;
  };

  const start = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

  addEventListener('pointermove', (e) => {
    if (still.matches) return;
    tx = ((e.clientX / innerWidth) - 0.5) * 2 * MAX_SHIFT;
    ty = ((e.clientY / innerHeight) - 0.5) * 2 * MAX_SHIFT;
    start();
  }, { passive: true });

  // Leaving the window returns the picture to rest rather than freezing it
  // mid-lean, which reads as a stuck page.
  addEventListener('pointerleave', () => { tx = 0; ty = 0; start(); });
  addEventListener('blur', () => { tx = 0; ty = 0; start(); });

  // Late-loading blocks are picked up once, on load, rather than watched.
  addEventListener('load', () => {
    const fresh = candidates().filter((i) => !i.classList.contains('taro-drift'));
    fresh.forEach((i) => i.classList.add('taro-drift'));
    if (fresh.length) imgs = imgs.concat(fresh);
  }, { once: true });
});
