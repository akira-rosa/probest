"use strict";
/* Poisson distribution: Barbetta 5.2.4 (eq. 5.21–5.24) · Bussab & Morettin 6.6–6.7 */
PAGES["poisson"] = distPage({
  id: "poisson", key: "poi", kind: "discrete",
  params: [
    { key: "lambda", sym: M.i("λ"), def: 3, min: 0.1, max: 30, step: 0.1, ok: v => v > 0 && v <= 100000 },
  ],
  initial: { mode: "le", a: 2, b: 4, example: "queries" },
  support: () => [0, Infinity],
  view: P => [Math.max(0, Math.floor(P.lambda - 4.5 * Math.sqrt(P.lambda) - 1)), Math.ceil(P.lambda + 4.5 * Math.sqrt(P.lambda) + 3)],
  pf: (x, P) => (!Number.isInteger(x) || x < 0) ? 0 : Math.exp(-P.lambda + x * Math.log(P.lambda) - Num.lgamma(x + 1)),
  mean: P => P.lambda,
  variance: P => P.lambda,
  math: {
    general: () => M.frac(M.row(M.sup(M.up("e"), M.row(M.o(MINUS), M.i("λ"))), M.sup(M.i("λ"), M.i("x"))), M.fact(M.i("x"))),
    at: (x, P) => M.frac(M.row(M.sup(M.up("e"), M.row(M.o(MINUS), M.n(trim(P.lambda, 4)))), M.o("·"), M.sup(M.n(trim(P.lambda, 4)), M.n(x))), M.fact(M.n(x))),
    atNum: (x, P) => M.frac(M.row(M.sig(Math.exp(-P.lambda)), M.o("·"), M.sig(P.lambda ** x)), x <= 18 ? M.n(String(Math.round(Math.exp(Num.lgamma(x + 1))))) : M.sig(Math.exp(Num.lgamma(x + 1)))),
    mean: { general: () => M.i("λ"), sub: P => M.n(trim(P.lambda, 4)) },
    variance: { general: () => M.i("λ"), sub: P => M.n(trim(P.lambda, 4)) },
  },
  r: { d: "dpois", p: "ppois", args: P => `lambda = ${trim(P.lambda, 6)}`, mean: P => `${trim(P.lambda, 6)}` },
  examples: [
    { id: "queries",  set: { P: { lambda: 3 }, mode: "le", a: 2 },    source: "Barbetta · Ex. 5.4" },
    { id: "queries2", set: { P: { lambda: 6 }, mode: "ge", a: 6 },    source: "Barbetta · Ex. 5.4" },
    { id: "defects",  set: { P: { lambda: 2.5 }, mode: "ge", a: 5 },  source: "Barbetta · Ex. 5.5" },
    { id: "messages", set: { P: { lambda: 5 }, mode: "eq", a: 0 },    source: "slides" },
    { id: "disc",     set: { P: { lambda: 10 }, mode: "eq", a: 12 },  source: "slides" },
    { id: "disc12",   set: { P: { lambda: 10 }, mode: "le", a: 12 },  source: "slides" },
  ],
  notes: ["note.rate", "note.approx", "note.ev"],
  sources: ["src.barbetta", "src.bussab", "src.slides"],
});
