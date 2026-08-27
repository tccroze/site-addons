// Don't stream eight films to someone who has tapped none of them.
//
// /motion carries six video blocks. Squarespace builds a player for every one
// at load and each starts filling its buffer immediately: measured on a phone,
// 269MB across 347 requests, 349 seconds of 1080p buffered between eight
// players of which two were on screen — before a single tap. Nothing autoplays.
// All of it is speculative.
//
// The players expose no engine handle, so they cannot be throttled after the
// fact. They can be stopped from existing: the config Squarespace reads lives
// in data-config-video on each .sqs-native-video, and without it no player is
// built. Removing it takes the page to 43MB and one player.
//
// It is put back when a film is actually wanted. The rebuild is
//
//     Y.use('squarespace-native-video-loader', () =>
//       Y.one(node).plug(Y.Squarespace.NativeVideoLoader, { isVisitorWebsite: true }))
//
// which was arrived at by testing three candidates against the live page:
// initializeNativeVideo() and initializeWebsiteComponent() both returned
// cleanly and built nothing — the first because its own selector excludes these
// blocks (they are .sqs-block-website-component, which it filters out by name),
// the second because it walks website components generically and does not reach
// the video loader. Plugging the loader directly is what actually produces a
// player.
//
// WHAT THE VISITOR SEES IS UNCHANGED. Each block already carries a poster in
// data-config-thumbnail — the same frame Squarespace's own player shows before
// you press play — so the deferred block renders that image at the same aspect
// ratio inside the same .native-video-player box the player would have used.
// The page looks identical; it simply is not downloading anything.
//
// TIMING. The strip has to happen before Squarespace initialises, so it runs at
// module evaluation — this file's top level, not inside defineAddon, which
// waits for DOMContentLoaded. A MutationObserver keeps stripping anything added
// afterwards.
//
// IF THE REBUILD EVER FAILS the visitor must still be able to watch the film,
// and that matters more than the saving. So a block that does not produce a
// video within REBUILD_GRACE sets a flag and reloads the page once; on that
// load this file defers nothing and the films are built normally, exactly as
// they are today. The flag is per-tab and one-shot, so it cannot loop.

import { defineAddon, css, warn } from '../lib/util.js';

const EAGER_KEY = 'taro-video-eager';
// Generous: plugging the loader took about seven seconds to produce a player
// when it was timed against the live page, and a grace period shorter than the
// real thing turns every successful rebuild into a reload.
const REBUILD_GRACE = 14000;
const POSTER_W = 1000;

// Blocks that were stripped, and the config to give back.
const deferred = new Map();   // .sqs-native-video -> config JSON string

// Blocks the visitor has asked for. The observer below must leave these alone:
// it is watching for data-config-video appearing on a .sqs-native-video, and
// handing the config back is exactly that. Without this guard the observer
// stripped the config again microseconds after the tap restored it, the loader
// found nothing to build, and every tap ended in the reload fallback — which
// is how this was found: the films played, but only ever after a page reload.
const released = new WeakSet();

const eager = (() => {
  try { return sessionStorage.getItem(EAGER_KEY) === '1'; } catch (e) { return false; }
})();

/* ---- the strip, at module evaluation ---------------------------------- */
if (!eager) {
  const strip = (node) => {
    if (released.has(node)) return;
    const cfg = node.getAttribute('data-config-video');
    if (!cfg) return;
    deferred.set(node, cfg);
    node.removeAttribute('data-config-video');
  };
  const sweep = () => {
    document.querySelectorAll('.sqs-native-video[data-config-video]').forEach(strip);
  };
  const begin = () => {
    try {
      new MutationObserver(sweep).observe(document.documentElement, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ['data-config-video'],
      });
    } catch (e) { warn('video-defer: observer failed', e); }
    sweep();
  };
  if (document.documentElement) begin();
  else document.addEventListener('readystatechange', begin, { once: true });
  document.addEventListener('DOMContentLoaded', sweep);
}

/* ---- the poster, and putting it back ---------------------------------- */
defineAddon('video-defer', () => {
  if (eager) {
    try { sessionStorage.removeItem(EAGER_KEY); } catch (e) { /* fine */ }
    return;
  }
  if (!deferred.size) return;

  css('video-defer', `
    .taro-vd {
      position: absolute; inset: 0;
      display: block; width: 100%; height: 100%;
      padding: 0; border: 0;
      background: #14120e center/cover no-repeat;
      cursor: pointer;
      overflow: hidden;
    }
    .taro-vd__play {
      position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 64px; height: 64px;
      display: grid; place-items: center;
      border-radius: 50%;
      background: rgba(20, 18, 14, 0.55);
      box-shadow: 0 0 0 1px rgba(246, 238, 213, 0.55);
      transition: background 200ms ease, transform 200ms cubic-bezier(0.33, 1, 0.68, 1);
    }
    .taro-vd__play::after {
      content: '';
      margin-left: 4px;
      border-style: solid;
      border-width: 11px 0 11px 18px;
      border-color: transparent transparent transparent #f6eed5;
    }
    @media (hover: hover) {
      .taro-vd:hover .taro-vd__play { background: rgba(226, 51, 24, 0.85); transform: translate(-50%, -50%) scale(1.06); }
    }
    .taro-vd:focus-visible { outline: 2px solid #e23318; outline-offset: -4px; }
    .taro-vd[hidden] { display: none; }
    /* The box the player would have filled already carries the aspect ratio. */
    .sqs-native-video .native-video-player { position: relative; }
    @media (prefers-reduced-motion: reduce) {
      .taro-vd__play { transition: none; }
    }
  `);

  /** The poster frame Squarespace already stores for this block. */
  const posterOf = (node) => {
    try {
      const t = JSON.parse(node.getAttribute('data-config-thumbnail') || '{}');
      if (!t.assetUrl) return null;
      return `${t.assetUrl}${t.assetUrl.includes('?') ? '&' : '?'}format=${POSTER_W}w`;
    } catch (e) { return null; }
  };

  /** Hand the block its config back and ask Squarespace to build the player. */
  const rebuild = (node, cover) => {
    const cfg = deferred.get(node);
    if (!cfg) return;
    released.add(node);            // before the attribute, or the observer wins
    node.setAttribute('data-config-video', cfg);
    deferred.delete(node);

    // Only YUI itself is checked here. NativeVideoLoader is precisely what
    // Y.use() is being asked to fetch, so testing for it first would fail on
    // every cold page and send everyone down the reload path.
    const Y = window.Y;
    if (!Y || typeof Y.use !== 'function') { bail(); return; }

    try {
      Y.use('squarespace-native-video-loader', () => {
        try {
          Y.one(node).plug(Y.Squarespace.NativeVideoLoader, { isVisitorWebsite: true });
        } catch (e) { warn('video-defer: plug failed', e); }
      });
    } catch (e) { warn('video-defer: use failed', e); bail(); return; }

    // Whatever happens, the visitor gets to watch the film.
    const started = Date.now();
    const watch = setInterval(() => {
      const v = node.querySelector('video');
      if (v) {
        clearInterval(watch);
        cover.remove();
        // Muted state is left as Squarespace set it. Forcing sound on would
        // guarantee the play() below is rejected — this runs from a timer, so
        // the visitor's tap is no longer the current gesture — and a rejected
        // play leaves them looking at a player that ignored them. If the
        // browser declines anyway, the controls are right there.
        v.play?.().catch(() => { /* a player with controls is enough */ });
        return;
      }
      if (Date.now() - started > REBUILD_GRACE) { clearInterval(watch); bail(); }
    }, 250);

    function bail() {
      try { sessionStorage.setItem(EAGER_KEY, '1'); } catch (e) { /* then it just reloads */ }
      location.reload();
    }
  };

  deferred.forEach((cfg, node) => {
    const box = node.querySelector('.native-video-player') || node;
    const cover = document.createElement('button');
    cover.type = 'button';
    cover.className = 'taro-vd';
    cover.setAttribute('aria-label', 'Play film');
    const poster = posterOf(node);
    if (poster) cover.style.backgroundImage = `url("${poster}")`;
    cover.innerHTML = '<span class="taro-vd__play" aria-hidden="true"></span>';
    cover.addEventListener('click', () => {
      cover.disabled = true;
      rebuild(node, cover);
    }, { once: true });
    box.appendChild(cover);
  });
});
