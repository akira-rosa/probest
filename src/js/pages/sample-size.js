"use strict";
/* ============================================================
   Page: Sample size — the reference for the page format.

     n₀ = z²σ²/ε²             mean (σ known; with a pilot sample use s and t)
     n₀ = z²p(1 − p)/ε²       proportion
     n₀ = z²/(4ε²)            proportion with no prior estimate, since p(1 − p) ≤ 1/4
     n  = n₀                  infinite (or very large) population
     n  = N·n₀/(N + n₀ − 1)   population of known size N
   Always rounded up.
   Sources: Barbetta 7.4 (Quadro 7.1) · Bussab & Morettin 10.11

   Page format (copy it for new pages):
     header → formula panel → graph + controls + result → sections
     (examples, symbols, R code, good to know, sources)
   ============================================================ */
PAGES["sample-size"] = function SampleSizePage(root){
  const S = SampleSizePage.state || (SampleSizePage.state = {
    target: "prop",              // "mean" | "prop"
    conf: 95, zTable: true,      // confidence level γ (%), round z or t to 3 decimals like a printed table
    epsMean: 0.5, sigma: 4,      // mean: margin of error, σ (or s)
    sigmaSrc: "known", pilotN: 10,   // "known" σ, or "pilot" sample of size pilotN (uses t)
    epsProp: 0.02, p: 0.5, worst: true,  // proportion: margin, estimate, use p(1−p) ≤ 1/4
    finite: true, N: 3000,       // population size known?
    view: "N", range: {},        // graph view and remembered x-range per view
    example: "cct"               // loaded example, cleared on any edit
  });

  /* ---------- maths (pure: works on any state, so examples can be previewed) ---------- */
  function compute(st){
    const mean = st.target === "mean", usesT = mean && st.sigmaSrc === "pilot";
    const df = usesT ? Math.max(1, Math.round(st.pilotN) - 1) : null;
    const pr = 1 - (1 - st.conf / 100) / 2;
    const exact = usesT ? Num.tInv(pr, df) : Num.PhiInv(pr);
    const crit = st.zTable ? +exact.toFixed(3) : exact;
    const eps = mean ? st.epsMean : st.epsProp;
    const pq = st.worst ? 0.25 : st.p * (1 - st.p);
    const n0Of = e => mean ? crit ** 2 * st.sigma ** 2 / e ** 2 : crit ** 2 * pq / e ** 2;
    const nOf = (N, m) => N * m / (N + m - 1);
    const n0 = n0Of(eps), n = st.finite ? nOf(st.N, n0) : n0;
    return { mean, usesT, df, crit, eps, pq, n0, n, n0Of, nOf, size: ceilN(n) };
  }

  /* ---------- worked examples ---------- */
  const EXAMPLES = [
    { id: "cct",      set: { target: "prop", conf: 95, epsProp: 0.02, worst: true, finite: true, N: 3000 },              source: t("ss.srcSlides") },
    { id: "mayor45",  set: { target: "prop", conf: 95, epsProp: 0.02, worst: false, p: 0.45, finite: false },            source: t("ss.srcSlides") },
    { id: "mayor",    set: { target: "prop", conf: 95, epsProp: 0.03, worst: true, finite: false },                       source: t("ss.srcSlides") },
    { id: "brand",    set: { target: "prop", conf: 95, epsProp: 0.03, worst: false, p: 0.6, finite: false },             source: "Bussab & Morettin · Ex. 10.14" },
    { id: "pilot",    set: { target: "mean", conf: 95, epsMean: 0.5, sigma: 4, sigmaSrc: "known", finite: false },        source: "Bussab & Morettin · Ex. 10.13" },
    { id: "tv",       set: { target: "mean", conf: 95, epsMean: 0.25, sigma: 1.87, sigmaSrc: "known", finite: false },    source: t("ss.srcSlides") },
    { id: "hardness", set: { target: "mean", conf: 99, epsMean: 0.3, sigma: 0.7352, sigmaSrc: "pilot", pilotN: 10, finite: false }, source: "Barbetta · Ex. 7.5" },
  ];
  const exState = e => ({ ...S, zTable: true, ...e.set });
  const exList = () => EXAMPLES.map(e => ({ id: e.id, title: t("ss.ex." + e.id), source: e.source, answer: `n = ${fmtInt(compute(exState(e)).size)}` }));
  function loadExample(id){
    const e = EXAMPLES.find(x => x.id === id); if (!e) return;
    Object.assign(S, { zTable: true }, e.set, { example: id });
    S.view = S.finite ? "N" : "eps"; S.range = {};
    update(); fit();
  }

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
      <div class="frow"><span class="flabel">${t("ss.initial")}</span><div class="fmath" id="fN0"></div></div>
      <div class="frow"><span class="flabel" id="fNLabel"></span><div class="fmath" id="fN"></div></div>
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
        <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${t("ss.graph")}"></canvas></div>
        <div class="legend">
          <div class="chips" id="chips"></div>
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
          <div class="zline" id="critLine"></div>
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
            <div class="seg full seg-gap" role="group" id="srcSeg" aria-label="${t("sd")}">
              <button data-src="known" aria-pressed="false">${t("ss.sigmaKnown")}</button>
              <button data-src="pilot" aria-pressed="false">${t("ss.pilot")}</button>
            </div>
            <div class="param">
              <label for="sigN"><span class="sym" id="sigSym">σ</span><span id="sigLbl"></span></label>
              ${numInput("sigN", 0.1)}
              <input id="sigR" type="range" min="0.1" max="20" step="0.01" aria-label="${t("sd")}">
            </div>
            <div class="param" id="pilotRow">
              <label for="pilotN">${sym("n")}${t("ss.pilotSize")}</label>
              ${numInput("pilotN", 1)}
            </div>
          </div>
          <div id="propBox">
            <div class="param">
              <label for="pN">${sym("p")}${t("ss.pEst")}</label>
              ${numInput("pN", 0.01)}
              <input id="pR" type="range" min="0.01" max="0.99" step="0.01" aria-label="${t("ss.pEst")}">
            </div>
            <label class="check"><input type="checkbox" id="worst">${t("ss.worst")}</label>
          </div>
        </div>

        <div class="group">
          <h2>${t("ss.population")}</h2>
          <label class="check check-gap"><input type="checkbox" id="finite">${t("ss.finiteCheck")}</label>
          <div class="param" id="NRow">
            <label for="NN">${sym("N")}${t("ss.popSize")}</label>
            ${numInput("NN", 100)}
            <input id="NR" type="range" min="1" max="7" step="0.01" aria-label="${t("ss.popSize")}">
          </div>
        </div>

        <div class="group result" aria-live="polite">
          <div class="p-big" id="nBig"></div>
          <div class="p-sub" id="nSub"></div>
          <dl class="facts" id="facts"></dl>
        </div>
      </aside>
    </section>

    ${sectionsHtml({
      notes: [t("ss.note.round"), t("ss.note.sigma"), t("ss.note.p"), t("ss.note.two"), t("ss.note.N")],
      sources: [t("ss.src.barbetta"), t("ss.src.bussab"), t("ss.src.slides")],
    })}
  </div>`;

  const el = id => $("#" + id, root);
  const confN = el("confN"), epsN = el("epsN"), epsR = el("epsR"), sigN = el("sigN"), sigR = el("sigR"), pilotN = el("pilotN");
  const pN = el("pN"), pR = el("pR"), NN = el("NN"), NR = el("NR");
  const nf = v => trim(v, 2);   // n₀ and n shown with 2 decimals before rounding

  /* ---------- formulas ---------- */
  const critSym = R => M.sub(M.i(R.usesT ? "t" : "z"), M.i("γ"));
  function renderFormulas(R){
    const c2 = M.subsup(M.i(R.usesT ? "t" : "z"), M.i("γ"), M.n(2)), sq = v => M.sup(M.n(v), M.n(2)), dot = M.o("·");
    const n0_ = M.sub(M.i("n"), M.n(0)), N_ = M.i("N"), e = trim(R.eps, 6), cs = trim(R.crit, R.usesT || S.zTable ? 3 : 5);
    const sd = R.usesT ? "s" : "σ";
    let gen, sub;
    if (R.mean){
      gen = M.frac(M.row(c2, M.sup(M.i(sd), M.n(2))), M.sup(M.i("ε"), M.n(2)));
      sub = M.frac(M.row(sq(cs), dot, sq(trim(S.sigma, 4))), sq(e));
    } else if (S.worst){
      gen = M.frac(c2, M.row(M.n(4), M.sup(M.i("ε"), M.n(2))));
      sub = M.frac(sq(cs), M.row(M.n(4), dot, sq(e)));
    } else {
      const p = trim(S.p, 4);
      gen = M.frac(M.row(c2, M.i("p"), M.paren(M.row(M.n(1), M.o(MINUS), M.i("p")))), M.sup(M.i("ε"), M.n(2)));
      sub = M.frac(M.row(sq(cs), dot, M.n(p), dot, M.paren(M.row(M.n(1), M.o(MINUS), M.n(p)))), sq(e));
    }
    let html = M.math(M.row(n0_, M.o("="), gen, M.o("="), sub, M.o("="), M.n(nf(R.n0))));
    if (!R.mean && S.worst) html += M.math(M.row(M.i("p"), M.paren(M.row(M.n(1), M.o(MINUS), M.i("p"))), M.o("≤"), M.frac(M.n(1), M.n(4))), "res");
    if (R.usesT) html += M.math(M.row(critSym(R), M.t(t("ss.withDf")), M.text(t("dfAbbr")), M.o("="), M.i("n"), M.o(MINUS), M.n(1), M.o("="), M.n(String(R.df))), "res");
    el("fN0").innerHTML = html;

    el("fNLabel").textContent = S.finite ? t("ss.finite") : t("ss.infinite");
    const then = [M.o("⇒"), M.i("n"), M.o("="), M.n(String(R.size))];
    if (S.finite){
      const Ns = String(S.N), n0s = nf(R.n0);
      el("fN").innerHTML = M.math(M.row(
        M.i("n"), M.o("="), M.frac(M.row(N_, n0_), M.row(N_, M.o("+"), n0_, M.o(MINUS), M.n(1))),
        M.o("="), M.frac(M.row(M.n(Ns), dot, M.n(n0s)), M.row(M.n(Ns), M.o("+"), M.n(n0s), M.o(MINUS), M.n(1))),
        M.o("="), M.n(nf(R.n)), ...then));
    } else {
      el("fN").innerHTML = M.math(M.row(M.i("n"), M.o("="), n0_, M.o("="), M.n(nf(R.n0)), ...then));
    }
  }

  /* ---------- result ---------- */
  function renderResult(R){
    const pct = v => show(trim(v, 2)) + "%";
    el("nBig").textContent = fmtInt(R.size);
    el("nSub").textContent = S.finite ? t("ss.subFinite", { N: fmtInt(S.N), pct: pct(100 * R.size / S.N) }) : t("ss.subInfinite");
    const rows = [[t("ss.crit", { c: R.usesT ? "t" : "z", gamma: show(trim(S.conf, 2)) + "%" }), show(trim(R.crit, R.usesT || S.zTable ? 3 : 5))]];
    if (R.usesT) rows.push([t("ss.dfRow"), String(R.df)]);
    rows.push([t("ss.beforeRound"), show(nf(R.n))]);
    if (S.finite){
      const n0c = ceilN(R.n0), saved = n0c - R.size;
      rows.push([t("ss.n0"), fmtInt(n0c)], [t("ss.saved"), `${fmtInt(saved)} (${pct(n0c ? 100 * saved / n0c : 0)})`]);
    }
    el("facts").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  /* ---------- sections: symbols and R ---------- */
  function renderSymbols(R){
    const rows = [
      [M.sub(M.i("n"), M.n(0)), t("ss.sym.n0")],
      [M.i("n"), t("ss.sym.n")],
    ];
    if (S.finite) rows.push([M.i("N"), t("ss.sym.N")]);
    rows.push([M.i("γ"), t("ss.sym.gamma")]);
    rows.push(R.usesT ? [critSym(R), t("ss.sym.t")] : [critSym(R), t("ss.sym.z")]);
    rows.push([M.i("ε"), t("ss.sym.eps")]);
    if (R.mean) rows.push(R.usesT ? [M.i("s"), t("ss.sym.s")] : [M.i("σ"), t("ss.sym.sigma")]);
    else rows.push([M.i("p"), t("ss.sym.p")]);
    el("symbols").innerHTML = symbolsHtml(rows);
  }
  function renderR(R){
    const L = [], conf = trim(S.conf / 100, 4), q = `1 - (1 - conf) / 2`;
    const kind = R.mean ? (R.usesT ? t("ss.r.meanPilot") : t("ss.r.mean")) : (S.worst ? t("ss.r.propWorst") : t("ss.r.prop"));
    L.push(`# ${t("ss.title")}: ${kind}, ${S.finite ? t("ss.r.finite") : t("ss.r.infinite")}`);
    L.push(rLine(`conf <- ${conf}`, t("ss.r.conf")));
    const c = R.usesT ? "t" : "z", exactCall = R.usesT ? `qt(${q}, df = ${R.df})` : `qnorm(${q})`;
    L.push(S.zTable ? rLine(`${c} <- ${trim(R.crit, 3)}`, `${t("ss.r.table")}: ${exactCall}`) : `${c} <- ${exactCall}`);
    L.push(rLine(`e <- ${trim(R.eps, 6)}`, t("ss.r.eps")));
    if (R.mean){
      const v = R.usesT ? "s" : "sigma";
      L.push(rLine(`${v} <- ${trim(S.sigma, 6)}`, R.usesT ? t("ss.r.s") : t("ss.r.sigma")));
      L.push(rLine(`n0 <- ${c}^2 * ${v}^2 / e^2`, t("ss.r.n0")));
    } else if (S.worst){
      L.push(rLine(`n0 <- ${c}^2 / (4 * e^2)`, t("ss.r.n0")));
    } else {
      L.push(rLine(`p <- ${trim(S.p, 6)}`, t("ss.r.p")));
      L.push(rLine(`n0 <- ${c}^2 * p * (1 - p) / e^2`, t("ss.r.n0")));
    }
    if (S.finite){
      L.push(rLine(`N <- ${S.N}`, t("ss.r.N")));
      L.push(`n <- N * n0 / (N + n0 - 1)`);
      L.push(rLine(`ceiling(n)`, `${t("ss.r.up")}: ${R.size}`));
    } else {
      L.push(rLine(`ceiling(n0)`, `${t("ss.r.up")}: ${R.size}`));
    }
    el("rcode").innerHTML = codeHtml(L.join("\n"));
  }

  /* ---------- inputs ---------- */
  function syncInputs(skip, R){
    if (skip !== confN) confN.value = fmtIn(S.conf, 2);
    if (skip !== epsN) epsN.value = fmtIn(R.eps, 6);
    if (skip !== sigN) sigN.value = fmtIn(S.sigma);
    if (skip !== pilotN) pilotN.value = fmtIn(S.pilotN, 0);
    if (skip !== pN) pN.value = fmtIn(S.worst ? 0.5 : S.p);
    if (skip !== NN) NN.value = fmtIn(S.N, 0);
    if (R.mean){ epsR.min = 0.01; epsR.max = Math.max(5, S.sigma * 2); epsR.step = 0.01; }
    else { epsR.min = 0.005; epsR.max = 0.2; epsR.step = 0.001; }
    setSlider(epsR, R.eps); setSlider(sigR, S.sigma); setSlider(pR, S.worst ? 0.5 : S.p); setSlider(NR, Math.log10(S.N));
    pN.disabled = pR.disabled = S.worst;
    el("NRow").hidden = !S.finite;
    el("zTable").checked = S.zTable; el("worst").checked = S.worst; el("finite").checked = S.finite;
    el("meanBox").hidden = !R.mean; el("propBox").hidden = R.mean; el("pilotRow").hidden = !R.usesT;
    el("sigSym").textContent = R.usesT ? "s" : "σ";
    el("sigLbl").textContent = R.usesT ? t("ss.sPilot") : t("sd");
    el("epsPct").textContent = R.mean ? "" : `(${show(trim(R.eps * 100, 3))}%)`;
    el("critLine").innerHTML = M.math(M.row(critSym(R), M.o("="), M.n(trim(R.crit, R.usesT || S.zTable ? 3 : 5)),
      ...(R.usesT ? [M.t(`(${t("dfAbbr")} = ${R.df})`)] : [])));
    $$("#targetSeg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.target === S.target));
    $$("#srcSeg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.src === S.sigmaSrc));
    $$(".presets .btn", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.conf === S.conf));
    $$(".plot-bar .seg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.view === S.view));
  }
  function renderChips(){
    const chip = (cls, txt) => `<span class="chip ${cls}"><span class="sw"></span>${txt}</span>`;
    el("chips").innerHTML = !S.finite && S.view === "eps"
      ? chip("", t("ss.lgN0solid"))
      : chip("", S.finite ? t("ss.lgN") : t("ss.lgNif")) + chip("pinned", t("ss.lgN0")) + chip("census", t("ss.lgCensus"));
  }
  function update(skip){
    const R = compute(S);
    syncInputs(skip, R); renderFormulas(R); renderResult(R); renderChips();
    renderSymbols(R); renderR(R); markExample(el("examples"), S.example);
    plot.draw();
  }

  /* ---------- graph ---------- */
  // "N" view plots against log10(N), so each order of magnitude gets the same width.
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
    const R = compute(S);
    if (S.view === "N"){
      const a = Math.log10(Math.max(R.n0, 1)), b = S.finite ? Math.log10(S.N) : a;
      plot.x0 = Math.max(0, Math.min(a, b) - 1.2); plot.x1 = Math.max(a, b) + 1.5;
    } else {
      plot.x0 = R.eps * 0.3; plot.x1 = R.mean ? R.eps * 2.5 : Math.min(R.eps * 2.5, 0.5);
    }
    plot.draw();
  }
  function fitIfLost(){
    const R = compute(S), x = S.view === "N" ? Math.log10(S.N) : R.eps;
    if (x < plot.x0 || x > plot.x1) fit();
  }
  function switchView(v){
    S.range[S.view] = [plot.x0, plot.x1]; S.view = v;
    if (S.range[v]) [plot.x0, plot.x1] = S.range[v]; else fit();
    update();
  }

  function drawPlot(p){
    const C = p.colors(), c = p.ctx, R = compute(S), byN = S.view === "N";
    if (!byN && p.x0 <= 0) p.x0 = Math.min(R.eps * 0.05, p.x1 / 10);
    const fFin = byN ? x => R.nOf(10 ** x, R.n0) : x => R.nOf(S.N, R.n0Of(x));
    const f0 = byN ? () => R.n0 : x => R.n0Of(x);
    const main = byN || S.finite ? fFin : f0;      // the curve the marker sits on
    p.y0 = 0;
    p.y1 = byN ? R.n0 * 1.15 : Math.max(main(p.x0), R.n * 1.2) * 1.08;
    p.grid(C, byN
      ? { xTicks: logTicks(p.x0, p.x1), xFmt: v => fmtN(Math.round(10 ** v)), yFmt: v => fmtInt(v) }
      : { yFmt: v => fmtInt(v) });

    if (byN || S.finite){
      p.curve(byN ? x => 10 ** x : () => S.N, { color: C.faint, width: 1.2, dash: [2, 3] });   // n can never exceed N
      p.curve(f0, { color: C.pin, width: 1.5, dash: [5, 4] });
    }
    p.curve(main, { color: C.accent, width: 2.2 });
    if (byN){
      c.font = `12px ${C.font}`; c.fillStyle = C.muted; c.textAlign = "left"; c.textBaseline = "bottom";
      c.fillText(`n₀ = ${fmtInt(ceilN(R.n0))}`, p.pad.l + 8, p.Y(R.n0) - 4);
    }

    const hx = byN ? Math.log10(S.N) : R.eps;
    if ((!byN || S.finite) && hx >= p.x0 && hx <= p.x1){
      const px = p.X(hx), py = p.Y(R.n);
      p.vline(hx, C.accent, [], R.n, 1.5);
      c.save(); c.setLineDash([3, 3]); c.strokeStyle = C.accent; c.lineWidth = 1;
      c.beginPath(); c.moveTo(p.pad.l, py); c.lineTo(px, py); c.stroke(); c.restore();
      c.fillStyle = C.surface; c.strokeStyle = C.accent; c.lineWidth = 2;
      c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill(); c.stroke();
      p.pill(px, 6, byN ? `N = ${fmtInt(S.N)}` : `ε = ${show(trim(R.eps, 4))}`, C, true);
      p.pill(px, 30, `n = ${fmtInt(R.size)}`, C, false);
    }
    if (p.hover != null && !p.drag){
      p.vline(p.hover, C.faint, [2, 3]);
      c.fillStyle = C.ink; c.beginPath(); c.arc(p.X(p.hover), p.Y(main(p.hover)), 3, 0, Math.PI * 2); c.fill();
    }
  }

  const plot = new Plot(el("plot"), {
    draw: drawPlot,
    handles: () => S.view === "N" ? (S.finite ? [{ key: "N", x: Math.log10(S.N) }] : []) : [{ key: "eps", x: compute(S).eps }],
    onFit: fit,
    onHandle(key, x){
      S.example = null;
      if (key === "N") S.N = clamp(Math.round(10 ** x), 1, 1e9);
      else {
        const step = Num.niceStep(plot.x1 - plot.x0, 200);
        const v = clamp(+x.toFixed(Num.decimalsFor(step)), step, S.target === "mean" ? Infinity : 0.99);
        S.target === "mean" ? (S.epsMean = v) : (S.epsProp = v);
      }
      update();
    },
    onHover(x){
      const r = el("readout"); el("hint").hidden = x != null;
      if (x == null){ r.hidden = true; return; }
      const R = compute(S), byN = S.view === "N";
      const N = byN ? Math.round(10 ** x) : S.N, e = byN ? R.eps : x, n0 = R.n0Of(e);
      const n = byN || S.finite ? R.nOf(N, n0) : n0;
      r.hidden = false;
      r.innerHTML = `<span>${byN ? `N <b>${fmtInt(N)}</b>` : `ε <b>${show(trim(e, 4))}</b>`}</span>` +
        `<span>n <b>${fmtInt(ceilN(n))}</b></span><span>n₀ <b>${fmtInt(ceilN(n0))}</b></span>`;
    }
  });

  /* ---------- events ---------- */
  bindNudge(root);
  bindCopy($(".sections", root));
  const edit = fn => { S.example = null; fn(); };
  const field = (inp, ok, set, onChange) => {
    inp.addEventListener("input", () => {
      const v = parseNum(inp.value), good = v != null && ok(v);
      inp.setAttribute("aria-invalid", !good);
      if (good) edit(() => { set(v); update(inp); });
    });
    inp.addEventListener("change", () => { inp.removeAttribute("aria-invalid"); update(); onChange?.(); });
  };
  const isMean = () => S.target === "mean";
  field(confN, v => v >= 50 && v < 100, v => S.conf = v);
  field(epsN, v => v > 0 && (isMean() || v < 1), v => isMean() ? (S.epsMean = v) : (S.epsProp = v), fit);
  field(sigN, v => v > 0, v => S.sigma = v);
  field(pilotN, v => v >= 2, v => S.pilotN = Math.round(v));
  field(pN, v => v > 0 && v < 1, v => S.p = v);
  field(NN, v => v >= 1, v => S.N = Math.round(v), fit);

  epsR.addEventListener("input", () => edit(() => { isMean() ? (S.epsMean = +epsR.value) : (S.epsProp = +epsR.value); update(); fitIfLost(); }));
  sigR.addEventListener("input", () => edit(() => { S.sigma = +sigR.value; update(); }));
  pR.addEventListener("input", () => edit(() => { S.p = +pR.value; update(); }));
  NR.addEventListener("input", () => edit(() => { S.N = Math.max(1, Math.round(10 ** +NR.value)); update(); fitIfLost(); }));
  el("zTable").addEventListener("change", e => edit(() => { S.zTable = e.target.checked; update(); }));
  el("worst").addEventListener("change", e => edit(() => { S.worst = e.target.checked; update(); }));
  el("finite").addEventListener("change", e => edit(() => { S.finite = e.target.checked; update(); fit(); }));
  $$("#targetSeg button", root).forEach(b => b.addEventListener("click", () => edit(() => {
    S.target = b.dataset.target; S.range.eps = null; update(); fit();
  })));
  $$("#srcSeg button", root).forEach(b => b.addEventListener("click", () => edit(() => { S.sigmaSrc = b.dataset.src; update(); })));
  $$(".presets .btn", root).forEach(b => b.addEventListener("click", () => edit(() => { S.conf = +b.dataset.conf; update(); })));
  $$(".plot-bar .seg button", root).forEach(b => b.addEventListener("click", () => switchView(b.dataset.view)));
  el("fitBtn").addEventListener("click", fit);

  el("examples").innerHTML = examplesHtml(exList(), S.example);
  el("examples").addEventListener("click", e => { const b = e.target.closest("[data-ex]"); if (b) loadExample(b.dataset.ex); });

  const onTheme = () => plot.draw();
  document.addEventListener("themechange", onTheme);

  if (S.range[S.view]) [plot.x0, plot.x1] = S.range[S.view]; else fit();
  update();
  return () => { S.range[S.view] = [plot.x0, plot.x1]; plot.destroy(); document.removeEventListener("themechange", onTheme); };
};
