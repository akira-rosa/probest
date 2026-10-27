"use strict";
/* ============================================================
   Navigation — edit this list as formulas get added.
   Items with a matching entry in PAGES become live.
   ============================================================ */
/* Labels come from I18N: "group.<key>" and "nav.<id>". */
const NAV = [
  { key: "descriptive", items: ["mean", "spread", "quartiles"] },
  { key: "probability", items: ["rules", "bayes", "counting"] },
  { key: "discrete",    items: ["binomial", "poisson", "geometric"] },
  { key: "continuous",  items: ["normal", "uniform", "exponential", "student-t"] },
  { key: "inference",   items: ["ci", "tests", "regression"] },
];
const PAGES = {};          // id -> (root) => cleanup fn
const DEFAULT_PAGE = "normal";
