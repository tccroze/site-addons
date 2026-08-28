// A booking enquiry built for classes, not borrowed from the commissions form.
//
// Until now the three Enquire buttons were mailto: links carrying the class in
// the subject, and briefly they pointed at /letstalk — which asks what you are
// looking for, when you need it and what your budget is. Those are the right
// questions for a wedding and the wrong ones for somebody who wants to learn
// how their camera works. What a teacher needs to know before a class is where
// this person is starting from, what they want to be able to do, what they will
// be holding, and when they are free.
//
// WHERE IT SENDS. Into the Form block on /learn, which is a real Squarespace
// form with its own inbox: the answers are written into its Name, Email,
// Subject and Message fields and it is submitted for the visitor. That block is
// hidden from view, because two forms asking the same person the same thing is
// worse than one — but it is hidden, never removed, so it still validates,
// still submits and still records the enquiry exactly as Squarespace expects.
//
// Its inputs are React-controlled, so each value goes in through the native
// setter followed by an input event. Assigning .value directly updates the DOM
// node and leaves React's state untouched: the text appears, vanishes on the
// next render, and never reaches the submission.
//
// If that block is ever removed the form falls back to composing the enquiry
// into the visitor's mail client, and shows it on the page with a copy button
// either way — a handoff that silently fails should not cost an enquiry.
//
// UPCOMING DATES are read from the page, not written here: any text block that
// begins "Dates:" becomes the list of dates people can pick from. Nothing to
// edit in code, and if there is no such block the question falls back to
// weekdays or weekends.

import { defineAddon, css, log } from '../lib/util.js';

const EMAIL = 'create@tarocroze.com';
const CREAM = '#f6eed5';
const INK = '#243230';
const RED = '#e23318';

// Questions the owner asked for, plus four he did not, each earning its place:
//   camera to bring — decides whether a class needs a loan body, and it is the
//     one logistical fact that can stop a booking on the day;
//   what they want to photograph — lets a 2.5 hour class be about their subject
//     rather than a syllabus;
//   what keeps going wrong — the single most useful sentence a teacher can have
//     in advance, and the one that makes the reply feel like a person wrote it;
//   how they heard — the same question the commissions form asks, so the two
//     sources stay comparable.
const STEPS = [
  { n: '01', title: 'Which class', fields: [
    { k: 'class', label: 'Class', type: 'radio', required: true, options: [] },
  ] },
  { n: '02', title: 'Where you are starting', fields: [
    { k: 'level', label: 'Your level', type: 'radio', required: true, options: [
      'I have never shot in manual',
      'I know the basics but it is inconsistent',
      'I am confident and want to sharpen',
    ] },
    { k: 'goal', label: 'What do you want to be able to do afterwards?', type: 'textarea',
      required: true, placeholder: 'Shoot my own product photos, film my kids properly, stop guessing at exposure…' },
    { k: 'subject', label: 'What do you most want to photograph?', type: 'select', options: [
      'People and portraits', 'Wildlife', 'Landscape', 'Product and interiors',
      'Events', 'Family and everyday', 'Not sure yet',
    ] },
    { k: 'trouble', label: 'Anything that keeps going wrong? (optional)', type: 'textarea',
      placeholder: 'Blurry in low light, colours look off, autofocus misses…' },
  ] },
  { n: '03', title: 'What you will be shooting on', fields: [
    { k: 'system', label: 'Camera system', type: 'select', required: true, options: [
      'Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic / Lumix', 'Olympus / OM System',
      'Phone only', 'Not sure', 'Other',
    ] },
    { k: 'body', label: 'Model, if you know it (optional)', type: 'text', placeholder: 'R6, A7 III, X-T4…' },
    { k: 'bring', label: 'Do you have a camera to bring?', type: 'radio', required: true, options: [
      'Yes, my own', 'No — I would need to borrow one', 'I am about to buy one and want advice',
    ] },
  ] },
  { n: '04', title: 'When you are free', fields: [
    { k: 'dates', label: 'Dates that suit', type: 'checkbox', options: [] },
    { k: 'notes', label: 'Anything else about timing? (optional)', type: 'text',
      placeholder: 'Mornings are better, away until the 12th…' },
  ] },
  { n: '05', title: 'How to reach you', fields: [
    { k: 'first', label: 'First name', type: 'text', required: true, autocomplete: 'given-name' },
    { k: 'last', label: 'Last name', type: 'text', required: true, autocomplete: 'family-name' },
    { k: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' },
    { k: 'phone', label: 'Phone (optional)', type: 'tel', autocomplete: 'tel' },
    { k: 'heard', label: 'How did you hear about the classes?', type: 'select', options: [
      'Instagram', 'Word of mouth', 'Google', 'I know Taro', 'Other',
    ] },
  ] },
];

const FALLBACK_DATES = ['Weekdays', 'Weekends', 'Either works'];

defineAddon('class-form', () => {
  const host = document.querySelector('.tc-classes');
  if (!host) return;

  const classNames = [...host.querySelectorAll('.tc-card')]
    .map((c) => (c.querySelector('.tc-card__title, h3, h4') || {}).textContent)
    .map((t) => (t || '').trim())
    .filter(Boolean);
  if (!classNames.length) return;
  STEPS[0].fields[0].options = classNames.concat('Not sure — help me choose');

  /* Dates come from the page so they can be changed without touching code: any
   * text block starting "Dates:" is read as the list, separated by · , or |. */
  const dateSource = [...document.querySelectorAll('.sqs-html-content p, .sqs-html-content li')]
    .map((el) => (el.textContent || '').trim())
    .find((t) => /^dates\s*:/i.test(t));
  const dates = dateSource
    ? dateSource.replace(/^dates\s*:/i, '').split(/[·|,]/).map((d) => d.trim()).filter(Boolean)
    : [];
  STEPS[3].fields[0].options = (dates.length ? dates : FALLBACK_DATES).concat(
    dates.length ? ['None of these — ask me'] : []);

  css('class-form', `
    .taro-cf { margin: clamp(3rem,8vw,5rem) 0 0; }
    .taro-cf__intro { max-width: 34rem; margin: 0 0 2rem; }
    .taro-cf__eyebrow {
      font-size: .7rem; font-weight: 700; letter-spacing: .2em; text-transform: uppercase;
      color: rgba(36,50,48,.6); margin: 0 0 .7rem;
    }
    .taro-cf__title { font-size: clamp(1.8rem,5vw,3rem); line-height: 1.02; margin: 0 0 .8rem; color: ${INK}; }
    .taro-cf__rule { width: 4.5rem; height: 3px; background: ${RED}; margin: 0 0 1.1rem; }
    .taro-cf__lede { font-size: 1.02rem; line-height: 1.6; color: rgba(36,50,48,.8); margin: 0; }

    .taro-cf__form { max-width: 46rem; }
    .taro-cf__step { display: grid; grid-template-columns: auto auto 1fr; align-items: center;
      gap: 0 .85rem; margin: 2.6rem 0 1.15rem; }
    .taro-cf__step:first-of-type { margin-top: 0; }
    .taro-cf__no { font-size: .72rem; font-weight: 700; letter-spacing: .12em;
      font-variant-numeric: tabular-nums; color: ${RED}; border: 1.5px solid ${RED};
      border-radius: 50%; width: 2rem; height: 2rem; display: grid; place-items: center; }
    .taro-cf__step-label { font-size: .72rem; font-weight: 700; letter-spacing: .18em;
      text-transform: uppercase; color: ${INK}; white-space: nowrap; }
    .taro-cf__line { height: 1px; background: rgba(36,50,48,.22); }

    .taro-cf__field { margin: 0 0 1.5rem; }
    .taro-cf__label { display: block; font-size: .7rem; font-weight: 700; letter-spacing: .15em;
      text-transform: uppercase; color: rgba(36,50,48,.72); margin: 0 0 .5rem; }
    .taro-cf input[type=text], .taro-cf input[type=email], .taro-cf input[type=tel],
    .taro-cf select, .taro-cf textarea {
      width: 100%; font: inherit; font-size: 1rem; color: ${INK};
      background: rgba(251,246,230,.92); border: 1.5px solid rgba(36,50,48,.30);
      border-radius: 6px; padding: .8rem .9rem; min-height: 48px;
      transition: border-color 160ms ease, box-shadow 160ms ease;
    }
    .taro-cf textarea { min-height: 6.5rem; resize: vertical; line-height: 1.5; }
    .taro-cf input:focus, .taro-cf select:focus, .taro-cf textarea:focus {
      outline: none; border-color: ${RED}; box-shadow: 0 0 0 3px rgba(226,51,24,.14);
    }
    .taro-cf__opts { display: flex; flex-wrap: wrap; gap: .5rem; }
    .taro-cf__opt { position: relative; }
    .taro-cf__opt input { position: absolute; opacity: 0; width: 100%; height: 100%;
      left: 0; top: 0; margin: 0; cursor: pointer; }
    .taro-cf__opt span { display: block; padding: .7rem 1.1rem; min-height: 44px;
      display: flex; align-items: center;
      font-size: .9rem; border: 1.5px solid rgba(36,50,48,.28); border-radius: 300px;
      background: rgba(251,246,230,.6); cursor: pointer;
      transition: border-color 160ms ease, background 160ms ease, color 160ms ease; }
    .taro-cf__opt input:checked + span { border-color: ${RED}; background: ${RED}; color: ${CREAM}; }
    .taro-cf__opt input:focus-visible + span { outline: 2px solid ${INK}; outline-offset: 3px; }
    .taro-cf__two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
    @media (max-width: 560px) { .taro-cf__two { grid-template-columns: 1fr; } }
    /* Labels were set in rem, and the root font is 16px on a phone against 18px
       on a desktop — so 0.7rem arrived at 11.2px, which is too small for
       letterspaced uppercase on a screen held at arm's length. Set in px below
       the breakpoint so the size is the size. */
    @media (max-width: 799px) {
      .taro-cf__label { font-size: 12.5px; letter-spacing: 0.12em; }
      .taro-cf__step-label { font-size: 12.5px; letter-spacing: 0.14em; }
      .taro-cf__eyebrow { font-size: 12px; }
      .taro-cf__opt span { font-size: 15px; }
      .taro-cf__send { font-size: 13px; }
      .taro-cf__copy { font-size: 12.5px; }
    }

    .taro-cf__send {
      display: block; width: 100%; margin-top: 2rem;
      font: inherit; font-size: .8rem; font-weight: 700; letter-spacing: .18em;
      text-transform: uppercase; color: ${CREAM}; background: ${RED};
      border: 2px solid ${RED}; border-radius: 300px; padding: 1.05rem 2rem;
      cursor: pointer; transition: background 200ms ease, transform 220ms cubic-bezier(.33,1,.68,1);
    }
    @media (hover: hover) { .taro-cf__send:hover { background: ${INK}; border-color: ${INK}; transform: translateY(-2px); } }
    .taro-cf__send:focus-visible { outline: 2px solid ${INK}; outline-offset: 3px; }
    .taro-cf__err { color: ${RED}; font-size: .88rem; margin: .8rem 0 0; }

    .taro-cf__done { border: 1px solid rgba(36,50,48,.2); background: rgba(251,246,230,.7);
      padding: 1.5rem; margin-top: 1.5rem; }
    .taro-cf__done h3 { font-size: 1.15rem; margin: 0 0 .5rem; color: ${INK}; }
    .taro-cf__done p { font-size: .95rem; color: rgba(36,50,48,.8); margin: 0 0 .9rem; }
    .taro-cf__summary { font-family: ui-monospace, Menlo, monospace; font-size: .78rem;
      white-space: pre-wrap; background: rgba(36,50,48,.05); border-left: 2px solid ${RED};
      padding: .9rem 1rem; margin: 0 0 1rem; max-height: 16rem; overflow: auto; }
    .taro-cf__copy { font: inherit; font-size: .72rem; font-weight: 700; letter-spacing: .16em;
      text-transform: uppercase; color: ${INK}; background: none;
      border: 1.5px solid rgba(36,50,48,.35); border-radius: 300px;
      padding: .7rem 1.5rem; min-height: 44px; cursor: pointer; }
    .taro-cf__copy:focus-visible { outline: 2px solid ${RED}; outline-offset: 3px; }
    @media (prefers-reduced-motion: reduce) {
      .taro-cf__send, .taro-cf__opt span, .taro-cf input { transition: none; }
      .taro-cf__send:hover { transform: none; }
    }
  `);

  /* ---- build ---------------------------------------------------------- */
  const wrap = document.createElement('section');
  wrap.className = 'taro-cf';
  wrap.id = 'class-enquiry';

  const intro = document.createElement('div');
  intro.className = 'taro-cf__intro';
  const eb = document.createElement('p');
  eb.className = 'taro-cf__eyebrow'; eb.textContent = 'Book a class';
  const h = document.createElement('h2');
  h.className = 'taro-cf__title'; h.textContent = 'Tell me where you are starting';
  const rule = document.createElement('div'); rule.className = 'taro-cf__rule';
  const lede = document.createElement('p');
  lede.className = 'taro-cf__lede';
  lede.textContent = 'A few questions so the day is built around what you actually want to do, '
    + 'rather than a syllabus. Takes about a minute.';
  intro.append(eb, h, rule, lede);

  const form = document.createElement('form');
  form.className = 'taro-cf__form';
  form.noValidate = true;

  const mk = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };

  STEPS.forEach((step) => {
    const head = mk('div', 'taro-cf__step');
    head.append(mk('span', 'taro-cf__no', step.n),
                mk('span', 'taro-cf__step-label', step.title),
                mk('span', 'taro-cf__line'));
    form.appendChild(head);

    const pair = [];
    step.fields.forEach((f) => {
      const box = mk('div', 'taro-cf__field');
      const id = `taro-cf-${f.k}`;
      const lab = mk('label', 'taro-cf__label', f.label + (f.required ? ' *' : ''));
      lab.setAttribute('for', id);
      box.appendChild(lab);

      if (f.type === 'radio' || f.type === 'checkbox') {
        const group = mk('div', 'taro-cf__opts');
        group.setAttribute('role', f.type === 'radio' ? 'radiogroup' : 'group');
        group.setAttribute('aria-labelledby', `${id}-label`);
        lab.id = `${id}-label`;
        lab.removeAttribute('for');
        f.options.forEach((opt, i) => {
          const o = mk('label', 'taro-cf__opt');
          const inp = document.createElement('input');
          inp.type = f.type; inp.name = f.k; inp.value = opt;
          if (i === 0 && f.type === 'radio') inp.id = id;
          o.append(inp, mk('span', null, opt));
          group.appendChild(o);
        });
        box.appendChild(group);
      } else if (f.type === 'select') {
        const sel = document.createElement('select');
        sel.id = id; sel.name = f.k;
        sel.appendChild(new Option('Select an option', ''));
        f.options.forEach((o) => sel.appendChild(new Option(o, o)));
        box.appendChild(sel);
      } else if (f.type === 'textarea') {
        const ta = document.createElement('textarea');
        ta.id = id; ta.name = f.k;
        if (f.placeholder) ta.placeholder = f.placeholder;
        box.appendChild(ta);
      } else {
        const inp = document.createElement('input');
        inp.type = f.type; inp.id = id; inp.name = f.k;
        if (f.placeholder) inp.placeholder = f.placeholder;
        if (f.autocomplete) inp.autocomplete = f.autocomplete;
        box.appendChild(inp);
      }

      // First and last name sit side by side; everything else is full width.
      if (f.k === 'first' || f.k === 'last') pair.push(box);
      else form.appendChild(box);
    });
    if (pair.length === 2) {
      const row = mk('div', 'taro-cf__two');
      row.append(pair[0], pair[1]);
      form.insertBefore(row, form.querySelector(`#taro-cf-email`)?.closest('.taro-cf__field') || null);
    }
  });

  const send = mk('button', 'taro-cf__send', 'Send my enquiry');
  send.type = 'submit';
  const err = mk('p', 'taro-cf__err');
  err.setAttribute('role', 'alert');
  form.append(send, err);

  const done = mk('div', 'taro-cf__done');
  done.hidden = true;
  done.setAttribute('role', 'status');
  done.setAttribute('aria-live', 'polite');

  wrap.append(intro, form, done);
  host.appendChild(wrap);
  log('class-form: booking enquiry built');

  /* ---- the real form, filled and submitted on the visitor's behalf ------ */
  /* Squarespace renders the form block after this add-on runs, so looking for
   * it once at start-up finds nothing and leaves two forms on the page asking
   * the same person the same questions. It is looked up when needed, and taken
   * out of view as soon as it appears. */
  const findBlock = () => [...document.querySelectorAll('.sqs-block-form')]
    .find((b) => b.querySelector('form')) || null;

  const hideBlock = () => {
    const b = findBlock();
    if (!b || b.dataset.taroBound) return false;
    b.dataset.taroBound = '1';
    b.setAttribute('aria-hidden', 'true');
    // Taken off the page, never removed: it still validates and still submits.
    b.style.position = 'absolute';
    b.style.width = '1px';
    b.style.height = '1px';
    b.style.overflow = 'hidden';
    b.style.clip = 'rect(0 0 0 0)';
    b.style.whiteSpace = 'nowrap';
    b.style.pointerEvents = 'none';
    log('class-form: bound to the form block on this page');
    return true;
  };

  if (!hideBlock()) {
    const blockMo = new MutationObserver(() => { if (hideBlock()) blockMo.disconnect(); });
    blockMo.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => blockMo.disconnect(), 20000);
  }

  /** React owns these inputs; only the native setter reaches its state. */
  const setNative = (el, v) => {
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, v); else el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const submitViaBlock = (subject, body, first, last, email) => {
    const block = findBlock();
    if (!block) return false;
    const item = (re) => [...block.querySelectorAll('.field-list > .form-item')]
      .find((f) => re.test((f.querySelector('.title, .caption') || {}).textContent || ''));
    const nameItem = item(/name/i);
    const names = nameItem ? [...nameItem.querySelectorAll('input')] : [];
    const emailEl = (item(/email/i) || block).querySelector('input[type="email"], input');
    const subjEl = (item(/subject/i) || {}).querySelector?.('input');
    const msgEl = block.querySelector('textarea');
    if (!emailEl || !msgEl) return false;

    if (names[0]) setNative(names[0], first || 'Class');
    if (names[1]) setNative(names[1], last || 'enquiry');
    setNative(emailEl, email);
    if (subjEl) setNative(subjEl, subject);
    setNative(msgEl, body);

    const btn = block.querySelector('.form-submit-button, [type="submit"]');
    if (!btn) return false;
    btn.click();
    return true;
  };

  /* ---- compose and send ------------------------------------------------ */
  const value = (k) => {
    const nodes = [...form.querySelectorAll(`[name="${k}"]`)];
    if (!nodes.length) return '';
    if (nodes[0].type === 'radio' || nodes[0].type === 'checkbox') {
      return nodes.filter((n) => n.checked).map((n) => n.value).join(', ');
    }
    return (nodes[0].value || '').trim();
  };

  const REQUIRED = [];
  STEPS.forEach((s) => s.fields.forEach((f) => { if (f.required) REQUIRED.push([f.k, f.label]); }));

  const compose = () => {
    const lines = [];
    STEPS.forEach((step) => {
      const rows = step.fields
        .map((f) => [f.label.replace(/ \(optional\)$/, ''), value(f.k)])
        .filter(([, v]) => v);
      if (!rows.length) return;
      lines.push(step.title.toUpperCase());
      rows.forEach(([l, v]) => lines.push(`  ${l}: ${v}`));
      lines.push('');
    });
    return lines.join('\n').trim();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = REQUIRED.filter(([k]) => !value(k));
    const email = value('email');
    if (missing.length) {
      err.textContent = `Still needed: ${missing.map(([, l]) => l.replace(' *', '')).join(', ')}.`;
      const first = form.querySelector(`[name="${missing[0][0]}"]`);
      first?.focus();
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      err.textContent = 'That email address does not look right — could you check it?';
      form.querySelector('[name="email"]').focus();
      return;
    }
    err.textContent = '';

    const summary = compose();
    const subject = `Camera class — ${value('class') || 'enquiry'}`;
    const body = `${summary}\n\n— sent from tarocroze.com/learn`;

    // Into the real form if there is one; otherwise the mail client.
    const sent = submitViaBlock(subject, body, value('first'), value('last'), email);

    form.hidden = true;
    done.hidden = false;
    done.innerHTML = '';
    const t = mk('h3', null, sent ? 'Sent — thank you' : 'Your enquiry is ready');
    const p1 = mk('p', null, sent
      ? 'That has come straight through to me. I read every one of these and will come back to you shortly. A copy is below if you want it.'
      : `Your mail app should have opened with this already written. If it did not, copy it below and send it to ${EMAIL} — it will reach me either way.`);
    const pre = mk('div', 'taro-cf__summary', `To: ${EMAIL}\nSubject: ${subject}\n\n${body}`);
    const copy = mk('button', 'taro-cf__copy', 'Copy enquiry');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(`${subject}\n\n${body}`);
        copy.textContent = 'Copied';
      } catch (_) {
        const r = document.createRange();
        r.selectNodeContents(pre);
        const sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r);
        copy.textContent = 'Selected — press ⌘C';
      }
    });
    done.append(t, p1, pre, copy);
    done.scrollIntoView({ block: 'center',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

    // Only when there was no form block to submit into. The page already shows
    // the whole enquiry, so a mail client that never opens cannot lose it.
    if (!sent) {
      window.location.href =
        `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  });

  /* Arriving from a class card selects that class and jumps to the form. */
  host.querySelectorAll('.tc-card .tc-btn').forEach((btn) => {
    const card = btn.closest('.tc-card');
    const name = (card.querySelector('.tc-card__title, h3, h4') || {}).textContent?.trim();
    if (!name) return;
    btn.setAttribute('href', '#class-enquiry');
    btn.addEventListener('click', () => {
      const hit = [...form.querySelectorAll('[name="class"]')].find((i) => i.value === name);
      if (hit) { hit.checked = true; hit.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  });
});
