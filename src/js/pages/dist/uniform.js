"use strict";
/* Continuous uniform distribution: Barbetta 6.2.1 (eq. 6.10–6.13) · Bussab & Morettin 7.4 */
PAGES["uniform"] = distPage({
  id: "uniform", key: "uni", kind: "continuous",
  params: [
    { key: "alpha", sym: M.i("α"), def: 0, min: -50, max: 50, step: 0.5, ok: v => isFinite(v) },
    { key: "beta",  sym: M.i("β"), def: 20, min: -50, max: 100, step: 0.5, ok: v => isFinite(v) },
  ],
  initial: { mode: "between", a: 5, b: 10, example: "current" },
  check: P => P.beta > P.alpha ? null : "err.order",
  support: P => [P.alpha, P.beta],
  view: P => { const w = P.beta - P.alpha; return [P.alpha - 0.2 * w, P.beta + 0.2 * w]; },
  pf: (x, P) => x >= P.alpha && x <= P.beta ? 1 / (P.beta - P.alpha) : 0,
  cdf: (x, P) => clamp((x - P.alpha) / (P.beta - P.alpha), 0, 1),
  inv: (p, P) => P.alpha + p * (P.beta - P.alpha),
  mean: P => (P.alpha + P.beta) / 2,
  variance: P => (P.beta - P.alpha) ** 2 / 12,
  math: {
    general: () => M.frac(M.n(1), M.row(M.i("β"), M.o(MINUS), M.i("α"))),
    at: (_, P) => M.row(M.frac(M.n(1), M.row(M.v(trim(P.beta, 4)), M.vminus(trim(P.alpha, 4)))), M.o("="), M.sig(1 / (P.beta - P.alpha)).replace(/<mn>/g, '<mn class="r">')),
    cdfSteps: (v, P) => [M.frac(M.row(M.v(trim(v, 4)), M.vminus(trim(P.alpha, 4))), M.row(M.v(trim(P.beta, 4)), M.vminus(trim(P.alpha, 4))))],
    mean: { general: () => M.frac(M.row(M.i("α"), M.o("+"), M.i("β")), M.n(2)), sub: P => M.frac(M.row(M.v(trim(P.alpha, 4)), M.o("+"), M.v(trim(P.beta, 4))), M.n(2)) },
    variance: {
      general: () => M.frac(M.sup(M.paren(M.row(M.i("β"), M.o(MINUS), M.i("α"))), M.n(2)), M.n(12)),
      sub: P => M.frac(M.sup(M.paren(M.row(M.v(trim(P.beta, 4)), M.vminus(trim(P.alpha, 4)))), M.n(2)), M.n(12)),
    },
  },
  r: { d: "dunif", p: "punif", q: "qunif", args: P => `min = ${trim(P.alpha, 6)}, max = ${trim(P.beta, 6)}`, mean: P => `(${trim(P.alpha, 6)} + ${trim(P.beta, 6)}) / 2` },
  examples: [
    { id: "current",   set: { P: { alpha: 0, beta: 20 }, mode: "between", a: 5, b: 10 }, source: "" },
    { id: "current10", set: { P: { alpha: 0, beta: 20 }, mode: "le", a: 10 },            source: "" },
    { id: "spinner",   set: { P: { alpha: 0, beta: 360 }, mode: "between", a: 0, b: 90 }, source: "Barbetta · Ex. 6.2" },
  ],
  notes: ["note.flat", "note.center"],
  sources: ["src.barbetta", "src.bussab"],
});
