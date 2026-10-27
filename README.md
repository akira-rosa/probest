# Probest Workbench

A portable statistics and probability calculator. The finished app is **one HTML file**
([`dist/index.html`](dist/index.html)) that runs in any modern browser — no install, no internet connection.

Each page pairs the formula (general form and with your values substituted), an
interactive graph, and controls for the variables, so you can see how every input
changes the result. Available in English and Português (Brasil).

## Using the app

Open `dist/index.html` in a browser, or copy that one file anywhere (USB stick, email, shared drive).

## Pages

The app opens on a home page that lists every formula by topic. The sidebar has 21 formulas in
seven folders: descriptive statistics, probability, discrete random variables, continuous random
variables, estimation, hypothesis tests, and correlation and regression. Every page is a formula
and is named after it; pages not built yet show a placeholder. Ideas for later pages are in
[TODO.md](TODO.md) and stay out of the menu until they are built.

Built so far:

- **Sample size** (Estimation): the reference page for the format below. Mean or proportion,
  σ known or a pilot sample (t with n − 1 degrees of freedom), the p(1 − p) ≤ 1/4 bound, and the
  finite population correction n = N·n₀ / (N + n₀ − 1). Examples from Barbetta (Ex. 7.5),
  Bussab & Morettin (Ex. 10.13, 10.14) and the course slides.
- **Normal distribution** (Continuous random variables): density and cumulative graphs, probability
  below / above / between / outside, z-scores, inverse lookup, pinned curves. To be updated to the
  new format.

## Page format

Every calculator page follows the same structure, so students always know where to look.
The interactive part comes first:

1. **Title.**
2. **Graph, controls and result**: the graph can be dragged and zoomed; the result box shows the
   answer and the intermediate values.
3. **Formulas**: the general formula next to the same formula with the current values, updated live,
   followed by a table defining every variable in the formula with its current value
   (`varsTableHtml()` in `core/ui.js`).
4. **Sections** (`sectionsHtml()` in `core/ui.js`):
   - **About**: a short explanation of what the page calculates, then **Good to know**: rules and
     remarks from the books (rounding, assumptions, shortcuts).
   - **Examples**: worked examples from Barbetta, Bussab & Morettin or the course slides,
     loaded with one click, each showing its answer and source.
   - **In R**: the same calculation as R code with the current values, with a copy button.
   - **Sources**: book, section, equations and examples used.

`src/js/pages/sample-size.js` is the reference implementation: copy its structure for new pages.
The main sources are always Barbetta, Reis & Bornia (*Estatística para cursos de engenharia e
informática*) and Bussab & Morettin (*Estatística básica*), and notation follows them (γ, z<sub>γ</sub>, ε).

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
    page.css              shared page layout: formula panel, graph card, controls, result box
    pages/normal.css      normal distribution page
    pages/sample-size.css sample size page
    pages/placeholder.css "not built yet" page
    pages/home.css        home page
  js/
    core/app-info.js      app name, version, repository and license (shown in the footer)
    core/util.js          small helpers ($, clamp, trim, store…)
    core/i18n.js          translation engine: t(), setLang(), detectLang()
    core/format.js        number display/parsing per language (show, parseNum, fmtProb)
    core/numerics.js      maths: normal and Student's t (pdf, cdf, inverse), axis ticks
    core/mathml.js        builder for formulas (M.frac, M.sqrt, …)
    core/plot.js          canvas graph: pan, zoom, draggable markers, custom axis ticks
    core/ui.js            shared controls (numInput, setSlider, bindNudge) and page sections
                          (varsTableHtml, examplesHtml, codeHtml, sectionsHtml, bindCopy)
    locales/en.js         English strings
    locales/pt.js         Portuguese strings
    nav.js                sidebar folder tree (NAV), page registry (PAGES), tree helpers
    pages/normal.js       normal distribution page
    pages/sample-size.js  sample size (reference page for the format)
    pages/placeholder.js  page shown for entries not built yet
    pages/home.js         home page: what the app is and every formula by topic
    app.js                shell: sidebar, search, routing, theme, language, footer — loaded last
```

The scripts are plain browser scripts (not ES modules) so that `src/index.html` also works when opened
from disk. They share one global scope and load in the order listed in `src/index.html`; the build keeps
that order. Avoid reusing a top-level name in two files.

## Adding a page

1. **Sidebar:** add the page id inside a folder in `NAV` (`src/js/nav.js`). A folder is
   `{ folder: "<key>", items: [...] }` and can contain pages and other folders, to any depth.
   A new folder also needs a `"folder.<key>"` label in each locale file.
2. **Labels:** add `"nav.<id>"` and the page's strings to **both** `src/js/locales/en.js` and `pt.js`.
3. **Page code:** create `src/js/pages/<id>.js` that registers `PAGES["<id>"] = function (root) { … }`.
   It renders into `root` and may return a cleanup function. Read strings with `t("key")` and show
   numbers through `show()` so they get the right decimal separator. Reuse the layout classes from
   `styles/page.css` and the helpers in `core/ui.js`, and follow the page format above.
4. **Styles (optional):** add `src/styles/pages/<id>.css`.
5. **Register the files** with a `<script>` / `<link>` tag in `src/index.html` (pages go before `app.js`).

Entries in `NAV` without a registered page show the "not built yet" placeholder.

## Sidebar

The menu is a folder tree. Click a folder (or use → / ← on it) to open or close it; the button next to
the search box collapses or expands everything. Open folders are remembered, the folders around the
current page always open, and searching opens every folder with a match (searching a folder's name
lists all of its pages).

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

## Versioning

The version lives in two places that must match: `package.json` and `src/js/core/app-info.js`
(shown in the footer). The build stops with an error if they differ. Change the app name or the
repository link in `app-info.js` too.

## Browser support

Recent Chrome, Edge, Firefox and Safari (MathML Core support is required for formulas).

## License

[MIT](LICENSE) © 2026 L. Akira Rosa. The worked examples and formulas come from the books cited on each
page; the books themselves are not included.
