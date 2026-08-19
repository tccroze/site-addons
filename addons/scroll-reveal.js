// Scroll reveal for the homepage.
//
// Squarespace's own animations are set to "none" site-wide, but it still tags
// the right elements with data-animation-role (headings, images, buttons). We
// drive off those hooks rather than inventing selectors — with one exception,
// the MOTION tile, which is a code block holding a video and carries no role.
//
// Two different mechanisms, on purpose:
//
//   Text and buttons  — a one-shot fade and rise, triggered as they come up.
//   Photographs       — a wipe tied directly to scroll position. How much of
//                       the image is showing is a pure function of where the
//                       page is, recomputed every frame.
//
// The photographs used to work like the text: flip a class, let a CSS
// transition run. That fired inconsistently — a transition can be missed,
// interrupted, or already spent by the time you look, so the reveal "worked
// about half the time". A value derived from scroll position cannot be missed:
// at a given offset the image is in the matching state, every time.
//
// The wipe is measured against the viewport, not the image's own height. The
// own-height version gave the three category cards three pixel-identical wipes
// that finished while still below the fold — nobody ever saw them arrive — and
// on a phone the same formula spent itself inside the first 167px of entrance.
// Against the viewport the wipe happens where the visitor is looking, and a
// small per-card offset brings a row in left to right instead of as one slab.
//
// A wipe that has finished is finished: the element is latched open and never
// re-clipped. Un-revealing images on the way back up while the text beside
// them stayed put was half of what made the category row read as incoherent —
// two motion languages on unrelated clocks. The other half was anonymity: the
// three card links contain no text at all, so the reveal ended on three unnamed
// rectangles. Each card now carries its label, faded in as its wipe completes,
// so the gesture ends on a name.
//
// Progressive enhancement: the hidden state is scoped to a class this file puts
// on <html>, so if the script never loads nothing is ever hidden.

import { defineAddon, css } from '../lib/util.js';
// Declared locally rather than imported: see the note in lib/util.js about
// per-file cache skew breaking the module graph.
const LEAN = window.matchMedia('(hover: none)').matches;

const TEXT_MS = 2300;
const BUTTON_MS = 800;    // a call to action that takes 2.3s to appear is a
                          // call to action the visitor scrolls past half-drawn
const STAGGER_MS = 120;
// Where the wipe lives on screen: it begins as the image's top rises past 88%
// of the viewport, runs over the next 34%, and each card in a row starts 5%
// after its left-hand neighbour.
const WIPE_START = 0.88, WIPE_SPAN = 0.34, WIPE_STEP = 0.05;

defineAddon('scroll-reveal', () => {
  if (location.pathname !== '/') return;

  const sections = [...document.querySelectorAll('section[data-section-id]')];
  const hero = sections.find((s) => s.getBoundingClientRect().height > 0);
  const footer = document.querySelector('footer');

  const targets = [...document.querySelectorAll('[data-animation-role]')]
    .filter((el) => !hero || !hero.contains(el))        // hero has its own reveal
    .filter((el) => !footer || !footer.contains(el));   // signature has its own

  // The category tiles: three image blocks linking to /venues, /stills and
  // /paint, and a video code block linking to /motion that Squarespace never
  // tags — so three cards wiped and the fourth just popped in. It is enrolled
  // by hand, and the section gets a class for the label styling to hang off.
  const tiles = sections.find((s) =>
    s.querySelector('a[href*="/stills"]') && s.querySelector('a[href*="/paint"]'));
  let motionBlock = null;
  if (tiles) {
    tiles.classList.add('taro-tiles');
    motionBlock = [...tiles.querySelectorAll('.fe-block')].find(
      (b) => b.querySelector('video') && b.querySelector('a[href*="/motion"]'));
  }

  const images = targets.filter((el) => el.getAttribute('data-animation-role') === 'image');
  if (motionBlock && !images.some((el) => el.contains(motionBlock) || motionBlock.contains(el))) {
    images.push(motionBlock);
  }
  const text = targets.filter((el) => el.getAttribute('data-animation-role') !== 'image');
  if (!images.length && !text.length) return;

  css('scroll-reveal', `
    /* Text and buttons. No blur and no will-change on touch: a blur across a
       couple of dozen promoted layers is expensive on a phone. Duration and
       rise are custom properties so buttons can answer faster than prose. */
    .taro-reveal-on [data-taro-reveal] {
      opacity: 0;
      transform: translateY(var(--taro-rise, ${LEAN ? 22 : 30}px));
      ${LEAN ? '' : 'filter: blur(7px);'}
      transition: opacity var(--taro-reveal-ms, ${TEXT_MS}ms) cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms),
                  transform var(--taro-reveal-ms, ${TEXT_MS}ms) cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms)
                  ${LEAN ? '' : `, filter var(--taro-reveal-ms, ${TEXT_MS}ms) cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms)`};
    }
    .taro-reveal-on [data-taro-reveal="in"] { opacity: 1; transform: none; filter: none; }

    /* Photographs: clip-path written inline every frame. No CSS transition on
       top of it — the per-frame writes are already the animation, and layering
       a 90ms linear transition over them made a coarse wheel notch play as a
       visible catch-up stutter: double smoothing. */

    /* The card labels. Styled after the MOTION overlay so the four tiles speak
       with one voice; each fades in as its own wipe completes, so the reveal
       ends on a name instead of an unnamed rectangle. */
    .taro-tiles .fe-block a { position: relative; }
    .taro-tile-label {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      font-size: clamp(1rem, 1.5vw, 1.5rem);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      text-shadow: 0 1px 26px rgba(0, 0, 0, 0.6);
      opacity: 0;
      transition: opacity 600ms ease 150ms;
      pointer-events: none;
    }
    [data-taro-tile-done] .taro-tile-label { opacity: 1; }

    /* The MOTION overlay is the model the labels copy — but it rested at
       opacity 0, so the only named tile had its name on hover only. Visible by
       default under a lighter scrim; a pointer hover deepens it. */
    .taro-tiles .video-overlay {
      opacity: 1 !important;
      background: rgba(0, 0, 0, 0.28) !important;
      transition: background 300ms ease;
    }
    .taro-tiles a:hover .video-overlay { background: rgba(0, 0, 0, 0.45) !important; }

    /* Stacked in the brand line's order — Stills, Motion, Paint, Venues —
       instead of DOM order. The grid's fixed row map cannot be reordered, so
       the container becomes a column flex at this width. The video block gets
       a height, because on the phone it collapsed to a 148px sliver against
       the cards' ~304px rhythm. */
    @media (max-width: 700px) {
      .taro-tiles .fluid-engine {
        display: flex; flex-direction: column;
        gap: 14px;
        padding-block: 8px;
        padding-inline: var(--sqs-mobile-site-gutter, 6vw);
      }
      /* Out of the grid, the image blocks have no height of their own — Fluid
         Engine sizes a block from its grid area and fills the picture into it
         absolutely, so flex items collapse to nothing without an explicit
         height. 72vw restores the cards' portrait rhythm; the film tile sits
         shallower, as a frame of footage should. */
      .taro-tiles .fe-block { position: relative; min-height: 72vw; }
      .taro-tiles .fe-block:has(a[href*="/stills"]) { order: 1; }
      .taro-tiles .fe-block:has(video) { order: 2; min-height: 56vw; }
      .taro-tiles .fe-block:has(a[href*="/paint"]) { order: 3; }
      .taro-tiles .fe-block:has(a[href*="/venues"]) { order: 4; }
      .taro-tiles .fe-block:has(video) a { display: block; height: 100%; }
      .taro-tiles .fe-block:has(video) video {
        width: 100%; height: 100%; min-height: 56vw;
        object-fit: cover;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .taro-reveal-on [data-taro-reveal] {
        opacity: 1; transform: none; filter: none; transition: none;
      }
      .taro-reveal-on [data-taro-wipe] { clip-path: none !important; }
      .taro-tile-label { opacity: 1; transition: none; }
    }
  `);

  // The labels themselves. Keyed off the card's own destination, so a renamed
  // or reordered card in the editor stays truthful without touching this file.
  // Set in the same face as the MOTION overlay, read from it live — the four
  // tiles should speak in one voice, and hard-coding the font here would break
  // the moment Squarespace re-hashes the uploaded family name.
  if (tiles) {
    const overlay = tiles.querySelector('.video-overlay');
    const overlayFont = overlay && getComputedStyle(overlay).fontFamily;
    ['venues', 'stills', 'paint'].forEach((name) => {
      const a = tiles.querySelector(`.fe-block a[href*="/${name}"]`);
      if (!a || a.querySelector('.taro-tile-label')) return;
      const label = document.createElement('span');
      label.className = 'taro-tile-label';
      label.textContent = name.toUpperCase();
      if (overlayFont) label.style.fontFamily = overlayFont;
      a.appendChild(label);
    });
  }

  // ---- text: staggered per section in VISUAL order, revealed once ----
  // Fluid Engine's DOM order is not its visual order, and its hidden breakpoint
  // duplicates have no box at all — indexing them inflated real delays by
  // ~465ms of dead slots. Only elements with a live box get an index, sorted
  // by row band then left to right.
  sections.forEach((section) => {
    text.filter((el) => section.contains(el))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter((x) => x.r.width || x.r.height)
      .sort((a, b) => (Math.round(a.r.top / 90) - Math.round(b.r.top / 90)) || (a.r.left - b.r.left))
      .forEach((x, i) => x.el.style.setProperty('--i', i));
  });
  text.forEach((el) => {
    if (el.getAttribute('data-animation-role') === 'button') {
      el.style.setProperty('--taro-reveal-ms', `${BUTTON_MS}ms`);
      el.style.setProperty('--taro-rise', '14px');
    }
  });

  // Anything already on screen is marked revealed immediately and never enters
  // the hidden state. Hiding something the visitor can already see in order to
  // animate it is what left the cards blank in an earlier version.
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return (r.width || r.height) && r.top < window.innerHeight && r.bottom > 0;
  };
  text.forEach((el) => el.setAttribute('data-taro-reveal', onScreen(el) ? 'in' : ''));
  images.forEach((el) => el.setAttribute('data-taro-wipe', ''));
  document.documentElement.classList.add('taro-reveal-on');

  let pending = text.filter((el) => el.getAttribute('data-taro-reveal') !== 'in');

  const revealText = () => {
    const vh = window.innerHeight;
    const limit = vh * 0.9;
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      // Squarespace ships hidden desktop/mobile duplicates; those have no box
      // and stay pending in case a resize brings them into play.
      if (r.width === 0 && r.height === 0) return true;
      // Above the line, or fully on screen. The second clause is for copy in
      // the last viewport of the page — it can never cross a line drawn at 90%
      // of a viewport it is already inside, so at natural rest the closing
      // call to action sat half-drawn until the visitor idled there for ~2.5s.
      if (r.top < limit || r.bottom < vh - 24) {
        el.setAttribute('data-taro-reveal', 'in');
        return false;
      }
      return true;
    });
  };

  // ---- images: wipe amount is a function of scroll position ----
  // Each image's place in its row decides its stagger slot: same row band,
  // left to right. A finished wipe is latched — dropped from the loop, never
  // re-clipped, and its card is told so the label can come up.
  const bySection = new Map();
  images.forEach((el) => {
    const sec = el.closest('section[data-section-id]') || document.body;
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec).push(el);
  });
  const slot = new Map();
  bySection.forEach((els) => {
    els.map((el) => ({ el, r: el.getBoundingClientRect() }))
      .sort((a, b) => (Math.round(a.r.top / 120) - Math.round(b.r.top / 120)) || (a.r.left - b.r.left))
      .forEach((x, i) => slot.set(x.el, i));
  });
  const state = images.map((el) => ({ el, idx: slot.get(el) || 0, near: true, done: false }));

  const wipeImages = () => {
    const vh = window.innerHeight;
    state.forEach((s) => {
      if (s.done || !s.near) return;
      const r = s.el.getBoundingClientRect();
      if (!r.height) { s.el.style.clipPath = 'none'; return; }   // never leave one hidden
      const p = (vh * WIPE_START - r.top - s.idx * WIPE_STEP * vh) / (vh * WIPE_SPAN);
      if (p >= 1) {
        s.el.style.clipPath = 'none';
        s.done = true;                                  // latched: finished is finished
        const card = s.el.closest('.fe-block');
        (card || s.el).setAttribute('data-taro-tile-done', '');
      } else {
        s.el.style.clipPath = `inset(0 0 ${((1 - Math.max(0, p)) * 100).toFixed(2)}% 0)`;
      }
    });
  };

  let queued = false;
  const update = () => { queued = false; revealText(); wipeImages(); };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  // Only images near the viewport are measured per frame. The rootMargin is
  // generous because the wipe starts at 88% of the viewport — the observer has
  // to wake an image before its wipe would begin, never after.
  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const s = state.find((x) => x.el === e.target);
        if (s) s.near = e.isIntersecting;
      });
      request();
    }, { rootMargin: '25% 0px' });
    state.forEach((s) => { s.near = false; io.observe(s.el); });
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  window.addEventListener('load', request);
  update();
});
