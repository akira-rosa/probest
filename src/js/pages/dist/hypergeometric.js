"use strict";
/* Hypergeometric distribution: Barbetta 5.2.3 (eq. 5.16–5.18) · Bussab & Morettin 6.6 */
PAGES["hypergeometric"] = distPage({
  id: "hypergeometric", key: "hyp", kind: "discrete",
  params: [
    { key: "N", sym: M.i("N"), def: 30, min: 1, max: 200, step: 1, int: true, ok: v => v >= 1 && v <= 100000 },
    { key: "r", sym: M.i("r"), def: 3, min: 0, max: 60, step: 1, int: true, ok: v => v >= 0 && v <= 100000 },
    { key: "n", sym: M.i("n"), def: 5, min: 1, max: 60, step: 1, int: true, ok: v => v >= 1 && v <= 100000 },
  ],
  initial: { mode: "ge", a: 1, b: 2, example: "cards" },
  check: P => P.r > P.N ? "err.r" : P.n > P.N ? "err.n" : null,
  support: P => [Math.max(0, P.n - (P.N - P.r)), Math.min(P.r, P.n)],
  view: P => [Math.max(0, P.n - (P.N - P.r)), Math.min(P.r, P.n)],
  pf: (x, P) => {
    const lo = Math.max(0, P.n - (P.N - P.r)), hi = Math.min(P.r, P.n);
    if (!Number.isInteger(x) || x < lo || x > hi) return 0;
    return Math.exp(Num.lchoose(P.r, x) + Num.lchoose(P.N - P.r, P.n - x) - Num.lchoose(P.N, P.n));
  },
  mean: P => P.n * P.r / P.N,
  variance: P => { const p = P.r / P.N; return P.N > 1 ? P.n * p * (1 - p) * (P.N - P.n) / (P.N - 1) : 0; },
  math: {
    general: () => M.frac(M.row(M.binom(M.i("r"), M.i("x")), M.binom(M.row(M.i("N"), M.o(MINUS), M.i("r")), M.row(M.i("n"), M.o(MINUS), M.i("x")))),
      M.binom(M.i("N"), M.i("n"))),
    at: (x, P) => M.frac(M.row(M.binom(M.n(P.r), M.n(x)), M.binom(M.n(P.N - P.r), M.n(P.n - x))), M.binom(M.n(P.N), M.n(P.n))),
    atNum: (x, P) => {
      const big = v => v > 1e15 ? M.sig(v) : M.n(String(v));
      return M.frac(M.row(big(Num.choose(P.r, x)), M.o("·"), big(Num.choose(P.N - P.r, P.n - x))), big(Num.choose(P.N, P.n)));
    },
    mean: { general: () => M.row(M.i("n"), M.frac(M.i("r"), M.i("N"))), sub: P => M.row(M.n(P.n), M.o("·"), M.frac(M.n(P.r), M.n(P.N))) },
    variance: {
      general: () => M.row(M.i("n"), M.i("p"), M.paren(M.row(M.n(1), M.o(MINUS), M.i("p"))), M.frac(M.row(M.i("N"), M.o(MINUS), M.i("n")), M.row(M.i("N"), M.o(MINUS), M.n(1)))),
      sub: P => { const p = trim(P.r / P.N, 4); return M.row(M.n(P.n), M.o("·"), M.n(p), M.o("·"), M.n(trim(1 - P.r / P.N, 4)), M.o("·"),
        M.frac(M.row(M.n(P.N), M.o(MINUS), M.n(P.n)), M.row(M.n(P.N), M.o(MINUS), M.n(1)))); },
    },
  },
  extraVars: P => [[M.row(M.i("p"), M.o("="), M.frac(M.i("r"), M.i("N"))), t("hyp.sym.pRatio"), show(trim(P.r / P.N, 4))]],
  r: { d: "dhyper", p: "phyper", args: P => `m = ${P.r}, n = ${P.N - P.r}, k = ${P.n}`, mean: P => `${P.n} * ${P.r} / ${P.N}`,
       note: () => t("hyp.r.note") },
  examples: [
    { id: "cards", set: { P: { N: 30, r: 3, n: 5 }, mode: "ge", a: 1 },   source: "Barbetta · Ex. 5.3" },
    { id: "lot20", set: { P: { N: 20, r: 5, n: 4 }, mode: "eq", a: 2 },   source: "Bussab & Morettin · Ex. 5.8" },
    { id: "lot100", set: { P: { N: 100, r: 10, n: 10 }, mode: "eq", a: 0 }, source: "slides" },
  ],
  notes: ["note.when", "note.approx"],
  sources: ["src.barbetta", "src.bussab", "src.slides"],
});
