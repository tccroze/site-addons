// Subject filters for the masonry gallery pages.
//
// Tags come from each image's alt text, which on this site is genuinely
// descriptive. Raw word frequency is not usable — the alt text describes whole
// scenes, so the commonest words are "grassy", "cloudy", "trees". Hence the
// curated keyword lists below.
//
// Layout: Squarespace positions masonry items with inline
// `position:absolute; width:…; transform:translate3d(…)` inside a wrapper with
// an inline pixel height, and recomputes all of it on resize. Rather than
// rewriting those inline styles (which Squarespace would overwrite), the
// collapsed state is a stylesheet whose rules carry !important — that beats a
// plain inline style, so it holds no matter how often Squarespace relayouts.
// Filtering is then just a class toggle, with nothing to save or restore.

import { defineAddon, css } from '../lib/util.js';

// path -> [label, [keywords matched against lowercased alt text]]
const TAXONOMIES = {
  '/wildlife': [
    ['Big cats',   ['lion', 'lioness', 'leopard', 'cheetah', 'jaguar']],
    ['Elephants',  ['elephant']],
    ['Zebras',     ['zebra']],
    ['Giraffes',   ['giraffe']],
    ['Antelope',   ['antelope', 'impala']],
    ['Birds',      ['bird', 'kingfisher']],
  ],
  '/vroom': [
    ['Vintage',    ['vintage']],
    ['Racing',     ['race', 'racing', 'track']],
    ['Parked',     ['parked', 'parking']],
    ['People',     ['people', 'person', 'man', 'woman', 'crowd']],
  ],
  '/astro': [
    ['Star trails', ['trail']],
    ['Milky Way',   ['milky', 'galaxy']],
    ['Silhouettes', ['silhouette']],
    ['Sparklers',   ['sparkler']],
  ],
  '/portraits': [
    ['Maasai',      ['maasai']],
    ['Jewellery',   ['jewelry', 'jewellery', 'beaded', 'necklace']],
    ['Traditional', ['traditional', 'shuka', 'attire']],
    ['Outdoors',    ['outdoors', 'greenery', 'trees']],
  ],
  '/spaces': [
    ['Interiors',   ['room', 'living', 'table', 'wooden', 'sofa', 'chair']],
    ['Modern',      ['modern', 'glass', 'minimal']],
    ['Artwork',     ['artwork', 'painting', 'wall art']],
    ['Foliage',     ['foliage', 'plant', 'greenery']],
  ],
  '/35film': [
    ['Landscape',   ['landscape', 'mountain', 'desert', 'valley']],
    ['Camping',     ['tent', 'camping', 'campfire']],
    ['Water',       ['water', 'lake', 'river', 'ocean', 'sea']],
    ['People',      ['person', 'people', 'man', 'woman']],
    ['Vehicles',    ['vehicle', 'car', 'truck', 'van']],
  ],
};

/** Read the live masonry geometry so the collapsed grid matches it. */
function measure(items) {
  const rects = items.map((el) => el.getBoundingClientRect());
  const colWidth = Math.round(rects[0]?.width) || 300;

  // Gutter = horizontal space between two tiles sharing a row.
  let gutter = 4;
  const topOf = (r) => Math.round(r.top);
  for (let i = 0; i < rects.length - 1; i++) {
    const sameRow = rects.filter((r) => Math.abs(topOf(r) - topOf(rects[i])) < 2);
    if (sameRow.length > 1) {
      sameRow.sort((a, b) => a.left - b.left);
      const g = Math.round(sameRow[1].left - sameRow[0].right);
      if (g >= 0 && g < 60) gutter = g;
      break;
    }
  }
  return { colWidth, gutter };
}

defineAddon('gallery-filter', () => {
  const taxonomy = TAXONOMIES[location.pathname.replace(/\/$/, '')];
  if (!taxonomy) return;

  const gallery = document.querySelector('.gallery-masonry');
  if (!gallery) return;

  // .gallery-masonry-item is the grid only — the lightbox keeps its own
  // separate .gallery-lightbox-item list, which we deliberately leave alone.
  const items = [...gallery.querySelectorAll('.gallery-masonry-item')];
  if (items.length < 6) return;

  const tagged = items.map((el) => {
    const alt = (el.querySelector('img')?.alt || '').toLowerCase();
    const tags = taxonomy
      .filter(([, keywords]) => keywords.some((k) => alt.includes(k)))
      .map(([label]) => label);
    return { el, tags };
  });

  const available = taxonomy
    .map(([label]) => ({ label, count: tagged.filter((t) => t.tags.includes(label)).length }))
    .filter((t) => t.count > 0);

  if (available.length < 2) return;

  const { colWidth, gutter } = measure(items);

  css('gallery-filter', `
    .taro-filter {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem 1.6rem;
      justify-content: center;
      margin: 0 auto 2.75rem;
      padding: 0 1rem;
    }
    .taro-filter__btn {
      font: inherit;
      font-size: 0.68rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: inherit;
      background: none;
      border: 0;
      border-radius: 0;
      padding: 0.25em 0;
      cursor: pointer;
      position: relative;
      opacity: 0;
      transform: translateY(7px);
      /* Staggered reveal: each label arrives just after the one before it. */
      transition: opacity 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i) * 55ms),
                  transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i) * 55ms);
    }
    .taro-filter.is-revealed .taro-filter__btn { opacity: 0.4; transform: none; }
    .taro-filter.is-revealed .taro-filter__btn:hover { opacity: 0.75; }
    .taro-filter.is-revealed .taro-filter__btn[aria-pressed="true"] { opacity: 1; }

    /* Hairline under the active label, drawn out from the centre. Reads as
       intentional against any section background without needing a palette. */
    .taro-filter__btn::after {
      content: '';
      position: absolute;
      left: 0; right: 0; bottom: 0;
      height: 1px;
      background: currentColor;
      transform: scaleX(0);
      transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .taro-filter__btn[aria-pressed="true"]::after { transform: scaleX(1); }

    .taro-filter__count {
      font-size: 0.62em;
      vertical-align: super;
      opacity: 0.5;
      margin-left: 0.45em;
      letter-spacing: 0.05em;
      font-variant-numeric: tabular-nums;
    }

    /* ---- collapsed (filtered) layout ----
       !important is load-bearing here: it overrides Squarespace's inline
       positioning, including whatever it rewrites on the next resize. */
    /* CSS columns rather than grid: this is a photography site, so tiles keep
       their true aspect ratio instead of being cropped to a uniform cell, and
       columns still pack tightly the way the original masonry does. */
    .gallery-masonry.taro-collapsed .gallery-masonry-wrapper {
      height: auto !important;
      display: block;
      column-width: ${colWidth}px;
      column-gap: ${gutter}px;
    }
    .gallery-masonry.taro-collapsed .gallery-masonry-item {
      position: static !important;
      transform: none !important;
      width: auto !important;
      display: block;
      break-inside: avoid;
      margin: 0 0 ${gutter}px;
      animation: taro-fade-in 0.35s ease both;
    }
    .gallery-masonry.taro-collapsed .gallery-masonry-item-wrapper {
      height: auto !important;
    }
    .gallery-masonry.taro-collapsed .gallery-masonry-item img {
      width: 100% !important;
      height: auto !important;
    }
    .gallery-masonry.taro-collapsed .gallery-masonry-item[data-taro-hide="1"] {
      display: none !important;
    }
    @keyframes taro-fade-in { from { opacity: 0; } to { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .taro-filter__btn,
      .taro-filter__btn::after { transition: none; transform: none; }
      .taro-filter__btn[aria-pressed="true"]::after { transform: scaleX(1); }
      .gallery-masonry.taro-collapsed .gallery-masonry-item { animation: none; }
    }
  `);

  const bar = document.createElement('div');
  bar.className = 'taro-filter';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Filter images by subject');

  const buttons = [];

  function apply(value, btn) {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

    if (value === null) {
      gallery.classList.remove('taro-collapsed');
      tagged.forEach(({ el }) => el.removeAttribute('data-taro-hide'));
    } else {
      tagged.forEach(({ el, tags }) => {
        if (tags.includes(value)) el.removeAttribute('data-taro-hide');
        else el.setAttribute('data-taro-hide', '1');
      });
      gallery.classList.add('taro-collapsed');
    }

    // Collapsing shortens the page a lot; without this the reader can be left
    // stranded below the gallery looking at empty space.
    const top = gallery.getBoundingClientRect().top;
    if (top < 0) {
      const y = window.scrollY + top - 120;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  const makeBtn = (label, count, value) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'taro-filter__btn';
    b.setAttribute('aria-pressed', value === null ? 'true' : 'false');
    b.dataset.value = value ?? '';
    b.style.setProperty('--i', buttons.length);   // drives the stagger
    b.innerHTML = `<span class="taro-filter__label">${label}</span><span class="taro-filter__count">${count}</span>`;
    b.addEventListener('click', () => apply(value, b));
    buttons.push(b);
    bar.appendChild(b);
  };

  makeBtn('All', items.length, null);
  available.forEach(({ label, count }) => makeBtn(label, count, label));

  // Sit the bar above the grid, inside the gallery section so it inherits
  // the section's colour theme rather than the page default.
  const anchor = gallery.closest('.gallery-section-wrapper') || gallery;
  anchor.parentNode.insertBefore(bar, anchor);

  // The filters stay out of the way until the visitor starts moving down the
  // page, then fade up one after another. The timed fallback matters: without
  // it, someone who never scrolls would never discover the filters at all.
  let fallback;
  const reveal = () => {
    bar.classList.add('is-revealed');
    window.removeEventListener('scroll', onScroll);
    clearTimeout(fallback);
  };
  const onScroll = () => { if (window.scrollY > 24) reveal(); };

  window.addEventListener('scroll', onScroll, { passive: true });
  fallback = setTimeout(reveal, 2600);
  onScroll();   // handle a restored scroll position on back-navigation
});
