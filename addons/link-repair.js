// Send dead internal links somewhere real.
//
// The homepage's three calls to action — "LET'S TELL YOURS" twice and
// "READY? LET'S TALK" — all point at /contact, and /contact returns 404. Those
// are the buttons the whole homepage builds toward: anyone who reads it, is
// persuaded by it, and clicks lands on an error page. Checked across every
// internal link on the site, /contact is the only broken destination, and the
// only pages carrying it are those buttons.
//
// The right fix is in the editor — the buttons should point at /letstalk. This
// is the stopgap that stops it costing enquiries in the meantime, and it does
// no harm once the buttons are corrected: the rewrite simply stops matching.
//
// Only same-site paths are touched, only ones listed here, and the visible text
// of a link is never altered — a button that says "Let's talk" is already
// saying the right thing, it was only pointed at the wrong door.

import { defineAddon, log } from '../lib/util.js';

// dead path -> where it should have gone
const REDIRECTS = {
  '/contact': '/letstalk',
};

defineAddon('link-repair', () => {
  const fix = () => {
    let n = 0;
    Object.entries(REDIRECTS).forEach(([from, to]) => {
      // Match the path exactly, with or without a trailing slash, and leave any
      // query or fragment the author wrote in place.
      document.querySelectorAll(`a[href^="${from}"]`).forEach((a) => {
        const href = a.getAttribute('href') || '';
        const rest = href.slice(from.length);
        if (rest && !/^[/?#]/.test(rest)) return;      // /contacts, not /contact
        a.setAttribute('href', to + (rest === '/' ? '' : rest));
        a.dataset.taroRepaired = from;
        n += 1;
      });
    });
    return n;
  };

  const first = fix();
  if (first) log(`link-repair: ${first} dead link${first === 1 ? '' : 's'} rerouted`);

  // Buttons can arrive late — Squarespace renders several block types after
  // this runs — so the page is watched rather than swept once.
  const mo = new MutationObserver(() => fix());
  mo.observe(document.body, { childList: true, subtree: true });
});
