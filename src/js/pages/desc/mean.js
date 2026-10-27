"use strict";
/* ============================================================
   Page: Arithmetic mean   x̄ = Σxᵢ / n
   With repeated values:   x̄ = Σxⱼnⱼ / n
   Sources: Barbetta 3.4.1 (eq. 3.4, 3.9, Ex. 3.2 and 3.4) · Bussab & Morettin 3.1
   ============================================================ */
const MEAN_PAGE = {
  id: "mean", key: "mean", minN: 1,
  data: [4, 5, 5, 6, 6, 7, 7, 8], example: "turmaA",
  options: [{ key: "median", def: false }],
  baseGap: 16,

  compute(xs){
    const n = xs.length, sum = Desc.sum(xs), mean = sum / n, s = Desc.sorted(xs);
    const counts = new Map(); for (const v of s) counts.set(v, (counts.get(v) || 0) + 1);
    return { xs, n, sum, mean, median: Desc.median(xs), min: s[0], max: s[n - 1], freq: [...counts] };
  },

  formulas(R){
    const xb = M.bar("x"), xi = M.sub(M.i("x"), M.i("i")), n = M.i("n"), num = v => M.n(trim(v, 6));
    const rows = [{ label: t("mean.f.mean"), chain: [
      xb, M.frac(M.row(M.sum(), xi), n),
      M.frac(sumTerms(R.xs.map(v => nv(v))), M.v(R.n)),
      M.frac(num(R.sum), M.v(R.n)), M.r(trim(R.mean, 4))] }];
    if (R.freq.length < R.n){
      const xj = M.sub(M.i("x"), M.i("j")), nj = M.sub(M.i("n"), M.i("j"));
      const terms = R.freq.map(([v, c]) => M.row(nv(v), M.o("·"), M.v(String(c))));
      rows.push({ label: t("mean.f.freq"), chain: [
        xb, M.frac(M.row(M.sum(M.row(M.i("j"), M.o("="), M.n(1)), M.i("k")), xj, nj), n),
        M.frac(sumTerms(terms, 6), M.v(R.n)), M.r(trim(R.mean, 4))] });
    }
    return rows;
  },

  vars(R){
    const rows = [
      [M.bar("x"), t("mean.sym.xbar"), show(trim(R.mean, 4))],
      [M.sub(M.i("x"), M.i("i")), t("dt.sym.xi"), ""],
      [M.i("n"), t("dt.sym.n"), String(R.n)],
      [M.row(M.sum(), M.sub(M.i("x"), M.i("i"))), t("dt.sym.sum"), show(trim(R.sum, 6))],
    ];
    if (R.freq.length < R.n) rows.push(
      [M.sub(M.i("x"), M.i("j")), t("mean.sym.xj"), ""],
      [M.sub(M.i("n"), M.i("j")), t("mean.sym.nj"), ""],
      [M.i("k"), t("mean.sym.k"), String(R.freq.length)]);
    return rows;
  },

  result(R, O){
    const facts = [[t("dt.n"), String(R.n)], [t("dt.sumLbl"), show(trim(R.sum, 6))]];
    facts.push([t("dt.median"), show(trim(R.median, 4))], [t("dt.min"), show(trim(R.min, 6))], [t("dt.max"), show(trim(R.max, 6))]);
    return { big: show(trim(R.mean, 4)), sub: `<math>${M.bar("x")}</math> · ${t("mean.title").toLowerCase()}`, facts };
  },
  answer: R => `<math>${M.bar("x")}<mo>=</mo>${M.n(trim(R.mean, 2))}</math>`,
  r: (R, O) => [
    rLine("mean(x)", `${t("mean.r.mean")}: ${trim(R.mean, 4)}`),
    rLine("sum(x) / length(x)", t("mean.r.formula")),
    ...(O.median ? [rLine("median(x)", `${t("dt.median")}: ${trim(R.median, 4)}`)] : []),
  ],

  back(p, C, R, O){
    const c = p.ctx, axis = p.pad.t + p.ph, board = axis - 16;
    c.save(); c.strokeStyle = C.line; c.lineWidth = 2;
    c.beginPath(); c.moveTo(p.pad.l, board + 1); c.lineTo(p.pad.l + p.pw, board + 1); c.stroke(); c.restore();
    if (O.median) p.vline(R.median, C.muted, [5, 4], 1, 1.4);
  },
  front(p, C, R, O){
    const c = p.ctx, axis = p.pad.t + p.ph, board = axis - 16, x = p.X(R.mean);
    if (R.mean < p.x0 || R.mean > p.x1) return;
    // the balance point: the mean is where the board of dots would balance
    c.save(); c.fillStyle = C.accent;
    c.beginPath(); c.moveTo(x, board + 2); c.lineTo(x - 9, axis); c.lineTo(x + 9, axis); c.closePath(); c.fill();
    c.strokeStyle = C.accent; c.lineWidth = 1.5; c.setLineDash([]);
    c.beginPath(); c.moveTo(Math.round(x) + .5, p.pad.t); c.lineTo(Math.round(x) + .5, board); c.stroke(); c.restore();
    const [l, r] = p.pill(x, 6, `x̄ = ${show(trim(R.mean, 4))}`, C, true);
    if (O.median && R.median >= p.x0 && R.median <= p.x1){
      const mx = p.X(R.median), close = mx > l - 50 && mx < r + 50;
      p.pill(mx, close ? 30 : 6, `md = ${show(trim(R.median, 4))}`, C, false);
    }
  },

  examples: [
    { id: "turmaA", data: [4, 5, 5, 6, 6, 7, 7, 8], source: "Barbetta · Ex. 3.4" },
    { id: "turmaB", data: [1, 2, 4, 6, 6, 9, 10, 10], source: "Barbetta · Ex. 3.4" },
    { id: "turmaC", data: [0, 6, 7, 7, 7, 7.5, 7.5], O: { median: true }, source: "Barbetta · Ex. 3.4" },
    { id: "load", data: [5.2, 6.4, 5.7, 8.3, 7.0, 5.4, 4.8, 9.1, 5.5, 6.2, 4.9, 5.7, 6.3, 5.1, 8.4, 6.2, 8.9, 7.3, 5.4, 4.8, 5.6, 6.8, 5.0, 6.7, 8.2, 7.1, 4.9, 5.0, 8.2, 9.9, 5.4, 5.6, 5.7, 6.2, 4.9, 5.1, 6.0, 4.7, 14.1, 5.3, 4.9, 5.0, 5.7, 6.3, 6.0, 6.8, 7.3, 6.9, 6.5, 5.9], O: { median: true }, source: "Barbetta · Ex. 3.2" },
    { id: "bm", data: [15, 5, 3, 8, 10, 2, 7, 11, 12], O: { median: true }, source: "Bussab & Morettin · Ex. 3.5" },
    { id: "bm67", data: [15, 5, 3, 8, 10, 2, 7, 11, 12, 67], O: { median: true }, source: "Bussab & Morettin · Ex. 3.5" },
  ],
  notes: ["note.balance", "note.outlier", "note.freq", "note.units"],
  sources: ["src.barbetta", "src.bussab"],
};
PAGES["mean"] = dataPage(MEAN_PAGE);
