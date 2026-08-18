// Turns the three stacked testimonials into one rotating quote.
//
// The list is a Squarespace "simple list" section: ul.user-items-list-item-container
// holding li.list-item, laid out with CSS grid. Rather than absolutely positioning
// the quotes (which would collapse the container's height), all three are placed in
// the same grid cell — so the row still sizes to the tallest quote and the section
// never changes height as it rotates.
//
// Opacity is driven from JavaScript rather than by CSS attribute selectors. Two
// earlier attempts got this wrong in ways that were hard to see: first a true
// crossfade that painted both quotes at once (overlapping text), then a rule
// whose specificity and transition-delay left the incoming quote stuck at zero.
// Setting the value directly leaves nothing to reason about.

import { defineAddon, css } from '../lib/util.js';

const INTERVAL_MS = 4000;
const FADE_MS = 400;      // one leg; a full swap is out-then-in, so twice this

defineAddon('testimonial-rotator', () => {
  const list = [...document.querySelectorAll('ul.user-items-list-item-container')]
    .find((ul) => ul.querySelectorAll('.list-item').length >= 2
               && ul.querySelector('.list-item-content__title'));
  if (!list) return;

  const quotes = [...list.querySelectorAll('.list-item')];
  if (quotes.length < 2) return;

  css('testimonial-rotator', `
    /* One full-width column; every quote shares the single cell.
       align-items must be forced: Squarespace's own centring dated from when
       the quotes sat in separate cells, where their differing heights put
       each at a different offset. Sharing one cell they have a common centre,
       so 'center' is safe here — and it stops a short quote leaving a dead
       band above the dots, since the cell still sizes to the tallest quote. */
    ul.taro-rotator {
      grid-template-columns: 1fr !important;
      align-items: center !important;
    }
    ul.taro-rotator > .list-item {
      grid-area: 1 / 1 / 2 / 2 !important;
      align-self: center !important;
      transition: opacity ${FADE_MS}ms ease;
    }
    .taro-dots {
      display: flex;
      justify-content: center;
      gap: 0; /* the buttons are 44px wide already; they may touch, never overlap */
      margin: 0.75rem auto -0.5rem; /* the centred cell now supplies the space above */
      padding: 0;
    }
    /* Each button is a 44px square — the minimum comfortable touch target —
       but only a 7px dot is painted. box-sizing plus the padding leaves a
       7px content box, and the ::after draws the dot inside it: a border on
       the button itself would trace the 44px edge, not the dot. */
    .taro-dots__dot {
      box-sizing: border-box;
      width: 44px; height: 44px;
      padding: 18.5px;
      border: 0;
      background: transparent;
      opacity: 0.35;
      cursor: pointer;
      transition: opacity 0.3s ease;
    }
    .taro-dots__dot::after {
      content: '';
      display: block;
      box-sizing: border-box;
      width: 7px; height: 7px;
      border: 1px solid currentColor;
      border-radius: 50%;
      background: transparent;
      transition: background-color 0.3s ease;
    }
    .taro-dots__dot:hover { opacity: 0.7; }
    .taro-dots__dot[aria-current="true"] { opacity: 1; }
    .taro-dots__dot[aria-current="true"]::after { background: currentColor; }
    @media (prefers-reduced-motion: reduce) {
      ul.taro-rotator > .list-item, .taro-dots__dot, .taro-dots__dot::after { transition: none; }
    }
  `);

  list.classList.add('taro-rotator');
  list.setAttribute('aria-live', 'polite');

  let index = 0;
  let swapTimer;
  const dots = [];

  // Inline opacity, so the resting state is always exactly what we set.
  const paint = () => {
    quotes.forEach((q, n) => {
      q.style.opacity = n === index ? '1' : '0';
      q.style.pointerEvents = n === index ? 'auto' : 'none';
      q.setAttribute('aria-hidden', String(n !== index));
    });
    dots.forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
  };

  const goTo = (next) => {
    const target = (next + quotes.length) % quotes.length;
    if (target === index) return;
    clearTimeout(swapTimer);
    // Out, then in — never both on screen at once, which is what made the
    // quotes appear to overlap on a phone.
    quotes[index].style.opacity = '0';
    quotes[index].setAttribute('aria-hidden', 'true');
    swapTimer = setTimeout(() => { index = target; paint(); }, FADE_MS);
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
    dot.addEventListener('click', () => { goTo(i); restart(); });
    dots.push(dot);
    nav.appendChild(dot);
  });

  list.parentNode.insertBefore(nav, list.nextSibling);
  paint();

  // Swipe, because dots alone are awkward on a phone. Only a decisive,
  // mostly-horizontal drag counts, so this never steals a vertical scroll.
  let sx = 0, sy = 0, tracking = false;
  list.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
  }, { passive: true });
  list.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    goTo(index + (dx < 0 ? 1 : -1));
    restart();
  }, { passive: true });

  // Auto-advance. A hidden tab stops it — an earlier version also paused
  // on hover over the whole section, which on a desktop meant it frequently
  // never advanced at all and looked broken. The timer is also gated on the
  // section actually being in the viewport: left on wall clock it kept
  // rotating while the visitor read the rest of the page, so scrolling back
  // routinely landed mid-fade on a half-opacity quote.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cycle;
  let onScreen = true; // stays true where IntersectionObserver is missing — the old behaviour
  function restart() {
    clearInterval(cycle);
    if (!still && onScreen) cycle = setInterval(() => goTo(index + 1), INTERVAL_MS);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(cycle);
    else restart();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      if (!onScreen) { clearInterval(cycle); return; }
      // Coming back into view: if a swap was caught mid-fade, cancel it and
      // repaint so the visitor arrives to a fully opaque quote, then resume.
      clearTimeout(swapTimer);
      paint();
      restart();
    }, { threshold: 0.2 }).observe(list);
  }

  restart();
});
