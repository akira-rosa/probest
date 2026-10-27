"use strict";
/* ============================================================
   Page: Simple linear regression (least squares)
     b = [nΣxy − (Σx)(Σy)] / [nΣx² − (Σx)²]      a = (Σy − bΣx) / n
     ŷ = a + bx      residual eᵢ = yᵢ − ŷᵢ
   Sources: Barbetta 11.3.1 (eq. 11.11 to 11.15, Ex. 11.2) · Bussab & Morettin 16
   ============================================================ */
PAGES["linear-regression"] = pairPage({
  id: "linear-regression", key: "reg", minN: 2,
  data: OCTANE, example: "octane",
  initial: { x0: 5.5, xName: "reg.n.additive", yName: "reg.n.octane" },
  options: [{ key: "res", def: true }, { key: "squares", def: false }],

  controls: () => `
    <div class="group">
      <h2>${t("reg.predict")}</h2>
      <div class="param"><label for="f-x0"><span class="sym"><math><msub><mi>x</mi><mn>0</mn></msub></math></span>${t("reg.x0")}</label>${numInput("f-x0", 0.1)}</div>
      <p class="note warn" id="extrap" hidden>${t("reg.extrap")}</p>
    </div>`,
  bind(root, S, update){
    const inp = $("#f-x0", root);
    inp.value = fmtIn(S.x0, 6);
    inp.addEventListener("input", () => { const v = parseNum(inp.value); inp.setAttribute("aria-invalid", v == null); if (v != null){ S.x0 = v; update(); } });
    inp.addEventListener("change", () => { inp.value = fmtIn(S.x0, 6); });
    bindNudge(inp.parentElement);
    const sync = () => { if (inp !== document.activeElement) inp.value = fmtIn(S.x0, 6); };
    root.addEventListener("pointerup", sync); root.addEventListener("click", sync);
  },

  compute(P, S){
    const s = pairSums(P);
    if (!(s.Sxx > 0)) return { err: "reg.err.x" };
    const b = s.Sxy / s.Sxx, a = (s.sy - b * s.sx) / s.n;
    const res = P.map(([x, y]) => y - (a + b * x)), sse = res.reduce((q, e) => q + e * e, 0);
    const r = s.Syy > 0 ? s.Sxy / Math.sqrt(s.Sxx * s.Syy) : NaN;
    const x0 = S.x0 ?? 0, y0 = a + b * x0, xs = P.map(p => p[0]);
    return { ...s, b, a, res, sse, r, x0, y0, extrap: x0 < Math.min(...xs) || x0 > Math.max(...xs) };
  },
  yExtra: R => [R.y0],

  formulas(R){
    const n = M.i("n"), sum = s => M.row(`<mo>∑</mo>`, s), x = M.i("x"), y = M.i("y"), num = v => M.n(trim(v, 4)), vv = v => M.v(trim(v, 4)), rr = v => M.r(trim(v, 4)), sq = v => M.sup(v, M.n(2)), dot = M.o("·");   // values blue, results bold
    const nn = M.v(String(R.n)), yh = M.i("ŷ");
    const line = (bv, xv) => M.row(vv(R.a), bv < 0 ? M.o(MINUS) : M.o("+"), vv(Math.abs(bv)), xv);
    document.querySelector("#extrap")?.toggleAttribute("hidden", !R.extrap);
    return [
      { label: t("reg.f.b"), chain: [M.i("b"),
        M.frac(M.row(n, sum(M.row(x, y)), M.o(MINUS), M.paren(sum(x)), M.paren(sum(y))), M.row(n, sum(sq(x)), M.o(MINUS), sq(M.paren(sum(x))))),
        M.frac(M.row(nn, dot, vv(R.sxy), M.o(MINUS), nv(+trim(R.sx, 4)), dot, nv(+trim(R.sy, 4))), M.row(nn, dot, vv(R.sxx), M.o(MINUS), sq(nv(+trim(R.sx, 4))))),
        M.frac(num(R.Sxy), num(R.Sxx)), rr(R.b)] },
      { label: t("reg.f.a"), chain: [M.i("a"), M.frac(M.row(sum(y), M.o(MINUS), M.i("b"), sum(x)), n),
        M.frac(M.row(vv(R.sy), M.o(MINUS), nv(+trim(R.b, 4)), dot, nv(+trim(R.sx, 4))), nn), rr(R.a)] },
      { label: t("reg.f.line"), html: M.math(M.row(yh, M.o("="), M.i("a"), M.o("+"), M.i("b"), x, M.o("="), line(R.b, x))) },
      { label: t("reg.f.pred", { x: show(trim(R.x0, 4)) }), chain: [M.row(yh), line(R.b, M.row(dot, nv(R.x0))), rr(R.y0)] },
      { label: t("reg.f.res"), html: M.math(M.row(M.sub(M.i("e"), M.i("i")), M.o("="), M.sub(y, M.i("i")), M.o(MINUS), M.sub(yh, M.i("i")), M.t(";"),
          sum(sq(M.sub(M.i("e"), M.i("i")))), M.o("="), rr(R.sse))) },
    ];
  },
  vars: R => [
    [M.i("ŷ"), t("reg.sym.yhat"), ""],
    [M.i("x"), t("reg.sym.x"), ""], [M.i("y"), t("reg.sym.y"), ""],
    [M.i("b"), t("reg.sym.b"), show(trim(R.b, 4))], [M.i("a"), t("reg.sym.a"), show(trim(R.a, 4))],
    [M.i("n"), t("corr.sym.n"), String(R.n)],
    [M.sub(M.i("e"), M.i("i")), t("reg.sym.e"), ""],
  ],
  result(R){
    const eq = `ŷ = ${show(trim(R.a, 4))} ${R.b < 0 ? "−" : "+"} ${show(trim(Math.abs(R.b), 4))}x`;
    return {
      big: eq, sub: t("reg.sub"),
      facts: [[t("reg.fact.b"), show(trim(R.b, 4))], [t("reg.fact.a"), show(trim(R.a, 4))],
        [t("reg.fact.pred", { x: show(trim(R.x0, 4)) }), show(trim(R.y0, 4))],
        [`<math><mi>r</mi></math>`, isFinite(R.r) ? show(trim(R.r, 4)) : "—"], [`<math><msup><mi>r</mi><mn>2</mn></msup></math>`, isFinite(R.r) ? show(trim(R.r * R.r, 4)) : "—"],
        [t("reg.fact.sse"), show(trim(R.sse, 4))]],
      chips: `<span class="chip"><span class="sw"></span>${t("reg.lgLine")}</span>`,
    };
  },
  answer: R => R.err ? "—" : `<math><mi>ŷ</mi><mo>=</mo>${M.n(trim(R.a, 3))}<mo>${R.b < 0 ? MINUS : "+"}</mo>${M.n(trim(Math.abs(R.b), 4))}<mi>x</mi></math>`,
  r: R => [rLine("fit <- lm(y ~ x)", t("reg.r.fit"), 40), rLine("coef(fit)", `a = ${trim(R.a, 4)}, b = ${trim(R.b, 4)}`, 40),
    rLine(`predict(fit, data.frame(x = ${trim(R.x0, 6)}))`, `ŷ: ${trim(R.y0, 4)}`, 40), rLine("residuals(fit)", t("reg.r.res"), 40),
    rLine("plot(x, y); abline(fit)", t("reg.r.plot"), 40)],

  back(p, C, R, S){
    const c = p.ctx, f = x => R.a + R.b * x;
    p.clip(() => {
      S.P.forEach(([x, y], i) => {
        const px = p.X(x), py = p.Y(y), pl = p.Y(f(x)), side = pl - py;
        if (S.O.squares){
          const s = Math.abs(side), dir = px + s < p.pad.l + p.pw ? 1 : -1;
          c.fillStyle = cssVar("--danger"); c.globalAlpha = .1; c.fillRect(dir > 0 ? px : px - s, Math.min(py, pl), s, s); c.globalAlpha = 1;
          c.strokeStyle = cssVar("--danger"); c.lineWidth = 1; c.globalAlpha = .45; c.strokeRect(dir > 0 ? px : px - s, Math.min(py, pl), s, s); c.globalAlpha = 1;
        }
        if (S.O.res){ c.save(); c.setLineDash([3, 3]); c.strokeStyle = cssVar("--danger"); c.lineWidth = 1.3; c.beginPath(); c.moveTo(px, py); c.lineTo(px, pl); c.stroke(); c.restore(); }
      });
    });
    p.curve(f, { color: C.accent, width: 2.2 });
  },
  front(p, C, R){
    const c = p.ctx;
    if (R.x0 >= p.x0 && R.x0 <= p.x1){
      const X = p.X(R.x0), Y = p.Y(R.y0);
      c.save(); c.setLineDash([4, 3]); c.strokeStyle = C.muted; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(X, p.pad.t + p.ph); c.lineTo(X, Y); c.lineTo(p.pad.l, Y); c.stroke(); c.restore();
      c.fillStyle = C.surface; c.strokeStyle = C.accent; c.lineWidth = 2; c.beginPath(); c.arc(X, Y, 6, 0, Math.PI * 2); c.fill(); c.stroke();
      p.pill(X, 6, `x₀ = ${show(trim(R.x0, 3))} → ŷ = ${show(trim(R.y0, 3))}`, C, true);
    }
  },
  handles: (R, S, plot) => [{ key: "x0", x: R.x0, py: plot.Y(R.y0), r: 11 }],
  onHandle(key, x, y, S, plot){ S.x0 = +x.toFixed(Num.decimalsFor(Num.niceStep(plot.x1 - plot.x0, 100))); },

  examples: [
    { id: "octane", data: OCTANE, set: { x0: 5.5, xName: "reg.n.additive", yName: "reg.n.octane" }, source: "Barbetta · Ex. 11.2" },
    { id: "ceramic", data: ceramicPairs(0, 1), set: { x0: 10, xName: "corr.n.shrink", yName: "corr.n.strength" }, source: "Barbetta · Ex. 11.1" },
    { id: "entrance", data: ENTRANCE.filter(p => !(p[0] === 70 && p[1] === 50)), set: { x0: 50, xName: "corr.n.exam", yName: "corr.n.calc" }, source: () => `Barbetta · ${t("exercise")} 11.3` },
  ],
  notes: ["note.ls", "note.b", "note.range", "note.res", "note.cause"],
  sources: ["src.barbetta", "src.bussab"],
});
