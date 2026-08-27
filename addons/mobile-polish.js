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
    /* Width comes from JS (--taro-tap), because a flat 44px overlay on
       controls that sit close together makes them overlap, and the later one
       in the DOM then swallows taps meant for its neighbour — measured on the
       header, where the burger's overlay reached across the cart. Height is
       safe to take in full: the header is 88px tall. */
    .header-title-logo a::after,
    .header-actions .cart-style-icon::after,
    .header-burger-btn::after,
    .sqs-svg-icon--wrapper::after,
    .taro-cl-all::after,
    .plyr__control::after {
      content: '';
      position: absolute;
      left: 50%; top: 50%;
      width: var(--taro-tap, ${TAP}px);
      height: ${TAP}px;
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
    /* Doubled class throughout. The blocks declare these at the same
       specificity as the obvious selector would, and their <style> sits in the
       body — later in the document than ours in <head> — so an equal-specificity
       rule loses the tie — and a doubled class only TIES the ones written as
       three-class paths (.tc-classes .tc-card .tc-btn), which is why the first
       attempt at this still measured 12.48px. Each selector below is matched
       to the rule it has to beat, one step above it.
       .tc-vh is deliberately absent: it is the screen-reader-only half of the
       Enquire labels, so its size is nobody's business but the reader's. */
    .tc-about.tc-about .tc-btn { font-size: 13px; }
    .tc-classes.tc-classes .tc-card .tc-btn,
    .tc-classes.tc-classes .tc-card--dark .tc-btn { font-size: 13px; }
    .tc-classes.tc-classes .tc-card .tc-card__fee-note { font-size: 13.5px; }
    .tc-classes.tc-classes .tc-quotes .tc-quote figcaption,
    .tc-classes.tc-classes .tc-gallery figcaption { font-size: 13px; }
  }
  `);

  if (!phone.matches) return;

  /* ---- the bytes -------------------------------------------------------
   * NOT the section backgrounds, though that is where the weight is: the
   * homepage pulls deadvlei.jpg at format=2500w (1,230KB) and dune.jpg at
   * 2500w (549KB) for a 390px screen. Squarespace advertises those images with
   *     sizes="(max-width: 799px) 200vw, 100vw"
   * so the obvious fix is to rewrite that to one screen's width. It was tried
   * and measured: `sizes` became 100vw and the very same 2500w files were
   * fetched, because these are data-src images and Squarespace's own loader
   * writes src directly from its own idea of the required width. srcset is
   * never consulted, so nothing served through it can help. Overriding that
   * loader from out here would be a race against their code on every page,
   * which is not a trade worth making for a background photograph — it is
   * reported instead.
   */
  /* ---- the decorative reel --------------------------------------------
   * The PROJECTS tile plays a 16.5MB .MOV, and it autoplays at load whether or
   * not the visitor ever scrolls to it. It is ours, so it can wait: preload
   * nothing, and start only once the tile is actually near the screen. A
   * visitor who reads the homepage and leaves pays nothing for it.
   */
  /* Size each overlay so it never crosses into a neighbouring control. */
  const CONTROLS = '.header-title-logo a, .header-actions .cart-style-icon, ' +
                   '.header-burger-btn, .sqs-svg-icon--wrapper, .taro-cl-all, .plyr__control';
  const sizeTaps = () => {
    const els = [...document.querySelectorAll(CONTROLS)]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0);
    els.forEach(({ el, r }) => {
      let widest = TAP;
      els.forEach(({ r: q }) => {
        if (q === r) return;
        if (q.bottom <= r.top || q.top >= r.bottom) return;      // not on this row
        const gap = q.left >= r.right ? q.left - r.right
                  : r.left >= q.right ? r.left - q.right : 0;
        if (gap > 0) widest = Math.min(widest, r.width + gap * 1.6);
      });
      el.style.setProperty('--taro-tap', `${Math.round(Math.max(r.width, widest))}px`);
    });
  };
  sizeTaps();
  window.addEventListener('load', sizeTaps, { once: true });

  /* And a layer that does not depend on CSS hit-testing at all.
   *
   * The overlay above works — the wordmark went from 41x36 to a full 44 by it —
   * but it is not reliable for every control: probing the live header, taps
   * 19px below the cart resolved to an ancestor rather than to the cart's own
   * ::after. Whatever the cause, a tap that misses by four pixels is a tap the
   * visitor believes they made, so near-misses are forwarded to what they were
   * plainly aimed at.
   *
   * Deliberately narrow: only inside these containers, only when the tap landed
   * on nothing interactive at all, and only within RADIUS of a small control's
   * centre. A tap that hits something real is never touched, so this can not
   * hijack a link.
   */
  const RADIUS = 24;
  const forward = (container, selector) => {
    if (!container) return;
    container.addEventListener('click', (e) => {
      if (!e.isTrusted) return;
      if (e.target.closest('a[href], button, input, select, textarea, [role=button]')) return;
      const targets = [...container.querySelectorAll(selector)]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.height > 0 && (r.width < TAP || r.height < TAP));
      let best = null;
      targets.forEach(({ el, r }) => {
        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const d = Math.hypot(dx, dy);
        if (d <= RADIUS && (!best || d < best.d)) best = { el, d };
      });
      if (!best) return;
      e.preventDefault();
      e.stopPropagation();
      best.el.click();
    }, true);
  };
  forward(document.querySelector('#header'),
          '.header-title-logo a, .cart-style-icon, .header-burger-btn, .sqs-svg-icon--wrapper');
  forward(document.querySelector('.taro-cl-head'), '.taro-cl-all');
  document.querySelectorAll('.plyr__controls').forEach((c) => forward(c, '.plyr__control'));

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
