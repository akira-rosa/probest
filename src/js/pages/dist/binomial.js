"use strict";
/* Binomial distribution: Barbetta 5.2.2 (eq. 5.13–5.15) · Bussab & Morettin 6.6 */
PAGES["binomial"] = distPage({
  id: "binomial", key: "bin", kind: "discrete",
  params: [
    { key: "n", sym: M.i("n"), def: 18, min: 1, max: 60, step: 1, int: true, ok: v => v >= 1 && v <= 5000 },
    { key: "p", sym: M.i("p"), def: 0.1, min: 0.01, max: 0.99, step: 0.01, ok: v => v >= 0 && v <= 1 },
  ],
  initial: { mode: "eq", a: 2, b: 4, example: "water" },
  support: P => [0, P.n],
  view: P => {
    if (P.n <= 40) return [0, P.n];
    const m = P.n * P.p, sd = Math.sqrt(P.n * P.p * (1 - P.p));
    return [Math.max(0, Math.floor(m - 5 * sd - 2)), Math.min(P.n, Math.ceil(m + 5 * sd + 2))];
  },
  pf: (x, P) => {
    if (!Number.isInteger(x) || x < 0 || x > P.n) return 0;
    if (P.p === 0) return x === 0 ? 1 : 0;
    if (P.p === 1) return x === P.n ? 1 : 0;
    return Math.exp(Num.lchoose(P.n, x) + x * Math.log(P.p) + (P.n - x) * Math.log(1 - P.p));
  },
  mean: P => P.n * P.p,
  variance: P => P.n * P.p * (1 - P.p),
  math: {
    general: () => M.row(M.binom(M.i("n"), M.i("x")), M.sup(M.i("p"), M.i("x")),
      M.sup(M.paren(M.row(M.n(1), M.o(MINUS), M.i("p"))), M.row(M.i("n"), M.o(MINUS), M.i("x")))),
    at: (x, P) => M.row(M.binom(M.v(P.n), M.v(x)), M.o("·"), M.sup(M.v(trim(P.p, 4)), M.v(x)), M.o("·"),
      M.sup(M.v(trim(1 - P.p, 4)), M.v(P.n - x))),
    atNum: (x, P) => M.row(M.n(String(Num.choose(P.n, x))), M.o("·"), M.sig(P.p ** x), M.o("·"), M.sig((1 - P.p) ** (P.n - x))),
    mean: { general: () => M.row(M.i("n"), M.i("p")), sub: P => M.row(M.v(P.n), M.o("·"), M.v(trim(P.p, 4))) },
    variance: {
      general: () => M.row(M.i("n"), M.i("p"), M.paren(M.row(M.n(1), M.o(MINUS), M.i("p")))),
      sub: P => M.row(M.v(P.n), M.o("·"), M.v(trim(P.p, 4)), M.o("·"), M.v(trim(1 - P.p, 4))),
    },
  },
  extraVars: (P, S) => S.mode === "eq" ? [[M.binom(M.i("n"), M.i("x")), t("bin.sym.C"), fmtInt(Num.choose(P.n, S.a))]] : [],
  r: { d: "dbinom", p: "pbinom", args: P => `size = ${P.n}, prob = ${trim(P.p, 6)}`, mean: P => `${P.n} * ${trim(P.p, 6)}` },
  examples: [
    { id: "water",   set: { P: { n: 18, p: 0.1 }, mode: "eq", a: 2 },           source: "" },
    { id: "water4",  set: { P: { n: 18, p: 0.1 }, mode: "ge", a: 4 },           source: "" },
    { id: "water37", set: { P: { n: 18, p: 0.1 }, mode: "between", a: 3, b: 7 }, source: "" },
    { id: "orange",  set: { P: { n: 4, p: 0.3 }, mode: "eq", a: 2 },            source: "Barbetta · Ex. 5.2" },
    { id: "web",     set: { P: { n: 10, p: 0.7 }, mode: "ge", a: 6 },           source: "Barbetta · Ex. 5.2" },
    { id: "bits",    set: { P: { n: 4, p: 0.1 }, mode: "eq", a: 2 },            source: "" },
  ],
  notes: ["note.cond", "note.shape", "note.table"],
  sources: ["src.barbetta", "src.bussab"],
});
