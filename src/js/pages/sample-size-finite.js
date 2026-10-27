"use strict";
/* ============================================================
   Page: Sample size for a finite population

     n₀ = z² σ² / ε²           estimating a mean
     n₀ = z² p(1 − p) / ε²     estimating a proportion
     n₀ = z² / (4 ε²)          proportion with no prior estimate (p(1 − p) ≤ 1/4)
     n  = N n₀ / (N + n₀ − 1)  finite population correction

   Sample sizes are always rounded up.
   ============================================================ */
PAGES["sample-size-finite"] = function SampleSizeFinitePage(root){
  const S = SampleSizeFinitePage.state || (SampleSizeFinitePage.state = {
    target: "prop",          // "mean" | "prop"
    conf: 95,                // confidence level γ, in %
    zTable: true,            // round z to 3 decimals, like a printed table
    epsMean: 0.5, sigma: 4,  // mean: margin of error and standard deviation
    epsProp: 0.02, p: 0.5, worst: true,   // proportion: margin, estimate, use p(1−p) ≤ 1/4
    N: 3000,                 // population size
    view: "N",               // graph: "N" (by population size) | "eps" (by margin of error)
    range: {}                // remembered x-range per graph
  });

  /* ---------- maths ---------- */
  const zExact = () => Num.PhiInv(1 - (1 - S.conf / 100) / 2);
  const z = () => S.zTable ? +zExact().toFixed(3) : zExact();
  const isMean = () => S.target === "mean";
  const eps = () => isMean() ? S.epsMean : S.epsProp;
  const pq = () => S.worst ? 0.25 : S.p * (1 - S.p);
  const n0Of = e => isMean() ? z() ** 2 * S.sigma ** 2 / e ** 2 : z() ** 2 * pq() / e ** 2;
  const nOf = (N, n0) => N * n0 / (N + n0 - 1);
  const n0 = () => n0Of(eps());
  const n = () => nOf(S.N, n0());

  /* ---------- markup ---------- */
  const sym = s => `<span class="sym">${s}</span>`;
  root.innerHTML = `
  <div class="page">
    <header class="page-head">
      <div>
        <h1>${t("ss.title")}</h1>
        <p class="lede">${t("ss.lede", { eps: sym("ε"), gamma: sym("γ"), N: sym("N") })}</p>
      </div>
    </header>

    <section class="formulas" aria-label="${t("formulas")}">
      <div class="frow"><span class="flabel">${t("ss.infinite")}</span><div class="fmath" id="fN0"></div></div>
      <div class="frow"><span class="flabel">${t("ss.finite")}</span><div class="fmath" id="fN"></div></div>
    </section>

    <section class="work">
      <div class="plot-col">
        <div class="plot-bar">
          <div class="seg" role="group" aria-label="${t("graphType")}">
            <button data-view="N" aria-pressed="false">${t("ss.byN")}</button>
            <button data-view="eps" aria-pressed="false">${t("ss.byEps")}</button>
          </div>
          <div class="bar-actions">
            <button class="btn" id="fitBtn" title="${t("fitTitle")}">${t("fitView")}</button>
          </div>
        </div>
        <div class="plot-wrap">
          <canvas id="plot" role="img" aria-label="${t("ss.graph")}"></canvas>
        </div>
        <div class="legend">
          <div class="chips">
            <span class="chip"><span class="sw"></span>${t("ss.lgN")}</span>
            <span class="chip pinned"><span class="sw"></span>${t("ss.lgN0")}</span>
            <span class="chip census"><span class="sw"></span>${t("ss.lgCensus")}</span>
          </div>
          <span class="hint" id="hint">${t("ss.hint")}</span>
          <span class="readout" id="readout" hidden></span>
        </div>
      </div>

      <aside class="controls" aria-label="${t("controls")}">
        <div class="group">
          <h2>${t("ss.estimating")}</h2>
          <div class="seg full" role="group" id="targetSeg">
            <button data-target="mean" aria-pressed="false">${t("mean")}</button>
            <button data-target="prop" aria-pressed="false">${t("ss.proportion")}</button>
          </div>
        </div>

        <div class="group">
          <h2>${t("ss.confidence")}</h2>
          <div class="param">
            <label for="confN">${sym("γ")}${t("ss.level")} <span class="unit">(%)</span></label>
            ${numInput("confN", 1)}
          </div>
          <div class="presets" role="group" aria-label="${t("ss.level")}">
            ${[90, 95, 99].map(v => `<button class="btn" data-conf="${v}" aria-pressed="false">${v}%</button>`).join("")}
          </div>
          <div class="zline" id="zLine"></div>
          <label class="check"><input type="checkbox" id="zTable">${t("ss.zTable")}</label>
        </div>

        <div class="group">
          <h2>${t("parameters")}</h2>
          <div class="param">
            <label for="epsN">${sym("ε")}${t("ss.error")} <span class="unit" id="epsPct"></span></label>
            ${numInput("epsN", 0.01)}
            <input id="epsR" type="range" aria-label="${t("ss.error")}">
          </div>
          <div id="meanBox">
            <div class="param">
              <label for="sigN">${sym("σ")}${t("sd")}</label>
              ${numInput("sigN", 0.1)}
              <input id="sigR" type="range" min="0.1" max="20" step="0.1" aria-label="${t("sd")}">
            </div>
            <p class="note">${t("ss.sigmaNote")}</p>
          </div>
          <div id="propBox">
            <div class="param">
              <label for="pN">${sym("p")}${t("ss.pEst")}</label>
              ${numInput("pN", 0.01)}
              <input id="pR" type="range" min="0.01" max="0.99" step="0.01" aria-label="${t("ss.pEst")}">
            </div>
            <label class="check check-gap"><input type="checkbox" id="worst">${t("ss.worst")}</label>
          </div>
          <div class="param">
            <label for="NN">${sym("N")}${t("ss.popSize")}</label>
            ${numInput("NN", 100)}
            <input id="NR" type="range" min="1" max="7" step="0.01" aria-label="${t("ss.popSize")}">
          </div>
        </div>

        <div class="group result" aria-live="polite">
          <div class="p-big" id="nBig"></div>
          <div class="p-sub" id="nSub"></div>
          <dl class="facts" id="facts"></dl>
          <p class="note" id="note"></p>
        </div>
      </aside>
    </section>
  </div>`;

  const el = id => $("#" + id, root);
  const confN = el("confN"), epsN = el("epsN"), epsR = el("epsR"), sigN = el("sigN"), sigR = el("sigR");
  const pN = el("pN"), pR = el("pR"), NN = el("NN"), NR = el("NR");

  /* ---------- formulas ---------- */
  const zDisp = () => S.zTable ? trim(z(), 3) : trim(z(), 5);
  function renderFormulas(){
    const z2 = M.subsup(M.i("z"), M.row(M.i("α"), M.o("/"), M.n(2)), M.n(2));
    const sq = v => M.sup(M.n(v), M.n(2));
    const n0_ = M.sub(M.i("n"), M.n(0)), N_ = M.i("N"), dot = M.o("·");
    const e = trim(eps(), 6), zs = zDisp();
    let gen, sub;
    if (isMean()){
      gen = M.frac(M.row(z2, M.sup(M.i("σ"), M.n(2))), M.sup(M.i("ε"), M.n(2)));
      sub = M.frac(M.row(sq(zs), dot, sq(trim(S.sigma, 4))), sq(e));
    } else if (S.worst){
      gen = M.frac(z2, M.row(M.n(4), M.sup(M.i("ε"), M.n(2))));
      sub = M.frac(sq(zs), M.row(M.n(4), dot, sq(e)));
    } else {
      const p = trim(S.p, 4);
      gen = M.frac(M.row(z2, M.i("p"), M.paren(M.row(M.n(1), M.o(MINUS), M.i("p")))), M.sup(M.i("ε"), M.n(2)));
      sub = M.frac(M.row(sq(zs), dot, M.n(p), dot, M.paren(M.row(M.n(1), M.o(MINUS), M.n(p)))), sq(e));
    }
    let html = M.math(M.row(n0_, M.o("="), gen, M.o("="), sub, M.o("="), M.n(trim(n0(), 2))));
    if (!isMean() && S.worst){
      html += M.math(M.row(M.i("p"), M.paren(M.row(M.n(1), M.o(MINUS), M.i("p"))), M.o("≤"), M.frac(M.n(1), M.n(4))), "res");
    }
    el("fN0").innerHTML = html;

    const Ns = String(S.N), n0s = trim(n0(), 2);
    el("fN").innerHTML = M.math(M.row(
      M.i("n"), M.o("="), M.frac(M.row(N_, n0_), M.row(N_, M.o("+"), n0_, M.o(MINUS), M.n(1))),
      M.o("="), M.frac(M.row(M.n(Ns), dot, M.n(n0s)), M.row(M.n(Ns), M.o("+"), M.n(n0s), M.o(MINUS), M.n(1))),
      M.o("="), M.n(trim(n(), 2)), M.o("⇒"), M.i("n"), M.o("="), M.n(String(ceilN(n())))
    ));
  }

  /* ---------- result panel ---------- */
  function renderResult(){
    const nn = ceilN(n()), nn0 = ceilN(n0()), pct = v => show(trim(v, 2)) + "%";
    el("nBig").textContent = fmtInt(nn);
    el("nSub").textContent = t("ss.sub", { N: fmtInt(S.N), pct: pct(100 * nn / S.N) });
    const saved = nn0 - nn;
    el("facts").innerHTML = [
      [t("ss.n0"), fmtInt(nn0)],
      [t("ss.saved"), `${fmtInt(saved)} (${pct(nn0 ? 100 * saved / nn0 : 0)})`],
      [t("ss.z", { gamma: show(trim(S.conf, 2)) + "%" }), show(zDisp())],
      [t("ss.frac"), pct(100 * n0() / S.N)],
    ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    el("note").textContent = n0() / S.N < 0.05 ? t("ss.noteSmall") : t("ss.noteBig");
  }

  /* ---------- inputs ---------- */
  function epsSliderRange(){
    if (isMean()){ epsR.min = 0.01; epsR.max = Math.max(5, S.sigma * 2); epsR.step = 0.01; }
    else { epsR.min = 0.005; epsR.max = 0.2; epsR.step = 0.001; }
  }
  function syncInputs(skip){
    if (skip !== confN) confN.value = fmtIn(S.conf, 2);
    if (skip !== epsN) epsN.value = fmtIn(eps(), 6);
    if (skip !== sigN) sigN.value = fmtIn(S.sigma);
    if (skip !== pN) pN.value = fmtIn(S.worst ? 0.5 : S.p);
    if (skip !== NN) NN.value = fmtIn(S.N, 0);
    epsSliderRange(); setSlider(epsR, eps()); setSlider(sigR, S.sigma); setSlider(pR, S.worst ? 0.5 : S.p); setSlider(NR, Math.log10(S.N));
    pN.disabled = pR.disabled = S.worst;
    el("zTable").checked = S.zTable; el("worst").checked = S.worst;
    el("meanBox").hidden = !isMean(); el("propBox").hidden = isMean();
    el("epsPct").textContent = isMean() ? "" : `(${show(trim(eps() * 100, 3))}%)`;
    el("zLine").innerHTML = `${M.math(M.row(M.sub(M.i("z"), M.row(M.i("α"), M.o("/"), M.n(2))), M.o("="), M.n(zDisp())))}`;
    $$("#targetSeg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.target === S.target));
    $$(".presets .btn", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.conf === S.conf));
    $$(".plot-bar .seg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.view === S.view));
  }
  function update(skip){ syncInputs(skip); renderFormulas(); renderResult(); plot.draw(); }

  /* ---------- graph ---------- */
  // "N" view plots against log10(N), so every order of magnitude gets the same width.
  const compact = new Intl.NumberFormat(t("htmlLang"), { notation: "compact", maximumFractionDigits: 1 });
  const fmtN = v => v >= 10000 ? compact.format(v) : fmtInt(v);
  function logTicks(a, b){
    const mant = b - a <= 3.5 ? [1, 2, 5] : [1], out = [];
    for (let d = Math.floor(a); d <= Math.ceil(b); d++) for (const m of mant){
      const v = Math.log10(m) + d; if (v >= a - 1e-9 && v <= b + 1e-9) out.push(v);
    }
    return out;
  }
  function fit(){
    if (S.view === "N"){
      const lo = Math.min(Math.log10(S.N), Math.log10(Math.max(n0(), 1)));
      const hi = Math.max(Math.log10(S.N), Math.log10(Math.max(n0(), 1)));
      plot.x0 = Math.max(0, lo - 1.2); plot.x1 = hi + 1.5;
    } else {
      plot.x0 = eps() * 0.3; plot.x1 = isMean() ? eps() * 2.5 : Math.min(eps() * 2.5, 0.5);
    }
    plot.draw();
  }
  function fitIfLost(){
    const x = S.view === "N" ? Math.log10(S.N) : eps();
    if (x < plot.x0 || x > plot.x1) fit();
  }
  function switchView(v){
    S.range[S.view] = [plot.x0, plot.x1];
    S.view = v;
    if (S.range[v]) [plot.x0, plot.x1] = S.range[v]; else fit();
    update();
  }

  function drawPlot(p){
    const C = p.colors(), c = p.ctx, N0 = n0(), nn = n();
    const byN = S.view === "N";
    if (!byN && p.x0 <= 0) p.x0 = Math.min(eps() * 0.05, p.x1 / 10);
    const fN = byN ? x => nOf(10 ** x, N0) : x => nOf(S.N, n0Of(x));
    const f0 = byN ? () => N0 : x => n0Of(x);
    p.y0 = 0;
    p.y1 = byN ? N0 * 1.15 : Math.max(fN(p.x0), nn * 1.2) * 1.08;
    p.grid(C, byN
      ? { xTicks: logTicks(p.x0, p.x1), xFmt: v => fmtN(Math.round(10 ** v)), yFmt: v => fmtInt(v) }
      : { yFmt: v => fmtInt(v) });

    // census line: n can never exceed N
    p.curve(byN ? x => 10 ** x : () => S.N, { color: C.faint, width: 1.2, dash: [2, 3] });
    p.curve(f0, { color: C.pin, width: 1.5, dash: [5, 4] });
    p.curve(fN, { color: C.accent, width: 2.2 });

    // label the n₀ asymptote in the "N" view
    if (byN){
      c.font = `12px ${C.font}`; c.fillStyle = C.muted; c.textAlign = "left"; c.textBaseline = "bottom";
      c.fillText(`n₀ = ${fmtInt(ceilN(N0))}`, p.pad.l + 8, p.Y(N0) - 4);
    }

    // marker
    const hx = byN ? Math.log10(S.N) : eps();
    if (hx >= p.x0 && hx <= p.x1){
      const px = p.X(hx), py = p.Y(nn);
      p.vline(hx, C.accent, [], nn, 1.5);
      c.save(); c.setLineDash([3, 3]); c.strokeStyle = C.accent; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p.pad.l, py); c.lineTo(px, py); c.stroke(); c.restore();
      c.fillStyle = C.surface; c.strokeStyle = C.accent; c.lineWidth = 2;
      c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill(); c.stroke();
      p.pill(px, 6, byN ? `N = ${fmtInt(S.N)}` : `ε = ${show(trim(eps(), 4))}`, C, true);
      p.pill(px, 30, `n = ${fmtInt(ceilN(nn))}`, C, false);
    }

    if (p.hover != null && !p.drag){
      p.vline(p.hover, C.faint, [2, 3]);
      c.fillStyle = C.ink; c.beginPath(); c.arc(p.X(p.hover), p.Y(fN(p.hover)), 3, 0, Math.PI * 2); c.fill();
    }
  }

  const plot = new Plot(el("plot"), {
    draw: drawPlot,
    handles: () => [{ key: S.view, x: S.view === "N" ? Math.log10(S.N) : eps() }],
    onFit: fit,
    onHandle(key, x){
      if (key === "N") S.N = clamp(Math.round(10 ** x), 1, 1e9);
      else {
        const step = Num.niceStep(plot.x1 - plot.x0, 200);
        const v = clamp(+x.toFixed(Num.decimalsFor(step)), step, isMean() ? Infinity : 0.99);
        isMean() ? (S.epsMean = v) : (S.epsProp = v);
      }
      syncInputs(); renderFormulas(); renderResult();
    },
    onHover(x){
      const r = el("readout"); el("hint").hidden = x != null;
      if (x == null){ r.hidden = true; return; }
      const byN = S.view === "N";
      const N = byN ? Math.round(10 ** x) : S.N, e = byN ? eps() : x, N0 = n0Of(e);
      const head = byN ? `N <b>${fmtInt(N)}</b>` : `ε <b>${show(trim(e, 4))}</b>`;
      r.hidden = false;
      r.innerHTML = `<span>${head}</span><span>n <b>${fmtInt(ceilN(nOf(N, N0)))}</b></span><span>n₀ <b>${fmtInt(ceilN(N0))}</b></span>`;
    }
  });

  /* ---------- events ---------- */
  bindNudge(root);
  const field = (inp, ok, set, onChange) => {
    inp.addEventListener("input", () => {
      const v = parseNum(inp.value), good = v != null && ok(v);
      inp.setAttribute("aria-invalid", !good);
      if (good){ set(v); update(inp); }
    });
    inp.addEventListener("change", () => { inp.removeAttribute("aria-invalid"); update(); onChange?.(); });
  };
  field(confN, v => v >= 50 && v < 100, v => S.conf = v);
  field(epsN, v => v > 0 && (isMean() || v < 1), v => isMean() ? (S.epsMean = v) : (S.epsProp = v), fit);
  field(sigN, v => v > 0, v => S.sigma = v);
  field(pN, v => v > 0 && v < 1, v => S.p = v);
  field(NN, v => v >= 1, v => S.N = Math.round(v), fit);       // typed values refit the graph

  epsR.addEventListener("input", () => { isMean() ? (S.epsMean = +epsR.value) : (S.epsProp = +epsR.value); update(); fitIfLost(); });
  sigR.addEventListener("input", () => { S.sigma = +sigR.value; update(); });
  pR.addEventListener("input", () => { S.p = +pR.value; update(); });
  NR.addEventListener("input", () => { S.N = Math.max(1, Math.round(10 ** +NR.value)); update(); fitIfLost(); });
  el("zTable").addEventListener("change", e => { S.zTable = e.target.checked; update(); });
  el("worst").addEventListener("change", e => { S.worst = e.target.checked; update(); });
  $$("#targetSeg button", root).forEach(b => b.addEventListener("click", () => {
    S.target = b.dataset.target; S.range.eps = null; update();
    if (S.view === "eps") fit(); else fitIfLost();
  }));
  $$(".presets .btn", root).forEach(b => b.addEventListener("click", () => { S.conf = +b.dataset.conf; update(); }));
  $$(".plot-bar .seg button", root).forEach(b => b.addEventListener("click", () => switchView(b.dataset.view)));
  el("fitBtn").addEventListener("click", fit);

  const onTheme = () => plot.draw();
  document.addEventListener("themechange", onTheme);

  if (S.range[S.view]) [plot.x0, plot.x1] = S.range[S.view]; else fit();
  update();
  return () => { S.range[S.view] = [plot.x0, plot.x1]; plot.destroy(); document.removeEventListener("themechange", onTheme); };
};
