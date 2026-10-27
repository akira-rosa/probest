"use strict";
/* ============================================================
   Small helpers shared by every file.
   ============================================================ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MINUS = "\u2212";

/* Round to d decimals and drop trailing zeros: trim(1.500) -> "1.5". Always uses a dot. */
function trim(v, d = 4){
  if (!isFinite(v)) return "—";
  let s = (+v).toFixed(d);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  if (s === "-0") s = "0";
  return s;
}

/* localStorage that never throws (private windows, blocked storage). */
const store = {
  get(k){ try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch {} }
};
