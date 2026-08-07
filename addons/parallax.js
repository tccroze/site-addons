// Gentle parallax on homepage images.
//
// Amplitude is deliberately small. Parallax is the effect most likely to feel
// dated when overdone, and on a photography site the picture should move a
// little, not perform.
//
// The image is scaled slightly so that translating it never exposes a bare edge
// inside its container, and only images currently on screen are updated.

import { defineAddon, css } from '../lib/util.js';

const AMPLITUDE_PX = 26;
const SCALE = 1.09;          // must cover 2 × AMPLITUDE across the tallest image

defineAddon('parallax', () => {
  if (location.pathname !== '/') return;

  // No parallax where it would be wrong: touch scrolling makes it feel laggy,
  // and reduced-motion users have asked not to have it.
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const imgs = [...document.querySelectorAll('[data-animation-role="image"] img')]
    .filter((img) => {
      const box = img.closest('.fluid-image-container, .sqs-image-content') || img.parentElement;
      return box && getComputedStyle(box).overflow !== 'visible';
    });
  if (!imgs.length) return;

  css('parallax', `
    .taro-parallax {
      transform: scale(${SCALE}) translate3d(0, 0, 0);
      will-change: transform;
    }
  `);

  imgs.forEach((img) => img.classList.add('taro-parallax'));

  // Only images on screen get updated; the rest cost nothing.
  const onScreen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
    if (onScreen.size) request();
  }, { rootMargin: '15% 0px' });
  imgs.forEach((img) => io.observe(img));

  let queued = false;
  const update = () => {
    queued = false;
    const mid = window.innerHeight / 2;
    onScreen.forEach((img) => {
      const r = img.getBoundingClientRect();
      // -1 when the image sits below the fold, +1 when it has scrolled above it.
      const progress = Math.max(-1, Math.min(1, (mid - (r.top + r.height / 2)) / mid));
      img.style.transform = `scale(${SCALE}) translate3d(0, ${(progress * AMPLITUDE_PX).toFixed(2)}px, 0)`;
    });
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  update();
});
