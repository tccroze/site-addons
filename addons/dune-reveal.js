// Sections whose copy sinks into the landscape as you scroll, passing behind
// whatever stands against the sky — dead trees, a dune ridge, two walkers on it.
//
// Same idea as the homepage intro, but the occluder cannot be a polygon here.
// The intro's skyline is one y per column, so a clip-path traces it exactly. Bare
// trees are not: branches fork, and there is sky in the gaps between them. That
// needs a real per-pixel cut-out, so the foreground is the same photograph with
// an alpha mask over it — sky transparent, everything else opaque — laid over the
// text:
//
//     Squarespace's own background photo  →  its copy  →  photo again, masked
//
// The masks are generated offline. Both frames separate almost perfectly on
// blue-minus-red: sky sits at +105 and above, every dune, tree, sand and figure
// pixel at 0 and below, so a soft ramp cuts them with feathered edges and no
// hand-painting. They are grey+alpha PNGs — the cut-out lives in the alpha
// channel because that is what CSS mask-image reads — and pack into ~30KB each.
//
// Nothing here is destructive: each section's markup is untouched apart from a
// transform on its content wrapper, and the foreground layer is appended.

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
 */
const SCENES = [
  { match: /deadvlei/i, mask: 'deadvlei-mask.png', sink: 0.42, taller: true },
  { match: /\bdune\.jpg/i, mask: 'dune-mask.png', sink: 0.30, taller: false },
];

// Where the travel starts and ends, in viewport heights of the section's top.
// Finishing at -0.5 rather than 0 means the copy is only fully swallowed once the
// section is half gone — before that there is always something left to read.
const FROM = 0.75, TO = -0.5;
const EASE = 0.16;        // proportion of the remaining distance closed per frame
const FRAME = 1000 / 60;

defineAddon('dune-reveal', () => {
  if (location.pathname !== '/') return;
  if (document.querySelector('.taro-dune')) return;

  const sections = [...document.querySelectorAll('article#sections > section')];
  const found = SCENES
    .map((scene) => ({
      scene,
      // Squarespace ships hidden duplicates of a section for other breakpoints,
      // and they carry the same background photograph. Matching on the picture
      // alone found one of those first — it has no content wrapper and no height,
      // so nothing mounted and the real section was never reached.
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
    /* The cut-out foreground. Above the copy — Squarespace's Fluid Engine puts
       its blocks on z-index 1 — but below the site header at 10. Everything that
       varies between sections is a custom property set on the element, because
       each one has its own photograph, focal point and colour overlay. */
    .taro-dune {
      position: absolute; inset: 0;
      z-index: 3;
      pointer-events: none;
      /* The mask carries its cut-out in the ALPHA channel, and CSS mask-image
         reads alpha by default — a plain greyscale PNG is fully opaque here and
         simply covers the copy, which is exactly what it did at first. */
      -webkit-mask-image: var(--taro-fg-mask);   mask-image: var(--taro-fg-mask);
      -webkit-mask-mode: alpha;                  mask-mode: alpha;
      -webkit-mask-size: cover;                  mask-size: cover;
      -webkit-mask-repeat: no-repeat;            mask-repeat: no-repeat;
      -webkit-mask-position: var(--taro-fg-focal); mask-position: var(--taro-fg-focal);
    }
    .taro-dune__photo {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: var(--taro-fg-focal);
    }
    /* These sections carry a colour overlay of their own, painted under the copy
       — so the foreground has to reproduce it, or the trees and figures would
       come back at full contrast against a tinted picture. */
    .taro-dune__tint {
      position: absolute; inset: 0;
      background: var(--taro-fg-tint);
      opacity: var(--taro-fg-tint-o);
    }
    .taro-dune-content { will-change: transform; }

    /* More sky above the ridge, so the copy has further to travel before the
       landscape swallows it. Only where the photograph already shows its full
       height: re-cropping has nothing left to give there, and a taller section
       scales the picture up and carries the ridge down the frame while the copy
       stays near the top. Desktop only; the phone layout stacks. */
    @media (min-width: 768px) {
      .taro-dune-section--taller { min-height: min(1100px, 76vw); }
    }

    /* The call to action is lifted out of the sinking copy and parked at the
       foot of the photograph. Everything else is meant to be swallowed by the
       landscape; a button that disappears is just a button you cannot press. */
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
    const content = section.querySelector('.content-wrapper') || section.firstElementChild;
    if (!content) return;

    // Match whatever Squarespace is doing with the photograph rather than
    // assuming. The mask has the same aspect ratio as the frame, so mask-size:
    // cover crops it exactly as object-fit: cover crops the picture — as long as
    // the positions agree, which is why the focal point is copied across. These
    // sections do not use the centre.
    const focal = getComputedStyle(bgImg).objectPosition || '50% 50%';
    const overlay = section.querySelector('.section-background-overlay');
    const maskUrl = ASSET(scene.mask);

    const layer = document.createElement('div');
    layer.className = 'taro-dune';
    layer.setAttribute('aria-hidden', 'true');
    layer.style.setProperty('--taro-fg-mask', `url("${maskUrl}")`);
    layer.style.setProperty('--taro-fg-focal', focal);
    layer.style.setProperty('--taro-fg-tint',
      overlay ? getComputedStyle(overlay).backgroundColor : 'transparent');
    layer.style.setProperty('--taro-fg-tint-o', overlay ? getComputedStyle(overlay).opacity : '0');
    layer.innerHTML =
      `<img class="taro-dune__photo" src="${bgImg.currentSrc || bgImg.src || bgImg.getAttribute('data-src') || ''}" alt="">` +
      '<div class="taro-dune__tint"></div>';
    section.appendChild(layer);

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
    let travel = 0;
    const measure = () => {
      travel = Math.min(scene.sink * section.getBoundingClientRect().height,
                        0.5 * (window.innerHeight || 0));
    };

    const targetProgress = () => {
      const vh = window.innerHeight || 1;
      const top = section.getBoundingClientRect().top;
      const from = vh * FROM, to = vh * TO;
      return Math.max(0, Math.min(1, (from - top) / (from - to)));
    };

    // No scale, deliberately. The element being moved is Squarespace's own
    // content wrapper, the full width of the page: scaling it up by even a few
    // percent pushes it past the viewport and the document grows a horizontal
    // scrollbar, which reads as a dead strip down the side.
    const render = (p) => {
      content.style.transform = `translate3d(0, ${(travel * p * p).toFixed(2)}px, 0)`;
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
    if (!bgImg.complete) bgImg.addEventListener('load', relayout, { once: true });
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', relayout, { passive: true });
    if (typeof ResizeObserver === 'function') new ResizeObserver(relayout).observe(section);

    // A mask that fails to load leaves an opaque copy of the photograph sitting
    // on top of the copy, which is far worse than not having the effect at all.
    const probe = new Image();
    probe.onerror = () => { layer.remove(); warn(`dune-reveal: ${scene.mask} failed to load`); };
    probe.src = maskUrl;
  });
});
