// Paper tooth on the flat paper surfaces.
//
// The site's identity is a torn-watercolour print lying on cream stock, but
// the stock itself is rendered as a flat fill — mathematically flat, which no
// paper is. This lays a faint tooth over the surfaces that are meant to read
// as paper: the testimonial section (cream), the footer (slate) and the cream
// cap strip the intro paints over the band the header vacates. Never over a
// photograph, a video or a coloured block — grain on top of a picture reads
// as a bad scan, not as paper, and the negatives already carry their own.
//
// One static background-image on a pseudo-element: no scroll handler, no
// rAF, no measurement after boot, no per-frame cost of any kind. The tile is
// assets/grain.png, a seeded 180px noise PNG of one-pixel flecks at alpha 6,
// 9 or 12, so the "opacity" of the effect — 9/255, about 0.035 on average —
// lives in the asset's own alpha rather than in a CSS opacity on the overlay;
// stacking the two would attenuate twice and leave nothing on screen.
//
// Half the flecks are black and half white. Under multiply, which the cream
// surfaces get, only the dark ones register — ink pressed into the tooth;
// white multiplied into anything is a no-op. Under screen, which the footer
// gets, only the light ones do — light catching raised fibre. Multiply alone
// on the footer's rgb(36,50,48) would darken by two levels at most: a texture
// that exists in the DOM but not on the screen. Which mode a surface takes is
// decided once from its computed colour, so a retheme in the Squarespace
// editor flips it without a code change here.
//
// Because the flecks are pure black and pure white, the blend modes are doing
// selection, not tinting: black multiplied into a colour is black, composited
// at alpha a that is bg*(1-a) — exactly what a normal-blended black fleck is —
// and the same holds for white under screen. The population a mode rejects
// would have been invisible under normal blending anyway (white at alpha 12
// lifts cream by 0.4 of a level; black drops the slate by 1.7), so a browser
// without mix-blend-mode draws the same picture. No feature check, no
// fallback path — there is nothing to fall back to. Measured on the live
// page: 7.1% of the cream's pixels and 7.3% of the slate's carry a fleck,
// half the tile's 14% coverage each, and the red band between them is
// untouched to the pixel. The tile is drawn at one CSS pixel per fleck, so a
// retina screen upsamples it 2x with bilinear smoothing and gets a softer,
// slightly wider tooth at a lower peak — which suits a phone, where the eye
// is closer. It is not pixelated on purpose: crisp 2x2 squares read as
// digital noise, not paper.
//
// The surfaces are found by structure rather than by section id — the
// testimonial list (ul.user-items-list-item-container) and whatever flat
// sections the <footer> holds — because rebuilding a section in the editor
// issues a new id while the structure survives. Squarespace paints a section's
// colour on .section-border > .section-background (absolute, inset 0,
// overflow hidden), which is the ideal host: the ::after is clipped to the
// section and, living inside the background, sits under .content-wrapper in
// paint order — text, buttons and the footer signature all stay on top. A
// background that holds an <img>/<video> or carries its own background-image
// is left alone. For the record, at the time of writing the testimonial
// section is 69f41c97f3ecc44da4e5516f (theme light-bold, cream) and the
// footer section 69df711e1d309157c7546391 (theme black, slate) — the footer
// is the same section on every page.
//
// Progressive enhancement in the plainest sense: with no JS the surfaces are
// the flat cream and slate Squarespace renders anyway. Nothing moves, so
// there is no motion to reduce; nothing is hover-driven, so nothing to gate
// on pointer type. A phone pays the same as a desktop: one tiled 5KB texture.
//
// Regenerating the tile (seeded, so the output is byte-identical; ~5.2KB).
// It is a 4-bit palette PNG with per-entry alpha in a tRNS chunk because the
// tile is 32,400 pixels and anything resembling real noise deflates to 50KB+;
// a seven-entry palette at 14% coverage is what keeps it under 6KB:
//
//   python3 - <<'EOF'
//   import zlib, struct, random
//   W = H = 180; rng = random.Random(0x7A20); A = (6, 9, 12)
//   pal = [(0, 0)] + [(0, a) for a in A] + [(255, a) for a in A]
//   raw = bytearray()
//   for y in range(H):
//       idx = []
//       for x in range(W):
//           if rng.random() < 0.14:
//               ai = rng.randrange(3)
//               idx.append(1 + ai if rng.random() < 0.5 else 4 + ai)
//           else:
//               idx.append(0)
//       raw += b'\0' + bytes((idx[i] << 4) | idx[i + 1] for i in range(0, W, 2))
//   ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
//   open('assets/grain.png', 'wb').write(b'\x89PNG\r\n\x1a\n'
//       + ch(b'IHDR', struct.pack('>IIBBBBB', W, H, 4, 3, 0, 0, 0))
//       + ch(b'PLTE', b''.join(bytes((g, g, g)) for g, _ in pal))
//       + ch(b'tRNS', bytes(a for _, a in pal))
//       + ch(b'IDAT', zlib.compress(bytes(raw), 9)) + ch(b'IEND', b''))
//   EOF

import { defineAddon, css } from '../lib/util.js';

// Sized off the module's own URL so it resolves wherever this is hosted, and
// versioned for the same reason masked-intro's photographs are: GitHub Pages
// caches each file for ten minutes independently. Stamped by scripts/release.sh.
const V = '2.39.17';
const TILE = `${new URL('../assets/grain.png', import.meta.url).href}?v=${V}`;
const TILE_PX = 180;   // the PNG's own size, drawn 1:1 in CSS px — one fleck per CSS pixel

// Relative luminance under which a surface counts as dark paper and takes
// the light flecks (screen) instead of the ink ones (multiply). The cream is
// about 0.86, the footer slate 0.03, the teal category band 0.42.
const DARK_BELOW = 0.5;

defineAddon('grain', () => {
  css('grain', `
    /* The hosts are already position:absolute (Squarespace's .section-background,
       masked-intro's cap); boot checks that rather than setting it, because
       forcing a position onto Squarespace's own element is how layouts break. */
    .taro-grain::after,
    .taro-intro__cap::after {
      content: "";
      position: absolute;
      inset: 0;
      background: url("${TILE}") 0 0 / ${TILE_PX}px ${TILE_PX}px repeat;
      mix-blend-mode: multiply;
      pointer-events: none;
    }
    .taro-grain[data-taro-grain="dark"]::after {
      mix-blend-mode: screen;
    }
  `);

  // Parse getComputedStyle's rgb()/rgba() into relative luminance. Returns
  // null for anything it cannot read — including a transparent layer, whose
  // colour is not the colour the eye sees there — so the caller can fall
  // through to the next layer down, and to multiply as the default.
  const luminance = (color) => {
    const m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(color || '');
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * lin(+m[1]) + 0.7152 * lin(+m[2]) + 0.0722 * lin(+m[3]);
  };

  const sections = new Set();
  // The testimonials: Squarespace's "simple list" section. One on the homepage
  // today; the same selector testimonial-rotator.js drives off.
  document.querySelectorAll('ul.user-items-list-item-container').forEach((ul) => {
    const sec = ul.closest('section[data-section-id]');
    if (sec) sections.add(sec);
  });
  // The footer: every section it holds (one today, on every page).
  const footer = document.querySelector('footer');
  if (footer) footer.querySelectorAll('section[data-section-id]').forEach((sec) => sections.add(sec));
  if (!sections.size) return;

  sections.forEach((sec) => {
    const bg = sec.querySelector(':scope > .section-border > .section-background')
            || sec.querySelector(':scope > .section-background');
    if (!bg) return;
    // Flat surfaces only. A background carrying a picture is not paper, and a
    // grain laid over it would be grain laid over a photograph.
    if (bg.querySelector('img, video, picture, iframe, canvas')) return;
    // Read once, at boot. Nothing here ever measures again.
    const style = getComputedStyle(bg);
    if (style.backgroundImage !== 'none') return;
    // An unpositioned host would hand the ::after to the nearest positioned
    // ancestor and let it wander outside the section. Skip rather than fix.
    if (style.position === 'static') return;

    bg.classList.add('taro-grain');
    // The section's colour is painted on both .section-border and
    // .section-background; whichever is opaque decides light or dark.
    const lum = luminance(style.backgroundColor)
             ?? luminance(getComputedStyle(bg.parentElement).backgroundColor);
    if (lum !== null && lum < DARK_BELOW) bg.setAttribute('data-taro-grain', 'dark');
  });
});
