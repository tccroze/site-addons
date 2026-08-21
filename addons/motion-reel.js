// The word MOTION with the reel playing inside the letterforms — /motion only.
//
// A block is added at the very top of the page, between the header and the
// first Squarespace section: the word set in the site's display face at about
// 18vw, and through the letters a muted, looping clip of footage. Until the
// footage is playing — and for good if it never does, or if the visitor has
// asked for reduced motion — the letters are solid teal instead, so the block
// reads as a typographic title in every state and never as a broken video.
//
// Where the footage comes from. Every <video> on /motion is Squarespace's
// native player: a blob: URL over an HLS stream of MPEG-TS segments, which a
// second <video> cannot share and Chrome and Firefox cannot play unaided. The
// homepage MOTION tile, though, is a plain file (IMG_1748-2.MOV — H.264/AAC,
// 14.5s, moov up front, 17MB) linked straight from the site's file manager, so
// that is what plays here. Its path is a constant; if it ever 404s, the
// homepage HTML is fetched once and its first <video>/<source> src is tried
// instead, and only if that fails too do the letters stay teal. Fetching the
// homepage is kept for the failure path on purpose — it is ~850KB of HTML per
// visit for a URL that has not changed.
//
// How the letters are cut. The clip is not an SVG clipPath. An SVG-reference
// clip-path over a <video> is the one place WebKit has been unreliable: the
// video is a composited layer, and a url(#clipPath) is applied at paint time,
// which composited descendants can escape. A raster mask-image, by contrast,
// composites in every engine (it is the same mechanism signature.js and
// page-transition.js already lean on). So the word is drawn once into a canvas
// in the real web font — canvas reads document fonts, and an external SVG
// image would not — and handed over as a PNG data: URL on --taro-mr-mask. One
// mask serves both states: the masked box has a teal background, with the
// video inside it; whichever is on top shows through the same letters, and
// the two can never be out of register.
//
// The mask is re-rasterised only when the width or device pixel ratio changes
// (debounced resize), never on scroll — the scroll path here is nothing but an
// IntersectionObserver that pauses the clip when the block is off screen and
// resumes it on return. Reduced motion is consulted live from the
// MediaQueryList, not frozen at boot: switch it on mid-visit and the clip
// pauses and yields to the teal at once; switch it off and it resumes.
//
// Progressive enhancement: the block is built entirely by this file. No JS,
// no block, and nothing Squarespace renders is moved, hidden or removed —
// the insertion is one node before the first section, and deleting the import
// line from main.js is a complete rollback.

import { defineAddon, css } from '../lib/util.js';

const WORD = 'MOTION';
const TEAL = '#85b7b2';
const LETTER_SCALE = 0.18;   // font-size as a fraction of the block's width (≈18vw)
const MAX_INK = 0.92;        // the word may fill at most this much of the width
const TRACKING_EM = 0.05;    // site headings are tracked 0.09em; tighter at this size
const MAX_DPR = 2;           // the mask raster's ceiling — 3x phones get a 2x mask
const FONT_WAIT_MS = 2500;   // paint in the fallback face rather than wait forever

// The homepage tile's footage (see the header comment), as a same-origin path
// so it follows the domain. It 302s to static1.squarespace.com; <video> follows.
const TILE_SRC = '/s/IMG_1748-2.MOV';
// The display face as Squarespace names it, used only if no heading is there to
// read the live value off.
const FONT_FALLBACK = 'tan---nimbus-regular-webfont-tn3woj';

defineAddon('motion-reel', () => {
  if (location.pathname.replace(/\/$/, '') !== '/motion') return;

  // No masks, no block: an unmasked teal slab with a video in it is not a
  // fallback anyone wants. Same call as signature.js.
  if (!(CSS.supports('mask-image', 'linear-gradient(#000, #000)')
     || CSS.supports('-webkit-mask-image', 'linear-gradient(#000, #000)'))) return;

  const first = document.querySelector('section[data-section-id]');
  if (!first || !first.parentNode) return;

  // The face comes off a live heading rather than a constant, so a font change
  // in the Squarespace editor carries through here without a deploy.
  const heading = document.querySelector('main h1, main h2, h1, h2');
  const family = (heading && getComputedStyle(heading).fontFamily.trim()) || `${FONT_FALLBACK}, sans-serif`;

  // The header is position:fixed and the page starts underneath it (the first
  // section's top is 0 and Squarespace pads that section's content to clear
  // it). Once this block is first, it inherits that job: --taro-mr-clear holds
  // the header's height whenever it overlaps the top of the page, and 0 when
  // the layout already keeps clear of it. Measured at boot and on resize only.
  const header = document.querySelector('#header');
  const clearance = () => {
    if (!header) return 0;
    const pos = getComputedStyle(header).position;
    if (pos !== 'fixed' && pos !== 'absolute') return 0;
    const h = header.getBoundingClientRect().height;
    const firstTop = first.getBoundingClientRect().top + window.scrollY - (block.offsetHeight || 0);
    return firstTop >= h - 1 ? 0 : h;
  };

  css('motion-reel', `
    .taro-motion-reel {
      position: relative;
      padding: calc(var(--taro-mr-clear, 0px) + clamp(28px, 5vw, 72px)) 0 clamp(28px, 5vw, 72px);
      overflow: hidden;
    }
    /* The masked box. Teal underneath, footage on top, one mask over both.
       Height is set from the rendered cap height, so the letters sit flush in
       the box and the footage behind them is centred on the word. Hidden
       until the first mask is ready: before that it would be a bare teal bar. */
    .taro-mr-word {
      position: relative;
      width: 100%;
      height: var(--taro-mr-h, 0px);
      background: ${TEAL};
      -webkit-mask-image: var(--taro-mr-mask);
              mask-image: var(--taro-mr-mask);
      -webkit-mask-repeat: no-repeat;
              mask-repeat: no-repeat;
      -webkit-mask-size: 100% 100%;
              mask-size: 100% 100%;
      opacity: 0;
      transition: opacity 400ms ease;
    }
    .taro-mr-word.is-ready { opacity: 1; }
    /* The clip fades up over the teal once it is actually playing, so a slow
       connection sees solid letters resolve into footage rather than a blank
       or a stalled first frame. object-fit covers the box; the box is a wide
       strip, so what shows is a band across the middle of the frame. */
    .taro-mr-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 50% 45%;
      opacity: 0;
      transition: opacity 900ms ease;
      pointer-events: none;
    }
    .taro-mr-word.is-live .taro-mr-video { opacity: 1; }
    /* Belt and braces under the JS check: reduced motion means teal letters,
       even if the change event never reaches us. */
    @media (prefers-reduced-motion: reduce) {
      .taro-mr-word, .taro-mr-video { transition: none; }
      .taro-mr-video { display: none; }
    }
  `);

  const block = document.createElement('div');
  block.className = 'taro-motion-reel';
  block.setAttribute('role', 'img');
  block.setAttribute('aria-label', WORD.charAt(0) + WORD.slice(1).toLowerCase());

  const word = document.createElement('div');
  word.className = 'taro-mr-word';

  const video = document.createElement('video');
  video.className = 'taro-mr-video';
  // Both the property and the attribute: autoplay policy is decided off the
  // attribute in some engines and the property in others.
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  ['muted', 'loop', 'playsinline', 'autoplay'].forEach((a) => video.setAttribute(a, ''));
  video.preload = 'auto';
  video.tabIndex = -1;
  video.setAttribute('aria-hidden', 'true');
  video.disablePictureInPicture = true;
  video.setAttribute('disableremoteplayback', '');

  word.appendChild(video);
  block.appendChild(word);
  first.parentNode.insertBefore(block, first);

  // Anything that goes wrong from here leaves no half-built block behind.
  const abandon = () => { block.remove(); };

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) { abandon(); return; }

  // ---- the mask ----------------------------------------------------------

  let fontReady = false;
  let lastKey = '';
  const setFont = (size) => {
    ctx.font = `400 ${size}px ${family}`;
    // Canvas letter-spacing is recent (Chrome 99, Safari 17, Firefox 121).
    // Where it is missing the word is simply set tight; nothing else depends
    // on it, since the same drawing is the only rendering of the text.
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${(TRACKING_EM * size).toFixed(2)}px`;
  };
  const paint = () => {
    const W = word.clientWidth;
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    if (!W) return;
    const key = `${W}|${dpr}|${fontReady}`;
    if (key === lastKey) return;
    lastKey = key;

    // Size the word from the width, then shrink it only if its ink would
    // overrun the margin — the face is wide, and 18vw of it is close to the
    // full width as it is. Ink extents, not advance width: the advance would
    // count the tracking after the last letter and centre the word off-true.
    let size = W * LETTER_SCALE;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    setFont(size);
    let m = ctx.measureText(WORD);
    const inkOf = (mt) => ((mt.actualBoundingBoxLeft + mt.actualBoundingBoxRight) || mt.width);
    if (inkOf(m) > W * MAX_INK) {
      size *= (W * MAX_INK) / inkOf(m);
      setFont(size);
      m = ctx.measureText(WORD);
    }
    // Capitals only, so the box is the cap height plus a 2px bleed for the
    // antialiased edge; 0.72em is the stand-in where the metrics API is absent.
    const ascent = m.actualBoundingBoxAscent || size * 0.72;
    const descent = Math.max(0, m.actualBoundingBoxDescent || 0);
    const ink = inkOf(m);
    const left = m.actualBoundingBoxLeft || 0;
    const PAD = 2;
    const H = Math.ceil(ascent + descent + PAD * 2);

    // Resizing a canvas resets its whole context state, font included, so the
    // font is set again after, not before.
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000';
    setFont(size);
    ctx.fillText(WORD, (W - ink) / 2 + left, PAD + ascent);

    word.style.setProperty('--taro-mr-h', `${H}px`);
    word.style.setProperty('--taro-mr-mask', `url("${canvas.toDataURL('image/png')}")`);
    word.classList.add('is-ready');
  };

  const layout = () => {
    try {
      block.style.setProperty('--taro-mr-clear', `${clearance()}px`);
      paint();
    } catch (err) {
      abandon();
      throw err;
    }
  };

  // Wait for the face before the first paint — painting in the fallback and
  // then swapping would flash a different word at the top of the page — but
  // not indefinitely: if the font never arrives the block still appears, in
  // whatever the browser substitutes.
  const fontsLoaded = (document.fonts && document.fonts.load)
    ? document.fonts.load(`400 100px ${family}`).then(() => document.fonts.ready)
    : Promise.resolve();
  let painted = false;
  const firstPaint = () => { if (!painted) { painted = true; fontReady = true; layout(); } };
  fontsLoaded.then(firstPaint, firstPaint);
  setTimeout(firstPaint, FONT_WAIT_MS);

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (painted) layout(); }, 150);
  }, { passive: true });

  // ---- the footage -------------------------------------------------------

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Data Saver is treated like reduced motion: the clip is 17MB of decoration.
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  // Candidate sources, in order: any plain-file <video>/<source> already on
  // this page (none today — see the header comment), then the homepage tile.
  const tried = new Set();
  const queue = [...document.querySelectorAll('video[src], video source[src]')]
    .map((el) => el.getAttribute('src'))
    .filter((s) => s && !/^(blob|data):/i.test(s));
  queue.push(TILE_SRC);

  let discovered = false;
  let dead = false;
  const nextSource = () => {
    while (queue.length) {
      const s = queue.shift();
      if (tried.has(s)) continue;
      tried.add(s);
      video.src = s;
      video.load();
      return;
    }
    if (discovered) {
      // Every candidate failed. The letters are teal already; drop the
      // element so nothing keeps retrying or holding a decoder.
      dead = true;
      word.classList.remove('is-live');
      video.remove();
      return;
    }
    discovered = true;
    fetch('/', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.text() : ''))
      .then((html) => {
        const re = /<(?:video|source)\b[^>]*\ssrc=["']([^"']+)["']/gi;
        let m;
        while ((m = re.exec(html))) {
          if (!/^(blob|data):/i.test(m[1])) queue.push(m[1]);
        }
      })
      .catch(() => {})
      .then(nextSource);
  };
  video.addEventListener('error', () => {
    word.classList.remove('is-live');
    nextSource();
  });
  video.addEventListener('playing', () => {
    if (!reduce.matches) word.classList.add('is-live');
  });

  // One decision point for play/pause, consulted by every trigger. The source
  // is not even assigned until the block is on screen and motion is wanted,
  // so a reduced-motion visitor never downloads the clip at all.
  let visible = false;
  let loaded = false;
  const sync = () => {
    if (dead) return;
    const wanted = visible && !document.hidden && !reduce.matches && !saveData;
    if (wanted) {
      if (!loaded) { loaded = true; nextSource(); }
      const p = video.play();
      // Refused autoplay (iOS Low Power Mode, a strict policy) is not an
      // error here: the letters are teal and stay teal.
      if (p && p.catch) p.catch(() => {});
    } else {
      if (!video.paused) video.pause();
      // Reduced motion wants teal letters, not a frozen frame of the clip.
      if (reduce.matches) word.classList.remove('is-live');
    }
  };

  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { visible = e.isIntersecting; });
      sync();
    }, { rootMargin: '120px 0px' });
    io.observe(block);
  } else {
    // Without the observer the clip simply plays: the old always-on behaviour,
    // correct if not as frugal.
    visible = true;
    sync();
  }
  document.addEventListener('visibilitychange', sync);
  // Older Safari lacks addEventListener on MediaQueryList; there the next
  // scroll past the block picks the change up via the observer instead.
  reduce.addEventListener?.('change', sync);
});
