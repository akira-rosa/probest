# webR: R in the browser, offline

These files let the R console page run real R inside `dist/probest.html` with no internet.
They come unchanged from the [webR](https://github.com/r-wasm/webr) npm package,
version 0.6.0 (R 4.6.0); `versions.json` records the versions shown in the app.

`build.js` packs every file here (except this README, `LICENSE.md` and `versions.json`) into the
built page; `src/js/r/session.js` unpacks them when R starts.

## What is included

| Files | What they are |
|-------|---------------|
| `webr.js` | the webR library the page talks to (the build wraps it as a plain script) |
| `webr-worker.js`, `R.js`, `R.wasm` | R itself, running in a background worker |
| `libRblas.so`, `libRlapack.so` | linear algebra (used by `lm`, `solve`, …) |
| `vfs/…` | parts of R's file system loaded on demand: help pages, graphics fonts and encodings, `share/`, the `parallel` and `tcltk` package folders |

Left out to keep the file smaller: R's manuals and vignettes (`doc`), message translations,
the Noto TTF fonts (plots use the browser's fonts) and the GDAL/PROJ data for maps. If R looks
into one of these folders it finds it empty (the app answers with an empty file system image).

R's base packages come with R itself: base, stats, graphics, grDevices, utils, datasets,
methods, grid, splines, stats4, tools, compiler and parallel. Other packages (from CRAN) are
not available, since installing them needs the internet.

## Updating webR

1. `npm pack webr@<version>` and unpack it somewhere outside the repository.
2. Replace the files above with the ones from its `dist/` folder, keeping the same list
   (copy the same `vfs/` files; check the list with `git status`).
3. Update `versions.json` and this README.
4. `node build.js`, then open `dist/probest.html`, go to the R console and try a plot, `?mean`,
   `View(mtcars)` and a file upload.

## Licence

The webR binaries contain R and other GPL software and are distributed under the GNU GPL
version 3; webR's own code is MIT. See `LICENSE.md` (webR's licence file, unchanged).
Source code: https://github.com/r-wasm/webr (webR) and https://www.r-project.org (R).
