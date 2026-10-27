"use strict";
/* ============================================================
   Form controls shared by pages.
   ============================================================ */

/* Text input for numbers (not type=number) so both "1.5" and "1,5" are accepted.
   Arrow keys step by `step` once bindNudge() has run on the page. */
const numInput = (id, step, extra = "") =>
  `<input class="num" id="${id}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-step="${step}" ${extra}>`;

/* Set a range slider, widening its range if needed, and paint the filled part of the track. */
function setSlider(r, v){
  if (v < +r.min) r.min = v; if (v > +r.max) r.max = v;
  r.value = v; r.style.setProperty("--p", ((v - r.min) / (r.max - r.min) * 100) + "%");
}

/* Arrow Up/Down nudges every .num field inside root (Shift = ×10), like a native number input. */
function bindNudge(root){
  $$(".num", root).forEach(inp => inp.addEventListener("keydown", e => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const v = parseNum(inp.value); if (v == null) return;
    e.preventDefault();
    const step = +inp.dataset.step * (e.shiftKey ? 10 : 1), d = Math.max(0, Num.decimalsFor(step));
    inp.value = loc(trim(v + (e.key === "ArrowUp" ? step : -step), Math.max(d, 4)));
    inp.dispatchEvent(new Event("input")); inp.dispatchEvent(new Event("change"));
  }));
}
