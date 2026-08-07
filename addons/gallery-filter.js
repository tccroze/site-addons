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
      gap: 0.5rem;
      justify-content: center;
      margin: 0 auto 2rem;
      padding: 0 1rem;
    }
    .taro-filter__btn {
      font: inherit;
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: inherit;
      background: transparent;
      border: 1px solid currentColor;
      border-radius: 999px;
      padding: 0.45em 1.1em;
      cursor: pointer;
      opacity: 0.55;
      transition: opacity 0.2s ease, box-shadow 0.2s ease;
    }
    .taro-filter__btn:hover { opacity: 0.9; }
    /* Active state uses weight and opacity rather than a fill, so it reads
       correctly against any section background without knowing the palette. */
    .taro-filter__btn[aria-pressed="true"] {
      opacity: 1;
      font-weight: 600;
      box-shadow: inset 0 0 0 1px currentColor;
    }
    .taro-filter__count { opacity: 0.55; margin-left: 0.5em; font-variant-numeric: tabular-nums; }

    /* ---- collapsed (filtered) layout ----
       !important is load-bearing here: it overrides Squarespace's inline
       positioning, including whatever it rewrites on the next resize. */
    .gallery-masonry.taro-collapsed .gallery-masonry-wrapper {
      height: auto !important;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(${colWidth}px, 1fr));
      gap: ${gutter}px;
    }
    .gallery-masonry.taro-collapsed .gallery-masonry-item {
      position: static !important;
      transform: none !important;
      width: auto !important;
      animation: taro-fade-in 0.35s ease both;
    }
    .gallery-masonry.taro-collapsed .gallery-masonry-item-wrapper {
      height: auto !important;
      aspect-ratio: 1 / 1;
    }
    .gallery-masonry.taro-collapsed .gallery-masonry-item img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover;
    }
    .gallery-masonry.taro-collapsed .gallery-masonry-item[data-taro-hide="1"] {
      display: none !important;
    }
    @keyframes taro-fade-in { from { opacity: 0; } to { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .taro-filter__btn { transition: none; }
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
});
