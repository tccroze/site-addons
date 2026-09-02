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

// Image cards that link somewhere but say nothing.
//
// /venues is five photographs linking to five venue pages, and not one of them
// carries a single character a screen reader can announce — no link text, no
// aria-label, and no alt on the image. /stills is the same shape; where its
// cards do have alt text it is the machine-written description the owner has
// said is inaccurate, so "Wildlife" is announced as "A jaguar perched on a tree
// branch in a jungle setting". Either way, the two pages that route to
// everything else on the site are unnavigable without sight of them.
//
// Each name below was read from that page's own heading rather than invented,
// then set in title case: an aria-label is spoken, and screen readers spell out
// strings that arrive in capitals.

// dead path -> where it should have gone
const REDIRECTS = {
  '/contact': '/letstalk',
};

// Links that go nowhere and should not pretend to.
//
// Three photographs on /thecrozeline — HC Snr.jpg, a scanned page, IMG_6810.jpg
// — are wired to /shop/arrangement, /shop/bouquet and /get-in-touch. All three
// return 404. They are the demo links that came with the image blocks from a
// Squarespace template, never changed after the owner's own family pictures
// were dropped in, so clicking a family photograph on the family history page
// lands on an error.
//
// There is no correct destination to guess at here: they are illustrations in a
// story, not navigation. So the link is removed and the photograph stays a
// photograph. If any of them should lead somewhere, that is a decision for the
// editor, and one line below stops overriding it once the href changes.
const DEAD = ['/shop/arrangement', '/shop/bouquet', '/get-in-touch'];

const CARD_NAMES = {
  '/la-stradina': 'La Stradina',
  '/lecafegourmand': 'Le Cafe Gourmand',
  '/cafechoubidou': 'Cafe Choubidou',
  '/themilkmansdaughter': "The Milkman's Daughter",
  '/yellowandbutter': 'Yellow and Butter',
  '/wildlife': 'Wildlife',
  '/35film': 'Film',
  '/vroom': 'Automotive',
  '/panoramas': 'Panoramas',
  '/portraits': 'People',
  '/astro': 'Astro',
  '/spaces': 'Spaces',
  // The eighth tile on /stills, and the only one that was never named:
  // it sits apart from the grid at the foot of the page, which is how it
  // came to be missed when this list was built from the grid links.
  '/pacific-air-show': 'Pacific Air Show',
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

  /* An aria-label wins over the image's alt for a link's accessible name, so
   * this both names the unnamed cards and replaces the inaccurate descriptions
   * on the ones that have them. The alt attribute is left alone: it describes
   * the picture, which is a different job. */
  const nameCards = () => {
    let n = 0;
    document.querySelectorAll('a.sqs-block-image-link[href]').forEach((a) => {
      const key = (a.getAttribute('href') || '').replace(/\/$/, '');
      const name = CARD_NAMES[key];
      if (!name) return;
      if (a.getAttribute('aria-label') === name) return;
      if ((a.textContent || '').trim()) return;    // it speaks for itself
      a.setAttribute('aria-label', name);
      n += 1;
    });
    return n;
  };

  /* A photograph that goes nowhere is better than one that goes to a 404. */
  const defuse = () => {
    let n = 0;
    DEAD.forEach((path) => {
      document.querySelectorAll(`a[href="${path}"], a[href="${path}/"]`).forEach((a) => {
        a.removeAttribute('href');
        a.removeAttribute('target');
        a.setAttribute('tabindex', '-1');
        a.dataset.taroDead = path;
        a.style.cursor = 'default';
        n += 1;
      });
    });
    return n;
  };
  const dead = defuse();
  if (dead) log(`link-repair: ${dead} dead link${dead === 1 ? '' : 's'} defused`);

  const named = nameCards();
  if (named) log(`link-repair: ${named} card${named === 1 ? '' : 's'} named`);

  const first = fix();
  if (first) log(`link-repair: ${first} dead link${first === 1 ? '' : 's'} rerouted`);

  // Buttons can arrive late — Squarespace renders several block types after
  // this runs — so the page is watched rather than swept once.
  const mo = new MutationObserver(() => { fix(); nameCards(); defuse(); });
  mo.observe(document.body, { childList: true, subtree: true });
});
