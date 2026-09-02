// The paint page, made of paper.
//
// The work is watercolour on cold-press paper and the page was showing it as
// photographs: every painting a hard rectangle with the photo's own boundary
// and the paper's shadow visible around it. The paintings read as screenshots
// of paintings.
//
// Five things, in the order they matter:
//
//   1. THE EDGE. Each painting is torn out along a wet deckle, so its boundary
//      stops being the photographer's crop and becomes the edge of a sheet.
//      Same filter as the homepage's torn print — a coarse turbulence to do the
//      tearing and a fine one to rough the fibres.
//
//   2. THE GROUND. A cold-press tooth on the page, warm and faint, so the
//      photographed paper and the page's paper stop being two surfaces.
//
//   3. THE ARRIVAL. Paintings bloom in rather than fading — a wash spreading
//      into damp paper, growing from where the pigment was dropped.
//
//   4. THE WASH. One large, slow, translucent wash drifting behind the page as
//      you scroll. One, not a pattern.
//
//   5. THE BLOOM. Hovering a painting spreads a halo of THAT painting's own
//      pigment beneath it. The colours are not guesses: every image was
//      sampled, paper and ink discarded, and the most saturated significant
//      mass taken — which is why Narla blooms the blue of her wash and Banjo
//      the ochre of his coat. Where too few pigment pixels existed to trust
//      (the car photographs, mostly), a warm neutral is used instead.
//
// NOT tried here, and worth recording: mix-blend-mode multiply, to drop the
// paper out and set the paintings straight onto the site's own. It fails on
// this page — the work is photographed under ambient light, so its paper is
// not white but rgb(208,197,176), and one sheet is distinctly warm at
// rgb(208,178,148). Multiplied onto the cream it leaves a grey-brown block
// 111-208 units off the page colour, and the white balance varies too much
// between shots for one correction to serve them all.

import { defineAddon, css } from '../lib/util.js';

// Sampled from the paintings themselves; see the note above.
const PIGMENT = {
  'IMG_0866.jpg': '#78acbd',
  'IMG_3267.jpg': '#c3a383',
  'IMG_1503.jpg': '#dbcbbc',
  'IMG_5733.jpg': '#decfb4',
  'IMG_7506.jpg': '#c5a583',
  'IMG_1359+(1).jpg': '#ccbaa5',
  'IMG_6926.jpg': '#a63d65',
  'FE8E350C-7674-496C-8E64-3B0F0BFFF60A.jpg': '#bb536e',
  'IMG_6922+2.jpg': '#193281',
};
const NEUTRAL = '#b9a88f';

const assetOf = (img) => {
  const u = img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || '';
  try { return decodeURIComponent(u.split('?')[0].split('/').pop() || ''); }
  catch (e) { return u.split('?')[0].split('/').pop() || ''; }
};

defineAddon('paint', () => {
  if (!/^\/paint\/?$/i.test(location.pathname)) return;

  /* ---- 1. the deckle ---------------------------------------------------
   * Two passes, as on the homepage: a coarse turbulence tears the outline and
   * a fine one roughs the fibres. Rendered once into a mask the images share,
   * rather than a filter on each painting — a filter would resample the
   * photograph itself and soften the brushwork, which is the one thing on this
   * page that must stay sharp.
   */
  /* The deckle now lives in a data-URI mask in the stylesheet below — see the
   * note there for why the in-document <mask> approach was abandoned.
   */
  css('paint', `
    /* ---- 2. the ground: cold-press tooth ----------------------------- */
    /* Two turbulences at different frequencies: the coarse one is the grain of
       the press, the fine one the fibre. Faint enough to be felt rather than
       seen — on a page of paintings the texture must never compete. */
    .taro-paint-paper::before {
      content: '';
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      opacity: 0.055;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5 0.62' numOctaves='4' seed='5'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23p)'/%3E%3C/svg%3E");
      background-size: 300px 300px;
      mix-blend-mode: multiply;
    }

    /* ---- 1 + 3. torn edge, and the bloom it arrives with -------------- */
    /* A DATA-URI MASK, not a reference to an SVG <mask> in the document.
       The first version used <mask maskContentUnits="objectBoundingBox"> with a
       filtered rect inside it, and the filter rendered nothing in that
       coordinate system — so every painting on the page was masked out
       completely and the galleries came up empty. A self-contained SVG scaled
       to the element cannot fail that way, and it is what the homepage's torn
       print already uses. */
    /* The tear eats into the frame, so the picture is pushed out very slightly
       to meet it: without this the deckle bit into the painting itself and took
       a visible slice off portraits that run close to their edges. */
    .taro-pt img { transform: scale(1.045); transform-origin: center; }
    .taro-pt {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'%3E%3Cfilter id='d' x='-12%' y='-12%' width='124%' height='124%' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.022 0.055' numOctaves='4' seed='7' result='c'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='c' scale='9' xChannelSelector='R' yChannelSelector='G' result='t'/%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.18 0.34' numOctaves='3' seed='3' result='f'/%3E%3CfeDisplacementMap in='t' in2='f' scale='4' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Crect x='3' y='3' width='194' height='194' fill='%23fff' filter='url(%23d)'/%3E%3C/svg%3E");
              mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'%3E%3Cfilter id='d' x='-12%' y='-12%' width='124%' height='124%' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.022 0.055' numOctaves='4' seed='7' result='c'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='c' scale='9' xChannelSelector='R' yChannelSelector='G' result='t'/%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.18 0.34' numOctaves='3' seed='3' result='f'/%3E%3CfeDisplacementMap in='t' in2='f' scale='4' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Crect x='3' y='3' width='194' height='194' fill='%23fff' filter='url(%23d)'/%3E%3C/svg%3E");
      -webkit-mask-size: 100% 100%;  mask-size: 100% 100%;
      -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
      -webkit-mask-position: center;  mask-position: center;
      transition: opacity 900ms ease;
    }
    /* The wash spreading into damp paper. The image is revealed by a radial
       wipe with a long, soft tail — a hard edge would read as a wipe, and a
       wash has no hard edge. */
    .taro-pt--wet {
      opacity: 0;
      -webkit-clip-path: circle(6% at 50% 58%);
              clip-path: circle(6% at 50% 58%);
      transition: opacity 1100ms ease, -webkit-clip-path 2100ms cubic-bezier(0.16, 0.9, 0.24, 1),
                  clip-path 2100ms cubic-bezier(0.16, 0.9, 0.24, 1);
    }
    .taro-pt--wet.is-wet {
      opacity: 1;
      -webkit-clip-path: circle(88% at 50% 58%);
              clip-path: circle(88% at 50% 58%);
    }

    /* ---- 5. the pigment bloom on hover ------------------------------- */
    .taro-pt-host {
      position: relative;
      /* THE HALO WAS RENDERING AND INVISIBLE. At z-index -1 with no stacking
       * context of its own, it painted behind the nearest ancestor that had
       * one — which is Squarespace's .section-border, an opaque cream fill
       * across the whole section. Isolating the host keeps the bloom inside
       * it: above the host's own ground, still beneath the painting. */
      isolation: isolate;
    }
    .taro-pt-host::after {
      content: '';
      position: absolute; inset: -14%;
      z-index: -1; pointer-events: none;
      border-radius: 50%;
      background: radial-gradient(ellipse at 50% 55%,
        var(--taro-pigment, ${NEUTRAL}) 0%,
        color-mix(in srgb, var(--taro-pigment, ${NEUTRAL}) 45%, transparent) 45%,
        transparent 72%);
      opacity: 0;
      filter: blur(26px);
      transform: scale(0.86);
      transition: opacity 620ms ease, transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    @media (hover: hover) {
      .taro-pt-host:hover::after { opacity: 0.55; transform: scale(1); }
    }

    /* ---- 4. the drifting wash ---------------------------------------- */
    .taro-paint-wash {
      position: fixed; left: 50%; top: 0;
      width: 150vmax; height: 150vmax;
      margin-left: -75vmax;
      z-index: 0; pointer-events: none;
      opacity: 0.16;
      background: radial-gradient(closest-side at 38% 42%,
                    #78acbd 0%, rgba(120,172,189,0.42) 42%, transparent 72%),
                  radial-gradient(closest-side at 66% 58%,
                    #c3a383 0%, rgba(195,163,131,0.36) 46%, transparent 74%);
      filter: blur(42px);
      transform: translate3d(0, var(--taro-wash, 0px), 0) rotate(var(--taro-wash-r, 0deg));
      will-change: transform;
    }
    /* Everything the visitor came for sits above both the tooth and the wash.
       NOT the header. Naming #header here set position:relative on an element
       Squarespace fixes to the top, which dropped it back into the flow and
       pushed the whole page down by its own height — 164px of empty paper
       between the nav and the title. It is already above these layers at
       z-index 10 and needs nothing from this rule. */
    #page, footer { position: relative; z-index: 1; }

    /* THE WASH WAS BEHIND AN OPAQUE WALL. Squarespace paints each section's
     * ground on .section-border, not on the section, so the wash at z-index 0
     * was drifting behind a solid rgb(246,238,213) and could never be seen.
     * The fill is the same cream as <body>, so dropping it changes nothing
     * except that the water below now shows through. */
    /* Which grounds give way is decided in script, not here: it depends on
     * comparing each section's fill to the page's own, and CSS cannot ask
     * that question. See openGround(). */

    /* ---- the testimonials -------------------------------------------- */
    /* The pictures beside the quotes run from 1px to 772px tall, and a carousel
       sizes every slide to its tallest — so three oversized thumbnails were
       setting the height of all ten. Capped to a consistent band, and contained
       rather than cropped, because these are paintings and a painting with its
       edges cut off is not a thumbnail of that painting. */
    .taro-quotes-sec .user-items-list-carousel__media-container {
      max-height: 150px !important;
    }
    .taro-quotes-sec .user-items-list-carousel__media-inner,
    .taro-quotes-sec .user-items-list-carousel__media {
      max-height: 150px !important;
    }
    .taro-quotes-sec .user-items-list-carousel__media {
      object-fit: contain !important;
    }

    .taro-quote {
      display: -webkit-box;
      -webkit-line-clamp: 8;
      -webkit-box-orient: vertical;
      overflow: hidden;
      /* The last line fades rather than stopping dead, so it reads as more
         text continuing rather than as a sentence that was cut. */
      -webkit-mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
              mask-image: linear-gradient(to bottom, #000 72%, transparent 100%);
    }
    .taro-quote.is-open {
      -webkit-line-clamp: unset; display: block; overflow: visible;
      -webkit-mask-image: none; mask-image: none;
    }
    .taro-quote__more {
      -webkit-appearance: none; appearance: none;
      background: none; border: 0; padding: 0.4rem 0; margin-top: 0.5rem;
      font: inherit; font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.16em; text-transform: uppercase;
      color: #e23318; cursor: pointer;
      border-bottom: 1px solid rgba(226, 51, 24, 0.4);
    }
    @media (hover: hover) { .taro-quote__more:hover { color: #243230; border-bottom-color: #243230; } }
    .taro-quote__more:focus-visible { outline: 2px solid #243230; outline-offset: 3px; }
    @media (max-width: 799px) { .taro-quote__more { font-size: 12.5px; } }

    @media (prefers-reduced-motion: reduce) {
      .taro-pt--wet, .taro-pt-host::after { transition: none; }
      .taro-pt--wet { opacity: 1; -webkit-clip-path: none; clip-path: none; }
      .taro-paint-wash { transform: none; }
    }
  `);

  document.documentElement.classList.add('taro-paint-paper');

  const wash = document.createElement('div');
  wash.className = 'taro-paint-wash';
  wash.setAttribute('aria-hidden', 'true');
  document.body.appendChild(wash);

  /* ---- apply to the paintings ----------------------------------------- */
  const paintings = () => [...document.querySelectorAll('img')].filter((img) => {
    if (img.closest('#header') || img.closest('footer')) return false;
    if (/logo/i.test(img.currentSrc || img.src || '')) return false;
    if (img.dataset.taroPainted) return false;
    const r = img.getBoundingClientRect();
    return r.width > 120 && r.height > 120;
  });

  /* THE BLOOM NEEDS A FRAME TO START FROM.
   *
   * Adding the starting state and the finishing state in the same frame gives
   * the browser nothing to interpolate between, so the painting simply appeared
   * — "it just flashes and shows". Two animation frames are allowed to pass
   * between the two, which is the difference between a transition and a swap.
   */
  const bloom = (el) => {
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-wet')));
  };
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          bloom(e.target);
          io.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px' })
    : null;

  /** The element whose box is the painting you can actually see.
   *
   *  Squarespace's carousel crops with object-fit: cover inside a container
   *  that hides its overflow, so the <img> box is larger than the frame on
   *  screen — and a torn edge drawn on the image falls outside the frame and
   *  gets sliced flat by the container. On a phone, where the crop is
   *  tightest, that showed as torn sides and cut top and bottom. The mask goes
   *  on the cropping box instead, where the edge it draws is the edge you see.
   */
  const maskTarget = (img) => {
    const cs = getComputedStyle(img);
    if (cs.objectFit !== 'cover' && cs.position !== 'absolute') return img;
    let el = img.parentElement;
    for (let i = 0; i < 3 && el; i += 1) {
      if (getComputedStyle(el).overflow !== 'visible') return el;
      el = el.parentElement;
    }
    return img;
  };

  const dress = () => {
    paintings().forEach((img) => {
      const target = maskTarget(img);
      target.classList.add('taro-pt');
      img.dataset.taroPainted = '1';
      // The host carries the bloom, so the halo sits behind the torn edge
      // rather than inside it — a glow clipped to the paper is not a bloom.
      const host = target.parentElement || img.parentElement;
      if (host && !host.classList.contains('taro-pt-host')) {
        host.classList.add('taro-pt-host');
        host.style.setProperty('--taro-pigment', PIGMENT[assetOf(img)] || NEUTRAL);
      }
      if (io && !target.classList.contains('taro-pt--wet')) {
        /* A REVEAL MUST FAIL VISIBLE.
         *
         * The reveal starts a painting at opacity 0 and waits for it to enter
         * the viewport. Squarespace's gallery reel parks every inactive slide
         * at x: -9999px, so those paintings could never intersect anything —
         * 19 of 22 on a phone sat at opacity 0 permanently. Not a reveal that
         * failed to animate: paintings that were never shown at all.
         *
         * Anything the observer cannot reach is shown at once. A painting
         * arriving without ceremony is a small loss; a blank slide is not.
         */
        const parked = target.closest('.gallery-reel, .gallery-strips, .gallery-slideshow')
          || target.getBoundingClientRect().left < -1000;
        if (parked) { target.classList.add('taro-pt--wet', 'is-wet'); return; }
        target.classList.add('taro-pt--wet');
        io.observe(target);
      }
    });
  };
  /* ONLY THE GROUNDS THAT REPEAT THE PAGE'S OWN CREAM GIVE WAY.
   *
   * The wash needs the opaque fill above it gone, but a blanket rule is wrong:
   * eight of the nine sections here repaint the same rgb(246,238,213) as
   * <body> and are safe to open, while the ninth is a deliberate dark green
   * band. Blanking that one turned a designed section into background — so
   * each fill is compared to the body's before it is cleared.
   */
  const openGround = () => {
    const ground = getComputedStyle(document.body).backgroundColor;
    document.querySelectorAll('.section-border').forEach((el) => {
      if (el.dataset.taroGround) return;
      if (getComputedStyle(el).backgroundColor !== ground) return;
      el.dataset.taroGround = '1';
      el.style.setProperty('background-color', 'transparent', 'important');
    });
  };
  openGround();

  dress();
  // Carousels and lazy galleries bring their images in late.
  new MutationObserver(() => { dress(); openGround(); })
    .observe(document.body, { childList: true, subtree: true });
  addEventListener('load', dress, { once: true });

  /* ---- the testimonials ------------------------------------------------
   * A carousel sizes every slide to its tallest, so one long testimonial sets
   * the height of all thirteen. Measured: the longest runs 687 characters and
   * forced every slide to 1,366px, leaving something like a thousand pixels of
   * empty paper under the 154-character ones — and a section 1,510px tall to
   * scroll past.
   *
   * Nothing is cut: each is clamped to eight lines with the last one fading
   * out, and opens in place. Someone skimming sees a tidy row; someone
   * interested in what a customer said still gets every word.
   */
  const CLAMP_LINES = 8;
  const clampQuotes = () => {
    const quotes = [...document.querySelectorAll('.list-item-content__description')]
      .filter((q) => !q.dataset.taroClamped);
    quotes.forEach((q) => {
      // Short ones are left alone; a "read more" on four lines is noise.
      if (q.textContent.trim().length < 300) { q.dataset.taroClamped = 'skip'; return; }
      q.dataset.taroClamped = '1';
      const body = document.createElement('div');
      body.className = 'taro-quote';
      while (q.firstChild) body.appendChild(q.firstChild);
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'taro-quote__more';
      more.textContent = 'Read more';
      more.setAttribute('aria-expanded', 'false');
      more.addEventListener('click', () => {
        const open = body.classList.toggle('is-open');
        more.textContent = open ? 'Read less' : 'Read more';
        more.setAttribute('aria-expanded', String(open));
        window.dispatchEvent(new Event('resize'));   // the slide has changed height
      });
      q.append(body, more);
    });
  };
  /* The carousel measures its slides once and holds that height, so a clamp
   * applied afterwards shortens the text and leaves the empty space behind.
   * A resize is the event it already listens to for exactly this. */
  const remeasure = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    }));
  };
  /* Mark the section the quotes live in, so the picture cap above reaches the
   * testimonials and leaves the portfolio carousels alone — they share every
   * class name. */
  const markSection = () => {
    const q = document.querySelector('.taro-quote');
    const sec = q && q.closest('section[data-section-id]');
    if (sec && !sec.classList.contains('taro-quotes-sec')) {
      sec.classList.add('taro-quotes-sec');
      return true;
    }
    return false;
  };

  const clampAndSettle = () => {
    const before = document.querySelectorAll('.taro-quote').length;
    clampQuotes();
    const grew = document.querySelectorAll('.taro-quote').length !== before;
    if (markSection() || grew) remeasure();
  };
  clampAndSettle();
  new MutationObserver(clampAndSettle).observe(document.body, { childList: true, subtree: true });
  addEventListener('load', clampAndSettle, { once: true });

  /* ---- the wash drifts ------------------------------------------------ */
  let queued = false;
  const drift = () => {
    queued = false;
    const y = window.scrollY;
    wash.style.setProperty('--taro-wash', `${(-y * 0.06).toFixed(1)}px`);
    wash.style.setProperty('--taro-wash-r', `${(y * 0.006).toFixed(2)}deg`);
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(drift); } };
  addEventListener('scroll', ask, { passive: true });
  drift();
});
