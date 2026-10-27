"use strict";
/* ============================================================
   Page: Standard deviation (with the variance)
     s² = Σ(xᵢ − x̄)² / (n − 1)       s = √s²
     s  = √[(Σxᵢ² − n·x̄²) / (n − 1)]  shortcut, fewer rounding errors
   Bussab & Morettin define var(X) and dp(X) with n in the denominator;
   the page can switch between n − 1 and n.
   Sources: Barbetta 3.4.1 (eq. 3.6 to 3.8, Ex. 3.4) · Bussab & Morettin 3.2
   ============================================================ */
const SD_PAGE = {
  id: "standard-deviation", key: "sdp", minN: 2,
  data: [4, 5, 5, 6, 6, 7, 7, 8], example: "turmaA",
  segs: [{ key: "div", def: "n1", values: ["n1", "n"] }],

  compute(xs, O){
    const n = xs.length, sum = Desc.sum(xs), mean = sum / n;
    const ss = xs.reduce((s, x) => s + (x - mean) ** 2, 0), sx2 = xs.reduce((s, x) => s + x * x, 0);
    const d = O.div === "n" ? n : n - 1, v = ss / d;
    return { xs, n, sum, mean, ss, sx2, d, pop: O.div === "n", v, s: Math.sqrt(v) };
  },

  formulas(R){
    const xb = M.bar("x"), xi = M.sub(M.i("x"), M.i("i")), n = M.i("n"), num = v => M.n(trim(v, 6)), r4 = v => M.n(trim(v, 4));
    const V = sdSym.v(R), Sd = sdSym.s(R);
    const D = R.pop ? n : M.row(n, M.o(MINUS), M.n(1)), Dn = R.pop ? num(R.n) : M.row(num(R.n), M.o(MINUS), M.n(1));
    const dev = M.sup(M.paren(M.row(xi, M.o(MINUS), xb)), M.n(2));
    const devTerms = R.xs.map(x => M.sup(M.paren(M.row(M.n(trim(x, 6)), M.o(MINUS), nv(+trim(R.mean, 4)))), M.n(2)));
    return [
      { label: t("sdp.f.mean"), chain: [xb, M.frac(M.row(M.sum(), xi), n), M.frac(num(R.sum), num(R.n)), r4(R.mean)] },
      { label: t("sdp.f.var"), chain: [V, M.frac(M.row(M.sum(), dev), D), M.frac(sumTerms(devTerms, 6), Dn), M.frac(r4(R.ss), num(R.d)), r4(R.v)] },
      { label: t("sdp.f.sd"), chain: [Sd, M.sqrt(V), M.sqrt(r4(R.v)), r4(R.s)] },
      { label: t("sdp.f.short"), chain: [Sd,
        M.sqrt(M.frac(M.row(M.sum(), M.sup(xi, M.n(2)), M.o(MINUS), n, M.sup(xb, M.n(2))), D)),
        M.sqrt(M.frac(M.row(num(R.sx2), M.o(MINUS), num(R.n), M.o("·"), M.sup(nv(+trim(R.mean, 4)), M.n(2))), Dn)),
        r4(R.s)] },
    ];
  },

  vars(R){
    const xi = M.sub(M.i("x"), M.i("i")), xb = M.bar("x");
    return [
      [sdSym.s(R), R.pop ? t("sdp.sym.dp") : t("sdp.sym.s"), show(trim(R.s, 4))],
      [sdSym.v(R), R.pop ? t("sdp.sym.var") : t("sdp.sym.s2"), show(trim(R.v, 4))],
      [xi, t("dt.sym.xi"), ""],
      [xb, t("sdp.sym.xbar"), show(trim(R.mean, 4))],
      [M.i("n"), t("dt.sym.n"), String(R.n)],
      [M.row(M.sum(), M.sup(M.paren(M.row(xi, M.o(MINUS), xb)), M.n(2))), t("sdp.sym.ss"), show(trim(R.ss, 4))],
      [M.row(M.sum(), M.sup(xi, M.n(2))), t("sdp.sym.sx2"), show(trim(R.sx2, 6))],
    ];
  },

  result(R){
    return {
      big: show(trim(R.s, 4)),
      sub: `<math>${sdSym.s(R)}</math> · ${R.pop ? t("sdp.subPop") : t("sdp.subSample")}`,
      facts: [[t("sdp.fact.mean"), show(trim(R.mean, 4))], [R.pop ? t("sdp.fact.var") : t("sdp.fact.s2"), show(trim(R.v, 4))],
        [t("sdp.fact.ss"), show(trim(R.ss, 4))], [t("dt.n"), String(R.n)]],
    };
  },
  answer: R => `<math>${sdSym.s(R)}<mo>=</mo>${M.n(trim(R.s, 2))}</math>`,
  r: R => R.pop
    ? [rLine("n <- length(x)", t("dt.sym.n")),
       rLine("sum((x - mean(x))^2) / n", `${t("sdp.fact.var")}: ${trim(R.v, 4)}`, 34),
       rLine("sqrt(sum((x - mean(x))^2) / n)", `${t("sdp.r.dp")}: ${trim(R.s, 4)}`, 34),
       `# ${t("sdp.r.note")}`]
    : [rLine("var(x)", `${t("sdp.fact.s2")}: ${trim(R.v, 4)}`),
       rLine("sd(x)", `${t("sdp.r.s")}: ${trim(R.s, 4)}`),
       rLine("sqrt((sum(x^2) - length(x) * mean(x)^2) / (length(x) - 1))", t("sdp.r.short"))],

  back(p, C, R, O, L){
    const c = p.ctx, lo = R.mean - R.s, hi = R.mean + R.s, axis = p.pad.t + p.ph;
    p.clip(() => {
      c.fillStyle = C.fill; c.fillRect(p.X(lo), p.pad.t, p.X(hi) - p.X(lo), axis - p.pad.t);
      c.strokeStyle = C.faint; c.lineWidth = 1;
      for (const d of L){ c.beginPath(); c.moveTo(p.X(R.mean), d.py); c.lineTo(d.px, d.py); c.stroke(); }
    });
    p.vline(lo, C.accent, [4, 3]); p.vline(hi, C.accent, [4, 3]);
    p.vline(R.mean, C.accent, [], 1, 1.5);
  },
  front(p, C, R){
    const mean = `x̄ = ${show(trim(R.mean, 3))}`;
    const s = R.pop ? t("sdp.symDp") : "s";
    p.pill(p.X(R.mean), 6, mean, C, true);
    if (p.X(R.mean + R.s) - p.X(R.mean - R.s) > 150){
      p.pill(p.X(R.mean - R.s), 30, `x̄ − ${s} = ${show(trim(R.mean - R.s, 3))}`, C, false);
      p.pill(p.X(R.mean + R.s), 30, `x̄ + ${s} = ${show(trim(R.mean + R.s, 3))}`, C, false);
    }
  },

  examples: [
    { id: "turmaA", data: [4, 5, 5, 6, 6, 7, 7, 8], source: "Barbetta · Ex. 3.4" },
    { id: "turmaB", data: [1, 2, 4, 6, 6, 9, 10, 10], source: "Barbetta · Ex. 3.4" },
    { id: "turmaC", data: [0, 6, 7, 7, 7, 7.5, 7.5], source: "Barbetta · Ex. 3.4" },
    { id: "shift", data: [101, 102, 103], source: "Barbetta · Tabela 3.5" },
    { id: "bmA", data: [3, 4, 5, 6, 7], O: { div: "n" }, source: "Bussab & Morettin · 3.2" },
    { id: "bmD", data: [3, 5, 5, 7], O: { div: "n" }, source: "Bussab & Morettin · 3.2" },
  ],
  notes: ["note.n1", "note.units", "note.short", "note.outlier", "note.shift"],
  sources: ["src.barbetta", "src.bussab", "src.slides"],
};
/* s and s² (sample, n − 1), or dp(X) and var(X) as in Bussab & Morettin (n). */
const sdSym = {
  s: R => R.pop ? M.row(M.up(t("sdp.symDp")), M.paren(M.i("X"))) : M.i("s"),
  v: R => R.pop ? M.row(M.up("var"), M.paren(M.i("X"))) : M.sup(M.i("s"), M.n(2)),
};
PAGES["standard-deviation"] = dataPage(SD_PAGE);
