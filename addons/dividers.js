// Silhouette ridge dividers on two homepage seams.
//
// Most of the homepage's sections meet along a flat line: one colour stops, the
// next starts. Two of those joins — the one above the testimonials and the one
// above the closing call to action — are given a ridge instead. A strip is laid
// over the seam in the LOWER section's own colour, cut along the crest of one
// of the site's landscapes, so the lower section appears to rise into the one
// above it the way a dune stands against the sky. The crests are traced from
// the same alpha masks dune-reveal.js sinks its copy behind, so the silhouettes
// are the site's own and not clip-art — the bump a third of the way along the
// dune is the two walkers on its ridge.
//
// Which seams, and which way round:
//
//   The strip belongs to the lower section and reaches UP past the seam. That
//   is not arbitrary. The section under "Every shoot, every film..." carries a
//   -36px margin top and bottom, so it runs underneath its neighbours; what you
//   see as the join is the top edge of the later section, painted over it. A
//   strip hung from the upper section's bottom would sit 36px below the visible
//   line. Hung from the lower section's top, it is on the line by definition,
//   whatever the margins do.
//
//   Stacking is by tree order: the sections are position:relative with no
//   z-index, so a positioned strip placed after the upper section paints over
//   the upper section's background, and, inserted before the lower section's
//   content-wrapper, under the lower section's content. Fluid Engine blocks
//   are grid items carrying z-index 1, 2, ..., which puts the upper section's
//   own copy above the strip — but that is no help where the copy and the
//   ridge share a colour (cream type over a cream ridge), so the ridge is also
//   kept out from under it: see the clearance measurement below.
//
// Only seams that are genuinely a flat colour-to-colour join qualify. Either
// side having a photograph, a video, a gradient or one of Squarespace's own
// dividers takes that seam out — which is also what keeps this away from the
// seams the torn intro and the landscape sections already own.
//
// The ridge sits behind nothing the visitor can read. The distance from the
// seam up to the lowest glyph or box in the upper section is measured once, and
// the ridge is only ever as tall as fits beneath that with its parallax travel
// and a margin to spare. Both ridges share the smaller of their two allowances,
// so the pair read as one gesture. Where even that is under RISE_MIN — on a
// phone the dark section's last line ends ~27px above the seam — the seam is
// left flat rather than drawn as a sliver, and the other ridge stands alone.
//
// That measurement deliberately ignores transforms. scroll-reveal.js parks
// copy that has not yet been revealed 30px below its resting place, and the
// dark section above the testimonials is below the fold when this first runs,
// so a Range.getClientRects() measurement would see its last line 30px too low
// and halve the ridge — and since nothing re-measures when the reveal lands,
// it would stay halved. offsetTop/offsetHeight report layout positions with
// transforms left out, so the clearance is read from where the copy will rest,
// not where an animation happens to have it.
//
// Motion: the strip drifts ±AMP px against the page as its seam crosses the
// viewport, the same scroll-tied, observer-gated, measure-on-event /
// write-transform-only pattern as parallax.js. Foreground sign — the ridge
// climbs as you scroll down, as a near dune would against a far sky. The strip
// continues DIP px below the seam, hidden in the lower section's own colour, so
// the upward travel never opens a gap along the line. Touch devices get the
// ridge without the drift, as with the rest of the site's parallax. Reduced
// motion is consulted live on every frame, not captured at boot.
//
// Progressive enhancement: everything here is additive. No script, no strips —
// the seams stay exactly as flat as Squarespace drew them, and nothing is ever
// hidden waiting on us.

import { defineAddon, css } from '../lib/util.js';

// Declared locally rather than imported: see the note in lib/util.js about
// per-file cache skew breaking the module graph.
const LEAN = window.matchMedia('(hover: none)').matches;

const RISE_MAX = 76;          // px the ridge stands above the seam, at most
const RISE_MIN = 28;          // below this it is not a ridge, it is a smudge — skip the seam
const AMP = LEAN ? 0 : 12;    // parallax travel each way; touch devices get a still ridge
const DIP = AMP + 4;          // px the strip continues below the seam, covering the upward travel
const CLEAR = 6;              // px kept between the crest at full rise and the nearest content above
const VB_H = 120;             // viewBox height the crests were baked into

/**
 * The crests. Each traces the sky/landscape boundary out of the matching mask
 * in assets/ (2000x1333, grey+alpha; opaque over the sky, transparent over the
 * land): for every column the first row with alpha < 128, a 9px median then a
 * box blur (15px for the dune, 25px for Deadvlei's trees), sampled at 200
 * columns, simplified to 60 points, y rescaled so the highest point is 0 and
 * the lowest 120, and closed along the bottom. viewBox 1000 wide, drawn with
 * preserveAspectRatio="none" so it stretches to any width and height.
 *
 * If a mask is re-traced, regenerate these from it — a crest that disagrees
 * with the landscape it is supposed to echo is worse than no crest.
 */
const DUNE = 'M0 120 L25 118.4 L35 117.5 L61 116.0 L71 115.2 L81 114.8 L131 110.9 L136 107.7 L141 103.6 L151 99.0 L156 92.1 L161 87.3 L166 87.7 L171 97.7 L176 107.4 L206 105.4 L211 105.2 L241 103.4 L251 102.6 L256 102.4 L292 99.8 L302 98.9 L312 98.4 L317 97.8 L342 96.1 L372 93.5 L422 88.4 L447 85.8 L518 77.6 L528 76.7 L548 74.6 L593 70.8 L608 69.2 L623 67.1 L628 66.2 L633 64.8 L678 47.1 L683 45.3 L688 43.9 L718 37.3 L759 29.7 L784 25.2 L794 23.1 L804 21.4 L814 19.3 L834 15.8 L849 13.8 L859 12.8 L874 12.6 L889 11.4 L899 9.9 L909 8.0 L919 5.9 L939 0.9 L945 0.0 L950 0.1 L965 1.7 L980 4.1 L995 7.0 L1000 7.7 L1000 120 Z';
const DEADVLEI = 'M0 120 L0 15.0 L5 15.3 L30 18.6 L81 24.4 L111 28.3 L191 42.5 L221 47.0 L246 50.2 L302 56.0 L422 65.0 L427 55.3 L432 35.6 L437 17.6 L442 17.7 L447 8.4 L452 0.0 L462 45.7 L467 59.7 L472 58.6 L477 56.2 L482 50.4 L492 34.5 L497 27.8 L503 19.6 L508 15.2 L518 34.1 L523 41.6 L533 53.6 L553 54.2 L583 54.2 L598 53.7 L633 53.7 L653 53.3 L658 48.8 L663 47.8 L668 49.9 L673 49.1 L678 43.3 L683 36.7 L693 22.6 L698 32.6 L703 46.0 L708 54.1 L718 54.9 L744 57.7 L754 57.1 L759 57.6 L764 59.7 L784 70.3 L794 75.1 L809 81.6 L819 85.4 L854 93.3 L894 104.8 L919 112.6 L929 114.6 L939 117.1 L945 117.8 L970 117.4 L1000 120 Z';
// In page order: the dune's long diagonal above the testimonials, the Deadvlei
// trees above the call to action.
const CRESTS = [DUNE, DEADVLEI];

const SVG_NS = 'http://www.w3.org/2000/svg';
const TRANSPARENT = /^rgba\([^)]*,\s*0\)$|^transparent$/;
// The nearest box whose height is the full run of the text inside it. Inline
// elements report only their first line fragment from offsetHeight, so a
// wrapped link or span is measured by the paragraph around it instead.
const BLOCKS = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, pre, button, div, section';

defineAddon('dividers', () => {
  if (location.pathname !== '/') return;

  // Live, not captured: the user can flip the OS setting mid-session and a
  // stale boolean would keep the ridges drifting. update() reads .matches.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The page's sections, in order, with a box. Squarespace ships hidden
  // breakpoint duplicates (the hero has one) — those have no height and are
  // not part of the seam list. Not anchored on article#sections: the live
  // markup now wraps sections in article#page-regions > section.region, and a
  // selector pinned to the wrapper would find nothing. Footer sections are
  // left out — the seams this is for are all in the body of the page.
  const sections = [...document.querySelectorAll('section.page-section[data-section-id]')]
    .filter((s) => !s.closest('footer'))
    .filter((s) => s.getBoundingClientRect().height > 0);
  if (sections.length < 3) return;

  // Which colour a section shows, or null if it is anything other than a plain
  // colour. Read from .section-background (where Squarespace paints it) first,
  // then its wrapper, then the section itself.
  const paint = (s) => {
    if (s.classList.contains('has-background')) return null;
    if (s.querySelector('.section-background img, .section-background video, [class*="section-divider"]')) return null;
    for (const el of [s.querySelector('.section-background'), s.querySelector('.section-border'), s]) {
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.backgroundImage !== 'none') return null;   // a gradient is not a flat colour
      if (!TRANSPARENT.test(cs.backgroundColor)) return cs.backgroundColor;
    }
    return null;
  };

  const flat = (upper, lower) => {
    if (!upper || !lower) return null;
    const fill = paint(lower);
    if (!fill || !paint(upper) || fill === paint(upper)) return null;
    // The strip is positioned against the lower section and reaches outside
    // its box. Both have to be true of the section for that to work.
    const cs = getComputedStyle(lower);
    if (cs.position === 'static' || cs.overflow !== 'visible') return null;
    return { upper, lower, fill };
  };

  // (a) above the testimonials — the same simple-list the rotator drives;
  // (b) above the call to action — the first section after it with a button.
  // Anchored on content rather than section ids, which Squarespace re-hashes
  // whenever a section is rebuilt in the editor.
  const testimonial = sections.find((s) =>
    [...s.querySelectorAll('ul.user-items-list-item-container')].some((ul) =>
      ul.querySelectorAll('.list-item').length >= 2 && ul.querySelector('.list-item-content__title')));
  const after = testimonial ? sections.slice(sections.indexOf(testimonial) + 1) : [];
  const cta = after.find((s) => s.querySelector('.sqs-block-button-element, .sqs-button-element--primary')) || after[0];
  const prev = (s) => sections[sections.indexOf(s) - 1];

  const seams = [];
  const take = (upper, lower) => {
    const seam = flat(upper, lower);
    if (seam && !seams.some((x) => x.lower === lower)) seams.push(seam);
  };
  if (testimonial) take(prev(testimonial), testimonial);
  if (cta) take(prev(cta), cta);
  // Fewer than two — one of the anchors is gone, or its seam is no longer a
  // plain join — so make the count up from whatever flat seams the page has,
  // in order. The exclusions in paint() still keep this off the landscapes.
  for (let i = 1; i < sections.length && seams.length < 2; i++) take(sections[i - 1], sections[i]);
  seams.sort((a, b) => sections.indexOf(a.lower) - sections.indexOf(b.lower));
  if (!seams.length) return;

  css('dividers', `
    .taro-ridge {
      position: absolute;
      left: 0; right: 0;
      width: 100%;
      display: block;
      pointer-events: none;
      /* top and height are set inline from the measured rise */
    }
    /* The hint is granted only while the seam is near the viewport, as in
       parallax.js — will-change pins a layer for as long as it is set. */
    .taro-ridge--near { will-change: transform; }
    @media (prefers-reduced-motion: reduce) {
      .taro-ridge { transform: none !important; }
    }
  `);

  seams.forEach((seam, i) => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'taro-ridge');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    // The crest fills the top `rise` px of the strip and is closed at y=120,
    // which measure() maps onto the seam by sizing the viewBox. The rect
    // beneath it carries the fill on down through the DIP; it is drawn taller
    // than it can ever need to be and the viewport clips it.
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', CRESTS[i % CRESTS.length]);
    path.setAttribute('fill', seam.fill);
    const under = document.createElementNS(SVG_NS, 'rect');
    under.setAttribute('x', '0');
    under.setAttribute('y', String(VB_H));
    under.setAttribute('width', '1000');
    under.setAttribute('height', String(VB_H));
    under.setAttribute('fill', seam.fill);
    svg.append(path, under);
    // Before the content-wrapper: painted over the lower section's background
    // and the whole of the upper section, under the lower section's content.
    seam.lower.insertBefore(svg, seam.lower.querySelector(':scope > .content-wrapper'));
    seam.svg = svg;
    seam.top = 0;        // document y of the seam — the lower section's top edge
    seam.rise = 0;       // px the ridge stands above the seam, 0 = not drawn
    seam.near = false;
  });

  // Layout bottom of an element, in px below its section's top edge, with
  // transforms left out of it (see the header). Summed up the offsetParent
  // chain; the section is position:relative so the chain passes through it.
  // Null if the chain misses the section — a breakpoint duplicate with no box,
  // or something reparented out — and the caller skips it.
  const layoutBottom = (el, section) => {
    if (!el.offsetHeight) return null;
    let y = el.offsetHeight;
    for (let n = el; n && n !== section; n = n.offsetParent) {
      if (n === document.body) return null;
      y += n.offsetTop;
    }
    return y;
  };

  // The lowest point of anything visible in the upper section, in px below
  // its top: the block around every non-empty run of text, plus the boxes
  // that carry their own paint (buttons, media, rules). Our own strips are
  // excluded — the testimonial section is the lower side of one seam and the
  // upper side of the next.
  const contentBottom = (section) => {
    let bottom = -Infinity;
    const seen = new Set();
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.nodeValue.trim() || !n.parentElement) continue;
      if (n.parentElement.closest('style, script, noscript, template, svg')) continue;
      const box = n.parentElement.closest(BLOCKS) || n.parentElement;
      if (box === section || seen.has(box)) continue;
      seen.add(box);
      const b = layoutBottom(box, section);
      if (b !== null) bottom = Math.max(bottom, b);
    }
    section.querySelectorAll('button, .sqs-block-button-element, img, video, iframe, hr, svg:not(.taro-ridge)')
      .forEach((el) => {
        const b = layoutBottom(el, section);
        if (b !== null) bottom = Math.max(bottom, b);
      });
    return bottom;
  };

  // Cheap: one rect per seam. Run whenever the seam may have moved — a lazy
  // image above it loading, a rotator re-laying its list.
  const locate = () => {
    seams.forEach((seam) => { seam.top = seam.lower.getBoundingClientRect().top + window.scrollY; });
  };

  // Everything a frame needs, taken on the rare events that can change it:
  // layout, fonts, the breakpoint. Never per frame.
  let vh = window.innerHeight;
  const measure = () => {
    vh = window.innerHeight;
    locate();
    seams.forEach((seam) => {
      const upperTop = seam.upper.getBoundingClientRect().top + window.scrollY;
      const clearance = seam.top - (upperTop + contentBottom(seam.upper));
      seam.rise = Math.min(RISE_MAX, Math.floor(clearance - AMP - CLEAR));
    });
    // One height for the pair, or none for a seam that cannot take it.
    const allowed = seams.filter((s) => s.rise >= RISE_MIN).map((s) => s.rise);
    const rise = allowed.length ? Math.min(...allowed) : 0;
    seams.forEach((seam) => {
      const on = seam.rise >= RISE_MIN;
      seam.rise = on ? rise : 0;
      // Written only when changed: this runs from a slow poll as well as
      // from events, and a no-op style write still invalidates.
      if (seam.drawn === seam.rise) return;
      seam.drawn = seam.rise;
      if (!on) { seam.svg.style.display = 'none'; return; }
      // The viewBox is sized so the crest's closing line (y = VB_H) lands
      // exactly on the seam and the rect runs on for the DIP below it.
      seam.svg.setAttribute('viewBox', `0 0 1000 ${(VB_H * (rise + DIP) / rise).toFixed(2)}`);
      seam.svg.style.top = `${-rise}px`;
      seam.svg.style.height = `${rise + DIP}px`;
      seam.svg.style.display = '';
    });
  };

  let queued = false;
  const update = () => {
    queued = false;
    if (LEAN) return;    // the ridge stands still on touch; nothing to write
    if (reduceMotion.matches) {
      // Clear rather than freeze, so nothing is left shifted once motion is off.
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
  const remeasure = () => { measure(); request(); };

  // The webfont re-flows the copy above each seam, and the clearance with it.
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('load', remeasure);
  document.fonts?.ready?.then(remeasure);

  // The observer gates both the scroll handler and the slow poll below — on
  // touch there is no drift to drive, but the poll still should not force
  // layout once a second for seams nowhere near the screen. Without
  // IntersectionObserver `near` simply stays true — always on, still correct.
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
      // Arriving is also the moment to refresh where the seam is.
      if (anyNear) locate();
      request();
    }, { rootMargin: '30% 0px' });
    seams.forEach((seam) => io.observe(seam.svg));
  } else {
    seams.forEach((seam) => { seam.near = true; });
  }
  if (!LEAN) {
    // The scroll handler is inert for any seam that is not close.
    window.addEventListener('scroll', () => { if (anyNear) request(); }, { passive: true });
    // A flip of the setting should take effect immediately, not on the next
    // scroll. Older Safari lacks addEventListener on MediaQueryList; for it
    // the next scroll frame picks the change up anyway.
    reduceMotion.addEventListener?.('change', request);
  }

  // The document keeps growing as lazy images above load, the rotator
  // re-lays its list, a text sizer re-fits a heading — and nothing announces
  // any of it. A slow poll, gated on being near a seam, keeps the cached seam
  // position and the clearance honest.
  setInterval(() => { if (anyNear) remeasure(); }, 1000);

  remeasure();
});
