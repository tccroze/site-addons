// The Let's Talk page: the headline, the form's manners, and the button.
//
// Measured against the live page rather than guessed at, because almost
// nothing here is where you would expect it to be:
//
//   THE HEADLINE reads as two separate lines rather than one sentence. Both
//   <h1>s live in the same block, so ordinary margins do control them — 63px
//   type on a 94.5px line (1.5, a body-copy ratio applied to display type),
//   with 36px of margin between the two. That is about 67px of air between
//   "LET'S WORK" and "TOGETHER", which is why they read as two thoughts.
//
//   THE FIELDS are transparent, with transparent borders. What you can see is
//   a span — .form-input-effects-border — lying behind each input at inset 0,
//   painting rgba(255,240,179,0.8) inside a 2px rule. So restyling "the input"
//   does nothing at all; the span is the field, visually.
//
//   THE SUBMIT BUTTON is set in Cousine, a monospace, at 18px — the only place
//   on the site where that face appears, and it reads as a placeholder. It is
//   also 1325px wide and 99px tall: a full-bleed outline with a small word
//   floating in the middle of it.
//
//   THE MEASURE. Every field runs the full width of the block — 1325px on a
//   desktop. An email address in a 1325px box is a hard thing to look at, and
//   the labels above them end up marooned at the far left of the screen.
//
// !important is used throughout, which is not a preference. Squarespace's form
// styles arrive under hashed class names (.vj3vrvqNhcUOo_Bm) generated per
// build, so they cannot be out-specified by name — only by weight.

import { defineAddon, css } from '../lib/util.js';

const CREAM = '#f6eed5';
const INK = '#243230';
const RED = '#e23318';

defineAddon('letstalk', () => {
  if (!/^\/letstalk\/?$/i.test(location.pathname)) return;
  document.documentElement.classList.add('taro-lt');

  css('letstalk', `
    /* ---- the headline ------------------------------------------------- */
    /* One sentence over two lines. 1.02 leaves the descenders room without
       opening a gap the eye reads as a paragraph break. */
    .taro-lt h1 {
      /* 1.02 closed the gap but shut it too hard — this face has tall caps and
         the two lines sat almost touching. 1.06 keeps them one headline with
         enough air to breathe. */
      line-height: 1.06 !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }

    /* ---- the measure --------------------------------------------------- */
    /* A form is read one line at a time; it does not want the full width of a
       desktop. 46rem keeps the longest label and its field in one comfortable
       column, and centres the whole thing under a centred headline. */
    /* On .form-wrapper, not on .field-list. The wrapper is a grid whose item
       is the <form>, and the submit button lives in that form OUTSIDE the
       field list — so constraining the list left the button stretched to the
       full 1325px while the fields sat in a narrow column above it. */
    .taro-lt .form-wrapper {
      max-width: 46rem;
      margin-inline: auto;
    }

    /* ---- the fields ---------------------------------------------------- */
    /* The visible box is the effects span, not the input. Paper rather than
       the acid yellow, and a rule dark enough to read as an edge without
       shouting over the labels. */
    .taro-lt .form-input-effects-border {
      background: rgba(251, 246, 230, 0.92) !important;
      border-color: rgba(36, 50, 48, 0.30) !important;
      border-width: 1.5px !important;
      border-radius: 6px !important;
      transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
    }
    /* The span follows its input, so a sibling combinator reaches it on focus
       — the field itself can carry no visible focus state, having no paint. */
    .taro-lt input:focus ~ .form-input-effects .form-input-effects-border,
    .taro-lt textarea:focus ~ .form-input-effects .form-input-effects-border,
    .taro-lt select:focus ~ .form-input-effects .form-input-effects-border {
      border-color: ${RED} !important;
      background: #fffdf6 !important;
      box-shadow: 0 0 0 3px rgba(226, 51, 24, 0.14) !important;
    }
    .taro-lt input, .taro-lt textarea, .taro-lt select {
      /* Focus is drawn on the span above; a second ring on top of it reads as
         a mistake. Removed only because a visible replacement exists. */
      outline: none !important;
    }

    /* ---- the labels ---------------------------------------------------- */
    /* Small, letterspaced, uppercase — the same voice the eyebrows use
       everywhere else on the site, so the form stops looking like a different
       website's furniture. */
    .taro-lt .field-list .title,
    .taro-lt .field-list .caption {
      font-size: 0.7rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.15em !important;
      text-transform: uppercase !important;
      color: rgba(36, 50, 48, 0.72) !important;
      line-height: 1.4 !important;
    }
    /* A fieldset's own legend is the group's name — Name, Phone — and should
       sit a step above the captions inside it. */
    .taro-lt .field-list legend .title {
      font-size: 0.78rem !important;
      color: ${INK} !important;
      letter-spacing: 0.18em !important;
    }
    /* The label's text is not always the label's own text node: some of these
       wrap it in a div or a span that carries its own size, which beats
       inheritance and left "Country", "Number" and every "(required)" at the
       old 18px next to letterspaced 12.6px labels. Everything inside a label
       speaks with the label's voice. */
    .taro-lt .field-list .title *,
    .taro-lt .field-list .caption * {
      font-size: inherit !important;
      font-weight: inherit !important;
      letter-spacing: inherit !important;
      text-transform: inherit !important;
      line-height: inherit !important;
    }
    /* Stubborn 15px under the phone group — it is the fieldset's own padding,
       not a child's margin, which is why two passes at the children missed it. */
    .taro-lt .field-list fieldset.form-item { padding-bottom: 0 !important; }

    .taro-lt .field-list .required-note,
    .taro-lt .field-list .title .required,
    .taro-lt .field-list .caption .required {
      letter-spacing: 0.1em !important;
      opacity: 0.62;
    }

    /* ---- rhythm --------------------------------------------------------- */
    .taro-lt .form-wrapper .field-list > .form-item { margin-bottom: 1.6rem !important; }
    /* The phone group sat 43px from the next field where every other gap was
       29 — a stray bottom margin on the last field inside a fieldset. Measured
       gaps before: 28, 30, 43, 29, 29, 28, 29, 29. */
       The first attempt used :last-child, which reaches only the second of the
       two fields — and they sit side by side in a flex row, where margins do
       not collapse, so the other one kept its 15px. Every field inside. */
    .taro-lt .field-list fieldset.form-item > div,
    .taro-lt .field-list fieldset.form-item .field {
      margin-bottom: 0 !important;
    }
    /* :last-child, not :last-of-type. Of-type matches the last element of EACH
       tag among the siblings, and the field list mixes <fieldset> (Name, Phone)
       with <div> (everything else) — so the extra bottom margin meant for the
       final item was also landing on Phone, which is the last fieldset. That
       was the stray 43px gap, and it was mine: two passes hunting for a child's
       margin, when the margin was on the fieldset and I had put it there. */
    .taro-lt .form-wrapper .field-list > .form-item:last-child { margin-bottom: 2.4rem !important; }

    /* ---- the button ----------------------------------------------------- */
    /* A button the size of a doorway, in a typeface used nowhere else, is what
       made this page feel unfinished. Solid red, the site's own face, and only
       as wide as the word needs. */
    .taro-lt .form-button-wrapper,
    .taro-lt .form-wrapper .form-button-wrapper { text-align: center !important; }
    .taro-lt .form-submit-button {
      /* Full width of the column, now that the column is a sane width. Asking
         for width:auto did nothing here — the button reports inline-block and
         still measured 1325px — and a submit button spanning its own form is
         the right shape anyway. */
      display: block !important;
      width: 100% !important;
      height: auto !important;
      padding: 1.05rem 2.75rem !important;
      font-family: inherit !important;
      font-size: 0.8rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.18em !important;
      text-transform: uppercase !important;
      color: ${CREAM} !important;
      background: ${RED} !important;
      border: 2px solid ${RED} !important;
      border-radius: 300px !important;
      cursor: pointer;
      transition: background 200ms ease, border-color 200ms ease,
                  color 200ms ease, transform 220ms cubic-bezier(0.33, 1, 0.68, 1);
    }
    @media (hover: hover) {
      .taro-lt .form-submit-button:hover {
        background: ${INK} !important;
        border-color: ${INK} !important;
        transform: translateY(-2px);
      }
    }
    .taro-lt .form-submit-button:focus-visible {
      outline: 2px solid ${INK} !important;
      outline-offset: 3px;
    }
    @media (prefers-reduced-motion: reduce) {
      .taro-lt .form-submit-button { transition: none; }
      .taro-lt .form-submit-button:hover { transform: none; }
    }

    /* ---- the three steps ------------------------------------------------
       Nine fields in one unbroken column is a wall, and a wall is what makes a
       long enquiry form feel like work. They divide cleanly — who you are, what
       you need, the details — so they are divided, numbered, and each reports
       when it is satisfied. Nothing is hidden or gated: every field is on the
       page at all times, exactly as before. */
    .taro-lt .taro-lt-step {
      display: grid;
      grid-template-columns: auto auto 1fr;
      align-items: center;
      gap: 0 0.85rem;
      margin: 0 0 1.15rem !important;
    }
    .taro-lt .field-list > .taro-lt-step:not(:first-child) { margin-top: 2.6rem !important; }
    .taro-lt-step__no {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      font-variant-numeric: tabular-nums;
      color: #e23318;
      border: 1.5px solid #e23318;
      border-radius: 50%;
      width: 2rem; height: 2rem;
      display: grid; place-items: center;
      transition: background 260ms ease, color 260ms ease;
    }
    .taro-lt-step__label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #243230;
      white-space: nowrap;
    }
    /* Draws itself in when the step arrives, and completes when the step does. */
    .taro-lt-step__rule {
      height: 1px;
      background: rgba(36, 50, 48, 0.22);
      transform: scaleX(0);
      transform-origin: left center;
      transition: transform 700ms cubic-bezier(0.33, 1, 0.68, 1), background 300ms ease;
    }
    .taro-lt-step.is-in .taro-lt-step__rule { transform: scaleX(1); }
    .taro-lt-step.is-done .taro-lt-step__no { background: #e23318; color: #f6eed5; }
    .taro-lt-step.is-done .taro-lt-step__rule { background: #e23318; }
    @media (prefers-reduced-motion: reduce) {
      .taro-lt-step__rule { transition: none; transform: scaleX(1); }
      .taro-lt-step__no { transition: none; }
    }
    @media (max-width: 640px) { .taro-lt-step__label { white-space: normal; } }

    /* ---- arriving from a photograph ------------------------------------ */
    .taro-lt .taro-lt-ref {
      margin: 0 0 1.6rem !important;
      padding: 0.85rem 1.1rem;
      border-left: 3px solid ${RED};
      background: rgba(226, 51, 24, 0.06);
      font-size: 0.72rem !important;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${INK};
    }

    /* ---- the file drop -------------------------------------------------- */
    .taro-lt .field-list .file-upload,
    .taro-lt .field-list .file-upload > * {
      border-radius: 6px !important;
    }

    @media (max-width: 799px) {
      .taro-lt .form-wrapper .field-list > .form-item { margin-bottom: 1.25rem !important; }
      .taro-lt .form-submit-button { padding: 1rem 1.5rem !important; }
    }
  `);

  /* ---- arriving from a photograph -------------------------------------
   * The lightbox links here as /letstalk?ref=Film%20%E2%80%94%20frame%2024A,
   * so the form should already know what the enquiry is about instead of
   * making someone describe the picture they were just looking at.
   *
   * The value is set through the native setter and followed by an input event,
   * because this is a React-controlled textarea: assigning .value directly
   * updates the DOM node and leaves React's state untouched, so the text
   * appears, then vanishes the moment anything re-renders, and is not in the
   * submission.
   *
   * The reference is treated as hostile. It arrives in a URL anyone can write,
   * so it is stripped of control characters, capped, and only ever inserted as
   * text — never markup. Anything already typed is left alone.
   */
  /* ---- the three steps -------------------------------------------------
   * Headings are inserted before the field they open, by POSITION rather than
   * by matching label text: the labels are the owner's to reword in the editor,
   * the order is what carries the meaning, and if a field is ever added the
   * worst case is a heading in a slightly odd place, not a broken form.
   */
  const STEPS = [[0, '01', 'Who you are'], [3, '02', 'What you need'], [6, '03', 'The details']];

  const buildSteps = () => {
    const list = document.querySelector('.form-wrapper .field-list');
    if (!list) return false;
    if (list.querySelector('.taro-lt-step')) return true;
    const items = [...list.children].filter((el) => el.classList.contains('form-item'));
    if (items.length < 7) return false;              // not the enquiry form

    const made = [];
    STEPS.forEach(([at, no, label]) => {
      const anchor = items[at];
      if (!anchor) return;
      const head = document.createElement('div');
      head.className = 'taro-lt-step';
      const n = document.createElement('span');
      n.className = 'taro-lt-step__no';
      n.textContent = no;
      const l = document.createElement('span');
      l.className = 'taro-lt-step__label';
      l.textContent = label;
      const r = document.createElement('span');
      r.className = 'taro-lt-step__rule';
      head.append(n, l, r);
      list.insertBefore(head, anchor);
      made.push(head);
    });
    if (!made.length) return false;

    // Which fields belong to a step: everything up to the next heading.
    const groups = made.map((head) => {
      const fields = [];
      for (let el = head.nextElementSibling; el; el = el.nextElementSibling) {
        if (el.classList.contains('taro-lt-step')) break;
        if (el.classList.contains('form-item')) fields.push(el);
      }
      return { head, fields };
    });

    /* Satisfied means the step's required fields have values. Squarespace does
     * not put the required attribute on these inputs — it marks the form-item
     * with a .required class and says so in the label — so that is what is
     * read. A step with nothing required would otherwise be born complete,
     * which says nothing, so there every field has to be answered. This only
     * ever reports: it never blocks, hides or gates anything. */
    const check = () => {
      groups.forEach(({ head, fields }) => {
        const inputs = fields.flatMap((f) =>
          [...f.querySelectorAll('input, select, textarea')]
            .filter((el) => el.type !== 'hidden' && el.offsetParent !== null));
        if (!inputs.length) return;
        const req = fields.filter((f) => f.classList.contains('required'));
        const needed = req.length
          ? req.flatMap((f) => [...f.querySelectorAll('input, select, textarea')]
              .filter((el) => el.type !== 'hidden' && el.offsetParent !== null))
          : inputs;
        const done = needed.length > 0
          && needed.every((el) => String(el.value || '').trim() !== '');
        head.classList.toggle('is-done', done);
      });
    };
    list.addEventListener('input', check);
    list.addEventListener('change', check);
    check();

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px' });
      made.forEach((h) => io.observe(h));
    } else {
      made.forEach((h) => h.classList.add('is-in'));
    }
    return true;
  };

  if (!buildSteps()) {
    // The form is a website component, rendered after this add-on runs.
    const stepsMo = new MutationObserver(() => { if (buildSteps()) stepsMo.disconnect(); });
    stepsMo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => stepsMo.disconnect(), 15000);
  }

  const raw = new URLSearchParams(location.search).get('ref');
  const ref = raw ? raw.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90) : '';
  if (ref) {
    const setNative = (el, value) => {
      const proto = el.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, value); else el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const notice = document.createElement('p');
    notice.className = 'taro-lt-ref';
    notice.textContent = `Enquiring about ${ref}`;

    const fill = () => {
      const ta = document.querySelector('.field-list textarea');
      if (!ta) return false;
      if (!ta.value.trim()) setNative(ta, `Enquiring about ${ref}.\n\n`);
      const list = document.querySelector('.form-wrapper .field-list');
      if (list && !document.querySelector('.taro-lt-ref')) list.prepend(notice);
      return true;
    };

    if (!fill()) {
      // The form is rendered client-side, so it is routinely absent here.
      const mo = new MutationObserver(() => { if (fill()) mo.disconnect(); });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => mo.disconnect(), 15000);
    }
  }

  /* ---- the dead space at the foot of the form -------------------------
   * Same Fluid Engine behaviour as everywhere else on this site: the section
   * writes an explicit row track list and reserves that height whatever is in
   * it — 1,409px of grid around 1,180px of content. Dropping the track list
   * lets the rows size to what is there; the column tracks are untouched, so
   * nothing moves sideways.
   *
   * Anchored on the BLOCK, not on the <form>. The form is a website component
   * rendered after DOMContentLoaded, so querySelector('form') is null when this
   * runs and the first attempt at this quietly did nothing. The block is in the
   * served HTML, and it is re-run on load in case the section is rebuilt.
   */
  const collapse = () => {
    const fe = document.querySelector('.sqs-block-form')?.closest('.fluid-engine');
    if (!fe || fe.children.length !== 1) return;
    fe.style.setProperty('grid-template-rows', 'none', 'important');
    fe.children[0].style.setProperty('grid-row', '1 / 2', 'important');
  };
  collapse();
  window.addEventListener('load', collapse, { once: true });
});
