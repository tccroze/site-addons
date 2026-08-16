// Sections whose copy sinks into the landscape as you scroll, passing behind
// whatever stands against the sky — dead trees, a dune ridge, two walkers on it.
//
// This used to work by laying a second copy of the photograph over the text and
// punching the sky out of it, so the trees and figures were redrawn on top. That
// is the obvious way to do it and it was wrong: it asks two independently
// resolved images to land on precisely the same pixel, and any disagreement
// prints a second, offset copy of whatever stands against the sky.
//
// So there is no second photograph. The *text* carries the cut-out: each block
// that should sink is masked with the inverse silhouette — opaque across the
// sky, transparent everywhere the landscape stands — so the copy is erased as it
// descends past the ridge. Squarespace's own background is the only image on
// screen and nothing can misregister against it.
//
// Three things this file has learned the hard way:
//
//   1. A mask travels with its own element. So the mask goes on the block and
//      the movement goes on the block's child — mask the thing that slides and
//      the sky slides with it, occluding nothing.
//
//   2. Where a block sits is not stable after load. Squarespace's scaled-text
//      sizer re-fits the copy once it has measured it, the webfont swaps, and
//      lifting the button out of the grid drops a row. None of that resizes the
//      section, so a placement measured once at load quietly slides off the
//      picture — and a mask slid up by a couple of hundred pixels puts the men's
//      silhouettes in open sky, where they cut people-shaped holes out of the
//      letters. It is reconciled every frame now, and written only when it has
//      actually drifted.
//
//   3. Only the copy that is meant to sink may wear a mask. Masking the whole
//      content wrapper also erased the copy sitting further down the section —
//      "YOUR STORY DESERVES TO BE TOLD" and "Stills. Motion. Paint." were below
//      the ridge line, so they were transparent from the moment the page loaded
//      and no amount of scrolling brought them back.
//
// Nothing here is destructive: no markup is added inside the section apart from
// the CTA being reparented, and every change is a class or a custom property.

import { defineAddon, css, warn } from '../lib/util.js';

const ASSET = (name) => new URL(`../assets/${name}`, import.meta.url).href;

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
const SCENES = [
  // `lift` raises the copy before it starts falling. The print section already
  // holds its copy near the top of the picture, so lifting it there only pushed
  // it out under the header — it is the dune section, where Squarespace centres
  // the copy in a very tall section, that needs the room.
  { match: /deadvlei/i, mask: 'deadvlei-sky.png', ridge: 0.60, lift: 0, taller: true },
  { match: /\bdune\.jpg/i, mask: 'dune-sky.png', ridge: 0.58, lift: 0.14, taller: false },
];

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
const SPAN_MIN = 0.55;    // ...but never quicker than this, in viewport heights
const BURY = 0.07;        // clearance past the ridge, in viewport heights
const EASE = 0.16;        // proportion of the remaining distance closed per frame
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
  if (document.querySelector('.taro-dune-block')) return;

  const sections = [...document.querySelectorAll('article#sections > section')];
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
    /* The wearer of the cut-out: one masked block per line of sinking copy,
       each placed in pixels computed from the background photograph's own drawn
       rectangle so the sky in the mask sits exactly over the sky in the picture.
       It must not move — the travel goes on its child. */
    .taro-dune-block {
      /* The mask carries its cut-out in the ALPHA channel, and CSS mask-image
         reads alpha by default — a plain greyscale PNG is fully opaque here. */
      -webkit-mask-image: var(--taro-sky);   mask-image: var(--taro-sky);
      -webkit-mask-mode: alpha;              mask-mode: alpha;
      -webkit-mask-size: var(--taro-sky-size);      mask-size: var(--taro-sky-size);
      -webkit-mask-position: var(--taro-sky-pos);   mask-position: var(--taro-sky-pos);
      -webkit-mask-repeat: no-repeat;        mask-repeat: no-repeat;
    }
    .taro-dune-block > * { will-change: transform; }

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
      .taro-dune-section--taller { min-height: min(1100px, 76vw); }
    }

    /* The call to action is lifted out of the sinking copy and parked at the
       foot of the photograph — outside any masked block, so the landscape never
       eats it. Everything else is meant to be swallowed; a button that
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

    @media (prefers-reduced-motion: reduce) {
      .taro-dune-block > * { transform: none !important; }
    }
  `);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  found.forEach(({ scene, section }) => {
    const bgImg = section.querySelector('.section-background img');
    const wrapper = section.querySelector('.content-wrapper');
    const content = wrapper && (wrapper.querySelector(':scope > .content') || wrapper.firstElementChild);
    if (!bgImg || !wrapper || !content) return;

    const maskUrl = ASSET(scene.mask);
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

    let travel = 0, lift = 0, span = 1, curY = 0;
    let dw0 = NaN, dh0 = NaN;
    let focal = ['50%', '50%'];
    /** [{ el, inner }] — the blocks that start in the sky and therefore sink. */
    let blocks = null;

    /** Where the photograph is actually drawn, in viewport pixels. Reproduces
     *  object-fit: cover from the image element's own box, so however
     *  Squarespace insets .section-background the mask follows it. */
    const photoRect = () => {
      const box = bgImg.getBoundingClientRect();
      const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
      if (!box.width || !box.height || !iw || !ih) return null;
      const scale = Math.max(box.width / iw, box.height / ih);
      const dw = iw * scale, dh = ih * scale;
      return {
        left: box.left + axis(focal[0], box.width - dw),
        top: box.top + axis(focal[1], box.height - dh),
        dw, dh,
      };
    };

    // Reconciled against live geometry on every frame the scroll loop runs, and
    // written only when it has actually drifted. The reads are free: the loop
    // already takes a bounding rect for its own progress, so these join that
    // same batch and cost no extra layout flush, and the write — the part that
    // would repaint — happens only on the rare frame where something moved.
    const syncMask = () => {
      if (!blocks) return;
      const p = photoRect();
      if (!p) return;
      dw0 = p.dw; dh0 = p.dh;
      blocks.forEach((b) => {
        const r = b.el.getBoundingClientRect();
        // mask-position is measured from the masked element's own border box.
        const mx = p.left - r.left;
        const my = p.top - r.top;
        if (Math.abs(mx - b.mx) < 0.5 && Math.abs(my - b.my) < 0.5
            && Math.abs(p.dw - b.dw) < 0.5 && Math.abs(p.dh - b.dh) < 0.5) return;
        b.mx = mx; b.my = my; b.dw = p.dw; b.dh = p.dh;
        b.el.style.setProperty('--taro-sky-size', `${p.dw.toFixed(2)}px ${p.dh.toFixed(2)}px`);
        b.el.style.setProperty('--taro-sky-pos', `${mx.toFixed(2)}px ${my.toFixed(2)}px`);
      });
    };

    /** Choose which blocks sink: the ones whose top starts in the sky. Anything
     *  already below the ridge is other copy that lives further down the
     *  section, and masking it would simply delete it. */
    const pickBlocks = () => {
      const p = photoRect();
      if (!p) return false;
      const ridgeY = p.top + scene.ridge * p.dh;
      const chosen = [];
      content.querySelectorAll('.fe-block').forEach((el) => {
        if (!el.querySelector('h1, h2, h3, h4, p')) return;
        const inner = el.firstElementChild;
        if (!inner) return;
        // The block itself never moves — only its child does — so its own box
        // is always the resting position, whatever the travel is doing.
        if (el.getBoundingClientRect().top >= ridgeY) return;
        chosen.push({ el, inner, mx: NaN, my: NaN, dw: NaN, dh: NaN });
      });
      if (!chosen.length) return false;
      blocks = chosen;
      blocks.forEach((b) => {
        b.el.classList.add('taro-dune-block');
        b.el.style.setProperty('--taro-sky', `url("${maskUrl}")`);
      });
      return true;
    };

    const measure = () => {
      const vh = window.innerHeight || 0;
      const secRect = section.getBoundingClientRect();
      // How far the section can scroll while still covering the window. Short
      // sections get a floor, or the whole descent would happen in a few dozen
      // pixels of wheel and read as a jump rather than a movement.
      span = Math.max(secRect.height - vh, SPAN_MIN * vh);
      // Desktop only. The intro's torn paper edge hangs over the top of this
      // section by design, and on a phone that overhang reaches far enough down
      // that raising the copy tucked its first line underneath the tear — you
      // could read "ART" and nothing else. There is no shortage of sky on a
      // phone anyway: the section is taller than the viewport, so the copy has
      // plenty of travel without being lifted into the paper.
      lift = window.innerWidth >= 768 ? (scene.lift || 0) * vh : 0;
      focal = (getComputedStyle(bgImg).objectPosition || '50% 50%').split(/\s+/);
      if (!focal[1]) focal[1] = '50%';

      if (!blocks && !pickBlocks()) return;
      const p = photoRect();
      if (!p) return;

      // How far the copy must fall to be gone. Measured from the TOP of the
      // highest sinking line to the ridge: reaching it with the bottom edge
      // leaves the whole line still standing above the sand, which is what it
      // did — the copy slid off the top of the window with the dune never quite
      // catching it.
      let top = Infinity;
      blocks.forEach((b) => { top = Math.min(top, b.el.getBoundingClientRect().top); });
      const ridgeY = p.top + scene.ridge * p.dh;
      travel = Math.max(0, Math.min(ridgeY - top + BURY * vh, 1.8 * span));
      syncMask();
    };

    // Zero until the section's top reaches the top of the window, then all the
    // way through while it still fills it.
    const targetProgress = (top) => Math.max(0, Math.min(1, -top / span));

    // No scale, deliberately. Scaling a full-width block by even a few percent
    // pushes it past the viewport and the document grows a horizontal scrollbar,
    // which reads as a dead strip down the side.
    const render = (p) => {
      // Starts at -lift and ends at +travel: raised while it is being read, then
      // carried down behind the ridge.
      //
      // Linear, not eased. The descent is measured against the section's own
      // scroll, so a linear ramp means the copy falls at very nearly the rate
      // the picture rises and reads as pinned in place while the dune climbs
      // over it. Squaring it made the copy lag at the start — it drifted up the
      // screen before the sink caught up, which is what "you scroll past before
      // the motion hits" was describing. The frame-rate-independent follower
      // below is what smooths this; the trajectory itself wants to be straight.
      curY = travel * p - lift * (1 - p);
      const t = `translate3d(0, ${curY.toFixed(2)}px, 0)`;
      if (blocks) blocks.forEach((b) => { b.inner.style.transform = t; });
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
      if (reduced.matches || raf) return;
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

    // A mask that fails to load takes the copy with it — an unloadable mask
    // image is treated as fully transparent, which would blank the text
    // entirely. Losing the effect is fine; losing the words is not.
    const probe = new Image();
    probe.onerror = () => {
      if (blocks) blocks.forEach((b) => b.el.classList.remove('taro-dune-block'));
      warn(`dune-reveal: ${scene.mask} failed to load`);
    };
    probe.src = maskUrl;
  });
});
