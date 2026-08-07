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
      width: 0%;
      background: currentColor;
      opacity: 0.85;
      z-index: 10000;
      pointer-events: none;
      transition: width 80ms linear;
    }
    @media (prefers-reduced-motion: reduce) {
      #taro-scroll-progress { transition: none; }
    }
  `);

  const bar = document.createElement('div');
  bar.id = 'taro-scroll-progress';
  document.body.appendChild(bar);

  let queued = false;
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    queued = false;
  };

  // rAF-throttled: scroll handlers on a media-heavy portfolio need to stay cheap.
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
});
