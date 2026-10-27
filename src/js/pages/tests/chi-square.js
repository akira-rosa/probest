"use strict";
/* ============================================================
   Page: Chi-square test of independence
     Eᵢⱼ = (total of row i)·(total of column j) / n
     Q² = Σᵢ Σⱼ (Oᵢⱼ − Eᵢⱼ)² / Eᵢⱼ        gl = (L − 1)(C − 1)
   2 × 2 tables may use Yates' correction (|Oᵢⱼ − Eᵢⱼ| − 0.5)².
   Sources: Barbetta 10.2 (eq. 10.4 to 10.7, Ex. 10.5) · Bussab & Morettin 14
   ============================================================ */
PAGES["chi-square"] = function ChiSquarePage(root){
  const S = ChiSquarePage.state || (ChiSquarePage.state = {
    O: [[500, 4500, 1500], [30, 270, 50]], rows: ["@chi.n.in", "@chi.n.out"], cols: ["B", "C", "UHT"],
    alpha: 5, yates: false, sel: [1, 2], example: "milk"
  });
  const MAXR = 6, MAXC = 6;
  const nm = s => String(s).startsWith("@") ? t(s.slice(1)) : s;

  /* ---------- maths ---------- */
  function compute(st = S){
    const O = st.O, L = O.length, Cn = O[0].length;
    if (O.some(r => r.some(v => !(v >= 0) || !Number.isInteger(v)))) return { err: "chi.err.counts" };
    const rt = O.map(r => r.reduce((a, b) => a + b, 0)), ct = O[0].map((_, j) => O.reduce((a, r) => a + r[j], 0));
    const n = rt.reduce((a, b) => a + b, 0);
    if (rt.some(v => v === 0) || ct.some(v => v === 0)) return { err: "chi.err.zero" };
    const yates = st.yates && L === 2 && Cn === 2;
    const E = O.map((r, i) => r.map((_, j) => rt[i] * ct[j] / n));
    const terms = O.map((r, i) => r.map((o, j) => { const d = yates ? Math.max(0, Math.abs(o - E[i][j]) - 0.5) : o - E[i][j]; return d * d / E[i][j]; }));
    const q = terms.flat().reduce((a, b) => a + b, 0), df = (L - 1) * (Cn - 1), a = st.alpha / 100;
    const crit = Num.chiInv(1 - a, df), p = 1 - Num.chiCdf(q, df);
    return { L, Cn, rt, ct, n, E, terms, q, df, a, crit, p, reject: q > crit, yates, minE: Math.min(...E.flat()) };
  }

  /* ---------- examples ---------- */
  const EXAMPLES = [
    { id: "milk", O: [[500, 4500, 1500], [30, 270, 50]], rows: ["@chi.n.in", "@chi.n.out"], cols: ["B", "C", "UHT"], alpha: 5, source: "Barbetta · Ex. 10.5" },
    { id: "courses", O: [[44, 26, 35], [11, 26, 15]], rows: ["@chi.n.pass", "@chi.n.fail"], cols: ["@chi.n.civil", "@chi.n.chem", "@chi.n.mech"], alpha: 5, source: () => `Barbetta · ${t("exercise")} 10.6` },
    { id: "shifts", O: [[432, 456, 424], [185, 190, 180], [45, 48, 39]], rows: ["@chi.n.ok", "@chi.n.rework", "@chi.n.reject"], cols: ["@chi.n.morning", "@chi.n.afternoon", "@chi.n.night"], alpha: 1, source: () => `Barbetta · ${t("exercise")} 10.7` },
    { id: "clients", O: [[485, 10, 5], [768, 24, 8], [624, 20, 6], [522, 40, 18], [650, 3, 17]], rows: ["1", "2", "3", "4", "5"], cols: ["@chi.n.complete", "@chi.n.usable", "@chi.n.unusable"], alpha: 2.5, source: () => `Barbetta · ${t("exercise")} 10.8` },
  ];
  const Q2 = M.sup(M.i("Q"), M.n(2));
  const exList = () => EXAMPLES.map(e => {
    const R = compute({ O: e.O, alpha: e.alpha, yates: false });
    return { id: e.id, title: t("chi.ex." + e.id), source: typeof e.source === "function" ? e.source() : e.source,
      answer: `<math>${M.sup(M.i("q"), M.n(2))}<mo>=</mo>${M.n(trim(R.q, 2))}<mo separator="true">;</mo><mspace width="0.4em"></mspace><mi>p</mi><mo>=</mo>${M.prob(R.p)}</math> · ${R.reject ? t("test.reject") : t("test.accept")}` };
  });
  function loadExample(id){
    const e = EXAMPLES.find(x => x.id === id); if (!e) return;
    Object.assign(S, { O: e.O.map(r => [...r]), rows: [...e.rows], cols: [...e.cols], alpha: e.alpha, yates: false, sel: [0, 0], example: id });
    buildTable(); update(); fit();
  }

  /* ---------- markup ---------- */
  root.innerHTML = `
  <div class="page chi-page">
    <header class="page-head"><h1>${t("chi.title")}</h1></header>
    <section class="work">
      <div class="plot-col">
        <div class="plot-bar"><span class="plot-title" id="graphTitle"></span>
          <div class="bar-actions"><button class="btn" id="fitBtn" title="${t("fitTitle")}">${t("fitView")}</button></div></div>
        <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${t("chi.title")}"></canvas></div>
        <div class="legend"><div class="chips"><span class="chip rej"><span class="sw"></span>${t("test.lgReject")}</span><span class="chip pval"><span class="sw"></span>${t("test.lgP")}</span></div></div>
      </div>
      <aside class="controls" aria-label="${t("controls")}">
        <div class="group">
          <h2>${t("chi.size")}</h2>
          <div class="size-row">
            <span>${t("chi.rows")}</span><button class="btn sq" data-dim="r-">−</button><b id="nRows"></b><button class="btn sq" data-dim="r+">+</button>
            <span>${t("chi.cols")}</span><button class="btn sq" data-dim="c-">−</button><b id="nCols"></b><button class="btn sq" data-dim="c+">+</button>
          </div>
          <label class="check check-top" id="yatesRow"><input type="checkbox" id="yates">${t("chi.yates")}</label>
          <p class="note err" id="err" hidden></p>
          <p class="note warn" id="warn" hidden></p>
        </div>
        <div class="group">
          <h2>${t("test.alpha")}</h2>
          <div class="param"><label for="f-alpha"><span class="sym">α</span>${t("test.alphaLbl")} <span class="unit">(%)</span></label>${numInput("f-alpha", 1)}</div>
          <div class="presets" role="group">${[1, 5, 10].map(v => `<button class="btn" data-alpha="${v}" aria-pressed="false">${v}%</button>`).join("")}</div>
        </div>
        <div class="group result" aria-live="polite">
          <div class="p-big test-big" id="big"></div>
          <div class="p-sub" id="sub"></div>
          <dl class="facts" id="facts"></dl>
        </div>
      </aside>
    </section>
    <section class="formulas ctable-card" aria-label="${t("chi.table")}">
      <div class="card-head"><h2>${t("chi.table")}</h2><span class="hint">${t("chi.tableHint")}</span></div>
      <div class="ctable-wrap"><table class="ctable" id="ctable"></table></div>
    </section>
    <section class="formulas" aria-label="${t("formulas")}">
      ${formulasHead()}
      <div id="frows"></div>
      <div id="vars"></div>
    </section>
    ${sectionsHtml({ about: t("chi.about"), notes: ["note.expected", "note.min", "note.yates", "note.large"].map(k => t("chi." + k)), sources: ["src.barbetta", "src.bussab"].map(k => t("chi." + k)) })}
  </div>`;
  const el = id => $("#" + id, root);
  let R = compute();

  /* ---------- contingency table ---------- */
  function buildTable(){
    const L = S.O.length, Cn = S.O[0].length;
    el("ctable").innerHTML = `
      <thead><tr><th></th>${S.cols.map((c, j) => `<th><input class="nm" data-col="${j}" value="${esc(nm(c))}" aria-label="${t("chi.colName")}"></th>`).join("")}<th class="tot">${t("chi.total")}</th></tr></thead>
      <tbody>${S.O.map((r, i) => `<tr><th><input class="nm" data-row="${i}" value="${esc(nm(S.rows[i]))}" aria-label="${t("chi.rowName")}"></th>
        ${r.map((v, j) => `<td class="cell" data-i="${i}" data-j="${j}"><input class="num cnt" inputmode="numeric" data-i="${i}" data-j="${j}" value="${v}" aria-label="O${i + 1}${j + 1}"><span class="exp"></span><span class="ctr"></span></td>`).join("")}
        <td class="tot" data-rt="${i}"></td></tr>`).join("")}</tbody>
      <tfoot><tr><th>${t("chi.total")}</th>${S.O[0].map((_, j) => `<td class="tot" data-ct="${j}"></td>`).join("")}<td class="tot" id="grand"></td></tr></tfoot>`;
    $$("#ctable .cnt", root).forEach(inp => {
      inp.addEventListener("input", () => {
        const v = parseNum(inp.value), ok = v != null && v >= 0 && Number.isInteger(v);
        inp.setAttribute("aria-invalid", !ok);
        if (ok){ S.O[+inp.dataset.i][+inp.dataset.j] = v; S.example = null; update(); }
      });
      inp.addEventListener("focus", () => { S.sel = [+inp.dataset.i, +inp.dataset.j]; update(); });
    });
    $$("#ctable .nm", root).forEach(inp => inp.addEventListener("input", () => {
      if (inp.dataset.col != null) S.cols[+inp.dataset.col] = inp.value; else S.rows[+inp.dataset.row] = inp.value;
      S.example = null; renderR();
    }));
    el("nRows").textContent = L; el("nCols").textContent = Cn;
  }
  function fillTable(){
    const L = S.O.length;
    $$("#ctable td.cell", root).forEach(td => {
      const i = +td.dataset.i, j = +td.dataset.j, on = S.sel[0] === i && S.sel[1] === j;
      td.classList.toggle("sel", on);
      if (R.err){ $(".exp", td).textContent = ""; $(".ctr", td).textContent = ""; td.style.removeProperty("--heat"); return; }
      $(".exp", td).textContent = `E = ${show(trim(R.E[i][j], 3))}`;
      $(".ctr", td).textContent = show(trim(R.terms[i][j], 3));
      td.style.setProperty("--heat", Math.min(1, R.terms[i][j] / Math.max(...R.terms.flat(), 1e-9)).toFixed(3));
      td.classList.toggle("low", R.E[i][j] < 5);
    });
    if (!R.err){
      $$("#ctable [data-rt]", root).forEach(td => { td.textContent = fmtInt(R.rt[+td.dataset.rt]); });
      $$("#ctable [data-ct]", root).forEach(td => { td.textContent = fmtInt(R.ct[+td.dataset.ct]); });
      el("grand").textContent = fmtInt(R.n);
    }
  }

  /* ---------- render ---------- */
  function renderFormulas(){
    const [i, j] = S.sel, n3 = v => M.v(trim(v, 3)), r3 = v => M.r(trim(v, 3)), vs = v => M.v(String(v)),   // values blue, results bold
      sub = (s, a, b) => M.sub(M.i(s), M.row(M.n(String(a)), M.n(String(b))));
    const rows = [];
    rows.push({ label: t("test.f.hyp"), html: `<p class="fhyp"><b>H<sub>0</sub>:</b> ${t("chi.h0")}<br><b>H<sub>1</sub>:</b> ${t("chi.h1")}</p>` });
    rows.push({ label: t("chi.f.E", { c: `${nm(S.rows[i])} · ${nm(S.cols[j])}` }), chain: [sub("E", i + 1, j + 1),
      M.frac(M.row(M.text(t("chi.rowTot")), M.o("×"), M.text(t("chi.colTot"))), M.i("n")),
      M.frac(M.row(vs(R.rt[i]), M.o("·"), vs(R.ct[j])), vs(R.n)), r3(R.E[i][j])] });
    const term = (o, e) => R.yates
      ? M.frac(M.sup(M.paren(M.row(`<mo>|</mo>`, vs(o), M.o(MINUS), n3(e), `<mo>|</mo>`, M.o(MINUS), M.n("0.5"))), M.n(2)), n3(e))
      : M.frac(M.sup(M.paren(M.row(vs(o), M.o(MINUS), n3(e))), M.n(2)), n3(e));
    const gen = R.yates
      ? M.frac(M.sup(M.paren(M.row(`<mo>|</mo>`, sub("O", "i", "j"), M.o(MINUS), sub("E", "i", "j"), `<mo>|</mo>`, M.o(MINUS), M.n("0.5"))), M.n(2)), sub("E", "i", "j"))
      : M.frac(M.sup(M.paren(M.row(sub("O", "i", "j"), M.o(MINUS), sub("E", "i", "j"))), M.n(2)), sub("E", "i", "j"));
    const allTerms = R.terms.flat().map(v => n3(v));
    rows.push({ label: t("chi.f.cell"), chain: [M.row(M.text(t("chi.term")), M.paren(M.row(M.n(String(i + 1)), M.o(","), M.n(String(j + 1))))), term(S.O[i][j], R.E[i][j]), r3(R.terms[i][j])] });
    rows.push({ label: t("chi.f.Q"), chain: [M.sup(M.i("q"), M.n(2)), M.row(M.sum(M.row(M.i("i"), M.o("="), M.n(1)), M.i("L")), M.sum(M.row(M.i("j"), M.o("="), M.n(1)), M.i("C")), gen),
      sumTerms(allTerms, 6), r3(R.q)] });
    rows.push({ label: t("chi.f.df"), chain: [M.text(t("dfAbbr")), M.row(M.paren(M.row(M.i("L"), M.o(MINUS), M.n(1))), M.paren(M.row(M.i("C"), M.o(MINUS), M.n(1)))),
      M.row(M.paren(M.row(vs(R.L), M.o(MINUS), M.n(1))), M.paren(M.row(vs(R.Cn), M.o(MINUS), M.n(1)))), M.r(String(R.df))] });
    rows.push({ label: t("test.f.p"), html: M.math(M.row(M.i("p"), M.o("="), M.i("P"), M.paren(M.row(M.sup(M.i("χ"), M.n(2)), M.o(">"), n3(R.q))), M.o("="), M.rprob(R.p))) +
      M.math(M.row(M.sub(M.sup(M.i("χ"), M.n(2)), M.i("c")), M.o("="), r3(R.crit), M.t(";"), M.sup(M.i("q"), M.n(2)), M.o(R.reject ? ">" : "≤"), M.sub(M.sup(M.i("χ"), M.n(2)), M.i("c")), M.o("⇒"), M.text(R.reject ? t("test.reject") : t("test.accept"))), "res") });
    const box = el("frows");
    box.innerHTML = rows.map((r, k) => `<div class="frow"><span class="flabel">${r.label}</span><div class="fmath" data-row="${k}">${r.chain ? M.math(M.row(r.chain.join(M.o("=")))) : r.html}</div></div>`).join("");
    rows.forEach((r, k) => { if (!r.chain) return; const f = $(`[data-row="${k}"]`, box); if (f.scrollWidth > f.clientWidth + 2) f.innerHTML = M.chain(r.chain, 2); });
    el("vars").innerHTML = varsTableHtml([
      [M.sup(M.i("q"), M.n(2)), t("chi.sym.q"), show(trim(R.q, 3))],
      [sub("O", "i", "j"), t("chi.sym.O"), ""], [sub("E", "i", "j"), t("chi.sym.E"), ""],
      [M.i("n"), t("chi.sym.n"), fmtInt(R.n)], [M.i("L"), t("chi.sym.L"), String(R.L)], [M.i("C"), t("chi.sym.C"), String(R.Cn)],
      [M.text(t("dfAbbr")), t("chi.sym.df"), String(R.df)], [M.i("α"), t("test.sym.alpha"), show(trim(R.a, 4))],
      [M.sub(M.sup(M.i("χ"), M.n(2)), M.i("c")), t("chi.sym.crit"), show(trim(R.crit, 3))], [M.i("p"), t("test.sym.p"), show(fmtProb(R.p))],
    ]);
  }
  function renderR(){
    if (R.err) return;
    const v = S.O[0].map((_, j) => S.O.map(r => r[j])).flat();
    const dn = `list(c(${S.rows.map(s => JSON.stringify(nm(s))).join(", ")}), c(${S.cols.map(s => JSON.stringify(nm(s))).join(", ")}))`;
    const L = [`# ${t("chi.title")}`,
      `tab <- matrix(c(${v.join(", ")}), nrow = ${R.L},`, `              dimnames = ${dn})`,
      rLine(`chisq.test(tab, correct = ${R.yates ? "TRUE" : "FALSE"})`, `q² = ${trim(R.q, 3)}, ${t("dfAbbr")} = ${R.df}, p = ${fmtProb(R.p)}`, 40),
      rLine("chisq.test(tab)$expected", t("chi.r.expected"), 40),
      rLine(`qchisq(${trim(1 - R.a, 4)}, df = ${R.df})`, `${t("chi.r.crit")}: ${trim(R.crit, 3)}`, 40)];
    el("rcode").innerHTML = codeHtml(L.join("\n"));
  }
  function update(){
    R = compute();
    const fa = el("f-alpha"); if (fa !== document.activeElement) fa.value = fmtIn(S.alpha, 2);
    $$(".presets .btn", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.alpha === S.alpha));
    el("yates").checked = S.yates; el("yatesRow").hidden = !(S.O.length === 2 && S.O[0].length === 2);
    el("err").hidden = !R.err; fillTable();
    if (R.err){ el("err").textContent = t(R.err); plot.draw(); return; }
    el("warn").hidden = R.minE >= 5; el("warn").textContent = t("chi.lowE", { e: show(trim(R.minE, 2)) });
    el("graphTitle").textContent = t("chi.graph", { df: R.df });
    el("big").textContent = R.reject ? t("test.reject") : t("test.accept");
    el("big").classList.toggle("rej", R.reject);
    el("sub").innerHTML = R.reject ? t("chi.subReject", { a: show(trim(S.alpha, 2)) }) : t("chi.subAccept", { a: show(trim(S.alpha, 2)) });
    el("facts").innerHTML = [[`<math>${M.sup(M.i("q"), M.n(2))}</math>`, show(trim(R.q, 3))], [t("ss.dfRow"), String(R.df)],
      [`<math>${M.sub(M.sup(M.i("χ"), M.n(2)), M.i("c"))}</math>`, show(trim(R.crit, 3))], [t("test.fact.p"), show(fmtProb(R.p))],
      [t("chi.fact.minE"), show(trim(R.minE, 2))]].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    renderFormulas(); renderR();
    markExample(el("examples"), S.example);
    plot.draw();
  }

  /* ---------- graph ---------- */
  const dens = x => Num.chiPdf(x, R.df);
  function fit(){
    if (R.err) return;
    const m = Math.max(R.crit * 1.5, R.df + 4 * Math.sqrt(2 * R.df), Math.min(R.q * 1.12, R.crit * 6));
    plot.x0 = 0; plot.x1 = m; plot.draw();
  }
  function drawPlot(p){
    const C = p.colors(), c = p.ctx, danger = cssVar("--danger");
    if (R.err){ p.grid(C); return; }
    let top = 0; for (let k = 1; k <= 200; k++){ const x = p.x0 + (p.x1 - p.x0) * k / 200; if (x > 0.05) top = Math.max(top, dens(x)); }
    p.y0 = 0; p.y1 = Math.min(top, R.df <= 2 ? 0.55 : top) * 1.3;
    p.grid(C, { yFmt: () => "" });
    c.save(); c.globalAlpha = .28; p.area(dens, R.crit, p.x1, danger); c.restore();
    if (R.q < p.x1) p.area(dens, Math.max(R.q, 1e-9), p.x1, C.fill);
    p.curve(x => x <= 0 ? NaN : dens(x), { color: C.ink, width: 1.8 });
    p.vline(R.crit, danger, [4, 3], p.y1 * 0.7, 1.3);
    c.font = `11px ${C.font}`; c.fillStyle = danger; c.textAlign = "center"; c.textBaseline = "top";
    c.textAlign = "left"; c.textBaseline = "bottom";
    if (R.crit <= p.x1) c.fillText(`χ²c = ${show(trim(R.crit, 3))}`, p.X(R.crit) + 4, p.Y(p.y1 * 0.7) - 2);
    c.textAlign = "center"; c.textBaseline = "top";
    c.font = `11.5px ${C.font}`; c.fillStyle = C.muted; c.fillText(t("test.accRegion"), p.X(R.crit / 2), p.pad.t + 6);
    c.fillStyle = danger; c.textAlign = "left"; if (R.crit < p.x1) c.fillText(t("test.rejRegion"), p.X(R.crit) + 6, p.pad.t + 22);
    if (R.q <= p.x1) p.marker(R.q, Math.min(dens(R.q), p.y1), `q² = ${show(trim(R.q, 2))}`, C, 0);
    else p.pill(p.pad.l + p.pw - 60, 6, `q² = ${show(trim(R.q, 2))} →`, C, true);
  }
  const plot = new Plot(el("plot"), { draw: drawPlot, handles: () => [], onFit: fit });

  /* ---------- events ---------- */
  bindCopy($(".sections", root)); bindNudge($(".controls", root));
  $$("[data-dim]", root).forEach(b => b.addEventListener("click", () => {
    const d = b.dataset.dim, L = S.O.length, Cn = S.O[0].length;
    if (d === "r+" && L < MAXR){ S.O.push(Array(Cn).fill(10)); S.rows.push(`${t("chi.rowAbbr")}${L + 1}`); }
    if (d === "r-" && L > 2){ S.O.pop(); S.rows.pop(); }
    if (d === "c+" && Cn < MAXC){ S.O.forEach(r => r.push(10)); S.cols.push(`${t("chi.colAbbr")}${Cn + 1}`); }
    if (d === "c-" && Cn > 2){ S.O.forEach(r => r.pop()); S.cols.pop(); }
    S.sel = [Math.min(S.sel[0], S.O.length - 1), Math.min(S.sel[1], S.O[0].length - 1)];
    S.example = null; buildTable(); update(); fit();
  }));
  el("yates").addEventListener("change", e => { S.yates = e.target.checked; S.example = null; update(); });
  const fa = el("f-alpha");
  fa.addEventListener("input", () => { const v = parseNum(fa.value), ok = v != null && v > 0 && v < 50; fa.setAttribute("aria-invalid", !ok); if (ok){ S.alpha = v; S.example = null; update(); } });
  $$(".presets .btn", root).forEach(b => b.addEventListener("click", () => { S.alpha = +b.dataset.alpha; S.example = null; update(); }));
  el("fitBtn").addEventListener("click", fit);
  el("examples").innerHTML = examplesHtml(exList(), S.example);
  el("examples").addEventListener("click", e => { const b = e.target.closest("[data-ex]"); if (b) loadExample(b.dataset.ex); });
  const onTheme = () => plot.draw();
  document.addEventListener("themechange", onTheme);
  buildTable(); update(); fit();
  return () => { plot.destroy(); document.removeEventListener("themechange", onTheme); };
};
