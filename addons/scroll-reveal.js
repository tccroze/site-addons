// Scroll reveal for homepage headings, images and buttons.
//
// Squarespace's own animations are set to "none" site-wide, but it still tags
// the right elements with data-animation-role (headings, images, buttons). We
// drive off those hooks rather than inventing selectors.
//
// Text and buttons rise and fade. Photographs wipe open from the bottom —
// tried as a shared fade at one point, but a dissolve does nothing for a
// picture; the wipe is what makes the images feel revealed as you scroll.
//
// Progressive enhancement matters: the hidden state is scoped to a class this
// file puts on <html>, so if the script never loads nothing is ever hidden.

import { defineAddon, css } from '../lib/util.js';
// Declared locally rather than imported: see the note in lib/util.js about
// per-file cache skew breaking the module graph.
const LEAN = window.matchMedia('(hover: none)').matches;


// Slow enough to register as movement rather than a flicker. The earlier
// timings were quick enough that the reveal was over before it was noticed.
const TEXT_MS = 2300;
const IMAGE_MS = 1900;   // the wipe reads best a touch quicker than the text
const STAGGER_MS = 155;

defineAddon('scroll-reveal', () => {
  if (location.pathname !== '/') return;
  

  const sections = [...document.querySelectorAll('section[data-section-id]')];
  const hero = sections.find((s) => s.getBoundingClientRect().height > 0);

  const footer = document.querySelector('footer');
  const targets = [...document.querySelectorAll('[data-animation-role]')]
    .filter((el) => !hero || !hero.contains(el))        // hero has its own reveal
    .filter((el) => !footer || !footer.contains(el));   // signature has its own

  if (!targets.length) return;

  css('scroll-reveal', `
    /* --- text and buttons: rise and fade --- */
    /* No blur and no will-change on touch devices. A blur filter across a
       couple of dozen promoted layers is genuinely expensive on a phone, and
       bulk will-change pins memory for compositing that is not needed for a
       plain opacity/transform transition. */
    .taro-reveal-on [data-taro-reveal] {
      opacity: 0;
      /* Distance comes from a custom property, never from a second transform
         rule. A rule matching two attributes outranks the [="in"] reset that
         has one, so declaring transform twice left images stuck at their
         offset forever — which closed the gaps between the cards. */
      transform: translateY(var(--taro-travel, ${LEAN ? 22 : 30}px));
      ${LEAN ? '' : 'filter: blur(7px);'}
      transition: opacity ${TEXT_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms),
                  transform ${TEXT_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms)
                  ${LEAN ? '' : `, filter ${TEXT_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms)`};
    }

    /* Photographs wipe open from the bottom as they come into view, with a
       small rise underneath it. No blur and no fade — the wipe is the reveal,
       and it reads far better on a picture than a dissolve does.
       Only the distance goes in the custom property; transform stays declared
       once, above. clip-path has its own reset below at matching specificity,
       so it always clears — the trap that previously left images stuck. */
    .taro-reveal-on [data-taro-reveal][data-taro-kind="image"] {
      --taro-travel: ${LEAN ? 16 : 24}px;
      opacity: 1;
      filter: none;
      clip-path: inset(0 0 100% 0);
      transition: transform ${IMAGE_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms),
                  clip-path ${IMAGE_MS}ms cubic-bezier(0.16, 0.84, 0.3, 1) calc(var(--i, 0) * ${STAGGER_MS}ms);
    }
    .taro-reveal-on [data-taro-reveal="in"][data-taro-kind="image"] {
      clip-path: inset(0 0 0 0);
    }

    .taro-reveal-on [data-taro-reveal="in"] { opacity: 1; transform: none; filter: none; }

    @media (prefers-reduced-motion: reduce) {
      .taro-reveal-on [data-taro-reveal] {
        opacity: 1; transform: none; filter: none; clip-path: none; transition: none;
      }
    }
  `);

  // Stagger per section, so each behaves as its own sequence rather than one
  // long cascade down the whole page.
  sections.forEach((section) => {
    targets
      .filter((el) => section.contains(el))
      .forEach((el, i) => el.style.setProperty('--i', i));
  });

  // Anything already on screen when this runs is marked revealed immediately and
  // never enters the hidden state. An element the visitor can already see must
  // not be hidden in order to animate it — that is how the Venues, Stills and
  // Paint cards ended up invisible. Only content below the fold animates in.
  const startsVisible = (el) => {
    const r = el.getBoundingClientRect();
    return (r.width || r.height) && r.top < window.innerHeight && r.bottom > 0;
  };

  targets.forEach((el) => {
    if (el.getAttribute('data-animation-role') === 'image') {
      el.setAttribute('data-taro-kind', 'image');   // wipes open, see CSS
    }
    el.setAttribute('data-taro-reveal', startsVisible(el) ? 'in' : '');
  });
  document.documentElement.classList.add('taro-reveal-on');

  // Driven by scroll position rather than IntersectionObserver, deliberately.
  // The reveal hides images until triggered, so anything that stops the trigger
  // firing leaves a blank frame on a live page — and an observer has failure
  // modes that are invisible until they bite. A direct measurement against the
  // viewport cannot silently not-happen, and with a handful of elements the
  // cost of checking is nothing.
  let pending = targets.filter((el) => el.getAttribute('data-taro-reveal') !== 'in');
  let queued = false;

  const check = () => {
    queued = false;
    const limit = window.innerHeight * 0.9;   // trigger a little before the edge
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      // Squarespace ships hidden desktop/mobile duplicates; those have no box
      // and must stay pending in case a resize brings them into play.
      if (r.width === 0 && r.height === 0) return true;
      // Everything above the trigger line reveals — including content already
      // scrolled past. Requiring it to still be on screen meant a fast scroll or
      // an anchor jump could skip an element and leave it invisible above you.
      if (r.top < limit) {
        el.setAttribute('data-taro-reveal', 'in');
        return false;
      }
      return true;
    });
  };

  const request = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(check);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  window.addEventListener('load', request);
  check();
});
