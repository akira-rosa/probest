"use strict";
/* ============================================================
   Shared page for probability distributions, discrete or continuous.

   Each distribution is a config object turned into a page with
     PAGES["binomial"] = distPage(BINOMIAL);
   The page follows the standard format: graph + controls + result,
   formulas with the table of variables, about, examples, R, sources.

   Config (see pages/binomial.js and pages/normal.js):
     id, key (locale prefix), kind: "discrete" | "continuous"
     params: [{ key, sym, def, min, max, step, int, ok(v, P) }]
     check(P)          → locale key of an error, or null
     support(P)        → [lo, hi]   (hi may be Infinity)
     view(P)           → [lo, hi]   default x-range of the graph
     pf(x, P)          → P(X = x) or the density f(x)
     cdf(x, P)         → F(x) = P(X ≤ x)   (optional for discrete: summed)
     inv(p, P)         → x with F(x) = p   (continuous only)
     mean(P), variance(P)
     math.general()    → right side of p(x) / f(x) with symbols
     math.at(x, P)     → the same with the numbers (discrete: at x)
     math.cdfSteps(v, P, O) → [MathML…] steps from F(v) to its value (continuous)
     math.mean / math.variance: { general(), sub(P) }
     r: { d, p, q, args(P) }  R function names and their parameters
     options: [{ key, def }]  checkboxes (labels "<key>.opt.<key>")
     prob(mode, a, b, P, O)   optional override of the probability
     examples: [{ id, set, source }], notes: [keys], sources: [keys]
   ============================================================ */
function distPage(cfg){
  const K = k => t(`${cfg.key}.${k}`);
  const discrete = cfg.kind === "discrete";
  const MODES = discrete ? ["eq", "le", "ge", "between"] : ["le", "ge", "between", "outside"];

  return function DistributionPage(root){
    /* ---------- state ---------- */
    const defaults = () => {
      const P = {}; for (const p of cfg.params) P[p.key] = p.def;
      return P;
    };
    const S = cfg.state || (cfg.state = {
      P: defaults(), O: Object.fromEntries((cfg.options || []).map(o => [o.key, o.def])),
      ...cfg.initial, view: "pf", pins: [], range: null, qp: "0.95", example: cfg.initial?.example ?? null
    });
    const P = () => S.P;
    const SYMTXT = { mu: "μ", sigma: "σ", lambda: "λ", alpha: "α", beta: "β" };
    const symTxt = k => SYMTXT[k] || k;
    const twoSided = () => S.mode === "between" || S.mode === "outside";

    /* ---------- maths ---------- */
    const support = PP => cfg.support(PP);
    const clampX = x => { const [lo, hi] = support(P()); return clamp(discrete ? Math.round(x) : x, lo, hi); };
    function cdf(x, PP = P()){
      if (cfg.cdf) return cfg.cdf(x, PP);
      const [lo] = support(PP); let s = 0;
      for (let k = lo; k <= Math.floor(x); k++) s += cfg.pf(k, PP);
      return Math.min(1, s);
    }
    const sf = (x, PP = P()) => discrete ? 1 - cdf(x - 1, PP) : 1 - cdf(x, PP);   // P(X ≥ x)
    function prob(st = S){
      const PP = st.P, a = Math.min(st.a, st.b ?? st.a), b = Math.max(st.a, st.b ?? st.a);
      if (cfg.prob){ const r = cfg.prob(st.mode, st.a, st.b, PP, st.O); if (r != null) return r; }
      switch (st.mode){
        case "eq": return discrete ? cfg.pf(st.a, PP) : 0;
        case "le": return cdf(st.a, PP);
        case "ge": return sf(st.a, PP);
        case "between": return Math.max(0, discrete ? cdf(b, PP) - cdf(a - 1, PP) : cdf(b, PP) - cdf(a, PP));
        case "outside": return cdf(a, PP) + sf(b, PP);
      }
    }

    /* ---------- examples ---------- */
    const queryMath = st => {
      const X = M.i("X"), x = M.n(trim(st.a, 4)), y = M.n(trim(st.b ?? st.a, 4)), P_ = M.i("P");
      const in_ = { eq: M.row(X, M.o("="), x), le: M.row(X, M.o("≤"), x), ge: M.row(X, M.o("≥"), x),
        between: M.row(x, M.o("≤"), X, M.o("≤"), y), outside: M.row(X, M.o("≤"), x, M.t(t("or")), X, M.o("≥"), y) }[st.mode];
      return M.row(P_, M.paren(in_));
    };
    const exState = e => ({ ...S, P: { ...defaults(), ...e.set.P }, O: { ...S.O, ...(e.set.O || {}) }, mode: e.set.mode, a: e.set.a, b: e.set.b ?? e.set.a });
    const exList = () => cfg.examples.map(e => {
      const st = exState(e);
      return { id: e.id, title: K("ex." + e.id), source: e.source === "slides" ? t("srcSlides") : e.source, answer: `<math>${queryMath(st)}<mo>=</mo>${M.prob(prob(st))}</math>` };
    });
    function loadExample(id){
      const e = cfg.examples.find(x => x.id === id); if (!e) return;
      const st = exState(e);
      Object.assign(S, { P: st.P, O: st.O, mode: st.mode, a: st.a, b: st.b, example: id, range: null });
      update(); fit();
    }

    /* ---------- markup ---------- */
    const modeLabel = m => {
      const X = M.i("X"), x = M.i("x"), a = M.i("a"), b = M.i("b");
      const in_ = { eq: M.row(X, M.o("="), x), le: M.row(X, M.o("≤"), x), ge: M.row(X, M.o("≥"), x),
        between: M.row(a, M.o("≤"), X, M.o("≤"), b), outside: M.row(X, M.o("≤"), a, M.t(t("or")), X, M.o("≥"), b) }[m];
      return M.row(M.i("P"), M.paren(in_));
    };
    const modeBtn = m => `<button data-mode="${m}" aria-pressed="false"><math>${modeLabel(m)}</math></button>`;
    root.innerHTML = `
    <div class="page">
      <header class="page-head"><h1>${K("title")}</h1></header>

      <section class="work">
        <div class="plot-col">
          <div class="plot-bar">
            <div class="seg" role="group" aria-label="${t("graphType")}">
              <button data-view="pf" aria-pressed="true">${discrete ? t("d.viewPf") : t("density")}</button>
              <button data-view="cdf" aria-pressed="false">${t("cumulative")}</button>
            </div>
            <div class="bar-actions">
              <button class="btn" id="fitBtn" title="${t("fitTitle")}">${t("fitView")}</button>
              <button class="btn" id="pinBtn" title="${t("pinTitle")}">${t("pin")}</button>
              <button class="btn" id="unpinBtn" hidden>${t("clearPins")}</button>
            </div>
          </div>
          <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${K("title")}"></canvas></div>
          <div class="legend">
            <div class="chips" id="chips"></div>
            <span class="hint" id="hint">${t("d.hint")}</span>
            <span class="readout" id="readout" hidden></span>
          </div>
        </div>

        <aside class="controls" aria-label="${t("controls")}">
          <div class="group">
            <h2>${t("parameters")}</h2>
            ${cfg.params.map(p => `
            <div class="param">
              <label for="p-${p.key}"><span class="sym"><math>${p.sym}</math></span>${K("param." + p.key)}</label>
              ${numInput("p-" + p.key, p.step)}
              <input id="r-${p.key}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" aria-label="${K("param." + p.key)}">
            </div>`).join("")}
            <p class="note err" id="paramErr" hidden></p>
          </div>

          <div class="group">
            <h2>${t("d.query")}</h2>
            <div class="qmodes" role="group" aria-label="${t("d.query")}">${MODES.map(modeBtn).join("")}</div>
            <div class="bounds" id="bounds">
              <label><span class="sym" id="aSym">x</span>${numInput("aN", discrete ? 1 : 0.1)}</label>
              <label id="bLbl"><span class="sym">b</span>${numInput("bN", discrete ? 1 : 0.1)}</label>
            </div>
            ${(cfg.options || []).map(o => `<label class="check check-top"><input type="checkbox" data-opt="${o.key}">${K("opt." + o.key)}</label>`).join("")}
          </div>

          <div class="group result" aria-live="polite">
            <div class="p-big" id="pBig"></div>
            <div class="p-sub" id="pSub"></div>
            <dl class="facts" id="facts"></dl>
          </div>

          ${discrete ? "" : `
          <div class="group">
            <h2>${t("findX")}</h2>
            <div class="qrow">
              <label class="lbl" for="qp"><math><mi>P</mi><mo>(</mo><mi>X</mi><mo>≤</mo><mi>x</mi><mo>)</mo><mo>=</mo></math></label>
              ${numInput("qp", 0.01)}
              <span class="lbl"><math><mi>x</mi><mo>=</mo></math></span>
              <output class="qout" id="qx"></output>
              <button class="btn" id="qUse">${t("markX")}</button>
            </div>
          </div>`}
        </aside>
      </section>

      <section class="formulas" aria-label="${t("formulas")}">
        <h2>${t("formulas")}</h2>
        <div class="frow"><span class="flabel">${discrete ? t("d.pf") : t("d.pdf")}</span><div class="fmath" id="fPf"></div></div>
        <div class="frow"><span class="flabel">${t("d.prob")}</span><div class="fmath" id="fProb"></div></div>
        <div class="frow"><span class="flabel">${t("d.moments")}</span><div class="fmath" id="fMom"></div></div>
        <div id="vars"></div>
      </section>

      ${sectionsHtml({
        about: K("about"),
        notes: [...cfg.notes.map(K), discrete ? t("d.note.discrete") : t("d.note.continuous")],
        sources: cfg.sources.map(K),
      })}
    </div>`;

    const el = id => $("#" + id, root);
    const aN = el("aN"), bN = el("bN"), qp = el("qp");

    /* ---------- formulas ---------- */
    const X_ = M.i("X"), P_ = M.i("P"), E_ = M.row(M.i("E"), M.paren(X_)), V_ = M.row(M.i("V"), M.paren(X_));
    const pv = v => M.prob(v);
    function termList(lo, hi){
      const out = []; for (let k = lo; k <= hi; k++) out.push(M.n(cfg.pf(k, P()).toFixed(4)));
      return out.join(M.o("+"));
    }
    function renderFormulas(){
      const PP = P(), x = M.i("x"), val = prob(), [lo, hi] = support(PP);
      const fx = discrete ? M.row(M.i("p"), M.paren(x)) : M.row(M.i("f"), M.paren(x));
      const pf = discrete
        ? M.row(fx, M.o("="), cfg.math.general(), M.o("="), M.row(M.i("p"), M.paren(M.n(String(S.a)))), M.o("="), cfg.math.at(S.a, PP),
            ...(cfg.math.atNum ? [M.o("="), cfg.math.atNum(S.a, PP)] : []), M.o("="), pv(cfg.pf(S.a, PP)))
        : M.row(fx, M.o("="), cfg.math.general(), M.o("="), cfg.math.at(null, PP));
      el("fPf").innerHTML = M.math(pf);

      const q = queryMath(S), a = Math.min(S.a, S.b), b = Math.max(S.a, S.b), F = v => M.row(M.i("F"), M.paren(M.n(trim(v, 4))));
      let chain;
      if (discrete){
        const many = n => n > 7;
        if (S.mode === "eq") chain = [q, cfg.math.at(S.a, PP), ...(cfg.math.atNum ? [cfg.math.atNum(S.a, PP)] : []), pv(val)];
        else if (S.mode === "le") chain = S.a < lo ? [q, M.n(0)] : many(S.a - lo + 1) ? [q, F(S.a), pv(val)] : [q, termList(lo, S.a), pv(val)];
        else if (S.mode === "ge"){
          const below = M.row(P_, M.paren(M.row(X_, M.o("≤"), M.n(String(S.a - 1)))));
          chain = S.a <= lo ? [q, M.n(1)] : many(S.a - lo)
            ? [q, M.row(M.n(1), M.o(MINUS), below), M.row(M.n(1), M.o(MINUS), F(S.a - 1)), pv(val)]
            : [q, M.row(M.n(1), M.o(MINUS), below), M.row(M.n(1), M.o(MINUS), M.paren(termList(lo, S.a - 1))), pv(val)];
        } else {
          chain = many(b - a + 1) ? [q, M.row(F(b), M.o(MINUS), F(a - 1)), pv(val)] : [q, termList(Math.max(a, lo), Math.min(b, hi)), pv(val)];
        }
      } else {
        const wrap = cfg.math.cdfCompound ? M.paren : (x => x);
        const steps = v => cfg.math.cdfSteps(v, PP, S.O), wsteps = v => steps(v).map(wrap);
        const comb = (fn) => { const sa = steps(a), sb = steps(b); return sa.map((_, i) => fn(sa[i], sb[i])); };
        const gen = { le: [F(S.a)], ge: cfg.math.sfSteps ? [] : [M.row(M.n(1), M.o(MINUS), F(S.a))], between: [M.row(F(b), M.o(MINUS), F(a))],
          outside: [M.row(F(a), M.o("+"), M.n(1), M.o(MINUS), F(b))] }[S.mode];
        const sub = {
          le: steps(S.a),
          ge: cfg.math.sfSteps ? cfg.math.sfSteps(S.a, PP, S.O) : wsteps(S.a).map(s => M.row(M.n(1), M.o(MINUS), s)),
          between: comb((sa, sb) => M.row(wrap(sb), M.o(MINUS), wrap(sa))),
          outside: comb((sa, sb) => M.row(sa, M.o("+"), M.n(1), M.o(MINUS), wrap(sb))),
        }[S.mode];
        chain = [q, ...gen, ...sub, pv(val)];
      }
      const box = el("fProb");
      box.innerHTML = M.math(M.row(chain.join(M.o("="))));
      if (box.scrollWidth > box.clientWidth + 2) box.innerHTML = M.chain(chain, 3);   // wrap only when it does not fit
      if (box.scrollWidth > box.clientWidth + 2) box.innerHTML = M.chain(chain, 2);

      el("fMom").innerHTML =
        M.math(M.row(E_, M.o("="), cfg.math.mean.general(), M.o("="), cfg.math.mean.sub(PP), M.o("="), M.n(trim(cfg.mean(PP), 4)))) +
        M.math(M.row(V_, M.o("="), cfg.math.variance.general(), M.o("="), cfg.math.variance.sub(PP), M.o("="), M.n(trim(cfg.variance(PP), 4))));
    }

    function renderVars(){
      const PP = P(), rows = cfg.params.map(p => [p.sym, K("sym." + p.key), show(trim(PP[p.key], 6))]);
      if (twoSided()) rows.push([M.i("a"), t("d.sym.a"), show(trim(Math.min(S.a, S.b), 4))], [M.i("b"), t("d.sym.b"), show(trim(Math.max(S.a, S.b), 4))]);
      else rows.push([M.i("x"), t("d.sym.x"), show(trim(S.a, 4))]);
      rows.push([E_, t("d.sym.E"), show(trim(cfg.mean(PP), 4))], [V_, t("d.sym.V"), show(trim(cfg.variance(PP), 4))]);
      for (const extra of cfg.extraVars?.(PP, S) || []) rows.push(extra);
      el("vars").innerHTML = varsTableHtml(rows);
    }

    function renderResult(){
      const PP = P(), v = prob();
      el("pBig").textContent = show(fmtProb(v));
      el("pSub").innerHTML = `<math>${queryMath(S)}</math>`;
      el("facts").innerHTML = [
        [t("d.ev"), show(trim(cfg.mean(PP), 4))],
        [t("d.var"), show(trim(cfg.variance(PP), 4))],
        [t("d.sd"), show(trim(Math.sqrt(cfg.variance(PP)), 4))],
      ].map(([k, x]) => `<dt>${k}</dt><dd>${x}</dd>`).join("");
    }

    function renderR(){
      const PP = P(), r = cfg.r, args = r.args(PP), a = Math.min(S.a, S.b), b = Math.max(S.a, S.b), L = [];
      const n = v => trim(v, 6);
      L.push(`# ${K("title")}: ${t("d.r.params")} ${cfg.params.map(p => `${symTxt(p.key)} = ${n(PP[p.key])}`).join(", ")}`);
      if (cfg.r.note) L.push(`# ${cfg.r.note(PP, S.O)}`);
      const line = {
        eq: () => `${r.d}(${n(S.a)}, ${args})`,
        le: () => `${r.p}(${n(S.a)}, ${args})`,
        ge: () => discrete ? `1 - ${r.p}(${n(S.a - 1)}, ${args})` : `1 - ${r.p}(${n(S.a)}, ${args})`,
        between: () => discrete ? `${r.p}(${n(b)}, ${args}) - ${r.p}(${n(a - 1)}, ${args})` : `${r.p}(${n(b)}, ${args}) - ${r.p}(${n(a)}, ${args})`,
        outside: () => `${r.p}(${n(a)}, ${args}) + 1 - ${r.p}(${n(b)}, ${args})`,
      }[S.mode]();
      L.push(rLine(line, `${t("d.r.prob")}: ${fmtProb(prob())}`, 44));
      L.push(rLine(cfg.r.mean(PP), `${t("d.ev")}: ${n(cfg.mean(PP))}`, 44));
      if (!discrete){
        const pq = parseNum(S.qp);
        if (pq > 0 && pq < 1) L.push(rLine(`${r.q}(${n(pq)}, ${args})`, `x ${t("d.r.with")} P(X ≤ x) = ${n(pq)}`, 44));
      }
      el("rcode").innerHTML = codeHtml(L.join("\n"));
    }

    function renderChips(){
      const label = PP => cfg.params.map(p => `${symTxt(p.key)} = ${show(trim(PP[p.key], 4))}`).join(t("listSep"));
      el("chips").innerHTML = `<span class="chip"><span class="sw"></span>${label(P())}</span>` +
        S.pins.map((pp, i) => `<span class="chip pinned"><span class="sw"></span>${label(pp)}<button data-unpin="${i}" aria-label="${t("unpin")}">×</button></span>`).join("");
      el("unpinBtn").hidden = S.pins.length < 2;
    }

    function renderQuantile(){
      if (discrete) return;
      const p = parseNum(qp.value), ok = p != null && p > 0 && p < 1;
      qp.setAttribute("aria-invalid", !ok);
      el("qx").textContent = ok ? show(trim(cfg.inv(p, P(), S.O), 4)) : t("pRange");
    }

    function syncInputs(skip){
      for (const p of cfg.params){
        const inp = el("p-" + p.key), r = el("r-" + p.key), v = P()[p.key];
        if (skip !== inp) inp.value = fmtIn(v, 6);
        setSlider(r, v);
      }
      if (skip !== aN) aN.value = fmtIn(S.a, 4);
      if (skip !== bN) bN.value = fmtIn(S.b, 4);
      $$(".qmodes button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === S.mode));
      $$(".plot-bar .seg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.view === S.view));
      $$("[data-opt]", root).forEach(c => { c.checked = !!S.O[c.dataset.opt]; });
      el("bLbl").hidden = !twoSided(); el("bounds").classList.toggle("single", !twoSided());
      el("aSym").textContent = twoSided() ? "a" : "x";
    }

    function update(skip){
      const err = cfg.check?.(P());
      el("paramErr").hidden = !err; if (err) el("paramErr").textContent = K(err);
      if (err){ syncInputs(skip); return; }
      S.a = clampX(S.a); S.b = clampX(S.b);
      syncInputs(skip); renderFormulas(); renderVars(); renderResult(); renderR(); renderChips(); renderQuantile();
      markExample(el("examples"), S.example);
      plot.draw();
    }

    /* ---------- graph ---------- */
    function fit(){
      const [lo, hi] = cfg.view(P());
      if (discrete){ plot.x0 = Math.min(lo, S.a, S.b) - 0.7; plot.x1 = Math.max(hi, S.a, S.b) + 0.7; }
      else {
        // keep the markers in view, with a margin
        const xs = twoSided() ? [S.a, S.b] : [S.a], w = hi - lo;
        plot.x0 = Math.min(lo, ...xs.map(x => x - 0.08 * w)); plot.x1 = Math.max(hi, ...xs.map(x => x + 0.08 * w));
      }
      plot.draw();
    }
    function fitIfLost(){
      const [lo, hi] = cfg.view(P()), r = plot.x1 - plot.x0, w = hi - lo;
      if (S.a < plot.x0 || S.a > plot.x1 || w > r * 2.5 || w < r / 6) fit();
    }
    function inRegion(x){
      const a = Math.min(S.a, S.b), b = Math.max(S.a, S.b);
      return { eq: x === S.a, le: x <= S.a, ge: x >= S.a, between: x >= a && x <= b, outside: x <= a || x >= b }[S.mode];
    }
    function drawPlot(p){
      const C = p.colors(), c = p.ctx, PP = P(), pfView = S.view === "pf";
      if (cfg.check?.(PP)){ p.grid(C); return; }
      const [lo, hi] = support(PP);
      if (discrete){
        const from = Math.max(lo, Math.ceil(p.x0)), to = Math.min(hi, Math.floor(p.x1));
        const ks = []; for (let k = from; k <= to && ks.length < 4000; k++) ks.push(k);
        if (pfView){
          let top = 0; for (const k of ks) top = Math.max(top, cfg.pf(k, PP));
          for (const q of S.pins) for (const k of ks) top = Math.max(top, cfg.pf(k, q));
          p.y0 = 0; p.y1 = (top || 1) * 1.18;
        } else { p.y0 = 0; p.y1 = 1.08; }
        const step = Num.niceStep(p.x1 - p.x0, Math.max(3, p.pw / 70));
        p.grid(C, { xTicks: Num.ticks(p.x0, p.x1, Math.max(3, p.pw / 70)).values.filter(v => Number.isInteger(v)), xFmt: v => String(v) });
        if (pfView){
          for (const q of S.pins){
            c.save(); c.setLineDash([4, 3]); c.strokeStyle = C.pin; c.lineWidth = 1.5;
            for (const k of ks){ const y = cfg.pf(k, q); if (y <= 0) continue; const px = Math.round(p.X(k)) + .5; c.beginPath(); c.moveTo(px - 6, p.Y(y)); c.lineTo(px + 6, p.Y(y)); c.stroke(); }
            c.restore();
          }
          p.bars(ks.map(k => ({ x: k, y: cfg.pf(k, PP), on: inRegion(k) })), C, Math.min(0.62, Math.max(0.1, 1 - 2 / Math.max(1, p.X(1) - p.X(0)))));
        } else {
          c.save(); c.strokeStyle = C.accent; c.lineWidth = 2.2;
          let prev = cdf(from - 1, PP);
          for (let k = from; k <= to + 1; k++){
            const y = cdf(k, PP);
            c.beginPath(); c.moveTo(p.X(k - 1), p.Y(prev)); c.lineTo(p.X(k), p.Y(prev)); c.stroke();
            prev = y;
          }
          c.restore();
          for (const k of ks){ c.fillStyle = inRegion(k) ? C.accent : C.surface; c.strokeStyle = C.accent; c.lineWidth = 1.5;
            c.beginPath(); c.arc(p.X(k), p.Y(cdf(k, PP)), 3.2, 0, Math.PI * 2); c.fill(); c.stroke(); }
        }
      } else {
        const f = pfView ? x => (x < lo || x > hi ? 0 : cfg.pf(x, PP)) : x => cdf(x, PP);
        if (pfView){
          let top = 0; for (let i = 0; i <= 200; i++){ const x = p.x0 + (p.x1 - p.x0) * i / 200; top = Math.max(top, f(x)); for (const q of S.pins) top = Math.max(top, cfg.pf(x, q) || 0); }
          p.y0 = 0; p.y1 = (top || 1) * 1.15;
        } else { p.y0 = 0; p.y1 = 1.08; }
        p.grid(C);
        for (const q of S.pins) p.curve(pfView ? x => (x < cfg.support(q)[0] || x > cfg.support(q)[1] ? 0 : cfg.pf(x, q)) : x => cdf(x, q), { color: C.pin, width: 1.5, dash: [5, 4] });
        if (pfView){
          const a = Math.min(S.a, S.b), b = Math.max(S.a, S.b);
          const regs = { le: [[-Infinity, S.a]], ge: [[S.a, Infinity]], between: [[a, b]], outside: [[-Infinity, a], [b, Infinity]] }[S.mode];
          for (const [u, v] of regs) p.area(f, Math.max(u, lo), Math.min(v, hi), C.fill);
        }
        p.curve(f, { color: C.accent, width: 2.2 });
      }
      // expected value
      const mu = cfg.mean(PP);
      if (pfView && mu >= p.x0 && mu <= p.x1){
        p.vline(mu, C.muted, [3, 3]);
        c.font = `11.5px ${C.font}`; c.fillStyle = C.muted; c.textAlign = "left"; c.textBaseline = "top";
        c.fillText("E(X)", p.X(mu) + 4, p.pad.t + 56);
      }
      // markers
      const yAt = x => pfView ? (discrete ? cfg.pf(x, PP) : cfg.pf(x, PP)) : cdf(x, PP);
      if (twoSided()){
        const a = Math.min(S.a, S.b), b = Math.max(S.a, S.b);
        p.marker(a, yAt(a), `a = ${show(trim(a, 3))}`, C, 0);
        p.marker(b, yAt(b), `b = ${show(trim(b, 3))}`, C, p.X(b) - p.X(a) < 80 ? 1 : 0);
      } else p.marker(S.a, yAt(S.a), `x = ${show(trim(S.a, 3))}`, C, 0);
      if (p.hover != null && !p.drag){
        const hx = discrete ? Math.round(p.hover) : p.hover;
        if (hx >= lo && hx <= hi){
          p.vline(hx, C.faint, [2, 3]);
          c.fillStyle = C.ink; c.beginPath(); c.arc(p.X(hx), p.Y(yAt(hx)), 3, 0, Math.PI * 2); c.fill();
        }
      }
    }
    const plot = new Plot(el("plot"), {
      draw: drawPlot,
      handles: () => twoSided() ? [{ key: "a", x: S.a }, { key: "b", x: S.b }] : [{ key: "a", x: S.a }],
      onFit: fit,
      onHandle(key, x){
        S.example = null;
        const dec = Num.decimalsFor(Num.niceStep(plot.x1 - plot.x0, 200));
        const v = clampX(discrete ? Math.round(x) : +x.toFixed(dec));
        if (key === "a") S.a = v; else S.b = v;
        update();
      },
      onHover(x){
        const r = el("readout"); el("hint").hidden = x != null;
        if (x == null){ r.hidden = true; return; }
        const PP = P(), [lo, hi] = support(PP), hx = discrete ? Math.round(x) : x;
        if (hx < lo || hx > hi){ r.hidden = true; return; }
        const d = Num.decimalsFor(Num.niceStep(plot.x1 - plot.x0, 200));
        r.hidden = false;
        r.innerHTML = discrete
          ? `<span>x <b>${hx}</b></span><span>P(X = x) <b>${show(fmtProb(cfg.pf(hx, PP)))}</b></span><span>F(x) <b>${show(fmtProb(cdf(hx, PP)))}</b></span>`
          : `<span>x <b>${show(hx.toFixed(d))}</b></span><span>f(x) <b>${show(cfg.pf(hx, PP).toFixed(4))}</b></span><span>F(x) <b>${show(fmtProb(cdf(hx, PP)))}</b></span>`;
      }
    });

    /* ---------- events ---------- */
    bindNudge(root);
    bindCopy($(".sections", root));
    const edit = fn => { S.example = null; fn(); };
    for (const p of cfg.params){
      const inp = el("p-" + p.key), r = el("r-" + p.key);
      inp.addEventListener("input", () => {
        let v = parseNum(inp.value); const good = v != null && (!p.int || Number.isInteger(v)) && p.ok(v, P());
        inp.setAttribute("aria-invalid", !good);
        if (good) edit(() => { S.P[p.key] = v; update(inp); });
      });
      inp.addEventListener("change", () => { inp.removeAttribute("aria-invalid"); update(); fitIfLost(); });
      r.addEventListener("input", () => edit(() => { S.P[p.key] = p.int ? Math.round(+r.value) : +r.value; update(); fitIfLost(); }));
    }
    const bound = (inp, key) => {
      inp.addEventListener("input", () => { const v = parseNum(inp.value); if (v != null) edit(() => { S[key] = discrete ? Math.round(v) : v; update(inp); }); });
      inp.addEventListener("change", () => { update(); fitIfLost(); });
    };
    bound(aN, "a"); bound(bN, "b");
    $$(".qmodes button", root).forEach(b => b.addEventListener("click", () => edit(() => {
      const was = twoSided(); S.mode = b.dataset.mode;
      if (twoSided() && !was && S.b <= S.a){ const sd = Math.sqrt(cfg.variance(P())); S.b = clampX(S.a + (discrete ? Math.max(1, Math.round(sd)) : sd)); }
      update();
    })));
    $$(".plot-bar .seg button", root).forEach(b => b.addEventListener("click", () => { S.view = b.dataset.view; update(); }));
    $$("[data-opt]", root).forEach(c => c.addEventListener("change", () => edit(() => { S.O[c.dataset.opt] = c.checked; update(); })));
    el("fitBtn").addEventListener("click", fit);
    el("pinBtn").addEventListener("click", () => {
      const key = JSON.stringify(P());
      if (!S.pins.some(q => JSON.stringify(q) === key)) S.pins.push({ ...P() });
      update();
    });
    el("unpinBtn").addEventListener("click", () => { S.pins = []; update(); });
    el("chips").addEventListener("click", e => { const i = e.target.dataset?.unpin; if (i != null){ S.pins.splice(+i, 1); update(); } });
    if (!discrete){
      qp.addEventListener("input", () => { S.qp = qp.value; renderQuantile(); renderR(); });
      el("qUse").addEventListener("click", () => {
        const p = parseNum(qp.value); if (!(p > 0 && p < 1)) return;
        edit(() => { S.mode = "le"; S.a = +cfg.inv(p, P(), S.O).toFixed(6); update(); fitIfLost(); });
      });
      qp.value = loc(String(S.qp).replace(",", "."));
    }

    el("examples").innerHTML = examplesHtml(exList(), S.example);
    el("examples").addEventListener("click", e => { const b = e.target.closest("[data-ex]"); if (b) loadExample(b.dataset.ex); });

    const onTheme = () => plot.draw();
    document.addEventListener("themechange", onTheme);

    if (S.range) [plot.x0, plot.x1] = S.range; else fit();
    update();
    return () => { S.range = [plot.x0, plot.x1]; plot.destroy(); document.removeEventListener("themechange", onTheme); };
  };
}
