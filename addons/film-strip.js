// A strip of 35mm contact sheet above the footer, on the homepage.
//
// The page ends on a call to action. Before it does, this offers a second,
// quieter way back into the work: a band of frames drifting slowly past, each
// one a link into the gallery it came from. It is the photographer's answer to
// the social-feed strip a lot of sites end on — same job, but it speaks film.
//
// The film language is doing real work here, not decoration. Sprocket holes
// down both rebates and an orange edge print reading TARO CROZE 400TX with
// advancing frame numbers say "this is a roll, there is more of it" without a
// line of copy. A plain row of thumbnails says nothing.
//
// COST. This is deliberately the cheapest moving thing on the page. The drift
// is one CSS animation on one transform — no scroll listener, no rAF, nothing
// per frame. The whole strip is built only once the visitor is near the footer,
// so a reader who never reaches the bottom pays nothing at all, and the images
// are lazy so only what is on screen is fetched.
//
// WHY THE FRAMES ARE WRITTEN DOWN HERE. The obvious thing is to fetch /stills
// and /venues at runtime and read them, so the strip refreshes itself when new
// work goes up. Measured, those two pages are 210KB and 405KB of HTML — 615KB
// to decorate a footer, for content that changes a few times a year. The list
// below costs about a kilobyte instead. The trade is that adding a photograph
// to a gallery does not add it here.
//
//   TO ADD A FRAME: paste its URL into FRAMES with the gallery it belongs to.
//   The URLs are stable — Squarespace keys them by upload id, not by position.
//
// Paintings are left out on purpose: an orange 400TX edge print running under a
// watercolour is a small lie, and the strip stops meaning anything if it holds
// everything. Stills and venues are both camera work, so the roll holds.

import { defineAddon, css } from '../lib/util.js';

// [url, gallery, alt]. Alt is empty where Squarespace has none — those frames
// are then hidden from screen readers rather than announced as "image".
const FRAMES = [
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/8daf43ee-6250-4f07-932a-1c26dfa95872/9S0A9692.jpg', 'stills', 'A jaguar perched on a tree branch in a jungle setting'],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/f7b716d1-3aa1-40ad-99ee-fa147a656bdb/P1025178.jpg', 'venues', ''],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/90f65d73-f903-4c52-b964-2a8c308b1f08/IMG_6100.JPG', 'stills', 'People gathered at night around a fire'],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/c0d505e6-542b-45a2-9c44-f506d588d73d/P1026138.jpg', 'venues', ''],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/32076646-f9f0-4d8a-831d-6d12c094129f/P1022405-2.jpg', 'stills', 'Night sky, stars through tree branches'],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/587907c0-246d-4c65-a6b7-cfaf66ccaca1/P1027259.jpg', 'venues', ''],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/e986bedd-1a1a-42d0-af83-776112e2cf5f/IMG_2215.JPG', 'stills', 'A vintage red Chevrolet convertible on a street'],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/bb40183e-1bdb-4035-8af2-1606627e01e6/P1025212.jpg', 'venues', ''],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/97cc1228-f871-431c-9df9-487c218585ff/P1023658.jpg', 'stills', ''],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/050ee6ee-d04a-483b-a484-87fbb1307587/P1025761.jpg', 'venues', ''],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/7a77ac9b-eee8-4407-a2e2-09ef62c24492/P1023579.jpg', 'stills', ''],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/f61d6313-78d1-400a-9dcb-425c8dff2123/P1026480.jpg', 'venues', ''],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/548a8cb7-dd27-482c-9652-1c80151caba6/P1025440.jpg', 'venues', ''],
];

const STOCK = 'TARO CROZE 400TX';
const FIRST_FRAME = 12;        // rolls lead in; frame 1 is never the first usable one
const SECONDS_PER_FRAME = 4.6; // drift speed, expressed per frame so it reads the
                               // same however many frames the roll holds
const INK = '#e8934a';         // edge-print orange
const BASE = '#17150f';        // the film's own dark ground

defineAddon('film-strip', () => {
  if (location.pathname !== '/') return;
  if (document.querySelector('.taro-film')) return;

  const footer = document.querySelector('footer');
  if (!footer || FRAMES.length < 4) return;   // too few frames is not a roll

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  css('film-strip', `
    .taro-film {
      position: relative;
      overflow: hidden;
      background: ${BASE};
      /* Sprocket rows are a fixed background rather than part of the drifting
         track. They are periodic, so holding them still is indistinguishable
         from moving them, and it saves scrolling a second large layer. */
      --taro-sprocket: url("data:image/svg+xml;charset=utf-8,\
%3Csvg xmlns='http://www.w3.org/2000/svg' width='34' height='20'%3E\
%3Crect x='5' y='5' width='24' height='11' rx='3' fill='%23f6eed5' fill-opacity='0.93'/%3E%3C/svg%3E");
    }
    /* The two rebates. Pseudo-elements so the markup stays one band. */
    .taro-film::before, .taro-film::after {
      content: ''; position: absolute; left: 0; right: 0; height: 20px;
      background-image: var(--taro-sprocket);
      background-repeat: repeat-x;
      z-index: 2; pointer-events: none;
    }
    .taro-film::before { top: 6px; }
    .taro-film::after  { bottom: 6px; }

    .taro-film__track {
      display: flex;
      width: max-content;
      /* Duplicated once, so translating exactly half the track wraps seamlessly. */
      animation: taro-film-drift var(--taro-film-dur, 60s) linear infinite;
      will-change: transform;
    }
    @keyframes taro-film-drift {
      from { transform: translate3d(0, 0, 0); }
      to   { transform: translate3d(-50%, 0, 0); }
    }
    /* Hovering anywhere on the band stops the roll so a frame can be read. */
    .taro-film:hover .taro-film__track,
    .taro-film:focus-within .taro-film__track { animation-play-state: paused; }

    .taro-film__frame {
      position: relative;
      flex: 0 0 auto;
      display: block;
      margin: 32px 5px 32px;      /* clear of both sprocket rebates */
      width: clamp(132px, 13vw, 186px);
      text-decoration: none;
      outline-offset: 3px;
    }
    .taro-film__frame img {
      display: block;
      width: 100%;
      aspect-ratio: 3 / 2;
      object-fit: cover;
      background: #241f16;         /* placeholder while it decodes */
      transition: filter 400ms ease, opacity 400ms ease;
      filter: saturate(0.92);
    }
    .taro-film:hover .taro-film__frame img { opacity: 0.55; }
    .taro-film .taro-film__frame:hover img,
    .taro-film .taro-film__frame:focus-visible img { opacity: 1; filter: saturate(1); }

    /* The edge print, in the lower rebate, drifting with its own frame. */
    .taro-film__num {
      position: absolute;
      left: 1px; bottom: -21px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 9px;
      letter-spacing: 0.16em;
      line-height: 1;
      color: ${INK};
      white-space: nowrap;
      pointer-events: none;
    }

    @media (max-width: 700px) {
      .taro-film__frame { margin: 26px 4px; width: clamp(108px, 34vw, 150px); }
      .taro-film::before, .taro-film::after { height: 16px; }
      .taro-film::before { top: 5px; }
      .taro-film::after { bottom: 5px; }
      .taro-film__num { bottom: -18px; font-size: 8px; }
    }

    /* Asked for no motion: the roll simply sits still. It is still a strip of
       photographs and every frame is still a link, so nothing is lost. */
    @media (prefers-reduced-motion: reduce) {
      .taro-film__track { animation: none; }
    }
  `);

  /** One frame. `n` counts up the roll: 12, 12A, 13, 13A… as film does. */
  const frame = (url, gallery, alt, i, hidden) => {
    const a = document.createElement('a');
    a.className = 'taro-film__frame';
    a.href = `/${gallery}`;
    const num = FIRST_FRAME + Math.floor(i / 2) + (i % 2 ? 'A' : '');
    if (hidden) {
      // The duplicate half of the track exists only so the loop can wrap. It
      // must not be reachable by tab or announced, or every photograph appears
      // twice to a keyboard and to a screen reader.
      a.setAttribute('aria-hidden', 'true');
      a.tabIndex = -1;
    } else {
      a.setAttribute('aria-label',
        `${alt || 'Photograph'} — open the ${gallery} gallery`);
    }
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';                 // the link carries the description
    img.src = `${url}?format=300w`;
    img.srcset = `${url}?format=300w 300w, ${url}?format=500w 500w`;
    img.sizes = '(max-width: 700px) 34vw, 186px';
    // A frame whose photograph has been deleted from the gallery leaves a
    // dark gap rather than a broken-image glyph in the middle of the roll.
    img.addEventListener('error', () => a.remove(), { once: true });
    const label = document.createElement('span');
    label.className = 'taro-film__num';
    label.textContent = i === 0 ? `${STOCK}  ${num}` : num;
    a.append(img, label);
    return a;
  };

  const build = () => {
    const band = document.createElement('div');
    band.className = 'taro-film';
    band.setAttribute('role', 'region');
    band.setAttribute('aria-label', 'Recent photographs');

    const track = document.createElement('div');
    track.className = 'taro-film__track';
    FRAMES.forEach(([u, g, alt], i) => track.appendChild(frame(u, g, alt, i, false)));
    FRAMES.forEach(([u, g, alt], i) => track.appendChild(frame(u, g, alt, i, true)));

    // Speed is set from the frame count so the roll always passes at the same
    // pace: add photographs and the strip gets longer, not faster.
    track.style.setProperty('--taro-film-dur', `${(FRAMES.length * SECONDS_PER_FRAME).toFixed(1)}s`);
    band.appendChild(track);
    footer.parentNode.insertBefore(band, footer);
  };

  // Built on approach, not on load. rootMargin is generous so it is already
  // there by the time it scrolls into view — a strip that assembles itself in
  // front of the visitor would be worse than one that was always there.
  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      build();
    }, { rootMargin: '900px 0px' });
    io.observe(footer);
  } else {
    build();
  }

  // Reduced motion is read live by the media query above; nothing to do here
  // beyond keeping the reference so the intent is visible in one place.
  void reduced;
});
