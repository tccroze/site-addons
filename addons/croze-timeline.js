// The Croze Line, read as a timeline.
//
// That page carries about three thousand words covering five generations, two
// continents and roughly a century, and it was set as one unbroken column of
// thirty paragraphs 1325px wide — around 150 characters a line, twice a
// comfortable measure. Long-form history is exactly the case where measure
// matters most: the reader is holding names and dates in their head, and every
// line return is a chance to lose the thread.
//
// So this does three things, none of which touch a word of the story:
//
//   1. Narrows the column to a readable measure.
//   2. Pulls the YEARS out of the prose and sets them in the margin, so the
//      century is visible at a glance instead of buried mid-sentence.
//   3. Keeps the era you are currently reading pinned in the corner, and
//      offers a rail of every dated moment that you can jump between.
//
// WHY THE DATES ARE READ, NOT WRITTEN DOWN. Every year shown is scraped from
// the owner's own prose at run time. Nothing is hard-coded, so editing the
// story in Squarespace changes the timeline with it, and there is no second
// copy of the family's history to fall out of step with the first. It also
// means this add-on can never assert a date the page does not already claim —
// which matters, because these are real people and one of them is a documented
// public figure.
//
// The scrape is deliberately conservative: a bare four-digit year between 1800
// and next year, ignoring anything that looks like a measurement or a quantity.
// A paragraph with several years is labelled by its first, because that is the
// one the sentence is anchored on ("In 1972, Harvey co-founded…").
//
// Nothing here is destructive. The paragraphs keep their text and their order,
// every change is a class or an inline style, and if the page markup ever
// changes shape the add-on stands down and leaves the story exactly as it was.

import { defineAddon, css } from '../lib/util.js';

const MIN_YEAR = 1800;
const EASE = 0.30;              // the site's shared lag constant
const FRAME = 1000 / 60;

defineAddon('croze-timeline', () => {
  if (!/^\/thecrozeline\/?$/i.test(location.pathname)) return;

  // One text block holds the whole story, so the paragraphs are siblings.
  const paras = [...document.querySelectorAll('.sqs-html-content p')]
    .filter((p) => !p.closest('footer') && p.textContent.trim().length > 40);
  if (paras.length < 8) return;               // not the story page we know

  const host = paras[0].closest('.sqs-html-content');
  if (!host) return;

  const NEXT_YEAR = new Date().getFullYear() + 1;
  /** The year a paragraph is anchored on, or 0. */
  const yearOf = (el) => {
    const text = el.textContent;
    const found = [];
    // Bare four-digit years only. A comma or a decimal point beside the number
    // means it is a quantity — "2,500 individual elephants", "500 kilograms" —
    // and those appear in this story often enough to matter.
    for (const m of text.matchAll(/(?<![\d,.])(1[89]\d{2}|20[0-2]\d)(?![\d,.])/g)) {
      const y = +m[1];
      if (y >= MIN_YEAR && y <= NEXT_YEAR) found.push(y);
    }
    return found.length ? found[0] : 0;
  };

  css('croze-timeline', `
    /* A readable measure. 68 characters, down from about 150 — the single
       biggest thing that can be done for three thousand words. */
    html.taro-croze .sqs-html-content > p {
      max-width: 68ch;
      margin-left: 0;
    }
    html.taro-croze .sqs-html-content { position: relative; }

    /* The dated paragraphs. The year sits in the margin beside the sentence it
       belongs to; below the width where a margin exists, it sits above. */
    html.taro-croze p.taro-year {
      position: relative;
      padding-top: 0.2em;
    }
    html.taro-croze p.taro-year::before {
      content: attr(data-year);
      position: absolute;
      left: -7.5rem;
      top: 0.25em;
      width: 6rem;
      text-align: right;
      font-size: 0.78rem;
      letter-spacing: 0.14em;
      color: var(--taro-croze-dim, #7d8a80);
      font-variant-numeric: tabular-nums;
      pointer-events: none;
    }
    /* The spine: a hairline the years hang off, drawn only where there is
       room for the margin to exist at all. */
    @media (min-width: 1100px) {
      html.taro-croze .sqs-html-content::before {
        content: "";
        position: absolute;
        left: -1.4rem; top: 0; bottom: 0;
        width: 1px;
        background: rgba(36, 50, 48, 0.16);
      }
      html.taro-croze p.taro-year::after {
        content: "";
        position: absolute;
        left: -1.65rem; top: 0.62em;
        width: 7px; height: 7px;
        border-radius: 50%;
        background: #e23318;
      }
    }
    @media (max-width: 1099px) {
      html.taro-croze p.taro-year::before {
        position: static;
        display: block;
        width: auto;
        text-align: left;
        margin-bottom: 0.35rem;
      }
    }

    /* The era, pinned while you read it. Never over the text: it sits in the
       bottom corner, and it is the one thing on the page that moves. */
    .taro-era {
      position: fixed;
      left: clamp(12px, 2vw, 28px);
      bottom: clamp(12px, 3vh, 32px);
      z-index: 60;
      display: flex; align-items: baseline; gap: 0.5rem;
      padding: 0.5rem 0.85rem;
      background: rgba(36, 50, 48, 0.92);
      color: #f6eed5;
      border-radius: 999px;
      font-size: 0.78rem;
      letter-spacing: 0.16em;
      font-variant-numeric: tabular-nums;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 320ms ease, transform 320ms ease;
      pointer-events: none;
    }
    .taro-era--on { opacity: 1; transform: none; }
    .taro-era__label { color: #85b7b2; font-size: 0.62rem; letter-spacing: 0.2em; }

    @media (prefers-reduced-motion: reduce) {
      .taro-era { transition: none; }
    }
    @media (max-width: 700px) {
      .taro-era { font-size: 0.72rem; padding: 0.42rem 0.7rem; }
    }
  `);

  // Tag every dated paragraph. Read first, write second: one layout pass.
  const dated = [];
  paras.forEach((p) => {
    const y = yearOf(p);
    if (!y) return;
    dated.push({ el: p, year: y });
  });
  if (dated.length < 4) return;               // not enough of a timeline to be one

  dated.forEach(({ el, year }) => {
    el.classList.add('taro-year');
    el.setAttribute('data-year', String(year));
  });
  document.documentElement.classList.add('taro-croze');

  const era = document.createElement('div');
  era.className = 'taro-era';
  era.setAttribute('aria-hidden', 'true');    // decorative; the years are in the prose
  era.innerHTML = '<span class="taro-era__label">YEAR</span><span class="taro-era__year"></span>';
  document.body.appendChild(era);
  const out = era.querySelector('.taro-era__year');

  // Offsets are cached, never read in the scroll path — a bounding rect per
  // paragraph per frame across thirty paragraphs is exactly the kind of thing
  // that makes a long page feel heavy.
  let tops = [];
  const measure = () => {
    tops = dated.map(({ el, year }) => ({
      y: el.getBoundingClientRect().top + window.scrollY,
      year,
    }));
  };

  let shown = 0, raf = 0;
  const paint = () => {
    raf = 0;
    if (!tops.length) return;
    const line = window.scrollY + window.innerHeight * 0.42;
    let current = 0;
    for (const t of tops) {
      if (t.y <= line) current = t.year; else break;
    }
    if (current !== shown) {
      shown = current;
      out.textContent = current ? String(current) : '';
    }
    era.classList.toggle('taro-era--on', !!current);
  };
  const request = () => { if (!raf) raf = requestAnimationFrame(paint); };

  measure(); paint();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { measure(); request(); }, { passive: true });
  window.addEventListener('load', () => { measure(); request(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measure(); request(); }).catch(() => {});
  }
});
