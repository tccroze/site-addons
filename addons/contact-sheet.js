// The gallery as a contact sheet.
//
// A masonry wall is how every photography site shows work. A contact sheet is
// how a photographer actually looks at it: the whole roll at once, on the film
// base, numbered along the rebate, with a grease pencil ring around the frames
// worth printing. It is the owner's own working language, and no other
// photographer's site is laid out this way.
//
// THE RINGS ARE NOT DECORATION. A chinagraph ring on a contact sheet means
// "print this one", so the frames ringed here are exactly the ones he sells as
// prints — the same pairs the lightbox uses for its buy link, read from one
// place in lib/prints.js. Somebody who understands contact sheets reads the
// rings correctly without being told, and clicking one goes to the print.
//
// It is a second view of the same gallery, never a replacement: the masonry
// stays in the document, the toggle swaps which is shown, and every frame still
// opens the same lightbox by clicking through to the original tile. Filtering
// keeps working — a hidden tile hides its frame here too.

import { defineAddon, css } from '../lib/util.js';
import { PRINTS, assetOf } from '../lib/prints.js';

const AMBER = '#f7941d';
const BASE = '#14120e';          // film base
const RING = '#e23318';

defineAddon('contact-sheet', () => {
  const gallery = document.querySelector('.gallery-masonry');
  const aside = document.querySelector('.taro-gf__aside');
  if (!gallery || !aside) return;

  const tiles = [...gallery.querySelectorAll('.gallery-masonry-item')];
  if (tiles.length < 4) return;

  css('contact-sheet', `
    .taro-cs-toggle {
      -webkit-appearance: none; appearance: none;
      background: none; border: 0; padding: 0.35rem 0; margin-top: 0.55rem;
      font: inherit; font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.16em; text-transform: uppercase;
      color: #243230; cursor: pointer;
      border-bottom: 1px solid rgba(226, 51, 24, 0.45);
      transition: color 180ms ease, border-color 180ms ease;
    }
    @media (hover: hover) { .taro-cs-toggle:hover { color: ${RING}; border-bottom-color: ${RING}; } }
    .taro-cs-toggle:focus-visible { outline: 2px solid #243230; outline-offset: 3px; }

    .taro-cs { display: none; background: ${BASE}; padding: clamp(1rem, 3vw, 2rem) 0; }
    .taro-cs.is-on { display: block; }
    .taro-cs-on .gallery-masonry { display: none !important; }

    /* Sprocket holes down both edges, drawn rather than imaged so they stay
       crisp at any width and cost nothing to load. */
    .taro-cs__roll {
      position: relative;
      padding: 0 clamp(1.6rem, 4vw, 3rem);
      background-image:
        repeating-linear-gradient(to bottom,
          transparent 0 10px, rgba(246,238,213,0.9) 10px 26px, transparent 26px 40px),
        repeating-linear-gradient(to bottom,
          transparent 0 10px, rgba(246,238,213,0.9) 10px 26px, transparent 26px 40px);
      background-size: 12px 40px, 12px 40px;
      background-position: left 6px top, right 6px top;
      background-repeat: repeat-y, repeat-y;
    }
    .taro-cs__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: clamp(0.7rem, 1.6vw, 1.2rem);
    }
    @media (max-width: 640px) {
      .taro-cs__grid { grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); }
    }

    .taro-cs__frame {
      position: relative; display: block; width: 100%;
      padding: 0; border: 0; background: none; cursor: pointer;
      -webkit-appearance: none; appearance: none;
    }
    .taro-cs__shot {
      position: relative; width: 100%; aspect-ratio: 3 / 2;
      overflow: hidden; background: rgba(246,238,213,0.06);
    }
    .taro-cs__shot img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform 420ms cubic-bezier(0.33, 1, 0.68, 1), filter 300ms ease;
    }
    @media (hover: hover) {
      .taro-cs__frame:hover .taro-cs__shot img { transform: scale(1.04); }
    }
    .taro-cs__frame:focus-visible .taro-cs__shot { outline: 2px solid ${AMBER}; outline-offset: 3px; }

    /* The rebate: stock name and frame number, as it prints on the film edge. */
    .taro-cs__edge {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: 0.6rem; padding: 0.4rem 0.1rem 0;
      font-family: 'Arial Narrow', 'Roboto Condensed', 'Liberation Sans Narrow',
                   'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-stretch: condensed;
      font-size: 10px; font-weight: 700; letter-spacing: 0.11em;
      text-transform: uppercase; color: ${AMBER};
      text-shadow: 0 0 2px rgba(247, 148, 29, 0.45);
    }
    .taro-cs__frame--print .taro-cs__edge { color: ${RING}; text-shadow: none; }

    /* The grease pencil ring.
       A perfect 2.6px ellipse at full opacity read as a marker circle drawn by
       a child, which is fair — a chinagraph is a soft wax pencil held at speed,
       and it does none of those things. It wobbles, it thins where the hand
       moves fastest, it does not close, and it overshoots where it started.
       So the ring is now an open, uneven path, a third of the weight and
       waxy rather than solid, sitting inside the frame instead of spilling
       over it. */
    .taro-cs__ring { position: absolute; inset: 0; pointer-events: none; }
    .taro-cs__ring path {
      fill: none; stroke: ${RING}; stroke-width: 1.7;
      stroke-linecap: round; stroke-linejoin: round;
      opacity: 0.78;
      stroke-dasharray: 340; stroke-dashoffset: 340;
      transition: stroke-dashoffset 1100ms cubic-bezier(0.33, 1, 0.68, 1);
      vector-effect: non-scaling-stroke;
    }
    .taro-cs.is-on .taro-cs__ring path { stroke-dashoffset: 0; }
    @media (prefers-reduced-motion: reduce) {
      .taro-cs__ring path { transition: none; stroke-dashoffset: 0; }
      .taro-cs__shot img { transition: none; }
    }

    .taro-cs__note {
      color: rgba(246,238,213,0.6);
      font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase;
      text-align: center; margin: 1.4rem 0 0; padding: 0 1rem;
    }
    .taro-cs__note b { color: ${RING}; font-weight: 700; }
  `);

  /** One grease-pencil ring, drawn rather than described.
   *
   *  An ellipse walked in twelve steps with the radius nudged at each one, so
   *  the line is never quite round; it starts at a different angle on every
   *  frame and stops a little short of a full turn, then overshoots past its
   *  own beginning — which is what a hand does with a wax pencil and what a
   *  perfect ellipse never does. Seeded from the frame index, so a given
   *  photograph gets the same ring every time rather than a new one on each
   *  page load.
   */
  const ringPath = (seed) => {
    const rnd = (n) => {
      const x = Math.sin((seed + 1) * 97.13 + n * 31.77) * 10000;
      return x - Math.floor(x);
    };
    const cx = 50, cy = 35, rx = 45, ry = 30, N = 12;
    const from = rnd(0) * Math.PI * 2;
    const sweep = Math.PI * 2 * (1.03 + rnd(1) * 0.06);     // just past closing
    const pts = [];
    for (let i = 0; i <= N; i += 1) {
      const a = from + sweep * (i / N);
      const wob = 1 + (rnd(i + 2) - 0.5) * 0.075;
      pts.push([cx + Math.cos(a) * rx * wob, cy + Math.sin(a) * ry * wob]);
    }
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i += 1) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      d += ` Q ${x0.toFixed(1)} ${y0.toFixed(1)} ` +
           `${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)}`;
    }
    return d;
  };

  /* ---- the sheet ------------------------------------------------------ */
  const sheet = document.createElement('div');
  sheet.className = 'taro-cs';
  const roll = document.createElement('div');
  roll.className = 'taro-cs__roll';
  const grid = document.createElement('div');
  grid.className = 'taro-cs__grid';
  roll.appendChild(grid);
  sheet.appendChild(roll);

  let ringed = 0;
  tiles.forEach((tile, i) => {
    const img = tile.querySelector('img');
    const src = img && (img.currentSrc || img.getAttribute('data-src') || img.src);
    if (!src) return;
    const asset = assetOf(img);
    const print = PRINTS[asset || ''];

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'taro-cs__frame' + (print ? ' taro-cs__frame--print' : '');
    btn.dataset.taroIndex = String(i);

    const shot = document.createElement('div');
    shot.className = 'taro-cs__shot';
    const thumb = document.createElement('img');
    thumb.src = `${src.split('?')[0]}?format=500w`;
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.decoding = 'async';
    shot.appendChild(thumb);

    if (print) {
      ringed += 1;
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'taro-cs__ring');
      svg.setAttribute('viewBox', '0 0 100 70');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', ringPath(i));
      svg.appendChild(path);
      shot.appendChild(svg);
    }

    const edge = document.createElement('div');
    edge.className = 'taro-cs__edge';
    const num = document.createElement('span');
    num.textContent = `${10 + i}A`;
    const mark = document.createElement('span');
    mark.textContent = print ? 'Print' : '';
    edge.append(num, mark);

    btn.append(shot, edge);
    btn.setAttribute('aria-label', print
      ? `Frame ${10 + i} — open, available as the print ${print.title}`
      : `Frame ${10 + i} — open`);

    // The masonry tile owns the lightbox; this only asks it to open.
    btn.addEventListener('click', () => {
      const link = tile.querySelector('.gallery-masonry-lightbox-link') || tile.querySelector('a');
      link?.click();
    });
    grid.appendChild(btn);
  });

  const note = document.createElement('p');
  note.className = 'taro-cs__note';
  note.innerHTML = ringed
    ? `<b>Ringed frames</b> are available as prints`
    : '';
  if (ringed) sheet.appendChild(note);

  gallery.parentElement.insertBefore(sheet, gallery.nextSibling);

  /* ---- the toggle ----------------------------------------------------- */
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'taro-cs-toggle';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.textContent = 'View as contact sheet';
  aside.appendChild(toggle);

  toggle.addEventListener('click', () => {
    const on = !sheet.classList.contains('is-on');
    sheet.classList.toggle('is-on', on);
    document.documentElement.classList.toggle('taro-cs-on', on);
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'View as gallery' : 'View as contact sheet';
    if (!on) return;
    sheet.scrollIntoView({ block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  /* Filtering hides masonry tiles; the sheet follows, so the two views never
     disagree about what is on screen. */
  const sync = () => {
    [...grid.children].forEach((btn) => {
      const tile = tiles[Number(btn.dataset.taroIndex)];
      btn.hidden = !!tile && tile.hasAttribute('data-taro-hide');
    });
  };
  new MutationObserver(sync).observe(gallery, {
    attributes: true, subtree: true, attributeFilter: ['data-taro-hide'],
  });
  sync();
});
