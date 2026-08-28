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
    /* ---- the light trail, drawn along the top ---------------------------
       The hero is a photograph of a light being drawn through the dark, and a
       long form is the one place on this site that benefits from telling you
       how much is left. So the trail continues along the top of the window:
       scrolling advances it, and answering the required questions advances it
       too, whichever is further. Red rather than the trail's own warm white,
       because white on cream paper is not a line at all. */
    .taro-lt-trail {
      position: fixed; top: 0; left: 0; right: 0; height: 3px;
      z-index: 10000; pointer-events: none;
      background: rgba(36, 50, 48, 0.08);
    }
    .taro-lt-trail__fill {
      height: 100%; width: 100%;
      transform: scaleX(var(--taro-trail, 0)); transform-origin: left center;
      background: #e23318;
      box-shadow: 0 0 8px rgba(226, 51, 24, 0.55);
      transition: transform 220ms cubic-bezier(0.33, 1, 0.68, 1), box-shadow 300ms ease;
    }
    .taro-lt-trail.is-done .taro-lt-trail__fill {
      box-shadow: 0 0 14px rgba(226, 51, 24, 0.9), 0 0 30px rgba(247, 148, 29, 0.5);
    }
    @media (prefers-reduced-motion: reduce) {
      .taro-lt-trail__fill { transition: none; }
    }

    /* ---- after it is sent ------------------------------------------------
       Squarespace drops the configured message into
       .sqs-form-block-submission-html and hides the form, which left a small
       bold "Thank you!" adrift in a screen of empty paper — the last thing
       someone sees after taking the trouble to write to you. The message is
       still the owner's, set in the editor; this gives it somewhere to sit. */
    /* React's own confirmation line, kept in the DOM and taken off the
       page — its words are now the panel's heading. */
    /* !important because the wrapper's own display:grid outranked this in
       practice — measured with the class applied and display still grid,
       which would have shown React's bare line above the panel repeating
       the same words. */
    .taro-lt .form-wrapper.taro-lt-sent { display: none !important; }
    .taro-lt-thanks {
      max-width: 40rem;
      margin: 0 auto;
      padding: clamp(2.5rem, 8vw, 5rem) clamp(1.25rem, 5vw, 2rem) clamp(2rem, 6vw, 3rem);
      text-align: center;
      opacity: 0;
      transform: translateY(14px);
      transition: opacity 700ms ease, transform 700ms cubic-bezier(0.33, 1, 0.68, 1);
    }
    .taro-lt-thanks.is-in { opacity: 1; transform: none; }
    .taro-lt-thanks__title {
      font-size: clamp(2.2rem, 7vw, 4rem) !important;
      line-height: 1.02;
      margin: 0 0 1.1rem !important;
      color: #243230;
    }
    .taro-lt-thanks__rule {
      width: 4.5rem; height: 3px;
      background: #e23318;
      margin: 0 auto 1.4rem;
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 700ms cubic-bezier(0.33, 1, 0.68, 1) 220ms;
    }
    .taro-lt-thanks.is-in .taro-lt-thanks__rule { transform: scaleX(1); }
    .taro-lt-thanks__note {
      font-size: clamp(1rem, 1.6vw, 1.15rem) !important;
      line-height: 1.6;
      margin: 0 auto 2.2rem !important;
      max-width: 26rem;
      color: rgba(36, 50, 48, 0.8);
    }
    .taro-lt-thanks__links {
      display: flex; flex-wrap: wrap; gap: 0.9rem 1.1rem;
      justify-content: center;
      margin-bottom: clamp(2rem, 5vw, 2.75rem);
    }
    .taro-lt-thanks__link {
      display: inline-block;
      padding: 0.85rem 2rem;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      text-decoration: none;
      color: #243230;
      border: 1.5px solid rgba(36, 50, 48, 0.35);
      border-radius: 300px;
      transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
    }
    @media (hover: hover) {
      .taro-lt-thanks__link:hover {
        color: #f6eed5; background: #243230; border-color: #243230;
      }
    }
    .taro-lt-thanks__link:focus-visible { outline: 2px solid #e23318; outline-offset: 3px; }
    /* The signature file is cream, because it lives on the dark footer. On
       paper it is very nearly invisible — measured against this panel, cream
       on cream. brightness(0) renders any source pure black regardless of its
       colour, and the opacity brings it back to the weight of the ink used
       everywhere else, without needing a second version of the asset. */
    .taro-lt-thanks img {
      display: block;
      width: clamp(9rem, 22vw, 13rem);
      height: auto;
      margin: 0 auto;
      filter: brightness(0);
      opacity: 0.82;
    }
    @media (prefers-reduced-motion: reduce) {
      .taro-lt-thanks, .taro-lt-thanks__rule { transition: none; }
      .taro-lt-thanks { opacity: 1; transform: none; }
      .taro-lt-thanks__rule { transform: scaleX(1); }
    }

    /* ---- the hero, and the sign-off ------------------------------------ */
    /* The copy is moved by transform only, so nothing it sits inside relayouts
       while the page scrolls. */
    .taro-lt-sink {
      will-change: transform, opacity;
      transform: translate3d(0, var(--taro-sink, 0px), 0) scale(var(--taro-sink-s, 1));
      opacity: var(--taro-sink-o, 1);
    }
    @media (prefers-reduced-motion: reduce) {
      .taro-lt-sink { transform: none !important; opacity: 1 !important; }
    }

    /* A sign-off in the owner's own hand, written on as it arrives — the same
       gesture the footer signature makes, and the same mask that draws it. */
    .taro-lt-signoff {
      margin: clamp(2.5rem, 6vw, 3.5rem) auto 0;
      text-align: center;
    }
    .taro-lt-signoff__line {
      font-size: 0.72rem !important;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(36, 50, 48, 0.6);
      margin: 0 0 1.1rem !important;
    }
    .taro-lt-signoff img {
      display: block;
      width: clamp(9rem, 22vw, 13rem);
      height: auto;
      margin: 0 auto;
      /* Same reason as the panel above: a cream signature on cream paper. */
      filter: brightness(0);
      opacity: 0.82;
      -webkit-mask-image: var(--taro-so-mask, none);
              mask-image: var(--taro-so-mask, none);
      -webkit-mask-repeat: no-repeat;
              mask-repeat: no-repeat;
      -webkit-mask-size: 100% 100%;
              mask-size: 100% 100%;
    }
    @media (prefers-reduced-motion: reduce) {
      .taro-lt-signoff img { -webkit-mask-image: none; mask-image: none; }
    }

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
  /* ---- the hero sinks as the form arrives ------------------------------
   * The same language the homepage and the dune section speak: the copy is
   * held where it can be read, then travels down and dissolves as the
   * photograph leaves. It is NOT masked to the light trail, and that is a
   * decision rather than a shortcut — the trail is a thin bright line crossing
   * the whole frame, and cutting type to it would strand fragments of letters
   * along it, which is exactly the failure the dune scene was rebuilt to
   * avoid. A sink reads as the landscape taking the words and cannot fragment.
   *
   * Geometry is cached and re-read only on resize/load. Everything per frame is
   * a custom property on an element that is already promoted, so no layout is
   * forced while scrolling.
   */
  /* ---- after it is sent ------------------------------------------------
   * Squarespace hides the form and drops the configured message into
   * .sqs-form-block-submission-html. That message is the owner's, set in the
   * editor — it is read from the page rather than written here, so changing it
   * there still changes it — but on its own it was a small bold line adrift in
   * a screen of empty paper, which is a poor last impression after someone has
   * taken the trouble to write.
   *
   * The onward links matter more than they look: at this moment the visitor is
   * interested and has nowhere to go, and the only navigation on screen is the
   * header they have already ignored once.
   */
  const THANKS_NOTE = 'I’ll get back to you within 48 hours.';
  const THANKS_LINKS = [['See the work', '/stills'], ['Prints & originals', '/shop']];

  /* WHERE THE MESSAGE ACTUALLY APPEARS.
   *
   * Not in .sqs-form-block-submission-html, which is what the first version of
   * this watched and why it never once fired. Reading the form bundle settles
   * it: that element is a data carrier, read a single time at start-up so its
   * data-submission-html attribute can be passed to React as a prop —
   *
   *   const e = this.root.querySelector(".sqs-form-block-submission-html"),
   *         n = e?.getAttribute("data-submission-html") || undefined;
   *   return { formSubmissionHTML: n, ...JSON.parse(context) }
   *
   * — and nothing ever writes to it. React renders the confirmation INSIDE
   * .form-wrapper, in place of the form.
   *
   * So success is: a form was here, the form is gone, and there are words in
   * its place. The "a form was here" half matters — .form-wrapper is empty
   * before React mounts, and briefly empty after an unmount, and neither is
   * somebody thanking anyone.
   *
   * The panel is appended to the BLOCK rather than into .form-wrapper, which
   * is React's to own and re-render. React's own message is hidden rather than
   * removed, so nothing is taken away from a component that may look for it.
   */
  let sawForm = false;
  const dressThanks = () => {
    const block = document.querySelector('.sqs-block-form');
    const wrap = block && block.querySelector('.form-wrapper');
    if (!block || !wrap) return false;
    if (block.querySelector('.taro-lt-thanks')) return true;
    if (wrap.querySelector('form')) { sawForm = true; return false; }
    if (!sawForm) return false;
    const text = wrap.textContent.trim();
    if (!text || text.length > 400) return false;

    const panel = document.createElement('div');
    panel.className = 'taro-lt-thanks';

    const title = document.createElement('h2');
    title.className = 'taro-lt-thanks__title';
    title.textContent = text;                    // the owner's words, as text
    const rule = document.createElement('div');
    rule.className = 'taro-lt-thanks__rule';
    const note = document.createElement('p');
    note.className = 'taro-lt-thanks__note';
    note.textContent = THANKS_NOTE;
    const links = document.createElement('div');
    links.className = 'taro-lt-thanks__links';
    THANKS_LINKS.forEach(([label, href]) => {
      const a = document.createElement('a');
      a.className = 'taro-lt-thanks__link';
      a.href = href;
      a.textContent = label;
      links.appendChild(a);
    });
    panel.append(title, rule, note, links);

    const footerSig = document.querySelector('footer img');
    if (footerSig && footerSig.getAttribute('src')) {
      const sig = document.createElement('img');
      sig.src = footerSig.getAttribute('src');
      sig.alt = '';
      sig.setAttribute('aria-hidden', 'true');
      panel.appendChild(sig);
    }

    wrap.classList.add('taro-lt-sent');          // hide React's bare line
    // The sign-off under the form stands down: it is a closing gesture for a
    // form that is no longer there, and the panel carries the same signature.
    // Left in the DOM rather than removed, so a resubmission still has it.
    const signoff = block.querySelector('.taro-lt-signoff');
    if (signoff) signoff.style.display = 'none';
    block.appendChild(panel);
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');
    requestAnimationFrame(() => panel.classList.add('is-in'));
    panel.scrollIntoView({ block: 'center',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    return true;
  };

  dressThanks();
  // Never disconnected: submission can happen at any point in the visit.
  const thanksMo = new MutationObserver(() => { dressThanks(); });
  thanksMo.observe(document.body, { childList: true, subtree: true, characterData: true });

  const HOLD = 0.24;    // read it first: no fade before this
  const GONE = 0.92;    // fully dissolved by here
  const TRAVEL = 120;   // px the copy descends across the whole gesture
  const GROW = 0.05;    // how much it scales on the way down

  const sinkers = (() => {
    const hero = document.querySelector('section[data-section-id]');
    if (!hero) return [];
    return [...hero.querySelectorAll('.fe-block')]
      .filter((b) => b.textContent.trim().length > 2);
  })();

  if (sinkers.length) {
    sinkers.forEach((b) => b.classList.add('taro-lt-sink'));
    let span = 1;
    const smooth = (t) => t * t * (3 - 2 * t);
    const measure = () => {
      const hero = document.querySelector('section[data-section-id]');
      span = Math.max(1, (hero ? hero.getBoundingClientRect().height : 600) * 0.85);
    };
    let queued = false;
    const frame = () => {
      queued = false;
      const p = Math.max(0, Math.min(1, window.scrollY / span));
      const fade = p <= HOLD ? 0
        : smooth(Math.min(1, (p - HOLD) / Math.max(0.01, GONE - HOLD)));
      sinkers.forEach((b) => {
        b.style.setProperty('--taro-sink', `${(p * TRAVEL).toFixed(1)}px`);
        b.style.setProperty('--taro-sink-s', (1 + p * GROW).toFixed(3));
        b.style.setProperty('--taro-sink-o', (1 - fade).toFixed(3));
      });
    };
    const request = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
    measure();
    request();
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', () => { measure(); request(); });
    addEventListener('load', () => { measure(); request(); }, { once: true });
  }

  /* ---- the sign-off ----------------------------------------------------
   * The owner's signature already lives in the footer; this borrows the same
   * image and the same left-to-right mask that writes it on, so the form ends
   * in his hand rather than in a submit button. Driven by its own position in
   * the window, not by the page bottom the footer one uses.
   */
  const buildSignoff = () => {
    const block = document.querySelector('.sqs-block-form');
    const footerSig = document.querySelector('footer img');
    if (!block || !footerSig || !footerSig.getAttribute('src')) return false;
    if (block.querySelector('.taro-lt-signoff')) return true;

    const wrap = document.createElement('div');
    wrap.className = 'taro-lt-signoff';
    const line = document.createElement('p');
    line.className = 'taro-lt-signoff__line';
    line.textContent = 'Speak soon';
    const img = document.createElement('img');
    img.src = footerSig.getAttribute('src');
    img.alt = '';                     // decorative here; the footer one names him
    img.setAttribute('aria-hidden', 'true');
    img.loading = 'lazy';
    wrap.append(line, img);
    block.appendChild(wrap);

    const masks = CSS.supports('mask-image', 'linear-gradient(#000, #000)')
      || CSS.supports('-webkit-mask-image', 'linear-gradient(#000, #000)');
    if (!masks) return true;          // shown in full rather than risked

    const SOFT = 14;
    let queued = false;
    const paint = () => {
      queued = false;
      const r = img.getBoundingClientRect();
      if (!r.height) return;
      // Writes across as it travels the last third of the window.
      const start = window.innerHeight * 0.95;
      const end = window.innerHeight * 0.45;
      const t = Math.max(0, Math.min(1, (start - r.top) / Math.max(1, start - end)));
      const p = -SOFT + t * (100 + SOFT);
      img.style.setProperty('--taro-so-mask',
        'linear-gradient(to right, #000 ' + p.toFixed(1) + '%, transparent '
        + (p + SOFT).toFixed(1) + '%)');
    };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    ask();
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    return true;
  };
  if (!buildSignoff()) {
    const soMo = new MutationObserver(() => { if (buildSignoff()) soMo.disconnect(); });
    soMo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => soMo.disconnect(), 15000);
  }

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

    /* WHAT "DONE" IS ALLOWED TO MEAN.
     *
     * Only that every required field in the step has been answered. Steps with
     * nothing required never light up, and that is deliberate: this reports,
     * and a report that might be wrong is worse than no report at all on the
     * page the owner's work comes through.
     *
     * Two attempts came before that rule. Marking a step done when all its
     * fields had values made step 02 — three selects, nothing required —
     * arrive already complete, because a <select> nobody has touched still
     * reports a value. Switching to "anything past the first option" was worse
     * and quieter: these selects have no placeholder option at all. The first
     * option of "What are you looking for?" is Photography, while the control
     * displays "Select an option" — so choosing the very first item would have
     * been read as choosing nothing.
     *
     * Squarespace marks a required field with a .required class on the
     * form-item; the required attribute is not on the inputs.
     */
    const answered = (el) => (el.tagName === 'SELECT'
      // For a select, the only honest signal available is that it moved from
      // where it started, since its resting value is already a real option.
      ? el.value !== el.dataset.taroInitial
      : String(el.value || '').trim() !== '');

    const check = () => {
      groups.forEach(({ head, fields }) => {
        const req = fields.filter((f) => f.classList.contains('required'));
        if (!req.length) return;                    // nothing to be sure about
        const needed = req.flatMap((f) =>
          [...f.querySelectorAll('input, select, textarea')]
            .filter((el) => el.type !== 'hidden' && el.offsetParent !== null));
        if (!needed.length) return;
        head.classList.toggle('is-done', needed.every(answered));
      });
    };
    // Where each select started, so a change to it can be recognised later.
    [...list.querySelectorAll('select')].forEach((el) => {
      if (el.dataset.taroInitial === undefined) el.dataset.taroInitial = el.value;
    });
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

  /* ---- the light trail along the top ----------------------------------
   * Scroll advances it; answering the required questions advances it too, and
   * whichever is further is what shows — so somebody who fills the form without
   * scrolling still watches it complete. It glows when the last required answer
   * lands, which is the only moment on this page worth marking.
   */
  const trail = document.createElement('div');
  trail.className = 'taro-lt-trail';
  trail.innerHTML = '<div class="taro-lt-trail__fill"></div>';
  document.body.appendChild(trail);

  let trailQueued = false;
  const drawTrail = () => {
    trailQueued = false;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const byScroll = Math.min(1, window.scrollY / max);

    const required = [...document.querySelectorAll('.form-wrapper .field-list .form-item.required')];
    let byForm = 0;
    if (required.length) {
      const done = required.filter((f) => [...f.querySelectorAll('input, select, textarea')]
        .filter((el) => el.type !== 'hidden' && el.offsetParent !== null)
        .every((el) => String(el.value || '').trim() !== '')).length;
      byForm = done / required.length;
    }
    const p = Math.max(byScroll, byForm);
    trail.style.setProperty('--taro-trail', p.toFixed(4));
    trail.classList.toggle('is-done', required.length > 0 && byForm >= 1);
  };
  const askTrail = () => { if (!trailQueued) { trailQueued = true; requestAnimationFrame(drawTrail); } };
  addEventListener('scroll', askTrail, { passive: true });
  addEventListener('resize', askTrail);
  document.addEventListener('input', askTrail);
  document.addEventListener('change', askTrail);
  askTrail();

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
