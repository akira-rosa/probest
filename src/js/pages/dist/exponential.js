"use strict";
/* Exponential distribution: Barbetta 6.2.2 (eq. 6.14–6.18) · Bussab & Morettin 7.4 */
PAGES["exponential"] = distPage({
  id: "exponential", key: "expo", kind: "continuous",
  params: [
    { key: "lambda", sym: M.i("λ"), def: 2, min: 0.05, max: 30, step: 0.05, ok: v => v > 0 && v < 1e7 },
  ],
  initial: { mode: "ge", a: 3, b: 4, example: "db" },
  support: () => [0, Infinity],
  view: P => [0, 5 / P.lambda],
  pf: (x, P) => x < 0 ? 0 : P.lambda * Math.exp(-P.lambda * x),
  cdf: (x, P) => x <= 0 ? 0 : 1 - Math.exp(-P.lambda * x),
  inv: (p, P) => -Math.log(1 - p) / P.lambda,
  mean: P => 1 / P.lambda,
  variance: P => 1 / P.lambda ** 2,
  math: {
    general: () => M.row(M.i("λ"), M.sup(M.up("e"), M.row(M.o(MINUS), M.i("λ"), M.i("x")))),
    at: (_, P) => M.row(M.n(trim(P.lambda, 4)), M.sup(M.up("e"), M.row(M.o(MINUS), M.n(trim(P.lambda, 4)), M.i("x")))),
    cdfCompound: true,
    cdfSteps: (v, P) => [M.row(M.n(1), M.o(MINUS), M.sup(M.up("e"), M.row(M.o(MINUS), M.n(trim(P.lambda, 4)), M.o("·"), M.n(trim(v, 4)))))],
    sfSteps: (v, P) => [M.sup(M.up("e"), M.row(M.o(MINUS), M.i("λ"), M.i("x"))), M.sup(M.up("e"), M.row(M.o(MINUS), M.n(trim(P.lambda, 4)), M.o("·"), M.n(trim(v, 4))))],
    mean: { general: () => M.frac(M.n(1), M.i("λ")), sub: P => M.frac(M.n(1), M.n(trim(P.lambda, 4))) },
    variance: { general: () => M.frac(M.n(1), M.sup(M.i("λ"), M.n(2))), sub: P => M.frac(M.n(1), M.sup(M.n(trim(P.lambda, 4)), M.n(2))) },
  },
  r: { d: "dexp", p: "pexp", q: "qexp", args: P => `rate = ${trim(P.lambda, 6)}`, mean: P => `1 / ${trim(P.lambda, 6)}` },
  examples: [
    { id: "db",         set: { P: { lambda: 2 }, mode: "ge", a: 3 },                 source: "Barbetta · Ex. 6.3" },
    { id: "db23",       set: { P: { lambda: 2 }, mode: "between", a: 2, b: 3 },      source: "Barbetta · Ex. 6.3" },
    { id: "logins",     set: { P: { lambda: 25 }, mode: "ge", a: 0.1 },              source: "slides" },
    { id: "logins23",   set: { P: { lambda: 25 }, mode: "between", a: 0.033, b: 0.05 }, source: "slides" },
    { id: "transistor", set: { P: { lambda: 0.002 }, mode: "ge", a: 500 },           source: "Barbetta · Ex. 6 (exercícios)" },
  ],
  notes: ["note.poisson", "note.memory", "note.mean"],
  sources: ["src.barbetta", "src.bussab", "src.slides"],
});
