// Scroll reveal for the homepage.
//
// Squarespace's own animations are set to "none" site-wide, but it still tags
// the right elements with data-animation-role (headings, images, buttons). We
// drive off those hooks rather than inventing selectors.
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
// Progressive enhancement: the hidden state is scoped to a class this file puts
// on <html>, so if the script never loads nothing is ever hidden.

import { defineAddon, css } from '../lib/util.js';
// Declared locally rather than imported: see the note in lib/util.js about
// per-file cache skew breaking the module graph.
const LEAN = window.matchMedia('(hover: none)').matches;

const TEXT_MS = 2300;
const STAGGER_MS = 155;
const WIPE_SPAN = 0.55;   // fraction of its own height an image travels to finish

defineAddon('scroll-reveal', () => {
  if (location.pathname !== '/') return;

  const sections = [...document.querySelectorAll('section[data-section-id]')];
  const hero = sections.find((s) => s.getBoundingClientRect().height > 0);
  const footer = document.querySelector('footer');

  const targets = [...document.querySelectorAll('[data-animation-role]')]
    .filter((el) => !hero || !hero.contains(el))        // hero has its own reveal
    .filter((el) => !footer || !footer.contains(el));   // signature has its own
  if (!targets.length) return;

  const images = targets.filter((el) => el.getAttribute('data-animation-role') === 'image');
  const text = targets.filter((el) => el.getAttribute('data-animation-role') !== 'image');

  css('scroll-reveal', `
    /* Text and buttons. No blur and no will-change on touch: a blur across a
       couple of dozen promoted layers is expensive on a phone. */
    .taro-reveal-on [data-taro-reveal] {
      opacity: 0;
      transform: translateY(${LEAN ? 22 : 30}px);
      ${LEAN ? '' : 'filter: blur(7px);'}
      transition: opacity ${TEXT_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms),
                  transform ${TEXT_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms)
                  ${LEAN ? '' : `, filter ${TEXT_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms)`};
    }
    .taro-reveal-on [data-taro-reveal="in"] { opacity: 1; transform: none; filter: none; }

    /* Photographs. clip-path is written inline every frame, so there is no
       transition to miss — just enough smoothing to stop it stepping between
       frames on a coarse scroll wheel. */
    .taro-reveal-on [data-taro-wipe] { transition: clip-path 90ms linear; }

    @media (prefers-reduced-motion: reduce) {
      .taro-reveal-on [data-taro-reveal] {
        opacity: 1; transform: none; filter: none; transition: none;
      }
      .taro-reveal-on [data-taro-wipe] { clip-path: none !important; transition: none; }
    }
  `);

  // ---- text: staggered per section, revealed once ----
  sections.forEach((section) => {
    text.filter((el) => section.contains(el)).forEach((el, i) => el.style.setProperty('--i', i));
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
    const limit = window.innerHeight * 0.9;
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      // Squarespace ships hidden desktop/mobile duplicates; those have no box
      // and stay pending in case a resize brings them into play.
      if (r.width === 0 && r.height === 0) return true;
      // Everything above the line reveals, including content already scrolled
      // past — otherwise a fast scroll could skip one and strand it invisible.
      if (r.top < limit) { el.setAttribute('data-taro-reveal', 'in'); return false; }
      return true;
    });
  };

  // ---- images: wipe amount is a function of scroll position ----
  const wipeImages = () => {
    const vh = window.innerHeight;
    images.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.height) { el.style.clipPath = 'none'; return; }   // never leave one hidden
      const progress = Math.max(0, Math.min(1, (vh - r.top) / (r.height * WIPE_SPAN)));
      // Cleared entirely once open, so a part-finished clip can never persist.
      el.style.clipPath = progress >= 1
        ? 'none'
        : `inset(0 0 ${((1 - progress) * 100).toFixed(2)}% 0)`;
    });
  };

  let queued = false;
  const update = () => { queued = false; revealText(); wipeImages(); };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  window.addEventListener('load', request);
  update();
});
