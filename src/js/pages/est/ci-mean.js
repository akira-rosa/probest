"use strict";
/* ============================================================
   Page: Confidence interval for the mean
     IC(μ, γ) = x̄ ± z_γ·σ/√n          σ known (or n large, with s)
     IC(μ, γ) = x̄ ± t_γ·s/√n          σ unknown, gl = n − 1
   Sources: Barbetta 7.3.3 (eq. 7.36 and 7.41, Ex. 7.4 and 7.5) · Bussab & Morettin 11.6
   ============================================================ */
PAGES["ci-mean"] = ciPage({
  id: "ci-mean", key: "ci-mean", mode: "mean",
  state: { method: "z", conf: 95, xbar: 346, sd: 3, n: 20, ref: "350", zTable: true, example: "beer" },
  examples: [
    { id: "beer", set: { method: "z", conf: 95, xbar: 346, sd: 3, n: 20, ref: "350" }, source: "Barbetta · Ex. 7.4" },
    { id: "coffee", set: { method: "z", conf: 95, xbar: 485, sd: 10, n: 25, ref: "500" }, source: "slides" },
    { id: "mercury", set: { method: "z", conf: 95, xbar: 0.5233, sd: 0.349, n: 53 }, source: "slides" },
    { id: "steel", set: { method: "t", conf: 95, xbar: 36.15, sd: 0.7352, n: 10 }, source: "Barbetta · Ex. 7.5" },
    { id: "nicotine", set: { method: "t", conf: 95, xbar: 31.5, sd: 3, n: 20, ref: "30" }, source: "slides" },
    { id: "coop", set: { method: "t", conf: 95, xbar: 2.7, sd: 1.34, n: 10 }, source: "slides" },
    { id: "blocks", set: { method: "t", conf: 99, xbar: 98, sd: 4, n: 36, ref: "100" }, source: () => `Barbetta · ${t("exercise")} 7.12` },
  ],
  notes: ["note.meaning", "note.width", "note.tz", "note.normal"],
  sources: ["src.barbetta", "src.bussab", "src.slides"],
});
