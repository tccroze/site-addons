// Turns the three stacked testimonials into one crossfading quote.
//
// The list is a Squarespace "simple list" section: ul.user-items-list-item-container
// holding li.list-item, laid out with CSS grid. Rather than absolutely positioning
// the quotes (which would collapse the container's height), all three are placed in
// the same grid cell — so the row still sizes itself to the tallest quote and the
// section never changes height as it rotates.

import { defineAddon, css } from '../lib/util.js';

const INTERVAL_MS = 6500;

defineAddon('testimonial-rotator', () => {
  if (location.pathname !== '/') return;

  const list = [...document.querySelectorAll('ul.user-items-list-item-container')]
    .find((ul) => ul.querySelectorAll('.list-item').length >= 2
               && ul.querySelector('.list-item-content__title'));
  if (!list) return;

  const quotes = [...list.querySelectorAll('.list-item')];
  if (quotes.length < 2) return;

  css('testimonial-rotator', `
    /* One full-width column; every quote shares the single cell. */
    ul.taro-rotator {
      grid-template-columns: 1fr !important;
      align-items: start;
    }
    ul.taro-rotator > .list-item {
      grid-area: 1 / 1 / 2 / 2 !important;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.8s ease;
    }
    ul.taro-rotator > .list-item[data-taro-active] {
      opacity: 1;
      visibility: visible;
    }

    .taro-dots {
      display: flex;
      justify-content: center;
      gap: 0.7rem;
      margin: 1.75rem auto 0;
      padding: 0;
    }
    .taro-dots__dot {
      width: 7px;
      height: 7px;
      padding: 0;
      border: 1px solid currentColor;
      border-radius: 50%;
      background: transparent;
      opacity: 0.35;
      cursor: pointer;
      transition: opacity 0.3s ease, background-color 0.3s ease;
    }
    .taro-dots__dot:hover { opacity: 0.7; }
    .taro-dots__dot[aria-current="true"] {
      opacity: 1;
      background: currentColor;
    }
    @media (prefers-reduced-motion: reduce) {
      ul.taro-rotator > .list-item, .taro-dots__dot { transition: none; }
    }
  `);

  list.classList.add('taro-rotator');
  list.setAttribute('aria-live', 'polite');

  let index = 0;
  const dots = [];

  const show = (i) => {
    index = (i + quotes.length) % quotes.length;
    quotes.forEach((q, n) => {
      if (n === index) q.setAttribute('data-taro-active', '');
      else q.removeAttribute('data-taro-active');
    });
    dots.forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
  };

  const nav = document.createElement('div');
  nav.className = 'taro-dots';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', 'Choose a testimonial');

  quotes.forEach((q, i) => {
    const name = q.querySelector('.list-item-content__title')?.innerText.trim() || `Quote ${i + 1}`;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'taro-dots__dot';
    dot.setAttribute('aria-label', `Show testimonial from ${name}`);
    dot.addEventListener('click', () => { show(i); restart(); });
    dots.push(dot);
    nav.appendChild(dot);
  });

  list.parentNode.insertBefore(nav, list.nextSibling);
  show(0);

  // Auto-advance, unless the visitor is reading or has asked for less motion.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer;
  const restart = () => {
    clearInterval(timer);
    if (!still) timer = setInterval(() => show(index + 1), INTERVAL_MS);
  };
  const stop = () => clearInterval(timer);

  const region = list.parentElement;
  region.addEventListener('mouseenter', stop);
  region.addEventListener('mouseleave', restart);
  region.addEventListener('focusin', stop);
  region.addEventListener('focusout', restart);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : restart()));

  restart();
});
