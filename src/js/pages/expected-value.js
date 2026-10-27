"use strict";
/* ============================================================
   Page: Expected value (with variance) of a discrete random variable
     E(X) = Σ x·p(x)
     V(X) = Σ x²·p(x) − [E(X)]²      σ = √V(X)
     E(aX + b) = a·E(X) + b          V(aX + b) = a²·V(X)
   Sources: Barbetta 5.1.3 (eq. 5.2 to 5.5) · Bussab & Morettin 6.3
   ============================================================ */
PAGES["expected-value"] = function ExpectedValuePage(root){
  const S = ExpectedValuePage.state || (ExpectedValuePage.state = {
    rows: [["0", "1/4"], ["1", "1/2"], ["2", "1/4"]], a: "1", b: "0", example: "coins", range: null
  });
  const MAXK = 12;

  /* ---------- maths ---------- */
  function values(st = S){
    const x = st.rows.map(r => parseNum(r[0])), p = st.rows.map(r => parseProb(r[1]));
    const a = parseNum(st.a), b = parseNum(st.b);
    if (x.some(v => v == null)) return { err: "ev.err.x" };
    if (new Set(x).size < x.length) return { err: "ev.err.dup" };
    if (p.some(v => v == null || v < 0 || v > 1)) return { err: "ev.err.p" };
    const sum = p.reduce((s, v) => s + v, 0);
    if (Math.abs(sum - 1) > 1e-3) return { err: "ev.err.sum", sum, x, p };
    if (a == null || b == null) return { err: "ev.err.ab" };
    const E = x.reduce((s, v, i) => s + v * p[i], 0), E2 = x.reduce((s, v, i) => s + v * v * p[i], 0);
    const Var = Math.max(0, E2 - E * E);
    return { x, p, sum, E, E2, V: Var, sd: Math.sqrt(Var), a, b, tr: a !== 1 || b !== 0, EY: a * E + b, VY: a * a * Var, raw: st.rows };
  }

  /* ---------- examples ---------- */
  const EXAMPLES = [
    { id: "coins", rows: [["0", "1/4"], ["1", "1/2"], ["2", "1/4"]], source: "slides" },
    { id: "die", rows: [1, 2, 3, 4, 5, 6].map(v => [String(v), "1/6"]), source: "Barbetta · 5.1.3" },
    { id: "slides", rows: [["-2", "0.2"], ["0", "0.5"], ["2", "0.3"]], source: "slides" },
    { id: "defects", rows: [["0", "0.36"], ["1", "0.48"], ["2", "0.16"]], source: () => `Barbetta · ${t("exercise")} 5.4` },
    { id: "profit", rows: [["6", "0.7"], ["0", "0.2"], ["-2", "0.1"]], source: () => `Barbetta · ${t("exercise")} 5.5` },
    { id: "profit1", rows: [["6", "0.7"], ["0", "0.2"], ["-2", "0.1"]], a: "1", b: "1", source: () => `Barbetta · ${t("exercise")} 5.5` },
    { id: "profit2", rows: [["6", "0.7"], ["0", "0.2"], ["-2", "0.1"]], a: "2", b: "0", source: () => `Barbetta · ${t("exercise")} 5.5` },
  ];
  const X = M.i("X"), EX = M.row(M.i("E"), M.paren(X)), VX = M.row(M.i("V"), M.paren(X)), Y = M.i("Y");
  const EY_ = M.row(M.i("E"), M.paren(Y)), VY_ = M.row(M.i("V"), M.paren(Y));
  const answer = V => V.tr
    ? `<math>${EY_}<mo>=</mo>${M.n(trim(V.EY, 4))}<mo separator="true">;</mo><mspace width="0.4em"></mspace>${VY_}<mo>=</mo>${M.n(trim(V.VY, 4))}</math>`
    : `<math>${EX}<mo>=</mo>${M.n(trim(V.E, 4))}<mo separator="true">;</mo><mspace width="0.4em"></mspace>${VX}<mo>=</mo>${M.n(trim(V.V, 4))}</math>`;
  const exList = () => EXAMPLES.map(e => ({ id: e.id, title: t("ev.ex." + e.id),
    source: typeof e.source === "function" ? e.source() : e.source === "slides" ? t("srcSlides") : e.source,
    answer: answer(values({ rows: e.rows, a: e.a ?? "1", b: e.b ?? "0" })) }));
  function loadExample(id){
    const e = EXAMPLES.find(x => x.id === id); if (!e) return;
    S.rows = e.rows.map(r => [...r]); S.a = e.a ?? "1"; S.b = e.b ?? "0"; S.example = id;
    buildRows(); update(); fit();
  }

  /* ---------- markup ---------- */
  root.innerHTML = `
  <div class="page ev-page">
    <header class="page-head"><h1>${t("ev.title")}</h1></header>
    <section class="work">
      <div class="plot-col">
        <div class="plot-bar">
          <span class="plot-title">${t("ev.graph")}</span>
          <div class="bar-actions"><button class="btn" id="fitBtn" title="${t("fitTitle")}">${t("fitView")}</button></div>
        </div>
        <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${t("ev.graph")}"></canvas></div>
        <div class="legend"><div class="chips" id="chips"></div><span class="hint">${t("ev.hint")}</span></div>
      </div>
      <aside class="controls" aria-label="${t("controls")}">
        <div class="group">
          <h2>${t("ev.dist")}</h2>
          <div class="ev-table xp" id="xpTable"></div>
          <div class="data-actions">
            <button class="btn" id="addBtn">${t("ev.add")}</button>
            <button class="btn" id="normBtn" title="${t("ev.normTitle")}">${t("ev.norm")}</button>
          </div>
          <p class="note">${t("venn.fracHint")}</p>
          <p class="note err" id="err" hidden></p>
        </div>
        <div class="group">
          <h2>${t("ev.trans")} <math>${M.row(Y, M.o("="), M.i("a"), X, M.o("+"), M.i("b"))}</math></h2>
          <div class="ab-row">
            <label><span class="sym">a</span>${numInput("aN", 1)}</label>
            <label><span class="sym">b</span>${numInput("bN", 1)}</label>
          </div>
          <p class="note ab-note">${t("ev.transHint")}</p>
        </div>
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
    ${sectionsHtml({ about: t("ev.about"), notes: ["note.weights", "note.center", "note.shortcut", "note.linear"].map(k => t("ev." + k)), sources: ["src.barbetta", "src.bussab", "src.slides"].map(k => t("ev." + k)) })}
  </div>`;
  const el = id => $("#" + id, root);
  let V = values();

  function buildRows(){
    el("xpTable").innerHTML = `
      <span class="ev-h"><math><mi>x</mi></math></span><span class="ev-h"><math>${M.row(M.i("p"), M.paren(M.i("x")))}</math></span><span></span>
      ${S.rows.map((r, i) => `
        ${numInput("x" + i, 1, `data-i="${i}" data-c="0"`)}${numInput("p" + i, 0.01, `data-i="${i}" data-c="1"`)}
        <button class="ev-del" data-del="${i}" aria-label="${t("ev.remove")}" ${S.rows.length <= 1 ? "disabled" : ""}>×</button>`).join("")}`;
    $$("#xpTable .num", root).forEach(inp => {
      const c = +inp.dataset.c;
      inp.value = c ? probIn(S.rows[+inp.dataset.i][1]) : loc(S.rows[+inp.dataset.i][0]);
      inp.addEventListener("input", () => {
        const v = c ? parseProb(inp.value) : parseNum(inp.value), ok = v != null && (!c || (v >= 0 && v <= 1));
        inp.setAttribute("aria-invalid", !ok);
        if (ok){ S.rows[+inp.dataset.i][c] = c ? inp.value.replace(",", ".").trim() : String(v); S.example = null; update(true); }
      });
      inp.addEventListener("change", () => { if (!c) fitIfLost(); });
    });
    el("addBtn").disabled = S.rows.length >= MAXK;
  }
  function syncInputs(){
    $$("#xpTable .num", root).forEach(inp => {
      if (inp === document.activeElement) return;
      const r = S.rows[+inp.dataset.i]; inp.value = +inp.dataset.c ? probIn(r[1]) : loc(r[0]);
    });
    for (const [id, k] of [["aN", "a"], ["bN", "b"]]) if (el(id) !== document.activeElement) el(id).value = loc(S[k]);
  }

  /* ---------- render ---------- */
  function update(fromInput){
    V = values();
    if (!fromInput) syncInputs();
    el("err").hidden = !V.err; el("normBtn").hidden = V.err !== "ev.err.sum";
    if (V.err){ el("err").textContent = t(V.err, { s: show(trim(V.sum ?? 0, 4)) }); plot.draw(); return; }
    const n4 = v => M.n(trim(v, 4)), xm = v => v < 0 ? M.paren(M.n(trim(v, 6))) : M.n(trim(v, 6));
    const px = M.row(M.i("p"), M.paren(M.i("x")));
    const terms = V.x.map((x, i) => M.row(xm(x), M.o("·"), probMath(V.raw[i][1], V.p[i])));
    const terms2 = V.x.map((x, i) => M.row(M.sup(xm(x), M.n(2)), M.o("·"), probMath(V.raw[i][1], V.p[i])));
    const rows = [
      { label: t("ev.f.E"), chain: [EX, M.row(`<mo>∑</mo>`, M.i("x"), M.o("·"), px), sumTerms(terms, 6), n4(V.E)] },
      { label: t("ev.f.V"), chain: [VX, M.row(`<mo>∑</mo>`, M.sup(M.i("x"), M.n(2)), M.o("·"), px, M.o(MINUS), M.sup(M.brack(EX), M.n(2))),
        M.row(sumTerms(terms2, 6), M.o(MINUS), M.sup(xm(+trim(V.E, 4)), M.n(2))), M.row(n4(V.E2), M.o(MINUS), n4(V.E * V.E)), n4(V.V)] },
      { label: t("ev.f.sd"), chain: [M.i("σ"), M.sqrt(VX), M.sqrt(n4(V.V)), n4(V.sd)] },
    ];
    if (V.tr){
      const a = M.n(trim(V.a, 6)), b = V.b < 0 ? M.row(M.o(MINUS), M.n(trim(-V.b, 6))) : M.row(M.o("+"), M.n(trim(V.b, 6)));
      rows.push({ label: t("ev.f.Y"), html:
        M.math(M.row(EY_, M.o("="), M.i("a"), EX, M.o("+"), M.i("b"), M.o("="), a, M.o("·"), n4(V.E), b, M.o("="), n4(V.EY))) +
        M.math(M.row(VY_, M.o("="), M.sup(M.i("a"), M.n(2)), VX, M.o("="), M.sup(V.a < 0 ? M.paren(a) : a, M.n(2)), M.o("·"), n4(V.V), M.o("="), n4(V.VY))) });
    }
    const box = el("frows");
    box.innerHTML = rows.map((r, i) => `<div class="frow"><span class="flabel">${r.label}</span><div class="fmath" data-row="${i}">${r.chain ? M.math(M.row(r.chain.join(M.o("=")))) : r.html}</div></div>`).join("");
    rows.forEach((r, i) => { if (!r.chain) return; const f = $(`[data-row="${i}"]`, box); if (f.scrollWidth > f.clientWidth + 2) f.innerHTML = M.chain(r.chain, 2); });
    const vars = [
      [EX, t("ev.sym.E"), show(trim(V.E, 4))], [VX, t("ev.sym.V"), show(trim(V.V, 4))], [M.i("σ"), t("ev.sym.sd"), show(trim(V.sd, 4))],
      [M.i("x"), t("ev.sym.x"), ""], [px, t("ev.sym.p"), ""],
      [M.row(`<mo>∑</mo>`, M.sup(M.i("x"), M.n(2)), M.o("·"), px), t("ev.sym.E2"), show(trim(V.E2, 4))],
    ];
    if (V.tr) vars.push([M.i("a"), t("ev.sym.a"), show(trim(V.a, 6))], [M.i("b"), t("ev.sym.b"), show(trim(V.b, 6))],
      [EY_, t("ev.sym.EY"), show(trim(V.EY, 4))], [VY_, t("ev.sym.VY"), show(trim(V.VY, 4))]);
    el("vars").innerHTML = varsTableHtml(vars);
    el("big").textContent = show(trim(V.E, 4));
    el("sub").innerHTML = `<math>${EX}</math>`;
    const facts = [[`<math>${VX}</math>`, show(trim(V.V, 4))], [t("ev.fact.sd"), show(trim(V.sd, 4))], [`<math>${M.row(`<mo>∑</mo>`, M.i("p"), M.paren(M.i("x")))}</math>`, show(trim(V.sum, 4))]];
    if (V.tr) facts.push([`<math>${EY_}</math>`, show(trim(V.EY, 4))], [`<math>${VY_}</math>`, show(trim(V.VY, 4))]);
    el("facts").innerHTML = facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    el("chips").innerHTML = `<span class="chip"><span class="sw"></span>X</span>` + (V.tr ? `<span class="chip pinned"><span class="sw"></span>Y = aX + b</span>` : "");
    const L = [`# ${t("ev.title")}`,
      `x <- c(${V.x.map(v => trim(v, 6)).join(", ")})`,
      `p <- c(${V.raw.map(r => rProb(r[1])).join(", ")})`,
      rLine("sum(p)", t("ev.r.sum"), 34),
      rLine("EX <- sum(x * p)", `E(X): ${trim(V.E, 4)}`, 34),
      rLine("VX <- sum(x^2 * p) - EX^2", `V(X): ${trim(V.V, 4)}`, 34),
      rLine("sqrt(VX)", `σ: ${trim(V.sd, 4)}`, 34)];
    if (V.tr) L.push(rLine(`a <- ${trim(V.a, 6)}; b <- ${trim(V.b, 6)}`, "", 34), rLine("a * EX + b", `E(Y): ${trim(V.EY, 4)}`, 34), rLine("a^2 * VX", `V(Y): ${trim(V.VY, 4)}`, 34));
    el("rcode").innerHTML = codeHtml(L.join("\n"));
    markExample(el("examples"), S.example);
    plot.draw();
  }

  /* ---------- graph ---------- */
  const allX = () => {
    const xs = S.rows.map(r => parseNum(r[0])).filter(v => v != null);
    const a = parseNum(S.a), b = parseNum(S.b);
    return a != null && b != null && (a !== 1 || b !== 0) ? [...xs, ...xs.map(x => a * x + b)] : xs;
  };
  function fit(){
    const xs = allX(); if (!xs.length) return;
    const lo = Math.min(...xs), hi = Math.max(...xs), w = Math.max(hi - lo, 2);
    plot.x0 = lo - 0.15 * w - 0.5; plot.x1 = hi + 0.15 * w + 0.5; plot.draw();
  }
  function fitIfLost(){ const xs = allX(); if (xs.some(x => x < plot.x0 || x > plot.x1)) fit(); }
  let yTop = 1;
  function drawPlot(p){
    const C = p.colors(), c = p.ctx, ok = !V.err || V.err === "ev.err.sum";
    const xs = ok ? (V.x || []) : [], ps = ok ? (V.p || []) : [];
    if (!(p.drag?.type === "handle")) yTop = Math.max(0.1, ...ps) * 1.3;
    p.y0 = 0; p.y1 = yTop;
    p.grid(C);
    if (!xs.length) return;
    const sorted = [...xs].sort((a, b) => a - b); let gap = Infinity;
    for (let i = 1; i < sorted.length; i++) gap = Math.min(gap, sorted[i] - sorted[i - 1]);
    let w = Math.min(0.5, isFinite(gap) ? gap * 0.5 : 0.5);
    if (V.tr && !V.err){ const ys = xs.map(x => V.a * x + V.b).sort((a, b) => a - b); for (let i = 1; i < ys.length; i++) w = Math.min(w, (ys[i] - ys[i - 1]) * 0.5); }
    w = Math.max(w, (p.x1 - p.x0) / p.pw * 3);
    p.bars(xs.map((x, i) => ({ x, y: ps[i], on: true })), C, w);
    // Y = aX + b: same probabilities at the new values
    if (V.tr && !V.err){
      c.save(); c.setLineDash([4, 3]); c.strokeStyle = C.pin; c.lineWidth = 1.5;
      xs.forEach((x, i) => { const y = V.a * x + V.b; c.strokeRect(p.X(y - w / 2), p.Y(ps[i]), p.X(y + w / 2) - p.X(y - w / 2), p.Y(0) - p.Y(ps[i])); });
      c.restore();
      p.vline(V.EY, C.pin, [5, 4], p.y1, 1.5);
    }
    xs.forEach((x, i) => {   // grab knob on each bar top
      if (x < p.x0 || x > p.x1) return;
      c.fillStyle = C.surface; c.strokeStyle = C.accent; c.lineWidth = 2;
      c.beginPath(); c.arc(p.X(x), p.Y(ps[i]), 4.5, 0, Math.PI * 2); c.fill(); c.stroke();
      if (p.X(x + w / 2) - p.X(x - w / 2) > 30 || xs.length <= 8){
        c.font = `11px ${C.font}`; c.textAlign = "center"; c.textBaseline = "bottom"; c.lineJoin = "round";
        c.strokeStyle = C.surface; c.lineWidth = 4; c.strokeText(show(trim(ps[i], 4)), p.X(x), p.Y(ps[i]) - 8);
        c.fillStyle = C.muted; c.fillText(show(trim(ps[i], 4)), p.X(x), p.Y(ps[i]) - 8);
      }
    });
    if (V.err) return;
    // E(X) as the balance point, and E(X) ± σ
    const axis = p.Y(0), ex = p.X(V.E);
    for (const s of [-1, 1]) p.vline(V.E + s * V.sd, C.muted, [3, 4], p.y1, 1);
    p.vline(V.E, C.accent, [], p.y1, 1.5);
    if (V.E >= p.x0 && V.E <= p.x1){
      c.fillStyle = C.accent; c.beginPath(); c.moveTo(ex, axis - 9); c.lineTo(ex - 8, axis + 1); c.lineTo(ex + 8, axis + 1); c.closePath(); c.fill();
    }
    const [l, r] = p.pill(ex, 6, `E(X) = ${show(trim(V.E, 3))}`, C, true);
    if (V.tr){ const ey = p.X(V.EY); p.pill(ey, ey > l - 60 && ey < r + 60 ? 30 : 6, `E(Y) = ${show(trim(V.EY, 3))}`, C, false); }
    c.font = `11px ${C.font}`; c.fillStyle = C.muted; c.textBaseline = "top";
    if (V.sd > 0){ c.textAlign = "right"; c.fillText("E(X) − σ", p.X(V.E - V.sd) - 4, p.pad.t + 4); c.textAlign = "left"; c.fillText("E(X) + σ", p.X(V.E + V.sd) + 4, p.pad.t + 4); }
  }
  const plot = new Plot(el("plot"), {
    draw: drawPlot,
    handles: () => (V.err && V.err !== "ev.err.sum") ? [] : (V.x || []).map((x, i) => ({ key: i, x, py: plot.Y(V.p[i]), r: 12 })),
    onFit: fit,
    onHandle(i, x, y){
      const v = clamp(Math.round(y * 100) / 100, 0, 1), ps = S.rows.map(r => parseProb(r[1]) ?? 0);
      const rest = ps.reduce((s, q, j) => j === i ? s : s + q, 0), k = S.rows.length;
      S.rows[i][1] = trim(v, 2);
      if (k > 1){
        const others = S.rows.map((_, j) => j).filter(j => j !== i);
        others.forEach(j => { S.rows[j][1] = trim(rest > 0 ? ps[j] * (1 - v) / rest : (1 - v) / (k - 1), 4); });
        const big = others.reduce((m, j) => (parseProb(S.rows[j][1]) > parseProb(S.rows[m][1]) ? j : m), others[0]);
        const sumOthers = others.reduce((s, j) => j === big ? s : s + parseProb(S.rows[j][1]), 0);
        S.rows[big][1] = trim(Math.max(0, 1 - v - sumOthers), 4);
      }
      S.example = null; update();
    },
  });

  /* ---------- events ---------- */
  bindCopy($(".sections", root)); bindNudge($(".ab-row", root));
  el("xpTable").addEventListener("click", e => {
    const del = e.target.closest("[data-del]"); if (!del || S.rows.length <= 1) return;
    S.rows.splice(+del.dataset.del, 1); S.example = null; buildRows(); update();
  });
  el("addBtn").addEventListener("click", () => {
    if (S.rows.length >= MAXK) return;
    const xs = S.rows.map(r => parseNum(r[0])).filter(v => v != null);
    S.rows.push([String(xs.length ? Math.max(...xs) + 1 : 0), "0"]); S.example = null; buildRows(); update(); fitIfLost();
  });
  el("normBtn").addEventListener("click", () => {
    const ps = S.rows.map(r => parseProb(r[1]) ?? 0), s = ps.reduce((a, b) => a + b, 0); if (!(s > 0)) return;
    S.rows.forEach((r, i) => { r[1] = trim(ps[i] / s, 4); }); S.example = null; update();
  });
  for (const [id, k] of [["aN", "a"], ["bN", "b"]]){
    el(id).addEventListener("input", () => { const v = parseNum(el(id).value); el(id).setAttribute("aria-invalid", v == null); if (v != null){ S[k] = String(v); S.example = null; update(true); fitIfLost(); } });
    el(id).addEventListener("change", () => { fitIfLost(); update(); });
  }
  el("fitBtn").addEventListener("click", fit);
  el("examples").innerHTML = examplesHtml(exList(), S.example);
  el("examples").addEventListener("click", e => { const b = e.target.closest("[data-ex]"); if (b) loadExample(b.dataset.ex); });
  const onTheme = () => plot.draw();
  document.addEventListener("themechange", onTheme);
  buildRows();
  if (S.range) [plot.x0, plot.x1] = S.range; else fit();
  update();
  return () => { S.range = [plot.x0, plot.x1]; plot.destroy(); document.removeEventListener("themechange", onTheme); };
};
