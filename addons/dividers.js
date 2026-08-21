// Silhouette ridge dividers, on exactly two homepage seams.
//
// Most of the homepage's sections meet along a ruled line: one flat colour
// stops, the next starts. Two of those joins get a horizon instead — a strip
// laid over the seam, cut along the crest of one of the site's own landscapes
// and filled in the LOWER section's colour, so the lower section appears to
// rise into the upper one the way a dune stands against the sky.
//
//   seam A   the dark quote band  ->  the cream testimonials   (dune crest)
//   seam B   the cream testimonials -> the red closing CTA     (Deadvlei crest)
//
// Two, and only these two. The intro tear owns the top of the page, the dune
// and Deadvlei sections own their own edges, and film-strip.js owns the seam
// above the footer. This add-on never looks at any of them: it finds its two
// seams by the content that identifies them and stops. There is deliberately
// no "and if that fails, decorate whatever flat seam you can find" fallback —
// that is precisely how a divider ends up sitting on the tear.
//
// WHY THE STRIP HANGS FROM THE LOWER SECTION, NOT THE UPPER ONE
//
//   The dark quote band's box does not end where the seam looks like it does.
//   It runs 36px past it (a negative margin, so the band tucks under its
//   neighbours) and what a visitor reads as the join is the top edge of the
//   testimonials section painted over it — measure it on the live page and the
//   band's box bottom is 5304 while the testimonials top is 5268. A strip hung
//   from the upper section's bottom edge therefore lands 36px low. Hung from
//   the lower section's top edge it is on the line by definition, whatever the
//   margins are doing. That also makes the placement self-maintaining: `top`
//   is measured from the section's own border box, so lazy images loading
//   higher up the page move the strip and the seam together, and nothing has
//   to be recomputed.
//
// STACKING, WHICH IS ALL TREE ORDER
//
//   The strip carries no z-index on purpose. Positioned, z-index:auto, it
//   paints in tree order: above everything earlier in the document (the whole
//   of the upper section, background included) and below everything later
//   (the lower section's own content, which is why it goes in before the
//   content-wrapper rather than after it). Squarespace's Fluid Engine blocks
//   carry z-index 1, 2, 3..., so the upper section's copy also paints over the
//   ridge — which is no help at all where the copy and the ridge are the same
//   colour, cream type over a cream ridge being exactly seam B. So the ridge
//   is kept out from under the copy as well; see the clearance pass below.
//
// PROGRESSIVE ENHANCEMENT
//
//   Everything here is additive. No script, no strips, two flat seams — which
//   is what Squarespace draws anyway. Nothing is hidden waiting on us, and
//   nothing the visitor can read is ever covered.

import { defineAddon, css } from '../lib/util.js';

// Declared here rather than imported: lib/util.js is cached separately by
// Pages, so a new export can pair with a stale copy and take the whole module
// graph down. See the note in that file.
const LEAN = window.matchMedia('(hover: none)').matches;

const RISE_MAX = 84;        // px the ridge stands above the seam, at most
const RISE_MIN = 30;        // under this it reads as a smudge, not a horizon — skip the seam
const AMP = LEAN ? 0 : 12;  // parallax travel each way; touch gets a still ridge
const DIP = AMP + 6;        // px the strip runs on below the seam, covering the upward travel
const CLEAR = 8;            // px kept between the crest at full rise and the copy above it
const VB_W = 1000;          // the crests were baked at this width...
const VB_H = 120;           // ...and this height

/**
 * The crests, traced offline from the repo's own alpha masks — the same masks
 * dune-reveal.js sinks the homepage copy behind, so these silhouettes are the
 * site's photographs and not clip-art.
 *
 * Method, for whoever has to redo this after a re-crop (assets/dune-sky.png
 * and assets/deadvlei-sky.png, 2000x1333, grey+alpha, opaque over the sky and
 * transparent where the land stands): for each of 200 evenly spaced columns
 * take the first row whose ALPHA byte drops below 128, run a 9-sample median
 * and then a box blur (15 wide for the dune, 25 for Deadvlei — its dead trees
 * are one or two pixels across and a lone spike at this scale reads as a
 * rendering fault, not a tree), rescale y so the highest point of the crest is
 * 0 and the lowest 120, and simplify with Douglas–Peucker to 60 points.
 *
 * Both are closed down to y=120, which is the seam line: the fill sits BELOW
 * the crest. Drawn with preserveAspectRatio="none", so the viewBox stretches
 * to whatever width and height the strip is given.
 *
 * The dune climbs left-to-right and Deadvlei falls left-to-right, so the two
 * seams mirror each other down the page rather than repeating. The slight
 * plateau in the dune around x=180 is real — it is the pair of walkers on the
 * ridge in that frame. Do not smooth it out.
 */
const DUNE_CREST =
  'M0 120 L35 118.9 L60 117.3 L95 114.7 L101 114.1 L106 113.2 L111 112.2 L121 110.0 L136 106.9 L151 105.5 L171 104.0 L176 103.9 L186 104.2 L196 105.0 L211 105.9 L226 105.1 L261 102.8 L307 99.4 L342 96.5 L367 94.2 L402 90.8 L447 85.9 L497 80.0 L523 77.1 L548 74.5 L573 72.2 L593 70.1 L598 69.5 L603 68.8 L613 67.0 L623 64.9 L633 62.3 L643 59.2 L653 55.9 L673 48.8 L683 45.5 L688 43.9 L698 41.0 L709 38.4 L714 37.2 L724 35.0 L744 30.9 L804 19.2 L824 15.6 L834 14.1 L844 12.8 L874 9.5 L889 7.7 L899 6.3 L925 2.4 L930 1.7 L940 0.7 L945 0.3 L955 0.0 L965 0.1 L970 0.1 L975 0.1 L985 0.5 L995 1.0 L1000 1.4 L1000 120 Z';

const DEADVLEI_CREST =
  'M0 120 L0 0.0 L60 4.2 L80 7.2 L106 11.5 L141 18.1 L181 26.1 L196 28.9 L226 34.3 L246 37.5 L276 41.6 L302 44.5 L337 48.2 L352 49.6 L367 50.8 L372 49.2 L392 41.3 L397 39.6 L422 37.4 L427 36.5 L442 32.6 L457 28.5 L462 27.4 L492 24.5 L497 26.0 L518 33.3 L523 34.9 L548 35.7 L553 36.3 L583 41.8 L588 42.4 L608 42.3 L623 40.6 L638 39.0 L658 39.0 L683 39.7 L704 40.6 L714 41.6 L719 42.3 L729 44.1 L734 45.1 L739 46.7 L754 52.5 L764 56.6 L779 61.6 L799 68.8 L814 74.7 L834 83.1 L854 90.7 L864 94.3 L874 97.7 L884 100.8 L894 103.8 L910 107.8 L920 110.2 L930 112.4 L940 114.4 L955 116.3 L970 118.0 L985 119.2 L1000 120.0 Z';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TRANSPARENT = /^rgba\([^)]*,\s*0\)$|^transparent$/;

// What the clearance pass treats as "something a visitor can read". Deliberately
// text-level rather than the .sqs-block wrappers around it: a Fluid Engine block
// is a grid area and can be a great deal taller than the line of type inside it,
// which would shrink every ridge to nothing.
const READABLE = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, pre, '
               + '.sqs-block-button-element, button, img, video, iframe, hr';

// "READY? LET'S TALK", however it is typed — curly apostrophe, stray spacing,
// and lower-case in the DOM under a text-transform.
const CTA_LABEL = /ready\W+let'?s\s*talk/;
const normalise = (t) => t.replace(/[‘’ʼ]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();

defineAddon('dividers', () => {
  if (location.pathname !== '/') return;

  // Kept as the live MediaQueryList, never read into a boolean at boot: the OS
  // setting can be flipped mid-visit and a frozen capture would leave the
  // ridges drifting for the rest of the session. update() reads .matches at
  // the moment it decides.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Every laid-out body section, in order. Not anchored on article#sections —
  // the live markup wraps these in article#page-regions > section.region and a
  // selector pinned to the old wrapper finds nothing. Footer sections carry
  // data-section-id too and are excluded outright. So is anything an add-on
  // put there (film-strip's contact sheet sits just above the footer); if one
  // of those ever arrives as a <section>, it is not a seam of ours.
  const sections = [...document.querySelectorAll('section[data-section-id]')]
    .filter((s) => !s.closest('footer'))
    .filter((s) => !/(?:^|\s)taro-/.test(s.className))
    .filter((s) => s.getBoundingClientRect().height > 0);
  if (sections.length < 3) return;

  // --- finding the two seams, by content -----------------------------------
  // Section ids are re-hashed every time a section is rebuilt in the editor and
  // pixel offsets change with every copy edit, so neither is an anchor. What
  // does not move: the testimonials are the only simple-list on the page, and
  // the closing CTA is the only button that says READY? LET'S TALK.

  const testimonials = sections.find((s) => s.querySelector('ul.user-items-list-item-container'));

  const below = testimonials ? sections.slice(sections.indexOf(testimonials) + 1) : [];
  const ctaButton = [...document.querySelectorAll('.sqs-block-button-element, .sqs-button-element--primary, button, a')]
    .find((el) => CTA_LABEL.test(normalise(el.textContent || '')));
  const cta = (ctaButton && below.find((s) => s.contains(ctaButton)))
    // If the copy on that button is ever rewritten, fall back to the first
    // section below the testimonials carrying a button block. Still content,
    // still constrained to below the testimonials — so it can never wander up
    // the page onto a landscape seam even if the whole CTA is deleted.
    || below.find((s) => s.querySelector('.sqs-block-button-element, .sqs-button-element--primary'));

  // Which flat colour a section actually shows, or null if it shows anything
  // else. Squarespace paints section colour on a .section-background child;
  // the section itself, and then its ancestors, are the fallbacks for a
  // section that paints nothing of its own and lets the page show through.
  const paintOf = (section) => {
    // A DESCENDANT lookup, not a child one. Squarespace nests the colour layer
    // inside .section-border, so ':scope > .section-background' matched nothing
    // here: every section then fell through to the page's own cream, every pair
    // of sections read as the same colour, and every seam was rejected as
    // having no edge to draw. The add-on mounted and drew nothing at all.
    const layer = section.querySelector('.section-background, .section-border');
    // A photograph, a video or a gradient is not a colour we can match, and a
    // seam we cannot match is a seam we leave alone. This is also the check
    // that would stand the add-on down if it were ever pointed at one of the
    // landscape sections.
    if (layer && (layer.querySelector('img, video, picture, canvas')
                  || getComputedStyle(layer).backgroundImage !== 'none')) return null;
    for (const el of [layer, section]) {
      if (!el) continue;
      const bg = getComputedStyle(el).backgroundColor;
      if (!TRANSPARENT.test(bg)) return bg;
    }
    for (let n = section.parentElement; n; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (!TRANSPARENT.test(bg)) return bg;
    }
    return null;
  };

  const seamFor = (lower, crest) => {
    if (!lower) return null;
    const upper = sections[sections.indexOf(lower) - 1];
    if (!upper) return null;
    const fill = paintOf(lower);
    const above = paintOf(upper);
    // Both sides have to be a flat colour, and they have to be different
    // colours — otherwise there is no seam to draw a horizon on.
    if (!fill || !above || fill === above) return null;
    // The strip is positioned against the lower section and reaches outside
    // its box, so the section must not clip. If it does, a flat seam is the
    // right answer; a ridge sliced off at the section edge is not.
    const cs = getComputedStyle(lower);
    if (cs.overflow !== 'visible' || cs.overflowY !== 'visible') return null;
    return { upper, lower, fill, crest, static: cs.position === 'static' };
  };

  const seams = [
    seamFor(testimonials, DUNE_CREST),
    seamFor(cta, DEADVLEI_CREST),
  ].filter(Boolean);
  if (!seams.length) return;

  css('dividers', `
    .taro-ridge {
      position: absolute;
      left: 0;
      right: 0;
      width: 100%;
      display: block;
      pointer-events: none;
      /* No z-index: see the header. Tree order is doing the work, and giving
         this a stacking level would put it over the copy above the seam. */
      /* top and height are written inline, from the measured rise. */
    }
    /* Only ever added to a section computed static, so this changes nothing
       about where anything sits — it just gives the strip something to be
       absolute against. A sticky section is left alone rather than flattened. */
    .taro-ridge-host { position: relative; }
    /* will-change pins a compositor layer for as long as it is set, so the
       hint is granted on approach and withdrawn on the way out, as in
       parallax.js — not stamped on at boot. */
    .taro-ridge--near { will-change: transform; }
    /* Belt and braces with the live check in update(): the browser
       re-evaluates this the instant the OS setting changes. */
    @media (prefers-reduced-motion: reduce) {
      .taro-ridge { transform: none !important; }
    }
  `);

  seams.forEach((seam) => {
    if (seam.static) seam.lower.classList.add('taro-ridge-host');

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'taro-ridge');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    // Born hidden. Its top and height do not exist until measure() has run, and
    // an SVG with neither would take its static position and a default box for
    // however long that takes — a grey slab across the seam if anything below
    // ever throws before the first measure.
    svg.style.display = 'none';

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', seam.crest);
    path.setAttribute('fill', seam.fill);

    // The crest closes at y=120, which measure() puts exactly on the seam. This
    // carries the same fill on down through the DIP below it, so the upward
    // half of the parallax can never open a hairline along the line. It is
    // drawn far taller than it can ever need to be; the SVG viewport clips it.
    const skirt = document.createElementNS(SVG_NS, 'rect');
    skirt.setAttribute('x', '0');
    skirt.setAttribute('y', String(VB_H));
    skirt.setAttribute('width', String(VB_W));
    skirt.setAttribute('height', String(VB_H * 3));
    skirt.setAttribute('fill', seam.fill);

    svg.append(path, skirt);
    // Before the content-wrapper: over the lower section's background and the
    // whole of the upper section, under the lower section's own content.
    seam.lower.insertBefore(svg, seam.lower.querySelector(':scope > .content-wrapper'));

    seam.svg = svg;
    seam.top = 0;      // document y of the seam = the lower section's top edge
    seam.rise = 0;     // px the ridge stands above it; 0 means not drawn
    seam.drawn = -1;   // what was last written, so no-op style writes are skipped
    seam.near = false;
  });

  // --- measurement ---------------------------------------------------------

  // Layout position of an element's bottom, summed up the offsetParent chain.
  // This ignores transforms, and that is the entire point: scroll-reveal.js
  // parks copy that has not been revealed yet 30px below where it will rest,
  // and the dark quote band is well below the fold when this first runs. A
  // getBoundingClientRect() reading would see that last line 30px too low,
  // halve the ridge, and — since nothing re-measures when the reveal lands —
  // leave it halved for the whole visit.
  const layoutBottom = (el) => {
    let y = el.offsetHeight;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  };
  const layoutTop = (el) => {
    let y = 0;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  };

  // The lowest readable thing in the upper section. Elements with no box are
  // skipped — Squarespace ships hidden breakpoint duplicates — and since this
  // is a maximum, anything mismeasured small is harmless; only a value that is
  // too LARGE would let a ridge climb over the copy, and there is nothing here
  // that can report too large.
  const contentBottom = (section) => {
    let bottom = -Infinity;
    section.querySelectorAll(READABLE).forEach((el) => {
      if (!el.offsetHeight) return;
      if (el.closest('.section-background')) return;
      bottom = Math.max(bottom, layoutBottom(el));
    });
    return bottom;
  };

  // Cheap — one rect per seam. The seam position is needed only to phase the
  // ±12px drift, so this is refreshed on events and on a slow poll rather than
  // being read anywhere near a frame.
  const locate = () => {
    const y = window.scrollY;
    seams.forEach((seam) => { seam.top = seam.lower.getBoundingClientRect().top + y; });
  };

  let vh = window.innerHeight;
  const measure = () => {
    vh = window.innerHeight;
    locate();

    seams.forEach((seam) => {
      const bottom = contentBottom(seam.upper);
      // An upper section with nothing readable in it can take a full ridge.
      const clearance = bottom === -Infinity
        ? RISE_MAX + AMP + CLEAR
        : layoutTop(seam.lower) - bottom;
      // The travel is reserved whether or not motion is on right now. The OS
      // setting can be turned back on mid-visit and nothing re-measures when it
      // is, so a ridge sized without room to drift would climb over the copy
      // the moment it started moving.
      seam.rise = Math.min(RISE_MAX, Math.floor(clearance - AMP - CLEAR));
    });

    // One height for the pair. Two ridges of visibly different heights a
    // section apart read as a mistake rather than as a motif, so the shallower
    // clearance sets both. Where a seam cannot manage even RISE_MIN — on a
    // narrow phone the quote's last line lands within about 27px of the seam —
    // that seam stays flat and the other one carries the idea alone. Better a
    // ruled line than a sliver.
    const room = seams.filter((s) => s.rise >= RISE_MIN).map((s) => s.rise);
    const rise = room.length ? Math.min(...room) : 0;

    seams.forEach((seam) => {
      const on = seam.rise >= RISE_MIN ? rise : 0;
      seam.rise = on;
      // measure() also runs from a poll, and even a style write that changes
      // nothing costs an invalidation.
      if (seam.drawn === on) return;
      seam.drawn = on;
      if (!on) { seam.svg.style.display = 'none'; return; }
      // Size the viewBox so the crest band occupies exactly the top `rise` px
      // and its closing line lands on the seam, leaving the skirt to fill the
      // DIP below.
      seam.svg.setAttribute('viewBox', `0 0 ${VB_W} ${(VB_H * (on + DIP) / on).toFixed(2)}`);
      seam.svg.style.top = `${-on}px`;
      seam.svg.style.height = `${on + DIP}px`;
      seam.svg.style.display = '';
    });
  };

  // --- motion --------------------------------------------------------------
  // Foreground sign: the ridge climbs as the page scrolls down, the way a near
  // dune rises against a far sky. Nothing in here reads layout — every number
  // it uses was cached by measure() or locate() — and nothing but a transform
  // is written.

  let queued = false;
  const update = () => {
    queued = false;
    if (LEAN) return;
    if (reduceMotion.matches) {
      // Cleared, not frozen: switching motion off should leave nothing shifted.
      seams.forEach((seam) => { seam.svg.style.transform = ''; });
      return;
    }
    const mid = vh / 2;
    const y = window.scrollY;
    seams.forEach((seam) => {
      if (!seam.near || !seam.rise) return;
      // -1 while the seam is still below the fold, +1 once it is above it.
      const progress = Math.max(-1, Math.min(1, (mid - (seam.top - y)) / mid));
      seam.svg.style.transform = `translate3d(0, ${(-progress * AMP).toFixed(2)}px, 0)`;
    });
  };
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  const refresh = () => { measure(); request(); };

  // --- when to re-measure --------------------------------------------------

  // The observer gates the scroll handler and the poll below. Without it
  // `near` simply stays true — the old always-on behaviour, correct if not as
  // cheap. Arriving is also the moment to refresh where the seam is.
  let anyNear = true;
  if (typeof IntersectionObserver === 'function') {
    anyNear = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const seam = seams.find((s) => s.svg === e.target);
        if (!seam) return;
        seam.near = e.isIntersecting;
        if (!LEAN) seam.svg.classList.toggle('taro-ridge--near', seam.near);
      });
      anyNear = seams.some((s) => s.near);
      if (anyNear) locate();
      request();
    }, { rootMargin: '30% 0px' });
    seams.forEach((seam) => io.observe(seam.svg));
  } else {
    seams.forEach((seam) => { seam.near = true; });
  }

  if (!LEAN) {
    window.addEventListener('scroll', () => { if (anyNear) request(); }, { passive: true });
    // A flip of the OS setting should land immediately rather than on the next
    // scroll. Older Safari has no addEventListener on MediaQueryList; there the
    // next scroll frame picks it up anyway, and the CSS media query above has
    // already zeroed the transform regardless.
    reduceMotion.addEventListener?.('change', request);
  }

  // TAN Nimbus arrives late and re-flows the quote above seam A, which changes
  // the clearance and therefore the rise. So does a breakpoint change.
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('load', refresh);
  document.fonts?.ready?.then(refresh);

  // The testimonial rotator re-lays its list and a text fitter can re-size a
  // heading, neither of which fires any event we are listening for. A
  // ResizeObserver on the two upper sections catches both. Where it is missing,
  // the poll below is the whole backstop.
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(refresh);
    seams.forEach((seam) => { ro.observe(seam.upper); ro.observe(seam.lower); });
  }

  // And the document keeps growing underneath all of that as lazy images above
  // the fold decode, which moves the seam without changing either section's
  // size. One rect per seam, once a second, and only while a seam is near the
  // screen — the same slow-poll backstop signature.js uses for the same reason.
  setInterval(() => { if (anyNear) locate(); }, 1000);

  refresh();
});
