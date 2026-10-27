"use strict";
/* ============================================================
   Home page animation: one graph that morphs, scene after scene,
   through the kinds of graph used in the app (normal curve, binomial
   and Poisson bars, exponential and uniform densities, a two-sided
   test, chi-square, a dot plot, a scatter plot with its regression
   line, a Venn diagram).

   Every scene is built from the same parts, so any scene can turn into
   any other by interpolation:
     curve  y at M fixed x positions (and its opacity)
     areas  two shaded intervals under the curve
     bars   K bars (x, height, width)
     dots   P dots (x, y, opacity)
   Coordinates are 0–1 inside the drawing area (y = 0 at the baseline).
   ============================================================ */
function homeAnimation(box){
  const M = 140, K = 13, P = 44, HOLD = 2600, MORPH = 1500;
  const canvas = document.createElement("canvas"), label = document.createElement("a");
  canvas.setAttribute("aria-hidden", "true"); label.className = "anim-label";
  box.append(canvas, label);
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1, scenes = [], raf = 0, t0 = performance.now();

  /* deterministic pseudo-random numbers, so the scenes look the same every time */
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = r => { let s = 0; for (let i = 0; i < 6; i++) s += r(); return (s - 3) / 1.2; };
  const xs = Array.from({ length: M }, (_, i) => i / (M - 1));
  const zeroBars = () => Array.from({ length: K }, (_, i) => ({ x: (i + 0.5) / K, h: 0, w: 0.6 / K }));
  const hiddenDots = curve => Array.from({ length: P }, (_, i) => { const x = (i + 0.5) / P; return { x, y: curve ? curve(x) : 0, a: 0 }; });
  const scene = (id, o) => ({ id, curve: xs.map(o.curve || (() => 0)), ca: o.curve ? 1 : 0, areas: o.areas || [[0.5, 0.5], [0.5, 0.5]],
    bars: o.bars || zeroBars(), dots: o.dots || hiddenDots(o.curve), lineOnly: !!o.lineOnly });

  function build(){
    const asp = h && w ? (h - 2 * padY()) / (w - 2 * padX()) : 0.3;   // height/width, to draw true circles
    const peak = 0.86;
    const normal = (m, s) => x => peak * Math.exp(-0.5 * ((x - m) / s) ** 2);
    const barsFrom = (pmf, from, to) => {
      const vals = []; for (let k = from; k <= to; k++) vals.push(pmf(k));
      const top = Math.max(...vals), out = zeroBars();
      vals.forEach((v, i) => { if (i < K) out[i] = { x: 0.06 + (i + 0.5) * 0.88 / vals.length, h: peak * v / top, w: 0.62 * 0.88 / vals.length }; });
      for (let i = vals.length; i < K; i++) out[i] = { x: out[vals.length - 1].x, h: 0, w: 0 };
      return out;
    };
    const binom = (n, p) => k => Num.choose(n, k) * p ** k * (1 - p) ** (n - k);
    const pois = l => k => Math.exp(-l + k * Math.log(l) - Num.lgamma(k + 1));
    const chi = df => x => { const v = x * 16; return v <= 0 ? 0 : Num.chiPdf(v, df); };
    const chiTop = Math.max(...xs.map(chi(4)));

    // dot plot: P values stacked in columns
    const r1 = rng(7), cols = 15, counts = Array(cols).fill(0), dotStep = h ? 9.5 / (h - 2 * padY()) : 0.05;
    const dotplot = Array.from({ length: P }, () => {
      const c = clamp(Math.round(7 + gauss(r1) * 2.6), 0, cols - 1), k = counts[c]++;
      return { x: 0.1 + c * 0.8 / (cols - 1), y: 0.03 + k * dotStep, a: 1 };
    });
    // scatter around a line
    const r2 = rng(42), line = x => 0.12 + 0.68 * x;
    const scatter = Array.from({ length: P }, (_, i) => {
      const x = 0.06 + 0.88 * (i + r2() * 0.8) / P;
      return { x, y: clamp(line(x) + gauss(r2) * 0.07, 0.02, 0.98), a: 1 };
    });
    // Venn: dots on two overlapping circles
    const venn = Array.from({ length: P }, (_, i) => {
      const left = i < P / 2, j = left ? i : i - P / 2, th = j / (P / 2) * Math.PI * 2 + (left ? 0 : Math.PI);
      const r = 0.36, cx = 0.5 + (left ? -1 : 1) * 0.62 * r * asp;   // overlapping, as in the addition rule
      return { x: cx + r * asp * Math.cos(th), y: 0.47 + r * Math.sin(th), a: 1 };
    });

    scenes = [
      scene("normal", { curve: normal(0.5, 0.12), areas: [[0.38, 0.62], [0.62, 0.62]] }),
      scene("binomial", { bars: barsFrom(binom(10, 0.35), 0, 10) }),
      scene("poisson", { bars: barsFrom(pois(3), 0, 11) }),
      scene("exponential", { curve: x => peak * Math.exp(-4.2 * Math.max(0, x - 0.04)) * (x >= 0.04 ? 1 : 0), areas: [[0.04, 0.3], [0.3, 0.3]] }),
      scene("uniform", { curve: x => (x >= 0.22 && x <= 0.78 ? 0.42 : 0), areas: [[0.38, 0.62], [0.62, 0.62]] }),
      scene("test-mean", { curve: normal(0.5, 0.14), areas: [[0, 0.5 - 1.96 * 0.14], [0.5 + 1.96 * 0.14, 1]] }),
      scene("chi-square", { curve: x => peak * chi(4)(x) / chiTop, areas: [[9.49 / 16, 1], [1, 1]] }),
      scene("quartiles", { dots: dotplot }),
      scene("linear-regression", { curve: line, dots: scatter, lineOnly: true }),
      scene("addition-rule", { dots: venn }),
    ];
  }

  /* ---------- drawing ---------- */
  const padX = () => Math.min(48, w * 0.06), padY = () => 26;
  const ease = u => u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
  const mix = (a, b, u) => a + (b - a) * u;
  function frame(now){
    raf = requestAnimationFrame(frame);
    if (!w || !scenes.length) return;
    const span = HOLD + MORPH, el = (now - t0) % (span * scenes.length), i = Math.floor(el / span), into = el - i * span;
    const A = scenes[i], B = scenes[(i + 1) % scenes.length];
    const u = reduce ? 0 : into < HOLD ? 0 : ease((into - HOLD) / MORPH);
    draw(A, B, u);
    const cur = u < 0.5 ? A : B, op = reduce ? 1 : Math.abs(1 - 2 * u);
    if (label.dataset.id !== cur.id){ label.dataset.id = cur.id; label.href = "#/" + cur.id; label.textContent = t("nav." + cur.id); }
    label.style.opacity = (0.15 + 0.85 * op).toFixed(3);
  }
  function draw(A, B, u){
    const c = ctx, C = { accent: cssVar("--accent"), fill: cssVar("--fill"), line: cssVar("--line"), surface: cssVar("--bg") };
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const px = padX(), py = padY(), W = w - 2 * px, H = h - 2 * py;
    const X = x => px + x * W, Y = y => h - py - y * H;
    // baseline
    c.strokeStyle = C.line; c.lineWidth = 1; c.beginPath(); c.moveTo(px, Math.round(Y(0)) + .5); c.lineTo(px + W, Math.round(Y(0)) + .5); c.stroke();
    const curve = A.curve.map((y, k) => mix(y, B.curve[k], u)), ca = mix(A.ca, B.ca, u);
    const lineOnly = u < 0.5 ? A.lineOnly : B.lineOnly;
    // shaded areas under the curve
    for (let j = 0; j < 2; j++){
      const a = mix(A.areas[j][0], B.areas[j][0], u), b = mix(A.areas[j][1], B.areas[j][1], u);
      if (b - a < 1e-3 || ca < 0.02 || lineOnly) continue;
      c.save(); c.globalAlpha = ca; c.fillStyle = C.fill; c.beginPath(); c.moveTo(X(a), Y(0));
      for (let k = 0; k < M; k++){ const x = xs[k]; if (x >= a && x <= b) c.lineTo(X(x), Y(curve[k])); }
      c.lineTo(X(b), Y(0)); c.closePath(); c.fill(); c.restore();
    }
    // bars
    c.fillStyle = C.accent;
    for (let k = 0; k < K; k++){
      const a = A.bars[k], b = B.bars[k], bh = mix(a.h, b.h, u), bw = mix(a.w, b.w, u), bx = mix(a.x, b.x, u);
      if (bh * H < 0.5 || bw <= 0) continue;
      c.globalAlpha = 0.9; c.beginPath(); c.roundRect(X(bx - bw / 2), Y(bh), bw * W, bh * H, [3, 3, 0, 0]); c.fill();
    }
    c.globalAlpha = 1;
    // curve
    if (ca > 0.01){
      c.save(); c.globalAlpha = ca; c.strokeStyle = C.accent; c.lineWidth = 2.4; c.lineJoin = "round"; c.lineCap = "round";
      c.beginPath(); curve.forEach((y, k) => k ? c.lineTo(X(xs[k]), Y(y)) : c.moveTo(X(xs[k]), Y(y))); c.stroke(); c.restore();
    }
    // dots
    for (let k = 0; k < P; k++){
      const a = A.dots[k], b = B.dots[k], al = mix(a.a, b.a, u);
      if (al < 0.02) continue;
      c.globalAlpha = al; c.fillStyle = C.accent; c.strokeStyle = C.surface; c.lineWidth = 1.5;
      c.beginPath(); c.arc(X(mix(a.x, b.x, u)), Y(mix(a.y, b.y, u)), 4, 0, Math.PI * 2); c.fill(); c.stroke();
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
