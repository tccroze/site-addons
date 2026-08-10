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

// Spitzkoppe, Namibia — 13982x3770, served from this repo rather than through
// Squarespace, whose image CDN caps out at 2500px. The copy that came through
// Squarespace was only 2048px wide, which had the browser upscaling it about
// 1.9x; from here the largest variant covers a retina desktop with a little to
// spare. Sized off the module's own URL so it resolves wherever this is hosted.
const ASSET = (name) => new URL(`../assets/${name}`, import.meta.url).href;
const PHOTO = ASSET('spitzkoppe-2600.jpg');
const PHOTO_SET = [1600, 2600, 4000].map((w) => `${ASSET(`spitzkoppe-${w}.jpg`)} ${w}w`).join(', ');
// object-fit: cover scales the picture up past the element's own width, and the
// browser picks from srcset on the element width alone, so it has to be told to
// aim higher or it lands a size short.
const PHOTO_SIZES = '(max-width: 767px) 150vw, 140vw';
const PHOTO_W = 4000, PHOTO_H = 1078;    // only used before the image has loaded

// The frame is a band rather than a full-height cover: covering 100vh with a
// 3.71:1 photo throws away 57% of the frame. This band shows about 74% of it.
// Wider still would show more, but the band gets too shallow to hold the
// wordmark. Sharpness no longer constrains this — the source is big enough now.
const FRAME_RATIO = 2.75;

const WORDMARK = 'TARO CROZE';
const SUBLINE = 'STILLS.  MOTION.  PAINT.';

// Scroll length of the pin, as a multiple of the frame height. The wrapper is
// sized from this in JS; STAGE_VH is only the value that applies before the
// first layout. Expressing it against the frame rather than the viewport keeps
// the gesture the same on a short laptop window as on a tall monitor — in vh it
// ate exactly the room the section below needed on short windows, which pushed
// the copy under it off the bottom of the screen.
const PIN = 0.62;
const STAGE_VH = 125;
const SINK = 0.74;        // how far the type sinks, as a fraction of frame height
const GROW = 1.16;        // how much it scales on the way down
// The torn band. TEAR_START/END are where the edge sits inside that band at the
// left and right, so the gap between them is the diagonal. They are set to keep
// the edge clear of the skyline: it has to pass below the base of Spitzkoppe on
// the left and below the desert horizon in the middle, or the tear eats the
// landscape the type is supposed to sink behind.
// TEAR_END plus the noise has to stay inside the band. At 0.97 the noise pushed
// the edge past the bottom over the last sixth of the width, where it clamped
// flat and the fill fell below the viewBox entirely — the right of the print met
// the page with a straight cut instead of a tear.
const TEAR = 0.28;        // height of the torn band, as a fraction of frame height
const TEAR_START = 0.20;
const TEAR_END = 0.86;

// The following section is pulled up so its top sits at the TOP of the torn
// band, which puts the whole tear over it: the photograph below emerges from
// under the torn paper instead of starting at a seam below it. The exact amount
// depends on the header and the viewport, so it is worked out in relayout()
// rather than written as a constant here. The stage is only as tall as the print
// for the same reason — a full-height stage would be an opaque block covering
// what is meant to show through.

// Skyline in image-space fractions: [x, y], left to right, y measured down from
// the top. Traced offline; see the header note.
const RIDGE = [
  [0.0,0.6488],[0.0063,0.6395],[0.0094,0.6349],[0.0125,0.6279],
  [0.0188,0.6163],[0.0219,0.607],[0.025,0.6],[0.0281,0.5953],[0.0313,0.5884],
  [0.0344,0.5814],[0.0375,0.5767],[0.0438,0.5605],[0.0469,0.5535],
  [0.0532,0.5419],[0.0563,0.5372],[0.0594,0.5326],[0.0688,0.5279],
  [0.075,0.5116],[0.0782,0.4837],[0.0813,0.4628],[0.0844,0.4442],
  [0.0876,0.4209],[0.0907,0.4023],[0.0938,0.3907],[0.0969,0.3814],
  [0.1001,0.3605],[0.1032,0.3558],[0.1063,0.3395],[0.1094,0.3349],
  [0.1126,0.3302],[0.1188,0.3233],[0.1257,0.3186],[0.1288,0.314],
  [0.132,0.3093],[0.1351,0.3047],[0.1538,0.3],[0.1632,0.2814],[0.1664,0.2698],
  [0.1757,0.2744],[0.1789,0.3093],[0.182,0.3233],[0.1851,0.3349],
  [0.1882,0.3674],[0.1914,0.3721],[0.1945,0.3907],[0.1976,0.4186],
  [0.2008,0.4395],[0.2039,0.4628],[0.207,0.4791],[0.2101,0.4953],
  [0.2133,0.5116],[0.2164,0.5256],[0.2258,0.5302],[0.2351,0.5419],
  [0.2414,0.5581],[0.2445,0.5721],[0.2477,0.5837],[0.2508,0.614],
  [0.2602,0.6093],[0.2664,0.6023],[0.2758,0.607],[0.2914,0.6116],
  [0.2946,0.6186],[0.2977,0.6256],[0.3008,0.6326],[0.3039,0.6442],
  [0.3071,0.6512],[0.3102,0.6558],[0.3133,0.6605],[0.3164,0.6651],
  [0.3196,0.6721],[0.3227,0.6767],[0.3258,0.6814],[0.3321,0.6884],
  [0.3352,0.693],[0.3634,0.7],[0.3696,0.7047],[0.3727,0.7116],[0.3765,0.7186],
  [0.3796,0.7233],[0.3827,0.7302],[0.3859,0.7349],[0.389,0.7419],
  [0.3921,0.7488],[0.3952,0.7558],[0.3984,0.7628],[0.4015,0.7698],
  [0.4046,0.7744],[0.4078,0.7814],[0.4109,0.786],[0.414,0.7953],[0.4171,0.8],
  [0.4359,0.8047],[0.4422,0.8093],[0.4453,0.8186],[0.4484,0.8233],
  [0.4515,0.8302],[0.4609,0.8349],[0.4672,0.8302],[0.4765,0.8186],
  [0.4828,0.8116],[0.4859,0.8047],[0.4891,0.8],[0.5047,0.7953],
  [0.5078,0.7837],[0.5109,0.7698],[0.5141,0.7581],[0.5172,0.7465],
  [0.5203,0.7326],[0.5235,0.7186],[0.5266,0.7047],[0.5297,0.6907],
  [0.5328,0.6744],[0.536,0.6581],[0.5391,0.6419],[0.5422,0.6256],
  [0.5453,0.6093],[0.5485,0.593],[0.5516,0.5767],[0.5547,0.5581],
  [0.5578,0.5419],[0.561,0.5209],[0.5641,0.5047],[0.5672,0.4884],
  [0.5704,0.4651],[0.5735,0.4465],[0.5766,0.4233],[0.5797,0.4023],
  [0.5829,0.3814],[0.586,0.3512],[0.5891,0.3302],[0.5922,0.3209],
  [0.5954,0.3093],[0.5985,0.2977],[0.6016,0.2791],[0.6048,0.2605],
  [0.6079,0.2442],[0.611,0.2279],[0.6141,0.2209],[0.6173,0.2116],
  [0.6204,0.1977],[0.6235,0.186],[0.6273,0.1674],[0.6304,0.1512],
  [0.6335,0.1395],[0.6366,0.1209],[0.6398,0.1116],[0.6429,0.0884],
  [0.646,0.0651],[0.6492,0.0442],[0.6523,0.0349],[0.6554,0.0233],
  [0.6585,0.0116],[0.6617,0.0047],[0.6648,0.0],[1.0,0.0],
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

// Deepest row the traced skyline reaches, used to clamp lookups into it.
const RIDGE_MAX_Y = RIDGE.reduce((m, pt) => Math.max(m, pt[1]), 0);

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
 * The print's own outline, in frame coordinates: square on three sides, torn
 * along the bottom. A baseline dropping from left to right with fractal noise
 * riding on it — randomness alone reads as a zigzag, it is the drop plus the
 * octaves that reads as paper.
 *
 * It describes what to KEEP, so it can be used as a mask. Painting the torn
 * strip in the page's cream instead, as this did at first, makes the tear opaque
 * — it covers whatever is beneath rather than revealing it, which is no use when
 * the point is for the photograph below to come up through the tear.
 */
function sheetPath(w, h, seed, amp = 0.42) {
  const f = fbm(seed);
  const band = h * TEAR, base = h - band;
  // Run past the sides and the top. The deckle filter shifts the outline by up
  // to half its scale, so an edge stopping exactly on the viewBox gets dragged
  // inward and takes a strip off the photograph. Only the bottom is ragged.
  const pad = w * 0.06, padY = 34;
  const steps = Math.max(60, Math.round(w / 12));
  const head = (-padY).toFixed(1);
  let d = `M${(-pad).toFixed(1)},${head}`;
  for (let i = 0; i <= steps; i++) {
    const x = -pad + ((w + 2 * pad) * i) / steps;
    const t = x / w;
    const y = base + (TEAR_START + (TEAR_END - TEAR_START) * t + amp * f(t)) * band;
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `${d} L${(w + pad).toFixed(1)},${head} Z`;
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
      /* Written from JS — how far the site header overlays the top of the page. */
      --taro-header-h: 0px;
      /* Tall enough to hold the type, wide enough that the browser isn't
         upscaling a 2048px source past about 1.9x. */
      --taro-frame-h: clamp(42vh, min(64vh, 100vw / ${FRAME_RATIO}), 68vh);
    }
    /* Pinned below the header, and only as tall as the print itself. Pinning at
       the top of the viewport slid it under Squarespace's fixed header and took
       the wordmark with it; a full-height stage would be an opaque block over
       the section that is meant to rise behind the tear. */
    .taro-intro__stage {
      position: sticky;
      top: var(--taro-header-h);
      height: var(--taro-frame-h);
      width: 100%;
      z-index: 1;
    }
    /* The print. A band, not a full-height cover — see FRAME_RATIO.
       overflow: hidden is load-bearing: the wordmark and both photo layers are
       scaled as the page scrolls, and a mask only hides the overspill, it does
       not stop it counting as scrollable overflow. Without this the type grew
       about 80px past the viewport and the whole page gained a horizontal
       scrollbar, which read as a blank strip down the right-hand side.
       The shadow lives out here rather than on the sheet because filters are
       applied before masks, so a shadow on the masked element is masked away. */
    .taro-intro__frame {
      --taro-fx: 0.12;                   /* read back in JS; never let these drift */
      position: absolute; inset: 0;
      overflow: hidden;
      filter: drop-shadow(0 5px 9px rgba(48,36,22,0.20));
    }
    /* Everything that is "the photograph" lives in here so one mask tears the
       lot: the print, the wordmark over it, and the ridge layer in front. */
    .taro-intro__sheet {
      position: absolute; inset: 0;
      -webkit-mask-size: 100% 100%;         mask-size: 100% 100%;
      -webkit-mask-repeat: no-repeat;       mask-repeat: no-repeat;
    }
    .taro-intro__layer {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: calc(var(--taro-fx) * 100%) center;
    }
    /* The clipped copy that passes in front of the type. */
    .taro-intro__fore { z-index: 3; }
    /* Wordmark and subline travel together so both sink behind the ridge.
       Stacked with flex rather than left as blocks: each one is shrink-to-fit so
       that its own width can be measured against the sky, and two shrink-to-fit
       boxes in normal flow would sit side by side on one line. */
    .taro-intro__type {
      position: absolute; left: 0; right: 0; top: 11%;
      z-index: 2;
      display: flex; flex-direction: column; align-items: center;
      text-align: center;
      pointer-events: none;
      text-shadow: 0 2px 34px rgba(0,0,0,0.26);
    }
    /* Set on the elements, not inherited from the box above. Squarespace paints
       headings from --headingLargeColor with a rule on the h1 itself — a red on
       this site — and inheritance can never beat a direct rule, so the wordmark
       came out red. The descendant selector is here to out-specify it. */
    .taro-intro__type .taro-intro__word,
    .taro-intro__type .taro-intro__sub {
      color: var(--siteBackgroundColor, #f6eed5);
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
      /* An upper bound only. What actually fits is decided in fitType(), which
         measures the sky left of the granite at this wordmark's own height. */
      font-size: clamp(2.2rem, 8.6vw, 9rem);
    }
    .taro-intro__sub {
      display: inline-block;             /* so its width can be measured too */
      font-family: ${bodyFont};
      font-size: clamp(0.6rem, 1.1vw, 1rem);
      letter-spacing: 0.42em;
      text-transform: uppercase;
      margin: 1.6em 0 0;
      opacity: 0.92;
    }

    /* Portrait phones can't show a 3:1 band and still have room for type, so
       crop in and centre the window on the dome instead. */
    @media (max-width: 700px) {
      /* A 2.75:1 band off a phone's width is a 140px sliver, so height is set
         directly here. The crop is heavy either way at this width, so the extra
         height costs little sharpness and stops the screen reading as empty. */
      .taro-intro { --taro-frame-h: 56vh; }
      /* A phone sees about a fifth of the frame. Centred on the near dome that
         fifth is all pale glow and granite, which leaves cream type with nothing
         to sit against; centred on Spitzkoppe it gets deep sky above a hard
         silhouette, and the peak takes over as the mass the type sinks behind. */
      .taro-intro__frame { --taro-fx: 0.22; }
      .taro-intro__type { top: 13%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .taro-intro { height: var(--taro-frame-h); margin-bottom: 0; }
      .taro-intro__stage { position: relative; }
    }
  `);

  const wrap = document.createElement('div');
  wrap.className = 'taro-intro';
  wrap.innerHTML = `
    <div class="taro-intro__stage">
      <div class="taro-intro__frame">
        <div class="taro-intro__sheet">
          <img class="taro-intro__layer taro-intro__back" src="${PHOTO}" srcset="${PHOTO_SET}" sizes="${PHOTO_SIZES}" alt="" aria-hidden="true">
          <div class="taro-intro__type">
            <h1 class="taro-intro__word">${WORDMARK}</h1>
            <p class="taro-intro__sub">${SUBLINE}</p>
          </div>
          <img class="taro-intro__layer taro-intro__fore" src="${PHOTO}" srcset="${PHOTO_SET}" sizes="${PHOTO_SIZES}" alt="" aria-hidden="true">
        </div>
      </div>
    </div>`;
  host.insertBefore(wrap, firstSection);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stage = wrap.querySelector('.taro-intro__stage');
  const frame = wrap.querySelector('.taro-intro__frame');
  const back = wrap.querySelector('.taro-intro__back');
  const fore = wrap.querySelector('.taro-intro__fore');
  const type = wrap.querySelector('.taro-intro__type');
  const word = wrap.querySelector('.taro-intro__word');
  const sub = wrap.querySelector('.taro-intro__sub');
  const sheet = wrap.querySelector('.taro-intro__sheet');

  /** Where the photograph actually sits in the frame, given object-fit: cover. */
  const geom = () => {
    const W = frame.clientWidth, H = frame.clientHeight;
    if (!W || !H) return null;
    const iw = back.naturalWidth || PHOTO_W, ih = back.naturalHeight || PHOTO_H;
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

  /**
   * How far right the near dome's wall has got by a given depth into the frame.
   * The wall slopes, so it eats further into the sky the lower you look — which
   * is why the wordmark is measured against its own bottom edge rather than
   * against the top of the frame.
   */
  const domeEdge = (yFrac) => {
    // Clamped to the table's own range. Past the deepest traced row there is no
    // sky at any x, but the scan would find no qualifying point and fall through
    // to 1 — reporting the whole frame as clear at exactly the depths where the
    // truth is the opposite.
    const y = Math.max(0, Math.min(yFrac, RIDGE_MAX_Y - 1e-4));
    for (let i = RIDGE.length - 1; i >= 0; i--) if (RIDGE[i][1] > y) return RIDGE[i][0];
    return 1;
  };

  // Below this the wordmark would be shrunk past the point of being a wordmark.
  // Rather than go smaller it is allowed to run into the granite, which is the
  // effect anyway — the type is meant to end up behind the rock.
  const MIN_SCALE = 0.84;

  /**
   * Size the centred wordmark to the clear sky. CSS can't do this on its own:
   * how much sky is on screen depends on how cover has cropped the frame, so at
   * some widths the last letters sit behind the granite before the page has
   * moved at all, which reads as a bug rather than as the effect. Centred makes
   * the limit symmetric — sky to the left of the middle is no help, only the
   * run from the middle out to the granite counts.
   */
  const fitType = (g) => {
    if (!g) return;
    const margin = Math.max(14, g.W * 0.02);

    /** Clear sky either side of the middle, level with a row of the frame. */
    const skyWidth = (framePx) => {
      // Frame pixels are not image fractions. When cover crops horizontally the
      // photograph is taller than the frame, so a row a quarter of the way down
      // the frame is further down the picture than a quarter — and reading the
      // ridge at the wrong row overstates the sky on wide, short viewports.
      const domeX = g.ox + domeEdge((framePx - g.oy) / g.dh) * g.dw;
      return 2 * (domeX - g.W / 2) - margin * 2;
    };

    /** Shrink el to fit, but never past floor — below that let it tuck. */
    const fit = (el, bottom, floor) => {
      el.style.fontSize = '';                       // always measure from the CSS size
      const size = parseFloat(getComputedStyle(el).fontSize);
      const natural = el.offsetWidth;
      if (!natural) return;
      const avail = skyWidth(bottom());
      if (avail < natural) {
        el.style.fontSize = `${Math.max(size * floor, size * avail / natural).toFixed(1)}px`;
      }
    };

    fit(word, () => type.offsetTop + word.offsetHeight, MIN_SCALE);
    // The subline sits lower, where the sloping wall has taken more of the sky,
    // so it needs its own measurement — the wordmark clearing the granite says
    // nothing about whether the line beneath it does.
    fit(sub, () => type.offsetTop + type.offsetHeight, 0.7);
  };

  /**
   * The site header is fixed and paints over the page, so a stage pinned at
   * top: 0 slides underneath it and takes the wordmark with it. It also hides
   * itself on scroll down by translating out of view rather than by collapsing,
   * which is why two different numbers come out of here:
   *
   *   visible — the header's current bottom edge, transform included. Drives the
   *             pin, so the print rides up as the header slides away.
   *   layout  — its untransformed height. Drives the sink, because reading the
   *             moving value there would jog the wordmark every time the header
   *             appeared or disappeared.
   *
   * Both are measured rather than written down: the height differs between
   * breakpoints and an announcement bar would add to it. A header that simply
   * scrolls away with the page needs no offset at all, hence the position test.
   */
  let headerEls = [];
  let headerLayoutH = 0;
  let pinnedAt = -1;
  const watched = new WeakSet();

  const findHeader = () => {
    headerEls = [...document.querySelectorAll('#header, header.header, .sqs-announcement-bar-dropzone')]
      .filter((el) => !el.closest('.taro-intro'))
      .filter((el) => {
        const cs = getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden'
          && (cs.position === 'fixed' || cs.position === 'sticky');
      });
    headerLayoutH = headerEls.reduce((m, el) => Math.max(m, el.offsetHeight), 0);
    // The header slides in and out over 140ms, and that transition outlives the
    // scroll event that started it. Without this the pin is left wherever the
    // last scroll frame saw the header mid-slide, and the print sits stranded a
    // header's height down the page with nothing above it.
    headerEls.forEach((el) => {
      if (watched.has(el)) return;
      watched.add(el);
      el.addEventListener('transitionend', request, { passive: true });
    });
  };

  const syncHeaderPin = () => {
    const px = Math.max(0, Math.round(
      headerEls.reduce((m, el) => Math.max(m, el.getBoundingClientRect().bottom), 0)));
    if (px === pinnedAt) return;
    pinnedAt = px;
    wrap.style.setProperty('--taro-header-h', `${px}px`);
  };

  /**
   * Cut the print out along its torn edge, so what lies below the tear is
   * whatever is behind the intro — the photograph in the section underneath,
   * which is pulled up to meet it — rather than a strip of paper-coloured fill.
   *
   * The mask is an inline SVG data URI rather than a referenced <mask> element
   * because the deckle is a filter, and filters render inside an SVG used as an
   * image. A clip-path would take the shape but not the fibres.
   */
  const layoutSheet = () => {
    const w = Math.round(frame.clientWidth), h = Math.round(frame.clientHeight);
    if (!w || !h) return;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<filter id="d" x="-8%" y="-30%" width="116%" height="160%" color-interpolation-filters="sRGB">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.014 0.055" numOctaves="4" seed="11" result="n"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="n" scale="17" xChannelSelector="R" yChannelSelector="G"/>` +
      `</filter>` +
      `<path d="${sheetPath(w, h, 7)}" fill="#fff" filter="url(#d)"/></svg>`;
    const url = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
    sheet.style.webkitMaskImage = url;
    sheet.style.maskImage = url;
  };

  const draw = () => {
    syncHeaderPin();
    // Progress has to run from where the visitor actually starts to where the
    // stage unpins, and it cannot be read off the sticky offset. The header
    // overlays the page rather than pushing it down, so the wrapper begins at
    // the very top of the document and sticky has already clamped the stage a
    // header's height into its travel before a single pixel has been scrolled —
    // measuring from there starts the sink around a sixth of the way in.
    const y = window.scrollY || 0;
    const travel = wrap.offsetHeight - stage.clientHeight;
    const docTop = wrap.getBoundingClientRect().top + y;   // constant across scroll
    const start = Math.max(0, docTop - headerLayoutH);
    const span = docTop - headerLayoutH + travel - start;
    const p = span > 0 ? Math.max(0, Math.min(1, (y - start) / span)) : 0;

    // The type sinks and grows; the ridge in front of it does the hiding.
    const sink = SINK * p * p * frame.clientHeight;
    type.style.transform = `translateY(${sink.toFixed(1)}px) scale(${(1 + (GROW - 1) * p).toFixed(4)})`;
    type.style.opacity = p > 0.86 ? Math.max(0, 1 - (p - 0.86) / 0.14).toFixed(3) : 1;

    // Slow push-out for depth. Kept small: every extra percent here is another
    // percent of upscaling on an image that has none to spare.
    back.style.transform = fore.style.transform = `scale(${(1.03 - 0.03 * p).toFixed(4)})`;
  };

  let queued = false;
  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; draw(); });
  };

  /**
   * Pull the section below up until its top reaches the TOP of the torn band,
   * so the whole tear lies over it and the photograph there emerges from under
   * the paper rather than starting at a seam below a strip of bare page.
   *
   * The amount can't be a constant: it is whatever is left of the viewport under
   * the pinned print, which depends on the header and the window. A margin does
   * not change the wrapper's own box, so this cannot feed back into the travel
   * it is derived from.
   */
  const setOverlap = () => {
    if (reduced.matches) { wrap.style.height = ''; wrap.style.marginBottom = ''; return; }
    const frameH = stage.clientHeight;
    if (!frameH) return;
    // Pin length measured against the print, not the window — see PIN.
    wrap.style.height = `${Math.round(frameH * (1 + PIN) + headerLayoutH)}px`;
    const travel = wrap.offsetHeight - frameH;
    // A header's height of slack on top of the tear. The print pins to the
    // header's visible edge, so when the header hides on scroll-down the print
    // rides up by its height while the section below — being in normal flow —
    // stays put. Line the two up exactly and that movement opens a band of bare
    // page between the torn edge and the photograph. With the slack the section
    // simply runs further up behind the print, where it cannot be seen, and the
    // tear has something under it in either header state.
    const overlap = Math.max(0, travel + TEAR * frameH);
    wrap.style.marginBottom = `${-Math.round(overlap)}px`;
  };

  const relayout = () => {
    // Re-found on every relayout because the header swaps between breakpoints.
    findHeader();
    syncHeaderPin();
    const g = geom();
    applyForeground(g);
    fitType(g);
    layoutSheet();
    setOverlap();
    draw();
  };

  // relayout() forces a dozen synchronous layouts and rebuilds both the clip
  // polygon and the tear path, and resize and the ResizeObserver both fire for
  // the same change, so it is coalesced to one per frame as scrolling already is.
  let layoutQueued = false;
  const scheduleRelayout = () => {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(() => { layoutQueued = false; relayout(); });
  };

  relayout();   // the ridge is baked, so the first layout doesn't wait on the image
  if (!(back.complete && back.naturalWidth)) {
    back.addEventListener('load', scheduleRelayout, { once: true });
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', scheduleRelayout, { passive: true });
  // Catches the case where the frame has no size at boot — a hidden tab, a
  // deferred layout — and lays out properly the moment it gets one.
  if (typeof ResizeObserver === 'function') new ResizeObserver(scheduleRelayout).observe(frame);
  // Webfonts change two things that are measured here: the wordmark's width, and
  // the site header's height, which decides where the stage pins. `ready` can
  // already be resolved on a warm load, so loadingdone is listened for too.
  window.addEventListener('load', scheduleRelayout);
  if (document.fonts) {
    document.fonts.ready.then(scheduleRelayout).catch(() => {});
    document.fonts.addEventListener?.('loadingdone', scheduleRelayout);
  }
});
