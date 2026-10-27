"use strict";
/* ============================================================
   Page: Test for a mean
     z = (x̄ − μ₀)·√n / σ   (σ known)      t = (x̄ − μ₀)·√n / s   (gl = n − 1)
   Sources: Barbetta 8.8 (eq. 8.8 and 8.9, Ex. 8.7 and 8.8) · Bussab & Morettin 12
   ============================================================ */
PAGES["test-mean"] = testPage({
  id: "test-mean", key: "tm", mode: "mean",
  state: { h1: "ne", method: "z", alpha: 5, mu0: 53, xbar: 50, sd: 4, n: 15, zTable: true, example: "ceramic" },
  examples: [
    { id: "ceramic", set: { h1: "ne", method: "z", alpha: 5, mu0: 53, xbar: 50, sd: 4, n: 15 }, source: "Barbetta · Ex. 8.7" },
    { id: "network", set: { h1: "lt", method: "t", alpha: 1, mu0: 7.4, xbar: 6.82, sd: 0.551, n: 10 }, source: "Barbetta · Ex. 8.8" },
    { id: "database", set: { h1: "lt", method: "z", alpha: 1, mu0: 53, xbar: 45, sd: 14, n: 30 }, source: () => `Barbetta · ${t("exercise")} 8.18` },
    { id: "tyres", set: { h1: "gt", method: "t", alpha: 1, mu0: 50000, xbar: 55000, sd: 4000, n: 20 }, source: () => `Barbetta · ${t("exercise")} 8.19` },
  ],
  notes: ["note.which", "note.side", "note.t"],
  sources: ["src.barbetta", "src.bussab"],
});
