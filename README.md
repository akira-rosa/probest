## TLDR
Para utilizar basta baixar ([`dist/probest.html`](dist/probest.html)) e abrir em um navegador de sua escolha.
Simply download ([`dist/probest.html`](dist/probest.html)) and open it on a browser of your choice.

# Probest Workbench

A portable statistics and probability calculator. The finished app is **one HTML file**
([`dist/probest.html`](dist/probest.html)) that runs in any modern browser — no install, no internet connection.

Each page pairs the formula (general form and with your values substituted), an
interactive graph, and controls for the variables, so you can see how every input
changes the result. Available in English and Português (Brasil).

## Using the app

Open `dist/probest.html` in a browser, or copy that one file anywhere (USB stick, email, shared drive).

## Pages

The app opens on a home page that lists every formula by topic. The sidebar has 21 formulas in
seven folders: descriptive statistics, probability, discrete random variables, continuous random
variables, estimation, hypothesis tests, and correlation and regression. Every page is a formula
and is named after it, and all 21 are built. Ideas for later pages are in [TODO.md](TODO.md) and
stay out of the menu until they are built.

- **Arithmetic mean, standard deviation and quartiles** (Descriptive statistics): type or paste
  the data, then drag any point of the dot plot to change it. The mean is drawn as the balance
  point, the standard deviation as the band x̄ ± s with every deviation, and the quartiles as a box
  plot with the outliers. The standard deviation page divides by n − 1 or by n (Bussab & Morettin's
  var(X)); the quartiles follow Barbetta's (n + 1)/4 positions, the same as R's `type = 6`.
- **Confidence intervals for the mean and for a proportion** (Estimation): the sampling
  distribution centred on the estimate with the central area γ; drag the centre, or a limit to
  change the confidence level. z or t (n − 1 degrees of freedom), table rounding to 3 decimals, and
  an optional reference value (is 350 ml inside the interval?).
- **Tests for a mean and for a proportion** (Hypothesis tests): the distribution of the statistic
  under H₀ with the rejection region and the p-value area; drag the statistic to see the decision
  change. One- or two-sided, z or t, continuity correction for proportions, and Barbetta's table
  rounding (z to 2 decimals, areas to 4) so the p-values match the book.
- **Chi-square test of independence** (Hypothesis tests): an editable contingency table up to 6 × 6
  showing each cell's expected count and its share of q², the chi-square curve with the critical
  value, and Yates' correction for 2 × 2 tables.
- **Pearson's correlation coefficient and simple linear regression** (Correlation and regression):
  paired data typed one pair per line, a scatter plot whose points drag in both directions. The
  correlation page shows the quadrants around (x̄, ȳ) and the test of ρ = 0 with the smallest
  significant |r|; the regression page shows the least-squares line, the residuals or their squares,
  and a draggable prediction ŷ(x₀) with a warning when it extrapolates.
- **Sample size** (Estimation): the reference page for the format below. Mean or proportion,
  σ known or a pilot sample (t with n − 1 degrees of freedom), the p(1 − p) ≤ 1/4 bound, and the
  finite population correction n = N·n₀ / (N + n₀ − 1). Examples from Barbetta (Ex. 7.5),
  Bussab & Morettin (Ex. 10.13, 10.14).
- **Addition rule and conditional probability** (Probability): a Venn diagram whose areas are
  proportional to the probabilities, with an exact bar of the sample space underneath; drag a
  circle to change P(A ∩ B), or snap to mutually exclusive or independent events. Probabilities can
  be typed as fractions (1/6).
- **Bayes' theorem** (Probability): a mosaic with one column per event Eᵢ, as wide as P(Eᵢ) and
  filled up to P(F | Eᵢ), next to the bar of F split into the posteriors. Drag the levels and the
  dividers, click a column to pick Eⱼ; up to eight events.
- **Expected value** (Discrete random variables): E(X), V(X) and σ of any distribution typed as a
  table; drag a bar to change its probability. Y = aX + b shows E(aX + b) = aE(X) + b and
  V(aX + b) = a²V(X).
- **Binomial, hypergeometric and Poisson distributions** (Discrete random variables): bar graph
  or cumulative steps; P(X = x), P(X ≤ x), P(X ≥ x) and P(a ≤ X ≤ b) with every term written out,
  mean and variance, inverse lookup and pinned curves for comparison.
- **Uniform, exponential and normal distributions** (Continuous random variables): density or
  cumulative graph with the shaded area; probability below / above / between / outside, inverse
  lookup and pinned curves. The normal page can round z to 2 decimals and the tail area to 4, as
  in Barbetta's Table 3, so the answers match the book.

The six distribution pages share one template, `core/distpage.js`: each page in `pages/dist/` only
gives its parameters, formulas, functions and examples. The data pages share `core/datapage.js`
(data box, dot plot with draggable points) in the same way, with their configs in `pages/desc/`.
The addition rule and conditional probability share `core/vennpage.js`; diagrams that are not x–y
graphs use the `Board` canvas in `core/board.js`. The two interval pages share `core/cipage.js` and
the two one-sample tests share `core/testpage.js`, and the paired-data pages share `core/pairpage.js`.

## Page format

Every calculator page follows the same structure, so students always know where to look.
The interactive part comes first:

1. **Title.**
2. **Graph, controls and result**: the graph can be dragged and zoomed; the result box shows the
   answer and the intermediate values.
3. **Formulas**: the general formula next to the same formula with the current values, updated live
   (values from the controls in blue with `M.v()`, results in bold with `M.r()`, constants unchanged),
   followed by a table defining every variable in the formula with its current value
   (`varsTableHtml()` in `core/ui.js`).
4. **Sections** (`sectionsHtml()` in `core/ui.js`):
   - **About**: a short explanation of what the page calculates, then **Good to know**: rules and
     remarks from the books (rounding, assumptions, shortcuts).
   - **Examples**: worked examples, mostly from Barbetta and Bussab & Morettin,
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
npm run build        # or: node build.js        -> dist/probest.html
npm run watch        # or: node build.js --watch (rebuilds on every save)
node build.js --pretty                         # same file, not minified (for debugging)
```

The build needs only [Node.js](https://nodejs.org) 16 or newer — there are no packages to install.

The built file is minified to keep it light (about 340 KB instead of 460 KB). `minify.js` removes comments
and whitespace and gives variables, parameters and functions short names, using the JavaScript parser that
comes with Node. Property names, strings and the logic are not touched, so the app works exactly the same;
the files in `src/` are never changed. If the short names can't be made (for example on an unusual Node
build), the build says so and writes the file with the long names, which also works. To read or debug
the built code, use `--pretty`.

`dist/probest.html` is committed on purpose, so the latest app can be downloaded straight from GitHub.
Rebuild before committing.

## Project layout

```
build.js                  joins src/ into dist/probest.html
minify.js                 minifies the built CSS and JS (used by build.js)
package.json              npm run build / npm run watch
dist/probest.html         the built app (generated — don't edit)
src/
  index.html              page skeleton + the list of styles and scripts, in load order
  styles/
    fonts.css             Inria Serif Bold for the app name, embedded (generated: see below)
    tokens.css            colours, fonts, light/dark themes
    base.css              reset, element defaults, shared typography
    components.css        buttons, segmented toggles, number fields, sliders
    shell.css             sidebar, mobile top bar, main area
    page.css              shared page layout: formula panel, graph card, controls, result box
    pages/data.css        data pages (data box, ordered values, quartile results)
    pages/prob.css        probability pages (event tables, Venn, Y = aX + b)
    pages/infer.css       intervals and tests (decision, contingency table)
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
    core/distpage.js      template for the distribution pages (graph, modes, formulas, R code)
    core/datapage.js      template for the data pages (data box, dot plot, Desc helpers)
    core/board.js         canvas for diagrams (Venn, mosaic) and fraction input (parseProb)
    core/vennpage.js      template for the two-event Venn pages
    core/cipage.js        template for the confidence interval pages
    core/testpage.js      template for the one-sample test pages
    core/pairpage.js      template for the paired-data pages (pairs box, scatter plot)
    core/ui.js            shared controls (numInput, setSlider, bindNudge) and page sections
                          (varsTableHtml, examplesHtml, codeHtml, sectionsHtml, bindCopy)
    locales/en.js         English strings
    locales/pt.js         Portuguese strings
    nav.js                sidebar folder tree (NAV), page registry (PAGES), tree helpers
    pages/desc/*.js       arithmetic mean, standard deviation, quartiles
    pages/prob/*.js       addition rule, conditional probability, Bayes' theorem
    pages/expected-value.js expected value and variance of a discrete variable
    pages/est/*.js        confidence intervals for the mean and for a proportion
    pages/tests/*.js      tests for a mean and a proportion, chi-square test of independence
    pages/reg/*.js        correlation, linear regression and their shared data sets
    pages/dist/*.js       binomial, hypergeometric, Poisson, uniform, exponential, normal
    pages/sample-size.js  sample size (reference page for the format)
    pages/placeholder.js  page shown for entries not built yet
    pages/home.js         home page: the app name and every formula by topic
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
  Acklam's algorithm with a Halley refinement step. Student's t through the regularized incomplete
  beta function, chi-square through the regularized incomplete gamma function; binomial coefficients through log-gamma, so large n stays accurate.
- **Languages:** the choice is remembered; on first open it follows the browser's language.
  In Portuguese, numbers use a decimal comma and number fields accept either `1,5` or `1.5`.

## Versioning

The version lives in two places that must match: `package.json` and `src/js/core/app-info.js`
(shown in the footer). The build stops with an error if they differ. Change the app name or the
repository link in `app-info.js` too.

## Brand font

The app name is set in **Inria Serif Bold**, embedded in `src/styles/fonts.css` as a WOFF2 data URI
so the single file needs no internet connection. It is subset to Basic Latin (U+0020–007E), about
13 KB. To regenerate it, take `inria-serif-latin-700-normal.woff2` from the `@fontsource/inria-serif`
npm package and run
`pyftsubset <file> --unicodes="U+0020-007E" --flavor=woff2 --output-file=out.woff2`, then base64 it
into the `src:` line.

## Browser support

Recent Chrome, Edge, Firefox and Safari (MathML Core support is required for formulas).

## License

[MIT](LICENSE) © 2026 L. Akira Rosa. Inria Serif is © 2017 The Inria Serif Project Authors, used under
the [SIL Open Font License 1.1](src/fonts/OFL-InriaSerif.txt). The worked examples and formulas come from the books cited on each
page; the books themselves are not included.
