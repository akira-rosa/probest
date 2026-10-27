"use strict";
/* ============================================================
   Number display and parsing, aware of the current language.
   Portuguese shows a decimal comma; inputs accept comma or dot.
   ============================================================ */
const usesComma = () => t("decimal") === ",";
const loc = s => usesComma() ? String(s).replace(/\./g, ",") : String(s);
const show = s => loc(s).replace(/^-/, MINUS);       // for display: locale decimal + true minus sign
const fmtIn = (v, d = 4) => loc(trim(v, d));          // for writing a value into a text input

function parseNum(str){
  let s = String(str).trim().replace(/\s+/g, "").replace(/\u2212/g, "-");
  if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const v = parseFloat(s); return isFinite(v) ? v : null;
}

/* Probabilities: 4 decimals, scientific notation when very small. Uses a dot; wrap in show(). */
function fmtProb(p){
  if (!isFinite(p)) return "—";
  if (p === 0) return "0";
  if (p < 1e-4) return p.toExponential(3);
  if (p > 1 - 1e-4 && p < 1) return p.toFixed(6);
  return p.toFixed(4);
}

/* Whole numbers with the language's thousands separator: 12345 -> "12,345" / "12.345". */
const fmtInt = v => isFinite(v) ? new Intl.NumberFormat(t("htmlLang"), { maximumFractionDigits: 0 }).format(v) : "—";

/* Round up, ignoring floating-point noise (2401.0000000001 -> 2401). Used for sample sizes. */
const ceilN = v => Math.ceil(v - 1e-9);
