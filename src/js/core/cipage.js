"use strict";
/* ============================================================
   Shared page for confidence intervals: for the mean (z or t) and
   for a proportion (z).

     IC(μ, γ) = x̄ ± z_γ·σ/√n      or   x̄ ± t_γ·s/√n   (gl = n − 1)
     IC(p, γ) = p̂ ± z_γ·√(p̂(1 − p̂)/n)

   The graph shows the sampling distribution centred on the estimate,
   with the central area γ shaded between the limits. Drag the centre to
   move the estimate, or a limit to change the confidence level.
   Sources: Barbetta 7.3.2 and 7.3.3 · Bussab & Morettin 11
   ============================================================ */
function ciPage(cfg){
  const mean = cfg.mode === "mean", K = k => t(`${cfg.key}.${k}`);
  return function CIPage(root){
    const S = cfg.state;

    /* ---------- maths ---------- */
    function compute(st = S){
      const n = st.n, usesT = mean && st.method === "t", df = usesT ? n - 1 : null;
      if (!(n >= 2) || !Number.isInteger(n)) return { err: "ci.err.n" };
      let c, se, pHat;
      if (mean){
        if (!(st.sd > 0)) return { err: "ci.err.sd" };
        c = st.xbar; se = st.sd / Math.sqrt(n);
      } else {
        if (!(st.y >= 0 && st.y <= n && Number.isInteger(st.y))) return { err: "ci.err.y" };
        pHat = st.y / n; c = pHat; se = Math.sqrt(pHat * (1 - pHat) / n);
      }
      const pr = 1 - (1 - st.conf / 100) / 2;
      const exact = usesT ? Num.tInv(pr, df) : Num.PhiInv(pr);
      const crit = st.zTable ? +exact.toFixed(3) : exact, eps = crit * se;
      const ref = st.ref === "" || st.ref == null ? null : parseNum(st.ref);
      return { n, usesT, df, c, se, pHat, crit, eps, lo: c - eps, hi: c + eps, ref,
        refIn: ref == null ? null : ref >= c - eps && ref <= c + eps,
        small: !mean && (n * pHat < 15 || n * (1 - pHat) < 15) };
    }
    const dec = R => clamp(2 - Math.floor(Math.log10(R.eps || 1)), 1, 6);
    const fmtV = (v, R) => show(trim(v, dec(R)));
    const interval = R => `(${fmtV(R.lo, R)}${t("listSep")}${fmtV(R.hi, R)})`;

    /* ---------- symbols ---------- */
    const est = () => mean ? M.bar("x") : M.i("p̂");
    const param = () => mean ? M.i("μ") : M.i("p");
    const critSym = R => M.sub(M.i(R.usesT ? "t" : "z"), M.i("γ"));
    const seSym = R => mean ? M.sub(M.i(R.usesT ? "s" : "σ"), M.bar("x")) : M.sub(M.i("s"), M.i("p̂"));
    const IC = () => M.row(M.text(t("ci.IC")), M.paren(M.row(param(), M.o(","), M.i("γ"))));

    /* ---------- examples ---------- */
    const exState = e => ({ ...S, zTable: true, ref: "", ...e.set });
    const exList = () => cfg.examples.map(e => {
      const R = compute(exState(e));
      return { id: e.id, title: K("ex." + e.id), source: typeof e.source === "function" ? e.source() : e.source,
        answer: `<math>${IC()}<mo>=</mo>${M.paren(M.row(M.n(trim(R.lo, dec(R))), M.o(usesComma() ? ";" : ","), M.n(trim(R.hi, dec(R)))))}</math>` };
    });
    function loadExample(id){
      const e = cfg.examples.find(x => x.id === id); if (!e) return;
      Object.assign(S, exState(e), { example: id });
      update(); fit();
    }

    /* ---------- markup ---------- */
    const sym = s => `<span class="sym">${s}</span>`;
    const fields = mean
      ? [["xbar", `<math>${M.bar("x")}</math>`, K("xbar"), 0.1], ["sd", `<span id="sdSym"></span>`, `<span id="sdLbl"></span>`, 0.1], ["n", "<math><mi>n</mi></math>", t("ci.n"), 1]]
      : [["n", "<math><mi>n</mi></math>", t("ci.n"), 1], ["y", "<math><mi>y</mi></math>", K("y"), 1]];
    root.innerHTML = `
    <div class="page ci-page">
      <header class="page-head"><h1>${K("title")}</h1></header>
      <section class="work">
        <div class="plot-col">
          <div class="plot-bar">
            <span class="plot-title">${mean ? K("graph") : K("graph")}</span>
            <div class="bar-actions"><button class="btn" id="fitBtn" title="${t("fitTitle")}">${t("fitView")}</button></div>
          </div>
          <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${K("graph")}"></canvas></div>
          <div class="legend"><span class="hint">${t("ci.hint")}</span></div>
        </div>
        <aside class="controls" aria-label="${t("controls")}">
          ${mean ? `<div class="group">
            <h2>${K("method")}</h2>
            <div class="seg full" role="group" id="methodSeg">
              <button data-m="z" aria-pressed="false">${K("method.z")}</button>
              <button data-m="t" aria-pressed="false">${K("method.t")}</button>
            </div>
            <p class="note seg-note" id="methodNote"></p>
          </div>` : ""}
          <div class="group">
            <h2>${t("ci.sample")}</h2>
            ${fields.map(([k, s, l, st]) => `<div class="param"><label for="f-${k}">${sym(s)}${l}</label>${numInput("f-" + k, st)}</div>`).join("")}
            <p class="note err" id="err" hidden></p>
            <p class="note warn" id="warn" hidden>${t("ci.small")}</p>
          </div>
          <div class="group">
            <h2>${t("ss.confidence")}</h2>
            <div class="param"><label for="f-conf">${sym("γ")}${t("ss.level")} <span class="unit">(%)</span></label>${numInput("f-conf", 1)}</div>
            <div class="presets" role="group">${[90, 95, 99].map(v => `<button class="btn" data-conf="${v}" aria-pressed="false">${v}%</button>`).join("")}</div>
            <div class="zline" id="critLine"></div>
            <label class="check"><input type="checkbox" id="zTable">${t("ci.table")}</label>
          </div>
          <div class="group">
            <h2>${t("ci.compare")}</h2>
            <div class="param"><label for="f-ref">${sym(mean ? "μ₀" : "p₀")}${t("ci.ref")}</label>${numInput("f-ref", mean ? 0.1 : 0.01, `placeholder="—"`)}</div>
          </div>
          <div class="group result" aria-live="polite">
            <div class="p-big ci-big" id="big"></div>
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
    const el = id => $("#" + id, root);
    let R = compute();

    /* ---------- render ---------- */
    function renderFormulas(){
      const n4 = v => M.v(trim(v, 4)), num = v => M.v(trim(v, 6)), r4 = v => M.r(trim(v, 4)), cs = M.v(trim(R.crit, S.zTable ? 3 : 5));   // values blue, results bold
      const sq = M.sqrt(M.i("n")), rows = [];
      if (!mean) rows.push({ label: K("f.phat"), chain: [M.i("p̂"), M.frac(M.i("y"), M.i("n")), M.frac(num(S.y), num(S.n)), r4(R.pHat)] });
      rows.push({ label: t("ci.f.se"), chain: mean
        ? [seSym(R), M.frac(M.i(R.usesT ? "s" : "σ"), sq), M.frac(num(S.sd), M.sqrt(num(S.n))), r4(R.se)]
        : [seSym(R), M.sqrt(M.frac(M.row(M.i("p̂"), M.paren(M.row(M.n(1), M.o(MINUS), M.i("p̂")))), M.i("n"))),
           M.sqrt(M.frac(M.row(n4(R.pHat), M.o("·"), n4(1 - R.pHat)), num(S.n))), r4(R.se)] });
      const pm = M.o("±");
      rows.push({ label: t("ci.f.ci"), chain: [IC(), M.row(est(), pm, critSym(R), M.o("·"), seSym(R)),
        M.row(n4(R.c), pm, cs, M.o("·"), n4(R.se)), M.row(n4(R.c), pm, r4(R.eps))] });
      rows.push({ label: t("ci.f.limits"), html: M.math(M.row(
        M.paren(M.row(est(), M.o(MINUS), M.i("ε"), M.o(usesComma() ? ";" : ","), est(), M.o("+"), M.i("ε"))), M.o("="),
        M.paren(M.row(M.r(trim(R.lo, dec(R))), M.o(usesComma() ? ";" : ","), M.r(trim(R.hi, dec(R)))))))
        + (R.usesT ? M.math(M.row(critSym(R), M.t(t("ss.withDf")), M.text(t("dfAbbr")), M.o("="), M.i("n"), M.o(MINUS), M.n(1), M.o("="), M.n(String(R.df))), "res") : "") });
      const box = el("frows");
      box.innerHTML = rows.map((r, i) => `<div class="frow"><span class="flabel">${r.label}</span><div class="fmath" data-row="${i}">${r.chain ? M.math(M.row(r.chain.join(M.o("=")))) : r.html}</div></div>`).join("");
      rows.forEach((r, i) => { if (!r.chain) return; const f = $(`[data-row="${i}"]`, box); if (f.scrollWidth > f.clientWidth + 2) f.innerHTML = M.chain(r.chain, 2); });
      const vars = [[IC(), K("sym.ic"), interval(R)], [est(), K("sym.est"), show(trim(R.c, 6))]];
      if (mean) vars.push(R.usesT ? [M.i("s"), K("sym.s"), show(trim(S.sd, 6))] : [M.i("σ"), K("sym.sigma"), show(trim(S.sd, 6))]);
      else vars.push([M.i("y"), K("sym.y"), String(S.y)]);
      vars.push([M.i("n"), t("ci.sym.n"), String(S.n)], [seSym(R), t("ci.sym.se"), show(trim(R.se, 6))],
        [M.i("γ"), t("ss.sym.gamma"), show(trim(S.conf, 2)) + "%"],
        [critSym(R), R.usesT ? t("ss.sym.t") : t("ss.sym.z"), show(trim(R.crit, S.zTable ? 3 : 5))]);
      if (R.usesT) vars.push([M.text(t("dfAbbr")), t("ss.sym.df"), String(R.df)]);
      vars.push([M.i("ε"), t("ci.sym.eps"), show(trim(R.eps, 6))]);
      el("vars").innerHTML = varsTableHtml(vars);
    }
    function renderResult(){
      el("big").textContent = interval(R);
      el("sub").innerHTML = `<math>${IC()}</math> · ${show(trim(S.conf, 2))}%`;
      const facts = [[t("ci.fact.est"), show(trim(R.c, 6))], [t("ci.fact.eps"), "± " + show(trim(R.eps, dec(R) + 1))],
        [t("ci.fact.se"), show(trim(R.se, 6))], [t("ci.fact.crit", { c: R.usesT ? "t" : "z" }), show(trim(R.crit, S.zTable ? 3 : 5)) + (R.usesT ? ` (${t("dfAbbr")} = ${R.df})` : "")]];
      if (R.ref != null) facts.push([t("ci.fact.ref", { r: show(trim(R.ref, 6)) }), R.refIn ? t("ci.inside") : t("ci.outside")]);
      el("facts").innerHTML = facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    }
    function renderR(){
      const conf = trim(S.conf / 100, 4), q = `1 - (1 - ${conf}) / 2`, L = [`# ${K("title")}`];
      if (mean){
        L.push(rLine(`xbar <- ${trim(S.xbar, 6)}`, K("xbar")), rLine(`${R.usesT ? "s" : "sigma"} <- ${trim(S.sd, 6)}`, R.usesT ? K("sym.s") : K("sym.sigma")), rLine(`n <- ${S.n}`, t("ci.sym.n")));
        const c = R.usesT ? `qt(${q}, df = n - 1)` : `qnorm(${q})`;
        L.push(rLine(`${R.usesT ? "t" : "z"} <- ${c}`, S.zTable ? `${t("ss.r.table")}: ${trim(R.crit, 3)}` : ""));
        L.push(rLine(`e <- ${R.usesT ? "t * s" : "z * sigma"} / sqrt(n)`, `${t("ci.fact.eps")}: ${trim(R.eps, 4)}`));
        L.push(rLine("c(xbar - e, xbar + e)", interval(R).replace(/[()]/g, "")));
        if (R.usesT) L.push(`# ${t("ci.r.ttest")}`);
      } else {
        L.push(rLine(`y <- ${S.y}; n <- ${S.n}`, `${K("y")}, ${t("ci.sym.n")}`), rLine("p <- y / n", `p̂: ${trim(R.pHat, 4)}`),
          rLine(`z <- qnorm(${q})`, S.zTable ? `${t("ss.r.table")}: ${trim(R.crit, 3)}` : ""),
          rLine("e <- z * sqrt(p * (1 - p) / n)", `${t("ci.fact.eps")}: ${trim(R.eps, 4)}`),
          rLine("c(p - e, p + e)", interval(R).replace(/[()]/g, "")));
      }
      el("rcode").innerHTML = codeHtml(L.join("\n"));
    }
    function syncInputs(skip){
      const set = (id, v, d = 6) => { const i = el(id); if (i && i !== skip) i.value = v === "" ? "" : fmtIn(v, d); };
      if (mean){ set("f-xbar", S.xbar); set("f-sd", S.sd); }
      set("f-n", S.n, 0); if (!mean) set("f-y", S.y, 0);
      set("f-conf", S.conf, 2); if (el("f-ref") !== skip) el("f-ref").value = S.ref === "" ? "" : loc(S.ref);
      el("zTable").checked = S.zTable;
      $$(".presets .btn", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.conf === S.conf));
      if (mean){
        $$("#methodSeg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.m === S.method));
        el("sdSym").textContent = S.method === "t" ? "s" : "σ";
        el("sdLbl").textContent = S.method === "t" ? K("sdS") : K("sdSigma");
        el("methodNote").textContent = K("note." + S.method);
      }
    }
    function update(skip){
      R = compute();
      syncInputs(skip);
      el("err").hidden = !R.err; if (R.err){ el("err").textContent = t(R.err); plot.draw(); return; }
      el("warn").hidden = !R.small;
      el("critLine").innerHTML = M.math(M.row(critSym(R), M.o("="), M.n(trim(R.crit, S.zTable ? 3 : 5)), ...(R.usesT ? [M.t(`(${t("dfAbbr")} = ${R.df})`)] : [])));
      renderFormulas(); renderResult(); renderR();
      markExample(el("examples"), S.example);
      plot.draw();
    }

    /* ---------- graph ---------- */
    const dens = x => { const u = (x - R.c) / R.se; return (R.usesT ? Num.tPdf(u, R.df) : Num.normPdf(u)) / R.se; };
    function fit(){
      if (R.err) return;
      const w = Math.max(4.2 * R.se, R.eps * 1.6), xs = [R.c - w, R.c + w];
      if (R.ref != null) xs.push(R.ref - 0.6 * R.se, R.ref + 0.6 * R.se);
      plot.x0 = Math.min(...xs); plot.x1 = Math.max(...xs);
      if (!mean){ plot.x0 = Math.max(plot.x0, -0.02); plot.x1 = Math.min(plot.x1, 1.02); }
      plot.draw();
    }
    function drawPlot(p){
      const C = p.colors(), c = p.ctx;
      if (R.err){ p.grid(C); return; }
      p.y0 = 0; p.y1 = dens(R.c) * 1.32;
      p.grid(C, { yFmt: () => "" });
      p.area(dens, R.lo, R.hi, C.fill);
      p.curve(dens, { color: C.accent, width: 2.2 });
      // the interval as a bracket near the axis
      const yb = p.Y(0) - 14, xl = p.X(R.lo), xr = p.X(R.hi);
      c.save(); c.strokeStyle = C.accent; c.lineWidth = 2.5; c.beginPath();
      c.moveTo(xl, yb - 7); c.lineTo(xl, yb + 7); c.moveTo(xl, yb); c.lineTo(xr, yb); c.moveTo(xr, yb - 7); c.lineTo(xr, yb + 7); c.stroke(); c.restore();
      c.font = `600 12px ${C.font}`; c.textAlign = "center"; c.textBaseline = "bottom"; c.lineJoin = "round";
      const gx = (xl + xr) / 2, gy = p.Y(dens(R.c) * 0.42), gt = `γ = ${show(trim(S.conf, 2))}%`;
      c.strokeStyle = C.surface; c.lineWidth = 4; c.strokeText(gt, gx, gy); c.fillStyle = C.accent; c.fillText(gt, gx, gy);
      for (const x of [R.lo, R.hi]) p.vline(x, C.accent, [4, 3], dens(x), 1.2);
      p.vline(R.c, C.accent, [], dens(R.c), 1.5);
      if (R.ref != null && R.ref >= p.x0 && R.ref <= p.x1){
        p.vline(R.ref, R.refIn ? C.muted : cssVar("--danger"), [6, 4], p.y1, 1.6);
        c.font = `600 12px ${C.font}`; c.fillStyle = R.refIn ? C.muted : cssVar("--danger"); c.textAlign = "left"; c.textBaseline = "top";
        c.fillText(`${mean ? "μ₀" : "p₀"} = ${show(trim(R.ref, 4))}`, p.X(R.ref) + 5, p.pad.t + 30);
      }
      const center = `${mean ? "x̄" : "p̂"} = ${show(trim(R.c, 4))}`;
      p.pill(p.X(R.c), 6, center, C, true);
      const close = xr - xl < 150, shift = close ? (150 - (xr - xl)) / 2 : 0;
      p.pill(xl - shift, 30, show(trim(R.lo, dec(R))), C, false);
      p.pill(xr + shift, 30, show(trim(R.hi, dec(R))), C, false);
    }
    const plot = new Plot(el("plot"), {
      draw: drawPlot,
      handles: () => R.err ? [] : [{ key: "c", x: R.c }, { key: "lo", x: R.lo }, { key: "hi", x: R.hi }],
      onFit: fit,
      onHandle(key, x){
        S.example = null;
        if (key === "c"){
          if (mean){ const d = Num.decimalsFor(Num.niceStep(plot.x1 - plot.x0, 200)); S.xbar = +x.toFixed(d); }
          else S.y = clamp(Math.round(x * S.n), 0, S.n);
        } else {
          const k = Math.abs(x - R.c) / R.se, cdf = R.usesT ? Num.tCdf(k, R.df) : Num.Phi(k);
          S.conf = clamp(Math.round((2 * cdf - 1) * 1000) / 10, 50, 99.9);
        }
        update();
      },
    });

    /* ---------- events ---------- */
    bindNudge(root); bindCopy($(".sections", root));
    const field = (id, key, ok, int = false, after) => {
      const inp = el(id);
      inp.addEventListener("input", () => {
        const v = parseNum(inp.value), good = v != null && (!int || Number.isInteger(v)) && ok(v);
        inp.setAttribute("aria-invalid", !good);
        if (good){ S[key] = v; S.example = null; update(inp); }
      });
      inp.addEventListener("change", () => { inp.removeAttribute("aria-invalid"); update(); after?.(); });
    };
    if (mean){ field("f-xbar", "xbar", () => true, false, fit); field("f-sd", "sd", v => v > 0, false, fit); }
    field("f-n", "n", v => v >= 2, true, fit);
    if (!mean) field("f-y", "y", v => v >= 0, true, fit);
    field("f-conf", "conf", v => v >= 50 && v < 100);
    el("f-ref").addEventListener("input", () => {
      const raw = el("f-ref").value.trim(), v = parseNum(raw);
      el("f-ref").setAttribute("aria-invalid", raw !== "" && v == null);
      if (raw === "" || v != null){ S.ref = raw === "" ? "" : String(v); S.example = null; update(el("f-ref")); }
    });
    el("f-ref").addEventListener("change", fit);
    $$(".presets .btn", root).forEach(b => b.addEventListener("click", () => { S.conf = +b.dataset.conf; S.example = null; update(); }));
    el("zTable").addEventListener("change", e => { S.zTable = e.target.checked; S.example = null; update(); });
    if (mean) $$("#methodSeg button", root).forEach(b => b.addEventListener("click", () => { S.method = b.dataset.m; S.example = null; update(); }));
    el("fitBtn").addEventListener("click", fit);
    el("examples").innerHTML = examplesHtml(exList(), S.example);
    el("examples").addEventListener("click", e => { const b = e.target.closest("[data-ex]"); if (b) loadExample(b.dataset.ex); });
    const onTheme = () => plot.draw();
    document.addEventListener("themechange", onTheme);
    if (S.range) [plot.x0, plot.x1] = S.range;
    update(); if (!S.range) fit();
    return () => { S.range = [plot.x0, plot.x1]; plot.destroy(); document.removeEventListener("themechange", onTheme); };
  };
}
