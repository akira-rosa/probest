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

## How it's built

Everything lives in `index.html`: plain HTML, CSS and JavaScript with no dependencies.

- **Formulas** use MathML, which modern browsers render natively.
- **Graphs** are drawn on a `<canvas>` by a small reusable `Plot` class (pan, zoom, draggable handles).
- **Numerics** (`Num`): normal CDF (Hart / West double-precision approximation) and its inverse (Acklam + Halley refinement).

### Adding a page

1. Add an entry to the `NAV` list (sidebar group, id, label).
2. Register a page function under the same id: `PAGES.myId = function (root) { ...; return cleanup; }`.
   It receives the main element to render into and may return a cleanup function.
   Pages without a registered function show a "not built yet" placeholder.

## Browser support

Recent Chrome, Edge, Firefox and Safari (MathML Core support is required for formulas).
