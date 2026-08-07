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

const SOFT_EDGE = 9;            // % of width over which the ink fades in
const START_FROM_BOTTOM = 340;  // px from the page bottom where signing begins
const FINISH_FROM_BOTTOM = 70;  // px from the page bottom where it is complete

defineAddon('signature', () => {
  const footer = document.querySelector('footer');
  if (!footer) return;

  // The only <img> in the footer is the signature; the social icon is an SVG.
  const sig = footer.querySelector('img');
  if (!sig) return;

  // If masks are not supported, do nothing at all rather than risk applying a
  // half-understood property to the signature and hiding it.
  if (!(CSS.supports('mask-image', 'linear-gradient(#000, #000)')
     || CSS.supports('-webkit-mask-image', 'linear-gradient(#000, #000)'))) return;

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
    // Unmeasurable (not laid out or not yet loaded) means show it in full.
    // A mask we cannot compute a position for must never leave it invisible.
    if (!r.height) {
      sig.style.setProperty('--taro-sig-mask', 'none');
      return;
    }
    // Measured as distance from the bottom of the page, not from the element.
    // The signature sits in the footer, so it can only ever rise a little above
    // the viewport edge — tying completion to its own travel meant the last
    // stroke landed within ~37px of the absolute bottom, and anyone stopping
    // short of that saw a half-written name and read it as a cropped image.
    // This finishes it a clear 70px before the end of the page.
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const remaining = maxScroll - window.scrollY;
    const span = START_FROM_BOTTOM - FINISH_FROM_BOTTOM;
    const progress = Math.max(0, Math.min(1, (START_FROM_BOTTOM - remaining) / span));
    draw(progress);
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  window.addEventListener('load', request);
  // The image often has no box yet on first run; re-measure once it decodes so
  // the mask starts from a real position rather than a guess.
  if (!sig.complete) sig.addEventListener('load', request, { once: true });
  update();
});
