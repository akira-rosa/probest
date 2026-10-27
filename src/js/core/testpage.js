"use strict";
/* ============================================================
   Shared page for hypothesis tests on one mean (z or t) and on one
   proportion (z, with the continuity correction).

     z = (x̄ − μ₀)·√n / σ      t = (x̄ − μ₀)·√n / s   (gl = n − 1)
     z = (y′ − n·p₀) / √(n·p₀(1 − p₀)),  y′ = y ∓ 0.5

   The graph is the distribution of the statistic when H₀ is true: the
   rejection region (area α) and the p-value area beyond the observed
   statistic. Drag the statistic to see the decision change.
   Sources: Barbetta 8.4 to 8.8 · Bussab & Morettin 12
   ============================================================ */
function testPage(cfg){
  const mean = cfg.mode === "mean", K = k => t(`${cfg.key}.${k}`);
  return function TestPage(root){
    const S = cfg.state;

    /* ---------- maths ---------- */
    function compute(st = S){
      const n = st.n, usesT = mean && st.method === "t", df = usesT ? n - 1 : null, a = st.alpha / 100;
      if (!(n >= 2) || !Number.isInteger(n)) return { err: "ci.err.n" };
      if (!(a > 0 && a < 0.5)) return { err: "test.err.alpha" };
      let stat, yAdj, pHat, conds;
      if (mean){
        if (!(st.sd > 0)) return { err: "ci.err.sd" };
        stat = (st.xbar - st.mu0) * Math.sqrt(n) / st.sd;
      } else {
        if (!(st.y >= 0 && st.y <= n && Number.isInteger(st.y))) return { err: "ci.err.y" };
        if (!(st.p0 > 0 && st.p0 < 1)) return { err: "test.err.p0" };
        const np = n * st.p0;
        yAdj = !st.cc || st.y === np ? st.y : st.y > np ? st.y - 0.5 : st.y + 0.5;
        stat = (yAdj - np) / Math.sqrt(np * (1 - st.p0));
        pHat = st.y / n; conds = [np, n * (1 - st.p0)];
      }
      const table = st.zTable && !usesT;
      const s = table ? Math.round(stat * 100) / 100 : stat;
      const upper = v => usesT ? 1 - Num.tCdf(v, df) : 1 - Num.Phi(v);
      let tail = upper(Math.abs(s)); if (table) tail = Math.round(tail * 1e4) / 1e4;
      const p = st.h1 === "ne" ? Math.min(1, 2 * tail) : (st.h1 === "gt" ? s >= 0 : s <= 0) ? tail : 1 - tail;
      const q = st.h1 === "ne" ? 1 - a / 2 : 1 - a;
      let crit = usesT ? Num.tInv(q, df) : Num.PhiInv(q); if (st.zTable) crit = +crit.toFixed(3);
      const reject = p < a;
      return { n, usesT, df, a, stat, s, table, tail, p, crit, reject, yAdj, pHat, conds, small: conds && (conds[0] <= 5 || conds[1] <= 5) };
    }

    /* ---------- symbols ---------- */
    const P_ = mean ? M.i("μ") : M.i("p"), p0 = mean ? M.sub(M.i("μ"), M.n(0)) : M.sub(M.i("p"), M.n(0));
    const sSym = R => M.i(R.usesT ? "t" : "z"), cSym = R => M.sub(M.i(R.usesT ? "t" : "z"), M.i("c"));
    const relSym = { ne: "≠", gt: ">", lt: "<" };
    const H = (k, rel) => M.row(M.sub(M.i("H"), M.n(k)), M.o(":"), P_, M.o(rel), M.v(trim(mean ? S.mu0 : S.p0, 6)));
    const decision = R => R.reject ? t("test.reject") : t("test.accept");

    /* ---------- examples ---------- */
    const exState = e => ({ ...S, zTable: true, cc: true, ...e.set });
    const exList = () => cfg.examples.map(e => {
      const st = exState(e), R = compute(st);
      return { id: e.id, title: K("ex." + e.id), source: typeof e.source === "function" ? e.source() : e.source,
        answer: `<math>${sSym(R)}<mo>=</mo>${M.n(trim(R.s, R.table ? 2 : 3))}<mo separator="true">;</mo><mspace width="0.4em"></mspace><mi>p</mi><mo>=</mo>${M.prob(R.p)}</math> · ${decision(R)}` };
    });
    function loadExample(id){
      const e = cfg.examples.find(x => x.id === id); if (!e) return;
      Object.assign(S, exState(e), { example: id }); update(); fit();
    }

    /* ---------- markup ---------- */
    const sym = s => `<span class="sym">${s}</span>`;
    const fields = mean
      ? [["mu0", `<math>${p0}</math>`, K("mu0"), 0.1], ["xbar", `<math>${M.bar("x")}</math>`, t("ci-mean.xbar"), 0.1], ["sd", `<span id="sdSym"></span>`, `<span id="sdLbl"></span>`, 0.1], ["n", "<math><mi>n</mi></math>", t("ci.n"), 1]]
      : [["p0", `<math>${p0}</math>`, K("p0"), 0.01], ["n", "<math><mi>n</mi></math>", t("ci.n"), 1], ["y", "<math><mi>y</mi></math>", t("ci-prop.y"), 1]];
    root.innerHTML = `
    <div class="page test-page">
      <header class="page-head"><h1>${K("title")}</h1></header>
      <section class="work">
        <div class="plot-col">
          <div class="plot-bar"><span class="plot-title" id="graphTitle"></span>
            <div class="bar-actions"><button class="btn" id="fitBtn" title="${t("fitTitle")}">${t("fitView")}</button></div></div>
          <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${K("title")}"></canvas></div>
          <div class="legend"><div class="chips"><span class="chip rej"><span class="sw"></span>${t("test.lgReject")}</span><span class="chip pval"><span class="sw"></span>${t("test.lgP")}</span></div><span class="hint">${t("test.hint")}</span></div>
        </div>
        <aside class="controls" aria-label="${t("controls")}">
          <div class="group">
            <h2>${t("test.h1")}</h2>
            <div class="seg full" role="group" id="h1Seg">${["lt", "ne", "gt"].map(h => `<button data-h="${h}" aria-pressed="false"><math>${P_}<mo>${relSym[h]}</mo>${p0}</math></button>`).join("")}</div>
            <p class="note seg-note" id="h1Note"></p>
          </div>
          ${mean ? `<div class="group">
            <h2>${t("ci-mean.method")}</h2>
            <div class="seg full" role="group" id="methodSeg">
              <button data-m="z" aria-pressed="false">${t("test.method.z")}</button>
              <button data-m="t" aria-pressed="false">${t("test.method.t")}</button>
            </div>
          </div>` : ""}
          <div class="group">
            <h2>${t("test.data")}</h2>
            ${fields.map(([k, s, l, st]) => `<div class="param"><label for="f-${k}">${sym(s)}${l}</label>${numInput("f-" + k, st)}</div>`).join("")}
            ${mean ? "" : `<label class="check"><input type="checkbox" id="cc">${K("cc")}</label>`}
            <p class="note err" id="err" hidden></p>
            <p class="note warn" id="warn" hidden></p>
          </div>
          <div class="group">
            <h2>${t("test.alpha")}</h2>
            <div class="param"><label for="f-alpha">${sym("α")}${t("test.alphaLbl")} <span class="unit">(%)</span></label>${numInput("f-alpha", 1)}</div>
            <div class="presets" role="group">${[1, 5, 10].map(v => `<button class="btn" data-alpha="${v}" aria-pressed="false">${v}%</button>`).join("")}</div>
            <label class="check"><input type="checkbox" id="zTable"><span id="tableLbl"></span></label>
          </div>
          <div class="group result" aria-live="polite">
            <div class="p-big test-big" id="big"></div>
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
      ${sectionsHtml({ about: K("about"), notes: [...cfg.notes.map(K), t("test.note.accept")], sources: cfg.sources.map(K) })}
    </div>`;
    const el = id => $("#" + id, root);
    let R = compute();

    /* ---------- render ---------- */
    function renderFormulas(){
      // values from the controls in blue, results in bold
      const n4 = v => M.n(trim(v, 4)), num = v => M.v(trim(v, 6)), r4 = v => M.r(trim(v, 4)), sq = v => M.sqrt(v), rows = [];
      rows.push({ label: t("test.f.hyp"), html: M.math(M.row(H(0, "="), M.t(""), H(1, relSym[S.h1]))) });
      if (mean){
        const sd = M.i(R.usesT ? "s" : "σ");
        rows.push({ label: t("test.f.stat"), chain: [sSym(R),
          M.frac(M.row(M.paren(M.row(M.bar("x"), M.o(MINUS), p0)), M.o("·"), sq(M.i("n"))), sd),
          M.frac(M.row(M.paren(M.row(num(S.xbar), M.o(MINUS), nv(S.mu0))), M.o("·"), sq(num(S.n))), num(S.sd)),
          R.table ? n4(R.stat) : r4(R.stat), ...(R.table ? [`<mo>≈</mo>${M.r(trim(R.s, 2))}`] : [])] });
      } else {
        const np = S.n * S.p0;
        rows.push({ label: K("f.sample"), html: M.math(M.row(M.i("p̂"), M.o("="), M.frac(M.i("y"), M.i("n")), M.o("="), M.frac(num(S.y), num(S.n)), M.o("="), r4(R.pHat))) +
          M.math(M.row(M.i("n"), M.sub(M.i("p"), M.n(0)), M.o("="), n4(np), M.o(","), M.t(""), M.i("n"), M.paren(M.row(M.n(1), M.o(MINUS), M.sub(M.i("p"), M.n(0)))), M.o("="), n4(S.n - np)), "res") });
        if (S.cc && R.yAdj !== S.y) rows.push({ label: K("f.cc"), chain: [M.i("y′"), M.row(M.i("y"), M.o(R.yAdj < S.y ? MINUS : "+"), M.n("0.5")), M.row(num(S.y), M.o(R.yAdj < S.y ? MINUS : "+"), M.n("0.5")), M.r(trim(R.yAdj, 6))] });
        const yy = S.cc ? M.i("y′") : M.i("y");
        rows.push({ label: t("test.f.stat"), chain: [M.i("z"),
          M.frac(M.row(yy, M.o(MINUS), M.i("n"), M.sub(M.i("p"), M.n(0))), sq(M.row(M.i("n"), M.sub(M.i("p"), M.n(0)), M.paren(M.row(M.n(1), M.o(MINUS), M.sub(M.i("p"), M.n(0))))))),
          M.frac(M.row(num(R.yAdj), M.o(MINUS), num(S.n), M.o("·"), num(S.p0)), sq(M.row(num(S.n), M.o("·"), num(S.p0), M.o("·"), M.v(trim(1 - S.p0, 4))))),
          R.table ? n4(R.stat) : r4(R.stat), ...(R.table ? [`<mo>≈</mo>${M.r(trim(R.s, 2))}`] : [])] });
      }
      // p-value
      const Z = R.usesT ? M.i("T") : M.i("Z"), absS = M.v(trim(Math.abs(R.s), R.table ? 2 : 4));
      const tailP = M.row(M.i("P"), M.paren(M.row(Z, M.o(">"), absS)));
      const pChain = S.h1 === "ne" ? [M.i("p"), M.row(M.n(2), M.o("·"), tailP), M.row(M.n(2), M.o("·"), n4(R.tail)), M.rprob(R.p)]
        : [M.i("p"), M.row(M.i("P"), M.paren(M.row(Z, M.o(S.h1 === "gt" ? ">" : "<"), M.v(trim(R.s, R.table ? 2 : 4))))), M.rprob(R.p)];
      rows.push({ label: t("test.f.p"), html: M.math(M.row(pChain.join(M.o("=")))) +
        M.math(M.row(M.i("p"), M.o(R.reject ? "<" : "≥"), M.i("α"), M.o("="), M.v(trim(R.a, 4)), M.o("⇒"), M.text(decision(R))), "res") });
      const critM = S.h1 === "ne" ? M.row(M.o("±"), M.r(trim(R.crit, 3))) : M.r(trim(S.h1 === "lt" ? -R.crit : R.crit, 3));
      rows.push({ label: t("test.f.crit"), html: M.math(M.row(cSym(R), M.o("="), critM, ...(R.usesT ? [M.t(`(${t("dfAbbr")} = ${R.df})`)] : []))) +
        `<p class="fnote">${R.reject ? t("test.inReject") : t("test.inAccept")}</p>` });
      const box = el("frows");
      box.innerHTML = rows.map((r, i) => `<div class="frow"><span class="flabel">${r.label}</span><div class="fmath" data-row="${i}">${r.chain ? M.math(M.row(r.chain.join(M.o("=")).replace(/<mo>=<\/mo><mo>≈<\/mo>/g, "<mo>≈</mo>"))) : r.html}</div></div>`).join("");
      rows.forEach((r, i) => { if (!r.chain) return; const f = $(`[data-row="${i}"]`, box); if (f.scrollWidth > f.clientWidth + 2) f.innerHTML = M.chain(r.chain, 2).replace(/<mo>=<\/mo><mo>≈<\/mo>/g, "<mo>≈</mo>"); });
      const vars = [[sSym(R), R.usesT ? t("test.sym.t") : t("test.sym.z"), show(trim(R.s, R.table ? 2 : 4))], [p0, K("sym.h0"), show(trim(mean ? S.mu0 : S.p0, 6))]];
      if (mean) vars.push([M.bar("x"), t("ci-mean.sym.est"), show(trim(S.xbar, 6))], R.usesT ? [M.i("s"), t("ci-mean.sym.s"), show(trim(S.sd, 6))] : [M.i("σ"), t("ci-mean.sym.sigma"), show(trim(S.sd, 6))]);
      else vars.push([M.i("y"), t("ci-prop.sym.y"), String(S.y)], [M.i("p̂"), t("ci-prop.sym.est"), show(trim(R.pHat, 4))]);
      vars.push([M.i("n"), t("ci.sym.n"), String(S.n)], [M.i("α"), t("test.sym.alpha"), show(trim(R.a, 4))], [M.i("p"), t("test.sym.p"), show(trim(R.p, 4))],
        [cSym(R), t("test.sym.crit"), show(trim(R.crit, 3))]);
      if (R.usesT) vars.push([M.text(t("dfAbbr")), t("ss.sym.df"), String(R.df)]);
      el("vars").innerHTML = varsTableHtml(vars);
    }
    function renderResult(){
      el("big").textContent = decision(R);
      el("big").classList.toggle("rej", R.reject);
      el("sub").innerHTML = R.reject ? t("test.subReject", { a: show(trim(S.alpha, 2)) }) : t("test.subAccept", { a: show(trim(S.alpha, 2)) });
      el("facts").innerHTML = [[t("test.fact.stat", { s: R.usesT ? "t" : "z" }), show(trim(R.s, R.table ? 2 : 4))], [t("test.fact.p"), show(fmtProb(R.p))],
        [t("test.fact.crit"), (S.h1 === "ne" ? "± " : "") + show(trim(S.h1 === "lt" ? -R.crit : R.crit, 3))], ...(R.usesT ? [[t("ss.dfRow"), String(R.df)]] : [])]
        .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    }
    function renderR(){
      const L = [`# ${K("title")}`], alt = { ne: "two.sided", gt: "greater", lt: "less" }[S.h1];
      if (mean){
        L.push(rLine(`xbar <- ${trim(S.xbar, 6)}; mu0 <- ${trim(S.mu0, 6)}`, ""), rLine(`${R.usesT ? "s" : "sigma"} <- ${trim(S.sd, 6)}; n <- ${S.n}`, ""));
        L.push(rLine(`${R.usesT ? "t" : "z"} <- (xbar - mu0) * sqrt(n) / ${R.usesT ? "s" : "sigma"}`, `${t("test.f.stat")}: ${trim(R.stat, 4)}`, 40));
        const tailF = v => R.usesT ? `pt(${v}, df = n - 1${S.h1 === "gt" || (S.h1 === "ne") ? ", lower.tail = FALSE" : ""})` : `pnorm(${v}${S.h1 === "gt" || S.h1 === "ne" ? ", lower.tail = FALSE" : ""})`;
        const v = R.usesT ? "t" : "z";
        L.push(rLine(S.h1 === "ne" ? `2 * ${tailF(`abs(${v})`)}` : tailF(v), `p: ${fmtProb(R.p)}`, 40));
        if (R.usesT) L.push(`# ${t("test.r.ttest", { alt })}`);
      } else {
        L.push(rLine(`y <- ${S.y}; n <- ${S.n}; p0 <- ${trim(S.p0, 6)}`, ""));
        L.push(rLine(`prop.test(y, n, p = p0, alternative = "${alt}", correct = ${S.cc ? "TRUE" : "FALSE"})`, `p: ${fmtProb(R.p)}`, 40));
        L.push(`# ${t("test.r.prop")}`);
      }
      el("rcode").innerHTML = codeHtml(L.join("\n"));
    }
    function syncInputs(skip){
      const set = (id, v, d = 6) => { const i = el(id); if (i && i !== skip) i.value = fmtIn(v, d); };
      if (mean){ set("f-mu0", S.mu0); set("f-xbar", S.xbar); set("f-sd", S.sd); }
      else { set("f-p0", S.p0); set("f-y", S.y, 0); el("cc").checked = S.cc; }
      set("f-n", S.n, 0); set("f-alpha", S.alpha, 2);
      el("zTable").checked = S.zTable;
      el("tableLbl").textContent = mean && S.method === "t" ? t("test.tableT") : t("test.tableZ");
      $$(".presets .btn", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.alpha === S.alpha));
      $$("#h1Seg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.h === S.h1));
      el("h1Note").textContent = t("test.h1." + S.h1);
      if (mean){
        $$("#methodSeg button", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.m === S.method));
        el("sdSym").textContent = S.method === "t" ? "s" : "σ";
        el("sdLbl").textContent = S.method === "t" ? t("ci-mean.sdS") : t("ci-mean.sdSigma");
      }
      el("graphTitle").textContent = mean && S.method === "t" ? t("test.graphT") : t("test.graphZ");
    }
    function update(skip){
      R = compute(); syncInputs(skip);
      el("err").hidden = !R.err; if (R.err){ el("err").textContent = t(R.err); plot.draw(); return; }
      const w = el("warn"); w.hidden = !R.small;
      if (R.small) w.textContent = t("test.small");
      renderFormulas(); renderResult(); renderR();
      markExample(el("examples"), S.example);
      plot.draw();
    }

    /* ---------- graph ---------- */
    const dens = x => R.usesT ? Num.tPdf(x, R.df) : Num.normPdf(x);
    function fit(){
      if (R.err) return;
      const m = Math.max(4, Math.abs(R.s) + 0.8, R.crit + 0.8);
      plot.x0 = -m; plot.x1 = m; plot.draw();
    }
    function drawPlot(p){
      const C = p.colors(), c = p.ctx, danger = cssVar("--danger");
      if (R.err){ p.grid(C); return; }
      p.y0 = 0; p.y1 = dens(0) * 1.32;
      p.grid(C, { yFmt: () => "" });
      // rejection region(s)
      const regs = S.h1 === "ne" ? [[-Infinity, -R.crit], [R.crit, Infinity]] : S.h1 === "gt" ? [[R.crit, Infinity]] : [[-Infinity, -R.crit]];
      c.save(); c.globalAlpha = .28;
      for (const [u, v] of regs) p.area(dens, Math.max(u, p.x0), Math.min(v, p.x1), danger);
      c.restore();
      // p-value area beyond the observed statistic
      const s = R.s, a = Math.abs(s);
      const pregs = S.h1 === "ne" ? [[-Infinity, -a], [a, Infinity]] : S.h1 === "gt" ? [[s, Infinity]] : [[-Infinity, s]];
      for (const [u, v] of pregs) p.area(dens, Math.max(u, p.x0), Math.min(v, p.x1), C.fill);
      p.curve(dens, { color: C.ink, width: 1.8 });
      for (const [u, v] of regs){ const x = isFinite(u) ? u : v; p.vline(x, danger, [4, 3], dens(x) * 1.6, 1.3); }
      // region names, as in the book's figures
      c.font = `11.5px ${C.font}`; c.textBaseline = "top";
      const yT = p.pad.t + 6, acc = S.h1 === "ne" ? 0 : S.h1 === "gt" ? (p.x0 + R.crit) / 2 : (p.x1 - R.crit) / 2;
      c.fillStyle = C.muted; c.textAlign = "center"; c.fillText(t("test.accRegion"), p.X(acc), yT);
      c.fillStyle = danger;
      c.textAlign = "center";
      for (const [u, v] of regs) c.fillText(t("test.rejRegion"), p.X(isFinite(u) ? u + 0.9 : v - 0.9), yT + 16);
      // critical values
      for (const [u, v] of regs){
        const x = isFinite(u) ? u : v; c.fillStyle = danger; c.textAlign = isFinite(u) ? "left" : "right"; c.textBaseline = "bottom"; c.font = `11px ${C.font}`;
        c.fillText(`${R.usesT ? "t" : "z"}c = ${show(trim(x, 3))}`, p.X(x) + (isFinite(u) ? 4 : -4), p.Y(dens(x) * 1.6) - 2);
      }
      // observed statistic
      p.marker(s, dens(s), `${R.usesT ? "t" : "z"} = ${show(trim(s, R.table ? 2 : 3))}`, C, 0);
    }
    const plot = new Plot(el("plot"), {
      draw: drawPlot,
      handles: () => R.err ? [] : [{ key: "s", x: R.s }],
      onFit: fit,
      onHandle(key, x){
        S.example = null;
        if (mean){
          const step = Num.niceStep(Math.abs(S.sd / Math.sqrt(S.n)) * 8, 200), d = Num.decimalsFor(step);
          S.xbar = +(S.mu0 + x * S.sd / Math.sqrt(S.n)).toFixed(Math.max(d, 0));
        } else {
          const np = S.n * S.p0, sd = Math.sqrt(np * (1 - S.p0));
          let y = np + x * sd; if (S.cc) y += x > 0 ? 0.5 : -0.5;
          S.y = clamp(Math.round(y), 0, S.n);
        }
        update();
      },
    });

    /* ---------- events ---------- */
    bindNudge(root); bindCopy($(".sections", root));
    const field = (id, key, ok, int = false) => {
      const inp = el(id); if (!inp) return;
      inp.addEventListener("input", () => {
        const v = parseNum(inp.value), good = v != null && (!int || Number.isInteger(v)) && ok(v);
        inp.setAttribute("aria-invalid", !good);
        if (good){ S[key] = v; S.example = null; update(inp); }
      });
      inp.addEventListener("change", () => { inp.removeAttribute("aria-invalid"); update(); fit(); });
    };
    if (mean){ field("f-mu0", "mu0", () => true); field("f-xbar", "xbar", () => true); field("f-sd", "sd", v => v > 0); }
    else { field("f-p0", "p0", v => v > 0 && v < 1); field("f-y", "y", v => v >= 0, true); el("cc").addEventListener("change", e => { S.cc = e.target.checked; S.example = null; update(); }); }
    field("f-n", "n", v => v >= 2, true); field("f-alpha", "alpha", v => v > 0 && v < 50);
    $$(".presets .btn", root).forEach(b => b.addEventListener("click", () => { S.alpha = +b.dataset.alpha; S.example = null; update(); }));
    $$("#h1Seg button", root).forEach(b => b.addEventListener("click", () => { S.h1 = b.dataset.h; S.example = null; update(); }));
    if (mean) $$("#methodSeg button", root).forEach(b => b.addEventListener("click", () => { S.method = b.dataset.m; S.example = null; update(); fit(); }));
    el("zTable").addEventListener("change", e => { S.zTable = e.target.checked; S.example = null; update(); });
    el("fitBtn").addEventListener("click", fit);
    el("examples").innerHTML = examplesHtml(exList(), S.example);
    el("examples").addEventListener("click", e => { const b = e.target.closest("[data-ex]"); if (b) loadExample(b.dataset.ex); });
    const onTheme = () => plot.draw();
    document.addEventListener("themechange", onTheme);
    update(); fit();
    return () => { plot.destroy(); document.removeEventListener("themechange", onTheme); };
  };
}
