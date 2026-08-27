// Mobile usability pass: hit areas, small type, and the bytes a phone is asked
// to download before anyone has tapped anything.
//
// Everything here was measured on a 390x844 viewport against the live site
// rather than assumed, and every number in the comments is from that pass.
//
// WHAT THIS DOES NOT DO. /motion streams ~240MB of HLS on load — eight players,
// only two of them on screen, 349 seconds of 1080p buffered between them before
// a single tap. That is Squarespace's own video block: the players expose no
// engine handle to throttle, and starving the blocks of their config was tested
// and does not stop it. It needs a change to how that page is built, not a
// patch from out here, so it is reported rather than papered over. The one
// video this file does touch is the decorative reel, which is ours.
//
// Nothing here changes how anything looks. Hit areas grow through pseudo-
// elements so no layout moves, and the type floor only lifts the handful of
// labels that were under 12px.

import { defineAddon, css } from '../lib/util.js';

// Apple and Google both put the comfortable minimum at 44px; below that,
// misses climb steeply for thumbs.
const TAP = 44;

defineAddon('mobile-polish', () => {
  const phone = window.matchMedia('(max-width: 799px)');

  css('mobile-polish', `
  @media (max-width: 799px) {
    /* ---- hit areas ------------------------------------------------------
       Measured, all well under 44px: the cart at 25x25, the Instagram mark at
       24x24, the wordmark at 41x36, the burger at 47x37, and our own "Read the
       whole story" at 187x28. They grow through an overlay rather than through
       padding, so the header's own layout is untouched — the target gets
       bigger, nothing moves. */
    .header-title-logo a,
    .header-actions .cart-style-icon,
    .header-burger-btn,
    .sqs-svg-icon--wrapper,
    .taro-cl-all,
    .plyr__control {
      position: relative;
    }
    .header-title-logo a::after,
    .header-actions .cart-style-icon::after,
    .header-burger-btn::after,
    .sqs-svg-icon--wrapper::after,
    .taro-cl-all::after,
    .plyr__control::after {
      content: '';
      position: absolute;
      left: 50%; top: 50%;
      width: ${TAP}px; height: ${TAP}px;
      transform: translate(-50%, -50%);
      /* Sits over the control it belongs to, so the tap still lands on it. */
      z-index: 1;
    }
    /* The seek bar was 14px tall — a scrub target thinner than a fingernail.
       The rail keeps its drawn height; only the input's own box grows. */
    .plyr__progress input[type="range"],
    .plyr__volume input[type="range"] {
      height: 28px;
    }

    /* ---- type floor -----------------------------------------------------
       Measured under 14px and, in three cases, under 12: the timeline dateline
       at 10.88px, a testimonial attribution at 11.2px, and two labels in the
       classes block at 12.48px. Letterspaced uppercase at 11px on a phone is
       decoration, not text. */
    .taro-cl-dateline,
    .taro-cl-all { font-size: 12px; }
    .tc-about .tc-btn,
    .tc-classes .tc-btn { font-size: 13px; }
    .tc-classes .tc-vh { font-size: 13px; }
    .tc-classes .tc-card__fee-note { font-size: 13.5px; }
  }
  `);

  if (!phone.matches) return;

  /* ---- the bytes ------------------------------------------------------
   * Squarespace ships its section backgrounds with
   *     sizes="(max-width: 799px) 200vw, 100vw"
   * — it asks for two screens' width on a phone, to leave room for the crop
   * that object-fit does. The browser obeys: on the homepage it picked
   * deadvlei.jpg at format=2500w (1,230KB) and dune.jpg at the same (549KB),
   * 1.8MB of background photography for a 390px screen.
   *
   * One screen's width is what a cover background actually needs, and at a
   * phone's device pixel ratio that is still 1,170 real pixels for a 390px
   * frame — it selects the 1500w variant, not a soft one. These images are
   * lazy (data-src), so rewriting `sizes` before the loader swaps src in means
   * the browser makes a better choice the first time rather than fetching
   * twice.
   */
  document.querySelectorAll('.section-background img[sizes]').forEach((img) => {
    if (!/200vw/.test(img.getAttribute('sizes') || '')) return;
    img.setAttribute('sizes', '100vw');
  });

  /* ---- the decorative reel --------------------------------------------
   * The PROJECTS tile plays a 16.5MB .MOV, and it autoplays at load whether or
   * not the visitor ever scrolls to it. It is ours, so it can wait: preload
   * nothing, and start only once the tile is actually near the screen. A
   * visitor who reads the homepage and leaves pays nothing for it.
   */
  const reels = [...document.querySelectorAll('video')]
    .filter((v) => /IMG_1748/i.test(v.currentSrc || v.src || '')
                || v.closest('.taro-reel, .taro-tile'));
  reels.forEach((v) => {
    v.autoplay = false;
    v.preload = 'none';
    try { v.pause(); } catch (e) { /* not ready yet; the observer will start it */ }
  });
  if (reels.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const v = e.target;
        v.preload = 'auto';
        v.muted = true;                 // or a phone will refuse to start it
        v.play?.().catch(() => {});
        io.unobserve(v);
      });
    }, { rootMargin: '200px' });
    reels.forEach((v) => io.observe(v));
  }
});
