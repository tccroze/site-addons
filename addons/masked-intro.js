// Full-screen intro: the wordmark sits in the sky, and the ridge line of the
// photograph passes in front of it, so as you scroll the type sinks away behind
// the mountain. The section then tears open along a ripped-paper edge into the
// rest of the page.
//
// The occlusion is the whole trick. It needs a foreground layer — the same
// photograph, clipped to everything below the horizon — stacked above the text:
//
//     photo (full)  →  wordmark  →  photo again, clipped to the ridge
//
// The ridge is derived from the image at runtime rather than hand-masked: each
// column is walked down from the top until the pixel stops looking like sky, in
// both luminance and blueness. That means changing PHOTO is genuinely a one-line
// change, with no new mask to prepare. If the scan fails for any reason (an
// image served without CORS headers, a sky the test cannot characterise) the
// foreground layer is simply skipped and the intro still works — the type just
// sits over the photograph rather than behind the ridge.
//
// Everything is driven from scroll position, never from transitions.

import { defineAddon, css } from '../lib/util.js';

const PHOTO = 'https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/7d48f3b7-2b74-463d-b539-9be947fcec68/IMG_2624.jpg';
const WORDMARK = 'TARO CROZE';
const SUBLINE = 'STILLS.  MOTION.  PAINT.';
const STAGE_VH = 280;
const SINK_VH = 46;       // how far the type travels down, in vh
const GROW = 1.35;        // how much it scales as it sinks
const TEAR_H = 90;        // height of the torn edge in px

/** Walk each column down from the top until the pixel stops looking like sky. */
function findRidge(img, columns = 220) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, W, H).data;              // throws if tainted
  const lum = (x, y) => { const i = (y * W + x) * 4; return 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2]; };
  const blue = (x, y) => { const i = (y * W + x) * 4; return d[i+2] - d[i]; };

  let sl = 0, sb = 0, n = 0;
  for (let x = 0; x < W; x += 7) for (let y = 0; y < Math.min(20, H); y++) { sl += lum(x,y); sb += blue(x,y); n++; }
  sl /= n; sb /= n;

  const pts = [];
  for (let k = 0; k < columns; k++) {
    const x = Math.min(W - 1, Math.round(k * (W - 1) / (columns - 1)));
    let y = 0;
    while (y < H && Math.abs(lum(x,y) - sl) <= 42 && (sb - blue(x,y)) <= 34) y++;
    pts.push([k / (columns - 1), Math.min(y / H, 1)]);
  }
  // A ridge that never leaves the very top or runs to the bottom is not a ridge.
  const ys = pts.map(p => p[1]);
  if (Math.max(...ys) < 0.02 || Math.min(...ys) > 0.98) return null;
  return pts;
}

/** Torn-paper edge as an SVG path, generated rather than drawn. */
function tornPath(width, height, seed = 7) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let d = `M0,${height} L0,${height * 0.55} `;
  const steps = Math.max(14, Math.round(width / 46));
  for (let i = 1; i <= steps; i++) {
    const x = (width * i) / steps;
    const y = height * (0.25 + rnd() * 0.6);
    const cx = x - width / steps / 2;
    const cy = height * (0.2 + rnd() * 0.7);
    d += `Q${cx.toFixed(1)},${cy.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d + `L${width},${height} Z`;
}

defineAddon('masked-intro', () => {
  if (location.pathname !== '/') return;

  const host = document.querySelector('article#sections, article.sections');
  const firstSection = host?.querySelector('section[data-section-id]');
  if (!host || !firstSection) return;
  if (document.querySelector('.taro-intro')) return;

  const sample = document.querySelector('h1, h2, h3');
  const displayFont = (sample ? getComputedStyle(sample).fontFamily
                              : getComputedStyle(document.body).fontFamily).replace(/"/g, "'");

  css('masked-intro', `
    .taro-intro { position: relative; height: ${STAGE_VH}vh; }
    .taro-intro__stage {
      position: sticky; top: 0;
      height: 100vh; width: 100%;
      overflow: hidden; background: #0d1210;
    }
    .taro-intro__layer {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
    }
    /* The clipped copy of the photograph that passes in front of the type. */
    .taro-intro__fore { z-index: 3; }
    .taro-intro__type {
      position: absolute; inset: 0;
      z-index: 2;
      display: flex; flex-direction: column;
      align-items: center; justify-content: flex-start;
      padding-top: 12vh;
      text-align: center;
      color: #f6eed5;
      pointer-events: none;
      text-shadow: 0 2px 40px rgba(0,0,0,0.28);
    }
    .taro-intro__word {
      font-family: ${displayFont};
      font-weight: 700;
      line-height: 0.92;
      letter-spacing: 0.01em;
      margin: 0;
      font-size: clamp(2.6rem, 11vw, 12rem);
    }
    .taro-intro__sub {
      font-family: ${displayFont};
      font-size: clamp(0.6rem, 1.15vw, 1rem);
      letter-spacing: 0.42em;
      text-transform: uppercase;
      margin: 1.4em 0 0;
      opacity: 0.9;
    }
    .taro-intro__hint {
      position: absolute; left: 50%; bottom: 5vh;
      transform: translateX(-50%);
      z-index: 4;
      font-size: 0.6rem; letter-spacing: 0.34em; text-transform: uppercase;
      color: #f6eed5; pointer-events: none;
    }
    /* Torn edge, pinned to the bottom of the stage in the page's own cream. */
    .taro-intro__tear {
      position: absolute; left: 0; right: 0; bottom: -1px;
      width: 100%; height: ${TEAR_H}px;
      z-index: 5; display: block;
    }

    @media (prefers-reduced-motion: reduce) {
      .taro-intro { height: 100vh; }
      .taro-intro__stage { position: relative; }
      .taro-intro__hint { display: none; }
    }
  `);

  const wrap = document.createElement('div');
  wrap.className = 'taro-intro';
  wrap.innerHTML = `
    <div class="taro-intro__stage">
      <img class="taro-intro__layer taro-intro__back" src="${PHOTO}?format=2500w" alt="" aria-hidden="true" crossorigin="anonymous">
      <div class="taro-intro__type">
        <h1 class="taro-intro__word">${WORDMARK}</h1>
        <p class="taro-intro__sub">${SUBLINE}</p>
      </div>
      <img class="taro-intro__layer taro-intro__fore" src="${PHOTO}?format=2500w" alt="" aria-hidden="true" crossorigin="anonymous">
      <div class="taro-intro__hint">Scroll</div>
      <svg class="taro-intro__tear" preserveAspectRatio="none" aria-hidden="true">
        <path fill="var(--siteBackgroundColor, #f6eed5)"></path>
      </svg>
    </div>`;
  host.insertBefore(wrap, firstSection);

  const stage = wrap.querySelector('.taro-intro__stage');
  const back = wrap.querySelector('.taro-intro__back');
  const fore = wrap.querySelector('.taro-intro__fore');
  const type = wrap.querySelector('.taro-intro__type');
  const hint = wrap.querySelector('.taro-intro__hint');
  const tearSvg = wrap.querySelector('.taro-intro__tear');
  const tearPath = tearSvg.querySelector('path');

  let ridge = null;

  /** Map the ridge (image-space fractions) into a clip polygon for the stage,
   *  accounting for how object-fit: cover crops the photograph. */
  const applyForeground = () => {
    if (!ridge) { fore.style.display = 'none'; return; }
    const W = stage.clientWidth, H = stage.clientHeight;
    const iw = back.naturalWidth, ih = back.naturalHeight;
    if (!iw || !ih || !W || !H) return;
    const scale = Math.max(W / iw, H / ih);
    const dw = iw * scale, dh = ih * scale;
    const ox = (W - dw) / 2, oy = (H - dh) / 2;

    const pts = ridge.map(([fx, fy]) => {
      const x = ((ox + fx * dw) / W) * 100;
      const y = ((oy + fy * dh) / H) * 100;
      return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
    });
    fore.style.display = '';
    fore.style.clipPath = `polygon(${pts.join(', ')}, 100% 100%, 0% 100%)`;
  };

  const layoutTear = () => {
    const w = stage.clientWidth;
    tearSvg.setAttribute('viewBox', `0 0 ${w} ${TEAR_H}`);
    tearPath.setAttribute('d', tornPath(w, TEAR_H));
  };

  const draw = () => {
    const top = wrap.getBoundingClientRect().top;
    const travel = wrap.offsetHeight - stage.clientHeight;
    const p = travel > 0 ? Math.max(0, Math.min(1, -top / travel)) : 0;

    // The type sinks and grows; the ridge in front of it does the hiding.
    const sink = (SINK_VH * p * p) / 100 * stage.clientHeight;
    type.style.transform = `translateY(${sink.toFixed(1)}px) scale(${(1 + (GROW - 1) * p).toFixed(4)})`;
    type.style.opacity = p > 0.82 ? Math.max(0, 1 - (p - 0.82) / 0.18).toFixed(3) : 1;

    // Slow push-out on the photograph for depth.
    back.style.transform = fore.style.transform = `scale(${(1.08 - 0.08 * p).toFixed(4)})`;
    hint.style.opacity = Math.max(0, 1 - p / 0.12).toFixed(2);
  };

  let queued = false;
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; draw(); }); } };

  const boot = () => {
    try { ridge = findRidge(back); } catch { ridge = null; }   // tainted canvas etc.
    applyForeground();
    layoutTear();
    draw();
  };

  if (back.complete && back.naturalWidth) boot();
  else back.addEventListener('load', boot, { once: true });

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { applyForeground(); layoutTear(); draw(); }, { passive: true });
});
