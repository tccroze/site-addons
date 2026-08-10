# assets

Images served straight from GitHub Pages rather than through Squarespace.

Squarespace caps its image CDN at 2500px on the long edge, and the Spitzkoppe
panorama was uploaded at 2048x552, so the intro was upscaling it about 1.9x on a
retina display. Anything in here bypasses that: the file is served at whatever
resolution it was committed at.

Drop the full-resolution original in as `spitzkoppe.jpg`. Smaller variants for
narrow screens are generated from it and committed alongside, so phones don't
pull the full file — see `addons/masked-intro.js` for the srcset that picks
between them.
