// Film edge-print captions on the masonry gallery tiles.
//
// Hover a tile and a thin black strip slides up from its bottom edge, printed
// the way the rebate of a 35mm negative is: stock code on the left, the frame
// number counting up the roll, and the picture's alt text as the note on the
// right, all in the amber of a latent-image edge print. Each gallery is its
// own roll and starts at frame 10, the way a fresh cassette leads in — two
// galleries on one page would each number themselves rather than pretending
// to be a single strip of film.
//
// It attaches to any page holding a masonry gallery. On the live site that is
// the sub-galleries the STILLS index fans out to — /35film, /wildlife,
// /portraits and their siblings — not /stills itself, which is a page of
// image-block cards; /venues likewise indexes venue pages, and /paint is a
// gallery reel. Selecting on .gallery-masonry-item rather than on paths means
// any gallery added later is covered without touching this file.
//
// Where the strip lives is the delicate part, and it was settled against the
// live DOM rather than guessed. A tile is:
//
//   figure.gallery-masonry-item          inline position:absolute; width; translate3d(…)
//     div.gallery-masonry-item-wrapper    position:relative; inline height; overflow:hidden
//       a.gallery-masonry-lightbox-link   display:block; in the tab order
//         img[alt]                        the alt text is real prose, 60–200 chars
//
// Squarespace positions the FIGURE and rewrites its inline styles on every
// relayout, and gallery-hover.js scales the WRAPPER on hover. So the strip is
// appended to the figure, after the wrapper: the figure is already a
// positioning context (absolute — nothing to add, and nothing here may touch
// its position), and sitting outside the wrapper keeps the caption pin-sharp
// and pinned to the tile's true bottom edge while the photograph zooms behind
// it. Inside the wrapper it would zoom too, and at scale(1.045) its bottom ten
// pixels would ride off under the figure's clip. The figure's overflow:hidden
// is what hides the strip at rest; gallery-hover sets it too, but it is
// declared again here so this add-on still works if that one is ever removed.
//
// One rule reaches into gallery-filter.js's territory, on purpose. Its filtered
// layout forces every figure to position:static !important so the inline
// absolute positioning stops applying — which would also set the strips loose
// to land on the next positioned ancestor, the wrapper of the whole grid, all
// stacked on its bottom edge. So in that mode a figure carrying a strip is made
// position:relative !important instead, one class more specific, so it holds
// whichever add-on's stylesheet reaches <head> first. For a block in a column
// flow, relative-with-no-offsets lays out exactly as static does; the only
// difference is that the figure contains its strip again.
//
// The strip never intercepts anything: pointer-events:none so the click still
// reaches the lightbox link, and aria-hidden because the alt text is already
// on the image — a screen reader hearing every caption twice plus a fake film
// code would be worse off for it.
//
// No effect on touch devices. There is no hover to summon the strips, so they
// are not built at all there (the same boot check as cursor.js and
// parallax.js), and the reveal rule is additionally fenced behind (hover:hover)
// and (pointer:fine) in case a device misreports at boot. All motion is one
// CSS transition on transform, so the reduced-motion media query is the live
// check: a mid-session flip of the OS setting takes effect on the very next
// hover, with no listener to keep honest. Under reduced motion the strip does
// not travel at all — it fades in, in place.
//
// Progressive enhancement: everything here is additive. No JS, no strips; the
// stock gallery is untouched, and nothing is ever hidden waiting on us.

import { defineAddon, css } from '../lib/util.js';

const STOCK = 'TARO CROZE 400TX';  // the house name posing as a film stock
const FRAME_BASE = 10;             // first numbered frame on a fresh roll
const SLIDE_MS = 220;
const AMBER = '#f7941d';           // Kodak edge-print amber, near enough
const STRIP_PX = 26;

defineAddon('edge-print', () => {
  // Hover-driven by definition. Kept as the MediaQueryList rather than read
  // once into a boolean: a tablet that gains a trackpad mid-session builds
  // its strips at that moment instead of never.
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  const build = () => {
    if (!fine.matches) return;

    const items = [...document.querySelectorAll('.gallery-masonry-item')];
    if (!items.length) return;

    css('edge-print', `
      /* Also set by gallery-hover; restated so the resting strip stays
         clipped inside the tile even without it. */
      .gallery-masonry-item { overflow: hidden; }

      .taro-edge-print {
        position: absolute;
        left: 0; right: 0; bottom: 0;
        height: ${STRIP_PX}px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 0 10px;
        overflow: hidden;
        background: #111;
        color: ${AMBER};
        /* A condensed grotesque is the voice of an edge print. Arial Narrow
           ships with macOS and with Office on Windows; the rest of the stack
           is the nearest thing each remaining desktop has, and font-stretch
           lets Helvetica Neue pick its own condensed face where it has one.
           Anything that falls through to plain Arial is still legible, just
           less narrow. */
        font-family: 'Arial Narrow', 'Roboto Condensed', 'Liberation Sans Narrow',
                     'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-stretch: condensed;
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        letter-spacing: 0.11em;
        text-transform: uppercase;
        white-space: nowrap;
        /* The slight bleed of ink exposed through the rebate. Static, so it
           costs nothing during the slide. */
        text-shadow: 0 0 2px rgba(247, 148, 29, 0.45);
        pointer-events: none;
        transform: translateY(100%);
        transition: transform ${SLIDE_MS}ms cubic-bezier(0.2, 0.7, 0.2, 1);
      }
      .taro-edge-print-code { flex: 0 0 auto; }
/* Fenced on capability as well as the boot check above — a device
         that loses its pointer stops answering phantom hovers. */
      @media (hover: hover) and (pointer: fine) {
        .gallery-masonry-item:hover > .taro-edge-print { transform: translateY(0); }
      }
      /* Keyboard focus on the lightbox link summons it on any device the
         strips were built for. */
      .gallery-masonry-item:focus-within > .taro-edge-print { transform: translateY(0); }

      /* gallery-filter's filtered layout — see the header. */
      .gallery-masonry.taro-collapsed .gallery-masonry-item.taro-edge-print-host {
        position: relative !important;
      }

      /* No travel: the strip sits in place and fades. */
      @media (prefers-reduced-motion: reduce) {
        .taro-edge-print {
          transform: none;
          opacity: 0;
          transition: opacity 180ms ease;
        }
        .gallery-masonry-item:focus-within > .taro-edge-print { opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) and (hover: hover) and (pointer: fine) {
        .gallery-masonry-item:hover > .taro-edge-print { opacity: 1; }
      }
    `);

    // Frames are numbered per roll (per gallery), not per page. The counter
    // advances on every tile, striped already or not, so the number is a pure
    // function of the tile's position in its roll — a re-run (see the load
    // listener below) numbers a late-arriving tile correctly instead of
    // restarting its roll at 10.
    const rolls = new Map();

    items.forEach((item) => {
      const roll = item.closest('.gallery-masonry') || document.body;
      const shot = rolls.get(roll) || 0;
      rolls.set(roll, shot + 1);

      if (item.querySelector('.taro-edge-print')) return;   // idempotent

      const strip = document.createElement('div');
      strip.className = 'taro-edge-print';
      strip.setAttribute('aria-hidden', 'true');

      const code = document.createElement('span');
      code.className = 'taro-edge-print-code';
      code.textContent = `${STOCK} — FRAME ${FRAME_BASE + shot}A`;
      strip.appendChild(code);

      // NO CAPTION. The alt text on these galleries is auto-generated — a
      // machine's guess at the photograph, and the owner's verdict on it was
      // that it is inaccurate. Printing a wrong description in the rebate of a
      // photographer's own contact sheet is worse than printing nothing: the
      // rebate is where a photographer writes what a frame IS. The stock name
      // and the frame number are true of every frame on the roll, so they
      // stay; anything claiming to describe the picture does not.
      //
      // If real captions are ever written by hand, this is where they go —
      // read them from a data attribute set in the editor, never from alt.

      item.classList.add('taro-edge-print-host');
      item.appendChild(strip);
    });
  };

  if (fine.matches) build();
  // Older Safari lacks addEventListener on MediaQueryList; there the boot
  // check is simply final, which is the old behaviour.
  else fine.addEventListener?.('change', build);

  // Squarespace's own gallery boot runs between DOMContentLoaded and load.
  // Today it keeps the server-rendered figures and only rewrites their inline
  // styles — the strips ride along — but that is its implementation, not its
  // contract. One idempotent re-run after load rebuilds anything it may have
  // replaced, and costs one querySelectorAll on a page that is done loading.
  window.addEventListener('load', build, { once: true });
});
