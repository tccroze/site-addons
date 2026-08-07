// Entry point for all tarocroze.com add-ons.
// Loaded by a single <script type="module"> tag in Squarespace's header injection.
//
// To add an add-on: drop a file in addons/ and add one import line below.
// To remove one: delete the import line. That's the whole workflow.

import { log } from './lib/util.js';

import './addons/scroll-progress.js';
import './addons/gallery-hover.js';
import './addons/gallery-filter.js';

// Bump this on every deploy. Check the browser console on the live site to
// confirm which version is actually being served (see README: "Did it deploy?").
export const VERSION = '1.3.1';

log(`ready — v${VERSION}`);
