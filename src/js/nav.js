"use strict";
/* ============================================================
   Navigation tree — edit this as formulas get added.

   A node is either a page id ("normal") or a folder:
     { folder: "<key>", items: [ ...nodes ] }
   Folders can be nested to any depth.
   Labels come from the locale files: "folder.<key>" and "nav.<id>".
   Pages with an entry in PAGES are live; the rest show a placeholder.
   ============================================================ */
const NAV = [
  { folder: "descriptive", items: ["mean", "standard-deviation", "quartiles"] },
  { folder: "probability", items: ["addition-rule", "conditional-probability", "bayes"] },
  { folder: "discrete",    items: ["expected-value", "binomial", "hypergeometric", "poisson"] },
  { folder: "continuous",  items: ["uniform", "exponential", "normal"] },
  { folder: "estimation",  items: ["ci-mean", "ci-proportion", "sample-size"] },
  { folder: "tests",       items: ["test-mean", "test-proportion", "chi-square"] },
  { folder: "regression",  items: ["correlation", "linear-regression"] },
];
/* Pages planned for later are listed in TODO.md, not here, so they stay out of the menu. */
const PAGES = {};          // id -> (root) => cleanup fn
const HOME = "home";       // landing page: shown for an empty address and when clicking the app name
const DEFAULT_PAGE = HOME;

/* ---------- tree helpers ---------- */
/* Folders are identified by their path, e.g. "distributions/continuous". */
const isFolder = n => typeof n === "object";
const joinPath = (base, key) => base ? `${base}/${key}` : key;

/* Every page id under these nodes, in menu order. */
function navPages(nodes = NAV, out = []){
  for (const n of nodes) isFolder(n) ? navPages(n.items, out) : out.push(n);
  return out;
}
/* Every folder path under these nodes. */
function navFolders(nodes = NAV, base = "", out = []){
  for (const n of nodes) if (isFolder(n)){ const p = joinPath(base, n.folder); out.push(p); navFolders(n.items, p, out); }
  return out;
}
/* Paths of the folders that contain a page, outermost first; null if the page isn't in the menu. */
function navTrail(id, nodes = NAV, base = "", trail = []){
  for (const n of nodes){
    if (!isFolder(n)){ if (n === id) return trail; continue; }
    const p = joinPath(base, n.folder), found = navTrail(id, n.items, p, [...trail, p]);
    if (found) return found;
  }
  return null;
}
