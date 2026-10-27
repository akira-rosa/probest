"use strict";
/* ============================================================
   Shared page for paired data (x, y): Pearson's correlation and
   simple linear regression.

     PAGES["correlation"] = pairPage(CORRELATION);

   The pairs are typed one per line ("x y") and drawn as a scatter
   plot; every point can be dragged in both directions.

   Config: id, key, minN, data [[x, y]…], example, options [{ key, def }],
     controls(S) → extra HTML for the controls column, bind(root, S, update),
     compute(P, S), formulas(R, S), vars(R, S), result(R, S), answer(R),
     r(R, S), back / front (p, C, R, S), handles(R, S, plot) and onHandle(key, x, y, S) for extra markers,
     examples [{ id, data, set, source }], notes, sources
   ============================================================ */

/* Pairs from text: one pair per line, the two numbers separated by spaces, tabs or semicolons
   (in English also a comma; in Portuguese the comma is the decimal mark). */
function parsePairs(text){
  const comma = usesComma(), pairs = [], bad = [];
  for (const raw of String(text).split(/\n+/)){
    const line = raw.replace(/[()\[\]{}]/g, " ").replace(/−/g, "-").trim(); if (!line) continue;
    const parts = (comma ? line.split(/[\s;]+/) : line.split(/[\s;,]+/)).filter(Boolean);
    const v = parts.map(parseNum);
    if (v.length !== 2 || v.some(x => x == null)) bad.push(raw.trim()); else pairs.push(v);
  }
  return { pairs, bad };
}
const formatPairs = P => P.map(([x, y]) => `${loc(trim(x, 6))}${usesComma() ? "; " : ", "}${loc(trim(y, 6))}`).join("\n");

/* Sums used by both pages. */
function pairSums(P){
  const n = P.length; let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of P){ sx += x; sy += y; sxy += x * y; sxx += x * x; syy += y * y; }
  const Sxx = n * sxx - sx * sx, Syy = n * syy - sy * sy, Sxy = n * sxy - sx * sy;
  return { n, sx, sy, sxy, sxx, syy, Sxx, Syy, Sxy, mx: sx / n, my: sy / n };
}

function pairPage(cfg){
  const K = k => t(`${cfg.key}.${k}`);
  return function PairPage(root){
    const S = cfg.state || (cfg.state = {
      P: cfg.data.map(p => [...p]), O: Object.fromEntries((cfg.options || []).map(o => [o.key, o.def])),
      ...(cfg.initial || {}), example: cfg.example ?? null, range: null, names: cfg.names || ["x", "y"]
    });

    /* ---------- examples ---------- */
    const exList = () => cfg.examples.map(e => ({ id: e.id, title: K("ex." + e.id),
      source: typeof e.source === "function" ? e.source() : e.source === "slides" ? t("srcSlides") : e.source,
      answer: cfg.answer(cfg.compute(e.data, { ...S, ...(e.set || {}) })) }));
    function loadExample(id){
      const e = cfg.examples.find(x => x.id === id); if (!e) return;
      Object.assign(S, { P: e.data.map(p => [...p]), example: id, xName: null, yName: null }, e.set || {});
      writeText(); readText(); update(); fit();
    }

    /* ---------- markup ---------- */
    root.innerHTML = `
    <div class="page data-page pair-page">
      <header class="page-head"><h1>${K("title")}</h1></header>
      <section class="work">
        <div class="plot-col">
          <div class="plot-bar"><span class="plot-title">${K("graph")}</span>
            <div class="bar-actions"><button class="btn" id="fitBtn" title="${t("fitTitle")}">${t("fitView")}</button></div></div>
          <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${K("graph")}"></canvas></div>
          <div class="legend"><div class="chips" id="chips"></div><span class="hint">${t("pair.hint")}</span></div>
        </div>
        <aside class="controls" aria-label="${t("controls")}">
          <div class="group">
            <div class="group-head"><h2><label for="dataIn">${t("pair.data")}</label></h2><span class="count" id="count"></span></div>
            <textarea class="data-in" id="dataIn" rows="6" spellcheck="false" autocomplete="off"></textarea>
            <p class="note" id="dataNote">${t("pair.sepHint")}</p>
          </div>
          ${cfg.controls ? cfg.controls(S) : ""}
          ${(cfg.options || []).length ? `<div class="group">${cfg.options.map(o => `<label class="check check-top"><input type="checkbox" data-opt="${o.key}">${K("opt." + o.key)}</label>`).join("")}</div>` : ""}
          <div class="group result" aria-live="polite">
            <div class="p-big" id="big"></div>
            <div class="p-sub" id="sub"></div>
            <dl class="facts" id="facts"></dl>
          </div>
        </aside>
      </section>
      <section class="formulas" aria-label="${t("formulas")}">
        <h2>${t("formulas")}</h2>
        <div id="frows"></div>
        <div id="vars"></div>
      </section>
      ${sectionsHtml({ about: K("about"), notes: cfg.notes.map(K), sources: cfg.sources.map(K) })}
    </div>`;
    const el = id => $("#" + id, root), dataIn = el("dataIn");
    let R = null;

    function writeText(){ dataIn.value = formatPairs(S.P); dataIn.removeAttribute("aria-invalid"); }
    function readText(){
      const { pairs, bad } = parsePairs(dataIn.value), note = el("dataNote"), few = pairs.length < cfg.minN;
      note.classList.toggle("err", bad.length > 0 || few);
      note.textContent = bad.length ? t("pair.bad", { v: bad[0] }) : few ? t("dt.few", { n: cfg.minN }) : t("pair.sepHint");
      dataIn.setAttribute("aria-invalid", bad.length > 0 || few);
      return bad.length ? null : pairs;
    }

    /* ---------- render ---------- */
    function update(){
      el("count").textContent = t("dt.count", { n: S.P.length });
      $$("[data-opt]", root).forEach(c => { c.checked = !!S.O[c.dataset.opt]; });
      R = S.P.length >= cfg.minN ? cfg.compute(S.P, S) : { err: "pair.err.few" };
      if (R.err){ el("big").textContent = "—"; el("sub").textContent = t(R.err); el("facts").innerHTML = ""; plot.draw(); return; }
      const rows = cfg.formulas(R, S), box = el("frows");
      box.innerHTML = rows.map((r, i) => `<div class="frow"><span class="flabel">${r.label}</span><div class="fmath" data-row="${i}">${r.chain ? M.math(M.row(r.chain.join(M.o("=")))) : r.html}</div></div>`).join("");
      rows.forEach((r, i) => { if (!r.chain) return; const f = $(`[data-row="${i}"]`, box); if (f.scrollWidth > f.clientWidth + 2) f.innerHTML = M.chain(r.chain, 2); });
      el("vars").innerHTML = varsTableHtml(cfg.vars(R, S));
      const res = cfg.result(R, S);
      el("big").innerHTML = res.big; el("sub").innerHTML = res.sub;
      el("facts").innerHTML = res.facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
      el("chips").innerHTML = res.chips || "";
      const L = [`# ${K("title")}`, ...rVector(S.P.map(p => p[0]), "x"), ...rVector(S.P.map(p => p[1]), "y"), ...cfg.r(R, S)];
      el("rcode").innerHTML = codeHtml(L.join("\n"));
      markExample(el("examples"), S.example);
      plot.draw();
    }

    /* ---------- graph ---------- */
    let yr = [0, 1];
    const pad = (lo, hi) => { const w = hi - lo || Math.max(1, Math.abs(lo) * 0.2); return [lo - 0.12 * w, hi + 0.12 * w]; };
    function fit(){
      if (!S.P.length) return;
      [plot.x0, plot.x1] = pad(Math.min(...S.P.map(p => p[0])), Math.max(...S.P.map(p => p[0])));
      plot.draw();
    }
    function drawPlot(p){
      const C = p.colors(), c = p.ctx;
      if (p.drag?.type !== "handle" && S.P.length){
        const ys = S.P.map(q => q[1]); if (cfg.yExtra && R && !R.err) ys.push(...cfg.yExtra(R, S));
        yr = pad(Math.min(...ys), Math.max(...ys));
      }
      [p.y0, p.y1] = yr; p.pad.l = 56;
      p.grid(C);
      if (!R || R.err){ for (const [x, y] of S.P) dot(p, c, C, x, y, C.muted); return; }
      cfg.back?.(p, C, R, S);
      S.P.forEach(([x, y], i) => dot(p, c, C, x, y, cfg.dotColor?.(i, R, S, C) || C.accent));
      cfg.front?.(p, C, R, S);
      const d = p.drag?.type === "handle" && typeof p.drag.key === "number" ? S.P[p.drag.key] : null;
      if (d) p.pill(p.X(d[0]), Math.max(p.pad.t, p.Y(d[1]) - 32), `(${show(trim(d[0], 3))}${t("listSep")}${show(trim(d[1], 3))})`, C, false);
      c.font = `11.5px ${C.font}`; c.fillStyle = C.muted; c.textAlign = "right"; c.textBaseline = "bottom";
      c.fillText(S.xName ? t(S.xName) : "x", p.pad.l + p.pw, p.pad.t + p.ph - 4);
      c.textAlign = "left"; c.textBaseline = "top"; c.fillText(S.yName ? t(S.yName) : "y", p.pad.l + 6, p.pad.t + 4);
    }
    function dot(p, c, C, x, y, col){
      if (x < p.x0 || x > p.x1) return;
      c.fillStyle = col; c.strokeStyle = C.surface; c.lineWidth = 1.5;
      c.beginPath(); c.arc(p.X(x), p.Y(y), 5.5, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    const plot = new Plot(el("plot"), {
      draw: drawPlot,
      handles: () => [...S.P.map(([x, y], i) => ({ key: i, x, py: plot.Y(y), r: 10 })), ...(R && !R.err && cfg.handles ? cfg.handles(R, S, plot) : [])],
      onFit: fit,
      onHandle(key, x, y){
        if (typeof key === "number"){
          const dx = Num.decimalsFor(Num.niceStep(plot.x1 - plot.x0, 100)), dy = Num.decimalsFor(Num.niceStep(plot.y1 - plot.y0, 100));
          S.P[key] = [+x.toFixed(dx), +y.toFixed(dy)]; S.example = null; writeText(); readText();
        } else cfg.onHandle?.(key, x, y, S, plot);
        update();
      },
    });
    plot.pad.l = 56;

    /* ---------- events ---------- */
    bindCopy($(".sections", root));
    dataIn.addEventListener("input", () => { const v = readText(); if (!v) return; S.P = v; S.example = null; S.xName = S.yName = null; update(); });
    dataIn.addEventListener("change", () => { if (readText() && S.P.length >= cfg.minN){ writeText(); fit(); } });
    $$("[data-opt]", root).forEach(c => c.addEventListener("change", () => { S.O[c.dataset.opt] = c.checked; update(); }));
    cfg.bind?.(root, S, update);
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
