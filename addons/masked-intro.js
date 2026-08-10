// Full-screen intro: a panoramic print of Spitzkoppe laid on the page's paper,
// torn off along a watercolour deckle. The wordmark sits in the sky and sinks
// behind the ridge line as you scroll, so the landscape passes in front of it.
//
// The occlusion needs a foreground layer — the same photograph, clipped to
// everything below the skyline — stacked above the text:
//
//     photo (full)  →  wordmark  →  photo again, clipped to the ridge
//
// RIDGE is that skyline, traced once offline against the source file and stored
// here as image-space fractions. An earlier version derived it in the browser by
// walking each column down from the top until the pixel stopped looking like
// sky. That failed on this frame: the sky is a hard gradient (luminance 122 at
// the top, 249 in the glow above the horizon), so a "distance from sky
// brightness" test bails out mid-sky, and around x=0.59 it bailed on the very
// first row. Hence the visible drift between the mask and the granite. A baked
// trace is exact, needs no canvas, and no longer requires the image to be
// CORS-readable. The cost is that a new PHOTO needs a new trace.
//
// Everything is driven from scroll position, never from transitions.

import { defineAddon, css } from '../lib/util.js';

// Spitzkoppe, Namibia. 2048x552 — and 2048 is all the source has, so how much
// the browser has to upscale it is the limit on how sharp the intro can look.
// See FRAME_RATIO for how that constrains the crop.
const PHOTO = 'https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/fd58d70e-2684-4273-afe3-e42491a752ea/IMG_4184-2.jpg';

// The frame is a band rather than a full-height cover. Covering 100vh with a
// 3.71:1 photo crops away 57% of the frame and upscales what's left about 3.3x
// on a retina display, which is what made it look soft and tight. This band
// shows about 74% of the frame at roughly 1.9x. Wider still would be sharper
// again, but the band gets too shallow to hold the wordmark.
const FRAME_RATIO = 2.75;

const WORDMARK = 'TARO CROZE';
const SUBLINE = 'STILLS.  MOTION.  PAINT.';

const STAGE_VH = 165;     // scroll length of the pinned intro
const SINK = 0.74;        // how far the type sinks, as a fraction of frame height
const GROW = 1.16;        // how much it scales on the way down
// The torn band. TEAR_START/END are where the edge sits inside that band at the
// left and right, so the gap between them is the diagonal. They are set to keep
// the edge clear of the skyline: it has to pass below the base of Spitzkoppe on
// the left and below the desert horizon in the middle, or the tear eats the
// landscape the type is supposed to sink behind.
const TEAR = 0.36;        // height of the torn band, as a fraction of frame height
const TEAR_START = 0.22;
const TEAR_END = 0.97;

// Skyline in image-space fractions: [x, y], left to right, y measured down from
// the top. Traced offline; see the header note.
const RIDGE = [
  [0,0.6497],[0.0064,0.6425],[0.0127,0.6298],[0.0191,0.6171],[0.022,0.6098],
  [0.0249,0.6025],[0.0283,0.5953],[0.0313,0.588],[0.0347,0.5808],
  [0.0405,0.5753],[0.044,0.5626],[0.0469,0.5554],[0.0532,0.5426],
  [0.0567,0.5372],[0.0625,0.5318],[0.0689,0.5263],[0.0752,0.5118],
  [0.0782,0.4846],[0.0816,0.461],[0.0845,0.4428],[0.0879,0.4192],
  [0.0909,0.4029],[0.0943,0.3902],[0.0972,0.3793],[0.1001,0.3612],
  [0.1036,0.3557],[0.1065,0.3412],[0.1099,0.3339],[0.1192,0.323],
  [0.1255,0.3176],[0.1319,0.3085],[0.1378,0.3031],[0.1632,0.2813],
  [0.1661,0.2704],[0.1788,0.3122],[0.1817,0.3249],[0.1851,0.3339],
  [0.1881,0.3666],[0.191,0.3721],[0.1944,0.392],[0.1974,0.4156],
  [0.2008,0.441],[0.2037,0.4592],[0.2071,0.4809],[0.2101,0.4955],
  [0.213,0.5154],[0.2164,0.5263],[0.232,0.5336],[0.235,0.5408],
  [0.2413,0.5572],[0.2447,0.5753],[0.2477,0.5862],[0.2506,0.6134],
  [0.2633,0.6062],[0.2882,0.6116],[0.2946,0.6189],[0.298,0.6261],
  [0.3009,0.6316],[0.3039,0.6461],[0.3073,0.6534],[0.3136,0.6624],
  [0.3166,0.6679],[0.32,0.6733],[0.3258,0.6824],[0.3322,0.6915],
  [0.3605,0.6969],[0.3669,0.7042],[0.3732,0.7151],[0.3791,0.7241],
  [0.3825,0.7314],[0.3889,0.7441],[0.3918,0.7495],[0.3952,0.7568],
  [0.3981,0.7623],[0.4011,0.7695],[0.4045,0.775],[0.4074,0.7804],
  [0.4108,0.7877],[0.4138,0.7949],[0.4167,0.8022],[0.4387,0.8076],
  [0.4485,0.8221],[0.4514,0.833],[0.4763,0.8185],[0.4827,0.8131],
  [0.4861,0.804],[0.4919,0.7985],[0.5081,0.784],[0.511,0.7731],
  [0.5139,0.7604],[0.5173,0.7459],[0.5203,0.735],[0.5237,0.7187],
  [0.5266,0.706],[0.5296,0.6915],[0.533,0.6733],[0.5359,0.6588],
  [0.5393,0.6425],[0.5423,0.6279],[0.5457,0.6098],[0.5486,0.5917],
  [0.5515,0.5771],[0.555,0.559],[0.5579,0.5426],[0.5613,0.5227],
  [0.5642,0.5045],[0.5672,0.4882],[0.5706,0.4664],[0.5735,0.4483],
  [0.5769,0.4211],[0.5799,0.4029],[0.5833,0.3775],[0.5862,0.3503],
  [0.5892,0.3303],[0.5926,0.3212],[0.5955,0.3103],[0.5989,0.2922],
  [0.6019,0.2777],[0.6048,0.2613],[0.6082,0.2414],[0.6111,0.2287],
  [0.6146,0.2196],[0.6175,0.2105],[0.6209,0.1978],[0.6238,0.1833],
  [0.6268,0.1706],[0.6302,0.1561],[0.6331,0.1434],[0.6365,0.1234],
  [0.6395,0.1089],[0.6424,0.0944],[0.6458,0.0672],[0.6488,0.0472],
  [0.6522,0.0363],[0.6551,0.0236],[0.6585,0.0127],[0.6615,0.0054],
  [0.6644,0],[1,0],
];

/** Smoothly-interpolated value noise over a 256-cell table, seeded. */
function noise(seed) {
  let s = seed >>> 0;
  const table = Array.from({ length: 256 }, () =>
    (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  return (u) => {
    const i = Math.floor(u), f = u - i;
    const a = table[i & 255], b = table[(i + 1) & 255];
    return a + (b - a) * (f * f * (3 - 2 * f));
  };
}

// How many undulations the coarsest octave makes across the full width. This is
// the number that decides whether the edge reads as torn paper or as pinking
// shears — sampling the whole noise table across the width, as this did at
// first, puts a tooth every few pixels and looks machine-cut.
const CELLS = 3;

/** Several octaves of it, so the edge has both a slow wander and fine fibre. */
function fbm(seed, octaves = 5) {
  const layers = Array.from({ length: octaves }, (_, i) => noise(seed + i * 7919));
  return (t) => {
    let sum = 0, amp = 1, freq = CELLS, norm = 0;
    for (const n of layers) {
      sum += amp * (n(t * freq) - 0.5);
      norm += amp;
      amp *= 0.52; freq *= 2.1;
    }
    return sum / norm;
  };
}

/**
 * The torn edge: a baseline dropping from left to right with fractal noise
 * riding on it, filled downwards. Randomness alone reads as a zigzag — it is
 * the drop plus the octaves that reads as paper.
 */
function tearPath(w, h, seed, amp = 0.5) {
  const f = fbm(seed);
  // Run past every edge except the torn one. The deckle filter shifts the
  // outline by up to half its scale, so a side or bottom that stops exactly on
  // the viewBox gets dragged inward and lets the photograph show through as a
  // rash of specks. Only the top edge is meant to be ragged.
  const pad = w * 0.06, padY = 34;
  const steps = Math.max(60, Math.round(w / 12));
  const foot = (h + padY).toFixed(1);
  let d = `M${(-pad).toFixed(1)},${foot} L${(-pad).toFixed(1)},${(TEAR_START * h).toFixed(1)}`;
  for (let i = 0; i <= steps; i++) {
    const x = -pad + ((w + 2 * pad) * i) / steps;
    const t = x / w;
    const y = (TEAR_START + (TEAR_END - TEAR_START) * t + amp * f(t)) * h;
    d += ` L${x.toFixed(1)},${Math.max(0, Math.min(h, y)).toFixed(1)}`;
  }
  return `${d} L${(w + pad).toFixed(1)},${foot} Z`;
}

defineAddon('masked-intro', () => {
  if (location.pathname !== '/') return;

  const host = document.querySelector('article#sections, article.sections');
  const firstSection = host?.querySelector('section[data-section-id]');
  if (!host || !firstSection) return;
  if (document.querySelector('.taro-intro')) return;

  // The wordmark is set in TAN Nimbus, the site's uploaded display face.
  // Squarespace rewrites uploaded family names into a hashed slug — today
  // 'tan---nimbus-regular-webfont-tn3woj' — and re-uploading the file changes
  // the hash, so the name is read back from the faces the page has actually
  // declared instead of being written down here. If it isn't found we fall back
  // to whatever the site's own headings are set in.
  const sample = document.querySelector('h1, h2, h3');
  const inherited = (sample ? getComputedStyle(sample).fontFamily
                            : getComputedStyle(document.body).fontFamily).replace(/"/g, "'");
  let nimbus = null;
  try {
    document.fonts.forEach((f) => {
      if (!nimbus && /tan.*nimbus/i.test(f.family)) nimbus = f.family;
    });
  } catch { /* no FontFaceSet — fall through to the inherited stack */ }
  const displayFont = nimbus ? `'${nimbus}', ${inherited}` : inherited;
  // The subline is a caption, not a headline. TAN Nimbus is a display face and
  // goes clumsy at caption size under wide tracking, so it stays on body type.
  const bodyFont = getComputedStyle(document.body).fontFamily.replace(/"/g, "'");

  css('masked-intro', `
    .taro-intro {
      position: relative;
      height: ${STAGE_VH}vh;
      /* Tall enough to hold the type, wide enough that the browser isn't
         upscaling a 2048px source past about 1.9x. */
      --taro-frame-h: clamp(42vh, min(64vh, 100vw / ${FRAME_RATIO}), 68vh);
    }
    .taro-intro__stage {
      position: sticky; top: 0;
      height: 100vh; width: 100%;
      overflow: hidden;
      background: var(--siteBackgroundColor, #f6eed5);
    }
    /* The print. A band, not a full-height cover — see FRAME_RATIO. */
    .taro-intro__frame {
      --taro-fx: 0.40;                   /* read back in JS; never let these drift */
      position: absolute; top: 0; left: 0; right: 0;
      height: var(--taro-frame-h);
      overflow: hidden;
    }
    .taro-intro__layer {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: calc(var(--taro-fx) * 100%) center;
    }
    /* The clipped copy that passes in front of the type. */
    .taro-intro__fore { z-index: 3; }
    .taro-intro__type {
      position: absolute; left: 0; right: 0; top: 12%;
      z-index: 2;
      text-align: center;
      color: #f9f3e2;
      pointer-events: none;
      text-shadow: 0 2px 34px rgba(0,0,0,0.26);
    }
    .taro-intro__word {
      display: inline-block;             /* so its width can be measured */
      font-family: ${displayFont};
      /* TAN Nimbus is uploaded at a single 400 weight. Asking for 700 makes the
         browser smear a synthetic bold over a display face. */
      font-weight: 400;
      line-height: 0.92;
      letter-spacing: 0.01em;
      margin: 0;
      /* Sized to sit in the clear sky between the Spitzkoppe peak and the near
         dome. Much larger and the last letters run into the granite while the
         page is still at rest, which reads as a mistake rather than an effect. */
      font-size: clamp(1.9rem, 6.8vw, 7rem);
    }
    /* Torn edge, pinned to the bottom of the print — not to the viewport, which
       is what used to leave a ragged strip hanging over the section below. */
    .taro-intro__tear {
      position: absolute; left: 0; right: 0; bottom: -1px;
      width: 100%; height: ${TEAR * 100}%;
      z-index: 5; display: block;
      filter: drop-shadow(0 -5px 9px rgba(48,36,22,0.22));
    }
    /* Caption sits on the paper below the tear, so the space there is composed
       rather than empty. */
    .taro-intro__caption {
      position: absolute; left: 0; right: 0;
      top: calc(var(--taro-frame-h) + 7vh);
      text-align: center;
      color: var(--siteTextColor, #2b2a26);
    }
    .taro-intro__sub {
      font-family: ${bodyFont};
      font-size: clamp(0.58rem, 1.05vw, 0.95rem);
      letter-spacing: 0.42em;
      text-transform: uppercase;
      margin: 0;
      opacity: 0.75;
    }
    .taro-intro__hint {
      position: absolute; left: 50%; bottom: 9vh;
      transform: translateX(-50%);
      z-index: 6;
      font-size: 0.58rem; letter-spacing: 0.34em; text-transform: uppercase;
      color: var(--siteTextColor, #2b2a26);
      opacity: 0.5; pointer-events: none;
    }

    /* Portrait phones can't show a 3:1 band and still have room for type, so
       crop in and centre the window on the dome instead. */
    @media (max-width: 700px) {
      /* A 2.75:1 band off a phone's width is a 140px sliver, so height is set
         directly here. The crop is heavy either way at this width, so the extra
         height costs little sharpness and stops the screen reading as empty. */
      .taro-intro { --taro-frame-h: 62vh; }
      .taro-intro__frame { --taro-fx: 0.56; }
      .taro-intro__type { top: 10%; }
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
      <div class="taro-intro__frame">
        <img class="taro-intro__layer taro-intro__back" src="${PHOTO}?format=2500w" alt="" aria-hidden="true">
        <div class="taro-intro__type"><h1 class="taro-intro__word">${WORDMARK}</h1></div>
        <img class="taro-intro__layer taro-intro__fore" src="${PHOTO}?format=2500w" alt="" aria-hidden="true">
        <svg class="taro-intro__tear" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="taro-deckle" x="-8%" y="-40%" width="116%" height="180%"
                    color-interpolation-filters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.014 0.055"
                            numOctaves="4" seed="11" result="n"/>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="17"
                                 xChannelSelector="R" yChannelSelector="G"/>
            </filter>
            <filter id="taro-deckle-soft" x="-8%" y="-40%" width="116%" height="180%"
                    color-interpolation-filters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.02 0.08"
                            numOctaves="4" seed="29" result="n"/>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="26"
                                 xChannelSelector="R" yChannelSelector="G"/>
            </filter>
          </defs>
          <path class="taro-intro__fibre" filter="url(#taro-deckle-soft)"
                transform="translate(0,-7)"
                fill="var(--siteBackgroundColor, #f6eed5)" fill-opacity="0.45"></path>
          <path class="taro-intro__paper" filter="url(#taro-deckle)"
                fill="var(--siteBackgroundColor, #f6eed5)"></path>
        </svg>
      </div>
      <div class="taro-intro__caption"><p class="taro-intro__sub">${SUBLINE}</p></div>
      <div class="taro-intro__hint">Scroll</div>
    </div>`;
  host.insertBefore(wrap, firstSection);

  const frame = wrap.querySelector('.taro-intro__frame');
  const back = wrap.querySelector('.taro-intro__back');
  const fore = wrap.querySelector('.taro-intro__fore');
  const type = wrap.querySelector('.taro-intro__type');
  const word = wrap.querySelector('.taro-intro__word');
  const hint = wrap.querySelector('.taro-intro__hint');
  const tearSvg = wrap.querySelector('.taro-intro__tear');
  const paper = wrap.querySelector('.taro-intro__paper');
  const fibre = wrap.querySelector('.taro-intro__fibre');

  /** Where the photograph actually sits in the frame, given object-fit: cover. */
  const geom = () => {
    const W = frame.clientWidth, H = frame.clientHeight;
    if (!W || !H) return null;
    const iw = back.naturalWidth || 2048, ih = back.naturalHeight || 552;
    const fx = parseFloat(getComputedStyle(frame).getPropertyValue('--taro-fx')) || 0.4;
    const scale = Math.max(W / iw, H / ih);
    const dw = iw * scale, dh = ih * scale;
    return { W, H, dw, dh, ox: (W - dw) * fx, oy: (H - dh) / 2 };  // matches object-position
  };

  /** Map the ridge into a clip polygon so the landscape passes in front. */
  const applyForeground = (g) => {
    // An unclipped foreground layer is the full photograph sitting on top of the
    // wordmark, so a frame we can't measure has to hide it rather than leave it
    // covering the type. Worst case the intro degrades to type over photo.
    if (!g) { fore.style.visibility = 'hidden'; return; }
    fore.style.visibility = '';
    const pts = RIDGE.map(([rx, ry]) =>
      `${(((g.ox + rx * g.dw) / g.W) * 100).toFixed(2)}% ${(((g.oy + ry * g.dh) / g.H) * 100).toFixed(2)}%`);
    fore.style.clipPath = `polygon(${pts.join(', ')}, 100% 100%, 0% 100%)`;
  };

  // Where the near dome's wall reaches the top of the frame: the rightmost ridge
  // point still below the top edge. Everything past it is granite.
  const DOME_X = (() => {
    for (let i = RIDGE.length - 1; i >= 0; i--) if (RIDGE[i][1] > 0.12) return RIDGE[i][0];
    return 1;
  })();

  /**
   * Hold the wordmark in the clear sky left of the dome. CSS can't do this on
   * its own: how much sky is on screen depends on how cover has cropped the
   * frame, so at some widths the last letters sit behind the granite before the
   * page has moved at all, which reads as a bug rather than as the effect.
   */
  const fitType = (g) => {
    if (!g) return;
    const margin = Math.max(16, g.W * 0.03);
    const domeX = g.ox + DOME_X * g.dw;
    const avail = Math.max(120, domeX - margin * 2);
    type.style.right = `${Math.max(0, g.W - domeX + margin).toFixed(0)}px`;
    word.style.fontSize = '';
    const natural = word.offsetWidth;
    if (natural > avail) {
      const size = parseFloat(getComputedStyle(word).fontSize);
      word.style.fontSize = `${(size * avail / natural).toFixed(1)}px`;
    }
  };

  const layoutTear = () => {
    const w = frame.clientWidth, h = Math.round(frame.clientHeight * TEAR);
    if (!w || !h) return;
    tearSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    // Same edge for both. The fibre copy is the paper lifted a few pixels and
    // roughed up harder, so it always reads as thinning fibre hugging the tear;
    // giving it its own shape left it poking through as loose specks.
    const d = tearPath(w, h, 7);
    paper.setAttribute('d', d);
    fibre.setAttribute('d', d);
  };

  const draw = () => {
    const top = wrap.getBoundingClientRect().top;
    const travel = wrap.offsetHeight - wrap.querySelector('.taro-intro__stage').clientHeight;
    const p = travel > 0 ? Math.max(0, Math.min(1, -top / travel)) : 0;

    // The type sinks and grows; the ridge in front of it does the hiding.
    const sink = SINK * p * p * frame.clientHeight;
    type.style.transform = `translateY(${sink.toFixed(1)}px) scale(${(1 + (GROW - 1) * p).toFixed(4)})`;
    type.style.opacity = p > 0.86 ? Math.max(0, 1 - (p - 0.86) / 0.14).toFixed(3) : 1;

    // Slow push-out for depth. Kept small: every extra percent here is another
    // percent of upscaling on an image that has none to spare.
    back.style.transform = fore.style.transform = `scale(${(1.03 - 0.03 * p).toFixed(4)})`;
    hint.style.opacity = (Math.max(0, 1 - p / 0.12) * 0.5).toFixed(3);
  };

  let queued = false;
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; draw(); });
  };

  const relayout = () => {
    const g = geom();
    applyForeground(g);
    fitType(g);
    layoutTear();
    draw();
  };

  if (back.complete && back.naturalWidth) relayout();
  else back.addEventListener('load', relayout, { once: true });
  relayout();   // the ridge is baked, so the layout doesn't wait on the image

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', relayout, { passive: true });
  // Catches the case where the frame has no size at boot — a hidden tab, a
  // deferred layout — and lays out properly the moment it gets one.
  if (typeof ResizeObserver === 'function') new ResizeObserver(relayout).observe(frame);
  // TAN Nimbus is served font-display: swap, so on a cold load the wordmark is
  // first measured in the fallback face and fitted to the wrong width. Measure
  // again once the real face has landed.
  document.fonts?.ready.then(relayout).catch(() => {});
});
