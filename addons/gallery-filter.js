// Subject filters for the masonry gallery pages.
//
// Squarespace positions masonry items absolutely via JS-computed translate3d,
// inside a wrapper with a hardcoded pixel height. Hiding items with display:none
// therefore leaves holes in the grid and a wrapper that is the wrong height, and
// Squarespace recomputes positions on resize so any layout we did ourselves gets
// overwritten. So filtering dims non-matches instead of removing them: no layout
// involvement at all, and it survives Squarespace's own relayout.
//
// Tags come from each image's alt text, which on this site is genuinely
// descriptive. Raw word frequency is not usable — the alt text describes whole
// scenes, so the commonest words are "grassy", "cloudy", "trees". Hence the
// curated keyword lists below.

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

defineAddon('gallery-filter', () => {
  const taxonomy = TAXONOMIES[location.pathname.replace(/\/$/, '')];
  if (!taxonomy) return;

  const gallery = document.querySelector('.gallery-masonry');
  if (!gallery) return;

  // .gallery-masonry-item is the grid only — the lightbox keeps its own
  // separate .gallery-lightbox-item list, which we deliberately leave alone.
  const items = [...gallery.querySelectorAll('.gallery-masonry-item')];
  if (items.length < 6) return;

  // Tag every item up front so filtering is just an attribute flip.
  const tagged = items.map((el) => {
    const alt = (el.querySelector('img')?.alt || '').toLowerCase();
    const tags = taxonomy
      .filter(([, keywords]) => keywords.some((k) => alt.includes(k)))
      .map(([label]) => label);
    return { el, tags };
  });

  // Only offer a filter if it actually matches something.
  const available = taxonomy
    .map(([label]) => ({ label, count: tagged.filter((t) => t.tags.includes(label)).length }))
    .filter((t) => t.count > 0);

  if (available.length < 2) return;

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
      transition: opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease;
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

    .gallery-masonry-item { transition: opacity 0.4s ease, filter 0.4s ease; }
    .gallery-masonry-item[data-taro-dim="1"] {
      opacity: 0.15;
      filter: grayscale(1);
      pointer-events: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .gallery-masonry-item, .taro-filter__btn { transition: none; }
    }
  `);

  const bar = document.createElement('div');
  bar.className = 'taro-filter';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Filter images by subject');

  const buttons = [];
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
    return b;
  };

  function apply(value, btn) {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    tagged.forEach(({ el, tags }) => {
      const match = value === null || tags.includes(value);
      if (match) el.removeAttribute('data-taro-dim');
      else el.setAttribute('data-taro-dim', '1');
    });
  }

  makeBtn('All', items.length, null);
  available.forEach(({ label, count }) => makeBtn(label, count, label));

  // Sit the bar above the grid, inside the gallery section so it inherits
  // the section's colour theme rather than the page default.
  const anchor = gallery.closest('.gallery-section-wrapper') || gallery;
  anchor.parentNode.insertBefore(bar, anchor);
});
