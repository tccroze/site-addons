// Give the sub-galleries a beginning and an end.
//
// Measured on the live site, and the numbers are the whole argument:
//
//     /35film      32 frames    9,904px    no heading, no text, no CTA
//     /wildlife    29 frames    9,094px    no heading, no text, no CTA
//     /portraits   19 frames    9,617px    no heading, no text, no CTA
//     /vroom       26 frames    9,386px    no heading, no text, no CTA
//     /panoramas    —           4,127px    no heading, no text, no CTA
//
// Ten screens of the owner's best work, and at the bottom of it the visitor is
// asked for nothing at all — the only way onward is the nav. /venues, by
// contrast, closes with testimonials and "WANT THIS FOR YOUR VENUE?" and four
// links to /letstalk, and is the page the owner says gets him work. That
// difference is the point of this file.
//
// It also gives each gallery a name. Those pages carry no heading of any kind,
// so nothing on them says what the work is — not to a visitor arriving from a
// search result, and not to the search engine that put them there.
//
// WHAT THIS DELIBERATELY DOES NOT DO: chunk the wall into "rolls" with dividers
// between them. That was the plan until the live pages showed these galleries
// already carry category filters (All 32 / Landscape 10 / Camping 4 / …) from
// gallery-filter.js, which re-lays the grid out on every filter change. Fixed
// dividers would be stranded the moment anyone filtered. The filter is the
// structure; this file makes it stick to the top of the window instead, so it
// stays reachable through ten thousand pixels of scroll.

import { defineAddon, css } from '../lib/util.js';

// OWNER COPY. Everything a visitor reads on these pages is in this one block,
// so it can be changed without going near the logic. These are drafts: they are
// deliberately free of claims about where or how a picture was made, because
// the alt text on these galleries is machine-written and inaccurate, and it is
// the only other description the pages have.
const GALLERIES = {
  '/35film': {
    eyebrow: 'Stills',
    title: 'Film',
    intro: 'Shot on 35mm and scanned frame by frame.',
  },
  '/wildlife': {
    eyebrow: 'Stills',
    title: 'Wildlife',
    intro: 'Animals photographed in the wild, on their own terms.',
  },
  '/portraits': {
    eyebrow: 'Stills',
    title: 'People',
    intro: 'Portraits made slowly, and with permission.',
  },
  '/vroom': {
    eyebrow: 'Stills',
    title: 'Automotive',
    intro: 'Cars standing still, and cars at speed.',
  },
  '/panoramas': {
    eyebrow: 'Stills',
    title: 'Panoramas',
    intro: 'Frames built wide, made to be printed long.',
  },
  // Both of these were missed on the first pass. They are in the filter's
  // taxonomy in gallery-filter.js, which is where their existence is recorded —
  // I built this list from the links on /stills and neither is on it.
  '/spaces': {
    eyebrow: 'Stills',
    title: 'Spaces',
    intro: 'Interiors, photographed in the light they already have.',
  },
  '/astro': {
    eyebrow: 'Stills',
    title: 'Astro',
    intro: 'Long exposures, made after dark.',
  },
};

// The closing panel, identical everywhere: the same question, asked once, at
// the point where someone has just looked at everything.
const CLOSE_LINE = 'Seen something here that fits what you are planning?';
const CLOSE_NOTE = 'Tell me what you have in mind and I will come back to you within 48 hours.';
const CLOSE_CTA = 'Let’s talk';

const CREAM = '#f6eed5';
const INK = '#243230';
const RED = '#e23318';

defineAddon('gallery-frame', () => {
  const path = location.pathname.replace(/\/$/, '');
  const copy = GALLERIES[path];
  if (!copy) return;

  const gallery = document.querySelector('.gallery-masonry');
  const frames = gallery ? gallery.querySelectorAll('.gallery-masonry-item').length : 0;

  css('gallery-frame', `
    /* Across the page, not down it. As a single 46rem column this stacked
       eyebrow, title, rule, line and count into 349px of vertical space before
       a visitor saw one photograph. The gallery itself is full-bleed — tiles
       start 7px from the edge — so the heading spans the same width and reads
       as its masthead rather than as a paragraph sitting on top of it. */
    .taro-gf {
      max-width: none;
      margin: 0;
      padding: clamp(1.75rem, 5vw, 3rem) clamp(1rem, 4vw, 3rem) clamp(1.25rem, 3.5vw, 2rem);
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: end;
      gap: 1rem clamp(2rem, 6vw, 5rem);
      text-align: left;
    }
    .taro-gf__aside { padding-bottom: 0.35rem; }
    @media (max-width: 799px) {
      .taro-gf { grid-template-columns: 1fr; gap: 0.75rem; }
      .taro-gf__aside { padding-bottom: 0; }
    }
    .taro-gf__eyebrow {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(36, 50, 48, 0.6);
      margin: 0 0 0.75rem;
    }
    .taro-gf__title {
      font-size: clamp(2.1rem, 6vw, 3.4rem);
      line-height: 1.02;
      margin: 0 0 0.75rem;
      color: ${INK};
    }
    .taro-gf__rule {
      width: 4.5rem; height: 3px;
      background: ${RED};
      margin: 0;
    }
    .taro-gf__intro {
      font-size: clamp(1rem, 1.6vw, 1.15rem);
      line-height: 1.6;
      margin: 0 0 0.5rem;
      color: ${INK};
      max-width: 34rem;
    }
    .taro-gf__count {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(36, 50, 48, 0.55);
      margin: 0;
    }

    /* ---- the closing panel ---------------------------------------------- */
    /* The space above this is PADDING, not margin. Measured on the live page:
       margin-top computed to 0px and the rule sat flat against the bottom edge
       of the last photograph. This panel is a <section>, and section margins
       are reset out from under it — so the room it needs is taken inside its
       own box, where nothing can collapse or override it. The border is drawn
       by a child rather than by border-top for the same reason: it has to sit
       BELOW that space, not above it. */
    /* Doubled class, and for a specific reason. The site's Custom CSS carries
           section:first-of-type { padding-top: 0 !important; }
       — the same rule that put the About heading under the nav — and this panel
       is the only <section> inside its parent, so :first-of-type matches it.
       Two !important declarations then go to specificity, and (0,1,1) for
       section:first-of-type beats (0,1,0) for a single class. Measured: padding
       computed to 0px and the rule stayed flat against the last photograph.
       (0,2,0) wins it back. */
    .taro-gf-end.taro-gf-end {
      margin: 0 auto !important;
      max-width: 46rem;
      padding: clamp(3.5rem, 9vw, 6rem) clamp(1.25rem, 5vw, 2rem) clamp(3rem, 8vw, 4.5rem) !important;
      text-align: center;
    }
    .taro-gf-end__rule {
      height: 1px;
      background: rgba(36, 50, 48, 0.18);
      margin: 0 auto clamp(2rem, 5vw, 3rem);
    }
    .taro-gf-end__line {
      font-size: clamp(1.35rem, 3.4vw, 2rem);
      line-height: 1.2;
      margin: 0 0 0.85rem;
      color: ${INK};
    }
    .taro-gf-end__note {
      font-size: clamp(0.95rem, 1.5vw, 1.05rem);
      line-height: 1.6;
      margin: 0 auto 1.8rem;
      max-width: 30rem;
      color: rgba(36, 50, 48, 0.78);
    }
    .taro-gf-end__cta {
      display: inline-block;
      padding: 1.05rem 2.75rem;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      text-decoration: none;
      color: ${CREAM};
      background: ${RED};
      border: 2px solid ${RED};
      border-radius: 300px;
      transition: background 200ms ease, border-color 200ms ease,
                  transform 220ms cubic-bezier(0.33, 1, 0.68, 1);
    }
    @media (hover: hover) {
      .taro-gf-end__cta:hover {
        background: ${INK}; border-color: ${INK}; transform: translateY(-2px);
      }
    }
    .taro-gf-end__cta:focus-visible { outline: 2px solid ${INK}; outline-offset: 3px; }
    @media (prefers-reduced-motion: reduce) {
      .taro-gf-end__cta { transition: none; }
      .taro-gf-end__cta:hover { transform: none; }
    }
  `);

  /** Where a sibling can be inserted without landing inside a CSS grid. */
  const anchorFor = (el) => {
    let host = el.closest('.sqs-block') || el;
    // A Fluid Engine cell is positioned by grid-area; a sibling dropped beside
    // it would be placed by auto-flow and land somewhere unrelated. Climb out.
    while (host.parentElement && /grid|flex/.test(getComputedStyle(host.parentElement).display)) {
      host = host.parentElement;
    }
    return host;
  };

  const head = document.createElement('header');
  head.className = 'taro-gf';
  head.innerHTML =
    `<div class="taro-gf__lead">` +
      `<p class="taro-gf__eyebrow"></p>` +
      `<h1 class="taro-gf__title"></h1>` +
      `<div class="taro-gf__rule"></div>` +
    `</div>` +
    `<div class="taro-gf__aside">` +
      `<p class="taro-gf__intro"></p>` +
      `<p class="taro-gf__count"></p>` +
    `</div>`;
  head.querySelector('.taro-gf__eyebrow').textContent = copy.eyebrow;
  head.querySelector('.taro-gf__title').textContent = copy.title;
  head.querySelector('.taro-gf__intro').textContent = copy.intro;
  // Counted from the page rather than written down, so it cannot go stale when
  // a frame is added in the editor. Silent when there is nothing to count.
  head.querySelector('.taro-gf__count').textContent = frames ? `${frames} frames` : '';

  const end = document.createElement('section');
  end.className = 'taro-gf-end';
  end.innerHTML =
    `<div class="taro-gf-end__rule"></div>` +
    `<p class="taro-gf-end__line"></p>` +
    `<p class="taro-gf-end__note"></p>` +
    `<a class="taro-gf-end__cta" href="/letstalk"></a>`;
  end.querySelector('.taro-gf-end__line').textContent = CLOSE_LINE;
  end.querySelector('.taro-gf-end__note').textContent = CLOSE_NOTE;
  end.querySelector('.taro-gf-end__cta').textContent = CLOSE_CTA;

  if (gallery) {
    const anchor = anchorFor(gallery);
    // Above the filter, not merely above the grid. gallery-filter.js is
    // imported earlier and has already put its bar in, so inserting against the
    // gallery alone produced filter-then-title — the page naming itself after
    // it had already offered to sort itself.
    const first = document.querySelector('.taro-filter') || anchor;
    first.parentElement.insertBefore(head, first);
    anchor.parentElement.insertBefore(end, anchor.nextSibling);
  } else {
    // /panoramas is not a masonry gallery — it is a stack of sections. The
    // heading goes above the first one and the invitation below the last.
    const secs = [...document.querySelectorAll('section[data-section-id]')]
      .filter((s) => !s.closest('footer'));
    if (!secs.length) return;
    secs[0].parentElement.insertBefore(head, secs[0]);
    secs[secs.length - 1].after(end);
  }
});
