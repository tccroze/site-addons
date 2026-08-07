// The footer signature writes itself on as you scroll to the bottom.
//
// It is a raster PNG, not an SVG path, so there is no stroke to animate with
// dasharray. Instead a mask sweeps left to right — which is how the hand moves
// anyway, so it reads as the name being written rather than a panel sliding
// off. The leading edge is a soft gradient rather than a hard line, so ink
// appears to flow rather than being uncovered.
//
// Tied to scroll position rather than played once, so it signs as you arrive
// and un-signs if you scroll back up.
//
// Note: the source file is already cropped tight to the strokes, so the
// flourishes are clipped in the asset itself. Nothing here can recover that —
// it needs re-exporting with padding.

import { defineAddon, css } from '../lib/util.js';

const SOFT_EDGE = 9;    // % of width over which the ink fades in

defineAddon('signature', () => {
  const footer = document.querySelector('footer');
  if (!footer) return;

  // The only <img> in the footer is the signature; the social icon is an SVG.
  const sig = footer.querySelector('img');
  if (!sig) return;

  css('signature', `
    .taro-sig {
      -webkit-mask-image: var(--taro-sig-mask);
              mask-image: var(--taro-sig-mask);
      -webkit-mask-repeat: no-repeat;
              mask-repeat: no-repeat;
      -webkit-mask-size: 100% 100%;
              mask-size: 100% 100%;
    }
    @media (prefers-reduced-motion: reduce) {
      .taro-sig { -webkit-mask-image: none; mask-image: none; }
    }
  `);

  sig.classList.add('taro-sig');

  // scroll-reveal clips images on the homepage via clip-path. Left alone it
  // would fight this mask, so the signature is marked already-revealed.
  const revealHost = sig.closest('[data-taro-reveal]');
  if (revealHost) revealHost.setAttribute('data-taro-reveal', 'in');

  const draw = (progress) => {
    const p = -SOFT_EDGE + progress * (100 + SOFT_EDGE);
    sig.style.setProperty(
      '--taro-sig-mask',
      `linear-gradient(to right, #000 ${p.toFixed(1)}%, transparent ${(p + SOFT_EDGE).toFixed(1)}%)`
    );
  };

  let queued = false;
  const update = () => {
    queued = false;
    const r = sig.getBoundingClientRect();
    if (!r.height) return;
    // Normalised against the signature's own height, not a fraction of the
    // viewport. It lives in the footer, so at maximum scroll it only ever rises
    // a little above the bottom edge — any viewport-relative target is simply
    // unreachable and the name would stop half-written. Measuring its own
    // travel means it finishes exactly as it comes fully into view, whatever
    // the screen size. The 0.85 lands the last stroke a fraction early.
    const travel = window.innerHeight - r.top;
    const progress = Math.max(0, Math.min(1, travel / (r.height * 0.85)));
    draw(progress);
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  draw(0);
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  window.addEventListener('load', request);
  update();
});
