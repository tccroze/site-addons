// Copy this file to start a new add-on, then add its import to main.js.
// The leading underscore keeps it out of the way — it is never imported.

import { defineAddon, css } from '../lib/util.js';

defineAddon('my-addon', () => {
  // Styles specific to this add-on live here, so deleting the add-on's import
  // line from main.js removes its CSS too.
  css('my-addon', `
    /* .my-thing { ... } */
  `);

  // Squarespace 7.1 renders sections server-side, so the DOM is ready by the
  // time this runs. Guard your selectors anyway — pages differ.
  const targets = document.querySelectorAll('.some-selector');
  if (!targets.length) return;

  targets.forEach((el) => {
    // ...
  });
});
