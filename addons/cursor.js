// Custom cursor: a small solid dot that tracks the pointer exactly, with a
// larger ring easing along behind it. Both in the brand teal.
//
// The native cursor is hidden, which is what makes the dot read as the pointer
// rather than as decoration. Form fields are exempt — losing the I-beam when
// typing is a real usability cost, and no styling is worth that.
//
// An earlier version used a single ring with mix-blend-mode: difference, kept
// alongside the native cursor. This replaces it.

import { defineAddon, css } from '../lib/util.js';

const TEAL = '#85b7b2';
const RING_EASE = 0.16;      // lower = the ring trails further behind
const HOVER_TARGETS = 'a, button, [role="button"], .gallery-masonry-item, .taro-filter__btn, .taro-dots__dot';

defineAddon('cursor', () => {
  // Pointer-driven, so only where there is a real pointer.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  css('cursor', `
    html.taro-cursor-on,
    html.taro-cursor-on body,
    html.taro-cursor-on a,
    html.taro-cursor-on button { cursor: none; }

    /* Never take the caret away from something you type into. */
    html.taro-cursor-on input,
    html.taro-cursor-on textarea,
    html.taro-cursor-on select,
    html.taro-cursor-on [contenteditable="true"] { cursor: auto; }

    .taro-dot, .taro-ring {
      position: fixed;
      top: 0;
      left: 0;
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483000;
      opacity: 0;
      transition: opacity 0.4s ease, width 0.3s ease, height 0.3s ease,
                  margin 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
    }
    .taro-dot {
      width: 8px; height: 8px;
      margin: -4px 0 0 -4px;
      background: ${TEAL};
    }
    .taro-ring {
      width: 34px; height: 34px;
      margin: -17px 0 0 -17px;
      border: 1px solid ${TEAL}73;      /* ~45% alpha */
    }
    .taro-cursor-awake .taro-dot,
    .taro-cursor-awake .taro-ring { opacity: 1; }

    /* Over something clickable the ring opens and the dot tightens. */
    .taro-cursor-over .taro-ring {
      width: 54px; height: 54px;
      margin: -27px 0 0 -27px;
      border-color: ${TEAL};
    }
    .taro-cursor-over .taro-dot {
      width: 5px; height: 5px;
      margin: -2.5px 0 0 -2.5px;
    }

    /* Off-window, or over a field where the real caret is showing. */
    .taro-cursor-hidden .taro-dot,
    .taro-cursor-hidden .taro-ring { opacity: 0; }
  `);

  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'taro-dot';
  ring.className = 'taro-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(dot, ring);
  document.documentElement.classList.add('taro-cursor-on');

  let px = innerWidth / 2, py = innerHeight / 2;   // pointer
  let rx = px, ry = py;                            // ring, chasing it
  let running = false;

  const frame = () => {
    rx += (px - rx) * RING_EASE;
    ry += (py - ry) * RING_EASE;
    ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
    if (Math.abs(px - rx) < 0.1 && Math.abs(py - ry) < 0.1) { running = false; return; }
    requestAnimationFrame(frame);
  };
  const run = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

  const root = document.documentElement;
  window.addEventListener('pointermove', (e) => {
    px = e.clientX;
    py = e.clientY;
    // The dot is set directly rather than eased — it stands in for the pointer,
    // so any lag on it feels like input latency.
    dot.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    root.classList.add('taro-cursor-awake');

    const t = e.target;
    root.classList.toggle('taro-cursor-over', !!t.closest?.(HOVER_TARGETS));
    // Over a field the native caret is showing, so stand down.
    root.classList.toggle('taro-cursor-hidden',
      !!t.closest?.('input, textarea, select, [contenteditable="true"]'));
    run();
  }, { passive: true });

  document.addEventListener('pointerleave', () => root.classList.add('taro-cursor-hidden'));
  document.addEventListener('pointerenter', () => root.classList.remove('taro-cursor-hidden'));
  window.addEventListener('blur', () => root.classList.add('taro-cursor-hidden'));
});
