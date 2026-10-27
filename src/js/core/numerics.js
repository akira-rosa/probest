"use strict";
/* ============================================================
   Numerics (shared by every page)
   ============================================================ */
const Num = {
  SQRT2PI: Math.sqrt(2 * Math.PI),
  normPdf(x, m = 0, s = 1){ const z = (x - m) / s; return Math.exp(-0.5 * z * z) / (s * Num.SQRT2PI); },
  /* Standard normal CDF, Hart (1968) double-precision approximation via West (2005). */
  Phi(x){
    const ax = Math.abs(x); let c;
    if (ax > 37) c = 0;
    else {
      const e = Math.exp(-ax * ax / 2);
      if (ax < 7.07106781186547){
        let b = 3.52624965998911e-02 * ax + 0.700383064443688;
        b = b * ax + 6.37396220353165; b = b * ax + 33.912866078383; b = b * ax + 112.079291497871;
        b = b * ax + 221.213596169931; b = b * ax + 220.206867912376;
        c = e * b;
        b = 8.83883476483184e-02 * ax + 1.75566716318264;
        b = b * ax + 16.064177579207; b = b * ax + 86.7807322029461; b = b * ax + 296.564248779674;
        b = b * ax + 637.333633378831; b = b * ax + 793.826512519948; b = b * ax + 440.413735824752;
        c = c / b;
      } else {
        let b = ax + 0.65; b = ax + 4 / b; b = ax + 3 / b; b = ax + 2 / b; b = ax + 1 / b;
        c = e / b / 2.506628274631;
      }
    }
    return x > 0 ? 1 - c : c;
  },
  /* Inverse standard normal CDF: Acklam's algorithm + one Halley refinement step. */
  PhiInv(p){
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const lo = 0.02425, hi = 1 - lo; let x, q, r;
    if (p < lo){ q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    } else if (p <= hi){ q = p - 0.5; r = q * q;
      x = (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    } else { q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
    const e = Num.Phi(x) - p, u = e * Num.SQRT2PI * Math.exp(x * x / 2);
    return x - u / (1 + x * u / 2);
  },
  niceStep(range, target = 6){
    const raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  },
  ticks(a, b, target){
    const s = Num.niceStep(b - a, target), out = [];
    for (let v = Math.ceil(a / s) * s; v <= b + s * 1e-9; v += s) out.push(Math.abs(v) < s * 1e-9 ? 0 : v);
    return { step: s, values: out };
  },
  decimalsFor(step){ return clamp(-Math.floor(Math.log10(step) + 1e-9), 0, 8); }
};

/* ---------- Student's t ---------- */
Object.assign(Num, {
  /* log Γ(x), Lanczos approximation (g = 7, n = 9). */
  lgamma(x){
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - Num.lgamma(1 - x);
    x -= 1; let a = c[0]; const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  },
  /* Regularized incomplete beta I_x(a, b), continued fraction (Numerical Recipes betacf). */
  ibeta(x, a, b){
    if (x <= 0) return 0; if (x >= 1) return 1;
    const front = Math.exp(Num.lgamma(a + b) - Num.lgamma(a) - Num.lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x > (a + 1) / (a + b + 2)) return 1 - Num.ibeta(1 - x, b, a);
    const TINY = 1e-300; let f = 1, C = 1, D = 1 - (a + b) * x / (a + 1);
    D = 1 / (Math.abs(D) < TINY ? TINY : D); f = D;
    for (let m = 1; m <= 300; m++){
      for (const num of [m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m)), -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1))]){
        D = 1 + num * D; D = 1 / (Math.abs(D) < TINY ? TINY : D);
        C = 1 + num / C; if (Math.abs(C) < TINY) C = TINY;
        f *= C * D;
      }
      if (Math.abs(C * D - 1) < 1e-15) break;
    }
    return front * f / a;
  },
  /* P(T ≤ t) for Student's t with df degrees of freedom. */
  tCdf(t, df){
    const tail = 0.5 * Num.ibeta(df / (df + t * t), df / 2, 0.5);
    return t >= 0 ? 1 - tail : tail;
  },
  tPdf(t, df){
    return Math.exp(Num.lgamma((df + 1) / 2) - Num.lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - (df + 1) / 2 * Math.log(1 + t * t / df));
  },
  /* Inverse of tCdf: Newton steps from the normal quantile, bisection as a safety net. */
  tInv(p, df){
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    let x = Num.PhiInv(p), lo = -1e4, hi = 1e4;
    for (let i = 0; i < 100; i++){
      const f = Num.tCdf(x, df) - p;
      if (Math.abs(f) < 1e-14) break;
      f > 0 ? (hi = x) : (lo = x);
      let nx = x - f / Num.tPdf(x, df);
      if (!(nx > lo && nx < hi)) nx = (lo + hi) / 2;
      x = nx;
    }
    return x;
  },
});

/* ---------- counting ---------- */
Object.assign(Num, {
  /* log of the binomial coefficient C(n, k), exact enough for any n. */
  lchoose(n, k){ return k < 0 || k > n ? -Infinity : Num.lgamma(n + 1) - Num.lgamma(k + 1) - Num.lgamma(n - k + 1); },
  /* C(n, k) as a whole number (exact for small n). */
  choose(n, k){
    if (k < 0 || k > n) return 0; k = Math.min(k, n - k);
    let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return Math.round(r);
  },
});

/* ---------- chi-square (through the regularized incomplete gamma function) ---------- */
Object.assign(Num, {
  /* P(a, x): regularized lower incomplete gamma, by series or continued fraction (Numerical Recipes). */
  gammaP(a, x){
    if (x <= 0) return 0;
    const lg = Num.lgamma(a);
    if (x < a + 1){
      let sum = 1 / a, del = sum, ap = a;
      for (let i = 0; i < 1000; i++){ ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
      return Math.min(1, sum * Math.exp(-x + a * Math.log(x) - lg));
    }
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (let i = 1; i < 1000; i++){
      const an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return Math.max(0, 1 - Math.exp(-x + a * Math.log(x) - lg) * h);
  },
  chiCdf(x, df){ return x <= 0 ? 0 : Num.gammaP(df / 2, x / 2); },
  chiPdf(x, df){
    if (x < 0) return 0;
    if (x === 0) return df === 2 ? 0.5 : df < 2 ? Infinity : 0;
    return Math.exp((df / 2 - 1) * Math.log(x) - x / 2 - (df / 2) * Math.LN2 - Num.lgamma(df / 2));
  },
  /* Inverse of chiCdf by bisection on a bracket that is widened as needed. */
  chiInv(p, df){
    if (p <= 0) return 0; if (p >= 1) return Infinity;
    let lo = 0, hi = Math.max(1, df);
    while (Num.chiCdf(hi, df) < p) hi *= 2;
    for (let i = 0; i < 200; i++){ const m = (lo + hi) / 2; Num.chiCdf(m, df) < p ? lo = m : hi = m; if (hi - lo < 1e-12 * Math.max(1, hi)) break; }
    return (lo + hi) / 2;
  },
});
