// Cross-page fade, so moving between Stills, Motion, Paint and Shop feels
// continuous rather than like a hard document swap.
//
// Squarespace 7.1 does no client-side routing, so every navigation is a real
// page load. This fades out before leaving and fades in on arrival, which is
// enough to disguise the seam.
//
// On the way out the signature writes itself across the veil — the same
// left-to-right mask sweep the footer uses (see signature.js), timed to the
// fade, so leaving a page ends on the name. It is decoration on top of the
// veil and nothing more: navigation is fired on the same timer as before and
// the signature has no say in it.
//
// Failure mode taken seriously: a page stuck mid-fade would be unreadable, so
// the overlay is removed on pageshow (covering the back button and bfcache),
// and a watchdog clears it if a navigation never completes.

import { defineAddon, css } from '../lib/util.js';

const FADE_MS = 340;
const WATCHDOG_MS = 2500;

// The signature. Taken from the footer <img> at run time — the same asset
// signature.js animates, so it is one URL for both. The literal is the footer's
// src as probed, kept as a fallback for a page with no footer image.
//
// The asset is white ink on transparency — it was drawn for the footer, which
// sits on the dark section theme — so on a cream veil it would be invisible.
// Rather than filter it, the PNG is used as a mask over a block of the site's
// own text colour, so the name is written in the same ink as the page. That
// needs the CDN to allow cross-origin mask fetches; Squarespace's does
// (Access-Control-Allow-Origin: *), checked.
const SIG_FALLBACK = 'https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/94572ab4-bee1-4379-bbf5-09c647dc829e/Signature.png';
const SIG_RATIO = '694 / 363';   // the probed asset; corrected from the real image once it loads
const SIG_INK = '#243230';       // body text colour as probed; read live below
const SIG_WIDTH = 320;           // px, the cap; narrower viewports get 70vw
const SIG_SOFT = 9;              // % of the signature's width over which the ink fades in

// The sweep is the footer's gradient mask (signature.js) — but where the footer
// rewrites the gradient's stops from scroll position every frame, here the
// gradient is fixed and it is mask-position that moves, which CSS transitions
// on its own: no per-frame JS during the exit. The mask image is made wider
// than the signature — two widths plus the soft edge — with the ink-to-clear
// band in its middle. At mask-position 100% only the clear width covers the
// image, at 0% only the solid width does, and the transition between the two
// carries the band across at constant speed.
const SIG_MASK_W = 200 + SIG_SOFT;   // % of the signature's width
const SIG_MASK = `linear-gradient(to right, #000 ${(10000 / SIG_MASK_W).toFixed(2)}%, transparent ${((100 + SIG_SOFT) * 100 / SIG_MASK_W).toFixed(2)}%)`;

/** The footer signature's URL at a size fit for the veil, or the fallback. */
function signatureUrl() {
  const footer = document.querySelector('footer img');
  const base = ((footer && (footer.currentSrc || footer.src)) || SIG_FALLBACK).split('?')[0];
  // Squarespace's CDN sizes on ?format=. 750w covers a 320px box on a 2x
  // display; 500w is enough at 1x and is the smaller file.
  const size = (window.devicePixelRatio || 1) > 1.5 ? '750w' : '500w';
  return /squarespace-cdn\.com/.test(base) ? `${base}?format=${size}` : base;
}

/** Is this a plain left-click on an internal link we should intercept? */
function isInternalNavigation(e, link) {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;   // open-in-new-tab etc.
  if (!link || link.hasAttribute('download')) return false;
  if (link.target && link.target !== '_self') return false;

  const href = link.getAttribute('href') || '';
  if (!href || href.startsWith('#')) return false;
  if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;

  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return false;
  // Same page, just a different anchor — let the browser scroll.
  if (url.pathname === location.pathname && url.hash) return false;

  return true;
}

defineAddon('page-transition', () => {
  // Kept as a MediaQueryList, not a frozen boolean — the OS setting can change
  // mid-visit, so the click handler consults it again at decision time.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  // Deliberately off on touch. This intercepts every link tap and holds
  // navigation for a third of a second, and there is an unreproduced scroll
  // fault reported on mobile. Until that is understood, phones get fewer
  // moving parts; the transition matters less there anyway.
  if (window.matchMedia('(hover: none)').matches) return;

  css('page-transition', `
    .taro-veil {
      position: fixed;
      inset: 0;
      background: var(--taro-veil-color, #f4eedb);
      opacity: 1;
      pointer-events: none;
      z-index: 99998;
      visibility: visible;
      transition: opacity ${FADE_MS}ms ease;
    }
    /* Once cleared it goes properly hidden rather than sitting there as a
       permanently composited full-viewport layer, which is wasteful on mobile.
       visibility flips only after the fade finishes so the fade is still seen. */
    .taro-veil.is-clear {
      opacity: 0;
      visibility: hidden;
      transition: opacity ${FADE_MS}ms ease, visibility 0s linear ${FADE_MS}ms;
    }

    /* The signature, centred on the veil, masked out until the exit. The box
       carries the sweep (see the note on SIG_MASK); its ::before is the ink —
       a block of the page's text colour with the PNG as its mask. Two nested
       masks compose without any mask-composite, which is still patchy. */
    .taro-veil-sig {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 70vw;
      max-width: ${SIG_WIDTH}px;
      aspect-ratio: var(--taro-sig-ratio, ${SIG_RATIO});
      transform: translate(-50%, -50%);
      -webkit-mask-image: ${SIG_MASK};
              mask-image: ${SIG_MASK};
      -webkit-mask-repeat: no-repeat;
              mask-repeat: no-repeat;
      -webkit-mask-size: ${SIG_MASK_W}% 100%;
              mask-size: ${SIG_MASK_W}% 100%;
      -webkit-mask-position: 100% 0;
              mask-position: 100% 0;
    }
    .taro-veil-sig::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--taro-sig-ink, ${SIG_INK});
      -webkit-mask-image: var(--taro-sig-url);
              mask-image: var(--taro-sig-url);
      -webkit-mask-repeat: no-repeat;
              mask-repeat: no-repeat;
      -webkit-mask-size: contain;
              mask-size: contain;
      -webkit-mask-position: center;
              mask-position: center;
    }
    /* Timed to the veil: the last stroke lands as navigation fires. Linear, as
       a hand moves — the veil's own ease belongs to the fade, not the pen. */
    .taro-veil.is-leaving .taro-veil-sig {
      -webkit-mask-position: 0 0;
              mask-position: 0 0;
      transition: -webkit-mask-position ${FADE_MS}ms linear, mask-position ${FADE_MS}ms linear;
    }
    /* Reduced motion: the veil alone. (The click handler already hands the
       navigation straight back in that case; this covers the setting changing
       mid-exit.) */
    @media (prefers-reduced-motion: reduce) {
      .taro-veil-sig { display: none; }
    }
  `);

  const veil = document.createElement('div');
  veil.className = 'taro-veil';
  veil.setAttribute('aria-hidden', 'true');

  // Match the site's own background so the fade reads as the page itself
  // resolving, not as a coloured panel sliding over it.
  const bg = getComputedStyle(document.body).backgroundColor;
  if (bg && bg !== 'rgba(0, 0, 0, 0)') veil.style.setProperty('--taro-veil-color', bg);

  // The signature rides inside the veil so it inherits the fade and the
  // hidden state for free. Only where masks work — without them there is no
  // ink at all (the PNG is the mask), so the element would be a solid block:
  // the same stand-down signature.js makes.
  if (CSS.supports('mask-image', 'linear-gradient(#000, #000)')
   || CSS.supports('-webkit-mask-image', 'linear-gradient(#000, #000)')) {
    const sig = document.createElement('div');
    sig.className = 'taro-veil-sig';
    const url = signatureUrl();
    sig.style.setProperty('--taro-sig-url', `url("${url}")`);
    // The page's own ink — the same read the veil makes for its background.
    const ink = getComputedStyle(document.body).color;
    if (ink && ink !== 'rgba(0, 0, 0, 0)') sig.style.setProperty('--taro-sig-ink', ink);
    // Fetched at boot, not at click — a 340ms window is no time to start a
    // download in — but at low priority so it never competes with the page's
    // own images (~30KB). Loading it as an Image also gives the real
    // dimensions, so the box takes the asset's true aspect rather than the
    // probed one; and a broken asset takes the whole thing away rather than
    // leaving an unmasked block of ink on the veil.
    const pre = new Image();
    pre.fetchPriority = 'low';
    pre.onload = () => sig.style.setProperty('--taro-sig-ratio', `${pre.naturalWidth} / ${pre.naturalHeight}`);
    pre.onerror = () => sig.remove();
    pre.src = url;
    veil.appendChild(sig);
  }

  document.body.appendChild(veil);

  // Clearing the veil also resets the signature — but only once the fade has
  // finished, so on a bfcache restore it fades out with the veil rather than
  // snapping off while the cream is still opaque. The timer is cancelled by a
  // fresh click so a reset can never land in the middle of a new sweep.
  let resetTimer = 0;
  const clear = () => requestAnimationFrame(() => {
    veil.classList.add('is-clear');
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => veil.classList.remove('is-leaving'), FADE_MS);
  });
  clear();

  // Covers the back button and Safari's bfcache, which would otherwise restore
  // the page with the veil still opaque.
  window.addEventListener('pageshow', clear);

  document.addEventListener('click', (e) => {
    // Checked live — if reduced motion was switched on since boot, hand
    // navigation straight back to the browser, no fade.
    if (reduced.matches) return;

    const link = e.target.closest?.('a[href]');
    if (!isInternalNavigation(e, link)) return;

    e.preventDefault();
    clearTimeout(resetTimer);
    veil.classList.remove('is-clear');
    veil.classList.add('is-leaving');   // starts the signature's sweep

    let done = false;
    const go = () => { if (!done) { done = true; location.href = link.href; } };
    setTimeout(go, FADE_MS);
    // If anything stalls, do not strand the visitor behind an opaque veil.
    setTimeout(clear, WATCHDOG_MS);
  });
});
