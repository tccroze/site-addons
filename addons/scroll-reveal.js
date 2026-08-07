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

const STAGGER_MS = 110;

defineAddon('scroll-reveal', () => {
  if (location.pathname !== '/') return;
  if (!('IntersectionObserver' in window)) return;

  const sections = [...document.querySelectorAll('section[data-section-id]')];
  const hero = sections.find((s) => s.getBoundingClientRect().height > 0);

  const targets = [...document.querySelectorAll('[data-animation-role]')]
    .filter((el) => !hero || !hero.contains(el));   // hero has its own reveal

  if (!targets.length) return;

  css('scroll-reveal', `
    /* --- text and buttons: rise and fade --- */
    .taro-reveal-on [data-taro-reveal] {
      opacity: 0;
      transform: translateY(34px);
      transition: opacity 1s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i, 0) * ${STAGGER_MS}ms),
                  transform 1s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i, 0) * ${STAGGER_MS}ms);
      will-change: opacity, transform;
    }

    /* --- images: a wipe that uncovers the frame from the bottom up ---
       Only clip-path is animated here. The img's transform belongs to the
       parallax add-on, which rewrites it every frame; two owners on one
       property would fight. */
    .taro-reveal-on [data-taro-reveal][data-taro-kind="image"] {
      opacity: 1;
      transform: none;
      clip-path: inset(0 0 100% 0);
      transition: clip-path 1.25s cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms);
    }
    .taro-reveal-on [data-taro-reveal="in"][data-taro-kind="image"] { clip-path: inset(0 0 0 0); }

    .taro-reveal-on [data-taro-reveal="in"] { opacity: 1; transform: none; }

    @media (prefers-reduced-motion: reduce) {
      .taro-reveal-on [data-taro-reveal] {
        opacity: 1; transform: none; clip-path: none; transition: none;
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

  targets.forEach((el) => {
    el.setAttribute('data-taro-reveal', '');
    if (el.getAttribute('data-animation-role') === 'image') {
      el.setAttribute('data-taro-kind', 'image');
    }
  });
  document.documentElement.classList.add('taro-reveal-on');

  let observerWorks = false;
  const io = new IntersectionObserver((entries) => {
    observerWorks = true;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.setAttribute('data-taro-reveal', 'in');
      io.unobserve(entry.target);       // reveal once, never re-hide
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  targets.forEach((el) => io.observe(el));

  // Failsafe for the case where the observer never runs at all — otherwise the
  // homepage would stay blank. Crucially this checks first: an earlier version
  // revealed everything unconditionally, which fired before the reader had
  // scrolled anywhere and so cancelled the effect entirely.
  setTimeout(() => {
    if (observerWorks) return;
    targets.forEach((el) => el.setAttribute('data-taro-reveal', 'in'));
    io.disconnect();
  }, 4000);
});
