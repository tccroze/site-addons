// Paper tooth on the flat surfaces.
//
// The identity is film prints on torn watercolour paper, but the paper itself
// is rendered as a flat fill — mathematically flat, which no stock ever is.
// This lays a faint tooth over the four surfaces that are meant to read as
// paper rather than as picture: the testimonial section (cream), the dark
// quote band above it, the final call to action (red) and the footer.
//
// NEVER over a photograph or a video. Grain on top of a picture reads as a bad
// scan, not as paper — and the 35mm scans on this site carry their own grain
// already, so a second layer would be a lie about the negative. That rule is
// not enforced by a list of sections to avoid; it is structural. The overlay
// only ever attaches to Squarespace's .section-background, the absolutely
// positioned, inset-0, overflow-hidden div a section paints its colour on, and
// that div sits UNDER .content-wrapper in paint order. So even if the hunt
// below ever picked the wrong section, the grain would land on flat colour
// beneath the content: every image block, heading, button and the footer
// signature still paint over the top of it, untextured. A .section-background
// that holds an <img> or <video>, or carries its own background-image, is
// skipped outright — that is the case where the flat fill IS the photograph.
//
// COST: zero per frame. One static background-image on one pseudo-element per
// surface. No scroll handler, no rAF, no observer, no measurement after boot —
// the only reads are a handful of getComputedStyle calls during init, before
// anything is written. Nothing moves, so there is no motion to reduce (the
// prefers-reduced-motion rule that governs the rest of the add-ons has nothing
// to govern here); nothing is hover-driven, so there is no pointer to gate on.
// A phone pays exactly what a desktop pays: one 5.9KB tile, cached.
//
// WHY THE "OPACITY" LIVES IN THE ASSET. The flecks carry their own alpha —
// 5 to 14 out of 255, mean 9.5, so about 0.037 — rather than the overlay
// carrying a CSS opacity. Stacking the two attenuates twice and leaves a
// texture that exists in the DOM and not on the screen. If this ever needs to
// be lighter or heavier, regenerate the tile (recipe below); do not reach for
// opacity on the ::after.
//
// WHY TWO POPULATIONS AND TWO BLEND MODES. The tile is half pure-black flecks
// and half pure-white ones, at 7% coverage each. The cream takes multiply, so
// only the dark half registers — ink pressed into the tooth; white multiplied
// into anything is a no-op. The dark band, the red CTA and the footer take
// SCREEN, so only the light half registers — light catching raised fibre.
//
//   Multiply on those three was tried and is worthless: it can only ever pull
//   a colour towards black, and 5% of black on rgb(36,50,48) moves it by under
//   two levels. On the red it does something worse than nothing — it dulls the
//   brand red towards brown.
//
//   Overlay was the other candidate and was rejected. On a dark backdrop
//   overlay multiplies the dark flecks AND screens the light ones, so both
//   populations register, the texture doubles in density and stops reading as
//   tooth — it reads as noise. Worse, overlay's result is a function of the
//   backdrop's own luminance, so the same tile would come out at a different
//   strength on the red band than on the dark one, and the two would no longer
//   look like the same sheet of paper. Screen is a clean selection: it takes
//   the light half and ignores the rest, at the same strength everywhere.
//
// Because the flecks are pure black and pure white, the blend modes are doing
// SELECTION, not tinting — black multiplied into a colour is black, and white
// screened into one is white, which is what those flecks would have painted
// under normal blending anyway. So a browser that ignores mix-blend-mode draws
// very nearly the same picture: the population a mode would have rejected is
// invisible on that surface regardless. There is no feature test here and no
// fallback path, because there is nothing to fall back to.
//
//   Worked through, at the tile's strongest fleck (alpha 14 of 255):
//     cream  246,238,213 + multiply black -> 232,225,201   (a real, faint tooth)
//     dark    36, 50, 48 + screen   white ->  48, 61, 59
//     red    226, 51, 24 + screen   white -> 228, 62, 37   (lifts, never dulls)
//   and the two rejected populations, if a browser blended them normally:
//     cream + white 246,239,215 — two levels; dark + black 34,47,45 — three.
//   Three levels is under the JPEG noise floor of the photographs beside it. The same argument covers the footer's other unknown: its section
// background may be transparent, with the dark coming from further up the
// page, and if that puts the real colour outside the pseudo-element's blending
// group then screen resolves against transparent black — which returns the
// source, i.e. the light flecks, composited normally over the dark. Identical
// result by a different route.
//
// FINDING THE SURFACES. By content, never by data-section-id: Squarespace
// issues a new id every time a section is rebuilt in the editor, so the ids in
// any brief are a snapshot, not a hook. The testimonial section is the one
// holding ul.user-items-list-item-container (the same simple-list the rotator
// drives). The quote band is the section directly above it, and only if it is
// actually dark. The CTA is the section whose button says "let's talk". The
// footer is whatever sections <footer> holds — the same section on every page,
// which is why this add-on is not homepage-gated. Anything not found is passed
// over in silence; a missing surface is a surface without texture, not a
// broken page.
//
// Progressive enhancement in the plainest sense: with no JS the four surfaces
// are the flat cream, dark green, red and slate Squarespace renders anyway.
// Nothing here reveals content, moves anything, or changes a single box.
//
// REGENERATING THE TILE. Seeded, so the output is byte-identical run to run
// (verified: two runs, same sha256). 160x160, 8-bit greyscale+alpha, filter 0
// on every row, 6067 bytes. The grey byte of a transparent pixel is pinned to
// zero on purpose — it makes the empty ground one long run of 00 00 pairs and
// is most of the reason this deflates to 6KB instead of 50. Per-pixel flecks
// with no spatial correlation are seamless by construction: there is nothing
// for the tile edge to interrupt.
//
//   python3 - <<'EOF'
//   import zlib, struct, random
//   W = H = 160
//   rng = random.Random(0x7A20)
//   raw = bytearray()
//   for y in range(H):
//       raw += b'\0'
//       for x in range(W):
//           if rng.random() < 0.14:
//               raw += bytes((0 if rng.random() < 0.5 else 255, rng.randrange(5, 15)))
//           else:
//               raw += b'\0\0'
//   ch = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
//   open('assets/grain.png', 'wb').write(b'\x89PNG\r\n\x1a\n'
//       + ch(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 4, 0, 0, 0))
//       + ch(b'IDAT', zlib.compress(bytes(raw), 9)) + ch(b'IEND', b''))
//   EOF

import { defineAddon, css } from '../lib/util.js';

// Sized off the module's own URL so it resolves wherever this is hosted, and
// versioned for the same reason the masks and photographs are: GitHub Pages
// caches every file independently for ten minutes, so a regenerated tile can
// otherwise be served against fresh JS. The value is owned by
// scripts/release.sh, which rewrites `const V` across addons/ on every deploy.
const V = '2.56.1';
const TILE = `${new URL('../assets/grain.png', import.meta.url).href}?v=${V}`;

// Drawn at one fleck per CSS pixel. On a retina screen that upsamples 2x with
// bilinear smoothing, which gives a softer, slightly wider tooth at a lower
// peak — right for a phone, where the eye is closer. It is deliberately not
// image-rendering: pixelated; crisp 2x2 squares read as digital noise.
const TILE_PX = 160;

// Relative luminance below which a surface is dark paper and takes the light
// flecks (screen) rather than the ink ones (multiply). Measured on the live
// page: cream 0.83, teal 0.43, red 0.19, dark green 0.03. Every surface this
// add-on touches is a long way from the line.
const DARK_BELOW = 0.5;

defineAddon('grain', () => {
  css('grain', `
    /* The host is already position:absolute — it is Squarespace's own
       .section-background. Boot CHECKS that rather than setting it: forcing a
       position onto a Squarespace element is how layouts break, and an
       unpositioned host would hand this ::after to the nearest positioned
       ancestor and let it wander outside the section. Inset 0 inside an
       already-absolute parent adds no layout and cannot cause overflow, so
       there is nothing here for a phone to regress on. */
    .taro-grain::after {
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

  // Button labels, flattened for comparison: case, curly apostrophes and
  // punctuation all vary between what is typed in the editor and what the
  // theme renders. "READY? LET'S TALK" and "Ready, let’s talk!" both land on
  // "ready lets talk".
  const words = (s) => (s || '')
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  // getComputedStyle's rgb()/rgba() as relative luminance. Null for anything
  // unreadable, and null for a colour too transparent to be the colour the eye
  // sees there, so the caller can keep walking up. Both the legacy comma form
  // and the modern `rgb(r g b / a)` space form are accepted — Chrome has
  // returned each of them from getComputedStyle at different times.
  const luminance = (color) => {
    const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/
      .exec(color || '');
    if (!m) return null;
    if (m[4] !== undefined) {
      const a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      // Half-transparent over something unknown is a colour we cannot claim to
      // know. Keep walking rather than guess and pick the wrong blend mode.
      if (!(a >= 0.5)) return null;
    }
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * lin(+m[1]) + 0.7152 * lin(+m[2]) + 0.0722 * lin(+m[3]);
  };

  // The colour a visitor actually sees behind an element. Squarespace paints a
  // section's fill on .section-background most of the time, but not always —
  // the footer's own background reads as transparent on this site and the dark
  // comes from further up — so this walks ancestors to the first opaque colour
  // it can read, and gives up rather than assume. Boot-time only.
  const backdrop = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const lum = luminance(getComputedStyle(n).backgroundColor);
      if (lum !== null) return lum;
    }
    return null;
  };

  // The section's own paint layer, if it is flat colour. Null means "not paper"
  // — a picture, a gradient, a host we must not position, or a section built
  // some other way entirely. Every null here is a silent pass.
  const surfaceOf = (sec) => {
    if (!sec || sec.classList.contains('has-background')) return null;
    const bg = sec.querySelector('.section-border > .section-background')
            || sec.querySelector('.section-background');
    // Sections do not nest today, but a descendant selector would follow them
    // into one if they ever did, and grain would land in the wrong box.
    if (!bg || bg.closest('section[data-section-id]') !== sec) return null;
    if (bg.classList.contains('taro-grain')) return null;
    // The flat fill IS the photograph: leave it alone. This is the check that
    // keeps the dune and deadvlei sections, and every video background, clean.
    if (bg.querySelector('img, picture, video, iframe, canvas, svg')) return null;
    const cs = getComputedStyle(bg);
    if (cs.backgroundImage !== 'none') return null;   // a gradient is not flat colour
    if (cs.position === 'static') return null;
    return bg;
  };

  // Attach, choosing the blend mode from the colour underneath. requireDark
  // exists for the quote band, which is identified partly by being dark — see
  // its call site. Returns nothing; every failure is silent by design.
  const paper = (sec, requireDark) => {
    const bg = surfaceOf(sec);
    if (!bg) return;
    const lum = backdrop(bg);
    if (lum === null) return;          // unreadable colour: no texture beats wrong texture
    const dark = lum < DARK_BELOW;
    if (requireDark && !dark) return;
    bg.classList.add('taro-grain');
    if (dark) bg.setAttribute('data-taro-grain', 'dark');
  };

  // The page's own sections, in document order, footer excluded (it is handled
  // separately below, and it is the one part of this that is not homepage
  // content). Zero-height entries are Squarespace's hidden breakpoint
  // duplicates; they are dropped because "the section directly above the
  // testimonials" has to mean the one a visitor sees, not a display:none twin
  // sitting between them. offsetHeight is read here, at boot, and never again.
  const sections = [...document.querySelectorAll('section[data-section-id]')]
    .filter((s) => !s.closest('footer'))
    .filter((s) => s.offsetHeight > 0);

  // 1. TESTIMONIALS — cream. Found through the list itself rather than by
  //    looking for a cream section, because cream is a theme choice and the
  //    list is the content.
  //    All of them, not the first: a simple list in the footer would otherwise
  //    claim the anchor and the real one would never be looked at.
  const testimonials = [...document.querySelectorAll('ul.user-items-list-item-container')]
    .map((ul) => ul.closest('section[data-section-id]'))
    .find((s) => s && !s.closest('footer')) || null;
  paper(testimonials);

  // 2. THE QUOTE BAND — dark, directly above the testimonials. There is no
  //    class or copy that reliably names it, so its position is the anchor and
  //    its darkness is the confirmation: if the page is ever rebuilt so the
  //    section above the testimonials is something else, this quietly does
  //    nothing rather than texture a band nobody asked for. Note that requiring
  //    "dark" would still accept the teal tiles if the quote band were deleted
  //    outright — teal is below the line — and that is deliberate: teal is flat
  //    paper too, and the grain would still land under the tile photographs
  //    rather than on them.
  const bandIndex = testimonials ? sections.indexOf(testimonials) - 1 : -1;
  if (bandIndex >= 0) paper(sections[bandIndex], true);

  // 3. THE FINAL CALL TO ACTION — red. Anchored on the button's label, which is
  //    the one thing about that section a visitor could describe. Matching
  //    "lets talk" rather than the full "ready lets talk" so the section
  //    survives the copy being shortened; matching against buttons only, so a
  //    paragraph that happens to contain the phrase cannot claim it.
  const after = testimonials ? sections.slice(sections.indexOf(testimonials) + 1) : sections;
  const hasTalkButton = (s) => [...s.querySelectorAll('.sqs-block-button-element')]
    .some((b) => words(b.textContent).includes('lets talk'));
  //    Fallback if the copy changes past recognition: the last section on the
  //    page carrying a button. On a page that ends in a call to action — which
  //    is every page here — that is the call to action by construction.
  const withButton = after.filter((s) => s.querySelector('.sqs-block-button-element'));
  const cta = after.filter(hasTalkButton).pop() || withButton.pop();
  paper(cta);

  // 4. THE FOOTER — every flat section it holds (one today, and the same one on
  //    every page, which is why this add-on does not gate on pathname). The
  //    footer's fill reads as transparent here, so the blend mode is decided by
  //    the walk up to whatever paints the dark behind it; see the note at the
  //    top for why screen lands in the right place even if that colour turns
  //    out to live outside the pseudo-element's blending group.
  const footer = document.querySelector('footer');
  if (footer) footer.querySelectorAll('section[data-section-id]').forEach((s) => paper(s));
});
