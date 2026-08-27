// The lightbox is where a photograph does its selling, so it should say what it
// is and offer a way to ask about it.
//
// Squarespace's gallery lightbox ships with Close, Previous Slide and Next
// Slide, and nothing else: no frame reference, no position in the set, and —
// tested against the live page — no keyboard. ArrowRight on an open lightbox
// moved nothing. Someone looking through thirty-two frames has to travel back
// to a small on-screen arrow for every one of them.
//
// What this adds:
//
//   ARROW KEYS and Escape, by clicking the buttons Squarespace already has
//   rather than by reaching into its slide state. If Squarespace ever adds its
//   own key handling this stops being needed and does no harm in the meantime;
//   if it renames a button, the keys stop working and nothing else breaks.
//
//   A FRAME REFERENCE in the same language the tiles use on hover — the stock
//   name and frame number that edge-print.js prints in the rebate — plus the
//   position in the set, so ten thousand pixels of gallery has a sense of
//   place.
//
//   AN ENQUIRY LINK carrying that reference to /letstalk, where letstalk.js
//   reads it out of the query string and writes it into the form. That is the
//   shortest path this site has between someone liking a photograph and
//   someone sending an email about it, and until now it did not exist.
//
// The bar is aria-hidden and its link is not: a screen reader gets the link and
// its full label, and is spared a decorative frame code it has no use for.

import { defineAddon, css } from '../lib/util.js';

const STOCK = 'TARO CROZE 400TX';   // matches edge-print.js
const FRAME_BASE = 10;              // first numbered frame on a fresh roll

// Path -> the name that travels to the form. Anything not listed falls back to
// the path itself, so a gallery added later still carries a usable reference.
const NAMES = {
  '/35film': 'Film',
  '/wildlife': 'Wildlife',
  '/portraits': 'People',
  '/vroom': 'Automotive',
  '/panoramas': 'Panoramas',
};

const isOpen = () =>
  document.documentElement.classList.contains('gallery-lightbox-body-hide-overflow');

defineAddon('lightbox-frame', () => {
  if (!document.querySelector('.gallery-masonry-lightbox-link')) return;

  const gallery = NAMES[location.pathname.replace(/\/$/, '')]
    || location.pathname.replace(/[^a-z0-9]+/gi, ' ').trim() || 'Gallery';

  css('lightbox-frame', `
    .taro-lf {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      z-index: 10000;            /* the lightbox itself sits at 9999 */
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
      padding: 0.85rem clamp(1rem, 4vw, 2.5rem);
      background: linear-gradient(to top, rgba(18, 16, 12, 0.82), rgba(18, 16, 12, 0));
      pointer-events: none;      /* only the link takes the pointer */
      opacity: 0;
      transition: opacity 240ms ease;
    }
    .taro-lf.is-on { opacity: 1; }
    .taro-lf__ref {
      font-family: 'Arial Narrow', 'Roboto Condensed', 'Liberation Sans Narrow',
                   'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-stretch: condensed;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: #f7941d;                       /* the edge-print amber */
      text-shadow: 0 0 2px rgba(247, 148, 29, 0.45);
      white-space: nowrap;
    }
    .taro-lf__ask {
      pointer-events: auto;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      text-decoration: none;
      color: #f6eed5;
      border-bottom: 1px solid rgba(246, 238, 213, 0.5);
      padding: 0.45rem 0.1rem;
      transition: color 180ms ease, border-color 180ms ease;
    }
    @media (hover: hover) {
      .taro-lf__ask:hover { color: #e23318; border-bottom-color: #e23318; }
    }
    .taro-lf__ask:focus-visible { outline: 2px solid #e23318; outline-offset: 3px; }
    @media (max-width: 640px) {
      .taro-lf { justify-content: center; text-align: center; }
    }
    @media (prefers-reduced-motion: reduce) { .taro-lf { transition: none; } }
  `);

  const bar = document.createElement('div');
  bar.className = 'taro-lf';
  bar.innerHTML = `<span class="taro-lf__ref" aria-hidden="true"></span>` +
                  `<a class="taro-lf__ask" href="/letstalk"></a>`;
  const refEl = bar.querySelector('.taro-lf__ref');
  const askEl = bar.querySelector('.taro-lf__ask');
  document.body.appendChild(bar);

  const lb = () => document.querySelector('.gallery-lightbox');

  /** Which slide is on screen. Read from what is painted rather than from a
   *  state class, because the class names here are Squarespace's to change. */
  const current = () => {
    const box = lb();
    if (!box) return { i: -1, total: 0 };
    const items = [...box.querySelectorAll('.gallery-lightbox-item')];
    const i = items.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 50 && getComputedStyle(el).opacity !== '0';
    });
    return { i, total: items.length };
  };

  const refresh = () => {
    if (!isOpen()) { bar.classList.remove('is-on'); return; }
    const { i, total } = current();
    if (i < 0) return;
    const frame = `${FRAME_BASE + i}A`;
    refEl.textContent = `${STOCK} — FRAME ${frame}  ·  ${i + 1}/${total}`;
    askEl.textContent = 'Enquire about this frame';
    askEl.setAttribute('aria-label', `Enquire about ${gallery} frame ${frame}`);
    askEl.href = `/letstalk?ref=${encodeURIComponent(`${gallery} — frame ${frame}`)}`;
    bar.classList.add('is-on');
  };

  // The lightbox mutates in place rather than being added and removed, so the
  // observer watches the document for both its opening and its slide changes.
  const mo = new MutationObserver(() => requestAnimationFrame(refresh));
  mo.observe(document.documentElement, {
    attributes: true, attributeFilter: ['class', 'style'], subtree: true,
  });

  const nav = (dir) => {
    const box = lb();
    if (!box) return;
    const label = dir < 0 ? 'Previous Slide' : 'Next Slide';
    const btn = [...box.querySelectorAll('button')]
      .find((b) => (b.getAttribute('aria-label') || '') === label);
    btn?.click();
  };

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); nav(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nav(1); }
    else if (e.key === 'Escape') {
      lb()?.querySelector('.gallery-lightbox-close-btn')?.click();
    }
  });
});
