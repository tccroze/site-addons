# assets

Images served straight from GitHub Pages rather than through Squarespace.

Squarespace's image CDN caps out at 2500px on the long edge, and the Spitzkoppe
panorama had been uploaded there at only 2048x552, so the intro was upscaling it
about 1.9x on a retina display. Serving it from here removes that ceiling.

## Spitzkoppe

`IMG_4184.jpg` is the full-resolution original: 13982x3770, 28MB. It is **not**
committed — see `.gitignore`. Keep your own copy; nothing here regenerates it.

The three committed variants come from it:

```bash
cd assets
for w in 1600 2600 4000; do
  sips -s format jpeg -s formatOptions 78 -Z $w IMG_4184.jpg --out spitzkoppe-$w.jpg
done
```

| file | pixels | weight |
|---|---|---|
| `spitzkoppe-1600.jpg` | 1600x431 | 216 KB |
| `spitzkoppe-2600.jpg` | 2600x701 | 605 KB |
| `spitzkoppe-4000.jpg` | 4000x1078 | 1.4 MB |

`addons/masked-intro.js` offers all three as a `srcset` and lets the browser
choose. Its `sizes` deliberately overstates the element width, because
`object-fit: cover` scales the picture up well past the box it sits in and the
browser would otherwise settle on a size too small.

## Replacing the photograph

The skyline the wordmark sinks behind is a trace of *this* frame, baked into
`addons/masked-intro.js` as `RIDGE`. A differently cropped photograph needs a
new trace, or the mask will not follow the rock. The current trace was taken
from the 13982px original and agrees with the previous one to 0.16% of image
height on average — the crop did not change, only the resolution.
