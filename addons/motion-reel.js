// PROJECTS, cut out of the reel — /motion only.
//
// The page's own H1 stops being flat type and becomes a window: the hero's
// footage plays behind the word and shows only inside the letterforms. Nothing
// is inserted into the layout and nothing Squarespace rendered is removed. The
// heading stays exactly where it is, at exactly its own size; at the moment
// the footage is actually playing its glyphs turn transparent and a
// same-shaped cut-out, absolutely positioned over them, takes their place.
//
// TECHNIQUE, and why it is not either of the obvious two.
//
//   background-clip: text is the simpler idea and the right one when the fill
//   is an image or a gradient — but a CSS background cannot hold a <video>.
//   background-clip clips a *background*, and there is no way to make live
//   footage one. The pattern that looks like it works (video behind, text in
//   front) only works if the front element paints the page's own background
//   colour everywhere except the glyphs, which means knowing that colour,
//   repainting it, and covering anything else that happens to sit behind the
//   heading. It is a knockout, not a cut-out.
//
//   clip-path: url(#…) over the video is the SVG <text> route, and it is the
//   one place WebKit has been unreliable: a <video> is a composited layer, and
//   an SVG-referenced clip is applied at paint time, which composited
//   descendants can escape — you get the whole rectangle or you get nothing.
//   (Same reason signature.js and page-transition.js both reach for raster
//   masks instead.)
//
//   So: the SVG <text> idea, rasterised. The word is drawn once into a
//   <canvas> in the heading's own computed font and handed to mask-image as a
//   PNG data: URL. A raster mask composites in every engine, and canvas is the
//   only text renderer that uses the *document's* fonts — an SVG data: URI
//   used as an image cannot fetch a webfont at all, and would quietly set the
//   word in Helvetica. The mask is re-rasterised only when the heading's box
//   or the device pixel ratio changes; never on scroll.
//
// WHERE THE FOOTAGE COMES FROM. Only the hero's own background video, reused
// by src, so a second <video> on the same URL is a cache hit and not a second
// download. It is deliberately NOT taken from the films further down the page:
// every <video> inside a .sqs-block-video here is Squarespace's own player,
// which serves a blob: URL over an HLS stream of MPEG-TS segments. A second
// element cannot share a blob: URL from another element's MediaSource, and
// Chrome and Firefox cannot play the .m3u8 unaided. Both are filtered out
// below. If nothing playable is found, this add-on does nothing at all and
// the heading is left exactly as Squarespace rendered it.
//
// DEGRADING. No JS, no font, no playable source, no mask support, reduced
// motion, Data Saver, refused autoplay, a heading that has wrapped onto two
// lines — every one of those paths ends in "the heading looks normal". The
// glyphs are only ever made transparent in the same frame that an opaque
// cut-out of the same word appears over them, and the real text is handed
// straight back if anything later withdraws.

import { defineAddon, css } from '../lib/util.js';

const WORD_MATCH = 'projects';  // which heading on /motion gets the treatment
const MAX_DPR = 2;              // the mask raster's ceiling — 3x phones get 2x
const FONT_WAIT_MS = 3000;      // give up on the face rather than wait forever
const BLEED_EM = 0.14;          // side margin on the mask, for ink overhang
const FADE_MS = 900;            // the footage fading up through the letters

const num = (v, fallback) => (typeof v === 'number' && isFinite(v) ? v : fallback);

defineAddon('motion-reel', () => {
  if (location.pathname.replace(/\/+$/, '').toLowerCase() !== '/motion') return;

  // No mask support, no effect. An unmasked video slab sitting over the
  // heading is not a fallback anyone wants. Same call as signature.js.
  if (!(CSS.supports('mask-image', 'linear-gradient(#000,#000)')
     || CSS.supports('-webkit-mask-image', 'linear-gradient(#000,#000)'))) return;

  // ---- the heading -------------------------------------------------------

  const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const heading = [...document.querySelectorAll('h1, h2')]
    .filter((h) => !h.closest('#header') && !h.closest('footer'))
    .find((h) => norm(h.textContent) === WORD_MATCH);
  if (!heading) return;

  // One text node, or nothing doing. Squarespace can wrap a heading's words in
  // spans for colour or weight runs; a mask drawn from one flat string would
  // then be set in the wrong face for part of the word, and there would be no
  // single box to hang it off. Rare here, but silent breakage is worse than
  // no effect.
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
  }
  if (nodes.length !== 1) return;
  const textNode = nodes[0];
  // The element that actually paints the glyphs — which is where the type and
  // the colour must be read from, and where the colour swap has to be written.
  const textEl = textNode.parentElement || heading;

  // ---- the source --------------------------------------------------------

  // A src a second <video> can genuinely play on its own. See the note at the
  // top about blob:/HLS: those belong to the element that created them.
  const playable = (s) => {
    if (!s) return '';
    if (/^(blob|data|mediastream):/i.test(s)) return '';
    if (/\.(m3u8|mpd)(\?|#|$)/i.test(s)) return '';
    return s;
  };
  const findSrc = () => {
    const vids = [...document.querySelectorAll('video')]
      .filter((v) => !v.closest('#header') && !v.closest('footer'));
    for (const v of vids) {
      // currentSrc first: it is the URL the browser actually settled on, and
      // it is absolute. It is empty until resource selection has run, which
      // is why this is retried on the hero's own load events below.
      const direct = playable(v.currentSrc) || playable(v.getAttribute('src'));
      if (direct) return direct;
      for (const s of v.querySelectorAll('source[src]')) {
        const cand = playable(s.getAttribute('src'));
        if (!cand) continue;
        // Skip a type this browser has already said it cannot play, so we do
        // not burn the one video element we are allowed on a dead candidate.
        if (s.type && v.canPlayType(s.type) === '') continue;
        return cand;
      }
    }
    return '';
  };

  let src = findSrc();

  // ---- styles ------------------------------------------------------------

  // Captured before anything is touched, so the reduced-motion rule below has
  // a real colour to hand the heading back, and the cut-out has an ink colour
  // to sit on while the footage fades up.
  const savedInlineColour = textEl.style.color;
  const inkColour = getComputedStyle(textEl).color || 'currentColor';

  css('motion-reel', `
    /* Absolutely positioned inside the heading, so it costs no layout and
       cannot add width to the page. Every number on it is written as a custom
       property by the paint below — the element itself never gets a
       measurement inline. */
    .taro-reel {
      position: absolute;
      left: var(--taro-reel-x, 0px);
      top: var(--taro-reel-y, 0px);
      width: var(--taro-reel-w, 0px);
      height: var(--taro-reel-h, 0px);
      pointer-events: none;
      background: var(--taro-reel-ink, currentColor);
      -webkit-mask-image: var(--taro-reel-mask);
              mask-image: var(--taro-reel-mask);
      -webkit-mask-repeat: no-repeat;
              mask-repeat: no-repeat;
      -webkit-mask-size: 100% 100%;
              mask-size: 100% 100%;
      -webkit-mask-position: 0 0;
              mask-position: 0 0;
      opacity: 0;
      /* Deliberately no transition on the box. The swap from live type to
         cut-out has to be instantaneous: fade it and both words are visible
         at half strength for a moment and the heading looks doubled. The box
         arrives already opaque, in the heading's own colour, so the swap is
         invisible — it is the footage inside it that fades. */
    }
    .taro-reel.is-on { opacity: 1; }

    .taro-reel video {
      display: block;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      /* The letters are a wide, short strip, so cover shows a band across the
         middle of the frame — which is the point: it reads as footage seen
         through a slot, not as a video squashed into a word. */
      object-fit: cover;
      object-position: 50% 50%;
      opacity: 0;
      transition: opacity ${FADE_MS}ms ease;
    }
    .taro-reel.is-live video { opacity: 1; }

    /* Belt and braces under the live JS check. The JS hands the heading its
       colour back the moment reduced motion is switched on, but if that change
       event never reaches us (older Safari has no listener on a
       MediaQueryList) this rule still does — and it is !important because the
       transparent colour is written inline, to win against whatever
       specificity Squarespace's theme brings. */
    @media (prefers-reduced-motion: reduce) {
      .taro-reel { display: none !important; }
      .taro-reel-cut { color: ${inkColour} !important; }
      .taro-reel video { transition: none; }
    }
  `);

  const overlay = document.createElement('span');
  overlay.className = 'taro-reel';
  overlay.setAttribute('aria-hidden', 'true');   // the real heading is the one announced

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // Canvas letter-spacing is recent (Chrome 99, Firefox 121, Safari 17.4).
  // Where it is missing the word is set a glyph at a time instead — see paint.
  const hasSpacing = 'letterSpacing' in ctx;

  // ---- measurement -------------------------------------------------------

  let measuring = false;

  /**
   * Where the rendered text actually sits, relative to the heading's padding
   * box (which is what an absolutely positioned child is offset from).
   * Returns null when the word has wrapped onto more than one line — at that
   * point one rectangle cannot describe it and the heading is left alone.
   *
   * Called on arm, on resize and on ResizeObserver only. Never on scroll.
   */
  const measure = () => {
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const rects = range.getClientRects();
    if (rects.length !== 1) return null;
    const line = rects[0];
    if (!line.width || !line.height) return null;

    const hs = getComputedStyle(heading);
    const hr = heading.getBoundingClientRect();
    const originX = hr.left + (parseFloat(hs.borderLeftWidth) || 0);
    const originY = hr.top + (parseFloat(hs.borderTopWidth) || 0);

    // The baseline, exactly, rather than reconstructed from font metrics.
    // An empty inline-block with overflow:hidden takes its baseline from its
    // bottom margin edge, so a zero-sized one dropped in beside the text
    // collapses onto that text's baseline and its top edge reports it. Font
    // metrics can only estimate this — half-leading depends on which of the
    // face's several ascent/descent pairs the platform picked — and the whole
    // effect rests on the cut-out landing on the real glyphs.
    //
    // Inserted AFTER the range is read, because it would otherwise be part of
    // what the range reports, and removed in the same task, so a MutationObserver
    // elsewhere sees an insertion and a removal that cancel out.
    let baseline = NaN;
    const strut = document.createElement('span');
    strut.setAttribute('aria-hidden', 'true');
    strut.style.cssText =
      'display:inline-block;width:0;height:0;overflow:hidden;vertical-align:baseline;';
    measuring = true;
    try {
      textNode.parentNode.insertBefore(strut, textNode.nextSibling);
      baseline = strut.getBoundingClientRect().top - line.top;
    } catch (e) {
      // Fall through — paint() reconstructs the baseline from font metrics.
    } finally {
      strut.remove();
      measuring = false;
    }
    // A strut on a line of its own, or no layout at all, reports nonsense.
    if (!(baseline > 0 && baseline < line.height * 2)) baseline = NaN;

    return { line, originX, originY, baseline };
  };

  /** The type, read off the live element every paint — the heading is sized
   *  in vw, so this changes with the viewport and cannot be cached at boot. */
  let ink = inkColour;
  const readType = () => {
    const t = getComputedStyle(textEl);
    const size = parseFloat(t.fontSize) || 0;
    // The colour is the one thing here that must NOT be believed while the
    // effect is running: by then this file has set the glyphs transparent, so
    // a repaint on resize would read rgba(0,0,0,0) back and give the cut-out a
    // see-through backing. Last known real colour wins.
    if (!textEl.classList.contains('taro-reel-cut') && t.color) ink = t.color;
    let word = textNode.nodeValue.replace(/\s+/g, ' ').trim();
    // The DOM string is not always what is drawn: the sibling headings on this
    // page are lower-case in the markup and set in caps by the theme.
    if (t.textTransform === 'uppercase') word = word.toUpperCase();
    else if (t.textTransform === 'lowercase') word = word.toLowerCase();
    else if (t.textTransform === 'capitalize') {
      word = word.replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase());
    }
    return {
      size,
      word,
      colour: ink,
      // Never the font slug as a constant: whatever the heading is set in is
      // what the cut-out is set in, so a font change in the Squarespace editor
      // carries through here without a deploy.
      font: `${t.fontStyle} ${t.fontWeight} ${size}px ${t.fontFamily}`,
      family: t.fontFamily,
      tracking: t.letterSpacing === 'normal' ? 0 : (parseFloat(t.letterSpacing) || 0),
    };
  };

  // ---- the mask ----------------------------------------------------------

  let key = '';
  /** Rasterise the word. Returns false if the heading cannot be described by
   *  one rectangle, or if the face still is not there. */
  const paint = () => {
    const geo = measure();
    if (!geo) return false;
    const type = readType();
    if (!type.size || !type.word) return false;
    // Set before the cache gate: the ink can change without the mask changing.
    overlay.style.setProperty('--taro-reel-ink', type.colour);

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const k = [geo.line.width.toFixed(1), geo.line.height.toFixed(1),
               type.size, type.tracking, type.word, type.font, dpr].join('|');
    if (k === key) return true;

    ctx.font = type.font;
    if (hasSpacing) ctx.letterSpacing = `${type.tracking}px`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(type.word);

    // Font box for the baseline fallback, ink box for the bleed.
    const fa = num(m.fontBoundingBoxAscent, type.size * 0.8);
    const fd = num(m.fontBoundingBoxDescent, type.size * 0.22);
    const baseline = isFinite(geo.baseline)
      ? geo.baseline
      : (geo.line.height - (fa + fd)) / 2 + fa;   // half-leading, the CSS way
    const inkAsc = num(m.actualBoundingBoxAscent, fa);
    const inkDesc = Math.max(0, num(m.actualBoundingBoxDescent, 0));

    // The mask box is the line box plus enough bleed that no part of the ink
    // can fall outside it — a mask that clips its own glyphs takes the tops
    // off the letters, and at this size that is very visible.
    const side = Math.ceil(type.size * BLEED_EM) + 2;
    const bleedT = Math.max(2, Math.ceil(inkAsc - baseline) + 2);
    const bleedB = Math.max(2, Math.ceil(baseline + inkDesc - geo.line.height) + 2);
    const W = Math.ceil(geo.line.width) + side * 2;
    const H = Math.ceil(geo.line.height) + bleedT + bleedB;
    if (!(W > 0 && H > 0)) return false;

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    // Resizing a canvas resets its entire context state, the font included —
    // so everything is set again here, after the resize, not before it.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.font = type.font;
    if (hasSpacing) ctx.letterSpacing = `${type.tracking}px`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000';

    // The range rect's left edge is the pen origin of the run, so drawing
    // left-aligned at `side` puts the first glyph exactly where the real one
    // is, whatever the heading's text-align happens to be.
    const x0 = side;
    const y0 = bleedT + baseline;
    if (hasSpacing || !type.tracking) {
      ctx.fillText(type.word, x0, y0);
    } else {
      // No canvas letter-spacing: set the word a glyph at a time and add the
      // tracking by hand. Kerning pairs are lost, which on a tracked display
      // face at this size is a fraction of a pixel — and the DOM text is
      // hidden underneath at that point, so there is nothing to compare with.
      let x = x0;
      for (const ch of type.word) {
        ctx.fillText(ch, x, y0);
        x += ctx.measureText(ch).width + type.tracking;
      }
    }

    let url;
    try {
      url = canvas.toDataURL('image/png');
    } catch (e) {
      return false;   // nothing external was ever drawn into it, but never assume
    }

    key = k;
    const s = overlay.style;
    s.setProperty('--taro-reel-x', `${(geo.line.left - geo.originX - side).toFixed(2)}px`);
    s.setProperty('--taro-reel-y', `${(geo.line.top - geo.originY - bleedT).toFixed(2)}px`);
    s.setProperty('--taro-reel-w', `${W}px`);
    s.setProperty('--taro-reel-h', `${H}px`);
    s.setProperty('--taro-reel-mask', `url("${url}")`);
    return true;
  };

  // ---- state -------------------------------------------------------------

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Data Saver is treated like reduced motion. This is decoration on a page
  // that already carries seven films; nobody on a metered connection asked
  // for an eighth stream.
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  let video = null;
  let armed = false;    // overlay in the DOM and a mask painted
  let fits = false;     // the last paint succeeded
  let live = false;     // the footage has actually reached 'playing'
  let sourced = false;  // src assigned — the one download, made once
  let visible = false;
  let dead = false;
  let fontOk = false;

  /** The single place the heading's appearance is decided. */
  const render = () => {
    const on = live && fits && armed && !dead && !reduce.matches;
    overlay.classList.toggle('is-on', on);
    overlay.classList.toggle('is-live', on);
    textEl.classList.toggle('taro-reel-cut', on);
    // Written inline so it beats the theme's own heading colour without a
    // specificity war; the reduced-motion rule above is !important so it can
    // still beat this.
    textEl.style.color = on ? 'transparent' : savedInlineColour;
  };

  /** Anything unrecoverable: hand the heading back and leave no trace. */
  const giveUp = () => {
    if (dead) return;   // clearing src below fires 'error' again in some engines
    dead = true;
    live = false;
    render();
    if (video) { try { video.pause(); } catch (e) {} video.removeAttribute('src'); video.remove(); }
    overlay.remove();
  };

  const arm = () => {
    if (armed || dead) return fits;
    // Deferred to here rather than done at boot, so a visit that never
    // activates the effect — no source, no face, reduced motion — leaves the
    // heading untouched down to its computed style. Making a static element
    // relative moves nothing; if Squarespace already positioned it, its
    // position is left alone.
    if (getComputedStyle(heading).position === 'static') heading.style.position = 'relative';
    heading.appendChild(overlay);
    armed = true;
    fits = paint();
    return fits;
  };

  const makeVideo = () => {
    if (video) return video;
    video = document.createElement('video');
    // Property and attribute both: autoplay policy is decided off the
    // attribute in some engines and off the property in others, and a video
    // that is not muted at the moment play() is called is simply refused.
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
    // No crossOrigin: nothing here reads pixels out of the video, and asking
    // for CORS on a CDN that does not send the header would only break it.
    video.addEventListener('playing', () => {
      // The cut only ever happens once footage is genuinely running. A stalled
      // load, a refused autoplay, a dead URL — all of them simply leave the
      // heading as ordinary type.
      live = true;
      render();
    });
    video.addEventListener('error', giveUp);
    overlay.appendChild(video);
    return video;
  };

  /** One decision point, consulted by every trigger. */
  const sync = () => {
    if (dead) return;
    // Squarespace can mount a section background video after this file has
    // run, and currentSrc is empty until resource selection has happened, so
    // an empty source is re-asked for rather than settled at boot. A handful
    // of string tests, and only while there is still nothing to play.
    if (!src) src = findSrc();
    const wanted = visible && !document.hidden && !reduce.matches && !saveData && !!src;
    if (!wanted) {
      if (video && !video.paused) { try { video.pause(); } catch (e) {} }
      // Off screen simply pauses — the cut-out stays, so coming back finds it
      // where it was. Reduced motion is different: the word goes back to being
      // type at once.
      if (reduce.matches) { live = false; render(); }
      return;
    }
    if (!fontOk) return;          // still waiting on the face; retried below
    if (!arm()) return;           // wrapped onto two lines, or unmeasurable
    const v = makeVideo();
    if (!sourced) { sourced = true; v.src = src; v.load(); }
    const p = v.play();
    // A refused autoplay is not an error here: nothing has changed on screen
    // and nothing needs undoing.
    if (p && p.catch) p.catch(() => {});
  };

  // ---- the face ----------------------------------------------------------

  // Painting the mask in a fallback face and swapping it later would show the
  // wrong word, briefly, in the middle of the page — so nothing is painted
  // until the real face is loaded. If it never loads, the heading is simply
  // left alone: check() is the gate, not the timeout.
  const settleFont = () => {
    const probe = readType();
    try {
      // Checked against the actual word, not the API's default probe string:
      // it is those eight glyphs that have to be there.
      fontOk = !!(document.fonts && document.fonts.check(probe.font, probe.word));
    } catch (e) {
      fontOk = false;
    }
    if (fontOk) sync();
  };
  if (document.fonts && document.fonts.load) {
    const probe = readType();
    document.fonts.load(probe.font, probe.word).then(settleFont, settleFont);
    document.fonts.ready.then(settleFont, settleFont);
    setTimeout(settleFont, FONT_WAIT_MS);
  } else {
    // No Font Loading API (old Safari): assume the stylesheet's face is in by
    // the time the heading is scrolled to, and let the first paint decide.
    fontOk = true;
  }

  // ---- triggers ----------------------------------------------------------

  let relayoutTimer = 0;
  const relayout = () => {
    if (!armed || dead) return;
    const was = fits;
    fits = paint();
    render();
    // A heading that had wrapped onto two lines and now fits again is the one
    // case where a resize can start the effect rather than merely adjust it.
    if (fits && !was) sync();
  };
  const relayoutSoon = () => {
    if (measuring) return;   // our own strut, not a real layout change
    clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(relayout, 140);
  };

  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { visible = e.isIntersecting; });
      sync();
    }, { rootMargin: '200px 0px' });
    io.observe(heading);
  } else {
    // Without the observer the clip simply plays: the old always-on
    // behaviour, correct if not as frugal.
    visible = true;
  }

  // currentSrc is empty until the browser has run resource selection on the
  // hero, which can be after this file does. Retry on the hero's own events
  // rather than polling; each retry is a handful of string tests.
  if (!src) {
    const retry = () => {
      if (src || dead) return;
      src = findSrc();
      if (src) sync();
    };
    document.querySelectorAll('video').forEach((v) => {
      if (v.closest('#header') || v.closest('footer')) return;
      ['loadstart', 'loadedmetadata', 'canplay'].forEach((ev) => {
        v.addEventListener(ev, retry, { once: true });
      });
    });
    window.addEventListener('load', retry, { once: true });
  }

  document.addEventListener('visibilitychange', sync);
  // Older Safari has no listener on a MediaQueryList; there the next scroll
  // past the heading picks the change up through the observer instead, and
  // the reduced-motion rule in the CSS covers the appearance regardless.
  reduce.addEventListener?.('change', () => { relayout(); sync(); });

  window.addEventListener('resize', relayoutSoon, { passive: true });
  window.addEventListener('load', relayoutSoon);
  // The heading is sized in vw and the page above it is still settling as
  // images and players arrive, so its box can move without a resize event.
  // A ResizeObserver on the heading catches exactly that, and costs nothing
  // when nothing moves — no polling, and no measuring on scroll.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(relayoutSoon).observe(heading);
  }

  sync();
});
