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
    .taro-pt {
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'%3E%3Cfilter id='d' x='-12%' y='-12%' width='124%' height='124%' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.022 0.055' numOctaves='4' seed='7' result='c'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='c' scale='13' xChannelSelector='R' yChannelSelector='G' result='t'/%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.18 0.34' numOctaves='3' seed='3' result='f'/%3E%3CfeDisplacementMap in='t' in2='f' scale='4' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Crect x='5' y='5' width='190' height='190' fill='%23fff' filter='url(%23d)'/%3E%3C/svg%3E");
              mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'%3E%3Cfilter id='d' x='-12%' y='-12%' width='124%' height='124%' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.022 0.055' numOctaves='4' seed='7' result='c'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='c' scale='13' xChannelSelector='R' yChannelSelector='G' result='t'/%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.18 0.34' numOctaves='3' seed='3' result='f'/%3E%3CfeDisplacementMap in='t' in2='f' scale='4' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3Crect x='5' y='5' width='190' height='190' fill='%23fff' filter='url(%23d)'/%3E%3C/svg%3E");
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
      transition: opacity 700ms ease, -webkit-clip-path 1500ms cubic-bezier(0.22, 1, 0.36, 1),
                  clip-path 1500ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .taro-pt--wet.is-wet {
      opacity: 1;
      -webkit-clip-path: circle(88% at 50% 58%);
              clip-path: circle(88% at 50% 58%);
    }

    /* ---- 5. the pigment bloom on hover ------------------------------- */
    .taro-pt-host { position: relative; }
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
    /* Everything the visitor came for sits above both the tooth and the wash. */
    #page, #header, footer { position: relative; z-index: 1; }

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
    if (img.classList.contains('taro-pt')) return false;
    const r = img.getBoundingClientRect();
    return r.width > 120 && r.height > 120;
  });

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-wet');
          io.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px' })
    : null;

  const dress = () => {
    paintings().forEach((img) => {
      img.classList.add('taro-pt');
      // The host carries the bloom, so the halo sits behind the torn edge
      // rather than inside it — a glow clipped to the paper is not a bloom.
      const host = img.parentElement;
      if (host && !host.classList.contains('taro-pt-host')) {
        host.classList.add('taro-pt-host');
        host.style.setProperty('--taro-pigment', PIGMENT[assetOf(img)] || NEUTRAL);
      }
      if (io) { img.classList.add('taro-pt--wet'); io.observe(img); }
    });
  };
  dress();
  // Carousels and lazy galleries bring their images in late.
  new MutationObserver(dress).observe(document.body, { childList: true, subtree: true });
  addEventListener('load', dress, { once: true });

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
