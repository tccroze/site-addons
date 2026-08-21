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
// WHY THE FRAMES ARE WRITTEN DOWN HERE. The obvious thing is to read /35film at
// runtime so the strip refreshes itself when new work goes up. Measured, that
// page is a third of a megabyte of HTML — a lot to fetch to decorate a footer,
// for content that changes a few times a year. The list below costs about two
// kilobytes instead. The trade is that adding a photograph to the gallery does
// not add it here.
//
//   TO ADD A FRAME: paste its URL into FRAMES, with its alt text and a 1 if it
//   is a portrait shot. The URLs are stable — Squarespace keys them by upload
//   id, not by position in the gallery.
//
// Every frame comes from /35film, which is the only gallery where the film
// language is literally true: these are scans, and the originals are still
// named by roll and frame (02061999-R3-22-15A is roll 3, frame 15A). Nothing
// digital, and no paintings — an orange 400TX edge print under a watercolour
// would be a small lie, and the strip stops meaning anything if it holds
// everything.

import { defineAddon, css } from '../lib/util.js';

// [url, alt, portrait]. Portrait frames are narrower rather than cropped to
// landscape: a real contact sheet carries both orientations at one height, and
// forcing a standing photograph into a 3:2 gate throws most of it away.
const FRAMES = [
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/6d464e34-9d42-47cc-b807-b8f03bdeaff7/IMG_6073.JPG', "A small roadside market stall in a desert landscape with a mountain in\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/148c0831-11cc-4349-8a00-564884844709/IMG_6057.JPG', "Aerial view of a large waterfall with a rainbow forming in the mist,\u2026", 1],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/5ae6e5ac-5b9e-4d89-a2b2-98f5ff95ad78/IMG_6049.JPG', "A yellow off-road vehicle parked on a grassy field with a rooftop tent,\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/0135c932-f834-46ab-9839-a3ca1802d174/02061999-R3-22-15A.jpg', "A shirtless man with dreadlocks standing under a thatched roof structure,\u2026", 1],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/f8d03100-00bb-441b-8fd1-4714b108947c/02061999-R5-04-21A.jpg', "A person walking through a pink and white archway near a body of water,\u2026", 1],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/e91ca240-88da-4386-a3a7-306ffb2b2d55/IMG_6052.JPG', "Two elephants walking along a lakeshore with mountains in the background\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/303afd72-9b64-4de0-a3f8-a66b74ababad/02061999-R5-23-2A.jpg', "A tall flagpole with flags and pink flower petals falling down in front\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/c2e8203f-d4a9-4e17-a1d8-218384058278/IMG_6080.JPG', "Two people walking on sand dunes in a desert under a clear sky.", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/b5f3b7a7-0846-4e08-bd07-a62c880f9ed0/IMG_6088.JPG', "A barren desert landscape with a row of leafless trees in the foreground,\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/9bfd711b-2da1-4eb0-af3d-34064386227d/IMG_6100.JPG', "Fleeing figures and flames at a night-time event, with a Ferris wheel in\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/041c9a12-12e5-4e74-9cea-f9f715b025a6/02061999-R4-28-8A.jpg', "A young elephant walking on dirt ground with scattered leaves, with green\u2026", 1],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/63ed5f2b-2905-46e7-8b08-dd4d2db1176a/IMG_6099.JPG', "People standing on top of a tower at night, with a bright light or object\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/1d048555-c96f-4b17-a3f4-79fdf54c364e/02061999-R6-05-32A.jpg', "A fish placed on a woven mat with a bottle of water and a red rope nearby.", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/08017b91-722b-4f63-8e37-7f6d25e7eeac/IMG_6103.JPG', "Three people standing on top of a large, rusty, disassembled train car in\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/afb8b9c6-c103-45a5-8ff4-bfc72a4cad73/IMG_6113.JPG', "A person holding a delicate dragonfly on their finger, with a blurred\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/d08eb1a5-ceda-41b4-adaa-e3c64f918021/IMG_6112.JPG', "Beach scene with wooden structures and boats near the shore, mountains in\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/5bbe4547-4c9f-45f5-bc6b-9bcb84bdaa06/IMG_9089.JPG', "Group of women sitting on rocky ground outdoors, surrounded by trees\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/fbc7f675-aa40-42dc-bb8b-c4d8eaf5eff5/IMG_9103.JPG', "A woman in a wide-brimmed hat standing by a stream, with other people in\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/0f84031c-c149-425e-b012-c5a466569c1f/IMG_9114.JPG', "Close-up of a person's face, focusing on their eye, forehead, and blonde,\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/2a85af9d-81a1-4e96-b79b-5c6ae60d961e/IMG_9119.JPG', "Looking up at the sky through the canopy of trees with green leaves and\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/4b8145b9-579b-4b57-bc96-08b5ee855990/02061999-R1-00-24A.jpg', "Scenic landscape with green fields, a small fence, trees, and a mountain\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/97cbb3f7-fe82-4d40-bb99-16b4a0853014/02061999-R2-05-19A.jpg', "A camping tent set up on a dry, rocky terrain in a savannah landscape\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/38726994-3a48-4a7b-900a-4f479d596380/02061999-R6-25-12A.jpg', "A cheerful young man holding a lit torch with flames at night, smiling at\u2026", 1],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/7e68543c-9bbb-4797-acea-c9002ad60948/02061999-R2-12-12A.jpg', "Photo of a person taking a picture of a landscape visible in the side\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/8b6f17e7-91c8-444a-b481-dbc9819d6610/IMG_9118.JPG', "Looking through the side mirror of a vehicle, a woman with blonde hair is\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/06389261-4afc-4e19-ab70-862b655b051a/02061999-R3-05-32A.jpg', "A person with long hair wearing a loose shirt and blue jeans standing\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/91dc4efc-4cf6-4c34-aaba-22174adf457d/02061999-R3-19-18A.jpg', "A row of vintage Land Rover vehicles parked outdoors in front of a rustic\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/12a9911b-1eb0-4c73-9221-784f1501b4ca/02061999-R3-33-4A.jpg', "People at the shoreline displaying fish they caught during a fishing\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/d7771c26-54d5-464a-ad34-a3cf642d45c3/02061999-R4-22-14A.jpg', "A large tree with thick branches and dense green leaves in a cleared\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/c548325b-e86d-463f-a0e7-8805dfd3d44c/02061999-R4-26-10A.jpg', "A person without a shirt and wearing shorts is working in a garden with\u2026", 1],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/73c63490-15d7-4e2f-af68-c1e38de8ec57/02061999-R6-06-31A.jpg', "Man wearing a baseball cap with 'LANO Adventures' logo, holding a\u2026", 0],
  ['https://images.squarespace-cdn.com/content/v1/6923f2156e59f05fd5bf40f3/338eb3d4-b9a9-4ed5-91f8-e486a05c4ef6/02061999-R6-09-28A.jpg', "A person wearing a yellow waterproof jacket, a cap, and a face mask,\u2026", 0],
];

const STOCK = 'TARO CROZE 400TX';
const FIRST_FRAME = 12;        // rolls lead in; frame 1 is never the first usable one
const SECONDS_PER_FRAME = 3.4; // drift speed, expressed per frame so it reads the
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
    .taro-film::before { top: 3px; }
    .taro-film::after  { bottom: 3px; }

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
      /* Asymmetric on purpose: the lower rebate has to hold the edge print
         AND the sprocket row without them touching, the upper one only the
         sprockets. At 32/32 the frame numbers sat inside the holes. */
      margin: 26px 5px 46px;
      width: clamp(132px, 13vw, 186px);
      text-decoration: none;
      outline-offset: 3px;
    }
    /* Standing frames keep the same gate height and simply take less width,
       exactly as they do on a real contact sheet. */
    .taro-film__frame--tall { width: clamp(88px, 8.7vw, 124px); }
    .taro-film__frame--tall img { aspect-ratio: 2 / 3; }
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
      left: 1px; bottom: -16px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 9px;
      letter-spacing: 0.16em;
      line-height: 1;
      color: ${INK};
      white-space: nowrap;
      pointer-events: none;
    }

    @media (max-width: 700px) {
      .taro-film__frame { margin: 22px 4px 38px; width: clamp(108px, 34vw, 150px); }
      .taro-film__frame--tall { width: clamp(72px, 22vw, 100px); }
      .taro-film::before, .taro-film::after {
        height: 16px; background-size: 27px 16px;
      }
      .taro-film::before { top: 3px; }
      .taro-film::after { bottom: 3px; }
      .taro-film__num { bottom: -14px; font-size: 8px; }
    }

    /* Asked for no motion: the roll simply sits still. It is still a strip of
       photographs and every frame is still a link, so nothing is lost. */
    @media (prefers-reduced-motion: reduce) {
      .taro-film__track { animation: none; }
    }
  `);

  /** One frame. `n` counts up the roll: 12, 12A, 13, 13A… as film does. The
   *  originals carry their own frame codes, but they come off six different
   *  rolls — printing those would jump about. Sequential reads as one roll,
   *  which is what the strip is pretending to be. */
  const frame = (url, alt, portrait, i, hidden) => {
    const a = document.createElement('a');
    a.className = 'taro-film__frame' + (portrait ? ' taro-film__frame--tall' : '');
    a.href = '/35film';
    const num = FIRST_FRAME + Math.floor(i / 2) + (i % 2 ? 'A' : '');
    if (hidden) {
      // The duplicate half of the track exists only so the loop can wrap. It
      // must not be reachable by tab or announced, or every photograph appears
      // twice to a keyboard and to a screen reader.
      a.setAttribute('aria-hidden', 'true');
      a.tabIndex = -1;
    } else {
      a.setAttribute('aria-label', `${alt || 'Photograph'} — open the film gallery`);
    }
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';                 // the link carries the description
    img.src = `${url}?format=300w`;
    img.srcset = `${url}?format=300w 300w, ${url}?format=500w 500w`;
    img.sizes = '(max-width: 700px) 34vw, 186px';
    img.width = portrait ? 124 : 186;
    img.height = 124;
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
    FRAMES.forEach(([u, alt, tall], i) => track.appendChild(frame(u, alt, tall, i, false)));
    FRAMES.forEach(([u, alt, tall], i) => track.appendChild(frame(u, alt, tall, i, true)));

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
