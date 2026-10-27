"use strict";
/* ============================================================
   Page: Quartiles (with the median and the box plot)
   Positions in the ordered data (Barbetta):
     qi: (n + 1)/4     md: (n + 1)/2     qs: 3(n + 1)/4
   interpolating linearly when the position is fractional.
     dq = qs − qi; values beyond qi − 1.5dq or qs + 1.5dq are outliers
     (beyond 3dq, far outliers).
   Same as R's quantile(x, type = 6).
   Sources: Barbetta 3.4.2 · Bussab & Morettin 3.3 and 3.4
   ============================================================ */
const QUART_PAGE = {
  id: "quartiles", key: "qt", minN: 3,
  data: [15, 18, 5, 7, 9, 11, 3, 5, 6, 8, 12], example: "eleven",
  topSpace: 86,

  compute(xs){
    const s = Desc.sorted(xs), n = s.length;
    const pos = [(n + 1) / 4, (n + 1) / 2, 3 * (n + 1) / 4];
    const [qi, md, qs] = pos.map(p => Desc.at(s, p));
    const dq = qs.v - qi.v, lf = qi.v - 1.5 * dq, uf = qs.v + 1.5 * dq, lf3 = qi.v - 3 * dq, uf3 = qs.v + 3 * dq;
    const inside = s.filter(v => v >= lf - 1e-12 && v <= uf + 1e-12);
    return { xs, s, n, pos, qi, md, qs, dq, lf, uf, lf3, uf3,
      wlo: inside.length ? inside[0] : qi.v, whi: inside.length ? inside[inside.length - 1] : qs.v,
      out: s.filter(v => v < lf - 1e-12 || v > uf + 1e-12), min: s[0], max: s[n - 1] };
  },

  formulas(R){
    const n = M.i("n"), num = v => M.n(trim(v, 6)), r4 = v => M.n(trim(v, 4)), np1 = M.row(n, M.o("+"), M.n(1));
    const nn = M.row(M.v(R.n), M.o("+"), M.n(1)), pos = M.text(t("qt.pos")), vv = v => M.v(trim(v, 6));
    const posFrac = [
      [M.frac(np1, M.n(4)), M.frac(nn, M.n(4))],
      [M.frac(np1, M.n(2)), M.frac(nn, M.n(2))],
      [M.frac(M.row(M.n(3), M.paren(np1)), M.n(4)), M.frac(M.row(M.n(3), M.paren(nn)), M.n(4))],
    ];
    const syms = [qSym.qi, qSym.md, qSym.qs], labels = ["qt.f.qi", "qt.f.md", "qt.f.qs"];
    const rows = [{ label: t("qt.f.sorted"), html: orderedHtml(R) }];
    [R.qi, R.md, R.qs].forEach((q, j) => {
      const line1 = M.math(M.row(pos, M.o("="), posFrac[j][0], M.o("="), posFrac[j][1], M.o("="), M.r(trim(R.pos[j], 4))));
      let line2;
      if (!q.f) line2 = M.math(M.row(syms[j](), M.o("="), M.ord(q.k), M.o("="), M.r(trim(q.v, 6))));
      else {
        const a = R.s[q.k - 1], b = R.s[q.k], f = M.v(trim(q.f, 4));
        line2 = M.math(M.row(syms[j](), M.o("="), M.ord(q.k), M.o("+"), f, M.o("·"), M.paren(M.row(M.ord(q.k + 1), M.o(MINUS), M.ord(q.k))),
          M.o("="), vv(a), M.o("+"), f, M.o("·"), M.paren(M.row(vv(b), M.o(MINUS), nv(a))), M.o("="), M.r(trim(q.v, 4))));
      }
      rows.push({ label: t(labels[j]), html: line1 + line2 });
    });
    const k15 = M.n("1.5"), dq = qSym.dq();
    rows.push({ label: t("qt.f.box"), html:
      M.math(M.row(dq, M.o("="), qSym.qs(), M.o(MINUS), qSym.qi(), M.o("="), vv(R.qs.v), M.o(MINUS), nv(R.qi.v), M.o("="), M.r(trim(R.dq, 4)))) +
      M.math(M.row(qSym.qi(), M.o(MINUS), k15, dq, M.o("="), vv(R.qi.v), M.o(MINUS), k15, M.o("·"), M.v(trim(R.dq, 4)), M.o("="), M.r(trim(R.lf, 4)))) +
      M.math(M.row(qSym.qs(), M.o("+"), k15, dq, M.o("="), vv(R.qs.v), M.o("+"), k15, M.o("·"), M.v(trim(R.dq, 4)), M.o("="), M.r(trim(R.uf, 4)))) });
    return rows;
  },

  vars(R){
    return [
      [M.i("n"), t("dt.sym.n"), String(R.n)],
      [M.ord(M.i("k")), t("qt.sym.xk"), ""],
      [qSym.qi(), t("qt.sym.qi"), show(trim(R.qi.v, 4))],
      [qSym.md(), t("qt.sym.md"), show(trim(R.md.v, 4))],
      [qSym.qs(), t("qt.sym.qs"), show(trim(R.qs.v, 4))],
      [qSym.dq(), t("qt.sym.dq"), show(trim(R.dq, 4))],
      [M.row(qSym.qi(), M.o(MINUS), M.n("1.5"), qSym.dq()), t("qt.sym.lf"), show(trim(R.lf, 4))],
      [M.row(qSym.qs(), M.o("+"), M.n("1.5"), qSym.dq()), t("qt.sym.uf"), show(trim(R.uf, 4))],
    ];
  },

  result(R){
    const v = x => show(trim(x, 4));
    return {
      big: `<span class="qtrio">${[[R.qi.v, qSym.qi()], [R.md.v, qSym.md()], [R.qs.v, qSym.qs()]]
        .map(([x, m]) => `<span><b>${v(x)}</b><math>${m}</math></span>`).join("")}</span>`,
      sub: "",
      facts: [[t("qt.fact.dq"), v(R.dq)], [t("dt.min"), v(R.min)], [t("dt.max"), v(R.max)],
        [t("qt.fact.out"), R.out.length ? R.out.map(v).join(t("listSep")) : t("qt.none")]],
    };
  },
  answer: R => `<math>${qSym.qi()}<mo>=</mo>${M.n(trim(R.qi.v, 3))}<mo separator="true">;</mo><mspace width="0.4em"></mspace>${qSym.md()}<mo>=</mo>${M.n(trim(R.md.v, 3))}<mo separator="true">;</mo><mspace width="0.4em"></mspace>${qSym.qs()}<mo>=</mo>${M.n(trim(R.qs.v, 3))}</math>`,
  r: R => [
    rLine("quantile(x, c(0.25, 0.5, 0.75), type = 6)", `${t("qt.r.q")}: ${[R.qi.v, R.md.v, R.qs.v].map(v => trim(v, 4)).join(" ")}`, 44),
    rLine("IQR(x, type = 6)", `dq: ${trim(R.dq, 4)}`, 44),
    rLine("boxplot(x, horizontal = TRUE)", t("qt.r.box"), 44),
  ],

  dot(i, v, R, O, C){ return R.out.includes(v) ? { fill: cssVar("--danger") } : null; },
  back(p, C, R){
    const c = p.ctx, axis = p.pad.t + p.ph, boxBot = p.pad.t + 58;
    for (const x of [R.lf, R.uf]) if (x >= p.x0 && x <= p.x1){
      p.vline(x, C.faint, [2, 4]);
    }
    p.clip(() => {
      c.save(); c.setLineDash([3, 3]); c.strokeStyle = C.accent; c.globalAlpha = .55; c.lineWidth = 1;
      for (const q of [R.qi.v, R.md.v, R.qs.v]){ const x = Math.round(p.X(q)) + .5; c.beginPath(); c.moveTo(x, boxBot); c.lineTo(x, axis); c.stroke(); }
      c.restore();
    });
  },
  front(p, C, R){
    const c = p.ctx, top = p.pad.t + 22, bot = p.pad.t + 58, mid = (top + bot) / 2, danger = cssVar("--danger");
    p.clip(() => {
      const X = v => p.X(v);
      c.strokeStyle = C.accent; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(X(R.wlo), mid); c.lineTo(X(R.qi.v), mid); c.moveTo(X(R.qs.v), mid); c.lineTo(X(R.whi), mid);
      c.moveTo(X(R.wlo), mid - 7); c.lineTo(X(R.wlo), mid + 7); c.moveTo(X(R.whi), mid - 7); c.lineTo(X(R.whi), mid + 7);
      c.stroke();
      c.fillStyle = C.fill; c.fillRect(X(R.qi.v), top, X(R.qs.v) - X(R.qi.v), bot - top);
      c.strokeRect(Math.round(X(R.qi.v)) + .5, top + .5, X(R.qs.v) - X(R.qi.v), bot - top);
      c.lineWidth = 2.5; c.beginPath(); c.moveTo(X(R.md.v), top); c.lineTo(X(R.md.v), bot); c.stroke();
      for (const v of R.out){
        const x = X(v), far = v < R.lf3 - 1e-12 || v > R.uf3 + 1e-12;
        c.strokeStyle = danger; c.lineWidth = 1.6;
        if (far){ c.beginPath(); c.moveTo(x - 4.5, mid - 4.5); c.lineTo(x + 4.5, mid + 4.5); c.moveTo(x + 4.5, mid - 4.5); c.lineTo(x - 4.5, mid + 4.5); c.stroke(); }
        else { c.beginPath(); c.arc(x, mid, 4.5, 0, Math.PI * 2); c.stroke(); }
      }
    });
    // labels: md on the first row; qi and qs share it when there is room, else go to the second row
    c.font = `600 12px ${C.font}`;
    const lab = [[R.qi.v, "qi"], [R.md.v, "md"], [R.qs.v, "qs"]].map(([v, s]) => ({ x: p.X(v), text: `${s} = ${show(trim(v, 3))}` }));
    const w = l => c.measureText(l.text).width + 14;
    const md = lab[1], gapL = md.x - w(md) / 2 - (lab[0].x + w(lab[0]) / 2), gapR = lab[2].x - w(lab[2]) / 2 - (md.x + w(md) / 2);
    const row = gapL > 4 && gapR > 4 ? 6 : 30;
    p.pill(md.x, 6, md.text, C, true);
    if (row === 30 && lab[2].x - lab[0].x < (w(lab[0]) + w(lab[2])) / 2 + 4){
      p.pill(lab[0].x - w(lab[0]) / 2, 30, lab[0].text, C, false); p.pill(lab[2].x + w(lab[2]) / 2, 30, lab[2].text, C, false);
    } else { p.pill(lab[0].x, row, lab[0].text, C, false); p.pill(lab[2].x, row, lab[2].text, C, false); }
    c.font = `11px ${C.font}`; c.fillStyle = C.faint; c.textBaseline = "top";
    if (R.lf >= p.x0 && R.lf <= p.x1){ c.textAlign = "left"; c.fillText(`qi − 1,5dq`.replace(",", t("decimal")), p.X(R.lf) + 4, p.pad.t + 64); }
    if (R.uf >= p.x0 && R.uf <= p.x1){ c.textAlign = "right"; c.fillText(`qs + 1,5dq`.replace(",", t("decimal")), p.X(R.uf) - 4, p.pad.t + 64); }
  },

  examples: [
    { id: "eleven", data: [15, 18, 5, 7, 9, 11, 3, 5, 6, 8, 12], source: "Barbetta · 3.4.2" },
    { id: "load", data: [5.2, 6.4, 5.7, 8.3, 7.0, 5.4, 4.8, 9.1, 5.5, 6.2, 4.9, 5.7, 6.3, 5.1, 8.4, 6.2, 8.9, 7.3, 5.4, 4.8, 5.6, 6.8, 5.0, 6.7, 8.2, 7.1, 4.9, 5.0, 8.2, 9.9, 5.4, 5.6, 5.7, 6.2, 4.9, 5.1, 6.0, 4.7, 14.1, 5.3, 4.9, 5.0, 5.7, 6.3, 6.0, 6.8, 7.3, 6.9, 6.5, 5.9], source: "Barbetta · Ex. 3.2" },
    { id: "turmaC", data: [0, 6, 7, 7, 7, 7.5, 7.5], source: "Barbetta · Ex. 3.4" },
    { id: "even", data: [3, 5, 6, 7, 10, 11], source: "Barbetta · 3.4.2" },
    { id: "bm", data: [15, 5, 3, 8, 10, 2, 7, 11, 12], source: "Bussab & Morettin · Ex. 3.5" },
  ],
  notes: ["note.pos", "note.even", "note.resist", "note.box", "note.methods"],
  sources: ["src.barbetta", "src.bussab"],
};
const qSym = {
  qi: () => M.sub(M.i("q"), M.i("i")), qs: () => M.sub(M.i("q"), M.i("s")),
  md: () => `<mi>md</mi>`, dq: () => M.sub(M.i("d"), M.i("q")),
};
/* The ordered data with positions; values used to find a quartile are highlighted. */
function orderedHtml(R){
  const used = new Set();
  for (const q of [R.qi, R.md, R.qs]){ used.add(q.k); if (q.f) used.add(q.k + 1); }
  return `<div class="ordered">${R.s.map((v, i) => `<span class="${used.has(i + 1) ? "on" : ""}${R.out.includes(v) ? " out" : ""}"><i>${i + 1}</i>${show(trim(v, 6))}</span>`).join("")}</div>`;
}
PAGES["quartiles"] = dataPage(QUART_PAGE);
