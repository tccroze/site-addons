// Entry point for all tarocroze.com add-ons.
// Loaded by a single <script type="module"> tag in Squarespace's header injection.
//
// To add an add-on: drop a file in addons/ and add one import line below.
// To remove one: delete the import line. That's the whole workflow.

import { log } from './lib/util.js';

// Imported first on purpose: each module is a separate network fetch, so the
// hero's starting state lands sooner the earlier this appears.
import './addons/hero-reveal.js?v=2.43.10';

import './addons/gallery-hover.js?v=2.43.10';
import './addons/gallery-filter.js?v=2.43.10';
import './addons/cursor.js?v=2.43.10';
import './addons/page-transition.js?v=2.43.10';
import './addons/signature.js?v=2.43.10';
import './addons/nav-ink.js?v=2.43.10';
import './addons/cursor-view.js?v=2.43.10';
import './addons/edge-print.js?v=2.43.10';
import './addons/menu-paper.js?v=2.43.10';

// Homepage only
import './addons/masked-intro.js?v=2.43.10';
import './addons/dune-reveal.js?v=2.43.10';
import './addons/scroll-reveal.js?v=2.43.10';
import './addons/testimonial-rotator.js?v=2.43.10';
import './addons/parallax.js?v=2.43.10';
import './addons/film-strip.js?v=2.43.10';
import './addons/grain.js?v=2.43.10';
import './addons/dividers.js?v=2.43.10';
import './addons/edge-mark.js?v=2.43.10';

// Motion page
import './addons/video-focus.js?v=2.43.10';
import './addons/motion-reel.js?v=2.43.10';

// Venues page
import './addons/venue-hero.js?v=2.43.10';

// The Croze Line
import './addons/croze-timeline.js?v=2.43.10';
import './addons/header-clearance.js?v=2.43.10';
import './addons/mobile-polish.js?v=2.43.10';

// Cache busting: GitHub Pages caches every file for ten minutes independently,
// so a visitor can pair a fresh main.js with an add-on from before the deploy.
// That is not theoretical — it cost hours tonight, and produced a "fix" that
// looked broken because half of it was live. The ?v= on each import is rewritten
// to this version on release, so a new release can never be served in halves.
//
// Bump this on every deploy. Check the browser console on the live site to
// confirm which version is actually being served (see README: "Did it deploy?").
export const VERSION = '2.43.10';

log(`ready — v${VERSION}`);
