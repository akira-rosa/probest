"use strict";
/* ============================================================
   Home page animation: one graph that morphs, scene after scene,
   through the kinds of graph used in the app, plus a few classics
   (a Galton board, the central limit theorem).

   Every scene is built from the same parts, so any scene can turn into
   any other by interpolation:
     curves  C curves, y at M fixed x positions, each with an opacity
     areas   two shaded intervals under the first curve
     band    one shaded vertical band (x1 to x2)
     bars    K bars (x, height, width, opacity of a background column)
     dots    P dots (x, y, opacity, red)
     segs    S line segments (x1, y1, x2, y2, opacity, red, dashed)
     tri     a balance-point triangle under the baseline (x, opacity)
   A scene with `grow` builds its bars up during its hold (and draws its
   curve late); the Galton board also drops balls through pegs.
   Coordinates are 0–1 inside the drawing area (y = 0 at the baseline).
   ============================================================ */
function homeAnimation(box){
  const M = 140, C_ = 4, K = 13, P = 44, S = 48, HOLD = 2600, MORPH = 1500;
  const canvas = document.createElement("canvas"), label = document.createElement("a");
  canvas.setAttribute("aria-hidden", "true"); label.className = "anim-label";
  box.append(canvas, label);
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1, scenes = [], starts = [], total = 1, raf = 0, t0 = performance.now(), galton = null;

  /* deterministic pseudo-random numbers, so the scenes look the same every time */
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = r => { let s = 0; for (let i = 0; i < 6; i++) s += r(); return (s - 3) / 1.2; };
  const xs = Array.from({ length: M }, (_, i) => i / (M - 1));
  const zeroBars = () => Array.from({ length: K }, (_, i) => ({ x: (i + 0.5) / K, h: 0, w: 0.6 / K, bg: 0 }));
  const hiddenDots = f => Array.from({ length: P }, (_, i) => { const x = (i + 0.5) / P; return { x, y: f ? f(x) : 0, a: 0, red: 0 }; });
  const hiddenSegs = () => Array.from({ length: S }, () => ({ x1: 0.5, y1: 0, x2: 0.5, y2: 0, a: 0, red: 0, dash: 0 }));
  const seg = (x1, y1, x2, y2, o = {}) => ({ x1, y1, x2, y2, a: 1, red: 0, dash: 0, ...o });
  const fillSegs = list => { const out = hiddenSegs(); list.slice(0, S).forEach((s, i) => { out[i] = s; }); return out; };

  function scene(label, o){
    const first = o.curves?.[0] || o.curve;
    const curves = Array.from({ length: C_ }, (_, j) => {
      const f = (o.curves && o.curves[j]) || (j === 0 ? o.curve : null) || first;
      return { y: xs.map(f || (() => 0)), a: (o.curves ? (o.curves[j] ? 1 : 0) : (j === 0 && o.curve ? 1 : 0)) };
    });
    return { label, link: o.link !== false, hold: o.hold || HOLD, grow: !!o.grow, galton: !!o.galton, curveLate: !!o.curveLate,
      curves, areas: o.areas || [[0.5, 0.5], [0.5, 0.5]], band: o.band || { x1: 0.5, x2: 0.5, a: 0 },
      bars: o.bars || zeroBars(), dots: o.dots || hiddenDots(first), segs: o.segs ? fillSegs(o.segs) : hiddenSegs(),
      tri: o.tri || { x: 0.5, a: 0 }, lineOnly: !!o.lineOnly };
  }

  function build(){
    const iw = w - 2 * padX(), ih = h - 2 * padY();
    const asp = h && w ? ih / iw : 0.3;                 // height / width, to draw true circles
    const dotStep = ih ? 9.5 / ih : 0.05;               // one dot diameter, in y units
    const peak = 0.86;
    const normal = (m, s, top = peak) => x => top * Math.exp(-0.5 * ((x - m) / s) ** 2);
    const barsFrom = (vals, from = 0.06, span = 0.88, top = peak) => {
      const mx = Math.max(...vals), out = zeroBars(), n = vals.length;
      vals.forEach((v, i) => { out[i] = { x: from + (i + 0.5) * span / n, h: top * v / mx, w: 0.62 * span / n, bg: 0 }; });
      for (let i = n; i < K; i++) out[i] = { x: out[n - 1].x, h: 0, w: 0, bg: 0 };
      return out;
    };
    const pmf = (f, a, b) => { const v = []; for (let k = a; k <= b; k++) v.push(f(k)); return v; };
    const binom = (n, p) => k => Num.choose(n, k) * p ** k * (1 - p) ** (n - k);
    const pois = l => k => Math.exp(-l + k * Math.log(l) - Num.lgamma(k + 1));
    const chi = df => x => { const v = x * 16; return v <= 0 ? 0 : Num.chiPdf(v, df); };
    const chiTop = Math.max(...xs.map(chi(4)));

    // dot plot: P values stacked in columns, the last one an outlier on the right
    const r1 = rng(7), cols = 15, counts = Array(cols).fill(0), colX = c => 0.08 + c * 0.8 / (cols - 1);
    const dotplot = Array.from({ length: P }, (_, i) => {
      const c = i === P - 1 ? cols - 1 : clamp(Math.round(5.5 + gauss(r1) * 2.1), 0, cols - 3), k = counts[c]++;
      return { x: i === P - 1 ? 0.95 : colX(c), y: 0.03 + k * dotStep, a: 1, red: 0 };
    });
    const vals = dotplot.map(d => d.x), mean = vals.reduce((a, b) => a + b, 0) / P;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (P - 1));
    const sorted = [...vals].sort((a, b) => a - b), q = p => Desc.at(sorted, p * (P + 1)).v;
    const qi = q(0.25), md = q(0.5), qs = q(0.75), dq = qs - qi, inside = sorted.filter(v => v <= qs + 1.5 * dq && v >= qi - 1.5 * dq);
    const boxY0 = 0.62, boxY1 = 0.86, boxMid = (boxY0 + boxY1) / 2;
    const boxSegs = [
      seg(qi, boxY0, qs, boxY0), seg(qs, boxY0, qs, boxY1), seg(qs, boxY1, qi, boxY1), seg(qi, boxY1, qi, boxY0),
      seg(md, boxY0, md, boxY1), seg(inside[0], boxMid, qi, boxMid), seg(qs, boxMid, inside[inside.length - 1], boxMid),
      seg(inside[0], boxMid - 0.06, inside[0], boxMid + 0.06), seg(inside[inside.length - 1], boxMid - 0.06, inside[inside.length - 1], boxMid + 0.06),
    ];
    // scatter around a line
    const r2 = rng(42), line = x => 0.12 + 0.68 * x;
    const scatter = Array.from({ length: P }, (_, i) => {
      const x = 0.06 + 0.88 * (i + r2() * 0.8) / P;
      return { x, y: clamp(line(x) + gauss(r2) * 0.09, 0.02, 0.98), a: 1, red: 0 };
    });
    // the same points, more spread out, for the correlation quadrants
    const r5 = rng(23), cloud = scatter.map(d => ({ ...d, y: clamp(0.5 + (d.y - 0.5) * 0.55 + gauss(r5) * 0.17, 0.03, 0.97) }));
    const sx = cloud.reduce((a, d) => a + d.x, 0) / P, sy = cloud.reduce((a, d) => a + d.y, 0) / P;
    // Venn: dots on two overlapping circles
    const venn = Array.from({ length: P }, (_, i) => {
      const left = i < P / 2, j = left ? i : i - P / 2, th = j / (P / 2) * Math.PI * 2 + (left ? 0 : Math.PI);
      const r = 0.36, cx = 0.5 + (left ? -1 : 1) * 0.62 * r * asp;
      return { x: cx + r * asp * Math.cos(th), y: 0.47 + r * Math.sin(th), a: 1, red: 0 };
    });
    // many confidence intervals around μ = 0.5: most cover it, two miss (red)
    const r3 = rng(11), nCI = 20, ciSegs = [seg(0.5, 0, 0.5, 0.97, { dash: 1 })], ciDots = hiddenDots();
    for (let i = 0; i < nCI; i++){
      const y = 0.05 + i * 0.9 / (nCI - 1), hw = 0.075 + (r3() - 0.5) * 0.02;
      let c = 0.5 + gauss(r3) * 0.04; if (i === 6) c = 0.5 + hw * 1.25; if (i === 15) c = 0.5 - hw * 1.2;
      const miss = Math.abs(c - 0.5) > hw ? 1 : 0;
      ciSegs.push(seg(c - hw, y, c + hw, y, { red: miss }));
      ciDots[i] = { x: c, y, a: 1, red: miss };
    }
    // Bayes mosaic: column widths = priors, filled heights = likelihoods
    const priors = [0.3, 0.15, 0.25, 0.3], liks = [0.35, 0.8, 0.5, 0.2], gap = 0.008;
    const mosaic = zeroBars(); let mx = 0.06;
    priors.forEach((p, i) => { const wd = p * 0.88; mosaic[i] = { x: mx + wd / 2, h: liks[i] * 0.92, w: wd - gap, bg: 1 }; mx += wd; });
    for (let i = priors.length; i < K; i++) mosaic[i] = { x: mosaic[priors.length - 1].x, h: 0, w: 0, bg: 0 };
    // expected value: bars on a board, balanced on E(X)
    const evP = [0.08, 0.22, 0.32, 0.2, 0.12, 0.06], evBars = barsFrom(evP, 0.14, 0.72);
    const ex = evP.reduce((a, p, i) => a + p * evBars[i].x, 0);
    // Galton board: 9 rows of pegs over 10 bins, binomial(9, 1/2)
    const R = 9, gBars = barsFrom(pmf(binom(R, 0.5), 0, R), 0.2, 0.6, 0.4);
    galton = { R, dx: 0.6 / (R + 1), top: 0.95, bottom: 0.48, bars: gBars, r: rng(3) };
    // central limit theorem: histogram of sample means, with a little noise, then the normal curve
    const r4 = rng(5), cltVals = Array.from({ length: K }, (_, i) => Math.exp(-0.5 * ((i - 6) / 2.1) ** 2) * (1 + (r4() - 0.5) * 0.18));
    const cltBars = barsFrom(cltVals);
    // sample size: n as the population N grows (log scale), levelling off at n₀
    const n0 = 380, ssCurve = x => { const N = 10 ** (1 + x * 4.6); return 0.82 * N / (N + n0 - 1); };

    scenes = [
      scene("normal", { curve: normal(0.5, 0.12), areas: [[0.38, 0.62], [0.62, 0.62]] }),
      scene("normal", { curves: [normal(0.5, 0.07), normal(0.5, 0.11, 0.56), normal(0.5, 0.16, 0.39), normal(0.68, 0.09, 0.68)] }),
      scene("ci-mean", { segs: ciSegs, dots: ciDots }),
      scene("test-mean", { curve: normal(0.5, 0.14), areas: [[0, 0.5 - 1.96 * 0.14], [0.5 + 1.96 * 0.14, 1]] }),
      scene("chi-square", { curve: x => peak * chi(4)(x) / chiTop, areas: [[9.49 / 16, 1], [1, 1]] }),
      scene("exponential", { curve: x => (x >= 0.04 ? peak * Math.exp(-4.2 * (x - 0.04)) : 0), areas: [[0.04, 0.3], [0.3, 0.3]] }),
      scene("uniform", { curve: x => (x >= 0.22 && x <= 0.78 ? 0.42 : 0), areas: [[0.38, 0.62], [0.62, 0.62]] }),
      scene("binomial", { bars: barsFrom(pmf(binom(10, 0.35), 0, 10)) }),
      scene("anim.galton", { bars: gBars, grow: true, galton: true, hold: 6400, link: false }),
      scene("poisson", { bars: barsFrom(pmf(pois(3), 0, 11)) }),
      scene("expected-value", { bars: evBars, tri: { x: ex, a: 1 }, segs: [seg(0.1, 0, 0.9, 0), seg(ex, 0, ex, 0.93, { dash: 1 })] }),
      scene("bayes", { bars: mosaic }),
      scene("anim.clt", { bars: cltBars, curve: normal(0.06 + 6.5 * 0.88 / K, 2.1 * 0.88 / K, peak / Math.max(...cltVals) * 1.0), grow: true, curveLate: true, hold: 5200, link: false }),
      scene("sample-size", { curve: ssCurve, lineOnly: true, segs: [seg(0, 0.82, 1, 0.82, { dash: 1 })] }),
      scene("linear-regression", { curve: line, dots: scatter, lineOnly: true }),
      scene("correlation", { dots: cloud.map(d => ({ ...d, red: (d.x - sx) * (d.y - sy) < 0 ? 1 : 0 })),
        segs: [seg(sx, 0, sx, 0.98, { dash: 1 }), seg(0, sy, 1, sy, { dash: 1 })] }),
      scene("mean", { dots: dotplot, tri: { x: mean, a: 1 }, segs: [seg(mean, 0, mean, 0.92)] }),
      scene("standard-deviation", { dots: dotplot, band: { x1: mean - sd, x2: mean + sd, a: 1 },
        segs: [seg(mean, 0, mean, 0.92), ...dotplot.slice(0, S - 1).map(d => seg(mean, d.y, d.x, d.y, { a: 0.45 }))] }),
      scene("quartiles", { dots: dotplot.map((d, i) => ({ ...d, red: i === P - 1 ? 1 : 0 })), segs: boxSegs }),
      scene("addition-rule", { dots: venn }),
    ];
    starts = []; total = 0;
    for (const s of scenes){ starts.push(total); total += s.hold + MORPH; }
  }

  /* ---------- drawing ---------- */
  const padX = () => Math.min(48, w * 0.06), padY = () => 26;
  const ease = u => u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
  const mix = (a, b, u) => a + (b - a) * u;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function frame(now){
    raf = requestAnimationFrame(frame);
    if (!w || !scenes.length) return;
    const el = (now - t0) % total;
    let i = starts.length - 1; while (starts[i] > el) i--;
    const A = scenes[i], B = scenes[(i + 1) % scenes.length], into = el - starts[i];
    const u = reduce ? 0 : into < A.hold ? 0 : ease((into - A.hold) / MORPH);
    const prog = into < A.hold ? into / A.hold : 1;      // progress through the hold, for growing scenes
    draw(A, B, u, prog, into);
    const cur = u < 0.5 ? A : B, op = reduce ? 1 : Math.abs(1 - 2 * u), key = cur.label;
    if (label.dataset.id !== key){
      label.dataset.id = key; label.textContent = key.startsWith("anim.") ? t(key) : t("nav." + key);
      if (cur.link) label.href = "#/" + key; else label.removeAttribute("href");
    }
    label.style.opacity = (0.15 + 0.85 * op).toFixed(3);
  }
  function draw(A, B, u, prog, into){
    const c = ctx, red = cssVar("--danger");
    const C = { accent: cssVar("--accent"), fill: cssVar("--fill"), line: cssVar("--line"), grid: cssVar("--grid"), surface: cssVar("--bg"), faint: cssVar("--faint") };
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const px = padX(), py = padY(), W = w - 2 * px, H = h - 2 * py;
    const X = x => px + x * W, Y = y => h - py - y * H;
    // a growing scene builds its bars during the hold; leaving it, it is full
    const growA = A.grow && u === 0 && !reduce ? smooth(0, 0.85, prog) : 1;
    const barsA = A.grow && growA < 1 ? A.bars.map((b, k) => ({ ...b, h: b.h * smooth(0, 1, growA * 1.25 - (A.galton ? 0 : 0.25 * Math.abs(k - 6) / 6)) })) : A.bars;
    const barsB = B.grow ? B.bars.map(b => ({ ...b, h: 0 })) : B.bars;
    const lateA = A.curveLate && u === 0 && !reduce ? smooth(0.6, 0.92, prog) : 1, lateB = B.curveLate ? 0 : 1;

    // baseline
    c.strokeStyle = C.line; c.lineWidth = 1; c.beginPath(); c.moveTo(px, Math.round(Y(0)) + .5); c.lineTo(px + W, Math.round(Y(0)) + .5); c.stroke();
    const curve0 = A.curves[0].y.map((y, k) => mix(y, B.curves[0].y[k], u));
    const ca0 = mix(A.curves[0].a * lateA, B.curves[0].a * lateB, u);
    const lineOnly = u < 0.5 ? A.lineOnly : B.lineOnly;
    // shaded band
    const bx1 = mix(A.band.x1, B.band.x1, u), bx2 = mix(A.band.x2, B.band.x2, u), ba = mix(A.band.a, B.band.a, u);
    if (ba > 0.01 && bx2 > bx1){ c.save(); c.globalAlpha = ba; c.fillStyle = C.fill; c.fillRect(X(bx1), Y(0.95), (bx2 - bx1) * W, 0.95 * H); c.restore(); }
    // shaded areas under the first curve
    for (let j = 0; j < 2; j++){
      const a = mix(A.areas[j][0], B.areas[j][0], u), b = mix(A.areas[j][1], B.areas[j][1], u);
      if (b - a < 1e-3 || ca0 < 0.02 || lineOnly) continue;
      c.save(); c.globalAlpha = ca0; c.fillStyle = C.fill; c.beginPath(); c.moveTo(X(a), Y(0));
      for (let k = 0; k < M; k++){ const x = xs[k]; if (x >= a && x <= b) c.lineTo(X(x), Y(curve0[k])); }
      c.lineTo(X(b), Y(0)); c.closePath(); c.fill(); c.restore();
    }
    // bars (with their background columns, for the mosaic)
    for (let k = 0; k < K; k++){
      const a = barsA[k], b = barsB[k], bh = mix(a.h, b.h, u), bw = mix(a.w, b.w, u), bx = mix(a.x, b.x, u), bg = mix(a.bg || 0, b.bg || 0, u);
      if (bw <= 0) continue;
      if (bg > 0.01){ c.globalAlpha = bg; c.fillStyle = C.grid; c.fillRect(X(bx - bw / 2), Y(0.92), bw * W, 0.92 * H); }
      if (bh * H < 0.5) continue;
      c.globalAlpha = 0.9; c.fillStyle = C.accent; c.beginPath(); c.roundRect(X(bx - bw / 2), Y(bh), bw * W, bh * H, bg > 0.5 ? 0 : [3, 3, 0, 0]); c.fill();
    }
    c.globalAlpha = 1;
    // Galton board: pegs and falling balls
    const gw = A.galton ? 1 - u : B.galton ? u : 0;
    if (gw > 0.01 && galton) drawGalton(c, C, X, Y, gw, A.galton && u === 0 ? into : null);
    // curves
    for (let j = 0; j < C_; j++){
      const y = j ? A.curves[j].y.map((v, k) => mix(v, B.curves[j].y[k], u)) : curve0;
      const al = j ? mix(A.curves[j].a, B.curves[j].a, u) : ca0;
      if (al < 0.01) continue;
      c.save(); c.globalAlpha = al * (j ? 0.85 : 1); c.strokeStyle = C.accent; c.lineWidth = j ? 2 : 2.4; c.lineJoin = "round"; c.lineCap = "round";
      c.beginPath(); y.forEach((v, k) => k ? c.lineTo(X(xs[k]), Y(v)) : c.moveTo(X(xs[k]), Y(v))); c.stroke(); c.restore();
    }
    // segments
    c.lineCap = "round";
    for (let k = 0; k < S; k++){
      const a = A.segs[k], b = B.segs[k], al = mix(a.a, b.a, u);
      if (al < 0.02) continue;
      const r = mix(a.red, b.red, u), dash = (u < 0.5 ? a.a ? a.dash : b.dash : b.a ? b.dash : a.dash);
      c.save(); c.setLineDash(dash ? [5, 5] : []); c.lineWidth = dash ? 1.4 : 2.2;
      c.beginPath(); c.moveTo(X(mix(a.x1, b.x1, u)), Y(mix(a.y1, b.y1, u))); c.lineTo(X(mix(a.x2, b.x2, u)), Y(mix(a.y2, b.y2, u)));
      if (r < 0.99){ c.globalAlpha = al * (1 - r) * (dash ? 0.6 : 1); c.strokeStyle = dash ? C.faint : C.accent; c.stroke(); }
      if (r > 0.01){ c.globalAlpha = al * r; c.strokeStyle = red; c.stroke(); }
      c.restore();
    }
    // dots
    for (let k = 0; k < P; k++){
      const a = A.dots[k], b = B.dots[k], al = mix(a.a, b.a, u);
      if (al < 0.02) continue;
      const r = mix(a.red || 0, b.red || 0, u), x = X(mix(a.x, b.x, u)), y = Y(mix(a.y, b.y, u));
      c.strokeStyle = C.surface; c.lineWidth = 1.5;
      c.globalAlpha = al; c.fillStyle = C.accent; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); c.stroke();
      if (r > 0.01){ c.globalAlpha = al * r; c.fillStyle = red; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); }
    }
    // balance point
    const ta = mix(A.tri.a, B.tri.a, u);
    if (ta > 0.01){
      const tx = X(mix(A.tri.x, B.tri.x, u)), ty = Y(0);
      c.globalAlpha = ta; c.fillStyle = C.accent; c.beginPath(); c.moveTo(tx, ty + 1); c.lineTo(tx - 8, ty + 13); c.lineTo(tx + 8, ty + 13); c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
  }
  /* Galton board: pegs in a triangle; balls fall through them, one step left or right per row. */
  function drawGalton(c, C, X, Y, weight, into){
    const g = galton, rowH = (g.top - g.bottom) / (g.R - 1);
    c.fillStyle = C.faint;
    for (let j = 0; j < g.R; j++) for (let i = 0; i <= j; i++){
      c.globalAlpha = weight * 0.8; c.beginPath(); c.arc(X(0.5 + (i - j / 2) * g.dx), Y(g.top - j * rowH), 2.2, 0, Math.PI * 2); c.fill();
    }
    if (into == null || reduce) { c.globalAlpha = 1; return; }
    // balls: one released every 55 ms; each takes 900 ms to fall; paths fixed by the ball's number
    const every = 55, fall = 900, n = Math.floor(into / every);
    c.fillStyle = C.accent;
    for (let b = Math.max(0, n - Math.ceil(fall / every)); b <= n; b++){
      const age = (into - b * every) / fall; if (age < 0 || age > 1) continue;
      const r = rng(1000 + b * 7919); let x = 0.5;
      const steps = age * (g.R + 1), whole = Math.floor(steps);
      for (let j = 0; j < Math.min(whole, g.R); j++) x += (r() < 0.5 ? -0.5 : 0.5) * g.dx;
      let y;
      if (whole < g.R){ const nx = x + (r() < 0.5 ? -0.5 : 0.5) * g.dx, f = steps - whole; x = mix(x, nx, f); y = g.top + rowH * 0.6 - steps * rowH; }
      else y = Math.max(0.02, g.bottom - (steps - g.R) * (g.bottom - 0.02));
      c.globalAlpha = 0.9 * weight; c.beginPath(); c.arc(X(x), Y(y), 3.4, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }
  const ro = new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect(); dpr = window.devicePixelRatio || 1;
    w = r.width; h = r.height; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    build();
  });
  ro.observe(canvas);
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}
