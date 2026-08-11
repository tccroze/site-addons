// DEMO ADD-ON — safe to delete once the pipeline is proven.
//
// Thin progress bar pinned to the top of the page. It exists mainly so you can
// see at a glance that the pipeline is live: push a colour change, hard-refresh
// tarocroze.com, watch it change. Delete the import line in main.js to remove.

import { defineAddon, css } from '../lib/util.js';

defineAddon('scroll-progress', () => {
  css('scroll-progress', `
    #taro-scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 2px;
      /* Full width and scaled down, rather than a width that grows. Width is a
         layout property: animating it re-lays out the page on every frame of the
         transition. A transform is handled on the compositor and touches
         neither layout nor paint. */
      width: 100%;
      transform: scaleX(0);
      transform-origin: 0 50%;
      will-change: transform;
      background: currentColor;
      opacity: 0.85;
      z-index: 10000;
      pointer-events: none;
      transition: transform 80ms linear;
    }
    @media (prefers-reduced-motion: reduce) {
      #taro-scroll-progress { transition: none; }
    }
  `);

  const bar = document.createElement('div');
  bar.id = 'taro-scroll-progress';
  document.body.appendChild(bar);

  // Measured on resize and when the page's own height changes, never per frame.
  // Reading scrollHeight forces the browser to flush layout, and doing that once
  // a frame during a scroll was costing more than everything else on the page
  // put together — including both of the masked sections.
  let scrollable = 0;
  const measure = () => {
    scrollable = document.documentElement.scrollHeight - window.innerHeight;
  };

  let queued = false;

  // rAF-throttled, and it never measures anything: reading scrollHeight forces
  // the browser to flush layout, and anything that does that inside the scroll
  // path costs a layout on every frame. This one add-on was doing exactly that
  // and was, by a wide margin, the most expensive thing on the page — more than
  // both masked sections put together.
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const p = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p)).toFixed(4)})`;
    });
  };

  // The page keeps growing as images and lazy blocks arrive, so the scrollable
  // distance does have to be re-read — just never while scrolling. Once a second,
  // off the scroll path entirely, is plenty for a progress bar.
  const remeasure = () => { measure(); onScroll(); };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('load', remeasure);
  setInterval(remeasure, 1000);
  remeasure();
});
