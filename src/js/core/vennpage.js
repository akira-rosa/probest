"use strict";
/* ============================================================
   Shared page for two events A and B drawn as a Venn diagram:
   the addition rule and conditional probability.

     PAGES["addition-rule"] = vennPage(ADDITION);

   The circle areas are proportional to P(A), P(B) and P(A ∩ B)
   (scaled down only when they would not fit), and the bar under the
   diagram divides the sample space exactly. Dragging a circle changes
   how much the events overlap, that is P(A ∩ B).

   Config: id, key, mode ("union" | "cond"), state {A, B, AB, example},
     formulas(V), vars(V), result(V), answer(V), r(V), examples, notes, sources
   V = { A, B, AB, raw: {A, B, AB}, U, onlyA, onlyB, none, AgB, BgA, indep }
   ============================================================ */

/* Area of the overlap of two circles with radii r1, r2 whose centers are d apart. */
function lensArea(r1, r2, d){
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a = r1 * r1 * Math.acos(clamp((d * d + r1 * r1 - r2 * r2) / (2 * d * r1), -1, 1));
  const b = r2 * r2 * Math.acos(clamp((d * d + r2 * r2 - r1 * r1) / (2 * d * r2), -1, 1));
  return a + b - 0.5 * Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
}
/* Distance between the centers that gives an overlap of the given area. */
function lensDistance(r1, r2, area){
  let lo = Math.abs(r1 - r2), hi = r1 + r2;
  for (let i = 0; i < 60; i++){ const m = (lo + hi) / 2; lensArea(r1, r2, m) > area ? lo = m : hi = m; }
  return (lo + hi) / 2;
}

/* MathML for probabilities of events: P(A), P(A ∩ B), P(A | B)… */
const Ev = {
  A: () => M.i("A"), B: () => M.i("B"),
  P: inner => M.row(M.i("P"), M.paren(inner)),
  and: (a = Ev.A(), b = Ev.B()) => M.row(a, M.o("∩"), b),
  or: (a = Ev.A(), b = Ev.B()) => M.row(a, M.o("∪"), b),
  given: (a, b) => M.row(a, `<mo stretchy="false" lspace="0.25em" rspace="0.25em">|</mo>`, b),
};

function vennPage(cfg){
  const K = k => t(`${cfg.key}.${k}`), cond = cfg.mode === "cond";
  return function VennPage(root){
    const S = cfg.state;

    /* ---------- values ---------- */
    function values(st = S){
      const A = parseProb(st.A), B = parseProb(st.B), AB = parseProb(st.AB);
      let err = null;
      if (A == null || A < 0 || A > 1 || B == null || B < 0 || B > 1 || AB == null || AB < 0) err = "venn.err.range";
      else if (AB > Math.min(A, B) + 1e-12) err = "venn.err.big";
      else if (AB < A + B - 1 - 1e-12) err = "venn.err.small";
      else if (cond && B <= 0) err = "venn.err.zeroB";
      if (err) return { err };
      const U = A + B - AB;
      return { A, B, AB, raw: { A: st.A, B: st.B, AB: st.AB }, U, onlyA: A - AB, onlyB: B - AB, none: 1 - U,
        AgB: B > 0 ? AB / B : NaN, BgA: A > 0 ? AB / A : NaN, indep: Math.abs(AB - A * B) < 1e-9 };
    }

    /* ---------- examples ---------- */
    const src = e => typeof e.source === "function" ? e.source() : e.source === "slides" ? t("srcSlides") : e.source;
    const exList = () => cfg.examples.map(e => ({ id: e.id, title: K("ex." + e.id), source: src(e), answer: cfg.answer(values(e.set)) }));
    function loadExample(id){
      const e = cfg.examples.find(x => x.id === id); if (!e) return;
      Object.assign(S, e.set, { example: id });
      update();
    }

    /* ---------- markup ---------- */
    const pLbl = inner => `<math>${Ev.P(inner)}</math>`;
    const field = (k, lbl) => `
      <div class="param">
        <label for="in${k}">${lbl}</label>
        ${numInput("in" + k, 0.01)}
        <input id="r${k}" type="range" min="0" max="1" step="0.01" aria-label="${k}">
      </div>`;
    root.innerHTML = `
    <div class="page venn-page">
      <header class="page-head"><h1>${K("title")}</h1></header>
      <section class="work">
        <div class="plot-col">
          <div class="plot-bar">
            <span class="plot-title">${t("venn.diagram")}</span>
            <div class="bar-actions">
              <button class="btn" id="exclBtn" title="${t("venn.exclTitle")}">${t("venn.excl")}</button>
              <button class="btn" id="indBtn" title="${t("venn.indTitle")}">${t("venn.ind")}</button>
            </div>
          </div>
          <div class="plot-wrap"><canvas id="plot" role="img" aria-label="${t("venn.diagram")}"></canvas></div>
          <div class="legend"><span class="hint">${t("venn.hint")}</span><span class="hint" id="scaleNote"></span></div>
        </div>
        <aside class="controls" aria-label="${t("controls")}">
          <div class="group">
            <h2>${t("venn.probs")}</h2>
            ${field("A", pLbl(Ev.A()))}${field("B", pLbl(Ev.B()))}${field("AB", pLbl(Ev.and()))}
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
        <div id="frows"></div>
        <div id="vars"></div>
      </section>
      ${sectionsHtml({ about: K("about"), notes: cfg.notes.map(K), sources: cfg.sources.map(K) })}
    </div>`;
    const el = id => $("#" + id, root);
    let V = values();

    /* ---------- render ---------- */
    function renderAll(skip){
      for (const k of ["A", "B", "AB"]){
        const inp = el("in" + k);
        if (inp !== skip){ inp.value = probIn(S[k]); inp.removeAttribute("aria-invalid"); }
      }
      el("err").hidden = !V.err; if (V.err) el("err").textContent = t(V.err);
      if (V.err){ board.draw(); return; }
      setSlider(el("rA"), V.A); setSlider(el("rB"), V.B);
      const rAB = el("rAB"); rAB.min = Math.max(0, V.A + V.B - 1); rAB.max = Math.min(V.A, V.B); rAB.step = 0.001; setSlider(rAB, V.AB);
      el("exclBtn").disabled = V.A + V.B > 1 + 1e-12;
      const rows = cfg.formulas(V), box = el("frows");
      box.innerHTML = rows.map((r, i) => `<div class="frow"><span class="flabel">${r.label}</span><div class="fmath" data-row="${i}">${r.chain ? M.math(M.row(r.chain.join(M.o("=")))) : r.html}</div></div>`).join("");
      rows.forEach((r, i) => { if (!r.chain) return; const f = $(`[data-row="${i}"]`, box); if (f.scrollWidth > f.clientWidth + 2) f.innerHTML = M.chain(r.chain, 2); });
      el("vars").innerHTML = varsTableHtml(cfg.vars(V));
      const res = cfg.result(V);
      el("big").textContent = res.big; el("sub").innerHTML = res.sub;
      el("facts").innerHTML = res.facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
      el("rcode").innerHTML = codeHtml([`# ${K("title")}`, ...cfg.r(V)].join("\n"));
      markExample(el("examples"), S.example);
      board.draw();
    }
    function update(skip){ V = values(); renderAll(skip); }

    /* ---------- diagram ---------- */
    let G = null, frozen = null;
    function geometry(b){
      const m = 14, barH = 46, rect = { x: m, y: m, w: b.w - 2 * m, h: b.h - 2 * m - barH };
      const rA = Math.sqrt(V.A / Math.PI), rB = Math.sqrt(V.B / Math.PI);
      const d = frozen?.d ?? lensDistance(rA, rB, V.AB);
      const left = Math.min(-rA, d - rB), right = Math.max(rA, d + rB), tall = 2 * Math.max(rA, rB) || 1;
      const exact = Math.sqrt(rect.w * rect.h);                         // Ω has area 1: true scale
      const fitS = Math.min((rect.w - 60) / ((right - left) || 1), (rect.h - 44) / tall);
      const s = frozen?.s ?? Math.min(exact, fitS);
      const cy = rect.y + rect.h / 2;
      let cxA = rect.x + rect.w / 2 - (left + right) / 2 * s;
      if (frozen?.cxA != null) cxA = frozen.cxA;
      if (frozen?.cxB != null) cxA = frozen.cxB - d * s;
      return { rect, rA, rB, d, s, scaled: s < exact - 1e-6, cy, cxA, cxB: cxA + d * s, RA: rA * s, RB: rB * s, barY: b.h - 24 };
    }
    function draw(b){
      const C = b.colors(), c = b.ctx;
      if (V.err){ b.text(t(V.err), b.w / 2, b.h / 2, { color: C.faint }); return; }
      const g = G = geometry(b), { rect } = g;
      // sample space
      c.fillStyle = cond ? C.grid : C.surface; c.strokeStyle = C.line; c.lineWidth = 1;
      c.beginPath(); c.roundRect(rect.x + .5, rect.y + .5, rect.w, rect.h, 6); c.fill(); c.stroke();
      b.text("Ω", rect.x + 12, rect.y + 14, { align: "left", color: C.muted, size: 14 });
      const circ = (x, r) => { c.beginPath(); c.arc(x, g.cy, Math.max(r, 0.01), 0, Math.PI * 2); };
      if (!cond){
        c.fillStyle = C.fill; circ(g.cxA, g.RA); c.fill(); circ(g.cxB, g.RB); c.fill();   // the overlap gets both fills: counted twice
      } else {
        c.fillStyle = C.surface; circ(g.cxB, g.RB); c.fill();                             // B is the new sample space
        c.save(); circ(g.cxB, g.RB); c.clip(); c.fillStyle = C.accent; c.globalAlpha = .35; circ(g.cxA, g.RA); c.fill(); c.restore();
      }
      c.lineWidth = 2; c.strokeStyle = C.accent;
      c.setLineDash(cond ? [5, 4] : []); circ(g.cxA, g.RA); c.stroke(); c.setLineDash([]);
      c.lineWidth = cond ? 2.5 : 2; circ(g.cxB, g.RB); c.stroke();
      // event names and region values
      const lab = (s, x, y, o) => b.text(s, x, y, { weight: 600, size: 15, color: C.accent, ...o });
      lab("A", g.cxA - g.RA * 0.72, g.cy - g.RA * 0.72 - 6, { align: "right" });
      lab("B", g.cxB + g.RB * 0.72, g.cy - g.RB * 0.72 - 6, { align: "left" });
      const val = (v, x, y, show_ = true) => show_ && b.text(pShow(v), x, y, { size: 12.5, color: C.ink });
      const lensX = g.d > 1e-9 ? g.cxA + (g.d * g.d + g.rA * g.rA - g.rB * g.rB) / (2 * g.d) * g.s : (g.cxA + g.cxB) / 2;
      const contained = g.d <= Math.abs(g.rA - g.rB) + 1e-9;
      if (!contained){
        val(V.onlyA, (g.cxA - g.RA + Math.min(lensX, g.cxB - g.RB)) / 2, g.cy, !cond && V.onlyA > 0 && g.RA > 18);
        val(V.onlyB, (g.cxB + g.RB + Math.max(lensX, g.cxA + g.RA)) / 2, g.cy, V.onlyB > 0 && g.RB > 18);
        val(V.AB, (Math.max(g.cxA - g.RA, g.cxB - g.RB) + Math.min(g.cxA + g.RA, g.cxB + g.RB)) / 2, g.cy, V.AB > 0 && (Math.min(g.cxA + g.RA, g.cxB + g.RB) - Math.max(g.cxA - g.RA, g.cxB - g.RB)) > 46);
      } else if (V.AB > 0){
        const small = g.rA <= g.rB ? g.cxA : g.cxB;
        val(V.AB, small, g.cy, Math.min(g.RA, g.RB) > 16);
      }
      if (!cond) b.text(`${t("venn.neither")} ${pShow(V.none)}`, rect.x + rect.w - 12, rect.y + rect.h - 12, { align: "right", base: "bottom", size: 12, color: C.muted });
      // exact partition bar
      const bx = rect.x, bw = rect.w, by = g.barY, bh = 20;
      const segs = cond
        ? [[V.AgB, C.accent, .35, `A ∩ B`], [1 - V.AgB, C.surface, 1, `B − A`]]
        : [[V.onlyA, C.accent, .16, t("venn.onlyA")], [V.AB, C.accent, .32, "A ∩ B"], [V.onlyB, C.accent, .16, t("venn.onlyB")], [V.none, C.grid, 1, t("venn.none")]];
      b.text(cond ? t("venn.barCond") : t("venn.barUnion"), bx, by - 9, { align: "left", size: 11.5, color: C.muted });
      let x = bx;
      for (const [v, col, a, name] of segs){
        const w = v * bw; if (w <= 0) continue;
        c.save(); c.globalAlpha = a; c.fillStyle = col; c.fillRect(x, by, w, bh); c.restore();
        if (w > 64) b.text(`${name}  ${pShow(v)}`, x + w / 2, by + bh / 2 + .5, { size: 11.5, color: C.ink });
        x += w;
      }
      c.strokeStyle = C.line; c.lineWidth = 1; c.strokeRect(bx + .5, by + .5, bw, bh);
      el("scaleNote").textContent = g.scaled ? t("venn.scaled") : t("venn.toScale");
    }
    const board = new Board(el("plot"), {
      draw,
      hit(x, y){
        if (V.err || !G) return null;
        const inB = Math.hypot(x - G.cxB, y - G.cy) <= G.RB, inA = Math.hypot(x - G.cxA, y - G.cy) <= G.RA;
        if (inB && (!inA || G.RB <= G.RA)) return { k: "B" };
        if (inA) return { k: "A" };
        return inB ? { k: "B" } : null;
      },
      drag(tg, x, y, dx){
        if (tg.d0 == null){ tg.d0 = G.d; frozen = { s: G.s, ...(tg.k === "B" ? { cxA: G.cxA } : { cxB: G.cxB }) }; }
        const lo = Math.abs(G.rA - G.rB), hi = G.rA + G.rB;
        let d = clamp(tg.d0 + (tg.k === "B" ? dx : -dx) / frozen.s, lo, hi);
        let ab = lensArea(G.rA, G.rB, d);
        const abLo = Math.max(0, V.A + V.B - 1);
        if (ab < abLo){ ab = abLo; d = lensDistance(G.rA, G.rB, ab); }
        frozen.d = d;
        S.AB = trim(ab, 4); S.example = null; update();
      },
      end(){ frozen = null; },
    });

    /* ---------- events ---------- */
    bindCopy($(".sections", root));
    for (const k of ["A", "B", "AB"]){
      const inp = el("in" + k), r = el("r" + k);
      inp.addEventListener("input", () => {
        const v = parseProb(inp.value), ok = v != null && v >= 0 && v <= 1;
        inp.setAttribute("aria-invalid", !ok);
        if (ok){ S[k] = inp.value.replace(",", ".").trim(); S.example = null; update(inp); }
      });
      inp.addEventListener("change", () => update());
      r.addEventListener("input", () => {
        S[k] = trim(+r.value, 4); S.example = null;
        // keep P(A ∩ B) possible when P(A) or P(B) moves
        const A = parseProb(S.A), B = parseProb(S.B), AB = parseProb(S.AB);
        if (k !== "AB" && A != null && B != null && AB != null) S.AB = trim(clamp(AB, Math.max(0, A + B - 1), Math.min(A, B)), 4);
        update();
      });
    }
    el("exclBtn").addEventListener("click", () => { S.AB = "0"; S.example = null; update(); });
    el("indBtn").addEventListener("click", () => {
      const A = parseProb(S.A), B = parseProb(S.B); if (A == null || B == null) return;
      S.AB = trim(A * B, 6); S.example = null; update();
    });
    el("examples").innerHTML = examplesHtml(exList(), S.example);
    el("examples").addEventListener("click", e => { const b = e.target.closest("[data-ex]"); if (b) loadExample(b.dataset.ex); });
    const onTheme = () => board.draw();
    document.addEventListener("themechange", onTheme);
    update();
    return () => { board.destroy(); document.removeEventListener("themechange", onTheme); };
  };
}

/* R code helper: a probability as typed (fractions stay fractions, which R evaluates). */
const rProb = raw => String(raw).replace(",", ".").replace(/\s+/g, "");
