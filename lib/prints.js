// Gallery photographs that are also sold as prints.
//
// Nothing in the markup connects the two: the shop names its files for the work
// (warning.jpg, deadvlei.jpg) and the galleries name theirs by the camera
// (9S0A9692.jpg, IMG_6080.JPG), so no string comparison finds them. These pairs
// were established by hashing every gallery frame against every print and then
// confirming each one by eye — the prints are black-and-white conversions of
// colour originals, which is why they read as only loosely similar to a machine
// and obviously identical to a person.
//
// Keyed on the gallery filename rather than a frame's position, so reordering a
// gallery or adding to it cannot quietly point a photograph at the wrong print.
//
// Read by lightbox-frame.js (the buy link) and contact-sheet.js (the chinagraph
// ring), so a new pairing is added once, here.

export const PRINTS = {
  '9S0A9692.jpg':   { href: '/shop/p/warning',   title: 'The Warning' },
  'IMG_6082.jpg':   { href: '/shop/p/cover',     title: 'Under Cover' },
  'IMG_9412-2.jpg': { href: '/shop/p/territory', title: 'Territory' },
  'IMG_6088.JPG':   { href: '/shop/p/deadvlei',  title: 'Deadvlei' },
  'IMG_6080.JPG':   { href: '/shop/p/dune',      title: 'Dune' },
  'IMG_6103.JPG':   { href: '/shop/p/luderitz',  title: 'Luderitz' },
};

/** The asset a picture is, independent of the size it was served at. */
export const assetOf = (img) => {
  if (!img) return null;
  const url = img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || '';
  return url.split('?')[0].split('/').pop() || null;
};
