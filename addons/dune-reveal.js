// Sections whose copy sinks into the landscape as you scroll, passing behind
// whatever stands against the sky — dead trees, a dune ridge, two walkers on it.
//
// This used to work by laying a second copy of the photograph over the text and
// punching the sky out of it, so the trees and figures were redrawn on top. That
// is the obvious way to do it and it was wrong: it asks two independently
// resolved images to land on precisely the same pixel, and any disagreement
// prints a second, offset copy of whatever stands against the sky.
//
// So there is no second photograph. The *text* carries the cut-out: its
// container is masked with the inverse silhouette — opaque across the sky,
// transparent everywhere the landscape stands — so the copy is erased as it
// descends past the ridge. Squarespace's own background is the only image on
// screen and nothing can misregister against it.
//
// Four things this file has learned the hard way:
//
//   1. A mask travels with its own element. So the mask goes on the content
//      wrapper, which never moves, and the travel goes on the blocks inside it.
//      Mask the thing that slides and the sky slides with it, occluding nothing.
//
//   2. The mask must be worn by something that spans the whole section.
//      mask-clip is border-box by default, so masking each block individually
//      clipped its copy at the block's own edge the moment it travelled outside
//      — a flat horizontal cut nowhere near the ridge.
//
//   3. Where the copy sits is not stable after load. Squarespace's scaled-text
//      sizer re-fits it once it has measured it, the webfont swaps, and lifting
//      the button out of the grid drops a row. None of that resizes the section,
//      so a placement measured once at load quietly slides off the picture — and
//      a mask slid up by a couple of hundred pixels puts the men's silhouettes
//      in open sky, where they cut people-shaped holes out of the letters. It is
//      reconciled every frame now, and written only when it has actually drifted.
//
//   4. Only the copy that is meant to sink may be erased. The wrapper also holds
//      copy further down the section — "YOUR STORY DESERVES TO BE FELT" and
//      "Stills. Motion. Paint." — which sits below the ridge line and was
//      therefore transparent from the moment the page loaded, with no amount of
//      scrolling bringing it back. A second, opaque mask layer covers that band
//      so it is always painted, and the travel is capped so the sinking copy
//      never lands in it.
//
// Nothing here is destructive: no markup is added inside the section apart from
// the CTA being reparented, and every change is a class or a custom property.

import { defineAddon, css, warn } from '../lib/util.js';

// ?v= because the masks otherwise ride GitHub Pages' independent ten-minute
// cache, which can pair fresh JS with a stale mask — a re-traced silhouette
// beside old ridge constants. Stamped by scripts/release.sh.
const V = '2.48.0';
const ASSET = (name) => `${new URL(`../assets/${name}`, import.meta.url).href}?v=${V}`;

/**
 * One entry per section. Matched on the background photograph's filename rather
 * than on a section id, which Squarespace changes whenever a section is rebuilt
 * in the editor.
 *
 * `ridge` is how far down the frame the landscape has closed over the sky right
 * across the picture — read straight off the mask's alpha channel, at the 85th
 * percentile of the middle 80% of columns, so a single low notch does not
 * decide it. The copy has to descend past that line to be properly swallowed,
 * and it is what the travel distance is computed from.
 *
 * `taller` asks for more sky. That only makes sense where the picture already
 * shows its full height and the ridge sits high in the frame: a taller section
 * scales the photograph up and carries the ridge down, which is the only way to
 * buy more room once re-cropping has nothing left to give.
 */
// FRAGMENTS, and why one of these scenes has no mask.
//
// Masking the copy works when the skyline is roughly level: the words meet the
// landscape all at once and go behind it together. The dune frame is not level
// — its crest is a steep diagonal that dips deep at the left — so a full-width
// headline crossing it has one end buried in sand while the other is still in
// open sky. Every intermediate frame is a row of half-letters, and stray glyphs
// strand in the low notch after the rest of the line has gone. That is not a
// tuning error; it is what a per-pixel cut does to a wide line over a diagonal
// edge, and no amount of ridge-fitting removes it.
//
// So that scene is maskless. The copy holds where it can be read, then lifts
// and dissolves as the dune climbs the frame: it still reads as the landscape
// taking the words, it cannot fragment, and it has nothing to misregister
// against. The print frame keeps its mask — its treeline is level, the cut is
// clean there, and it has never been the one that looked wrong.
const SCENES = [
  // `lift` is gone from both scenes, deliberately. It bought the dune copy
  // reading room by raising it before the fall — but the raise held the first
  // line up inside the intro's pinned torn edge, which cut it mid-read.
  // `clearTear` starts the copy lower on phones: the intro's torn edge hangs
  // over this section's top by design, and at rest it guillotined the first
  // headline for ~130px of scroll. Applied as part of the transform, not as
  // layout — margins inside a Fluid Engine grid overflow their cell.
  //
  // `phase` is the dune scene's answer to an impossible triangle. Its copy
  // rests only ~150px above the ridge, under a torn edge that stays pinned on
  // screen for the first quarter of the window. A fall welded to the scroll
  // rate keeps the copy out of the tear but lets the ridge catch it almost
  // immediately — it was gone before it could be read. No fall at all keeps it
  // readable but rides it up into the pinned tear. So the fall is piecewise:
  //
  //   masked scene:   fall at the scroll rate under the tear, hold to be read,
  //                   then sink bodily past the ridge;
  //   maskless scene: hold to be read for phase[1] of the window, then one
  //                   smoothstep lift-and-dissolve over the remainder.
  //
  // The print scene needs none of this: no tear above it, and its copy rests
  // high above its ridge, so the plain pinned fall is already readable there.
  { match: /deadvlei/i, mask: 'deadvlei-sky.png', ridge: 0.60, lift: 0, taller: true },
  // The third number ends the sink early: the remaining tenth of the window
  // belongs to the fade that sweeps the low-notch remnant, and to the standing
  // copy below arriving into a section that has finished moving.
  // No mask on this one, deliberately — see FRAGMENTS below.
  { match: /\bdune\.jpg/i, mask: null, ridge: 0.58, lift: 0, taller: false, clearTear: true, phase: [0.30, 0.72] },
];

// The copy must fall at least this fraction of the rate the section scrolls,
// or the sink reads as parallax drift rather than the landscape climbing over
// the words — at 1440x900 the dune copy was falling at 0.53x over a 1000px
// span while the deadvlei copy fell at 1.16x a few hundred pixels later, and
// the two same-language gestures obeying different physics is part of what
// read as clunk. The span is capped so travel/span stays at or above this.
const FALL_MIN = 0.85;

// The copy holds still until the section's top reaches the top of the window —
// the moment the photograph fills the screen — and the whole descent then plays
// out while it still does.
//
// It used to run on fixed multiples of the viewport height, ending 1.2 screens
// after the section's top had gone by. On the print section that meant the
// travel was still only a third done when the section left the screen: you
// scrolled past and never saw the copy meet the dune, only a slow drift. The
// window is now the section's own scroll-through — how far it can travel while
// still covering the viewport — so the descent always completes in view.
const SPAN_MIN = 0.45;    // ...but never quicker than this, in viewport heights
const BURY = 0.10;        // clearance past the ridge, in viewport heights
// 0.30, up from 0.16 — the one lag constant the whole page now shares. At 0.16
// the follower answered a wheel notch ~280ms late, which reads as the copy
// being towed rather than moving with the page.
const EASE = 0.30;        // proportion of the remaining distance closed per frame
const FRAME = 1000 / 60;

// object-position keywords, as fractions of the free space. Chrome serialises
// the computed value as percentages, but Safari and Firefox do not always, and
// a parse that quietly falls back to centre is how the ghost got a few hundred
// pixels of horizontal offset in the first place.
const KEYWORD = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };

/** Resolve one axis of an object-position against the free space around the
 *  drawn image, in pixels. `free` is container size minus drawn size. */
const axis = (token, free) => {
  if (token in KEYWORD) return KEYWORD[token] * free;
  if (token.endsWith('%')) return (parseFloat(token) / 100) * free;
  const px = parseFloat(token);
  return Number.isFinite(px) ? px : 0.5 * free;
};

defineAddon('dune-reveal', () => {
  if (location.pathname !== '/') return;
  if (document.querySelector('.taro-dune-wrap')) return;

  // By data-section-id, not by wrapper: Squarespace retired the
  // <article id="sections"> container for page-regions markup, and a selector
  // keyed to it found nothing — both scenes silently failed to mount. Footer
  // sections carry the same attribute and are excluded.
  const sections = [...document.querySelectorAll('section[data-section-id]')]
    .filter((s) => !s.closest('footer'));
  const found = SCENES
    .map((scene) => ({
      scene,
      section: sections.find((s) => {
        const img = s.querySelector('.section-background img');
        if (!img) return false;
        // data-src as well as src: Squarespace lazy-loads section backgrounds,
        // and below the fold the element still has an empty src when this runs.
        // Matching on src alone found the print section, whose picture happened
        // to be loaded already, and silently missed this one.
        const src = [img.currentSrc, img.src, img.getAttribute('data-src'),
                     img.getAttribute('data-image')].filter(Boolean).join(' ');
        if (!scene.match.test(src)) return false;
        // Squarespace also ships hidden duplicates of a section for other
        // breakpoints, carrying the same photograph. They are display: none,
        // which is the test to use — measuring height instead rejected the real
        // section too, because at DOMContentLoaded it has not laid out yet and
        // reads zero. That failed silently: the add-on reported success having
        // mounted only half of itself.
        return !!s.querySelector('.content-wrapper')
          && getComputedStyle(s).display !== 'none';
      }),
    }))
    .filter((x) => x.section);
  if (!found.length) return;

  css('dune-reveal', `
    /* The wearer of the cut-out. It spans the section and never moves: the
       travel below is applied to the blocks inside it, because a mask travels
       with its own element and a sky that slides with the text occludes nothing.
       Two layers, unioned by the default add compositing:

         1. the silhouette, placed in pixels computed from the photograph's own
            drawn rectangle so its sky sits exactly over the sky in the picture;
         2. a plain opaque band over the copy that lives further down the
            section, which is below the ridge line and would otherwise be
            transparent from the moment the page loaded. */
    .taro-dune-wrap {
      /* The mask carries its cut-out in the ALPHA channel, and CSS mask-image
         reads alpha by default — a plain greyscale PNG is fully opaque here. */
      -webkit-mask-image: var(--taro-sky), var(--taro-keep);
              mask-image: var(--taro-sky), var(--taro-keep);
      -webkit-mask-mode: alpha, alpha;        mask-mode: alpha, alpha;
      -webkit-mask-size: var(--taro-sky-size), var(--taro-keep-size);
              mask-size: var(--taro-sky-size), var(--taro-keep-size);
      -webkit-mask-position: var(--taro-sky-pos), var(--taro-keep-pos);
              mask-position: var(--taro-sky-pos), var(--taro-keep-pos);
      -webkit-mask-repeat: no-repeat, no-repeat;
              mask-repeat: no-repeat, no-repeat;
      -webkit-mask-composite: source-over, source-over;
              mask-composite: add, add;
      /* Defaults, so a scene with nothing to protect simply gets an empty band
         rather than an invalid mask-image list (which would blank the copy). */
      --taro-keep: linear-gradient(#000, #000);
      --taro-keep-size: 0 0;
      --taro-keep-pos: 0 0;
    }
    .taro-dune-move { will-change: transform; }

    /* The copy that stands below the ridge waits its turn. It used to reveal
       on plain scroll position, which put "YOUR STORY DESERVES TO BE FELT" on
       screen while the dune was still taking the headline — two messages
       asking to be read at once. It now enters only after the sink completes,
       rising into a section that has finished moving; scrolling back up hands
       the stage back the same way. */
    /* Only the transition lives in CSS. The opacity and transform themselves
       are written inline from render(): these blocks carry the owner's own
       per-block styles and scroll-reveal's reveal rules, and a class selector
       kept losing the cascade to one or the other — an inline write loses to
       nothing. */
    .taro-dune-later {
      transition: opacity 0.7s ease 0.15s,
                  transform 0.7s cubic-bezier(0.16, 0.84, 0.3, 1) 0.15s;
    }

    /* Centred — as a pair, not each line inside its own box. Fluid Engine gives
       every block its own grid span, so centring the text alone left the two
       lines centred on different axes and reading as ragged. Spanning both
       blocks across the whole grid first gives them a common centre line. */
    .taro-dune-content .fe-block {
      grid-column: 1 / -1 !important;
      /* Gutters matter here: Squarespace scales this type to fit its block, so
         spanning the full grid without them made the text grow to the section's
         full width and run off both edges. The padding gives the scaler a
         narrower box, which is what keeps the lines inside the frame. */
      padding-inline: clamp(24px, 7vw, 140px);
      text-align: center;
    }
    .taro-dune-content .sqs-html-content,
    .taro-dune-content .sqs-block-content,
    .taro-dune-content .sqs-block-button { text-align: center; }

    /* More sky above the ridge, so the copy has further to travel before the
       landscape swallows it. Only where the photograph already shows its full
       height: re-cropping has nothing left to give there, and a taller section
       scales the picture up and carries the ridge down the frame while the copy
       stays near the top. Desktop only; the phone layout stacks. */
    @media (min-width: 768px) {
      /* min(1300px, 88vw), up from min(1100px, 76vw): the deadvlei swallow was
         playing out 61% after the section had stopped covering the viewport —
         you watched the tail of it over a band of bare teal. The taller runway
         lets the descent complete while the photograph still fills the screen. */
      .taro-dune-section--taller { min-height: min(1300px, 88vw); }
      /* Squarespace sizes the background image inline, from the height the
         section had when its own script measured it — before this min-height
         had grown it. The stale size left a band of bare section colour under
         the photograph. !important because inline style wins every tie that
         isn't one. object-fit keeps the crop; the focal point still comes from
         Squarespace's own object-position, which is not overridden. */
      .taro-dune-section--taller .section-background img {
        width: 100% !important;
        height: 100% !important;
        top: 0 !important;
        left: 0 !important;
        object-fit: cover;
      }
    }

    /* The call to action is lifted out of the sinking copy and parked at the
       foot of the photograph — outside the masked wrapper, so the landscape
       never eats it. Everything else is meant to be swallowed; a button that
       disappears is just a button you cannot press. */
    .taro-dune-cta {
      position: absolute; left: 0; right: 0;
      bottom: clamp(28px, 5vh, 64px);
      z-index: 5;
      display: flex; justify-content: center;
      pointer-events: none;          /* the strip must not swallow clicks */
    }
    .taro-dune-cta > * {
      pointer-events: auto;
      /* It came out of a grid, so its placement and stretch have to be undone. */
      position: static;
      grid-area: auto;
      width: auto; max-width: min(92vw, 520px);
      margin: 0; padding: 0;
    }
    /* On phones the button can land over the brightest clay pan, where its
       outline drops to ~2.2:1 against the sand. A light scrim under the whole
       button block carries it over any part of the photograph. */
    @media (max-width: 767px) {
      .taro-dune-cta a {
        background: rgba(24, 22, 12, 0.30);
        border-radius: 999px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .taro-dune-move { transform: none !important; }
    }
  `);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  found.forEach(({ scene, section }) => {
    const bgImg = section.querySelector('.section-background img');
    const wrapper = section.querySelector('.content-wrapper');
    const content = wrapper && (wrapper.querySelector(':scope > .content') || wrapper.firstElementChild);
    if (!bgImg || !wrapper || !content) return;

    const maskUrl = scene.mask ? ASSET(scene.mask) : null;
    if (maskUrl) {
      wrapper.classList.add('taro-dune-wrap');
      wrapper.style.setProperty('--taro-sky', `url("${maskUrl}")`);
    }
    content.classList.add('taro-dune-content');
    if (scene.taller) section.classList.add('taro-dune-section--taller');

    // Lift the button clear of the sinking copy. Fluid Engine gives every block
    // its own .fe-block, so the button has one to itself. Matching on "contains a
    // link" alone is not enough — that carried the heading and the paragraph down
    // with it once. Requiring no heading and no paragraph makes that impossible;
    // if nothing matches, the button is simply left where it is.
    const buttonBlock = [...section.querySelectorAll('.fe-block')].find(
      (b) => b.querySelector('a') && !b.querySelector('h1, h2, h3, h4, p'));
    if (buttonBlock) {
      const cta = document.createElement('div');
      cta.className = 'taro-dune-cta';
      cta.appendChild(buttonBlock);        // moved, not cloned
      section.appendChild(cta);
    }

    let travel = 0, lift = 0, span = 1, clearPx = 0, holdW = 0;
    let keepers = [], shownLater = null;
    let mx0 = NaN, my0 = NaN, dw0 = NaN, dh0 = NaN;
    /** The blocks that start in the sky, and therefore sink. */
    let movers = null;

    /** Where the photograph is actually drawn, in viewport pixels. Reproduces
     *  object-fit: cover from the image element's own box, so however
     *  Squarespace insets .section-background the mask follows it.
     *
     *  The focal point is re-read here rather than cached. It is Squarespace's
     *  own property, written inline on the image, and it can change after load
     *  without changing the image's box — so no resize and no ResizeObserver
     *  fires, and a cached copy is never invalidated. That was the one drift
     *  nothing could repair: the mask stranded 224px sideways, permanently,
     *  which is exactly far enough to drop the men's silhouettes into open sky
     *  where they cut people-shaped holes out of the letters. */
    const photoRect = () => {
      const box = bgImg.getBoundingClientRect();
      const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
      if (!box.width || !box.height || !iw || !ih) return null;
      const f = (getComputedStyle(bgImg).objectPosition || '50% 50%').split(/\s+/);
      const scale = Math.max(box.width / iw, box.height / ih);
      const dw = iw * scale, dh = ih * scale;
      return {
        left: box.left + axis(f[0] || '50%', box.width - dw),
        top: box.top + axis(f[1] || '50%', box.height - dh),
        dw, dh,
      };
    };

    // Reconciled against live geometry on every frame the scroll loop runs, and
    // written only when it has actually drifted. The reads are free: the loop
    // already takes a bounding rect for its own progress, so these join that
    // same batch and cost no extra layout flush, and the write — the part that
    // would repaint — happens only on the rare frame where something moved.
    const syncMask = () => {
      if (!maskUrl) return;
      const p = photoRect();
      if (!p) return;
      // mask-position is measured from the masked element's own border box.
      const wrap = wrapper.getBoundingClientRect();
      const mx = p.left - wrap.left, my = p.top - wrap.top;
      if (Math.abs(mx - mx0) < 0.5 && Math.abs(my - my0) < 0.5
          && Math.abs(p.dw - dw0) < 0.5 && Math.abs(p.dh - dh0) < 0.5) return;
      mx0 = mx; my0 = my; dw0 = p.dw; dh0 = p.dh;
      wrapper.style.setProperty('--taro-sky-size', `${p.dw.toFixed(2)}px ${p.dh.toFixed(2)}px`);
      wrapper.style.setProperty('--taro-sky-pos', `${mx.toFixed(2)}px ${my.toFixed(2)}px`);
    };

    const measure = () => {
      const vh = window.innerHeight || 0;
      const secRect = section.getBoundingClientRect();
      // How far the section can scroll while still covering the window. Short
      // sections get a floor, or the whole descent would happen in a few dozen
      // pixels of wheel and read as a jump rather than a movement. This is only
      // the raw ceiling — the real span is set below, once the travel is known,
      // so the fall keeps pace with the scroll (see FALL_MIN).
      const rawSpan = Math.max(secRect.height - vh, SPAN_MIN * vh);
      // Desktop only. The intro's torn paper edge hangs over the top of this
      // section by design, and on a phone that overhang reaches far enough down
      // that raising the copy tucked its first line underneath the tear — you
      // could read "ART" and nothing else. There is no shortage of sky on a
      // phone anyway: the section is taller than the viewport, so the copy has
      // plenty of travel without being lifted into the paper.
      lift = window.innerWidth >= 768 ? (scene.lift || 0) * vh : 0;
      clearPx = scene.clearTear && window.innerWidth < 768 ? 80 : 0;
      syncMask();

      const p = photoRect();
      if (!p) return;
      const ridgeY = p.top + scene.ridge * p.dh;

      // Sort every block into the copy that sinks and the copy that stays. A
      // block that already begins below the ridge is not part of this effect —
      // it is other copy further down the section, and erasing it is the bug.
      const wrap = wrapper.getBoundingClientRect();
      let sinkTop = Infinity, sinkBottom = -Infinity, keepTop = Infinity;
      const chosen = [];
      content.querySelectorAll('.fe-block').forEach((el) => {
        const r = el.getBoundingClientRect();
        // The blocks themselves are what move, and getBoundingClientRect
        // reports the transformed box — so back the travel out to get the
        // resting position, or re-measuring mid-scroll would reclassify a block
        // as "stays" the moment it had sunk past the ridge.
        const t = el.__taroY || 0;
        const top = r.top - t, bottom = r.bottom - t;
        if (top < ridgeY && el.querySelector('h1, h2, h3, h4, p')) {
          chosen.push(el);
          sinkTop = Math.min(sinkTop, top);
          sinkBottom = Math.max(sinkBottom, bottom);
        } else {
          keepTop = Math.min(keepTop, top);
          // Staged entrance — see .taro-dune-later. Marked revealed for
          // scroll-reveal so its one-shot rise does not fight this one.
          if (!el.classList.contains('taro-dune-later')) {
            el.classList.add('taro-dune-later');
            keepers.push(el);
            el.querySelectorAll('[data-taro-reveal]').forEach((t) =>
              t.setAttribute('data-taro-reveal', 'in'));
            if (el.hasAttribute('data-taro-reveal')) el.setAttribute('data-taro-reveal', 'in');
          }
        }
      });
      if (!chosen.length) return;
      movers = chosen;
      movers.forEach((el) => el.classList.add('taro-dune-move'));

      // The band that must never be erased, in the wrapper's own coordinates.
      if (maskUrl && Number.isFinite(keepTop)) {
        wrapper.style.setProperty('--taro-keep-size', `100% ${Math.max(0, wrap.height).toFixed(0)}px`);
        wrapper.style.setProperty('--taro-keep-pos', `0 ${(keepTop - wrap.top).toFixed(2)}px`);
      }

      // How far the copy must fall to be gone. Measured from the TOP of the
      // highest sinking line: reaching the ridge with its bottom edge leaves the
      // whole line still standing above the sand, which is what it did — the
      // print heading slid off the top of the window with the dune never quite
      // catching it. Capped so the sunk copy never comes to rest inside the
      // protected band, where it would be painted back in.
      const room = Number.isFinite(keepTop) ? keepTop - sinkBottom - 8 : Infinity;
      // A masked scene must carry the copy bodily past the ridge. A maskless
      // one only has to move enough to read as leaving — the fade finishes the
      // job — so it travels a short, fixed distance and never chases geometry.
      const travelRaw = maskUrl
        ? Math.max(0, Math.min(ridgeY - sinkTop + BURY * vh, room))
        : -0.10 * vh;   // negative: it LIFTS away, see below
      // The span serves the travel, not the other way round. Left at the raw
      // ceiling, the dune copy spread 437px of fall over 1000px of scroll —
      // 0.53x, a drift, while the print section fell at 1.16x: two identical
      // gestures on different physics. Capped by FALL_MIN the copy falls at
      // very nearly the rate the picture rises and reads as pinned while the
      // landscape climbs over it. The keep-copy cap ends the descent before
      // the standing copy below reaches mid-screen, so the two messages are
      // never both asking to be read at once.
      // 0.38vh rather than half a viewport: the sink may still be finishing as
      // the standing copy reaches the upper third — the handover reads as one
      // message leaving while the next arrives, and the extra span it buys is
      // pure reading time for the sinking copy.
      const keepCap = Number.isFinite(keepTop)
        ? keepTop - secRect.top - 0.38 * vh : Infinity;
      // For a phased scene only the falling segments must keep pace with the
      // scroll, so the FALL_MIN cap is measured against their combined share
      // of the window, not the whole of it — the hold is free span.
      const fallShare = scene.phase
        ? scene.phase[0] + (scene.phase[2] || 1) - scene.phase[1] : 1;
      // A masked scene sizes its window so the copy keeps pace with the
      // scroll (FALL_MIN). A maskless one has no ridge to keep pace with, and
      // that formula — fed a negative, lifting travel — collapsed it onto the
      // SPAN_MIN floor: ~320px readable then a 100px snap of a fade. It gets a
      // window sized to the viewport instead, which roughly doubles the time
      // the words are on screen and spreads the dissolve over ~230px.
      span = maskUrl
        ? Math.max(SPAN_MIN * vh,
            Math.min(rawSpan, (travelRaw + lift + clearPx) / (FALL_MIN * fallShare), keepCap))
        : Math.max(SPAN_MIN * vh, Math.min(rawSpan, 0.95 * vh, keepCap));
      travel = maskUrl ? Math.min(travelRaw, 1.8 * span) : travelRaw;
      // The early-fall share for a phased scene: enough displacement, at the
      // scroll rate, to keep the copy beneath the tear while it is pinned —
      // never more than half the whole travel, or the hold has nothing left.
      holdW = scene.phase && maskUrl && travel > 0
        ? Math.min(0.5, (FALL_MIN * scene.phase[0] * span) / travel) : 0;
    };

    // Zero until the section's top reaches the top of the window, then all the
    // way through while it still fills it.
    const targetProgress = (top) => Math.max(0, Math.min(1, -top / span));

    // No scale, deliberately. Scaling a full-width block by even a few percent
    // pushes it past the viewport and the document grows a horizontal scrollbar,
    // which reads as a dead strip down the side.
    /** Fraction of the travel spent by progress p. Linear for a plain scene —
     *  the fall tracks the scroll and reads as pinned. Piecewise for a phased
     *  one: fall at the scroll rate while the tear is pinned, hold while the
     *  copy is being read, then sink the remainder. Each segment is linear,
     *  and the eased follower below rounds the two corners into curves. */
    const spent = (p) => {
      if (!scene.phase) return p;
      // Maskless: still, then a single smooth lift over the final segment. The
      // copy rises out of frame as the dune climbs into it — the opposite
      // direction to a masked sink, because with nothing cutting the letters a
      // downward slide would just park them on top of the sand.
      if (!maskUrl) {
        const b = scene.phase[1];
        if (p <= b) return 0;
        const t = (p - b) / (1 - b);
        return t * t * (3 - 2 * t);
      }
      const [a, b, c = 1] = scene.phase;
      if (p <= a) return (p / a) * holdW;
      if (p <= b) return holdW;
      if (p >= c) return 1;
      return holdW + ((p - b) / (c - b)) * (1 - holdW);
    };

    const render = (p) => {
      // Starts at -lift (or +clearPx below the tear, on phones) and ends at
      // +travel: held where it can be read, then carried down behind the ridge.
      //
      // Linear segments, not curves. The descent is measured against the
      // section's own scroll, so a linear ramp means the copy falls at a fixed
      // fraction of the rate the picture rises. Squaring it made the copy lag
      // at the start — it drifted up the screen before the sink caught up,
      // which is what "you scroll past before the motion hits" was describing.
      // The frame-rate-independent follower below is what smooths this.
      const y = travel * spent(p) - (lift - clearPx) * (1 - p);
      const t = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      // The last of the sink is a fade as well as a fall. At the far left the
      // ridge dips low and the sky reaches deep, so a first letter can outfall
      // its travel budget — capped by the keep band below — and strand a
      // fragment in that notch after the rest has gone. The mask still does
      // the swallowing; the fade only sweeps up what the ridge cannot reach.
      // Maskless: the fade is the exit, spread over the whole final segment so
      // it reads as the copy dissolving into the dune rather than blinking off.
      // Masked: a short sweep at the very end, only to catch a low-notch tail.
      const fadeAt = maskUrl ? (scene.phase ? (scene.phase[2] || 0.85) : 2)
                             : (scene.phase ? scene.phase[1] : 0.7);
      const fadeSpan = maskUrl ? 0.08 : (1 - fadeAt);
      const fade = p > fadeAt && !reduced.matches
        ? Math.max(0, 1 - (p - fadeAt) / fadeSpan).toFixed(3) : '';
      if (movers) movers.forEach((el) => {
        el.__taroY = y;
        el.style.transform = t;
        el.style.opacity = fade;
      });
      // The standing copy's cue. For a phased scene, when the sink completes;
      // for the plain one, when the descent is most of the way through.
      // Written inline, on change only — see the .taro-dune-later comment.
      // When the standing copy takes over. Masked: as the sink completes.
      // Maskless: once the headline is most of the way through its dissolve —
      // keyed off the fade, not off a third phase value this scene no longer
      // has, which left it waiting until p ~0.98 and never arriving in view.
      const laterCue = maskUrl
        ? (scene.phase ? (scene.phase[2] || 1) - 0.02 : 0.8)
        : Math.min(0.95, fadeAt + 0.72 * fadeSpan);
      const showLater = reduced.matches || p >= laterCue;
      if (showLater !== shownLater) {
        shownLater = showLater;
        keepers.forEach((el) => {
          el.style.opacity = showLater ? '1' : '0';
          el.style.transform = showLater ? 'translateY(0px)' : 'translateY(18px)';
          // So measure() anchors the keep band to the SHOWN position — it was
          // measured 18px low while the blocks waited, and the risen line's
          // top poked above the band and was shaved by the sky mask.
          el.__taroY = showLater ? 0 : 18;
        });
      }
    };

    let shownP = 0, lastFrame = 0, raf = 0;
    const step = (now) => {
      // All the reads first, then the single write below: one layout flush per
      // frame, which is what keeps this from feeling steppy.
      const top = section.getBoundingClientRect().top;
      syncMask();
      const target = targetProgress(top);
      const dt = lastFrame ? Math.min(80, now - lastFrame) : FRAME;
      lastFrame = now;
      shownP += (target - shownP) * (1 - Math.pow(1 - EASE, dt / FRAME));
      if (Math.abs(target - shownP) < 0.0004) shownP = target;
      render(shownP);
      raf = shownP === target ? 0 : requestAnimationFrame(step);
    };

    const request = () => {
      // The mask is reconciled even for visitors who have asked for no motion.
      // The travel is theirs to decline; a mask stranded off the picture is not
      // — and it is exactly these visitors who could never recover from one,
      // because the scroll loop that repairs it is the thing reduced motion
      // switches off. Left as it was, the drift was permanent for them.
      if (reduced.matches) { syncMask(); return; }
      if (raf) return;
      lastFrame = 0;
      raf = requestAnimationFrame(step);
    };

    const relayout = () => {
      measure();
      shownP = targetProgress(section.getBoundingClientRect().top);
      render(shownP);
    };

    relayout();
    // The background is lazy-loaded, so on first run it usually has no intrinsic
    // size yet and photoRect() bails; this is the call that first places things.
    if (!bgImg.complete) bgImg.addEventListener('load', relayout, { once: true });
    window.addEventListener('load', relayout);
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', relayout, { passive: true });
    // The wrapper as well as the section. The section's height is set by
    // Squarespace and rarely changes, but the copy inside it moves whenever it
    // is re-fitted — and it is the copy the mask is measured from.
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(relayout);
      ro.observe(section); ro.observe(wrapper); ro.observe(bgImg);
    }
    // The webfont swap re-flows the copy after everything else has settled.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

    // A ResizeObserver watches size, not position. A wrapper that MOVES without
    // changing size — an alignment change, a row collapsing above it — leaves
    // the mask behind, and nothing reports it: no resize, no observer, and the
    // per-frame reconcile only runs while a scroll is in flight. Standing still
    // on a section, you would just look at it. A quarter-second poll, gated on
    // the section being anywhere near the screen, costs two rects a second.
    let near = true;
    if (typeof IntersectionObserver === 'function') {
      near = false;
      new IntersectionObserver(([e]) => { near = e.isIntersecting; },
        { rootMargin: '250px' }).observe(section);
    }
    // Skipped while the scroll loop is live — step() already reconciles every
    // frame, so the poll only matters when the visitor is standing still.
    const poll = setInterval(() => { if (near && !raf) syncMask(); }, 250);

    // A mask that fails to load takes the copy with it — an unloadable mask
    // image is treated as fully transparent, which would blank the text
    // entirely. Losing the effect is fine; losing the words is not.
    // Only a masked scene has anything to probe; without this the maskless
    // one requested the literal string "null" and logged a 404 per page view.
    if (!maskUrl) return;
    const probe = new Image();
    probe.onerror = () => {
      wrapper.classList.remove('taro-dune-wrap');
      // The listeners and the poll go with it: a scene without its mask has
      // nothing to reconcile, and a timer writing custom properties onto a
      // wrapper that no longer wears them would run forever for nothing.
      clearInterval(poll);
      window.removeEventListener('scroll', request);
      warn(`dune-reveal: ${scene.mask} failed to load`);
    };
    probe.src = maskUrl;
  });
});
