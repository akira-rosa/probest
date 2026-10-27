"use strict";
/* ============================================================
   Page: Normal distribution
   ============================================================ */
PAGES.normal = function NormalPage(root){
  // State lives on the function so it survives re-renders (e.g. switching language).
  const S = NormalPage.state || (NormalPage.state = { mu: 0, sd: 1, mode: "between", a: -1, b: 1, view: "pdf", pins: [], qp: "0.95", range: null });
  const { Phi, PhiInv, normPdf } = Num;

  const glyph = mode => {
    const pts = []; for (let i = 0; i <= 32; i++) pts.push([i + 1, 16 - 13 * Math.exp(-0.5 * ((i - 16) / 5.5) ** 2)]);
    const line = "M" + pts.map(p => p.join(",")).join("L");
    const area = line + "L33,16L1,16Z";
    const rects = { left: [[0, 21]], right: [[13, 34]], between: [[11, 23]], outside: [[0, 11], [23, 34]] }[mode]
      .map(([a, b]) => `<rect x="${a}" y="0" width="${b - a}" height="18"/>`).join("");
    return `<svg viewBox="0 0 34 18" aria-hidden="true"><defs><clipPath id="g-${mode}">${rects}</clipPath></defs>
      <path d="${area}" fill="currentColor" opacity=".3" clip-path="url(#g-${mode})"/>
      <path d="${line}" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <path d="M1,16.5H33" stroke="currentColor" stroke-width="1" opacity=".5"/></svg>`;
  };
  const OR = t("or");
  const MODES = [["left", t("below"), "P(X ≤ x)"], ["right", t("above"), "P(X ≥ x)"], ["between", t("between"), "P(a ≤ X ≤ b)"], ["outside", t("outside"), `P(X ≤ a ${OR} X ≥ b)`]];
  const sym = s => `<span class="sym">${s}</span>`;
  // Text inputs (not type=number) so both "1.5" and "1,5" are accepted. Arrow keys step by data-step.
  const numInput = (id, step, extra = "") => `<input class="num" id="${id}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-step="${step}" ${extra}>`;

  root.innerHTML = `
  <div class="page">
    <header class="page-head">
      <div>
        <h1>${t("n.title")}</h1>
        <p class="lede">${t("n.lede", { mu: sym("μ"), sd: sym("σ") })}</p>
      </div>
    </header>

    <section class="formulas" aria-label="${t("formulas")}">
      <div class="frow"><span class="flabel" id="defLabel"></span><div class="fmath" id="fDef"></div></div>
      <div class="frow"><span class="flabel">${t("probability")}</span><div class="fmath" id="fProb"></div></div>
    </section>

    <section class="work">
      <div class="plot-col">
        <div class="plot-bar">
          <div class="seg" role="group" aria-label="${t("graphType")}">
            <button data-view="pdf" aria-pressed="true">${t("density")}</button>
            <button data-view="cdf" aria-pressed="false">${t("cumulative")}</button>
          </div>
          <div class="bar-actions">
            <button class="btn" id="fitBtn" title="${t("fitTitle")}">${t("fitView")}</button>
            <button class="btn" id="pinBtn" title="${t("pinTitle")}">${t("pin")}</button>
            <button class="btn" id="unpinBtn" hidden>${t("clearPins")}</button>
          </div>
        </div>
        <div class="plot-wrap">
          <canvas id="plot" role="img" aria-label="${t("n.graph")}"></canvas>
        </div>
        <div class="legend">
          <div class="chips" id="chips"></div>
          <span class="hint" id="hint">${t("hint")}</span>
          <span class="readout" id="readout" hidden></span>
        </div>
      </div>

      <aside class="controls" aria-label="${t("controls")}">
        <div class="group">
          <h2>${t("parameters")}</h2>
          <div class="param">
            <label for="muN">${sym("μ")}${t("mean")}</label>
            ${numInput("muN", 0.1)}
            <input id="muR" type="range" min="-10" max="10" step="0.1" aria-label="${t("meanSlider")}">
          </div>
          <div class="param">
            <label for="sdN">${sym("σ")}${t("sd")}</label>
            ${numInput("sdN", 0.1)}
            <input id="sdR" type="range" min="0.1" max="5" step="0.01" aria-label="${t("sdSlider")}">
          </div>
        </div>

        <div class="group">
          <h2>${t("probability")}</h2>
          <div class="modes" role="group" aria-label="${t("region")}">
            ${MODES.map(([k, l, tip]) => `<button data-mode="${k}" title="${tip}" aria-pressed="false">${glyph(k)}<span>${l}</span></button>`).join("")}
          </div>
          <div class="bounds" id="bounds">
            <label id="aLbl"><span class="sym" id="aSym">a</span>${numInput("aN", 0.1)}</label>
            <label id="bLbl"><span class="sym">b</span>${numInput("bN", 0.1)}</label>
          </div>
          <div class="quick"><span>${t("range")}</span>
            <button class="btn" data-k="1">μ ± 1σ</button><button class="btn" data-k="2">μ ± 2σ</button><button class="btn" data-k="3">μ ± 3σ</button>
          </div>
        </div>

        <div class="group result" aria-live="polite">
          <div class="p-big" id="pBig"></div>
          <div class="p-sub" id="pSub"></div>
          <dl class="facts" id="facts"></dl>
        </div>

        <div class="group">
          <h2>${t("findX")}</h2>
          <div class="qrow">
            <label class="lbl" for="qp"><math><mi>P</mi><mo>(</mo><mi>X</mi><mo>≤</mo><mi>x</mi><mo>)</mo><mo>=</mo></math></label>
            ${numInput("qp", 0.01)}
            <span class="lbl"><math><mi>x</mi><mo>=</mo></math></span>
            <output class="qout" id="qx"></output>
            <button class="btn" id="qUse">${t("markX")}</button>
          </div>
        </div>
      </aside>
    </section>
  </div>`;

  const el = id => $("#" + id, root);
  const muN = el("muN"), muR = el("muR"), sdN = el("sdN"), sdR = el("sdR"), aN = el("aN"), bN = el("bN"), qp = el("qp");
  const twoSided = () => S.mode === "between" || S.mode === "outside";
  const bounds = () => twoSided() ? [Math.min(S.a, S.b), Math.max(S.a, S.b)] : [S.a, S.a];

  /* ---- probability ---- */
  function prob(){
    const z = x => (x - S.mu) / S.sd, [lo, hi] = bounds();
    switch (S.mode){
      case "left":    return Phi(z(lo));
      case "right":   return Phi(-z(lo));
      case "between": return Math.max(0, Phi(z(hi)) - Phi(z(lo)));
      case "outside": return Phi(z(lo)) + Phi(-z(hi));
    }
  }
  function regions(){
    const [lo, hi] = bounds();
    return { left: [[-Infinity, lo]], right: [[lo, Infinity]], between: [[lo, hi]], outside: [[-Infinity, lo], [hi, Infinity]] }[S.mode];
  }

  /* ---- formulas ---- */
  function renderFormulas(){
    const mu = trim(S.mu, 4), sd = trim(S.sd, 4), [lo, hi] = bounds();
    const x = M.i("x"), mu_ = M.i("μ"), sg = M.i("σ"), P = M.i("P"), X = M.i("X"), Ph = M.up("Φ");
    const Phi_ = inner => M.row(Ph, M.paren(inner));
    const gFrac = v => M.frac(M.row(M.i(v), M.o(MINUS), mu_), sg);
    const nFrac = v => M.frac(M.row(M.n(trim(v, 4)), M.minus(mu)), M.n(sd));
    const zv = v => M.n(((v - S.mu) / S.sd).toFixed(2));

    if (S.view === "pdf"){
      el("defLabel").textContent = t("density");
      const gen = M.row(M.frac(M.n(1), M.row(sg, M.sqrt(M.row(M.n(2), M.up("π"))))),
        M.sup(M.up("e"), M.row(M.o(MINUS), M.frac(M.sup(M.paren(M.row(x, M.o(MINUS), mu_)), M.n(2)), M.row(M.n(2), M.sup(sg, M.n(2)))))));
      const sub = M.row(M.frac(M.n(1), M.row(M.n(sd), M.sqrt(M.row(M.n(2), M.up("π"))))),
        M.sup(M.up("e"), M.row(M.o(MINUS), M.frac(M.sup(M.paren(M.row(x, M.minus(mu))), M.n(2)), M.row(M.n(2), M.o("·"), M.sup(M.n(sd), M.n(2)))))));
      el("fDef").innerHTML = M.math(M.row(M.i("f"), M.paren(x), M.o("="), gen, M.o("="), sub));
    } else {
      el("defLabel").textContent = t("cumulative");
      const l1 = M.row(M.i("F"), M.paren(x), M.o("="), P, M.paren(M.row(X, M.o("≤"), x)), M.o("="), Phi_(gFrac("x")), M.o("="),
        Phi_(M.frac(M.row(x, M.minus(mu)), M.n(sd))));
      const l2 = M.row(Ph, M.paren(M.i("z")), M.o("="), M.frac(M.n(1), M.sqrt(M.row(M.n(2), M.up("π")))),
        M.subsup(M.o("∫"), M.row(M.o(MINUS), M.i("∞")), M.i("z")), M.sup(M.up("e"), M.row(M.o(MINUS), M.frac(M.sup(M.i("t"), M.n(2)), M.n(2)))),
        M.row(M.up("d"), M.i("t")));
      el("fDef").innerHTML = M.math(l1) + M.math(l2, "res");
    }

    const p = M.prob(prob()), L = M.n(trim(lo, 4)), H = M.n(trim(hi, 4));
    let g, s;
    switch (S.mode){
      case "left":
        g = M.row(P, M.paren(M.row(X, M.o("≤"), x)), M.o("="), Phi_(gFrac("x")));
        s = M.row(P, M.paren(M.row(X, M.o("≤"), L)), M.o("="), Phi_(nFrac(lo)), M.o("="), Phi_(zv(lo)), M.o("="), p);
        break;
      case "right":
        g = M.row(P, M.paren(M.row(X, M.o("≥"), x)), M.o("="), M.n(1), M.o(MINUS), Phi_(gFrac("x")));
        s = M.row(P, M.paren(M.row(X, M.o("≥"), L)), M.o("="), M.n(1), M.o(MINUS), Phi_(nFrac(lo)), M.o("="), M.n(1), M.o(MINUS), Phi_(zv(lo)), M.o("="), p);
        break;
      case "between":
        g = M.row(P, M.paren(M.row(M.i("a"), M.o("≤"), X, M.o("≤"), M.i("b"))), M.o("="), Phi_(gFrac("b")), M.o(MINUS), Phi_(gFrac("a")));
        s = M.row(P, M.paren(M.row(L, M.o("≤"), X, M.o("≤"), H)), M.o("="), Phi_(nFrac(hi)), M.o(MINUS), Phi_(nFrac(lo)),
          M.o("="), Phi_(zv(hi)), M.o(MINUS), Phi_(zv(lo)), M.o("="), p);
        break;
      case "outside":
        g = M.row(P, M.paren(M.row(X, M.o("≤"), M.i("a"), M.t(OR), X, M.o("≥"), M.i("b"))), M.o("="), M.n(1), M.o(MINUS),
          M.brack(M.row(Phi_(gFrac("b")), M.o(MINUS), Phi_(gFrac("a")))));
        s = M.row(P, M.paren(M.row(X, M.o("≤"), L, M.t(OR), X, M.o("≥"), H)), M.o("="), M.n(1), M.o(MINUS),
          M.brack(M.row(Phi_(zv(hi)), M.o(MINUS), Phi_(zv(lo)))), M.o("="), p);
        break;
    }
    el("fProb").innerHTML = M.math(g) + M.math(s);
  }

  /* ---- result panel ---- */
  function renderResult(){
    const p = prob(), [lo, hi] = bounds(), z = v => show(((v - S.mu) / S.sd).toFixed(3));
    el("pBig").textContent = show(fmtProb(p));
    const pct = show((p * 100).toFixed(p < 0.001 || p > 0.999 ? 4 : 2)) + "%";
    el("pSub").textContent = t("res." + S.mode, { pct, x: show(trim(lo)), a: show(trim(lo)), b: show(trim(hi)) });
    const rows = twoSided() ? [[t("zOf", { v: "a" }), z(lo)], [t("zOf", { v: "b" }), z(hi)]] : [[t("zOf", { v: "x" }), z(lo)]];
    rows.push([t("variance"), show(trim(S.sd * S.sd, 4))], [t("medianMode"), show(trim(S.mu, 4))]);
    el("facts").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  function renderQuantile(){
    const p = parseNum(qp.value), ok = p != null && p > 0 && p < 1;
    qp.setAttribute("aria-invalid", ok ? "false" : "true");
    el("qx").textContent = ok ? show(trim(S.mu + S.sd * PhiInv(p), 4)) : t("pRange");
  }

  function renderChips(){
    const label = (m, s) => `μ = ${show(trim(m))}${t("listSep")}σ = ${show(trim(s))}`;
    el("chips").innerHTML = `<span class="chip"><span class="sw"></span>${label(S.mu, S.sd)}</span>` +
      S.pins.map((p, i) => `<span class="chip pinned"><span class="sw"></span>${label(p.mu, p.sd)}<button data-unpin="${i}" aria-label="${t("unpin")}">×</button></span>`).join("");
    el("unpinBtn").hidden = S.pins.length < 2;
  }

  /* ---- keep inputs in sync ---- */
  function setSlider(r, v){
    if (v < +r.min) r.min = v; if (v > +r.max) r.max = v;
    r.value = v; r.style.setProperty("--p", ((v - r.min) / (r.max - r.min) * 100) + "%");
  }
  function syncInputs(skip){
    if (skip !== muN) muN.value = fmtIn(S.mu);
    if (skip !== sdN) sdN.value = fmtIn(S.sd);
    if (skip !== aN) aN.value = fmtIn(S.a);
    if (skip !== bN) bN.value = fmtIn(S.b);
    setSlider(muR, S.mu); setSlider(sdR, S.sd);
    $$(".modes button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === S.mode));
    $$(".seg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.view === S.view));
    el("bLbl").hidden = !twoSided(); el("bounds").classList.toggle("single", !twoSided());
    el("aSym").textContent = twoSided() ? "a" : "x";
  }

  function update(skip){
    syncInputs(skip); renderFormulas(); renderResult(); renderQuantile(); renderChips(); plot.draw();
  }

  /* ---- view fitting ---- */
  function fit(){ plot.x0 = S.mu - 4 * S.sd; plot.x1 = S.mu + 4 * S.sd; plot.draw(); }
  function fitIfLost(){
    const r = plot.x1 - plot.x0;
    if (S.mu < plot.x0 || S.mu > plot.x1 || 8 * S.sd > 3 * r || 8 * S.sd < r / 10){
      fit();
      if (S.a < plot.x0 || S.a > plot.x1 || S.b < plot.x0 || S.b > plot.x1){ S.a = S.mu - S.sd; S.b = S.mu + S.sd; }
      update();
    }
  }

  /* ---- plot ---- */
  function drawPlot(p){
    const C = p.colors(), pdf = S.view === "pdf";
    const f = pdf ? x => normPdf(x, S.mu, S.sd) : x => Phi((x - S.mu) / S.sd);
    if (pdf){
      let peak = 1 / (S.sd * Num.SQRT2PI); for (const q of S.pins) peak = Math.max(peak, 1 / (q.sd * Num.SQRT2PI));
      p.y0 = 0; p.y1 = peak * 1.12;
    } else { p.y0 = 0; p.y1 = 1.05; }
    p.grid(C);

    // σ ticks along the baseline
    const c = p.ctx;
    for (let k = -3; k <= 3; k++){
      const x = S.mu + k * S.sd; if (x < p.x0 || x > p.x1) continue;
      const px = Math.round(p.X(x)) + .5, by = p.Y(p.y0);
      c.strokeStyle = k === 0 ? C.muted : C.faint; c.lineWidth = 1;
      c.beginPath(); c.moveTo(px, by); c.lineTo(px, by - (k === 0 ? 7 : 4)); c.stroke();
    }
    p.vline(S.mu, C.line, [3, 3], pdf ? normPdf(S.mu, S.mu, S.sd) : 1);

    for (const q of S.pins){
      p.curve(pdf ? x => normPdf(x, q.mu, q.sd) : x => Phi((x - q.mu) / q.sd), { color: C.pin, width: 1.5, dash: [5, 4] });
    }
    if (pdf) for (const [a, b] of regions()) p.area(f, a, b, C.fill);
    p.curve(f, { color: C.accent, width: 2.2 });

    // cumulative view: show probability as a bar on the y-axis
    if (!pdf){
      const [lo, hi] = bounds(), Fa = f(lo), Fb = f(hi);
      const spans = { left: [[0, Fa]], right: [[Fa, 1]], between: [[Fa, Fb]], outside: [[0, Fa], [Fb, 1]] }[S.mode];
      c.save(); c.setLineDash([3, 3]); c.strokeStyle = C.accent; c.lineWidth = 1;
      for (const x of twoSided() ? [lo, hi] : [lo]){
        if (x < p.x0 || x > p.x1) continue;
        c.beginPath(); c.moveTo(p.pad.l, p.Y(f(x))); c.lineTo(p.X(x), p.Y(f(x))); c.stroke();
      }
      c.restore();
      c.fillStyle = C.accent;
      for (const [u, v] of spans) c.fillRect(p.pad.l + 1, p.Y(v), 5, Math.max(1, p.Y(u) - p.Y(v)));
    }

    // handles
    const hs = handles(); let lastR = -Infinity;
    for (const h of hs){
      if (h.x < p.x0 || h.x > p.x1) continue;
      const px = p.X(h.x), py = p.Y(f(h.x));
      p.vline(h.x, C.accent, [], pdf ? f(h.x) : p.y1, 1.5);
      c.fillStyle = C.surface; c.strokeStyle = C.accent; c.lineWidth = 2;
      c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill(); c.stroke();
      const txt = `${h.label} = ${show(trim(h.x, 3))}`;
      c.font = `600 12px ${C.font}`; const w = c.measureText(txt).width + 14;
      const y = (px - w / 2 < lastR + 4) ? 30 : 6;
      const [, r] = p.pill(px, y, txt, C, true); lastR = y === 6 ? r : lastR;
    }

    // hover crosshair
    if (p.hover != null && !p.drag){
      const y = f(p.hover);
      p.vline(p.hover, C.faint, [2, 3]);
      c.fillStyle = C.ink; c.beginPath(); c.arc(p.X(p.hover), p.Y(y), 3, 0, Math.PI * 2); c.fill();
    }
  }
  function handles(){
    return twoSided() ? [{ key: "a", x: S.a, label: "a" }, { key: "b", x: S.b, label: "b" }] : [{ key: "a", x: S.a, label: "x" }];
  }
  const plot = new Plot(el("plot"), {
    draw: drawPlot,
    handles,
    onFit: fit,
    onHandle(key, x){
      const dec = Num.decimalsFor(Num.niceStep(plot.x1 - plot.x0, 200));
      x = +x.toFixed(dec);
      if (key === "a") S.a = twoSided() ? Math.min(x, S.b) : x; else S.b = Math.max(x, S.a);
      syncInputs(); renderFormulas(); renderResult();
    },
    onHover(x){
      const r = el("readout");
      el("hint").hidden = x != null;
      if (x == null){ r.hidden = true; return; }
      const d = Num.decimalsFor(Num.niceStep(plot.x1 - plot.x0, 200));
      r.hidden = false;
      r.innerHTML = `<span>x <b>${show(x.toFixed(d))}</b></span><span>f(x) <b>${show(normPdf(x, S.mu, S.sd).toFixed(4))}</b></span><span>F(x) <b>${show(Phi((x - S.mu) / S.sd).toFixed(4))}</b></span>`;
    }
  });

  /* ---- events ---- */
  const num = inp => parseNum(inp.value);
  // Arrow keys nudge a number field (Shift = ×10), like a native number input.
  $$(".num", root).forEach(inp => inp.addEventListener("keydown", e => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const v = num(inp); if (v == null) return;
    e.preventDefault();
    const step = +inp.dataset.step * (e.shiftKey ? 10 : 1), d = Math.max(0, Num.decimalsFor(step));
    inp.value = loc(trim(v + (e.key === "ArrowUp" ? step : -step), Math.max(d, 4)));
    inp.dispatchEvent(new Event("input")); inp.dispatchEvent(new Event("change"));
  }));
  muR.addEventListener("input", () => { S.mu = +muR.value; update(); });
  sdR.addEventListener("input", () => { S.sd = +sdR.value; update(); });
  muN.addEventListener("input", () => { const v = num(muN); muN.setAttribute("aria-invalid", v == null); if (v != null){ S.mu = v; update(muN); } });
  sdN.addEventListener("input", () => { const v = num(sdN); const ok = v != null && v > 0; sdN.setAttribute("aria-invalid", !ok); if (ok){ S.sd = v; update(sdN); } });
  muN.addEventListener("change", () => { muN.removeAttribute("aria-invalid"); update(); fitIfLost(); });
  sdN.addEventListener("change", () => { sdN.removeAttribute("aria-invalid"); update(); fitIfLost(); });
  aN.addEventListener("input", () => { const v = num(aN); if (v != null){ S.a = v; update(aN); } });
  bN.addEventListener("input", () => { const v = num(bN); if (v != null){ S.b = v; update(bN); } });
  aN.addEventListener("change", () => update());
  bN.addEventListener("change", () => update());
  qp.addEventListener("input", () => { S.qp = qp.value; renderQuantile(); });

  $$(".modes button", root).forEach(b => b.addEventListener("click", () => {
    const was = twoSided(); S.mode = b.dataset.mode;
    if (twoSided() && !was && S.b <= S.a) S.b = S.a + S.sd;
    update();
  }));
  $$(".seg button", root).forEach(b => b.addEventListener("click", () => { S.view = b.dataset.view; update(); }));
  $$(".quick .btn", root).forEach(b => b.addEventListener("click", () => {
    const k = +b.dataset.k; S.mode = "between"; S.a = +(S.mu - k * S.sd).toFixed(6); S.b = +(S.mu + k * S.sd).toFixed(6);
    update(); fitIfLost();
  }));
  el("fitBtn").addEventListener("click", fit);
  el("pinBtn").addEventListener("click", () => {
    if (!S.pins.some(p => p.mu === S.mu && p.sd === S.sd)) S.pins.push({ mu: S.mu, sd: S.sd });
    update();
  });
  el("unpinBtn").addEventListener("click", () => { S.pins = []; update(); });
  el("chips").addEventListener("click", e => { const i = e.target.dataset?.unpin; if (i != null){ S.pins.splice(+i, 1); update(); } });
  el("qUse").addEventListener("click", () => {
    const p = parseNum(qp.value); if (!(p > 0 && p < 1)) return;
    S.mode = "left"; S.a = +(S.mu + S.sd * PhiInv(p)).toFixed(6); update(); fitIfLost();
  });

  const onTheme = () => plot.draw();
  document.addEventListener("themechange", onTheme);

  qp.value = loc(S.qp.replace(",", "."));
  if (S.range){ [plot.x0, plot.x1] = S.range; } else fit();
  update();
  return () => { S.range = [plot.x0, plot.x1]; plot.destroy(); document.removeEventListener("themechange", onTheme); };
};
