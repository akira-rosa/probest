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
