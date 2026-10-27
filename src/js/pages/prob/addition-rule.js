"use strict";
/* ============================================================
   Page: Addition rule   P(A ∪ B) = P(A) + P(B) − P(A ∩ B)
   Sources: Barbetta 4.2 (eq. 4.7) · Bussab & Morettin 5.2
   ============================================================ */
const exerciseSrc = (book, ref) => () => `${book} · ${t("exercise")} ${ref}`;
PAGES["addition-rule"] = vennPage({
  id: "addition-rule", key: "add", mode: "union",
  state: { A: "0.30", B: "0.20", AB: "0.12", example: "employees" },

  formulas(V){
    const P = Ev.P, r = V.raw, sub = (a, b) => M.row(a, M.o(MINUS), b);
    return [
      { label: t("add.f.rule"), chain: [P(Ev.or()), M.row(P(Ev.A()), M.o("+"), sub(P(Ev.B()), P(Ev.and()))),
        M.row(probMath(r.A), M.o("+"), sub(probMath(r.B), probMath(r.AB))), M.n(trim(V.U, 4))] },
      { label: t("add.f.none"), chain: [P(Ev.and(M.bar("A"), M.bar("B"))), sub(M.n(1), P(Ev.or())), sub(M.n(1), M.n(trim(V.U, 4))), M.n(trim(V.none, 4))] },
    ];
  },
  vars: V => [
    [Ev.P(Ev.or()), t("add.sym.U"), pShow(V.U)],
    [Ev.P(Ev.A()), t("add.sym.A"), pShow(V.A)],
    [Ev.P(Ev.B()), t("add.sym.B"), pShow(V.B)],
    [Ev.P(Ev.and()), t("add.sym.AB"), pShow(V.AB)],
    [Ev.P(Ev.and(M.bar("A"), M.bar("B"))), t("add.sym.none"), pShow(V.none)],
  ],
  result: V => ({
    big: pShow(V.U), sub: `<math>${Ev.P(Ev.or())}</math>`,
    facts: [[t("venn.onlyA"), pShow(V.onlyA)], [t("venn.onlyB"), pShow(V.onlyB)], [t("venn.both"), pShow(V.AB)],
      [t("venn.none"), pShow(V.none)], [t("venn.relation"), V.AB === 0 ? t("venn.isExcl") : V.indep ? t("venn.isInd") : t("venn.isDep")]],
  }),
  answer: V => `<math>${Ev.P(Ev.or())}<mo>=</mo>${M.n(trim(V.U, 4))}</math>`,
  r: V => [
    rLine(`pA <- ${rProb(V.raw.A)}`, "P(A)"), rLine(`pB <- ${rProb(V.raw.B)}`, "P(B)"), rLine(`pAB <- ${rProb(V.raw.AB)}`, "P(A ∩ B)"),
    rLine("pA + pB - pAB", `P(A ∪ B): ${trim(V.U, 4)}`), rLine("1 - (pA + pB - pAB)", `${t("venn.none")}: ${trim(V.none, 4)}`),
  ],
  examples: [
    { id: "employees", set: { A: "0.30", B: "0.20", AB: "0.12" }, source: "slides" },
    { id: "die", set: { A: "1/2", B: "2/3", AB: "1/3" }, source: "Barbetta · 4.2" },
    { id: "procedures", set: { A: "0.02", B: "0.01", AB: "0.005" }, source: exerciseSrc("Barbetta", "4.4") },
    { id: "cards", set: { A: "13/52", B: "12/52", AB: "3/52" }, source: exerciseSrc("Barbetta", "4.3") },
  ],
  notes: ["note.twice", "note.excl", "note.none", "note.three"],
  sources: ["src.barbetta", "src.bussab", "src.slides"],
});
