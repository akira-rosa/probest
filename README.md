# Stats Workbench

A portable statistics and probability calculator. The finished app is **one HTML file**
([`dist/index.html`](dist/index.html)) that runs in any modern browser — no install, no internet connection.

Each page pairs the formula (general form and with your values substituted), an
interactive graph, and controls for the variables, so you can see how every input
changes the result. Available in English and Português (Brasil).

## Using the app

Open `dist/index.html` in a browser, or copy that one file anywhere (USB stick, email, shared drive).

## Developing

The source is split into small files under `src/`. You don't need to build while working:
**open `src/index.html` directly in the browser** and refresh after each change.

When you're done, build the single file:

```sh
npm run build        # or: node build.js        -> dist/index.html
npm run watch        # or: node build.js --watch (rebuilds on every save)
```

The build needs only [Node.js](https://nodejs.org) 16 or newer — there are no packages to install.
`dist/index.html` is committed on purpose, so the latest app can be downloaded straight from GitHub.
Rebuild before committing.

## Project layout

```
build.js                  joins src/ into dist/index.html
package.json              npm run build / npm run watch
dist/index.html           the built app (generated — don't edit)
src/
  index.html              page skeleton + the list of styles and scripts, in load order
  styles/
    tokens.css            colours, fonts, light/dark themes
    base.css              reset, element defaults, shared typography
    components.css        buttons, segmented toggles, number fields, sliders
    shell.css             sidebar, mobile top bar, main area
    pages/normal.css      normal distribution page (template layout for new pages)
    pages/placeholder.css "not built yet" page
  js/
    core/util.js          small helpers ($, clamp, trim, store…)
    core/i18n.js          translation engine: t(), setLang(), detectLang()
    core/format.js        number display/parsing per language (show, parseNum, fmtProb)
    core/numerics.js      maths: normal pdf/cdf/inverse, axis ticks
    core/mathml.js        builder for formulas (M.frac, M.sqrt, …)
    core/plot.js          canvas graph: pan, zoom, draggable markers
    locales/en.js         English strings
    locales/pt.js         Portuguese strings
    nav.js                sidebar structure (NAV) and page registry (PAGES)
    pages/normal.js       normal distribution page
    pages/placeholder.js  page shown for entries not built yet
    app.js                shell: sidebar, search, routing, theme, language — loaded last
```

The scripts are plain browser scripts (not ES modules) so that `src/index.html` also works when opened
from disk. They share one global scope and load in the order listed in `src/index.html`; the build keeps
that order. Avoid reusing a top-level name in two files.

## Adding a page

1. **Sidebar:** add the page id to a group in `NAV` (`src/js/nav.js`).
2. **Labels:** add `"nav.<id>"` and the page's strings to **both** `src/js/locales/en.js` and `pt.js`.
3. **Page code:** create `src/js/pages/<id>.js` that registers `PAGES["<id>"] = function (root) { … }`.
   It renders into `root` and may return a cleanup function. Read strings with `t("key")` and show
   numbers through `show()` so they get the right decimal separator. `pages/normal.js` is the reference.
4. **Styles (optional):** add `src/styles/pages/<id>.css`.
5. **Register the files** with a `<script>` / `<link>` tag in `src/index.html` (pages go before `app.js`).

Entries in `NAV` without a registered page show the "not built yet" placeholder.

## Adding a language

Copy `src/js/locales/en.js` to `<code>.js` (e.g. `es.js`), change `I18N.en` to `I18N.<code>`, translate
the values, add its `<script>` tag to `src/index.html`, and add a button for it in `#langSeg`.

## How it works

- **Formulas** use MathML, which modern browsers render natively.
- **Graphs** are drawn on a `<canvas>` by the reusable `Plot` class.
- **Numerics:** normal CDF via the Hart / West double-precision approximation; its inverse via
  Acklam's algorithm with a Halley refinement step.
- **Languages:** the choice is remembered; on first open it follows the browser's language.
  In Portuguese, numbers use a decimal comma and number fields accept either `1,5` or `1.5`.

## Browser support

Recent Chrome, Edge, Firefox and Safari (MathML Core support is required for formulas).
