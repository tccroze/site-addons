// Cross-page fade, so moving between Stills, Motion, Paint and Shop feels
// continuous rather than like a hard document swap.
//
// Squarespace 7.1 does no client-side routing, so every navigation is a real
// page load. This fades out before leaving and fades in on arrival, which is
// enough to disguise the seam.
//
// Failure mode taken seriously: a page stuck mid-fade would be unreadable, so
// the overlay is removed on pageshow (covering the back button and bfcache),
// and a watchdog clears it if a navigation never completes.

import { defineAddon, css } from '../lib/util.js';

const FADE_MS = 340;
const WATCHDOG_MS = 2500;

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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
  `);

  const veil = document.createElement('div');
  veil.className = 'taro-veil';
  veil.setAttribute('aria-hidden', 'true');

  // Match the site's own background so the fade reads as the page itself
  // resolving, not as a coloured panel sliding over it.
  const bg = getComputedStyle(document.body).backgroundColor;
  if (bg && bg !== 'rgba(0, 0, 0, 0)') veil.style.setProperty('--taro-veil-color', bg);

  document.body.appendChild(veil);

  const clear = () => requestAnimationFrame(() => veil.classList.add('is-clear'));
  clear();

  // Covers the back button and Safari's bfcache, which would otherwise restore
  // the page with the veil still opaque.
  window.addEventListener('pageshow', clear);

  document.addEventListener('click', (e) => {
    const link = e.target.closest?.('a[href]');
    if (!isInternalNavigation(e, link)) return;

    e.preventDefault();
    veil.classList.remove('is-clear');

    let done = false;
    const go = () => { if (!done) { done = true; location.href = link.href; } };
    setTimeout(go, FADE_MS);
    // If anything stalls, do not strand the visitor behind an opaque veil.
    setTimeout(() => veil.classList.add('is-clear'), WATCHDOG_MS);
  });
});
