// The Croze Line, as a timeline you open a chapter at a time.
//
// The page carries about three thousand words across five generations, two
// continents and roughly a century, set as thirty paragraphs in one unbroken
// column 1325px wide — around 150 characters a line, twice a comfortable
// measure. Nobody reads that in a sitting, and the dates that make it a history
// were buried mid-sentence where you could not see them.
//
// A first attempt hung the years in the left margin against a spine. It failed
// for a dull reason worth writing down: Squarespace's block container clips its
// own padding box, so anything positioned outside it is simply not painted.
// There is no margin to hang things in.
//
// So the story is restructured instead. Every dated paragraph starts a chapter
// and carries the undated paragraphs that follow it, giving a scannable list of
// years, each with the opening line of what happened. Click one and the chapter
// opens over a blurred page, which is where the reading actually happens: one
// chapter at a time, at a proper measure, with nothing else competing.
//
// WHAT THIS DOES NOT DO IS WRITE ANYTHING. Every year and every teaser is read
// from the owner's own prose at run time — no dates, no summaries and no
// chapter titles are stored here. Editing the story in Squarespace changes the
// timeline with it, there is no second copy of the family's history to fall out
// of step, and this file cannot assert a date or a claim the page does not
// already make. That matters: these are real people, and one of them is a
// documented public figure.
//
// PROGRESSIVE ENHANCEMENT. The paragraphs are never removed or emptied. They
// are moved into a panel that is hidden with `hidden` until opened, so the full
// text stays in the document for search engines and assistive technology. If
// this file never loads, the page is exactly the long article it was.

import { defineAddon, css } from '../lib/util.js';

const MIN_YEAR = 1800;
const TEASER_MAX = 58;          // characters — a title, not a sentence

defineAddon('croze-timeline', () => {
  if (!/^\/thecrozeline\/?$/i.test(location.pathname)) return;

  const paras = [...document.querySelectorAll('.sqs-html-content p')]
    .filter((p) => !p.closest('footer') && p.textContent.trim().length > 40);
  if (paras.length < 8) return;

  const host = paras[0].parentElement;
  if (!host) return;

  const NEXT_YEAR = new Date().getFullYear() + 1;
  /** The year a paragraph is anchored on, or 0.
   *
   *  The lookarounds reject only an adjacent DIGIT. An earlier version also
   *  rejected an adjacent comma, meaning to skip thousands separators — but a
   *  year in English prose is followed by a comma constantly ("born in 1904,
   *  in the state's Upper Peninsula"), so it threw away most of the real dates
   *  and labelled that paragraph 1938 from the next sentence. The comma guard
   *  was never needed: a thousands separator leaves a three-digit run, and
   *  three digits cannot match a four-digit year. */
  const yearOf = (el) => {
    for (const m of el.textContent.matchAll(/(?<!\d)(1[89]\d{2}|20[0-2]\d)(?!\d)/g)) {
      const y = +m[1];
      if (y >= MIN_YEAR && y <= NEXT_YEAR) return y;
    }
    return 0;
  };

  // Chapters: a dated paragraph opens one and keeps the undated paragraphs
  // that follow. Anything before the first date becomes the opening chapter.
  /** Every year a paragraph names, in the order it names them. */
  const yearsIn = (el) => {
    const out = [];
    for (const m of el.textContent.matchAll(/(?<!\d)(1[89]\d{2}|20[0-2]\d)(?!\d)/g)) {
      const y = +m[1];
      if (y >= MIN_YEAR && y <= NEXT_YEAR) out.push(y);
    }
    return out;
  };

  // Chapters: a dated paragraph opens one and keeps the undated paragraphs
  // that follow it.
  //
  // Which year labels a chapter takes a little care. The obvious choice — the
  // first year in the paragraph — makes the spine run backwards, because a
  // paragraph often opens on an aside: the Cranbrook chapter sits after 1942
  // but its first date is Carl Milles arriving in 1931. Where a paragraph
  // names several years, the earliest one that does not go backwards is used
  // instead. Every year shown is still one the paragraph actually names; this
  // only chooses between them, and where a paragraph genuinely doubles back
  // (Nani's line begins in 1943, after Harvey Senior's story has reached the
  // sixties) it is left alone, because the story really does double back there.
  const chapters = [];
  let last = 0;
  paras.forEach((p) => {
    const years = yearsIn(p);
    if (years.length || !chapters.length) {
      const forward = years.filter((y) => y >= last);
      const year = forward.length ? Math.min(...forward) : (years[0] || 0);
      if (year) last = year;
      chapters.push({ year, paras: [p] });
    } else {
      chapters[chapters.length - 1].paras.push(p);
    }
  });
  if (chapters.length < 4) return;

  /** A title for a chapter, taken from the opening of its first paragraph.
   *
   *  The first CLAUSE, not the first sentence. Whole sentences made a ragged
   *  list — "He started in the dark, literally." next to ninety characters of
   *  run-on — and the shape of a list is most of what makes it feel worth
   *  clicking. Cutting at the first comma or full stop lands on phrases that
   *  read like chapter titles by themselves: "He started in the dark",
   *  "Cranbrook was not just a school", "He documented everything".
   *
   *  A clause shorter than four words is usually a fragment ("Meanwhile"), so
   *  the next one is taken with it. Still the owner's words, in his order —
   *  this only decides where to stop. */
  const teaserOf = (ch) => {
    const text = ch.paras[0].textContent.replace(/\s+/g, ' ').trim();
    const cuts = [];
    for (const m of text.matchAll(/[,.;:—]/g)) cuts.push(m.index);
    let end = cuts.find((i) => text.slice(0, i).split(' ').length >= 4);
    if (end === undefined || end > TEASER_MAX) end = -1;
    let s = end > 0 ? text.slice(0, end) : text;
    if (s.length > TEASER_MAX) {
      s = s.slice(0, TEASER_MAX).replace(/\s+\S*$/, '') + '…';
    }
    return s.replace(/[\s,;:]+$/, '');
  };

  css('croze-timeline', `
    /* The original column, while the timeline stands in for it. */
    /* [hidden] is a browser rule at the lowest specificity there is, and
       Squarespace sets display on the elements inside its own text blocks, so
       it wins and a "hidden" chapter still occupies its full height. Measured:
       4,678px of blank page between the end of the list and the section below
       it. This is the rule that actually collapses them. */
    .taro-cl-body[hidden] { display: none !important; }

    /* The line above the list: what the piece covers on the left, and the way
       out of the chapter format on the right. Chapters are the better way in
       — eighteen doors beat three thousand unbroken words — but someone who
       wants to read it as it was written should not have to open eighteen
       things to do it. */
    .taro-cl-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin: 2.2rem 0 0;
      padding-bottom: 0.7rem;
    }
    .taro-cl-dateline {
      font-size: 0.68rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #4c554e;
    }
    .taro-cl-all {
      -webkit-appearance: none; appearance: none;
      background: none; border: 0; padding: 0.2rem 0;
      font: inherit;
      font-size: 0.68rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #243230;
      cursor: pointer;
      border-bottom: 1px solid rgba(226, 51, 24, 0.45);
      transition: color 180ms ease, border-color 180ms ease;
    }
    @media (hover: hover) {
      .taro-cl-all:hover { color: #e23318; border-bottom-color: #e23318; }
    }
    .taro-cl-all:focus-visible { outline: 2px solid #243230; outline-offset: 3px; }

    .taro-cl-list { list-style: none; margin: 0; padding: 0; }
    .taro-cl-item { border-top: 1px solid rgba(36, 50, 48, 0.18); }
    .taro-cl-item:last-child { border-bottom: 1px solid rgba(36, 50, 48, 0.18); }

    /* One row: the year, then the line that opens the chapter. A button, so it
       is reachable by keyboard and announces its own state. */
    .taro-cl-btn {
      display: grid;
      grid-template-columns: 6.5rem 1fr auto;
      align-items: baseline;
      gap: 1rem;
      width: 100%;
      padding: 1.15rem 0.25rem;
      background: none; border: 0;
      font: inherit; color: inherit;
      text-align: left;
      cursor: pointer;
    }
    .taro-cl-year {
      font-size: clamp(1.25rem, 2.4vw, 1.75rem);
      line-height: 1;
      color: #e23318;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.01em;
    }
    .taro-cl-teaser {
      font-size: clamp(0.95rem, 1.4vw, 1.05rem);
      line-height: 1.5;
      color: #243230;
    }
    .taro-cl-more {
      font-size: 0.68rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #4c554e;
      white-space: nowrap;
      transition: color 180ms ease, transform 220ms cubic-bezier(0.33, 1, 0.68, 1);
    }
    /* The row answers the pointer as one object: the year warms, the title
       steps toward the reader, and the cue slides. A list of eighteen rows
       needs to feel like eighteen doors, not eighteen lines of text. */
    .taro-cl-btn .taro-cl-year,
    .taro-cl-btn .taro-cl-teaser {
      transition: color 180ms ease, transform 220ms cubic-bezier(0.33, 1, 0.68, 1);
    }
    @media (hover: hover) {
      .taro-cl-item:hover { background: rgba(226, 51, 24, 0.04); }
      .taro-cl-btn:hover .taro-cl-teaser { color: #000; transform: translateX(4px); }
      .taro-cl-btn:hover .taro-cl-year { transform: translateX(2px); }
      .taro-cl-btn:hover .taro-cl-more { color: #e23318; transform: translateX(4px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .taro-cl-btn .taro-cl-year,
      .taro-cl-btn .taro-cl-teaser,
      .taro-cl-more { transition: none; }
      .taro-cl-btn:hover .taro-cl-teaser,
      .taro-cl-btn:hover .taro-cl-year,
      .taro-cl-btn:hover .taro-cl-more { transform: none; }
    }
    .taro-cl-btn:focus-visible { outline: 2px solid #243230; outline-offset: 2px; }

    /* WHOLE-STORY MODE. The rows stop being doors and become the year markers
       of a continuous read: the title and the cue go (the title is the opening
       clause of the paragraph directly beneath it, so leaving it in would print
       the same words twice), the year stays as a marker, and each chapter's own
       paragraphs sit under it at the same measure the panel gives them.
       Doubled class on the paragraph rule for the same reason as the panel:
       Squarespace's own p rules land in <head> after ours and win a tie. */
    .taro-cl-list--all .taro-cl-item { border-top-color: rgba(36, 50, 48, 0.10); }
    .taro-cl-list--all .taro-cl-btn { cursor: default; padding: 1.5rem 0.25rem 0.1rem; }
    .taro-cl-list--all .taro-cl-teaser,
    .taro-cl-list--all .taro-cl-more { display: none; }
    .taro-cl-list--all .taro-cl-item:hover { background: none; }
    .taro-cl-list--all .taro-cl-body {
      padding: 0 0.25rem 1.9rem;
      max-width: 40rem;
    }
    .taro-cl-list--all .taro-cl-body.taro-cl-body p {
      margin: 0 0 1.5em;
      line-height: 1.75;
    }
    .taro-cl-list--all .taro-cl-body.taro-cl-body p:last-of-type { margin-bottom: 0; }

    @media (max-width: 640px) {
      .taro-cl-btn { grid-template-columns: 4.5rem 1fr; row-gap: 0.4rem; }
      .taro-cl-more { grid-column: 2; }
    }

    /* The blurred page behind an open chapter. */
    .taro-cl-veil {
      position: fixed; inset: 0;
      z-index: 9990;
      background: rgba(18, 16, 12, 0.34);
      -webkit-backdrop-filter: blur(9px); backdrop-filter: blur(9px);
      opacity: 0;
      transition: opacity 300ms ease;
      cursor: zoom-out;
    }
    .taro-cl-veil--on { opacity: 1; }

    /* The chapter itself: a sheet of the page's own paper, at a measure that
       is the entire point of doing this. */
    .taro-cl-panel {
      position: fixed;
      z-index: 9995;
      left: 50%; top: 50%;
      transform: translate(-50%, -48%);
      width: min(70ch, calc(100vw - 2.5rem));
      max-height: min(84vh, 900px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      background: #f6eed5;
      color: #243230;
      padding: clamp(1.6rem, 4vw, 2.8rem);
      box-shadow: 0 40px 120px rgba(0, 0, 0, 0.4);
      opacity: 0;
      transition: opacity 300ms ease, transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .taro-cl-panel--on { opacity: 1; transform: translate(-50%, -50%); }
    .taro-cl-panel__year {
      display: block;
      font-size: clamp(2rem, 6vw, 3.2rem);
      line-height: 1;
      color: #e23318;
      margin-bottom: 1.4rem;
      font-variant-numeric: tabular-nums;
    }
    /* Separation and measure: the two things the long column never had. */
    /* Doubled class, because Squarespace sets its own margins on p inside
       .sqs-html-content and those rules load after this stylesheet. Measured:
       the gap between paragraphs was coming out at 0px. Separation is half the
       point of opening a chapter at all. */
    .taro-cl-panel.taro-cl-panel p,
    .taro-cl-panel.taro-cl-panel .sqs-html-content p {
      max-width: none;
      font-size: 1.04rem;
      line-height: 1.75;
      margin: 0 0 1.5em;
      text-align: left;
    }
    .taro-cl-panel.taro-cl-panel p:last-of-type { margin-bottom: 0; }

    .taro-cl-close {
      position: absolute; top: 0.5rem; right: 0.6rem;
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: none; border: 0; padding: 0;
      color: #243230;
      font: 300 28px/1 system-ui, sans-serif;
      cursor: pointer;
    }
    .taro-cl-close:focus-visible { outline: 2px solid #243230; outline-offset: 2px; }

    /* Moving between chapters without closing. */
    .taro-cl-nav {
      display: flex; justify-content: space-between; gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.2rem;
      border-top: 1px solid rgba(36, 50, 48, 0.18);
    }
    .taro-cl-nav button {
      background: none; border: 0; padding: 0.5rem 0;
      font: inherit; font-size: 0.72rem;
      letter-spacing: 0.16em; text-transform: uppercase;
      color: #4c554e; cursor: pointer;
    }
    .taro-cl-nav button[disabled] { opacity: 0.3; cursor: default; }
    @media (hover: hover) { .taro-cl-nav button:not([disabled]):hover { color: #e23318; } }

    @media (prefers-reduced-motion: reduce) {
      .taro-cl-veil, .taro-cl-panel { transition: none; }
    }
  `);

  // ---- build the list -----------------------------------------------------
  const list = document.createElement('ol');
  list.className = 'taro-cl-list';

  // The header: a dateline, and the way out of the chapter format.
  const years = chapters.map((c) => c.year).filter(Boolean);
  const head = document.createElement('div');
  head.className = 'taro-cl-head';
  const dateline = document.createElement('span');
  dateline.className = 'taro-cl-dateline';
  dateline.textContent = years.length
    ? `${chapters.length} chapters \u00b7 ${Math.min(...years)}\u2013${Math.max(...years)}`
    : `${chapters.length} chapters`;
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'taro-cl-all';
  allBtn.setAttribute('aria-expanded', 'false');
  allBtn.textContent = 'Read the whole story';
  head.append(dateline, allBtn);

  const panels = chapters.map((ch, i) => {
    const item = document.createElement('li');
    item.className = 'taro-cl-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'taro-cl-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      `<span class="taro-cl-year">${ch.year || '&mdash;'}</span>` +
      `<span class="taro-cl-teaser"></span>` +
      `<span class="taro-cl-more">Read &rarr;</span>`;
    btn.querySelector('.taro-cl-teaser').textContent = teaserOf(ch);

    // The chapter's own paragraphs, moved (not copied) into a hidden panel, so
    // the text exists exactly once in the document and is still there for a
    // crawler or a screen reader with the panel closed.
    const body = document.createElement('div');
    body.className = 'taro-cl-body';
    ch.paras.forEach((p) => body.appendChild(p));

    // Hidden, but IN the document. An earlier version left this div detached
    // while the chapter was closed, which quietly took the entire story out of
    // the page: a crawler or a screen reader found thirty paragraphs of nothing.
    body.hidden = true;
    item.append(btn, body);
    list.appendChild(item);
    return { ch, btn, body, i };
  });

  host.append(head, list);

  // ---- the overlay --------------------------------------------------------
  let veil = null, panel = null, openIdx = -1, lastFocus = null;
  // Whole-story mode. Held here because close() has to know it: a chapter
  // returning home from the panel must not re-hide itself into a page that is
  // currently showing everything.
  let readingAll = false;

  const close = () => {
    if (openIdx < 0) return;
    panels[openIdx].btn.setAttribute('aria-expanded', 'false');
    const v = veil, p = panel;
    veil = null; panel = null;
    const idx = openIdx; openIdx = -1;
    if (v) v.classList.remove('taro-cl-veil--on');
    if (p) p.classList.remove('taro-cl-panel--on');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('padding-right');
    setTimeout(() => {
      // Home again, and hidden — never detached. See the note where it is built.
      const { body, btn: home } = panels[idx];
      body.hidden = !readingAll;
      home.parentElement.appendChild(body);
      if (p) p.remove();
      if (v) v.remove();
    }, 320);
    if (lastFocus) { lastFocus.focus({ preventScroll: true }); lastFocus = null; }
  };

  const open = (i) => {
    if (readingAll) return;      // the row is a year marker, not a door
    if (openIdx === i) return;
    if (openIdx >= 0) close();
    const { ch, btn, body } = panels[i];
    lastFocus = btn;
    openIdx = i;
    btn.setAttribute('aria-expanded', 'true');

    veil = document.createElement('div');
    veil.className = 'taro-cl-veil';
    veil.addEventListener('click', close);
    document.body.appendChild(veil);

    panel = document.createElement('div');
    panel.className = 'taro-cl-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', ch.year ? `The Croze Line, ${ch.year}` : 'The Croze Line');

    const close$ = document.createElement('button');
    close$.type = 'button';
    close$.className = 'taro-cl-close';
    close$.setAttribute('aria-label', 'Close');
    close$.textContent = '×';
    close$.addEventListener('click', close);

    const year = document.createElement('span');
    year.className = 'taro-cl-panel__year';
    year.textContent = ch.year || '';

    const nav = document.createElement('div');
    nav.className = 'taro-cl-nav';
    const prev = document.createElement('button');
    prev.type = 'button'; prev.textContent = '← Earlier';
    prev.disabled = i === 0;
    prev.addEventListener('click', () => open(i - 1));
    const next = document.createElement('button');
    next.type = 'button'; next.textContent = 'Later →';
    next.disabled = i === panels.length - 1;
    next.addEventListener('click', () => open(i + 1));
    nav.append(prev, next);

    body.hidden = false;
    panel.append(close$, year, body, nav);
    document.body.appendChild(panel);

    // Lock the page without letting the layout jump by the scrollbar's width.
    const bar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    if (bar > 0) document.documentElement.style.paddingRight = `${bar}px`;

    requestAnimationFrame(() => {
      if (veil) veil.classList.add('taro-cl-veil--on');
      if (panel) panel.classList.add('taro-cl-panel--on');
      close$.focus({ preventScroll: true });
    });
  };

  /** Show the piece whole, or go back to the chapters.
   *
   *  Nothing is copied and nothing is rebuilt: the same paragraph elements the
   *  chapters already own are simply unhidden in place. So the story exists
   *  exactly once in the document in both modes, and switching cannot make the
   *  two disagree.
   *
   *  A chapter open in the panel has lent its paragraphs to it, and close()
   *  only returns them after the fade. They are reseated here so the whole
   *  story is complete the instant it appears rather than a beat later. */
  const setAll = (on) => {
    readingAll = on;
    close();
    panels.forEach(({ btn, body }) => {
      const item = btn.parentElement;
      if (body.parentElement !== item) item.appendChild(body);
      body.hidden = !on;
      btn.setAttribute('aria-expanded', String(on));
      // Out of the tab order while it is a heading rather than a control.
      btn.tabIndex = on ? -1 : 0;
    });
    list.classList.toggle('taro-cl-list--all', on);
    allBtn.setAttribute('aria-expanded', String(on));
    allBtn.textContent = on ? 'Back to the chapters' : 'Read the whole story';
    // Collapsing removes thousands of pixels from under the reader, which
    // otherwise leaves them standing in the footer wondering what happened.
    if (!on) {
      head.scrollIntoView({ block: 'start',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  allBtn.addEventListener('click', () => setAll(!readingAll));

  panels.forEach(({ btn }, i) => btn.addEventListener('click', () => open(i)));

  document.addEventListener('keydown', (e) => {
    if (openIdx < 0) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft' && openIdx > 0) open(openIdx - 1);
    if (e.key === 'ArrowRight' && openIdx < panels.length - 1) open(openIdx + 1);
  });
});
