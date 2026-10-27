"use strict";
/* ============================================================
   Page: Bayes' theorem
     P(F) = Σ P(Eᵢ)·P(F | Eᵢ)                 total probability
     P(Eⱼ | F) = P(Eⱼ)·P(F | Eⱼ) / P(F)        Bayes' theorem
   E₁ … Eₖ split the sample space (mutually exclusive and exhaustive).
   The mosaic draws each Eᵢ as a column as wide as P(Eᵢ), filled up to
   P(F | Eᵢ): the filled area is P(F), and the share of the chosen column
   in it is P(Eⱼ | F).
   Sources: Barbetta 4.4 and 4.5 (eq. 4.16, 4.17, Ex. 4.12) · Bussab & Morettin 5.4
   ============================================================ */
PAGES["bayes"] = function BayesPage(root){
  const S = BayesPage.state || (BayesPage.state = {
    rows: [["0.25", "0.1"], ["0.25", "0.1"], ["0.25", "0.2"], ["0.25", "0.4"]], target: 3, example: "suppliers"
  });
  const MAXK = 8;

  /* ---------- maths ---------- */
  function values(st = S){
    const p = st.rows.map(r => parseProb(r[0])), l = st.rows.map(r => parseProb(r[1]));
    if (p.some(v => v == null || v < 0 || v > 1) || l.some(v => v == null || v < 0 || v > 1)) return { err: "bayes.err.range" };
    const sum = p.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 1e-6) return { err: "bayes.err.sum", sum };
    const joint = p.map((v, i) => v * l[i]), PF = joint.reduce((a, b) => a + b, 0);
    if (PF <= 0) return { err: "bayes.err.zero" };
    const j = Math.min(st.target, p.length - 1);
    return { p, l, joint, PF, post: joint.map(v => v / PF), j, k: p.length, raw: st.rows };
  }

  /* ---------- examples ---------- */
  const EXAMPLES = [
    { id: "suppliers", rows: [["0.25", "0.1"], ["0.25", "0.1"], ["0.25", "0.2"], ["0.25", "0.4"]], target: 3, source: "Barbetta · Ex. 4.12" },
    { id: "assembler", rows: [["0.30", "0.10"], ["0.70", "0.05"]], target: 0, source: "slides" },
    { id: "clients", rows: [["0.10", "0.01"], ["0.15", "0.02"], ["0.15", "0.005"], ["0.40", "0.02"], ["0.20", "0.08"]], target: 4, source: () => `Barbetta · ${t("exercise")} 4.11` },
  ];
  const Ej = j => M.sub(M.i("E"), M.n(String(j + 1))), Ei = M.sub(M.i("E"), M.i("i")), F = M.i("F");
  const P = Ev.P, given = Ev.given;
  const exList = () => EXAMPLES.map(e => {
    const V = values({ rows: e.rows, target: e.target });
    return { id: e.id, title: t("bayes.ex." + e.id), source: typeof e.source === "function" ? e.source() : e.source === "slides" ? t("srcSlides") : e.source,
      answer: `<math>${P(given(Ej(e.target), F))}<mo>=</mo>${M.n(trim(V.post[e.target], 4))}</math>` };
  });
  function loadExample(id){
    const e = EXAMPLES.find(x => x.id === id); if (!e) return;
    S.rows = e.rows.map(r => [...r]); S.target = e.target; S.example = id;
    buildRows(); update();
  }

  /* ---------- markup ---------- */
  root.innerHTML = `
  <div class="page bayes-page">
    <header class="page-head"><h1>${t("bayes.title")}</h1></header>
    <section class="work">
      <div class="plot-col">
        <div class="plot-bar"><span class="plot-title">${t("bayes.diagram")}</span></div>
        <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${t("bayes.diagram")}"></canvas></div>
        <div class="legend"><span class="hint">${t("bayes.hint")}</span></div>
      </div>
      <aside class="controls" aria-label="${t("controls")}">
        <div class="group">
          <h2>${t("bayes.events")}</h2>
          <div class="ev-table" id="evTable"></div>
          <div class="data-actions"><button class="btn" id="addBtn">${t("bayes.add")}</button><button class="btn" id="eqBtn" title="${t("bayes.equalTitle")}">${t("bayes.equal")}</button></div>
          <p class="note">${t("venn.fracHint")}</p>
          <p class="note err" id="err" hidden></p>
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
      <div class="frow"><span class="flabel">${t("bayes.f.total")}</span><div class="fmath" id="fTotal"></div></div>
      <div class="frow"><span class="flabel">${t("bayes.f.bayes")}</span><div class="fmath" id="fBayes"></div></div>
      <div id="vars"></div>
    </section>
    ${sectionsHtml({ about: t("bayes.about"), notes: ["note.partition", "note.prior", "note.total", "note.click"].map(k => t("bayes." + k)), sources: ["src.barbetta", "src.bussab", "src.slides"].map(k => t("bayes." + k)) })}
  </div>`;
  const el = id => $("#" + id, root);
  let V = values();

  function buildRows(){
    el("evTable").innerHTML = `
      <span></span><span class="ev-h"><math>${P(Ei)}</math></span><span class="ev-h"><math>${P(given(F, Ei))}</math></span><span></span>
      ${S.rows.map((r, i) => `
        <button class="ev-name" data-target="${i}" aria-pressed="${i === S.target}" title="${t("bayes.pick")}"><math>${Ej(i)}</math></button>
        ${numInput("p" + i, 0.01, `data-i="${i}" data-c="0"`)}${numInput("l" + i, 0.01, `data-i="${i}" data-c="1"`)}
        <button class="ev-del" data-del="${i}" aria-label="${t("bayes.remove")}" ${S.rows.length <= 2 ? "disabled" : ""}>×</button>`).join("")}`;
    $$(".ev-table .num", root).forEach(inp => {
      inp.value = probIn(S.rows[+inp.dataset.i][+inp.dataset.c]);
      inp.addEventListener("input", () => {
        const v = parseProb(inp.value), ok = v != null && v >= 0 && v <= 1;
        inp.setAttribute("aria-invalid", !ok);
        if (ok){ S.rows[+inp.dataset.i][+inp.dataset.c] = inp.value.replace(",", ".").trim(); S.example = null; update(true); }
      });
    });
    el("addBtn").disabled = S.rows.length >= MAXK;
  }
  function syncRows(){
    $$(".ev-table .num", root).forEach(inp => { if (inp !== document.activeElement) inp.value = probIn(S.rows[+inp.dataset.i][+inp.dataset.c]); });
    $$(".ev-name", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.target === S.target));
  }

  /* ---------- render ---------- */
  function update(fromInput){
    V = values();
    if (!fromInput) syncRows(); else $$(".ev-name", root).forEach(b => b.setAttribute("aria-pressed", +b.dataset.target === S.target));
    el("err").hidden = !V.err;
    if (V.err){ el("err").textContent = t(V.err, { s: show(trim(V.sum ?? 0, 4)) }); board.draw(); return; }
    const n4 = v => M.n(trim(v, 4)), j = V.j;
    const terms = V.p.map((_, i) => M.row(probMath(V.raw[i][0], V.p[i]), M.o("·"), probMath(V.raw[i][1], V.l[i])));
    const total = [P(F), M.row(M.sum(M.row(M.i("i"), M.o("="), M.n(1)), M.i("k")), P(Ei), M.o("·"), P(given(F, Ei))), sumTerms(terms, 5), n4(V.PF)];
    const bayes = [P(given(Ej(j), F)), M.frac(M.row(P(Ej(j)), M.o("·"), P(given(F, Ej(j)))), P(F)), M.frac(terms[j], n4(V.PF)), n4(V.post[j])];
    for (const [id, chain] of [["fTotal", total], ["fBayes", bayes]]){
      const f = el(id); f.innerHTML = M.math(M.row(chain.join(M.o("="))));
      if (f.scrollWidth > f.clientWidth + 2) f.innerHTML = M.chain(chain, 2);
    }
    el("vars").innerHTML = varsTableHtml([
      [P(given(Ej(j), F)), t("bayes.sym.post"), pShow(V.post[j])],
      [P(Ej(j)), t("bayes.sym.prior"), pShow(V.p[j])],
      [P(given(F, Ej(j))), t("bayes.sym.lik"), pShow(V.l[j])],
      [P(F), t("bayes.sym.F"), pShow(V.PF)],
      [M.i("k"), t("bayes.sym.k"), String(V.k)],
    ]);
    el("big").textContent = pShow(V.post[j]);
    el("sub").innerHTML = `<math>${P(given(Ej(j), F))}</math>`;
    el("facts").innerHTML = [[`<math>${P(F)}</math>`, pShow(V.PF)], [`<math>${P(Ej(j))}</math> ${t("bayes.before")}`, pShow(V.p[j])],
      [`<math>${P(Ev.and(Ej(j), F))}</math>`, pShow(V.joint[j])],
      ...V.post.map((v, i) => i === j ? null : [`<math>${P(given(Ej(i), F))}</math>`, pShow(v)]).filter(Boolean)]
      .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    const L = [`# ${t("bayes.title")}`,
      rLine(`prior <- c(${V.raw.map(r => rProb(r[0])).join(", ")})`, "P(E_i)", 40),
      rLine(`lik <- c(${V.raw.map(r => rProb(r[1])).join(", ")})`, "P(F | E_i)", 40),
      rLine("pF <- sum(prior * lik)", `P(F): ${trim(V.PF, 4)}`, 40),
      rLine("post <- prior * lik / pF", "P(E_i | F)", 40),
      rLine(`post[${j + 1}]`, `P(E${j + 1} | F): ${trim(V.post[j], 4)}`, 40)];
    el("rcode").innerHTML = codeHtml(L.join("\n"));
    markExample(el("examples"), S.example);
    board.draw();
  }

  /* ---------- mosaic ---------- */
  let G = null;
  function geometry(b){
    const m = 14, barW = 64, gap = 46, top = 34, bottom = b.h - 46;
    const W = b.w - 2 * m - barW - gap, H = bottom - top;
    const xs = []; let x = m;
    for (const p of V.p){ xs.push(x); x += p * W; }
    return { m, top, bottom, W, H, xs, barX: m + W + gap, barW };
  }
  function draw(b){
    const C = b.colors(), c = b.ctx;
    if (V.err){ b.text(t(V.err, { s: show(trim(V.sum ?? 0, 4)) }), b.w / 2, b.h / 2, { color: C.faint }); G = null; return; }
    const g = G = geometry(b);
    b.text(t("bayes.omega"), g.m, g.top - 14, { align: "left", size: 11.5, color: C.muted });
    V.p.forEach((p, i) => {
      const x = g.xs[i], w = p * g.W, fy = g.bottom - V.l[i] * g.H, on = i === V.j;
      c.fillStyle = C.grid; c.fillRect(x, g.top, w, g.H);
      c.save(); c.fillStyle = C.accent; c.globalAlpha = on ? .6 : .22; c.fillRect(x, fy, w, g.bottom - fy); c.restore();
      if (w > 3){ c.strokeStyle = on ? C.accent : C.muted; c.lineWidth = on ? 2.5 : 1.5; c.beginPath(); c.moveTo(x + 1, fy); c.lineTo(x + w - 1, fy); c.stroke(); }
      if (w > 22) b.text(pShow(V.l[i]), x + w / 2, Math.max(g.top + 9, fy - 9), { size: 11, color: on ? C.accent : C.muted, weight: on ? 600 : 500 });
      if (w > 14) b.text(`E${i + 1}`, x + w / 2, g.bottom + 13, { size: 12.5, weight: 600, color: on ? C.accent : C.ink });
      if (w > 34) b.text(pShow(p), x + w / 2, g.bottom + 30, { size: 11, color: C.muted });
    });
    c.strokeStyle = C.surface; c.lineWidth = 2;
    for (let i = 1; i < V.k; i++){ const x = Math.round(g.xs[i]); c.beginPath(); c.moveTo(x, g.top); c.lineTo(x, g.bottom); c.stroke(); }
    c.strokeStyle = C.line; c.lineWidth = 1; c.strokeRect(g.m + .5, g.top + .5, g.W, g.H);
    // posterior bar: F alone, split by where it came from
    b.text(t("bayes.onlyF"), g.barX + g.barW / 2, g.top - 14, { size: 11.5, color: C.muted });
    let y = g.top;
    V.post.forEach((q, i) => {
      const h = q * g.H, on = i === V.j;
      c.save(); c.fillStyle = C.accent; c.globalAlpha = on ? .6 : .22; c.fillRect(g.barX, y, g.barW, h); c.restore();
      if (h > 16) b.text(on ? pShow(q) : `E${i + 1}`, g.barX + g.barW / 2, y + h / 2, { size: on ? 12.5 : 11, weight: on ? 600 : 500, color: C.ink });
      y += h;
      if (i < V.k - 1){ c.strokeStyle = C.surface; c.lineWidth = 2; c.beginPath(); c.moveTo(g.barX, y); c.lineTo(g.barX + g.barW, y); c.stroke(); }
    });
    c.strokeStyle = C.line; c.lineWidth = 1; c.strokeRect(g.barX + .5, g.top + .5, g.barW, g.H);
    b.text(`P(F) = ${pShow(V.PF)}`, g.barX + g.barW / 2, g.bottom + 13, { size: 11.5, color: C.muted });
    // arrow from the mosaic to the bar
    const ax = g.m + g.W + 8, ay = (g.top + g.bottom) / 2;
    c.strokeStyle = C.faint; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ax, ay); c.lineTo(g.barX - 8, ay);
    c.moveTo(g.barX - 13, ay - 5); c.lineTo(g.barX - 8, ay); c.lineTo(g.barX - 13, ay + 5); c.stroke();
  }
  const board = new Board(el("plot"), {
    draw,
    hit(x, y){
      if (!G || y < G.top - 4 || y > G.bottom + 4) return null;
      for (let i = 1; i < V.k; i++) if (Math.abs(x - G.xs[i]) < 6) return { type: "split", i };
      for (let i = 0; i < V.k; i++){
        const x0 = G.xs[i], w = V.p[i] * G.W, fy = G.bottom - V.l[i] * G.H;
        if (x > x0 && x < x0 + w && Math.abs(y - fy) < 7) return { type: "lik", i };
      }
      return null;
    },
    drag(tg, x, y){
      if (tg.type === "lik"){
        S.rows[tg.i][1] = trim(clamp(Math.round((G.bottom - y) / G.H * 100) / 100, 0, 1), 2);
        if (tg.i !== S.target) S.target = tg.i;
      } else {
        const i = tg.i, a = parseProb(S.rows[i - 1][0]), bb = parseProb(S.rows[i][0]), pair = a + bb;
        const pa = clamp(Math.round((x - G.xs[i - 1]) / G.W * 100) / 100, 0, pair);
        S.rows[i - 1][0] = trim(pa, 4); S.rows[i][0] = trim(pair - pa, 4);
      }
      S.example = null; update();
    },
    click(x, y){
      if (!G || y < G.top || y > G.bottom + 36) return;
      for (let i = 0; i < V.k; i++) if (x >= G.xs[i] && x < G.xs[i] + V.p[i] * G.W){ S.target = i; update(); return; }
    },
  });

  /* ---------- events ---------- */
  bindCopy($(".sections", root));
  el("evTable").addEventListener("click", e => {
    const tg = e.target.closest("[data-target]"), del = e.target.closest("[data-del]");
    if (tg){ S.target = +tg.dataset.target; update(); }
    if (del && S.rows.length > 2){
      const i = +del.dataset.del; S.rows.splice(i, 1);
      if (S.target >= S.rows.length) S.target = S.rows.length - 1; else if (S.target > i) S.target--;
      S.example = null; buildRows(); update();
    }
  });
  el("addBtn").addEventListener("click", () => {
    if (S.rows.length >= MAXK) return;
    S.rows.push(["0", "0.1"]); S.example = null; buildRows(); update();
  });
  el("eqBtn").addEventListener("click", () => {
    const k = S.rows.length; S.rows.forEach(r => { r[0] = `1/${k}`; }); S.example = null; update();
  });
  el("examples").innerHTML = examplesHtml(exList(), S.example);
  el("examples").addEventListener("click", e => { const b = e.target.closest("[data-ex]"); if (b) loadExample(b.dataset.ex); });
  const onTheme = () => board.draw();
  document.addEventListener("themechange", onTheme);
  buildRows(); update();
  return () => { board.destroy(); document.removeEventListener("themechange", onTheme); };
};
