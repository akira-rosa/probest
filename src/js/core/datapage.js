"use strict";
/* ============================================================
   Shared page for formulas computed from a list of data values
   (descriptive statistics): mean, standard deviation, quartiles.

     PAGES["mean"] = dataPage(MEAN);

   The data are typed in a text box and drawn as a dot plot; every dot
   can be dragged to change its value. The page follows the standard
   format: graph + controls + result, formulas with the table of
   variables, about, examples, R, sources.

   Config (see pages/desc/*.js):
     id, key (locale prefix), minN, data (initial values), example (initial id)
     options: [{ key, def }]          checkboxes, labels "<key>.opt.<key>"
     segs: [{ key, def, values }]     segmented choices, labels "<key>.seg.<key>.<value>"
     compute(xs, O)        → R object (pure)
     formulas(R, O)        → [{ label, chain: [MathML…] } | { label, html }]
     vars(R, O)            → rows for varsTableHtml
     result(R, O)          → { big, sub, facts: [[label, value]] }
     answer(R, O)          → example answer (HTML/MathML)
     r(R, O)               → R lines after the data vector
     topSpace, baseGap     → pixels kept free above the dots / below the dots
     dot(i, v, R, O, C)    → { fill, stroke } for a dot (optional)
     back(p, C, R, O, L) / front(p, C, R, O, L) → drawing below / above the dots
     examples: [{ id, data, O, source }], notes: [keys], sources: [keys]
   ============================================================ */

/* Read a list of numbers. Separators: spaces, new lines, semicolons, and commas;
   in Portuguese a comma between digits is the decimal mark ("7,5"). */
function parseData(text){
  const comma = usesComma();
  const s = String(text).replace(/[{}()\[\]]/g, " ").replace(/−/g, "-").trim();
  if (!s) return { values: [], bad: [] };
  const tokens = (comma ? s.split(/[\s;]+|,(?=\s|$)|(?<=\D),|,(?=\D)/) : s.split(/[\s;,]+/)).filter(Boolean);
  const values = [], bad = [];
  for (const tk of tokens){ const v = parseNum(tk); v == null ? bad.push(tk) : values.push(v); }
  return { values, bad };
}
const formatData = xs => xs.map(v => loc(trim(v, 6))).join(usesComma() ? "; " : ", ");

/* x₁ + x₂ + … + xₙ with every term, or the first three and the last one when there are many. */
function sumTerms(terms, max = 8){
  if (terms.length <= max) return M.row(terms.join(M.o("+")));
  return M.row([...terms.slice(0, 3), M.o("⋯"), terms[terms.length - 1]].join(M.o("+")));
}
/* A data value as MathML, in parentheses when negative (for "x − x̄" and sums). */
/* A value going into a formula (blue), in parentheses when negative. */
const nv = (v, d = 6) => v < 0 ? M.paren(M.v(trim(v, d))) : M.v(trim(v, d));

/* The R vector of the data, wrapped to lines of about 64 characters. */
function rVector(xs, name = "x"){
  const items = xs.map(v => trim(v, 6)), lines = [];
  let cur = `${name} <- c(`;
  items.forEach((it, i) => {
    const piece = it + (i < items.length - 1 ? ", " : ")");
    if (cur.length + piece.length > 64 && cur.trim().length > 7){ lines.push(cur.trimEnd()); cur = "       "; }
    cur += piece;
  });
  if (!items.length) cur += ")";
  lines.push(cur);
  return lines;
}

function dataPage(cfg){
  const K = k => t(`${cfg.key}.${k}`);

  return function DataPage(root){
    const S = cfg.state || (cfg.state = {
      data: [...cfg.data], O: Object.fromEntries([...(cfg.options || []), ...(cfg.segs || [])].map(o => [o.key, o.def])),
      example: cfg.example ?? null, range: null
    });

    /* ---------- examples ---------- */
    const exO = e => ({ ...Object.fromEntries([...(cfg.options || []), ...(cfg.segs || [])].map(o => [o.key, o.def])), ...(e.O || {}) });
    const exList = () => cfg.examples.map(e => ({
      id: e.id, title: K("ex." + e.id), source: e.source,
      answer: cfg.answer(cfg.compute(e.data, exO(e)), exO(e))
    }));
    function loadExample(id){
      const e = cfg.examples.find(x => x.id === id); if (!e) return;
      Object.assign(S, { data: [...e.data], O: exO(e), example: id });
      writeText(); update(); fit();
    }

    /* ---------- markup ---------- */
    root.innerHTML = `
    <div class="page data-page">
      <header class="page-head"><h1>${K("title")}</h1></header>

      <section class="work">
        <div class="plot-col">
          <div class="plot-bar">
            <span class="plot-title">${t("dt.dotplot")}</span>
            <div class="bar-actions">
              <button class="btn" id="fitBtn" title="${t("fitTitle")}">${t("fitView")}</button>
            </div>
          </div>
          <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${t("dt.dotplot")}"></canvas></div>
          <div class="legend">
            <div class="chips" id="chips"></div>
            <span class="hint" id="hint">${t("dt.hint")}</span>
          </div>
        </div>

        <aside class="controls" aria-label="${t("controls")}">
          <div class="group">
            <div class="group-head"><h2><label for="dataIn">${t("dt.data")}</label></h2><span class="count" id="count"></span></div>
            <textarea class="data-in" id="dataIn" rows="4" spellcheck="false" autocomplete="off"></textarea>
            <p class="note" id="dataNote">${t("dt.sepHint")}</p>
            <div class="data-actions">
              <button class="btn" id="sortBtn">${t("dt.sort")}</button>
            </div>
          </div>
          ${(cfg.segs || []).map(g => `
          <div class="group">
            <h2>${K("seg." + g.key)}</h2>
            <div class="seg full" role="group" data-seg="${g.key}">
              ${g.values.map(v => `<button data-v="${v}" aria-pressed="false">${K(`seg.${g.key}.${v}`)}</button>`).join("")}
            </div>
          </div>`).join("")}
          ${(cfg.options || []).length ? `<div class="group">${cfg.options.map(o => `<label class="check"><input type="checkbox" data-opt="${o.key}">${K("opt." + o.key)}</label>`).join("")}</div>` : ""}
          <div class="group result" aria-live="polite">
            <div class="p-big" id="big"></div>
            <div class="p-sub" id="sub"></div>
            <dl class="facts" id="facts"></dl>
          </div>
        </aside>
      </section>

      <section class="formulas" aria-label="${t("formulas")}">
        ${formulasHead()}
        <div id="frows"></div>
        <div id="vars"></div>
      </section>

      ${sectionsHtml({ about: K("about"), notes: cfg.notes.map(K), sources: cfg.sources.map(K) })}
    </div>`;

    const el = id => $("#" + id, root), dataIn = el("dataIn");
    let R = null;

    /* ---------- data box ---------- */
    function writeText(){ dataIn.value = formatData(S.data); dataIn.removeAttribute("aria-invalid"); }
    function readText(){
      const { values, bad } = parseData(dataIn.value), note = el("dataNote");
      const few = values.length < cfg.minN;
      note.classList.toggle("err", bad.length > 0 || few);
      note.textContent = bad.length ? t("dt.bad", { v: bad.slice(0, 3).join(" ") }) : few ? t("dt.few", { n: cfg.minN }) : t("dt.sepHint");
      dataIn.setAttribute("aria-invalid", bad.length > 0 || few);
      return bad.length ? null : values;
    }

    /* ---------- render ---------- */
    function renderFormulas(){
      const box = el("frows");
      const rows = cfg.formulas(R, S.O);
      box.innerHTML = rows.map((r, i) => `<div class="frow"><span class="flabel">${r.label}</span><div class="fmath" data-row="${i}">${
        r.chain ? M.math(M.row(r.chain.join(M.o("=")))) : r.html}</div></div>`).join("");
      rows.forEach((r, i) => {
        if (!r.chain) return;
        const f = $(`[data-row="${i}"]`, box);
        if (f.scrollWidth > f.clientWidth + 2) f.innerHTML = M.chain(r.chain, 3);
        if (f.scrollWidth > f.clientWidth + 2) f.innerHTML = M.chain(r.chain, 2);
      });
      el("vars").innerHTML = varsTableHtml(cfg.vars(R, S.O));
    }
    function renderResult(){
      const r = cfg.result(R, S.O);
      el("big").innerHTML = r.big; el("sub").innerHTML = r.sub;
      el("facts").innerHTML = r.facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    }
    function renderR(){
      const L = [`# ${K("title")}`, ...rVector(S.data), ...cfg.r(R, S.O)];
      el("rcode").innerHTML = codeHtml(L.join("\n"));
    }
    function syncControls(){
      el("count").textContent = t("dt.count", { n: S.data.length });
      $$("[data-seg]", root).forEach(g => $$("button", g).forEach(b => b.setAttribute("aria-pressed", b.dataset.v === S.O[g.dataset.seg])));
      $$("[data-opt]", root).forEach(c => { c.checked = !!S.O[c.dataset.opt]; });
    }
    function update(){
      syncControls();
      if (S.data.length < cfg.minN){ R = null; plot.draw(); return; }
      R = cfg.compute(S.data, S.O);
      renderFormulas(); renderResult(); renderR();
      markExample(el("examples"), S.example);
      plot.draw();
    }

    /* ---------- graph: dot plot ---------- */
    let layout = [];
    function fit(){
      if (!S.data.length){ plot.x0 = 0; plot.x1 = 10; plot.draw(); return; }
      const lo = Math.min(...S.data), hi = Math.max(...S.data), w = hi - lo || Math.max(1, Math.abs(lo) * 0.2);
      plot.x0 = lo - 0.1 * w; plot.x1 = hi + 0.1 * w;
      plot.draw();
    }
    function computeLayout(p){
      const axis = p.pad.t + p.ph, board = axis - (cfg.baseGap ?? 4), top = p.pad.t + (cfg.topSpace ?? 26);
      const order = S.data.map((v, i) => i).sort((a, b) => S.data[a] - S.data[b]);
      const stacks = r => {
        const cols = new Map(), out = [];
        for (const i of order){
          const px = p.X(S.data[i]), col = Math.round(px / (2 * r + 1)), k = cols.get(col) || 0;
          cols.set(col, k + 1); out.push({ i, v: S.data[i], px, k });
        }
        return out;
      };
      let r = 7, L = stacks(r);
      const tall = Math.max(1, ...L.map(d => d.k + 1));
      const fitR = Math.max(2.2, Math.min(7, (board - top) / (2 * tall + 0.5)));
      if (fitR < r){ r = fitR; L = stacks(r); }
      return L.map(d => ({ ...d, r, py: board - r - 1 - d.k * (2 * r + 0.6) }));
    }
    function drawPlot(p){
      const C = p.colors(), c = p.ctx;
      p.y0 = 0; p.y1 = 1;
      p.grid(C, { yTicks: [] });
      layout = computeLayout(p);
      if (!R){ return; }
      cfg.back?.(p, C, R, S.O, layout);
      p.clip(() => {
        for (const d of layout){
          const st = cfg.dot?.(d.i, d.v, R, S.O, C) || {};
          c.fillStyle = st.fill ?? C.muted; c.strokeStyle = st.stroke ?? C.surface; c.lineWidth = st.width ?? 1.2;
          c.beginPath(); c.arc(d.px, d.py, d.r, 0, Math.PI * 2); c.fill(); c.stroke();
        }
      });
      const drag = p.drag?.type === "handle" ? layout.find(d => d.i === p.drag.key) : null;
      if (drag) p.pill(drag.px, Math.max(p.pad.t, drag.py - drag.r - 26), show(trim(drag.v, 4)), C, false);
      cfg.front?.(p, C, R, S.O, layout);
    }
    const plot = new Plot(el("plot"), {
      draw: drawPlot,
      handles: () => layout.map(d => ({ key: d.i, x: d.v, py: d.py, r: d.r + 4 })),
      onFit: fit,
      onHandle(i, x){
        const dec = Num.decimalsFor(Num.niceStep(plot.x1 - plot.x0, 100));
        S.data[i] = +x.toFixed(dec);
        S.example = null; writeText(); update();
      },
    });
    plot.pad.l = 16;

    /* ---------- events ---------- */
    bindCopy($(".sections", root));
    dataIn.addEventListener("input", () => {
      const v = readText(); if (!v) return;
      S.data = v; S.example = null;
      const lost = v.some(x => x < plot.x0 || x > plot.x1);
      update(); if (lost) fit();
    });
    dataIn.addEventListener("change", () => { if (readText() && S.data.length >= cfg.minN) writeText(); });
    el("sortBtn").addEventListener("click", () => { S.data.sort((a, b) => a - b); writeText(); readText(); update(); });
    $$("[data-seg]", root).forEach(g => $$("button", g).forEach(b => b.addEventListener("click", () => {
      S.O[g.dataset.seg] = b.dataset.v; S.example = null; update();
    })));
    $$("[data-opt]", root).forEach(c => c.addEventListener("change", () => { S.O[c.dataset.opt] = c.checked; update(); }));
    el("fitBtn").addEventListener("click", fit);
    el("examples").innerHTML = examplesHtml(exList(), S.example);
    el("examples").addEventListener("click", e => { const b = e.target.closest("[data-ex]"); if (b) loadExample(b.dataset.ex); });

    const onTheme = () => plot.draw();
    document.addEventListener("themechange", onTheme);

    writeText(); readText();
    if (S.range) [plot.x0, plot.x1] = S.range; else fit();
    update();
    return () => { S.range = [plot.x0, plot.x1]; plot.destroy(); document.removeEventListener("themechange", onTheme); };
  };
}

/* ---------- small statistics helpers shared by the descriptive pages ---------- */
const Desc = {
  sum: xs => xs.reduce((s, x) => s + x, 0),
  mean: xs => Desc.sum(xs) / xs.length,
  sorted: xs => [...xs].sort((a, b) => a - b),
  /* Barbetta: value at position pos (1-based) of the ordered data, interpolating linearly. */
  at(sorted, pos){
    const n = sorted.length, k = Math.floor(pos + 1e-9), f = pos - k;
    if (k < 1) return { k: 1, f: 0, v: sorted[0] };
    if (k >= n) return { k: n, f: 0, v: sorted[n - 1] };
    return { k, f: f < 1e-9 ? 0 : f, v: sorted[k - 1] + (f < 1e-9 ? 0 : f) * (sorted[k] - sorted[k - 1]) };
  },
  median: xs => Desc.at(Desc.sorted(xs), (xs.length + 1) / 2).v,
};
