"use strict";
/* ============================================================
   Page: Conditional probability   P(A | B) = P(A ∩ B) / P(B)
   with the product rule P(A ∩ B) = P(B)·P(A | B) and independence.
   Sources: Barbetta 4.3 (eq. 4.8 to 4.10) · Bussab & Morettin 5.3
   ============================================================ */
PAGES["conditional-probability"] = vennPage({
  id: "conditional-probability", key: "cond", mode: "cond",
  state: { A: "350/6850", B: "1550/6850", AB: "50/6850", example: "milk" },

  formulas(V){
    const P = Ev.P, r = V.raw, A = Ev.A(), B = Ev.B(), n4 = v => M.n(trim(v, 4)), v4 = v => M.v(trim(v, 4)), r4 = v => M.r(trim(v, 4));
    const rows = [
      { label: t("cond.f.cond"), chain: [P(Ev.given(A, B)), M.frac(P(Ev.and()), P(B)), M.frac(probMath(r.AB), probMath(r.B)), r4(V.AgB)] },
      { label: t("cond.f.product"), chain: [P(Ev.and()), M.row(P(B), M.o("·"), P(Ev.given(A, B))), M.row(v4(V.B), M.o("·"), v4(V.AgB)), r4(V.AB)] },
    ];
    if (V.A > 0) rows.push({ label: t("cond.f.other"), chain: [P(Ev.given(B, A)), M.frac(P(Ev.and()), P(A)), M.frac(probMath(r.AB), probMath(r.A)), r4(V.BgA)] });
    rows.push({ label: t("cond.f.indep"), html: M.math(M.row(P(Ev.given(A, B)), M.o("="), v4(V.AgB), M.o(V.indep ? "=" : "≠"), v4(V.A), M.o("="), P(A))) +
      `<p class="fnote">${V.indep ? t("cond.indepYes") : t("cond.indepNo")}</p>` });
    return rows;
  },
  vars: V => [
    [Ev.P(Ev.given(Ev.A(), Ev.B())), t("cond.sym.AgB"), pShow(V.AgB)],
    [Ev.P(Ev.and()), t("cond.sym.AB"), pShow(V.AB)],
    [Ev.P(Ev.B()), t("cond.sym.B"), pShow(V.B)],
    [Ev.P(Ev.A()), t("cond.sym.A"), pShow(V.A)],
    [Ev.P(Ev.given(Ev.B(), Ev.A())), t("cond.sym.BgA"), V.A > 0 ? pShow(V.BgA) : "—"],
  ],
  result: V => ({
    big: pShow(V.AgB), sub: `<math>${Ev.P(Ev.given(Ev.A(), Ev.B()))}</math>`,
    facts: [[`<math>${Ev.P(Ev.given(Ev.B(), Ev.A()))}</math>`, V.A > 0 ? pShow(V.BgA) : "—"], [`<math>${Ev.P(Ev.A())}</math>`, pShow(V.A)],
      [`<math>${Ev.P(Ev.and())}</math>`, pShow(V.AB)], [t("venn.relation"), V.indep ? t("venn.isInd") : t("venn.isDep")]],
  }),
  answer: V => `<math>${Ev.P(Ev.given(Ev.A(), Ev.B()))}<mo>=</mo>${M.n(trim(V.AgB, 4))}</math>`,
  r: V => [
    rLine(`pA <- ${rProb(V.raw.A)}`, "P(A)"), rLine(`pB <- ${rProb(V.raw.B)}`, "P(B)"), rLine(`pAB <- ${rProb(V.raw.AB)}`, "P(A ∩ B)"),
    rLine("pAB / pB", `P(A | B): ${trim(V.AgB, 4)}`), rLine("pAB / pA", `P(B | A): ${trim(V.BgA, 4)}`),
    rLine("isTRUE(all.equal(pA * pB, pAB))", t("cond.r.indep"), 34),
  ],
  examples: [
    { id: "milk", set: { A: "350/6850", B: "1550/6850", AB: "50/6850" }, source: "Barbetta · Ex. 4.7" },
    { id: "diceA", set: { A: "6/36", B: "10/36", AB: "2/36" }, source: "Barbetta · Ex. 4.8" },
    { id: "diceB", set: { A: "10/36", B: "6/36", AB: "2/36" }, source: "Barbetta · Ex. 4.8" },
    { id: "employees", set: { A: "0.20", B: "0.30", AB: "0.12" }, source: "" },
    { id: "die", set: { A: "1/2", B: "2/3", AB: "1/3" }, source: "Barbetta · 4.2" },
  ],
  notes: ["note.space", "note.order", "note.product", "note.indep"],
  sources: ["src.barbetta", "src.bussab"],
});
