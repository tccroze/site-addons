// Parallax drift on homepage images.
//
// Amplitude and scale are computed per image from its own height, rather than
// being fixed constants. A single global scale cannot be right for images of
// different heights: too small and the translation exposes a bare edge inside
// the frame, too large and short images get visibly over-zoomed. Deriving the
// scale from the travel distance guarantees coverage either way.
//
// This add-on owns the transform on these <img> elements. scroll-reveal
// deliberately animates only clip-path on the surrounding frame so the two
// never write the same property.

import { defineAddon, css } from '../lib/util.js';

const TRAVEL_RATIO = 0.09;   // of image height
const MIN_TRAVEL = 20;
const MAX_TRAVEL = 58;

defineAddon('parallax', () => {
  if (location.pathname !== '/') return;

  // Wrong where it would feel laggy or unwanted.
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const imgs = [...document.querySelectorAll('[data-animation-role="image"] img')]
    .filter((img) => {
      const box = img.closest('.fluid-image-container, .sqs-image-content') || img.parentElement;
      return box && getComputedStyle(box).overflow !== 'visible';
    });
  if (!imgs.length) return;

  css('parallax', `.taro-parallax { will-change: transform; }`);
  imgs.forEach((img) => img.classList.add('taro-parallax'));

  // travel = how far it drifts each way; scale = just enough to hide that drift
  const geom = new Map();
  const measure = () => {
    imgs.forEach((img) => {
      const h = img.getBoundingClientRect().height || 1;
      const travel = Math.min(MAX_TRAVEL, Math.max(MIN_TRAVEL, h * TRAVEL_RATIO));
      geom.set(img, { travel, scale: 1 + (2 * travel) / h + 0.02 });
    });
  };

  const onScreen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
    request();
  }, { rootMargin: '20% 0px' });
  imgs.forEach((img) => io.observe(img));

  let queued = false;
  const update = () => {
    queued = false;
    const mid = window.innerHeight / 2;
    onScreen.forEach((img) => {
      const g = geom.get(img);
      if (!g) return;
      const r = img.getBoundingClientRect();
      // -1 while the image is still below the fold, +1 once it is above it.
      const progress = Math.max(-1, Math.min(1, (mid - (r.top + r.height / 2)) / mid));
      img.style.transform =
        `scale(${g.scale.toFixed(3)}) translate3d(0, ${(progress * g.travel).toFixed(2)}px, 0)`;
    });
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  measure();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { measure(); request(); }, { passive: true });
  update();
});
