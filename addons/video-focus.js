// Click a film on the motion page and it steps forward: the page behind it
// blurs and darkens, and the video grows by a fifth, centred in the window.
// Click away, press Escape, or use the close mark to put it back.
//
// It is deliberately not a full-screen takeover. These are 16:9 films on a
// wide page — throwing them at the whole viewport adds letterboxing and a
// modal that has to be dismissed before anything else can happen. A fifth
// bigger against a blurred page is enough to say "this one, now", while the
// page stays where it was and one click returns you to it.
//
// GETTING THE FILM ABOVE THE BLUR. Two earlier attempts are worth recording,
// because both look reasonable and neither works:
//
//   Lifting every ancestor above the veil lifts everything inside them too.
//   Squarespace nests sixteen deep here, and raising the lot brought the
//   section's own heading and body copy up with the film — nothing read as
//   blurred at all.
//
//   Moving the player into the overlay fixes the stacking but breaks the
//   player: Squarespace scopes the Plyr skin to a wrapper class, so pulled out
//   of it the film renders as a raw, unsized video with native controls.
//
// Measured, only TWO ancestors actually trap the player — the ones that create
// a stacking context. `.fe-block` (a grid item carrying z-index: 1) holds this
// film and nothing else, so raising it lifts only the film. `main` carries
// z-index: 9 and holds the entire page, so it cannot be raised — instead the
// veil is put INSIDE it, where it covers everything main contains while the
// raised block still sits above it. The header and footer live outside main
// and so are blurred directly; there are two of them, which is cheap.
//
// One ancestor clips rather than stacks — Fluid Engine's grid carries
// `overflow: clip`, which would take a slice off the film once it grows past
// its cell. That is opened for the duration.
//
// Everything written here is an inline style, recorded and restored verbatim
// on close. The player itself is only ever given a transform, and is never
// moved in the document, so Plyr keeps both its skin and its playback.
//
// The hero at the top of the page is left alone: it is a muted, looping,
// full-bleed background, not a film to be watched.

import { defineAddon, css } from '../lib/util.js';

const GROW = 1.2;        // a fifth bigger, as asked
const MARGIN = 28;       // window edge kept clear when centring
const BLUR = '7px';
const DIM = 'brightness(0.72)';   // matched to the veil's own dimming

defineAddon('video-focus', () => {
  // Gated on the BLOCKS, not on the players. Squarespace builds its Plyr
  // instances well after DOMContentLoaded — measured here, there are six
  // .sqs-block-video blocks and zero .plyr elements at the moment this runs,
  // and the first version of this file enumerated players, found none, and
  // returned before it had even installed its stylesheet. Nothing worked and
  // nothing said why.
  if (!document.querySelector('.sqs-block-video')) return;

  const main = document.querySelector('main#page') || document.querySelector('main');
  if (!main) return;                       // nothing to hang the veil inside

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  css('video-focus', `
    .taro-vf-veil {
      position: fixed; inset: 0;
      z-index: 9990;
      background: rgba(18, 16, 12, 0.30);
      -webkit-backdrop-filter: blur(${BLUR}); backdrop-filter: blur(${BLUR});
      opacity: 0;
      transition: opacity 320ms ease;
      cursor: zoom-out;
    }
    .taro-vf-veil--on { opacity: 1; }

    /* Outside main, so the veil cannot reach them. Two elements, so a direct
       filter costs nothing worth measuring. */
    .taro-vf-dim {
      filter: blur(${BLUR}) ${DIM};
      transition: filter 320ms ease;
      pointer-events: none;
    }

    .taro-vf-player {
      position: relative;
      z-index: 1;                       /* above the veil within its raised block */
      transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
      transform-origin: 50% 50%;
      will-change: transform;
    }
    .taro-vf-player video { box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5); }

    .taro-vf-close {
      position: fixed; top: 20px; right: 22px;
      z-index: 9996;
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: none; border: 0; padding: 0;
      color: var(--siteBackgroundColor, #f6eed5);
      font: 300 30px/1 system-ui, sans-serif;
      cursor: pointer;
      opacity: 0;
      transition: opacity 300ms ease 100ms, transform 200ms ease;
    }
    .taro-vf-close--on { opacity: 0.85; }
    .taro-vf-close:hover, .taro-vf-close:focus-visible { opacity: 1; transform: scale(1.1); }

    @media (prefers-reduced-motion: reduce) {
      .taro-vf-veil, .taro-vf-dim, .taro-vf-player, .taro-vf-close { transition: none; }
    }
  `);

  let open = null;                 // the .plyr currently focused
  let touched = [];                // [{ el, css }] — inline styles to put back
  let veil = null, closeBtn = null;
  let dx = 0, dy = 0, sc = 1;

  const remember = (el) => touched.push({ el, css: el.getAttribute('style') });

  const restoreAll = () => {
    touched.forEach(({ el, css: prev }) => {
      el.classList.remove('taro-vf-dim');
      if (prev === null) el.removeAttribute('style');
      else el.setAttribute('style', prev);
    });
    touched = [];
  };

  /** Raise the one block that holds this film, open anything that would clip
   *  it, and blur what lies outside main where the veil cannot reach. */
  const stage = (player) => {
    for (let n = player.parentElement; n && n !== main; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const stacks = cs.zIndex !== 'auto';
      const clips = !/^visible/.test(cs.overflow);
      if (!stacks && !clips) continue;
      remember(n);
      if (stacks) {
        if (cs.position === 'static') n.style.position = 'relative';
        n.style.zIndex = '9995';
      }
      if (clips) n.style.overflow = 'visible';
    }
    // Header, footer, and anything else that is not main.
    const outside = main.parentElement ? [...main.parentElement.children] : [];
    outside.forEach((el) => {
      if (el === main || el.contains(main)) return;
      if (!el.getBoundingClientRect().height) return;
      remember(el);
      el.classList.add('taro-vf-dim');
    });
  };

  /** Grows by GROW but never past the window. On a phone, where the film
   *  already spans the width, this lands near 1 — the blur and the centring
   *  still do their work, there is simply no room to grow into. */
  const scaleFor = (r) => Math.max(1, Math.min(
    GROW,
    (window.innerWidth - MARGIN * 2) / r.width,
    (window.innerHeight - MARGIN * 2) / r.height,
  ));

  const apply = () => {
    open.style.transform =
      `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sc.toFixed(3)})`;
  };

  /** First placement, measured from the resting box. */
  const place = () => {
    if (!open) return;
    const r = open.getBoundingClientRect();
    sc = scaleFor(r);
    dx = window.innerWidth / 2 - (r.left + r.width / 2);
    dy = window.innerHeight / 2 - (r.top + r.height / 2);
    apply();
  };

  /** Correct whatever the first placement missed, without clearing the
   *  transform — clearing it mid-flight would snap the film back to its
   *  resting size for a frame. The error is read from where it actually is
   *  and folded into the existing translate, so the transition carries it.
   *
   *  Not belt-and-braces: the site scrolls smoothly, so a click can land while
   *  the page is still gliding, and the measurement is then taken against a
   *  position the page is about to leave. Measured at 57px out before this. */
  const nudge = () => {
    if (!open) return;
    const r = open.getBoundingClientRect();
    const ex = window.innerWidth / 2 - (r.left + r.width / 2);
    const ey = window.innerHeight / 2 - (r.top + r.height / 2);
    if (Math.abs(ex) < 1 && Math.abs(ey) < 1) return;
    dx += ex; dy += ey;
    apply();
  };

  const close = () => {
    if (!open) return;
    const player = open;
    const video = player.querySelector('video');
    if (video && !video.paused) video.pause();   // never leave audio playing unseen
    open = null;
    player.style.transform = '';                 // shrinks back into its own box
    touched.forEach(({ el }) => el.classList.remove('taro-vf-dim'));
    if (veil) veil.classList.remove('taro-vf-veil--on');
    if (closeBtn) closeBtn.classList.remove('taro-vf-close--on');

    const veilEl = veil, btn = closeBtn;
    veil = null; closeBtn = null;
    const finish = () => {
      if (veilEl) veilEl.remove();
      if (btn) btn.remove();
      player.classList.remove('taro-vf-player');
      restoreAll();
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('padding-right');
    };
    if (reduced.matches) finish();
    else setTimeout(finish, 440);
  };

  const openFor = (player) => {
    if (open) return;
    open = player;

    // Inside main, not on body: main carries z-index 9 and holds the whole
    // page, so a veil outside it can never be escaped from within.
    veil = document.createElement('div');
    veil.className = 'taro-vf-veil';
    veil.addEventListener('click', close);
    main.appendChild(veil);

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'taro-vf-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', close);
    main.appendChild(closeBtn);

    // The page must not move under a centred film. Locking the scrollbar away
    // would shift the layout by its width, so the width is given back as
    // padding. Done before measuring, or the reading is taken against a width
    // that is about to change.
    const bar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    if (bar > 0) document.documentElement.style.paddingRight = `${bar}px`;

    stage(player);
    player.classList.add('taro-vf-player');

    requestAnimationFrame(() => {
      if (veil) veil.classList.add('taro-vf-veil--on');
      if (closeBtn) closeBtn.classList.add('taro-vf-close--on');
      place();
      // Once the page has certainly stopped moving and the growth has played
      // out, check the centring and fold in whatever it missed.
      setTimeout(nudge, 480);
    });
  };

  // Delegated, for the same reason: the players do not exist yet, and binding
  // to them on a timer would only move the race. Matching at click time cannot
  // be early or late.
  document.addEventListener('click', (e) => {
    if (open) return;                  // clicks inside the focused film are Plyr's
    const player = e.target.closest && e.target.closest('.sqs-block-video .plyr');
    if (!player || !player.querySelector('video')) return;
    openFor(player);
    // Played from inside the click, not from a later frame: these films carry
    // sound, and a browser only grants that to a live user gesture.
    const v = player.querySelector('video');
    if (v && v.paused) v.play().catch(() => {});
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) close();
  });
  window.addEventListener('resize', nudge, { passive: true });
});
