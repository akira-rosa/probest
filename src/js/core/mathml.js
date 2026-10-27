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
  binom: (n, k) => `<mrow><mo>(</mo><mfrac linethickness="0">${n}${k}</mfrac><mo>)</mo></mrow>`,
  fact: a => `<mrow>${a}<mo>!</mo></mrow>`,
  paren: a => `<mrow><mo>(</mo>${a}<mo>)</mo></mrow>`,
  brack: a => `<mrow><mo>[</mo>${a}<mo>]</mo></mrow>`,
  minus: v => `<mo>${MINUS}</mo>` + (String(v).startsWith("-") ? M.paren(M.n(v)) : M.n(v)),
  math: (a, cls = "") => `<math display="block"${cls ? ` class="${cls}"` : ""}>${a}</math>`,
  /* A number with 4 significant digits (scientific notation when tiny). */
  sig(v){
    if (v === 0 || !isFinite(v)) return M.n(String(v));
    if (Math.abs(v) < 1e-4){ const [m, e] = v.toExponential(3).split("e"); return M.row(M.n(m), M.o("×"), M.sup(M.n(10), M.n(String(+e)))); }
    return M.n(String(+v.toPrecision(4)));
  },
  /* A chain a = b = c = … split over lines of `per` parts; later lines start with "=". */
  chain(parts, per = 3){
    const out = [];
    for (let i = 0; i < parts.length; i += per){
      const seg = parts.slice(i, i + per).join(M.o("="));
      out.push(M.math(M.row(i ? M.o("=") + seg : seg)));
    }
    return out.join("");
  },
  prob(p){
    const s = fmtProb(p);
    if (s.includes("e")){
      const [m, e] = s.split("e");
      return M.row(M.n(m), M.o("×"), M.sup(M.n(10), M.n(String(+e))));
    }
    return M.n(s);
  }
};
