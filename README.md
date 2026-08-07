# tarocroze.com — site add-ons

Custom JavaScript and CSS for [tarocroze.com](https://www.tarocroze.com), deployed by `git push`.

Squarespace 7.1 has no API for editing a site's content or code, so this repo works
around that: the site loads two files from GitHub Pages via a single one-time paste
into Code Injection. After that paste, Squarespace never needs to be opened again —
pushing to `main` updates the live site.

**No build step, no npm, no toolchain.** Native ES modules, served as-is.

---

## One-time setup

### 1. Upgrade the Squarespace plan to Core

Code Injection is gated behind Core. On Basic the two tags below are silently ignored.
Squarespace → **Settings → Billing & Plans → Change Plan → Core**.

### 2. Create the GitHub repo

Make a **public** repo named `site-addons`. Public matters: Pages on a private repo
needs a paid GitHub plan, and visitors' browsers have to fetch these files regardless,
so there is nothing to hide here. Then, from this directory:

```bash
git remote add origin https://github.com/tccroze/site-addons.git && git branch -M main && git push -u origin main
```

### 3. Turn on GitHub Pages

Repo → **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `root` → Save**.

Wait ~60 seconds, then confirm this loads in a browser:
`https://tccroze.github.io/site-addons/main.js`

### 4. Paste the snippet into Squarespace

Copy the two tags from [`SNIPPET.html`](SNIPPET.html) — the URLs are already filled in —
into Squarespace → **Settings → Developer Tools → Code Injection → HEADER** → Save.

Done. That is the last time the Squarespace editor is involved.

---

## The everyday workflow

1. Say what you want added.
2. It gets written here and pushed.
3. GitHub Pages redeploys in ~30 seconds; the change is live.

### Adding an add-on by hand

```bash
cp addons/_template.js addons/my-thing.js
```

Add one line to `main.js`:

```js
import './addons/my-thing.js';
```

Commit and push. Removing an add-on is the same in reverse — delete the import line.

### Local preview before pushing

ES modules will not load over `file://`, so serve the folder:

```bash
python3 -m http.server 8000 --directory "/Users/tarocroze/taro ws/site-addons"
```

Then open `http://localhost:8000/preview/`. The harness loads the exact same
`main.js` and `styles.css` the live site does, so a broken import or a thrown error
shows up here first.

---

## Layout

| Path | What it is |
|---|---|
| `main.js` | Entry point. One import line per add-on, plus the version string. |
| `styles.css` | Site-wide CSS. Use this instead of Squarespace's CSS editor. |
| `addons/` | One file per add-on, each self-contained including its own styles. |
| `addons/_template.js` | Starting point to copy. Never imported. |
| `lib/util.js` | Shared helpers: `defineAddon`, `css`, `ready`, `log`. |
| `preview/` | Local test harness. Not served to the live site in any meaningful way. |
| `SNIPPET.html` | The two tags to paste into Squarespace, once. |

Add-ons are registered through `defineAddon()`, which wraps each one in a
`try`/`catch`. A broken add-on logs a warning and the rest of the page carries on —
worth having when the code runs on a live site.

## Did it deploy?

Open the console on tarocroze.com. Every load prints:

```
[taro] ready — v1.0.0
[taro] ✓ scroll-progress
```

Bump `VERSION` in `main.js` when pushing something you want to confirm landed, then
check the number in the console.

GitHub Pages sends `Cache-Control: max-age=600`, so a browser may hold a stale copy
for up to ten minutes. Hard-refresh (`Cmd+Shift+R`) to bypass it.

## If something looks wrong on the live site

Two levers, in order of severity.

**1. Diagnose — is it us or Squarespace?**

Add `?taro=off` to any URL:

```
https://www.tarocroze.com/?taro=off
```

Every add-on stands down and you get the stock Squarespace site. If the problem
persists with the switch on, it is not our code.

**2. Disable everything, permanently**

Squarespace → Website → Website Tools → Code Injection → HEADER, delete the two
tags, Save. The site returns to stock immediately. Nothing else needs undoing —
the add-ons only ever add behaviour on top; they change no Squarespace content.

## Known limitations

- **Two heroes.** Squarespace ships a desktop and a mobile copy of some sections
  and hides one. Add-ons therefore skip elements with no box, and re-check on
  resize in case a breakpoint brings them into play.
- **Per-file caching.** Pages serves each file with `max-age=600`, independently.
  A visitor can pair a fresh `main.js` with a stale `lib/util.js`, so **never add
  a new export to `lib/util.js`** — an add-on importing a name the cached copy
  lacks fails to resolve and takes the whole module graph down. Declare one-off
  checks inside the add-on that needs them.
- **Touch devices run lighter**: no cursor, no parallax, no page transitions, and
  no blur in the reveals.

## Notes

- **The demo add-on is disposable.** `addons/scroll-progress.js` exists to prove the
  pipeline works end to end. Delete its import from `main.js` whenever.
- **Injected add-ons sit on top of the site, not inside it.** Anything that needs to
  become real Squarespace content — a blog post, a nav item, a product in `/shop` —
  still has to be created in the Squarespace editor. No workaround for that.
- **Keep Squarespace's Custom CSS editor empty** so styling only ever lives in one place.
