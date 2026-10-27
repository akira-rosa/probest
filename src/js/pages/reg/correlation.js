"use strict";
/* ============================================================
   Page: Pearson's correlation coefficient
     r = [nΣxy − (Σx)(Σy)] / √{[nΣx² − (Σx)²]·[nΣy² − (Σy)²]}
   Test of H₀: ρ = 0:  t = r·√(n − 2) / √(1 − r²),  gl = n − 2
   Sources: Barbetta 11.1 and 11.2 (eq. 11.2, 11.3, 11.5, Ex. 11.1) · Bussab & Morettin 4.5 and 14.5
   ============================================================ */
const rSym = () => M.i("r");
PAGES["correlation"] = pairPage({
  id: "correlation", key: "corr", minN: 3,
  data: ceramicPairs(0, 1), example: "shrinkStrength",
  initial: { xName: "corr.n.shrink", yName: "corr.n.strength" },
  options: [{ key: "quad", def: true }],

  compute(P){
    const s = pairSums(P);
    if (!(s.Sxx > 0) || !(s.Syy > 0)) return { err: "corr.err.const" };
    const r = s.Sxy / Math.sqrt(s.Sxx * s.Syy), df = s.n - 2;
    const tt = Math.abs(r) >= 1 ? Infinity * Math.sign(r) : r * Math.sqrt(df) / Math.sqrt(1 - r * r);
    const p = isFinite(tt) ? 2 * (1 - Num.tCdf(Math.abs(tt), df)) : 0;
    const tc = Num.tInv(0.975, df), rc = tc / Math.sqrt(df + tc * tc);
    return { ...s, r, df, tt, p, rc };
  },

  formulas(R){
    const n = M.i("n"), sum = s => M.row(`<mo>∑</mo>`, s), x = M.i("x"), y = M.i("y"), num = v => M.n(trim(v, 4)), vv = v => M.v(trim(v, 4)), rr = v => M.r(trim(v, 4)), sq = v => M.sup(v, M.n(2));   // values blue, results bold
    const xy = M.row(x, y), dot = M.o("·");
    const gen = M.frac(M.row(n, sum(xy), M.o(MINUS), M.paren(sum(x)), M.paren(sum(y))),
      M.row(M.sqrt(M.row(n, sum(sq(x)), M.o(MINUS), sq(M.paren(sum(x))))), dot, M.sqrt(M.row(n, sum(sq(y)), M.o(MINUS), sq(M.paren(sum(y)))))));
    const nn = M.v(String(R.n));
    const subst = M.frac(M.row(nn, dot, vv(R.sxy), M.o(MINUS), nv(+trim(R.sx, 4)), dot, nv(+trim(R.sy, 4))),
      M.row(M.sqrt(M.row(nn, dot, vv(R.sxx), M.o(MINUS), sq(nv(+trim(R.sx, 4))))), dot, M.sqrt(M.row(nn, dot, vv(R.syy), M.o(MINUS), sq(nv(+trim(R.sy, 4)))))));
    const sums = [[sum(x), R.sx], [sum(y), R.sy], [sum(sq(x)), R.sxx], [sum(sq(y)), R.syy], [sum(xy), R.sxy]]
      .map(([s, v]) => M.row(s, M.o("="), rr(v))).join(M.t(""));
    const ttM = isFinite(R.tt) ? rr(R.tt) : M.o("∞");
    return [
      { label: t("corr.f.sums"), html: M.math(M.row(n, M.o("="), nn, M.t(""), sums)) },
      { label: t("corr.f.r"), chain: [rSym(), gen, subst, M.frac(num(R.Sxy), M.row(M.sqrt(num(R.Sxx)), dot, M.sqrt(num(R.Syy)))), rr(R.r)] },
      { label: t("corr.f.test"), html: M.math(M.row(M.i("t"), M.o("="), M.frac(M.row(rSym(), M.sqrt(M.row(n, M.o(MINUS), M.n(2)))), M.sqrt(M.row(M.n(1), M.o(MINUS), M.sup(rSym(), M.n(2))))),
          M.o("="), M.frac(M.row(vv(R.r), dot, M.sqrt(M.v(String(R.df)))), M.sqrt(M.row(M.n(1), M.o(MINUS), sq(nv(+trim(R.r, 4)))))), M.o("="), ttM,
          M.t(`(${t("dfAbbr")} = ${R.df})`))) +
        M.math(M.row(M.i("p"), M.o("="), M.rprob(R.p), M.t(";"), M.row(M.o("|"), rSym(), M.o("|")), M.o(Math.abs(R.r) > R.rc ? ">" : "≤"), M.n(trim(R.rc, 3)),
          M.o("⇒"), M.text(Math.abs(R.r) > R.rc ? t("corr.signif") : t("corr.notSignif"))), "res") },
    ];
  },
  vars: R => [
    [rSym(), t("corr.sym.r"), show(trim(R.r, 4))],
    [M.i("n"), t("corr.sym.n"), String(R.n)],
    [M.row(M.sub(M.i("x"), M.i("i")), M.o(","), M.sub(M.i("y"), M.i("i"))), t("corr.sym.xy"), ""],
    [M.i("ρ"), t("corr.sym.rho"), ""],
    [M.i("t"), t("corr.sym.t"), isFinite(R.tt) ? show(trim(R.tt, 4)) : "∞"],
    [M.text(t("dfAbbr")), t("corr.sym.df"), String(R.df)],
  ],
  result(R){
    const dir = Math.abs(R.r) < 1e-12 ? t("corr.none") : R.r > 0 ? t("corr.pos") : t("corr.neg");
    return {
      big: show(trim(R.r, 4)), sub: `<math>${rSym()}</math> · ${dir}`,
      facts: [[t("pair.n"), String(R.n)], [`<math>${M.sup(rSym(), M.n(2))}</math>`, show(trim(R.r * R.r, 4))],
        [t("corr.fact.t"), isFinite(R.tt) ? show(trim(R.tt, 3)) : "∞"], [t("test.fact.p"), show(fmtProb(R.p))],
        [t("corr.fact.rc"), show(trim(R.rc, 3))], [t("corr.fact.sig"), Math.abs(R.r) > R.rc ? t("corr.yes") : t("corr.no")]],
      chips: `<span class="chip"><span class="dotsw pos"></span>${t("corr.lgPos")}</span><span class="chip"><span class="dotsw neg"></span>${t("corr.lgNeg")}</span>`,
    };
  },
  answer: R => R.err ? "—" : `<math>${rSym()}<mo>=</mo>${M.n(trim(R.r, 4))}</math>`,
  r: R => [rLine("cor(x, y)", `r: ${trim(R.r, 4)}`), rLine("cor.test(x, y)", `t = ${isFinite(R.tt) ? trim(R.tt, 3) : "Inf"}, ${t("dfAbbr")} = ${R.df}, p = ${fmtProb(R.p)}`)],

  dotColor(i, R, S, C){
    if (!S.O.quad) return C.accent;
    const [x, y] = S.P[i], pr = (x - R.mx) * (y - R.my);
    return pr > 0 ? C.accent : pr < 0 ? cssVar("--danger") : C.muted;
  },
  back(p, C, R, S){
    if (!S.O.quad) return;
    const c = p.ctx;
    c.save(); c.setLineDash([5, 4]); c.strokeStyle = C.faint; c.lineWidth = 1.2;
    const X = Math.round(p.X(R.mx)) + .5, Y = Math.round(p.Y(R.my)) + .5;
    c.beginPath(); c.moveTo(X, p.pad.t); c.lineTo(X, p.pad.t + p.ph); c.moveTo(p.pad.l, Y); c.lineTo(p.pad.l + p.pw, Y); c.stroke(); c.restore();
    c.font = `600 13px ${C.font}`; c.fillStyle = C.faint; c.textBaseline = "middle"; c.textAlign = "center";
    const qx = [(X + p.pad.l + p.pw) / 2, (p.pad.l + X) / 2], qy = [(p.pad.t + Y) / 2, (Y + p.pad.t + p.ph) / 2];
    c.fillText("I", qx[0], qy[0]); c.fillText("II", qx[1], qy[0]); c.fillText("III", qx[1], qy[1]); c.fillText("IV", qx[0], qy[1]);
    c.font = `11.5px ${C.font}`; c.textAlign = "left"; c.textBaseline = "bottom";
    c.fillText(`x̄ = ${show(trim(R.mx, 3))}`, X + 4, p.pad.t + p.ph - 18); c.textBaseline = "top"; c.fillText(`ȳ = ${show(trim(R.my, 3))}`, p.pad.l + 6, Y + 3);
  },

  examples: [
    { id: "three", data: [[3, 6], [4, 4], [5, 2]], source: "Barbetta · 11.2" },
    { id: "shrinkStrength", data: ceramicPairs(0, 1), set: { xName: "corr.n.shrink", yName: "corr.n.strength" }, source: "Barbetta · Ex. 11.1" },
    { id: "shrinkAbsorb", data: ceramicPairs(0, 2), set: { xName: "corr.n.shrink", yName: "corr.n.absorb" }, source: "Barbetta · Ex. 11.1" },
    { id: "strengthAbsorb", data: ceramicPairs(1, 2), set: { xName: "corr.n.strength", yName: "corr.n.absorb" }, source: "Barbetta · Ex. 11.1" },
    { id: "first5", data: ceramicPairs(0, 1, 5), set: { xName: "corr.n.shrink", yName: "corr.n.strength" }, source: () => `Barbetta · ${t("exercise")} 11.1` },
    { id: "entrance", data: ENTRANCE, set: { xName: "corr.n.exam", yName: "corr.n.calc" }, source: () => `Barbetta · ${t("exercise")} 11.3` },
    { id: "entranceOut", data: ENTRANCE.filter(p => !(p[0] === 70 && p[1] === 50)), set: { xName: "corr.n.exam", yName: "corr.n.calc" }, source: () => `Barbetta · ${t("exercise")} 11.3` },
  ],
  notes: ["note.range", "note.quad", "note.units", "note.cause", "note.linear"],
  sources: ["src.barbetta", "src.bussab"],
});
