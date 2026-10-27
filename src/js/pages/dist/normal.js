"use strict";
/* Normal distribution: Barbetta 6.2.3 (eq. 6.19–6.24, Tabela 3) · Bussab & Morettin 7.4 */
(() => {
  const zOf = (v, P, O) => { const z = (v - P.mu) / P.sigma; return O?.zTable ? Math.round(z * 100) / 100 : z; };
  PAGES["normal"] = distPage({
    id: "normal", key: "nor", kind: "continuous",
    params: [
      { key: "mu",    sym: M.i("μ"), def: 10, min: -50, max: 100, step: 0.1, ok: v => isFinite(v) },
      { key: "sigma", sym: M.i("σ"), def: 2, min: 0.1, max: 30, step: 0.05, ok: v => v > 0 },
    ],
    options: [{ key: "zTable", def: true }],
    initial: { mode: "ge", a: 13, b: 14, example: "current" },
    support: () => [-Infinity, Infinity],
    view: P => [P.mu - 4 * P.sigma, P.mu + 4 * P.sigma],
    pf: (x, P) => Num.normPdf(x, P.mu, P.sigma),
    cdf: (x, P) => Num.Phi((x - P.mu) / P.sigma),
    inv: (p, P, O) => { const z = Num.PhiInv(p); return P.mu + P.sigma * (O?.zTable ? Math.round(z * 100) / 100 : z); },
    prob(mode, a, b, P, O){
      if (!O?.zTable) return null;
      // As with Barbetta's Table 3: z with 2 decimals, upper-tail area P(Z > |z|) with 4 decimals.
      const tail = z => Math.round((1 - Num.Phi(Math.abs(z))) * 1e4) / 1e4;
      const F = v => { const z = zOf(v, P, O); return z >= 0 ? 1 - tail(z) : tail(z); };
      const lo = Math.min(a, b ?? a), hi = Math.max(a, b ?? a);
      return { le: F(a), ge: 1 - F(a), between: Math.max(0, F(hi) - F(lo)), outside: F(lo) + 1 - F(hi) }[mode];
    },
    mean: P => P.mu,
    variance: P => P.sigma ** 2,
    math: {
      general: () => M.row(M.frac(M.n(1), M.row(M.i("σ"), M.sqrt(M.row(M.n(2), M.up("π"))))),
        M.sup(M.up("e"), M.row(M.o(MINUS), M.frac(M.sup(M.paren(M.row(M.i("x"), M.o(MINUS), M.i("μ"))), M.n(2)), M.row(M.n(2), M.sup(M.i("σ"), M.n(2))))))),
      at: (_, P) => M.row(M.frac(M.n(1), M.row(M.n(trim(P.sigma, 4)), M.sqrt(M.row(M.n(2), M.up("π"))))),
        M.sup(M.up("e"), M.row(M.o(MINUS), M.frac(M.sup(M.paren(M.row(M.i("x"), M.minus(trim(P.mu, 4)))), M.n(2)), M.row(M.n(2), M.o("·"), M.sup(M.n(trim(P.sigma, 4)), M.n(2))))))),
      cdfSteps: (v, P, O) => [
        M.row(M.up("Φ"), M.paren(M.frac(M.row(M.n(trim(v, 4)), M.minus(trim(P.mu, 4))), M.n(trim(P.sigma, 4))))),
        M.row(M.up("Φ"), M.paren(M.n(O?.zTable ? zOf(v, P, O).toFixed(2) : trim(zOf(v, P, O), 4)))),
      ],
      mean: { general: () => M.i("μ"), sub: P => M.n(trim(P.mu, 4)) },
      variance: { general: () => M.sup(M.i("σ"), M.n(2)), sub: P => M.sup(M.n(trim(P.sigma, 4)), M.n(2)) },
    },
    extraVars: (P, S) => {
      const z = M.i("z"), out = [];
      const zs = v => show(S.O.zTable ? zOf(v, P, S.O).toFixed(2) : trim(zOf(v, P, S.O), 4));
      if (S.mode === "between" || S.mode === "outside"){
        out.push([M.sub(z, M.i("a")), t("nor.sym.z"), zs(Math.min(S.a, S.b))], [M.sub(z, M.i("b")), t("nor.sym.z"), zs(Math.max(S.a, S.b))]);
      } else out.push([z, t("nor.sym.z"), zs(S.a)]);
      out.push([M.up("Φ"), t("nor.sym.Phi"), ""]);
      return out;
    },
    r: { d: "dnorm", p: "pnorm", q: "qnorm", args: P => `mean = ${trim(P.mu, 6)}, sd = ${trim(P.sigma, 6)}`, mean: P => `${trim(P.mu, 6)}`,
         note: (_, O) => O.zTable ? t("nor.r.note") : null },
    examples: [
      { id: "current",   set: { P: { mu: 10, sigma: 2 }, mode: "ge", a: 13 },              source: "slides" },
      { id: "current911", set: { P: { mu: 10, sigma: 2 }, mode: "between", a: 9, b: 11 },  source: "slides" },
      { id: "tiles",     set: { P: { mu: 2.5, sigma: 0.6 }, mode: "between", a: 2, b: 3.5 }, source: "Barbetta · Ex. 6.6" },
      { id: "z042",      set: { P: { mu: 0, sigma: 1 }, mode: "le", a: 0.42 },             source: "Barbetta · Ex. 6.4" },
      { id: "z042b",     set: { P: { mu: 0, sigma: 1 }, mode: "between", a: -0.42, b: 0.42 }, source: "Barbetta · Ex. 6.4" },
      { id: "tax",       set: { P: { mu: 60000, sigma: 10000 }, mode: "ge", a: 75000 },    source: "slides" },
      { id: "tax5070",   set: { P: { mu: 60000, sigma: 10000 }, mode: "between", a: 50000, b: 70000 }, source: "slides" },
    ],
    notes: ["note.z", "note.table", "note.rule"],
    sources: ["src.barbetta", "src.bussab", "src.slides"],
  });
})();
