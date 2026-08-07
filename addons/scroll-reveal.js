// Scroll reveal for homepage headings, images and buttons.
//
// Squarespace's own animations are set to "none" site-wide, but it still tags
// the right elements with data-animation-role (headings, images, buttons). We
// drive off those hooks rather than inventing selectors, so the reveal lands on
// exactly what Squarespace considers content.
//
// Progressive enhancement matters here: the "hidden" state is scoped to a class
// this file puts on <html>. If the script fails to load, nothing is ever hidden
// and the page reads normally.

import { defineAddon, css } from '../lib/util.js';

const STAGGER_MS = 90;

defineAddon('scroll-reveal', () => {
  if (location.pathname !== '/') return;
  if (!('IntersectionObserver' in window)) return;

  const sections = [...document.querySelectorAll('section[data-section-id]')];
  const hero = sections.find((s) => s.getBoundingClientRect().height > 0);

  const targets = [...document.querySelectorAll('[data-animation-role]')]
    // The hero has its own bespoke reveal; leave it alone.
    .filter((el) => !hero || !hero.contains(el));

  if (!targets.length) return;

  css('scroll-reveal', `
    .taro-reveal-on [data-taro-reveal] {
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.85s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i, 0) * ${STAGGER_MS}ms),
                  transform 0.85s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i, 0) * ${STAGGER_MS}ms);
      will-change: opacity, transform;
    }
    .taro-reveal-on [data-taro-reveal="in"] {
      opacity: 1;
      transform: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .taro-reveal-on [data-taro-reveal] { opacity: 1; transform: none; transition: none; }
    }
  `);

  // Stagger is per-section, so each section animates as its own little sequence
  // rather than one long cascade down the page.
  sections.forEach((section) => {
    targets
      .filter((el) => section.contains(el))
      .forEach((el, i) => el.style.setProperty('--i', i));
  });

  targets.forEach((el) => el.setAttribute('data-taro-reveal', ''));
  document.documentElement.classList.add('taro-reveal-on');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.setAttribute('data-taro-reveal', 'in');
      io.unobserve(entry.target);       // reveal once, never re-hide
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

  targets.forEach((el) => io.observe(el));
});
