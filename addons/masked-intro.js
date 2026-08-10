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
          <img class="taro-intro__layer taro-intro__back" src="${PHOTO}?format=2500w" alt="" aria-hidden="true">
          <div class="taro-intro__type">
            <h1 class="taro-intro__word">${WORDMARK}</h1>
            <p class="taro-intro__sub">${SUBLINE}</p>
          </div>
          <img class="taro-intro__layer taro-intro__fore" src="${PHOTO}?format=2500w" alt="" aria-hidden="true">
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
    const overlap = Math.max(0, travel - headerLayoutH + TEAR * frameH);
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
