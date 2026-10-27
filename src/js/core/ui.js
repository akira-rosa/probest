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

/* ============================================================
   Page sections shared by every calculator page (below the graph):
   Examples · Symbols · In R · Good to know · Sources
   ============================================================ */

/* Worked examples as buttons. list: [{ id, title, answer, source }]. */
function examplesHtml(list, active){
  return `<div class="examples">${list.map(e => `
    <button class="example" type="button" data-ex="${e.id}" aria-pressed="${e.id === active}">
      <span class="ex-title">${e.title}</span>
      <span class="ex-answer">${e.answer}</span>
      <span class="ex-source">${e.source}</span>
    </button>`).join("")}</div>`;
}
function markExample(box, active){
  $$(".example", box).forEach(b => b.setAttribute("aria-pressed", b.dataset.ex === active));
}

/* R code block with a copy button; text after # is shown as a comment. */
function codeHtml(code){
  const body = code.split("\n").map(line => {
    const i = line.indexOf("#");
    return i < 0 ? esc(line) : esc(line.slice(0, i)) + `<span class="cmt">${esc(line.slice(i))}</span>`;
  }).join("\n");
  return `<pre class="code"><code>${body}</code></pre>`;
}
/* Pad code so trailing comments line up: rLine("n0 <- 1", "initial size"). */
const rLine = (code, comment, width = 30) => comment ? code.padEnd(width) + "# " + comment : code;

/* Copy buttons inside el (bind once per page render). */
function bindCopy(el){
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-copy]"); if (!b) return;
    const text = b.closest(".sect").querySelector("pre").innerText;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {}
    if (!ok){
      const ta = Object.assign(document.createElement("textarea"), { value: text });
      ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch {}
      ta.remove();
    }
    b.textContent = ok ? t("copied") : t("copyFailed");
    setTimeout(() => { b.textContent = t("copy"); }, 1600);
  });
}

/* Symbol list: rows of [MathML for the symbol, description HTML]. */
const symbolsHtml = rows => `<dl class="symbols">${rows.map(([m, d]) => `<dt><math>${m}</math></dt><dd>${d}</dd>`).join("")}</dl>`;
const listHtml = (items, cls) => `<ul class="${cls}">${items.map(i => `<li>${i}</li>`).join("")}</ul>`;

/* The standard block of sections. Each page fills #examples, #symbols and #rcode on update. */
function sectionsHtml({ notes, sources }){
  return `<section class="sections">
    <div class="sect sect-wide">
      <h2>${t("examples")}</h2>
      <p class="sect-lede">${t("examplesHint")}</p>
      <div id="examples"></div>
    </div>
    <div class="sect"><h2>${t("symbols")}</h2><div id="symbols"></div></div>
    <div class="sect"><h2>${t("goodToKnow")}</h2>${listHtml(notes, "notes")}</div>
    <div class="sect sect-wide">
      <div class="sect-head"><h2>${t("inR")}</h2><button class="btn copy" type="button" data-copy>${t("copy")}</button></div>
      <p class="sect-lede">${t("inRHint")}</p>
      <div id="rcode"></div>
    </div>
    <div class="sect sect-wide"><h2>${t("sources")}</h2>${listHtml(sources, "sources")}</div>
  </section>`;
}
