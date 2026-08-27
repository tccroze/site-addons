// Keep the top of a page's copy out from under the fixed header.
//
// The site runs Squarespace's fixed header (`tweak-fixed-header`), which takes
// the top 88px of every mobile viewport and 164px of a desktop one. Squarespace
// reserves room for it on its own sections. It does not reserve room inside a
// Code Block, and the two pages built that way — /about and /learn — open with
// their own root element at the very top of the page. Measured on an iPhone
// viewport:
//
//     /about   h1 "meet taro."      top 40  →  48px of it behind the nav
//     /learn   p  "Teaching"        top 40  →  26px behind
//              h2 "Camera Classes"  top 80  →   8px behind
//
// Desktop was clean, because the same clamp() that yields 40px of padding at
// 390px wide yields 88px at 1440px and the section padding above it does the
// rest. So this is not a constant to add — it is a shortfall to measure.
//
// WHY THIS IS MEASURED AND NOT WRITTEN DOWN. Hard-coding 88px would be wrong on
// desktop, wrong the day the header gains or loses a row, and wrong on the
// homepage, whose torn print is *supposed* to run up under the header. What is
// actually true is narrower: the first line of copy should clear the header by
// a small margin. So the shortfall between where that line sits and where it
// would need to sit is what gets added, which is zero everywhere it is already
// fine — including every Squarespace-native page, which is why this only ever
// touches the two Code Block pages in practice.
//
// The header hides on scroll-down and returns on scroll-up
// (`tweak-fixed-header-style-scroll-back`), so it is at full height exactly
// where this matters: the top of the page. Positions are read in document
// space (rect.top + scrollY) so a page restored mid-scroll measures the same as
// one opened fresh.
//
// Also publishes --taro-hdr, the live header height, for anything else that
// needs to reason about it.

import { defineAddon, css } from '../lib/util.js';

// How much daylight to leave between the header and the first line of copy.
const GAP = 20;

defineAddon('header-clearance', () => {
  const header = document.querySelector('#header');
  if (!header) return;

  // The roots that open a page with their own box rather than a Squarespace
  // section. Listed rather than inferred: "the first element on the page" is
  // true of the homepage's intro too, and that one is meant to be under there.
  const HOSTS = '.tc-about, .tc-classes';

  css('header-clearance', `
    /* Published for anything that needs the live header height. */
    :root { --taro-hdr: 0px; }
  `);

  const seen = new WeakMap();   // host -> its own padding-top, before we touched it

  const clear = () => {
    const h = Math.round(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--taro-hdr', `${h}px`);

    document.querySelectorAll(HOSTS).forEach((host) => {
      if (!seen.has(host)) {
        seen.set(host, parseFloat(getComputedStyle(host).paddingTop) || 0);
      }
      const base = seen.get(host);
      // Back to the element's own padding before measuring, so a resize reads
      // the stylesheet's intent and not the last correction.
      host.style.removeProperty('padding-top');

      // The first thing in it that actually paints text.
      const line = [...host.querySelectorAll('h1, h2, h3, p, span, div')]
        .find((el) => {
          if (!el.textContent.trim()) return false;
          const r = el.getBoundingClientRect();
          return r.height > 0 && r.width > 0;
        });
      if (!line) return;

      const top = line.getBoundingClientRect().top + window.scrollY;
      const short = (h + GAP) - top;
      if (short > 1) host.style.setProperty('padding-top', `${Math.round(base + short)}px`);
    });
  };

  clear();
  // Webfonts and Squarespace's own late layout both move that first line.
  window.addEventListener('load', clear, { once: true });
  let t = 0;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(clear, 160); });
});
