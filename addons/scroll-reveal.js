// Scroll reveal for homepage headings, images and buttons.
//
// Squarespace's own animations are set to "none" site-wide, but it still tags
// the right elements with data-animation-role (headings, images, buttons). We
// drive off those hooks rather than inventing selectors.
//
// Images get a filmic clip wipe rather than a plain fade — they are the point
// of the site, so they earn the more interesting treatment. Text and buttons
// rise and fade.
//
// Progressive enhancement matters: the hidden state is scoped to a class this
// file puts on <html>, so if the script never loads nothing is ever hidden.

import { defineAddon, css } from '../lib/util.js';

// Slow enough to register as movement rather than a flicker. The earlier
// timings were quick enough that the reveal was over before it was noticed.
const TEXT_MS = 1500;
const IMAGE_MS = 1900;
const STAGGER_MS = 155;

defineAddon('scroll-reveal', () => {
  if (location.pathname !== '/') return;
  

  const sections = [...document.querySelectorAll('section[data-section-id]')];
  const hero = sections.find((s) => s.getBoundingClientRect().height > 0);

  const targets = [...document.querySelectorAll('[data-animation-role]')]
    .filter((el) => !hero || !hero.contains(el));   // hero has its own reveal

  if (!targets.length) return;

  css('scroll-reveal', `
    /* --- text and buttons: rise and fade --- */
    .taro-reveal-on [data-taro-reveal] {
      opacity: 0;
      transform: translateY(30px);
      filter: blur(7px);
      transition: opacity ${TEXT_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms),
                  transform ${TEXT_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms),
                  filter ${TEXT_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms);
      will-change: opacity, transform, filter;
    }

    /* --- images: a wipe that uncovers the frame from the bottom up ---
       Only clip-path is animated here. The img's transform belongs to the
       parallax add-on, which rewrites it every frame; two owners on one
       property would fight. */
    .taro-reveal-on [data-taro-reveal][data-taro-kind="image"] {
      opacity: 1;
      transform: none;
      filter: none;
      clip-path: inset(0 0 100% 0);
      transition: clip-path ${IMAGE_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms);
    }
    .taro-reveal-on [data-taro-reveal="in"][data-taro-kind="image"] { clip-path: inset(0 0 0 0); }

    .taro-reveal-on [data-taro-reveal="in"] { opacity: 1; transform: none; filter: blur(0); }

    @media (prefers-reduced-motion: reduce) {
      .taro-reveal-on [data-taro-reveal] {
        opacity: 1; transform: none; filter: none; clip-path: none; transition: none;
      }
    }
  `);

  // Stagger per section, so each behaves as its own sequence rather than one
  // long cascade down the whole page.
  sections.forEach((section) => {
    targets
      .filter((el) => section.contains(el))
      .forEach((el, i) => el.style.setProperty('--i', i));
  });

  // Anything already on screen when this runs is marked revealed immediately and
  // never enters the hidden state. An element the visitor can already see must
  // not be hidden in order to animate it — that is how the Venues, Stills and
  // Paint cards ended up invisible. Only content below the fold animates in.
  const startsVisible = (el) => {
    const r = el.getBoundingClientRect();
    return (r.width || r.height) && r.top < window.innerHeight && r.bottom > 0;
  };

  targets.forEach((el) => {
    if (el.getAttribute('data-animation-role') === 'image') {
      el.setAttribute('data-taro-kind', 'image');
    }
    el.setAttribute('data-taro-reveal', startsVisible(el) ? 'in' : '');
  });
  document.documentElement.classList.add('taro-reveal-on');

  // Driven by scroll position rather than IntersectionObserver, deliberately.
  // The reveal hides images until triggered, so anything that stops the trigger
  // firing leaves a blank frame on a live page — and an observer has failure
  // modes that are invisible until they bite. A direct measurement against the
  // viewport cannot silently not-happen, and with a handful of elements the
  // cost of checking is nothing.
  let pending = targets.filter((el) => el.getAttribute('data-taro-reveal') !== 'in');
  let queued = false;

  const check = () => {
    queued = false;
    const limit = window.innerHeight * 0.9;   // trigger a little before the edge
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      // Squarespace ships hidden desktop/mobile duplicates; those have no box
      // and must stay pending in case a resize brings them into play.
      if (r.width === 0 && r.height === 0) return true;
      if (r.top < limit && r.bottom > 0) {
        el.setAttribute('data-taro-reveal', 'in');
        return false;
      }
      return true;
    });
  };

  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(check);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  window.addEventListener('load', request);
  check();
});
