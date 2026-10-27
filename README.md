# Stats Workbench

A portable statistics and probability calculator that runs from a single HTML file.
Open `index.html` in any modern browser — no install, no build step, no internet connection needed.

Each page pairs the formula (general form and with your values substituted), an
interactive graph, and controls for the variables, so you can see how every input
changes the result.

## Using it

- **Locally:** double-click `index.html`.
- **Online:** enable GitHub Pages for this repository (Settings → Pages → deploy from the `main` branch, root folder) and the app is served at `https://<user>.github.io/<repo>/`.

## What's in it

| Section | Status |
| --- | --- |
| Normal distribution | Done |
| Everything else in the sidebar | Placeholder — formula list to be defined |

### Normal distribution
- Density and cumulative views, with draggable markers on the graph
- Probability below, above, between, or outside given values
- Live formulas with the current numbers substituted
- z-scores, variance, μ ± kσ shortcuts
- Inverse lookup (find x from a probability)
- Pin curves to compare parameter changes

## Languages

The app is available in **English** and **Português (Brasil)**: switch with the EN / PT buttons at the
bottom of the sidebar. The choice is remembered; on first open it follows the browser's language.
In Portuguese, numbers use a decimal comma, and number fields accept either `1,5` or `1.5`.

## How it's built

Everything lives in `index.html`: plain HTML, CSS and JavaScript with no dependencies.

- **Formulas** use MathML, which modern browsers render natively.
- **Graphs** are drawn on a `<canvas>` by a small reusable `Plot` class (pan, zoom, draggable handles).
- **Numerics** (`Num`): normal CDF (Hart / West double-precision approximation) and its inverse (Acklam + Halley refinement).

### Adding a page

1. Add the page id to a group in the `NAV` list, and its label as `"nav.<id>"` in both language blocks of `I18N`.
2. Register a page function under the same id: `PAGES.myId = function (root) { ...; return cleanup; }`.
   It receives the main element to render into and may return a cleanup function.
   Pages without a registered function show a "not built yet" placeholder.
3. Put every visible string in `I18N` (same key in `en` and `pt`) and read it with `t("key")`.
   Show numbers through `show()` so they get the right decimal separator.

### Adding a language

Copy the `en` block in `I18N`, translate the values, and add a button for it in `#langSeg`.

## Browser support

Recent Chrome, Edge, Firefox and Safari (MathML Core support is required for formulas).
