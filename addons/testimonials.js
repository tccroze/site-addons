// Long testimonials, collapsed.
//
// A Squarespace list carousel measures every slide to its tallest, so one
// customer who wrote three paragraphs sets the height of all thirteen — and
// the twelve who wrote a sentence each get a slide with a thousand pixels of
// empty space under it. On the paint page that was a section 1,510px tall to
// scroll past, for ten quotes that would have fitted in half of it.
//
// Nothing is cut. Anything long is clamped to eight lines with the last one
// fading out, and opens in place on a button. Someone skimming sees a tidy
// row; someone who wants to know what a customer actually said still gets
// every word of it.
//
// This began life inside paint.js and was lifted out unchanged: the same
// treatment belongs on every page that carries quotes, not just that one.
//
// The 300-character floor matters more than it looks. The description class
// here is Squarespace's generic one, shared by portfolio and class lists, so
// this file will meet plenty of copy that is not a testimonial. A short
// description is left alone entirely, which keeps the button off the cards
// where it would read as noise rather than as an offer.

import { defineAddon, css } from '../lib/util.js';

const CLAMP_LINES = 8;
const MIN_CHARS = 300;

defineAddon('testimonials', () => {
  css(`
    .taro-quote {
      display: -webkit-box;
      -webkit-line-clamp: ${CLAMP_LINES};
      -webkit-box-orient: vertical;
      overflow: hidden;
      /* The last line fades rather than stopping dead, so it reads as more
         text continuing rather than as a sentence that was cut. */
      -webkit-mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
              mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
    }
    .taro-quote.is-open {
      -webkit-line-clamp: unset; display: block; overflow: visible;
      -webkit-mask-image: none; mask-image: none;
    }
    .taro-quote__more {
      -webkit-appearance: none; appearance: none;
      background: none; border: 0; padding: 0.4rem 0; margin-top: 0.5rem;
      font: inherit; font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.16em; text-transform: uppercase;
      color: #e23318; cursor: pointer;
      border-bottom: 1px solid rgba(226, 51, 24, 0.4);
    }
    @media (hover: hover) {
      .taro-quote__more:hover { color: #243230; border-bottom-color: #243230; }
    }
    .taro-quote__more:focus-visible { outline: 2px solid #243230; outline-offset: 3px; }
    /* The root font is 16px on a phone and 18px on the desktop, so 0.7rem is
       11.2px down there — under the 12px floor this needs to stay legible. */
    @media (max-width: 799px) { .taro-quote__more { font-size: 12.5px; } }
  `);

  const clampQuotes = () => {
    const quotes = [...document.querySelectorAll('.list-item-content__description')]
      .filter((q) => !q.dataset.taroClamped);
    quotes.forEach((q) => {
      // Short ones are left alone; a "read more" on four lines is noise.
      if (q.textContent.trim().length < MIN_CHARS) { q.dataset.taroClamped = 'skip'; return; }
      q.dataset.taroClamped = '1';
      const body = document.createElement('div');
      body.className = 'taro-quote';
      while (q.firstChild) body.appendChild(q.firstChild);
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'taro-quote__more';
      more.textContent = 'Read more';
      more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', () => {
        const open = body.classList.toggle('is-open');
        more.textContent = open ? 'Read less' : 'Read more';
        more.setAttribute('aria-expanded', String(open));
        window.dispatchEvent(new Event('resize'));   // the slide has changed height
      });
      q.append(body, more);
    });
  };

  /* The carousel measures its slides once and holds that height, so a clamp
   * applied afterwards shortens the text and leaves the empty space behind.
   * A resize is the event it already listens to for exactly this. */
  const remeasure = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    }));
  };

  /* Mark the section the quotes live in, so a page can reach its own
   * testimonials without catching the portfolio carousels — they share every
   * class name Squarespace gives them. */
  const markSections = () => {
    let marked = false;
    document.querySelectorAll('.taro-quote').forEach((q) => {
      const sec = q.closest('section[data-section-id]');
      if (sec && !sec.classList.contains('taro-quotes-sec')) {
        sec.classList.add('taro-quotes-sec');
        marked = true;
      }
    });
    return marked;
  };

  const settle = () => {
    const before = document.querySelectorAll('.taro-quote').length;
    clampQuotes();
    const grew = document.querySelectorAll('.taro-quote').length !== before;
    if (markSections() || grew) remeasure();
  };

  settle();
  // Squarespace builds list sections after DOMContentLoaded, and a carousel
  // can rebuild its slides on resize.
  new MutationObserver(settle).observe(document.body, { childList: true, subtree: true });
  addEventListener('load', settle, { once: true });
});
