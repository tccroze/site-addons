// A 35mm contact-sheet strip above the homepage footer.
//
// A dark band of film drifts slowly leftwards between the red "READY? LET'S
// TALK" section and the footer: sprocket holes top and bottom, a dozen of the
// site's own stills framed at 3:2, and a tiny orange edge-print along the
// rebate — "TARO CROZE 400TX" and the frame numbers, the way Kodak prints
// them. The whole strip is one link to /stills. Hovering it stops the reel.
//
// Where the frames come from. The brief had them scraped from /stills, but
// the live /stills page is a landing page — the only <img> tags on it are the
// header logo — and the masonry galleries live one level down: /wildlife,
// /portraits, /35film and friends. So the frames are fetched from /35film,
// the 35mm gallery (thirty-odd photographs, most of them landscape), which is
// also the only honest source for a strip pretending to be a roll of 400TX.
// /stills is kept as a second attempt in case a gallery is ever placed there.
// Landscape frames are preferred — a portrait cropped to 3:2 loses its
// subject — and the pick is spread evenly across the roll rather than being
// the first twelve, so the strip samples the gallery instead of its opening.
//
// Every dimension is a pixel constant, on purpose. The copy width is
// FRAMES × FRAME_PITCH, which means the drift distance, the number of copies
// needed to cover the viewport, and the sprocket pitch are all known without
// measuring a single box. The sprocket rows are a one-tile SVG background
// exactly one cell wide (eight holes, as on real 35mm), so no fractional
// background-repeat ever has to meet itself at a cell boundary.
//
// Drift is a CSS animation on transform only. The reel is duplicated and the
// keyframe travels exactly one copy, so the wrap is invisible. It pauses on
// hover (fenced on hover:hover and pointer:fine, like cursor.js), on keyboard
// focus, and — via IntersectionObserver — whenever the strip is off screen,
// so it costs nothing while the visitor is anywhere else on the page.
// prefers-reduced-motion is a media query in the stylesheet: the browser
// consults it live, and a mid-session flip stops the reel where it stands.
//
// Lazy by construction: nothing is fetched or built until the footer comes
// within 800px of the viewport. If the fetch fails, or the page parses to
// fewer than six usable frames, nothing is inserted and nothing is logged
// above a note — the homepage simply ends the way it always did.
//
// Progressive enhancement: the strip does not exist without JS. No content is
// hidden waiting on it, and the footer's own add-ons (signature.js measures
// from the page bottom and re-measures on a slow interval) absorb the extra
// height without being told.

import { defineAddon, css, log } from '../lib/util.js';

const SOURCES = ['/35film', '/stills'];  // tried in order; first with enough frames wins
const LINK = '/stills';                  // where a click on the strip lands
const FRAMES = 12;                       // frames per copy of the reel
const MIN_FRAMES = 6;                    // fewer than this and no strip is built
const FRAME_BASE = 12;                   // edge-print numbering starts here: 12, 12A, 13…
const STOCK = 'TARO CROZE 400TX';        // house brand posing as a film stock
const NEAR = '800px 0px';                // footer distance at which the build starts
const LOOP_S = 40;                       // seconds for one copy to drift past

// Geometry — all px. A 35mm frame pitch is 38mm with a 36×24 image, so a
// 190px cell holds a 180×120 image with 5px of rebate each side. Perforations
// run eight to the frame (pitch 23.75px); KS perfs are 2.8×2mm with rounded
// corners, scaled here to 14×10 with r=2.5.
const FRAME_PITCH = 190;
const IMG_W = 180, IMG_H = 120;
const PERF_ROW = 18, PRINT_ROW = 16;
const HOLE_W = 14, HOLE_H = 10, HOLE_R = 2.5;
const HOLES_PER_FRAME = 8;
const COPY_W = FRAMES * FRAME_PITCH;

const INK = '#e8934a';                   // edge-print orange
const BASE = '#151515';                  // the film base
const HOLE = 'rgba(246,238,213,0.38)';   // page cream, dimmed: light through a hole

defineAddon('film-strip', () => {
  if (location.pathname !== '/') return;
  const footer = document.querySelector('footer');
  if (!footer || !footer.parentNode) return;
  if (document.querySelector('.taro-film')) return;   // idempotent

  // One SVG tile, one cell wide, eight rounded holes. Built as a data URI so
  // there is no asset to deploy and no second request.
  const pitch = FRAME_PITCH / HOLES_PER_FRAME;
  const holes = Array.from({ length: HOLES_PER_FRAME }, (_, i) =>
    `<rect x="${(i * pitch + (pitch - HOLE_W) / 2).toFixed(3)}" y="0" width="${HOLE_W}" height="${HOLE_H}" rx="${HOLE_R}"/>`
  ).join('');
  const perfs = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_PITCH}" height="${HOLE_H}" fill="${HOLE}">${holes}</svg>`
  )}")`;

  const injectCss = () => css('film-strip', `
    .taro-film {
      position: relative;
      width: 100%;
      background: ${BASE};
      /* clip, not hidden: a focused element inside an overflow:hidden box can
         scroll that box to reveal itself, and a stray scrollLeft here would
         shove the reel off its keyframe. clip cannot be scrolled. hidden is
         kept first as the fallback for browsers without clip. */
      overflow: hidden;
      overflow: clip;
      contain: layout paint;
      line-height: 0;
      font-size: 0;   /* no whitespace gaps between inline-ish children */
    }
    .taro-film,
    .taro-film * { box-sizing: border-box; margin: 0; padding: 0; }

    .taro-film-link {
      display: block;
      cursor: pointer;
      text-decoration: none;
    }
    /* The focus ring is drawn on the link's own box, which is the visible
       band (the 4000px track overflows it), and only for keyboard focus: a
       mouse click focuses a link too, and the ring would otherwise flash up
       under the page-transition veil on the way out. */
    .taro-film-link:focus-visible {
      outline: 2px solid ${INK};
      outline-offset: -2px;
    }

    .taro-film-track {
      display: flex;
      width: max-content;
      transform: translate3d(0, 0, 0);
      animation: taro-film-drift ${LOOP_S}s linear infinite;
      animation-play-state: paused;        /* runs only while on screen */
    }
    .taro-film.is-on .taro-film-track {
      animation-play-state: running;
      will-change: transform;              /* promoted only while visible */
    }
    @keyframes taro-film-drift {
      to { transform: translate3d(-${COPY_W}px, 0, 0); }
    }

    /* Hover stops the reel so a frame can be looked at. Fenced on capability
       rather than the boot check alone, so a phone never pauses on a phantom
       hover left behind by a tap. Focus stops it on any device. */
    @media (hover: hover) and (pointer: fine) {
      .taro-film:hover .taro-film-track { animation-play-state: paused; }
    }
    .taro-film:focus-within .taro-film-track { animation-play-state: paused; }

    .taro-film-reel {
      display: flex;
      list-style: none;
      flex: 0 0 auto;
    }
    .taro-film-frame {
      flex: 0 0 ${FRAME_PITCH}px;
      width: ${FRAME_PITCH}px;
      padding: ${PERF_ROW}px ${(FRAME_PITCH - IMG_W) / 2}px;
      background-color: ${BASE};
      background-image: ${perfs}, ${perfs};
      background-repeat: no-repeat, no-repeat;
      background-size: ${FRAME_PITCH}px ${HOLE_H}px;
      background-position: 0 ${(PERF_ROW - HOLE_H) / 2}px, 0 calc(100% - ${(PERF_ROW - HOLE_H) / 2}px);
    }
    .taro-film-window {
      width: ${IMG_W}px;
      height: ${IMG_H}px;
      overflow: hidden;
      background: #0a0a0a;                 /* the frame before its image lands */
    }
    .taro-film-window img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 500ms cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    @media (hover: hover) and (pointer: fine) {
      .taro-film-frame:hover img { transform: scale(1.04); }
    }

    /* The rebate. Same typographic voice as edge-print.js's captions so the
       two film conceits on the site read as one; the site's own monospace
       (Cousine) is the fallback where no condensed face exists. */
    .taro-film-print {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: ${PRINT_ROW}px;
      padding: 0 2px;
      color: ${INK};
      font-family: 'Arial Narrow', 'Helvetica Neue Condensed', 'Roboto Condensed', Cousine, 'Courier New', ui-monospace, monospace;
      font-stretch: condensed;
      font-size: 9px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      white-space: nowrap;
      user-select: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .taro-film-track,
      .taro-film.is-on .taro-film-track { animation: none; will-change: auto; }
      .taro-film-window img { transition: none; }
    }
  `);

  // ---- frames -------------------------------------------------------------

  // Pull a set of frames out of a gallery page's HTML. DOMParser documents
  // have no browsing context, so nothing in the fetched page loads or runs —
  // this is text in, a list of URLs out. Masonry tiles carry the original on
  // data-src and its size on data-image-dimensions; the CDN cuts any width on
  // request with ?format=Nw.
  const parseFrames = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const seen = new Set();
    const all = [];
    doc.querySelectorAll('.gallery-masonry-item img').forEach((img) => {
      const raw = img.getAttribute('data-src') || img.getAttribute('src') || '';
      const url = raw.split('?')[0];
      if (!/^https?:\/\//.test(url) || seen.has(url)) return;
      seen.add(url);
      const dims = (img.getAttribute('data-image-dimensions') || '').split('x').map(Number);
      const [fx, fy] = (img.getAttribute('data-image-focal-point') || '').split(',').map(Number);
      all.push({
        url,
        landscape: dims.length === 2 && dims[0] > dims[1],
        focal: (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) ? `${(fx * 100).toFixed(1)}% ${(fy * 100).toFixed(1)}%` : '50% 50%',
      });
    });
    // Landscape first, portraits only to make up the numbers; then sample
    // evenly so the strip spans the roll.
    const pool = all.filter((f) => f.landscape).concat(all.filter((f) => !f.landscape));
    if (pool.length < MIN_FRAMES) return [];
    const n = Math.min(FRAMES, pool.length);
    return Array.from({ length: n }, (_, i) => pool[Math.floor((i * pool.length) / n)]);
  };

  const fetchFrames = async () => {
    for (const path of SOURCES) {
      try {
        const res = await fetch(path, { credentials: 'same-origin' });
        if (!res.ok) continue;
        const frames = parseFrames(await res.text());
        if (frames.length >= MIN_FRAMES) return frames;
      } catch (_) { /* try the next source */ }
    }
    return [];
  };

  // ---- build --------------------------------------------------------------

  const buildReel = (frames) => {
    const reel = document.createElement('ul');
    reel.className = 'taro-film-reel';
    frames.forEach((f, i) => {
      const li = document.createElement('li');
      li.className = 'taro-film-frame';

      const win = document.createElement('div');
      win.className = 'taro-film-window';
      const img = document.createElement('img');
      img.alt = '';                 // the link carries the name; these are decoration
      img.width = IMG_W; img.height = IMG_H;
      // Eager, not lazy: the strip is only built once the footer is near, so
      // the deferral has already happened, and a frame that drifts in from
      // the right should arrive developed rather than as a black rectangle
      // waiting on the lazy-load threshold. The clones repeat these URLs and
      // come out of cache.
      img.loading = 'eager'; img.decoding = 'async';
      img.src = `${f.url}?format=500w`;
      img.srcset = `${f.url}?format=300w 300w, ${f.url}?format=500w 500w, ${f.url}?format=750w 750w`;
      img.sizes = `${IMG_W}px`;
      img.style.objectPosition = f.focal;
      win.appendChild(img);

      // 12 … TARO CROZE 400TX … 12A — number at the frame's leading edge, the
      // half-frame "A" at its trailing edge, stock name between.
      const n = FRAME_BASE + i;
      const print = document.createElement('div');
      print.className = 'taro-film-print';
      print.setAttribute('aria-hidden', 'true');
      [`${n}`, STOCK, `${n}A`].forEach((t) => {
        const s = document.createElement('span');
        s.textContent = t;
        print.appendChild(s);
      });

      li.appendChild(win);
      li.appendChild(print);
      reel.appendChild(li);
    });
    return reel;
  };

  const build = (frames) => {
    injectCss();

    const strip = document.createElement('aside');
    strip.className = 'taro-film';
    strip.setAttribute('aria-label', 'Contact sheet — a strip of stills');

    // One link for the whole strip rather than one per frame: every frame
    // still lands on /stills, but a keyboard user meets a single stop instead
    // of twelve identical ones, and page-transition.js sees a plain <a>.
    const link = document.createElement('a');
    link.className = 'taro-film-link';
    link.href = LINK;
    link.setAttribute('aria-label', 'Browse the stills');

    const track = document.createElement('div');
    track.className = 'taro-film-track';
    const reel = buildReel(frames);
    track.appendChild(reel);

    // Copies: enough that the strip never runs out on the right before the
    // keyframe wraps — a 2280px copy needs three on a 2560px display, two
    // everywhere else — and the duplicates are hidden from assistive tech.
    // window.innerWidth is no layout read; and resize only ever adds copies.
    let copies = 1;
    const cover = () => {
      const want = Math.max(2, Math.ceil(window.innerWidth / COPY_W) + 1);
      while (copies < want) {
        const dup = reel.cloneNode(true);
        dup.setAttribute('aria-hidden', 'true');
        track.appendChild(dup);
        copies += 1;
      }
    };
    cover();

    link.appendChild(track);
    strip.appendChild(link);
    footer.parentNode.insertBefore(strip, footer);

    // Run the reel only while it is on screen.
    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => strip.classList.toggle('is-on', e.isIntersecting));
      }, { rootMargin: '100px 0px' });
      io.observe(strip);
    } else {
      strip.classList.add('is-on');
    }

    let timer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(cover, 200);
    }, { passive: true });
  };

  // ---- arm ----------------------------------------------------------------

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    fetchFrames().then((frames) => {
      if (frames.length < MIN_FRAMES) { log('film-strip: no frames, standing down'); return; }
      build(frames);
    }).catch(() => { /* no strip, no noise */ });
  };

  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: NEAR });
    io.observe(footer);
  } else {
    // No observer, no way to know how near the footer is: build when the
    // browser is idle, which is still after the page has painted.
    (window.requestIdleCallback || ((fn) => setTimeout(fn, 1500)))(start);
  }
});
