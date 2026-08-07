// Shared helpers. Kept deliberately small — add to this only when a second
// add-on needs the same thing.

const PREFIX = '[taro]';

export function log(...args) {
  console.log(`%c${PREFIX}`, 'color:#888', ...args);
}

export function warn(...args) {
  console.warn(PREFIX, ...args);
}

/** Run fn once the DOM is parsed. Safe to call at any point. */
export function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

/**
 * Inject an add-on's own CSS. Keeping styles next to the add-on that uses them
 * means deleting the add-on's import line removes its styles too.
 */
export function css(name, text) {
  const id = `taro-css-${name}`;
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = text;
  document.head.appendChild(el);
}

/**
 * Register an add-on. Wraps init in a try/catch so one broken add-on can't
 * take down the rest of the page — important when this runs on a live site.
 */
export function defineAddon(name, init) {
  ready(() => {
    try {
      init();
      log(`✓ ${name}`);
    } catch (err) {
      warn(`✗ ${name} failed:`, err);
    }
  });
}
