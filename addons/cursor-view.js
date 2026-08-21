// Cursor VIEW: the custom cursor learns what it is standing on.
//
// cursor.js draws the dot and the ring, and it already has a VIEW state — the
// ring opens wide and the word comes up inside it — but that state is pointed
// at `.gallery-masonry-item` and the shop's product cards. Neither exists on
// this site: the galleries (/stills /venues /paint /35film) are Fluid Engine
// image blocks, so every photograph is wrapped in an `a.sqs-block-image-link`
// and there is not one .gallery-masonry-item anywhere. cursor.js's VIEW state
// has therefore never once fired on the live site. This add-on points it at
// the markup the page actually has, and adds the opposite move for the places
// where a click needs no explaining.
//
// Two states, mutually exclusive:
//
//   VIEW — over a photograph. The ring opens to 2.5x and reads VIEW, because a
//          photograph looks exactly the same whether or not it opens; the
//          cursor is the only thing on the page that can say which it is.
//   MARK — over a call-to-action button or a nav link. The reverse: the ring
//          folds away entirely and the dot tightens to a small solid teal
//          point. A button already announces itself, so the cursor stops
//          decorating and just points. The two states are deliberately mirror
//          images — one grows the ring and drops the dot, the other drops the
//          ring and keeps the dot — so they can never be mistaken for each
//          other out of the corner of an eye.
//
// Nothing here runs per frame. cursor.js owns the rAF loop and the pointermove
// listener, and a second pointermove handler would double the work on the
// busiest event on the page for no gain. All this file adds is ONE delegated
// pointerover listener that toggles a class on <html>; every visible change is
// a CSS transition keyed off that class. pointerout is not needed: moving from
// a photograph onto the page behind it fires pointerover on whatever is behind
// it, which recomputes the state, and leaving the window is already cursor.js's
// job (it fades both elements out on pointerleave and blur).
//
// Three things are load-bearing and easy to lose:
//
//   - The state classes here are OURS (taro-cursor-view-on, taro-cursor-mark-on)
//     and not cursor.js's taro-cursor-view / taro-cursor-over. cursor.js
//     rewrites its two on every single pointermove, so anything this file set
//     there would be wiped inside a frame. Ours sit alongside its
//     taro-cursor-over and outrank it instead of fighting it.
//   - Which is the second: every selector below is prefixed with `html` so it
//     wins on specificity rather than on source order. main.js decides which
//     stylesheet is injected first, and if this file is ever imported BEFORE
//     cursor.js then its sheet lands after ours — at equal specificity the
//     ordinary hover state would take the tie and the ring would never open.
//     The `html` prefix costs nothing and makes the import order irrelevant.
//   - The dot and the ring both carry their visual on an inner <span class=
//     "taro-disc">, scaled by transform, because cursor.js writes a translate
//     to the outer element every frame and would overwrite a transform put
//     there. Scale the span, never the parent.
//
// Progressive enhancement: additive from top to bottom. No JS, no custom
// cursor at all — the native pointer is never taken away by this file, and
// nothing on the page is hidden waiting for it.

import { defineAddon, css } from '../lib/util.js';

const TEAL = '#85b7b2';

// Every photograph on the site, gallery pages and homepage tiles alike.
// Two markups, because the site uses both: /stills and /venues are Fluid
// Engine image blocks (a.sqs-block-image-link), while /35film and /paint are
// real gallery sections (a.gallery-masonry-lightbox-link). Keyed to only the
// first, the VIEW state simply never appeared on the film gallery — the one
// with thirty-two photographs in it.
const VIEW_TARGETS = 'a.sqs-block-image-link, a.gallery-masonry-lightbox-link, '
  + 'a.gallery-grid-lightbox-link, a.gallery-lightbox-link';

// The places a click is already obvious. Assumption worth writing down: the
// wrapper that pins the two CTA buttons was never measured for this file, so
// nothing here depends on it. Squarespace's button anchors carry
// sqs-block-button-element wherever the button block ends up, pinned or in
// flow, which is what makes this hold for both of them even though dune-reveal
// moves one out of its section and into .taro-dune-cta — the anchor keeps its
// classes through the reparenting, so there is nothing here to keep in sync
// with that add-on. The cost of anchoring on the button rather than on the pin
// is that every Squarespace button on the site gets the mark, not just those
// two, which is the more consistent behaviour anyway. Nav links are named by their own selector rather than
// being swept up as plain `a`, so ordinary links in body copy keep cursor.js's
// stock hover. The mobile menu's links are included: the burger can be open on
// a narrow desktop window, which is the only place with a fine pointer anyway.
const MARK_TARGETS = '#header .header-nav-item > a, .header-menu-nav-item a, '
                   + '.sqs-block-button-element, .sqs-button-element--primary';

// One closest() per pointerover against the union, then a single matches() on
// the hit to tell the two apart — cheaper than two tree walks for the common
// case of the pointer crossing something that is neither.
const ALL_TARGETS = `${VIEW_TARGETS}, ${MARK_TARGETS}`;

defineAddon('cursor-view', () => {
  // Same gate as cursor.js. There is nothing to dress on a touch device
  // because cursor.js will not have built anything, but checking here as well
  // means this file never installs a listener it cannot use.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const root = document.documentElement;

  const attach = () => {
    // cursor.js stands down completely on touch and under reduced motion, so
    // on plenty of visits there is simply no cursor here to extend. It can
    // also be a DIFFERENT cursor.js than the one this was written against:
    // GitHub Pages caches every file for ten minutes independently, so a fresh
    // main.js genuinely can be paired with the previous release's cursor.js —
    // an earlier version drew a single ring with mix-blend-mode and had no
    // inner spans at all. So the exact structure is checked, and if any part
    // of it is missing this add-on does nothing rather than guess: no
    // stylesheet, no listener. A VIEW label with nothing to sit inside is
    // worse than no VIEW label.
    const ring = document.querySelector('.taro-ring');
    const dot = document.querySelector('.taro-dot');
    if (!ring || !dot) return false;
    const label = ring.querySelector('.taro-ring-label');
    if (!label || !ring.querySelector('.taro-disc') || !dot.querySelector('.taro-disc')) return false;

    // The label is cursor.js's own — created by it, centred by it, and set in
    // the navigation's face through the --taro-cursor-font custom property it
    // reads off a live nav link at boot. It is found by class and left exactly
    // as it is; all that is added here is the class that brings it up. Nothing
    // in this file writes text, so if the wording ever changes over there it
    // changes everywhere, once.
    css('cursor-view', `
      /* ---- VIEW: over a photograph ---- */

      /* The ring's 1px stroke scales with the disc — 2.5px at this size, a
         band rather than a line — so it is taken back down in alpha to keep
         reading as a hairline. Same trade cursor.js makes in its own VIEW
         state; the numbers are matched to it on purpose so the two states are
         indistinguishable if a gallery block ever does appear on the site. */
      html.taro-cursor-view-on .taro-ring .taro-disc {
        transform: scale(2.5);            /* 85px over the resting 34px */
        border-color: ${TEAL}99;          /* ~60% alpha */
      }
      /* The dot folds away. At rest it sits exactly where the word is, and a
         dot on the E reads as a smudge rather than as a pointer — the ring is
         the pointer for as long as VIEW is showing. */
      html.taro-cursor-view-on .taro-dot .taro-disc {
        transform: scale(0);
      }
      /* Not over a form field: the native caret is showing there and cursor.js
         has faded the ring out, so the word would be left floating on its own
         over nothing. */
      html.taro-cursor-view-on:not(.taro-cursor-hidden) .taro-ring-label {
        opacity: 1;
      }

      /* ---- MARK: over a CTA button or a nav link ---- */

      /* The ring goes rather than opening, and the dot tightens: 6px of solid
         teal, a shade smaller than its resting 8px, which is as much cursor as
         a button needs. Scaling the ring to nothing also sidesteps the problem
         a tight collar would have had — a 1px stroke scaled down to 0.4px is a
         sub-pixel line that half-vanishes on a 1x display and looks like a
         rendering fault rather than a choice. */
      html.taro-cursor-mark-on .taro-ring .taro-disc {
        transform: scale(0);
      }
      html.taro-cursor-mark-on .taro-dot .taro-disc {
        transform: scale(0.75);           /* 6px over the resting 8px */
      }

      /* Reduced motion: which state you are in is information, so the ring
         still opens and the word still appears — but instantly, with nothing
         easing into place. A CSS media query rather than a boolean read at
         boot, so flipping the OS setting mid-visit takes effect on the next
         hover with no re-init. (cursor.js has usually stood down entirely by
         the time this matches; this covers the flip-mid-visit case, where its
         elements are already built and still in the DOM.) */
      @media (prefers-reduced-motion: reduce) {
        html .taro-ring .taro-disc,
        html .taro-dot .taro-disc,
        html .taro-ring-label { transition-duration: 0s; }
      }
    `);

    // The whole behaviour: one delegated listener, one tree walk, two class
    // toggles. No geometry is read, so there is nothing to cache and nothing
    // to invalidate on resize or scroll.
    document.addEventListener('pointerover', (e) => {
      // closest() is guarded because the target can be a non-Element (the
      // document itself, on some synthetic events).
      const hit = e.target.closest?.(ALL_TARGETS);
      const view = !!hit && hit.matches(VIEW_TARGETS);
      root.classList.toggle('taro-cursor-view-on', view);
      root.classList.toggle('taro-cursor-mark-on', !!hit && !view);
    }, { passive: true });

    return true;
  };

  // Whether cursor.js has built its elements yet depends on the import order
  // in main.js: every add-on's init runs from the same DOMContentLoaded, in
  // registration order, so being imported first means running first. One frame
  // later they exist either way. If they still do not, cursor.js stood down
  // for this visitor and so does this.
  if (!attach()) requestAnimationFrame(attach);
});
