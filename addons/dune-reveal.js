// Sections whose copy sinks into the landscape as you scroll, passing behind
// whatever stands against the sky — dead trees, a dune ridge, two walkers on it.
//
// This used to work by laying a second copy of the photograph over the text and
// punching the sky out of it, so the trees and figures were redrawn on top. That
// is the obvious way to do it and it was wrong. It asks two independently
// resolved images — different srcset variants, different intrinsic sizes,
// different object-fit arithmetic — to land on precisely the same pixel, and any
// disagreement at all prints a second, offset copy of whatever stands against
// the sky. On this page that was a ghost of the left-hand walker on the dune. It
// survived four separate fixes, each of which corrected a real divergence and
// none of which removed the possibility of another one.
//
// So there is no second photograph any more. Instead the *text* carries the
// cut-out: its container is masked with the inverse silhouette — opaque across
// the sky, transparent everywhere the landscape stands — so the copy is simply
// erased as it descends past the ridge. Squarespace's own background photo is
// the only photo on screen, and nothing can misregister against it because
// there is nothing to register.
//
// It is also cheaper: no second full-size decode, no tint layer, one less
// composited surface on a phone.
//
// The mask goes on .content-wrapper and the travel goes on its .content child.
// That split matters — a mask moves with its own element, so masking the thing
// that slides would carry the sky along with the text and nothing would ever be
// occluded.
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
 * `sink` is how far the copy travels as a fraction of the section's height, and
 * `taller` asks for more sky. That second one only makes sense where the picture
 * already shows its full height and the ridge sits high in the frame: a taller
 * section scales the photograph up and carries the ridge down, which is the only
 * way to buy more room once re-cropping has nothing left to give.
 *
 * The masks are the inverse of the silhouette — sky opaque, landscape clear —
 * because they are worn by the text, not by a copy of the picture.
 */
const SCENES = [
  // `lift` raises the copy before it starts falling. The print section already
  // holds its copy near the top of the picture, so lifting it there only pushed
  // it out under the header — it is the dune section, where Squarespace centres
  // the copy in a very tall section, that needs the room.
  { match: /deadvlei/i, mask: 'deadvlei-sky.png', sink: 0.42, lift: 0, taller: true },
  { match: /\bdune\.jpg/i, mask: 'dune-sky.png', sink: 0.30, lift: 0.14, taller: false },
];

// Where the travel starts and ends, in viewport heights of the section's top.
// Nothing moves until the section is properly on screen. At 0.75 the sink was
// already underway while the copy was still arriving from the bottom of the
// window — it was going before anyone could read it. It now holds still for the
// whole time the section is crossing the screen, and only begins once its top
// nears the top of the window, finishing when the section is well past.
const FROM = 0.10, TO = -1.2;
const EASE = 0.16;        // proportion of the remaining distance closed per frame
const FRAME = 1000 / 60;

// object-position keywords, as fractions of the free space. Chrome serialises
// the computed value as percentages, but Safari and Firefox do not always, and
// a parse that quietly falls back to centre is how the old ghost got a few
// hundred pixels of horizontal offset in the first place.
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
  if (document.querySelector('.taro-dune-content')) return;

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
    /* The wearer of the cut-out. Sized and placed in pixels computed from the
       background photograph's own drawn rectangle, so the sky in the mask sits
       exactly over the sky in the picture. It must not move: the travel below is
       applied to its child, because a mask travels with its own element and a
       sky that slides with the text occludes nothing. */
    .taro-dune-wrap {
      /* The mask carries its cut-out in the ALPHA channel, and CSS mask-image
         reads alpha by default — a plain greyscale PNG is fully opaque here. */
      -webkit-mask-image: var(--taro-sky);   mask-image: var(--taro-sky);
      -webkit-mask-mode: alpha;              mask-mode: alpha;
      -webkit-mask-size: var(--taro-sky-size);      mask-size: var(--taro-sky-size);
      -webkit-mask-position: var(--taro-sky-pos);   mask-position: var(--taro-sky-pos);
      -webkit-mask-repeat: no-repeat;        mask-repeat: no-repeat;
    }
    .taro-dune-content { will-change: transform; }

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

    @media (prefers-reduced-motion: reduce) {
      .taro-dune-content { transform: none !important; }
    }
  `);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  found.forEach(({ scene, section }) => {
    const bgImg = section.querySelector('.section-background img');
    const wrapper = section.querySelector('.content-wrapper');
    // The travelling element is the wrapper's child, never the wrapper itself.
    const content = wrapper && (wrapper.querySelector(':scope > .content') || wrapper.firstElementChild);
    if (!bgImg || !wrapper || !content) return;

    const maskUrl = ASSET(scene.mask);
    wrapper.classList.add('taro-dune-wrap');
    wrapper.style.setProperty('--taro-sky', `url("${maskUrl}")`);
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

    // Cached on relayout, never read per frame: a bounding rect inside the scroll
    // path forces a layout flush mid-animation, which is what makes this kind of
    // thing feel steppy.
    let travel = 0, lift = 0;
    const measure = () => {
      const vh = window.innerHeight || 0;
      travel = Math.min(scene.sink * section.getBoundingClientRect().height, 0.5 * vh);
      lift = (scene.lift || 0) * vh;

      // Reproduce object-fit: cover on the background photograph, then place the
      // mask over the rectangle it actually draws into. Measured from the image
      // element's own box rather than the section's, so however Squarespace
      // chooses to inset .section-background the mask follows it.
      const box = bgImg.getBoundingClientRect();
      const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
      if (!box.width || !box.height || !iw || !ih) return;
      const scale = Math.max(box.width / iw, box.height / ih);
      const dw = iw * scale, dh = ih * scale;
      const [px = '50%', py = '50%'] =
        (getComputedStyle(bgImg).objectPosition || '50% 50%').split(/\s+/);
      // Where the photograph's top-left corner lands, in page terms, then
      // rebased onto the wrapper — mask-position is measured from the masked
      // element's own border box, and the wrapper is inset from the section.
      const wrap = wrapper.getBoundingClientRect();
      const mx = box.left - wrap.left + axis(px, box.width - dw);
      const my = box.top - wrap.top + axis(py, box.height - dh);
      wrapper.style.setProperty('--taro-sky-size', `${dw.toFixed(2)}px ${dh.toFixed(2)}px`);
      wrapper.style.setProperty('--taro-sky-pos', `${mx.toFixed(2)}px ${my.toFixed(2)}px`);
    };

    const targetProgress = () => {
      const vh = window.innerHeight || 1;
      const top = section.getBoundingClientRect().top;
      const from = vh * FROM, to = vh * TO;
      return Math.max(0, Math.min(1, (from - top) / (from - to)));
    };

    // No scale, deliberately. Scaling a full-width wrapper by even a few percent
    // pushes it past the viewport and the document grows a horizontal scrollbar,
    // which reads as a dead strip down the side.
    const render = (p) => {
      // Starts at -lift and ends at +travel: raised while it is being read, then
      // carried down behind the ridge.
      const y = travel * p * p - lift * (1 - p);
      content.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    };

    let shownP = 0, lastFrame = 0, raf = 0;
    const step = (now) => {
      const target = targetProgress();
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

    const relayout = () => { measure(); shownP = targetProgress(); render(shownP); };

    relayout();
    // The background is lazy-loaded, so on first run it usually has no intrinsic
    // size yet and measure() bails; this is the call that actually places the mask.
    if (!bgImg.complete) bgImg.addEventListener('load', relayout, { once: true });
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', relayout, { passive: true });
    if (typeof ResizeObserver === 'function') new ResizeObserver(relayout).observe(section);

    // A mask that fails to load takes the copy with it — an unloadable mask
    // image is treated as fully transparent, which would blank the text
    // entirely. Losing the effect is fine; losing the words is not.
    const probe = new Image();
    probe.onerror = () => {
      wrapper.classList.remove('taro-dune-wrap');
      warn(`dune-reveal: ${scene.mask} failed to load`);
    };
    probe.src = maskUrl;
  });
});
