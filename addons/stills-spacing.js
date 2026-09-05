// The seam above RECENT WORK on /stills.
//
// Three paddings land on one boundary and add up. Measured at 1440px:
//
//   section 0 .content-wrapper  padding-bottom   95.04px
//   section 1 section           padding-top      72.00px
//   section 1 .content-wrapper  padding-top      47.52px
//                                               --------
//                                               214.56px
//
// That is the gap between the last gallery tile and the RECENT WORK heading.
// For scale, the tile rows inside the grid above sit 11px apart, and the
// heading sits 50px above its own two tiles — so the space above the heading
// was more than four times the space below it, and the section read as a hole
// in the page rather than as a break between two groups.
//
// Both sections are paying for the same seam. One of them should. The upper
// section's trailing padding is dropped and the lower one keeps its own, which
// leaves 119.52px: still an unmistakable break, and now about twice the gap
// under the heading rather than four times it.
//
// Found by walking up from the heading rather than by section index, because
// "the first section" is a description of today's page order. Adding a section
// above the tiles would silently move a hard-coded index onto the wrong seam;
// this way the rule follows the heading wherever it goes, and if the heading
// is ever renamed or removed the add-on does nothing at all.

import { defineAddon, log } from '../lib/util.js';

const HEADING = /recent work/i;

defineAddon('stills-spacing', () => {
  if (!/^\/stills\/?$/i.test(location.pathname)) return;

  const tighten = () => {
    const heading = [...document.querySelectorAll('h1, h2, h3, h4, p, div, span')]
      .find((el) => !el.children.length && HEADING.test((el.textContent || '').trim()));
    if (!heading) return false;

    const section = heading.closest('section[data-section-id]');
    if (!section) return false;

    // The section immediately above it in the flow, footer excluded.
    const sections = [...document.querySelectorAll('section[data-section-id]')]
      .filter((s) => !s.closest('footer'));
    const above = sections[sections.indexOf(section) - 1];
    if (!above) return false;

    const wrap = above.querySelector('.content-wrapper');
    if (!wrap || wrap.dataset.taroSeam) return false;

    wrap.dataset.taroSeam = '1';
    wrap.style.setProperty('padding-bottom', '0px', 'important');
    return true;
  };

  if (tighten()) log('stills-spacing: seam above RECENT WORK closed');
  // Squarespace builds these sections after DOMContentLoaded.
  else new MutationObserver((_m, obs) => { if (tighten()) obs.disconnect(); })
    .observe(document.body, { childList: true, subtree: true });
});
