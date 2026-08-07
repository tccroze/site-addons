// Hover treatment for gallery thumbnails and shop product cards.
//
// Critical constraint: .gallery-masonry-item carries an inline
// `transform: translate3d(...)` that Squarespace computes to position the grid.
// Touching transform on that element moves the tile out of place, so the scale
// is applied to the inner wrapper — which Squarespace does not position — and
// the outer item only gets overflow clipping.
//
// Pure CSS, no JS behaviour. Kept as an add-on rather than dropped in
// styles.css so it can be removed in one line if the look isn't wanted.

import { defineAddon, css } from '../lib/util.js';

defineAddon('gallery-hover', () => {
  css('gallery-hover', `
    /* ---- masonry gallery thumbnails ---- */
    .gallery-masonry-item {
      overflow: hidden;
    }
    .gallery-masonry-item-wrapper {
      transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1),
                  filter 0.4s ease;
      will-change: transform;
    }
    .gallery-masonry-item:hover .gallery-masonry-item-wrapper {
      transform: scale(1.045);
      filter: saturate(1.08) contrast(1.03);
    }

    /* Dimmed-out tiles from the subject filter must not react to hover. */
    .gallery-masonry-item[data-taro-dim="1"]:hover .gallery-masonry-item-wrapper {
      transform: none;
      filter: none;
    }

    /* ---- shop product cards ---- */
    .grid-item .grid-image,
    .grid-item .grid-image-wrapper {
      overflow: hidden;
    }
    .grid-item img {
      transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .grid-item:hover img {
      transform: scale(1.04);
    }

    /* Keyboard users get the same affordance as mouse users. */
    .gallery-masonry-item:focus-within .gallery-masonry-item-wrapper {
      transform: scale(1.045);
    }

    @media (prefers-reduced-motion: reduce) {
      .gallery-masonry-item-wrapper,
      .grid-item img {
        transition: none;
      }
      .gallery-masonry-item:hover .gallery-masonry-item-wrapper,
      .gallery-masonry-item:focus-within .gallery-masonry-item-wrapper,
      .grid-item:hover img {
        transform: none;
      }
    }

    /* Touch devices have no hover; the scale would stick after a tap. */
    @media (hover: none) {
      .gallery-masonry-item:hover .gallery-masonry-item-wrapper,
      .grid-item:hover img {
        transform: none;
        filter: none;
      }
    }
  `);
});
