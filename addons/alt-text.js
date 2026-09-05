// Alt text for the shop, where Squarespace left the filenames in.
//
// An <img> with no alt attribute makes Squarespace fall back to the file's own
// name, so twenty-four product images on /shop were describing themselves as
// "IMG_2712.PNG" and "b8ef5ec4-735b-4fb7-97d0-e103b6262433.jpg". A screen
// reader reads that aloud, character by character, and an image search engine
// gets nothing at all — on the one page that takes money. The rest of the site
// is in good shape: 418 of 537 images already carry real alt text, and the
// established galleries were written properly.
//
// Each line below was written from the photograph, not from its filename.
// The six print titles are the ones in lib/prints.js, matched to the gallery
// frames by perceptual hash and confirmed by eye.
//
// THIS IS HALF A FIX, DELIBERATELY. Alt text set here exists only once the
// module has run, which is fine for a screen reader — it reads the live DOM —
// and unreliable for the image indexing this is partly meant to earn. The same
// strings belong in Squarespace's own alt fields, and when they are there this
// file can go. It is a floor, not a ceiling: it stops the site announcing
// filenames to anyone using it today.

import { defineAddon, log } from '../lib/util.js';

const FRAMED = (title) => `${title}, framed in white and hung on a pale grey wall.`;

const ALT = {
  // The photographic prints, and each one's framed mock-up.
  'warning.jpg':   'The Warning — a leopard snarling from the fork of an acacia tree, in black and white.',
  'IMG_2712.PNG':  FRAMED('The Warning'),
  'cover.jpg':     'Under Cover — a leopard lying in grass behind cactus spines, watching the camera, in black and white.',
  'IMG_2710.PNG':  FRAMED('Under Cover'),
  'territory.jpg': 'Territory — a leopard on a rock at sunset, the sun breaking through cloud behind it, in black and white.',
  'IMG_2711.PNG':  FRAMED('Territory'),
  'deadvlei.jpg':  'Deadvlei — dead camelthorn trees on the white pan at Deadvlei, Namibia, against an orange dune and deep blue sky.',
  'IMG_2713.PNG':  FRAMED('Deadvlei'),
  'dune.jpg':      'Dune — two figures walking the ridge of a red sand dune in Namibia under a deep blue sky.',
  'IMG_2708.PNG':  FRAMED('Dune'),
  'luderitz.jpg':  'Luderitz — two figures standing on an abandoned steam locomotive in the Namibian desert.',
  'IMG_2707.PNG':  FRAMED('Luderitz'),

  // The painted work.
  'IMG_5733.jpg': 'Watercolour portrait of a black-and-tan kelpie in a studded collar, against a blue wash.',
  'IMG_1503.jpg': 'Watercolour portrait of a brown-and-white hound looking up, against a grey wash.',
  'IMG_4602.jpg': 'Watercolour portrait of a golden dog sitting, with a soft cast shadow.',
  '8347B800-3521-4D5D-95F5-920105621028.jpg':
    'Watercolour portrait of Banjo, a brown-and-white Australian shepherd, against a blue wash.',
  'IMG_3590.jpg': 'Ink and watercolour painting of a black classic saloon with a red interior.',
  // Named as a 1950s saloon rather than by model: it looks like a Peugeot 203,
  // and a guess at a model is worse than a description that is certainly true.
  'IMG_4168.JPG': 'Ink drawing of a pale 1950s saloon car.',
  'IMG_6672.jpg': 'Watercolour painting of a green Land Rover Series with a cream canvas roof.',
  'IMG_8335.jpg': 'Watercolour of two koi turning through deep blue water.',
  '2F62BB34-4049-4ED6-9DC0-5E46A38DCBD7.jpg':
    'Painted portrait of a woman in blue and orange, her face split between warm and cool light.',
  'IMG_1872+2.jpg': 'Pen-and-ink lilies drawn over a red watercolour ground.',
  'b8ef5ec4-735b-4fb7-97d0-e103b6262433.jpg':
    'Four ink studies of leopards — stalking, lying, sitting and turning.',
  'IMG_6922.jpg': 'An open sketchbook — a black-and-white pattern on one page, an ink portrait over green, red and blue panels on the other.',
};

/** The file's own name, however Squarespace has encoded it into the URL. */
const assetOf = (img) => {
  const u = img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || '';
  const raw = u.split('?')[0].split('/').pop() || '';
  try { return decodeURIComponent(raw); } catch (e) { return raw; }
};

/** Squarespace's fallback: the alt IS the filename, give or take its case. */
const isFilename = (alt, file) =>
  !alt.trim() || alt.trim().toLowerCase() === file.trim().toLowerCase();

defineAddon('alt-text', () => {
  const dress = () => {
    let n = 0;
    document.querySelectorAll('img').forEach((img) => {
      if (img.dataset.taroAlt) return;
      const text = ALT[assetOf(img)];
      if (!text) return;
      // Never overwrite a description someone actually wrote. If these ever go
      // into Squarespace properly, this file quietly stops doing anything.
      const current = img.getAttribute('alt') || '';
      if (!isFilename(current, assetOf(img))) { img.dataset.taroAlt = 'kept'; return; }
      img.setAttribute('alt', text);
      img.dataset.taroAlt = '1';
      n += 1;
    });
    return n;
  };

  const first = dress();
  if (first) log(`alt-text: ${first} image${first === 1 ? '' : 's'} described`);
  // Commerce builds its grid, and the lightbox its slides, well after load.
  new MutationObserver(dress).observe(document.body, { childList: true, subtree: true });
});
