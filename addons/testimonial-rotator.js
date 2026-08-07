// Turns the three stacked testimonials into one crossfading quote.
//
// The list is a Squarespace "simple list" section: ul.user-items-list-item-container
// holding li.list-item, laid out with CSS grid. Rather than absolutely positioning
// the quotes (which would collapse the container's height), all three are placed in
// the same grid cell — so the row still sizes itself to the tallest quote and the
// section never changes height as it rotates.

import { defineAddon, css } from '../lib/util.js';

const INTERVAL_MS = 6500;
const FADE_MS = 450;      // one leg of the sequence; a full swap takes twice this

defineAddon('testimonial-rotator', () => {
  if (location.pathname !== '/') return;

  const list = [...document.querySelectorAll('ul.user-items-list-item-container')]
    .find((ul) => ul.querySelectorAll('.list-item').length >= 2
               && ul.querySelector('.list-item-content__title'));
  if (!list) return;

  const quotes = [...list.querySelectorAll('.list-item')];
  if (quotes.length < 2) return;

  css('testimonial-rotator', `
    /* One full-width column; every quote shares the single cell.
       align-items must be forced: Squarespace centres the items, and since the
       quotes are different heights that made each one sit at a different offset
       — a visible jump of ~40px between slides on a phone. */
    ul.taro-rotator {
      grid-template-columns: 1fr !important;
      align-items: start !important;
    }
    ul.taro-rotator > .list-item {
      grid-area: 1 / 1 / 2 / 2 !important;
      align-self: start !important;
      opacity: 0;
      pointer-events: none;
      transition: opacity ${FADE_MS}ms ease;
    }
    /* Sequenced, not crossfaded: the incoming quote waits for the outgoing one
       to finish leaving. A true crossfade renders both at once, and stacked in
       a single cell that reads as overlapping text rather than a dissolve.
       (visibility is not used to hide them — it inherits, so any child setting
       visibility:visible would paint anyway.) */
    ul.taro-rotator > .list-item[data-taro-active] {
      opacity: 1;
      pointer-events: auto;
      transition: opacity ${FADE_MS}ms ease ${FADE_MS}ms;
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
      // The inactive quotes are only transparent, not removed from the tree, so
      // they have to be hidden from screen readers explicitly.
      q.setAttribute('aria-hidden', String(n !== index));
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

  // Swipe, because dots alone are a poor way to change a quote on a phone.
  // Only a decisive, mostly-horizontal drag counts, so this never steals a
  // vertical scroll.
  let sx = 0, sy = 0, tracking = false;
  list.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  list.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    show(index + (dx < 0 ? 1 : -1));
    restart();
  }, { passive: true });

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
