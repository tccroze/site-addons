// "See it on your wall" — the size question, answered in feet rather than inches.
//
// A print shop's hardest moment is the size dropdown. 8x12in and 20x30in are
// both just numbers on a screen, and the difference between them is the
// difference between a postcard above a desk and the thing that owns the room.
// People either guess, or they leave and think about it.
//
// So the selected size is drawn to scale on a three-metre wall, with a sofa
// under it and a standing figure beside it. Nothing here is decoration: the
// sofa is 200cm because sofas are, the figure is 170cm, the print hangs with
// its centre 145cm off the floor because that is where pictures hang. Change
// the size above and the print changes with it.
//
// The scene is drawn, not photographed, and deliberately so — a photograph of
// somebody else's living room invites the viewer to judge the room. Flat
// silhouettes in the site's own ink read as a diagram, and a diagram is
// believed.
//
// It follows the real size control rather than replacing it: two controls
// disagreeing about which size you are buying would be worse than no viewer at
// all. Until a size is chosen it shows the middle one and says so.

import { defineAddon, css } from '../lib/util.js';

const INK = '#243230';
const RED = '#e23318';

// The room, in inches — the unit the prints are sold in, so no conversion can
// drift. 120x98in is a shade over 3m wide and 2.5m tall.
const WALL_W = 120, WALL_H = 98;
const FLOOR = 94;              // skirting top, measured down from the ceiling
const SOFA_W = 79, SOFA_H = 30, SOFA_CX = 45;
const FIGURE_H = 67;           // 170cm
const HANG_CENTRE = 57;        // 145cm off the floor, where pictures hang

const pct = (n, of) => `${((n / of) * 100).toFixed(3)}%`;

defineAddon('wall-view', () => {
  if (!/^\/shop\/p\//.test(location.pathname)) return;

  /* Squarespace renders the commerce block after this add-on runs, so the first
   * attempt finds no size control, no cart button and no loaded photograph and
   * quietly does nothing — which is exactly what the first version of this did.
   * It waits for the three pieces instead. */
  const build = () => {
    if (document.querySelector('.taro-wv')) return true;
    const select = document.querySelector('select.variant-select, .ProductItem-details select');
    const cart = document.querySelector('.sqs-add-to-cart-button-wrapper');
    if (!select || !cart || !select.options.length) return false;
    return mount(select, cart);
  };

  const mount = (select, cart) => {

  // The product photograph: the largest one the page has, which is the one the
  // gallery is showing.
  const photo = [...document.querySelectorAll('img')]
    .filter((i) => (i.currentSrc || i.src) && i.naturalWidth > 400)
    .sort((a, b) => b.naturalWidth - a.naturalWidth)[0];
  if (!photo) return false;

  /** "16x24in" -> {short: 16, long: 24}. Anything unparseable is skipped. */
  const sizes = [...select.options]
    .map((o) => {
      const m = o.text.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
      if (!m) return null;
      const a = parseFloat(m[1]), b = parseFloat(m[2]);
      return { label: o.text.trim(), value: o.value, short: Math.min(a, b), long: Math.max(a, b) };
    })
    .filter(Boolean);
  if (!sizes.length) return false;

  css('wall-view', `
    .taro-wv { margin: 2rem 0 0; }
    .taro-wv__head {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: 1rem; flex-wrap: wrap; margin-bottom: 0.7rem;
    }
    .taro-wv__label, .taro-wv__size {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.18em;
      text-transform: uppercase; margin: 0;
    }
    .taro-wv__label { color: rgba(36, 50, 48, 0.6); }
    .taro-wv__size { color: ${RED}; font-variant-numeric: tabular-nums; }
    .taro-wv__stage {
      position: relative;
      aspect-ratio: ${WALL_W} / ${WALL_H};
      width: 100%;
      overflow: hidden;
      border: 1px solid rgba(36, 50, 48, 0.18);
      background:
        linear-gradient(to bottom, rgba(36,50,48,0.055), rgba(36,50,48,0.005) 42%, rgba(36,50,48,0.03));
      background-color: #efe7cf;
    }
    .taro-wv__floor {
      position: absolute; left: 0; right: 0;
      top: ${pct(FLOOR, WALL_H)}; bottom: 0;
      background: rgba(36, 50, 48, 0.10);
      border-top: 1px solid rgba(36, 50, 48, 0.22);
    }
    .taro-wv__sofa, .taro-wv__figure {
      position: absolute; bottom: ${pct(WALL_H - FLOOR, WALL_H)};
      fill: rgba(36, 50, 48, 0.20);
    }
    .taro-wv__sofa {
      left: ${pct(SOFA_CX - SOFA_W / 2, WALL_W)};
      width: ${pct(SOFA_W, WALL_W)}; height: ${pct(SOFA_H, WALL_H)};
    }
    .taro-wv__figure {
      right: ${pct(6, WALL_W)};
      width: ${pct(18, WALL_W)}; height: ${pct(FIGURE_H, WALL_H)};
    }
    .taro-wv__print {
      position: absolute;
      background: #fff;
      padding: 0.9%;
      box-shadow: 0 1.2% 2.4% rgba(36, 50, 48, 0.28);
      transition: left 420ms cubic-bezier(0.33,1,0.68,1), top 420ms cubic-bezier(0.33,1,0.68,1),
                  width 420ms cubic-bezier(0.33,1,0.68,1), height 420ms cubic-bezier(0.33,1,0.68,1);
    }
    .taro-wv__print img {
      display: block; width: 100%; height: 100%; object-fit: cover;
    }
    .taro-wv__note {
      font-size: 0.8rem; line-height: 1.5; color: rgba(36, 50, 48, 0.66);
      margin: 0.6rem 0 0;
    }
    @media (prefers-reduced-motion: reduce) { .taro-wv__print { transition: none; } }
  `);

  const wrap = document.createElement('section');
  wrap.className = 'taro-wv';
  wrap.innerHTML =
    '<div class="taro-wv__head">' +
      '<p class="taro-wv__label">See it on your wall</p>' +
      '<p class="taro-wv__size"></p>' +
    '</div>' +
    '<div class="taro-wv__stage">' +
      '<div class="taro-wv__floor"></div>' +
      '<svg class="taro-wv__sofa" viewBox="0 0 158 60" aria-hidden="true">' +
        '<path d="M6 24c0-5 4-9 9-9h128c5 0 9 4 9 9v6c-4 1-7 4-7 8v11H13V38c0-4-3-7-7-8z"/>' +
        '<rect x="18" y="20" width="56" height="20" rx="4"/>' +
        '<rect x="84" y="20" width="56" height="20" rx="4"/>' +
        '<rect x="20" y="49" width="7" height="11" rx="2"/>' +
        '<rect x="131" y="49" width="7" height="11" rx="2"/>' +
      '</svg>' +
      '<svg class="taro-wv__figure" viewBox="0 0 34 134" aria-hidden="true">' +
        '<circle cx="17" cy="12" r="9"/>' +
        '<path d="M17 23c8 0 13 5 13 12v29c0 3-2 5-5 5h-16c-3 0-5-2-5-5V35c0-7 5-12 13-12z"/>' +
        '<rect x="9" y="66" width="7" height="66" rx="3"/>' +
        '<rect x="19" y="66" width="7" height="66" rx="3"/>' +
      '</svg>' +
      '<figure class="taro-wv__print"><img alt=""></figure>' +
    '</div>' +
    '<p class="taro-wv__note"></p>';

  const stage = wrap.querySelector('.taro-wv__stage');
  const print = wrap.querySelector('.taro-wv__print');
  const pimg = wrap.querySelector('.taro-wv__print img');
  const sizeEl = wrap.querySelector('.taro-wv__size');
  const note = wrap.querySelector('.taro-wv__note');
  pimg.src = photo.currentSrc || photo.src;

  /** Lay the print on the wall at true scale. */
  const draw = (size, chosen) => {
    // The print takes the photograph's orientation: a landscape picture is hung
    // long-edge across, whatever order the size is written in.
    const landscape = photo.naturalWidth >= photo.naturalHeight;
    const w = landscape ? size.long : size.short;
    const h = landscape ? size.short : size.long;

    print.style.width = pct(w, WALL_W);
    print.style.height = pct(h, WALL_H);
    print.style.left = pct(SOFA_CX - w / 2, WALL_W);
    print.style.top = pct(FLOOR - HANG_CENTRE - h / 2, WALL_H);

    sizeEl.textContent = `${size.long} × ${size.short} in`;
    note.textContent = chosen
      ? `Shown to scale on a 3 m wall. The sofa is 2 m across and the figure is 1.7 m tall.`
      : `Showing ${size.label} — choose a size above to see the one you want, to scale.`;
  };

  const current = () => {
    const picked = sizes.find((s) => s.value === select.value || s.label === select.value);
    return picked || null;
  };

  const update = () => {
    const picked = current();
    draw(picked || sizes[Math.floor((sizes.length - 1) / 2)], !!picked);
  };

  select.addEventListener('change', update);
  select.addEventListener('input', update);
  // The select is React-controlled; its value can change without either event.
  new MutationObserver(update).observe(select, { attributes: true, childList: true, subtree: true });

  cart.parentElement.insertBefore(wrap, cart);
  if (!photo.complete) photo.addEventListener('load', update, { once: true });
  update();
  return true;
  };

  if (!build()) {
    const mo = new MutationObserver(() => { if (build()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 20000);
  }
});
