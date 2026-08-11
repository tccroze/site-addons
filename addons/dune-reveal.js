// The print-collection section: its copy sinks into the landscape as you scroll,
// passing behind the dead trees and then behind the dune.
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
// The mask is generated offline from the source frame. Deadvlei separates almost
// perfectly on blue-minus-red: the sky sits at +134 and above, every dune, tree
// and pan pixel at 0 and below, so a soft ramp between 50 and 110 cuts it with
// feathered edges and no hand-painting. It is committed as a grey+alpha PNG,
// with the cut-out in the alpha channel because that is what CSS mask-image
// reads: two flat regions and some fine branch detail, so it packs into 42KB.
//
// Nothing here is destructive: the section's own markup is untouched apart from
// a transform on its content wrapper, and the foreground layer is appended.

import { defineAddon, css, warn } from '../lib/util.js';

const MASK = new URL('../assets/deadvlei-mask.png', import.meta.url).href;

// How far the copy travels, as a fraction of the section's height. The heading
// starts around 8% down and the dune ridge sits at about 46%, so it needs a good
// third of the section to get behind it.
const SINK = 0.42;
const GROW = 1.05;        // a touch of scale, so it reads as going away not just down
// Where the travel starts and ends, in viewport heights of the section's top.
// Finishing at -0.5 rather than 0 means the copy is only fully swallowed once the
// section is half gone — before that there is always something left to read.
const FROM = 0.75, TO = -0.5;
const EASE = 0.16;        // proportion of the remaining distance closed per frame
const FRAME = 1000 / 60;

defineAddon('dune-reveal', () => {
  if (location.pathname !== '/') return;

  // Found by its photograph rather than by section id, which changes whenever a
  // section is rebuilt in the editor.
  const sections = [...document.querySelectorAll('article#sections > section')];
  const section = sections.find((s) => {
    const img = s.querySelector('.section-background img');
    return img && /deadvlei/i.test(img.currentSrc || img.src || '');
  });
  if (!section) return;

  const bgImg = section.querySelector('.section-background img');
  const content = section.querySelector('.content-wrapper') || section.firstElementChild;
  if (!content || document.querySelector('.taro-dune')) return;

  // Match whatever Squarespace is doing with the photograph, rather than assuming.
  // The mask has the same aspect ratio as the frame, so mask-size: cover crops it
  // exactly as object-fit: cover crops the picture — as long as the positions
  // agree, which is why the focal point is copied across rather than centred.
  const focal = getComputedStyle(bgImg).objectPosition || '50% 50%';
  const overlay = section.querySelector('.section-background-overlay');
  const tint = overlay ? getComputedStyle(overlay).backgroundColor : 'transparent';
  const tintOpacity = overlay ? getComputedStyle(overlay).opacity : '0';

  css('dune-reveal', `
    /* The cut-out foreground. Above the copy — Squarespace's Fluid Engine puts
       its blocks on z-index 1 — but below the site header at 10. */
    .taro-dune {
      position: absolute; inset: 0;
      z-index: 3;
      pointer-events: none;
      /* The mask carries its cut-out in the ALPHA channel, and CSS mask-image
         reads alpha by default — a plain greyscale PNG here is fully opaque and
         simply covers the copy, which is exactly what it did at first. */
      -webkit-mask-image: url("${MASK}");  mask-image: url("${MASK}");
      -webkit-mask-mode: alpha;            mask-mode: alpha;
      -webkit-mask-size: cover;            mask-size: cover;
      -webkit-mask-repeat: no-repeat;      mask-repeat: no-repeat;
      -webkit-mask-position: ${focal};     mask-position: ${focal};
    }
    .taro-dune__photo {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: ${focal};
    }
    /* The section carries a colour overlay of its own, and it is painted under
       the copy — so the foreground has to reproduce it or the trees would come
       back at full contrast against a tinted picture. */
    .taro-dune__tint {
      position: absolute; inset: 0;
      background: ${tint};
      opacity: ${tintOpacity};
    }
    .taro-dune-content { will-change: transform; }

    @media (prefers-reduced-motion: reduce) {
      .taro-dune-content { transform: none !important; }
    }
  `);

  const layer = document.createElement('div');
  layer.className = 'taro-dune';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML =
    `<img class="taro-dune__photo" src="${bgImg.currentSrc || bgImg.src}" alt="">` +
    '<div class="taro-dune__tint"></div>';
  section.appendChild(layer);
  content.classList.add('taro-dune-content');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Cached on resize, not read per frame: a bounding rect in the scroll path
  // forces a layout flush mid-animation, which is what makes this kind of thing
  // feel steppy. Only the section's own top has to be read each frame.
  let sectionH = 0;
  const measure = () => { sectionH = section.getBoundingClientRect().height; };

  const targetProgress = () => {
    const vh = window.innerHeight || 1;
    const top = section.getBoundingClientRect().top;
    const from = vh * FROM, to = vh * TO;
    return Math.max(0, Math.min(1, (from - top) / (from - to)));
  };

  const render = (p) => {
    content.style.transform =
      `translate3d(0, ${(SINK * p * p * sectionH).toFixed(2)}px, 0) scale(${(1 + (GROW - 1) * p).toFixed(4)})`;
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
    if (reduced.matches) return;
    if (raf) return;
    lastFrame = 0;
    raf = requestAnimationFrame(step);
  };

  const relayout = () => { measure(); shownP = targetProgress(); render(shownP); };

  relayout();
  if (!bgImg.complete) bgImg.addEventListener('load', relayout, { once: true });
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', relayout, { passive: true });
  if (typeof ResizeObserver === 'function') new ResizeObserver(relayout).observe(section);

  // A mask that fails to load leaves an opaque copy of the photograph sitting on
  // top of the copy, which is far worse than simply not having the effect.
  const probe = new Image();
  probe.onerror = () => { layer.remove(); warn('dune-reveal: mask failed to load, layer removed'); };
  probe.src = MASK;
});
