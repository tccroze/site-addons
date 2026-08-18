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

  // Reduced motion is kept as the live MediaQueryList rather than read once
  // into a boolean at boot — the user can flip the OS setting mid-session, and
  // a stale capture would keep the images drifting regardless. update()
  // consults .matches at decision time.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The footer is excluded outright. Parallax scales an image up so its drift
  // never exposes a bare edge, but the footer signature sits in a tightly
  // fitted, overflow:hidden box — so scaling it by 1.24 simply cropped 42px off
  // each side and made a perfectly good asset look badly cropped. It has its
  // own animation in signature.js.
  const footer = document.querySelector('footer');

  const imgs = [...document.querySelectorAll('[data-animation-role="image"] img')]
    .filter((img) => !footer || !footer.contains(img))
    .filter((img) => {
      const box = img.closest('.fluid-image-container, .sqs-image-content') || img.parentElement;
      return box && getComputedStyle(box).overflow !== 'visible';
    });
  if (!imgs.length) return;

  // The class only carries the will-change hint. It used to be stamped on
  // every image up front, but will-change pins a compositor layer for as long
  // as it is set, and at any moment most of these images are nowhere near the
  // viewport. The observer below already knows which ones are close, so it
  // grants the hint on entry and withdraws it on exit.
  css('parallax', `.taro-parallax { will-change: transform; }`);

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
    entries.forEach((e) => {
      if (e.isIntersecting) {
        onScreen.add(e.target);
        e.target.classList.add('taro-parallax');
      } else {
        onScreen.delete(e.target);
        e.target.classList.remove('taro-parallax');
      }
    });
    request();
  }, { rootMargin: '20% 0px' });
  imgs.forEach((img) => io.observe(img));

  let queued = false;
  const update = () => {
    queued = false;
    if (reduceMotion.matches) {
      // Clear rather than freeze, so nothing is left scaled or shifted once
      // motion is switched off.
      onScreen.forEach((img) => { img.style.transform = ''; });
      return;
    }
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
  // A flip of the setting should take effect immediately, not on the next
  // scroll. Older Safari lacks addEventListener on MediaQueryList; for it the
  // next scroll frame picks the change up anyway.
  reduceMotion.addEventListener?.('change', request);
  update();
});
