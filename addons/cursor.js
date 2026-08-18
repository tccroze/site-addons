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
  // Kept as a MediaQueryList, not a frozen boolean — the OS setting can change
  // mid-visit, and the change listener at the bottom honours that.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

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
      pointer-events: none;
      z-index: 2147483000;
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    .taro-dot { width: 8px; height: 8px; margin: -4px 0 0 -4px; }
    .taro-ring { width: 34px; height: 34px; margin: -17px 0 0 -17px; }

    /* The visual lives on an inner span so the hover states can scale it
       rather than resize it — resizing a fixed-position element forces layout
       on every hover, and a scale on the outer element would be overwritten
       by the translate the JS writes there every frame. */
    .taro-dot span, .taro-ring span {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transition: transform 0.3s ease, border-color 0.3s ease;
    }
    .taro-dot span { background: ${TEAL}; }
    .taro-ring span { border: 1px solid ${TEAL}73; }   /* ~45% alpha */

    .taro-cursor-awake .taro-dot,
    .taro-cursor-awake .taro-ring { opacity: 1; }

    /* Over something clickable the ring opens and the dot tightens. */
    .taro-cursor-over .taro-ring span {
      transform: scale(1.588);          /* 54px over the resting 34px */
      border-color: ${TEAL};
    }
    .taro-cursor-over .taro-dot span {
      transform: scale(0.625);          /* 5px over the resting 8px */
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
  // The inner spans carry the visuals — see the stylesheet note.
  dot.appendChild(document.createElement('span'));
  ring.appendChild(document.createElement('span'));
  document.body.append(dot, ring);
  document.documentElement.classList.add('taro-cursor-on');

  let px = innerWidth / 2, py = innerHeight / 2;   // pointer
  let rx = px, ry = py;                            // ring, chasing it
  let running = false;
  let lastFrame = 0;

  const frame = (now) => {
    // Ease per unit of time, not per frame, so the ring trails the same
    // distance on a 120Hz display as on a 60Hz one. dt is capped so a stalled
    // tab cannot make it teleport on return.
    const dt = lastFrame ? Math.min(80, now - lastFrame) : 1000 / 60;
    lastFrame = now;
    const k = 1 - Math.pow(1 - RING_EASE, dt / (1000 / 60));
    rx += (px - rx) * k;
    ry += (py - ry) * k;
    ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
    if (Math.abs(px - rx) < 0.1 && Math.abs(py - ry) < 0.1) { running = false; return; }
    requestAnimationFrame(frame);
  };
  const run = () => { if (!running) { running = true; lastFrame = 0; requestAnimationFrame(frame); } };

  const root = document.documentElement;
  window.addEventListener('pointermove', (e) => {
    // Checked live — reduced motion may have been switched on since boot.
    if (reduced.matches) return;
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

  // If reduced motion is switched on mid-visit, hand the native cursor back
  // and put the dot and ring to sleep — the pointermove guard above keeps
  // them asleep. Switched off again, the next move wakes everything up.
  // No teardown or re-init; just the classes.
  reduced.addEventListener('change', () => {
    const off = reduced.matches;
    root.classList.toggle('taro-cursor-on', !off);
    if (off) root.classList.remove('taro-cursor-awake');
  });
});
