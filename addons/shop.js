// The shop, in the site's own voice — and the classes routed somewhere that works.
//
// TYPOGRAPHY. Every price and every Add to cart button in the shop renders in
// Cousine, a monospace, at Squarespace's default button size. It is the same
// fallback that made the Let's Talk submit button look unfinished, and here it
// is on the nine controls that take money: "from $95.00" and "Add to cart" set
// in a face that appears nowhere else on the site, directly beneath a product
// title set in the owner's display type. Nothing is wrong with the shop's
// mechanics — title, price, size and add-to-cart are all present and visible on
// the grid, on both desktop and phone — it simply does not look like his.
//
// THE CLASSES. The three Enquire buttons on /learn are mailto: links carrying
// the class in the subject line, which is thoughtful and fails badly: a visitor
// without a mail client configured taps and nothing happens at all, with no
// error and nowhere to go. They now open the enquiry form with the class
// already written into it, which works in every browser and asks the three
// qualifying questions — what, when, budget — that an email does not.
//
// The class name is read from the card it belongs to rather than written here,
// so renaming a class in the editor renames what arrives in the enquiry.

import { defineAddon, css, log } from '../lib/util.js';

const CREAM = '#f6eed5';
const INK = '#243230';
const RED = '#e23318';

defineAddon('shop', () => {
  /* ---- the classes -------------------------------------------------- */
  const classLinks = [...document.querySelectorAll('.tc-classes a[href^="mailto:"]')];
  classLinks.forEach((a) => {
    const card = a.closest('.tc-card');
    const title = card && card.querySelector('.tc-card__title, h3, h4');
    const name = title ? title.textContent.trim() : '';
    if (!name) return;
    a.setAttribute('href', `/letstalk?ref=${encodeURIComponent(`Camera class — ${name}`)}`);
    a.dataset.taroClass = name;
  });
  if (classLinks.length) log(`shop: ${classLinks.length} class enquiries routed to the form`);

  /* ---- the shop ------------------------------------------------------ */
  if (!document.querySelector('.product-list-item, .sqs-add-to-cart-button')) return;

  css('shop', `
    /* Squarespace sets these in Cousine at its own default size. font: inherit
       is not enough on its own here — the family, size and weight are all set
       separately — so each is named. */
    .product-list-title-price,
    .product-list-item-meta,
    .sqs-add-to-cart-button,
    .product-list-item select,
    .ProductItem-details .product-price,
    .ProductItem-details .sqs-add-to-cart-button {
      font-family: inherit !important;
    }

    /* The name, then the price under it. The price is the number someone is
       deciding on, so it stops being small grey afterthought text. */
    .product-list-item-meta .product-list-title-price {
      font-size: 0.95rem !important;
      letter-spacing: 0.01em;
      color: ${INK} !important;
    }
    .product-list-item-meta { gap: 0.15rem; }

    /* SCOPED TO THE GRID, deliberately. Applied to every add-to-cart button on
       the site, this shape broke the one on the product page: that button's
       wrapper computes to zero width, so padding and letter-spacing squeezed
       "Add to cart" into a 44px box that truncated to "ADD TO…". The grid
       buttons sit in a column that gives them room; the product page's does
       not, and it is the single control that takes the money, so it keeps
       Squarespace's own geometry and only gains the typeface.

       Outlined at rest so nine of them do not shout over the photographs, solid
       on hover so the one being considered is unmistakable. */
    .product-list-item .sqs-add-to-cart-button {
      font-size: 0.72rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.18em !important;
      text-transform: uppercase !important;
      color: ${RED} !important;
      background: transparent !important;
      border: 2px solid ${RED} !important;
      border-radius: 300px !important;
      padding: 0.85rem 1.9rem !important;
      min-height: 44px;
      cursor: pointer;
      transition: background 200ms ease, color 200ms ease, transform 220ms cubic-bezier(0.33, 1, 0.68, 1);
    }
    @media (hover: hover) {
      .product-list-item .sqs-add-to-cart-button:hover {
        background: ${RED} !important;
        color: ${CREAM} !important;
        transform: translateY(-2px);
      }
    }
    .product-list-item .sqs-add-to-cart-button:focus-visible {
      outline: 2px solid ${INK} !important;
      outline-offset: 3px;
    }
    /* The size control is part of the same decision; it should read as a
       control rather than as a leftover form field. */
    .product-list-item select,
    .ProductItem-details select {
      font-size: 0.9rem !important;
      border-radius: 6px !important;
      min-height: 44px;
    }
    /* Same rem trap as the class form: the root font is 16px on a phone, so
       0.72rem landed at 11.5px on the button that takes the money, and the
       product title at 13px. Set in px below the breakpoint. */
    @media (max-width: 799px) {
      .product-list-item .sqs-add-to-cart-button,
      .product-list-item .add-to-cart-text { font-size: 12.5px !important; }
      .product-list-item-title,
      .product-list-item-meta .product-list-title-price { font-size: 15px !important; }
    }

    @media (prefers-reduced-motion: reduce) {
      .product-list-item .sqs-add-to-cart-button { transition: none; }
      .product-list-item .sqs-add-to-cart-button:hover { transform: none; }
    }
  `);
});
