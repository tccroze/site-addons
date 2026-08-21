// Custom cursor: a small solid dot that tracks the pointer exactly, with a
// larger ring easing along behind it. Both in the brand teal.
//
// The native cursor is hidden, which is what makes the dot read as the pointer
// rather than as decoration. Form fields are exempt — losing the I-beam when
// typing is a real usability cost, and no styling is worth that.
//
// Over a gallery thumbnail or a shop product the ring opens wide and reads
// VIEW — the one place on the site where what a click does is not obvious from
// the thing under the pointer (a photograph looks the same whether or not it
// opens). Over ordinary links and buttons the ring still does its smaller
// tighten-and-open.
//
// An earlier version used a single ring with mix-blend-mode: difference, kept
// alongside the native cursor. This replaces it.

import { defineAddon, css } from '../lib/util.js';

const TEAL = '#85b7b2';
const RING_EASE = 0.16;      // lower = the ring trails further behind
const HOVER_TARGETS = 'a, button, [role="button"], .gallery-masonry-item, .taro-filter__btn, .taro-dots__dot';
// Over these the ring opens to VIEW. The gallery tile's own <a> is listed
// alongside the tile because closest() returns the *nearest* match: from the
// thumbnail that is the lightbox link, which is also a plain `a` in
// HOVER_TARGETS — and it must resolve to VIEW, not to the smaller open. The shop
// is Squarespace's product-list section; its card link wraps image and title,
// so the add-to-cart button next to it keeps the ordinary button treatment.
const VIEW_TARGETS = '.gallery-masonry-item, .gallery-masonry-item a, .product-list-item-link';
// One closest() per pointer move, against the union, then a single matches()
// on the hit to tell the two states apart. Cheaper than two closest() walks
// for the common case of moving over nothing interactive at all.
const ALL_TARGETS = `${HOVER_TARGETS}, ${VIEW_TARGETS}`;
const VIEW_LABEL = 'View';

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

    /* The visual lives on an inner span (the disc) so the hover states can
       scale it rather than resize it — resizing a fixed-position element
       forces layout on every hover, and a scale on the outer element would be
       overwritten by the translate the JS writes there every frame. */
    .taro-disc {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transition: transform 0.3s ease, border-color 0.3s ease;
    }
    .taro-dot .taro-disc { background: ${TEAL}; }
    .taro-ring .taro-disc { border: 1px solid ${TEAL}73; }   /* ~45% alpha */

    /* The VIEW word. A sibling of the disc, not a child, so the disc's scale
       never touches it — 7px text scaled 2.5x would be a smeared 17px. It is
       sized for the opened ring and simply hidden until then. padding-left
       balances the trailing letter-space so the word sits dead centre. */
    .taro-ring-label {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 0.2em;
      font-family: var(--taro-cursor-font, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif);
      font-size: 7px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      white-space: nowrap;
      color: ${TEAL};
      opacity: 0;
      transition: opacity 0.25s ease;
      -webkit-font-smoothing: antialiased;
    }

    .taro-cursor-awake .taro-dot,
    .taro-cursor-awake .taro-ring { opacity: 1; }

    /* Over something clickable the ring opens and the dot tightens. */
    .taro-cursor-over .taro-ring .taro-disc {
      transform: scale(1.588);          /* 54px over the resting 34px */
      border-color: ${TEAL};
    }
    .taro-cursor-over .taro-dot .taro-disc {
      transform: scale(0.625);          /* 5px over the resting 8px */
    }

    /* Over a gallery tile or a product: the ring opens wide and the word comes
       up inside it. The stroke scales with the disc (2.5px at this size), so
       it is taken back down in alpha to stay a line rather than a band. The
       dot folds away entirely — at rest it sits exactly where the word is, and
       a dot on the E reads as a smudge, not a pointer; the ring is the pointer
       while VIEW is showing. */
    .taro-cursor-view .taro-ring .taro-disc {
      transform: scale(2.5);            /* 85px over the resting 34px */
      border-color: ${TEAL}99;          /* ~60% alpha */
    }
    .taro-cursor-view .taro-dot .taro-disc {
      transform: scale(0);
    }
    .taro-cursor-view .taro-ring-label { opacity: 1; }

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
  const disc = () => {
    const s = document.createElement('span');
    s.className = 'taro-disc';
    return s;
  };
  dot.appendChild(disc());
  ring.appendChild(disc());
  // The VIEW word, dormant until the ring is over a tile.
  const label = document.createElement('span');
  label.className = 'taro-ring-label';
  label.textContent = VIEW_LABEL;
  ring.appendChild(label);
  // Set in the navigation's face, read live rather than hard-coded — the
  // uploaded family name is a Squarespace hash that changes if the font is
  // ever re-uploaded. <body> itself only carries the generic `sans-serif`, so
  // inherit would not do. The display face is the wrong tool at 7px anyway.
  // One read, at boot; nothing here is on the move path.
  const navLink = document.querySelector('.header-nav-item a, .header-nav a');
  if (navLink) ring.style.setProperty('--taro-cursor-font', getComputedStyle(navLink).fontFamily);
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
    // One walk up the tree. A hit that is itself a VIEW target opens the ring
    // wide; any other hit is the ordinary open. Never both.
    const hit = t.closest?.(ALL_TARGETS);
    const view = !!hit && hit.matches(VIEW_TARGETS);
    root.classList.toggle('taro-cursor-view', view);
    root.classList.toggle('taro-cursor-over', !!hit && !view);
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
