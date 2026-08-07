// A trailing ring that follows the pointer and opens up over anything
// clickable or over a photograph.
//
// It uses mix-blend-mode: difference, so the ring inverts whatever is beneath
// it — legible on the cream sections and on a dark photograph without needing
// to know anything about the palette.
//
// The real cursor is deliberately left visible. Hiding it is the fashionable
// choice but it costs people precision and confuses anyone relying on it, and
// the ring reads as an accent rather than a replacement.

import { defineAddon, css } from '../lib/util.js';

const EASE = 0.18;           // how quickly the ring catches up
const HOVER_TARGETS = 'a, button, [role="button"], input, textarea, select, .gallery-masonry-item';

defineAddon('cursor', () => {
  // Pointer-driven, so only where there is a real pointer.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  css('cursor', `
    .taro-cursor {
      position: fixed;
      top: 0;
      left: 0;
      width: 34px;
      height: 34px;
      margin: -17px 0 0 -17px;
      border: 1px solid #fff;
      border-radius: 50%;
      pointer-events: none;
      z-index: 99999;
      opacity: 0;
      mix-blend-mode: difference;
      transition: opacity 0.35s ease, width 0.3s ease, height 0.3s ease,
                  margin 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
    }
    .taro-cursor.is-awake { opacity: 1; }
    .taro-cursor.is-over {
      width: 62px;
      height: 62px;
      margin: -31px 0 0 -31px;
      background: rgba(255, 255, 255, 0.14);
    }
    /* Pointer left the window, or is over a text-entry field. */
    .taro-cursor.is-hidden { opacity: 0; }
  `);

  const ring = document.createElement('div');
  ring.className = 'taro-cursor';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let running = false;

  const frame = () => {
    x += (targetX - x) * EASE;
    y += (targetY - y) * EASE;
    ring.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    // Idle out once it has effectively caught up, so we are not burning frames
    // on a stationary pointer.
    if (Math.abs(targetX - x) < 0.1 && Math.abs(targetY - y) < 0.1) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  };
  const run = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  };

  window.addEventListener('pointermove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    ring.classList.add('is-awake');
    ring.classList.toggle('is-over', !!e.target.closest?.(HOVER_TARGETS));
    run();
  }, { passive: true });

  document.addEventListener('pointerleave', () => ring.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => ring.classList.remove('is-hidden'));
  window.addEventListener('blur', () => ring.classList.add('is-hidden'));
  window.addEventListener('focus', () => ring.classList.remove('is-hidden'));
});
