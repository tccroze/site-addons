// Entry point for all tarocroze.com add-ons.
// Loaded by a single <script type="module"> tag in Squarespace's header injection.
//
// To add an add-on: drop a file in addons/ and add one import line below.
// To remove one: delete the import line. That's the whole workflow.

import { log } from './lib/util.js';

// Imported first on purpose: each module is a separate network fetch, so the
// hero's starting state lands sooner the earlier this appears.
import './addons/hero-reveal.js?v=2.39.3';

import './addons/gallery-hover.js?v=2.39.3';
import './addons/gallery-filter.js?v=2.39.3';
import './addons/cursor.js?v=2.39.3';
import './addons/page-transition.js?v=2.39.3';
import './addons/signature.js?v=2.39.3';

// Homepage only
import './addons/masked-intro.js?v=2.39.3';
import './addons/dune-reveal.js?v=2.39.3';
import './addons/scroll-reveal.js?v=2.39.3';
import './addons/testimonial-rotator.js?v=2.39.3';
import './addons/parallax.js?v=2.39.3';

// Cache busting: GitHub Pages caches every file for ten minutes independently,
// so a visitor can pair a fresh main.js with an add-on from before the deploy.
// That is not theoretical — it cost hours tonight, and produced a "fix" that
// looked broken because half of it was live. The ?v= on each import is rewritten
// to this version on release, so a new release can never be served in halves.
//
// Bump this on every deploy. Check the browser console on the live site to
// confirm which version is actually being served (see README: "Did it deploy?").
export const VERSION = '2.39.3';

log(`ready — v${VERSION}`);
