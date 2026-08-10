// Full-screen masked intro: the wordmark is a hole cut through a cream panel,
// and the photograph behind shows through the letters. Scrolling scales the
// type up until the letters have swallowed the panel and the picture is fully
// revealed, then the page carries on into the normal hero.
//
// The knockout is an SVG mask (white keeps the panel, black cuts the hole)
// rather than background-clip:text. background-clip fills the letters with the
// image but leaves the surround as page background, so there is nothing to
// scale away — the whole point here is that the panel disappears.
//
// Everything is driven from scroll position, not from transitions, so the state
// is always exactly right for where the page is.
//
// To change the photograph, change PHOTO. To change the words, change WORDMARK.

import { defineAddon, css } from '../lib/util.js';

const PHOTO = 'https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/7d48f3b7-2b74-463d-b539-9be947fcec68/IMG_2624.jpg';
const WORDMARK = 'TARO CROZE';
const PANEL = '#f6eed5';        // the site's own cream
const STAGE_VH = 280;           // how much scrolling the reveal occupies
const MAX_SCALE = 26;           // enough for the letters to exceed the screen
const WIDTH_AT_REST = 0.72;     // wordmark width as a fraction of the viewport

defineAddon('masked-intro', () => {
  if (location.pathname !== '/') return;

  const host = document.querySelector('article#sections, article.sections');
  const firstSection = host?.querySelector('section[data-section-id]');
  if (!host || !firstSection) return;
  if (document.querySelector('.taro-intro')) return;      // never double-insert

  // Borrow the site's own display face so the wordmark belongs here.
  const sampleHeading = document.querySelector('h1, h2, h3');
  const displayFont = sampleHeading
    ? getComputedStyle(sampleHeading).fontFamily
    : getComputedStyle(document.body).fontFamily;

  css('masked-intro', `
    .taro-intro { position: relative; height: ${STAGE_VH}vh; }
    .taro-intro__stage {
      position: sticky; top: 0;
      height: 100vh; width: 100%;
      overflow: hidden;
      background: #000;
    }
    .taro-intro__photo {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      transform-origin: center;
    }
    .taro-intro__cut { position: absolute; inset: 0; width: 100%; height: 100%; }
    .taro-intro__hint {
      position: absolute;
      left: 50%; bottom: 6vh;
      transform: translateX(-50%);
      font-size: 0.62rem;
      letter-spacing: 0.34em;
      text-transform: uppercase;
      color: #243230;
      pointer-events: none;
    }

    /* No pinning, no scaling: just the photograph with the wordmark over it. */
    @media (prefers-reduced-motion: reduce) {
      .taro-intro { height: 100vh; }
      .taro-intro__stage { position: relative; }
      .taro-intro__hint { display: none; }
    }
  `);

  const wrap = document.createElement('div');
  wrap.className = 'taro-intro';
  wrap.innerHTML = `
    <div class="taro-intro__stage">
      <img class="taro-intro__photo" src="${PHOTO}?format=2500w" alt="" aria-hidden="true">
      <svg class="taro-intro__cut" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <mask id="taroIntroMask" maskUnits="userSpaceOnUse">
            <rect class="taro-intro__keep" fill="#fff"></rect>
            <text class="taro-intro__word" fill="#000" text-anchor="middle"
                  dominant-baseline="central"
                  style="font-family:${displayFont.replace(/"/g, "'")};font-weight:700;letter-spacing:0.01em">${WORDMARK}</text>
          </mask>
        </defs>
        <rect class="taro-intro__panel" fill="${PANEL}" mask="url(#taroIntroMask)"></rect>
      </svg>
      <div class="taro-intro__hint">Scroll</div>
    </div>`;

  host.insertBefore(wrap, firstSection);

  // Screen readers get the wordmark as a heading; the SVG itself is decorative.
  const sr = document.createElement('h1');
  sr.textContent = WORDMARK;
  sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
  wrap.querySelector('.taro-intro__stage').appendChild(sr);

  const svg = wrap.querySelector('.taro-intro__cut');
  const keep = wrap.querySelector('.taro-intro__keep');
  const panel = wrap.querySelector('.taro-intro__panel');
  const word = wrap.querySelector('.taro-intro__word');
  const photo = wrap.querySelector('.taro-intro__photo');
  const hint = wrap.querySelector('.taro-intro__hint');

  let W = 0, H = 0, baseScale = 1;

  const layout = () => {
    W = wrap.clientWidth || window.innerWidth;
    H = window.innerHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    [keep, panel].forEach((r) => { r.setAttribute('width', W); r.setAttribute('height', H); });

    word.setAttribute('x', W / 2);
    word.setAttribute('y', H / 2);
    // Measure at a known size, then scale so the wordmark sits at the intended
    // width whatever the display face turns out to be.
    word.style.fontSize = '100px';
    let box;
    try { box = word.getBBox(); } catch { box = null; }
    baseScale = box && box.width ? (W * WIDTH_AT_REST) / box.width : 1;
    word.style.fontSize = `${100 * baseScale}px`;
  };

  const draw = () => {
    const top = wrap.getBoundingClientRect().top;
    const travel = wrap.offsetHeight - H;
    const p = travel > 0 ? Math.max(0, Math.min(1, -top / travel)) : 0;

    // Eased so it creeps at first and runs away at the end — the letters should
    // feel like they open out, not like a linear zoom.
    const scale = 1 + (MAX_SCALE - 1) * Math.pow(p, 2.4);
    word.setAttribute('transform',
      `translate(${W / 2} ${H / 2}) scale(${scale.toFixed(4)}) translate(${-W / 2} ${-H / 2})`);

    // The panel dissolves over the last stretch so there is no hard edge left.
    panel.setAttribute('opacity', p > 0.88 ? (1 - (p - 0.88) / 0.12).toFixed(3) : 1);

    // A slow push-in on the photograph itself for depth.
    photo.style.transform = `scale(${(1.06 - 0.06 * p).toFixed(4)})`;
    hint.style.opacity = Math.max(0, 1 - p / 0.12).toFixed(2);
  };

  let queued = false;
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; draw(); }); } };

  layout();
  draw();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { layout(); draw(); }, { passive: true });
  // Webfont arriving late changes the measured width, so re-measure once ready.
  if (document.fonts?.ready) document.fonts.ready.then(() => { layout(); draw(); });
});
