"use strict";
/* ============================================================
   MathML builder (formulas render natively, no library)
   ============================================================ */
const M = {
  n: v => { const s = loc(v); return s.startsWith("-") ? `<mrow><mo form="prefix">${MINUS}</mo><mn>${s.slice(1)}</mn></mrow>` : `<mn>${s}</mn>`; },
  i: s => `<mi>${s}</mi>`,
  up: s => `<mi mathvariant="normal">${s}</mi>`,
  o: s => `<mo>${s}</mo>`,
  text: s => `<mtext>${s}</mtext>`,
  t: s => `<mspace width="0.35em"></mspace><mtext>${s}</mtext><mspace width="0.35em"></mspace>`,
  row: (...a) => `<mrow>${a.join("")}</mrow>`,
  frac: (a, b) => `<mfrac>${a}${b}</mfrac>`,
  sqrt: a => `<msqrt>${a}</msqrt>`,
  sup: (a, b) => `<msup>${a}${b}</msup>`,
  sub: (a, b) => `<msub>${a}${b}</msub>`,
  subsup: (a, b, c) => `<msubsup>${a}${b}${c}</msubsup>`,
  paren: a => `<mrow><mo>(</mo>${a}<mo>)</mo></mrow>`,
  brack: a => `<mrow><mo>[</mo>${a}<mo>]</mo></mrow>`,
  minus: v => `<mo>${MINUS}</mo>` + (String(v).startsWith("-") ? M.paren(M.n(v)) : M.n(v)),
  math: (a, cls = "") => `<math display="block"${cls ? ` class="${cls}"` : ""}>${a}</math>`,
  prob(p){
    const s = fmtProb(p);
    if (s.includes("e")){
      const [m, e] = s.split("e");
      return M.row(M.n(m), M.o("×"), M.sup(M.n(10), M.n(String(+e))));
    }
    return M.n(s);
  }
};
