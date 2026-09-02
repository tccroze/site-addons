// Entry point for all tarocroze.com add-ons.
// Loaded by a single <script type="module"> tag in Squarespace's header injection.
//
// To add an add-on: drop a file in addons/ and add one import line below.
// To remove one: delete the import line. That's the whole workflow.

import { log } from './lib/util.js';

// Imported first on purpose: each module is a separate network fetch, so the
// hero's starting state lands sooner the earlier this appears.
import './addons/hero-reveal.js?v=2.70.2';

import './addons/gallery-hover.js?v=2.70.2';
import './addons/gallery-filter.js?v=2.70.2';
import './addons/cursor.js?v=2.70.2';
import './addons/page-transition.js?v=2.70.2';
import './addons/signature.js?v=2.70.2';
import './addons/nav-ink.js?v=2.70.2';
import './addons/cursor-view.js?v=2.70.2';
import './addons/edge-print.js?v=2.70.2';
import './addons/menu-paper.js?v=2.70.2';

// Homepage only
import './addons/masked-intro.js?v=2.70.2';
import './addons/dune-reveal.js?v=2.70.2';
import './addons/scroll-reveal.js?v=2.70.2';
import './addons/testimonial-rotator.js?v=2.70.2';
import './addons/parallax.js?v=2.70.2';
import './addons/film-strip.js?v=2.70.2';
import './addons/grain.js?v=2.70.2';
import './addons/dividers.js?v=2.70.2';
import './addons/edge-mark.js?v=2.70.2';

// Motion page
import './addons/video-focus.js?v=2.70.2';
import './addons/motion-reel.js?v=2.70.2';

// Venues page
import './addons/venue-hero.js?v=2.70.2';

// The Croze Line
import './addons/croze-timeline.js?v=2.70.2';
import './addons/header-clearance.js?v=2.70.2';
import './addons/mobile-polish.js?v=2.70.2';
import './addons/video-defer.js?v=2.70.2';
import './addons/letstalk.js?v=2.70.2';
import './addons/gallery-frame.js?v=2.70.2';
import './addons/lightbox-frame.js?v=2.70.2';
import './addons/link-repair.js?v=2.70.2';
import './addons/shop.js?v=2.70.2';
import './addons/wall-view.js?v=2.70.2';
import './addons/class-form.js?v=2.70.2';
import './addons/cursor-drift.js?v=2.70.2';
import './addons/contact-sheet.js?v=2.70.2';
import './addons/film-advance.js?v=2.70.2';
import './addons/paint.js?v=2.70.2';
import './addons/testimonials.js?v=2.70.2';

// Cache busting: GitHub Pages caches every file for ten minutes independently,
// so a visitor can pair a fresh main.js with an add-on from before the deploy.
// That is not theoretical — it cost hours tonight, and produced a "fix" that
// looked broken because half of it was live. The ?v= on each import is rewritten
// to this version on release, so a new release can never be served in halves.
//
// Bump this on every deploy. Check the browser console on the live site to
// confirm which version is actually being served (see README: "Did it deploy?").
export const VERSION = '2.70.2';

log(`ready — v${VERSION}`);
