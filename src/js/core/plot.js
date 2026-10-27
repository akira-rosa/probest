"use strict";
/* ============================================================
   Plot engine (reusable by every page)
   - pan: drag empty space · zoom: wheel · fit: double-click
   - handles: draggable vertical markers supplied by the page
   ============================================================ */
class Plot {
  constructor(canvas, opts){
    Object.assign(this, { c: canvas, ctx: canvas.getContext("2d"), o: opts,
      pad: { l: 50, r: 16, t: 34, b: 30 }, x0: -4, x1: 4, y0: 0, y1: 1, hover: null, drag: null, w: 0, h: 0 });
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(canvas);
    canvas.addEventListener("pointerdown", e => this.down(e));
    canvas.addEventListener("pointermove", e => this.move(e));
    canvas.addEventListener("pointerup", () => this.up());
    canvas.addEventListener("pointercancel", () => this.up());
    canvas.addEventListener("pointerleave", () => { if (!this.drag){ this.hover = null; this.o.onHover?.(null); this.draw(); } });
    canvas.addEventListener("wheel", e => this.wheel(e), { passive: false });
    canvas.addEventListener("dblclick", () => this.o.onFit?.());
  }
  destroy(){ this.ro.disconnect(); }
  resize(){
    const r = this.c.getBoundingClientRect(); this.dpr = window.devicePixelRatio || 1;
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * this.dpr); this.c.height = Math.round(r.height * this.dpr);
    this.draw();
  }
  get pw(){ return this.w - this.pad.l - this.pad.r; }
  get ph(){ return this.h - this.pad.t - this.pad.b; }
  X(x){ return this.pad.l + (x - this.x0) / (this.x1 - this.x0) * this.pw; }
  Y(y){ return this.pad.t + this.ph - (y - this.y0) / (this.y1 - this.y0) * this.ph; }
  ix(px){ return this.x0 + (px - this.pad.l) / this.pw * (this.x1 - this.x0); }
  local(e){ const r = this.c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  hit(px){
    let best = null, bd = 12;
    for (const h of (this.o.handles?.() || [])){ const d = Math.abs(this.X(h.x) - px); if (d < bd){ bd = d; best = h; } }
    return best;
  }
  down(e){
    if (e.button !== 0) return;
    const [px] = this.local(e), h = this.hit(px);
    this.c.setPointerCapture(e.pointerId);
    this.drag = h ? { type: "handle", key: h.key } : { type: "pan", px, x0: this.x0, x1: this.x1 };
    this.c.classList.add(h ? "dragging" : "panning");
  }
  move(e){
    const [px] = this.local(e);
    if (this.drag?.type === "handle") this.o.onHandle?.(this.drag.key, this.ix(px));
    else if (this.drag?.type === "pan"){
      const dx = (px - this.drag.px) / this.pw * (this.drag.x1 - this.drag.x0);
      this.x0 = this.drag.x0 - dx; this.x1 = this.drag.x1 - dx;
    } else this.c.style.cursor = this.hit(px) ? "ew-resize" : "";
    const inside = px >= this.pad.l && px <= this.w - this.pad.r;
    this.hover = inside ? this.ix(px) : null; this.o.onHover?.(this.hover);
    this.draw();
  }
  up(){ this.drag = null; this.c.classList.remove("dragging", "panning"); }
  wheel(e){
    e.preventDefault();
    const [px] = this.local(e), xm = this.ix(px), k = Math.exp(clamp(e.deltaY, -200, 200) * 0.0015);
    this.x0 = xm + (this.x0 - xm) * k; this.x1 = xm + (this.x1 - xm) * k;
    this.draw();
  }
  draw(){
    if (!this.w || !this.h) return;
    const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.w, this.h);
    this.o.draw(this);
  }
  /* ---- drawing primitives ---- */
  colors(){
    return { ink: cssVar("--ink"), muted: cssVar("--muted"), faint: cssVar("--faint"), line: cssVar("--line"),
             grid: cssVar("--grid"), accent: cssVar("--accent"), fill: cssVar("--fill"), pin: cssVar("--pin"),
             surface: cssVar("--surface"), font: cssVar("--ui") };
  }
  clip(fn){ const c = this.ctx; c.save(); c.beginPath(); c.rect(this.pad.l, this.pad.t - 1, this.pw, this.ph + 1); c.clip(); fn(c); c.restore(); }
  /* opts (all optional): xTicks / yTicks: tick values to use instead of automatic ones;
     xFmt / yFmt: v => label text. */
  grid(C, opts = {}){
    const c = this.ctx;
    const xt = opts.xTicks ? { values: opts.xTicks } : Num.ticks(this.x0, this.x1, Math.max(3, this.pw / 90));
    const yt = opts.yTicks ? { values: opts.yTicks } : Num.ticks(this.y0, this.y1, Math.max(3, this.ph / 60));
    const xd = xt.step ? Num.decimalsFor(xt.step) : 2, yd = yt.step ? Num.decimalsFor(yt.step) : 2;
    const xFmt = opts.xFmt || (v => show(v.toFixed(xd))), yFmt = opts.yFmt || (v => show(v.toFixed(yd)));
    c.lineWidth = 1; c.strokeStyle = C.grid; c.beginPath();
    for (const v of xt.values){ const x = Math.round(this.X(v)) + .5; c.moveTo(x, this.pad.t); c.lineTo(x, this.pad.t + this.ph); }
    for (const v of yt.values){ const y = Math.round(this.Y(v)) + .5; c.moveTo(this.pad.l, y); c.lineTo(this.pad.l + this.pw, y); }
    c.stroke();
    c.strokeStyle = C.line; c.beginPath();
    const by = Math.round(this.Y(this.y0)) + .5; c.moveTo(this.pad.l, by); c.lineTo(this.pad.l + this.pw, by);
    c.moveTo(this.pad.l + .5, this.pad.t); c.lineTo(this.pad.l + .5, this.pad.t + this.ph); c.stroke();
    c.fillStyle = C.muted; c.font = `11.5px ${C.font}`;
    c.textAlign = "center"; c.textBaseline = "top";
    for (const v of xt.values) c.fillText(xFmt(v), this.X(v), this.pad.t + this.ph + 8);
    c.textAlign = "right"; c.textBaseline = "middle";
    for (const v of yt.values) c.fillText(yFmt(v), this.pad.l - 8, this.Y(v));
  }
  curve(f, { color, width = 2, dash = [] }){
    this.clip(c => {
      c.beginPath(); c.setLineDash(dash); c.lineWidth = width; c.strokeStyle = color; c.lineJoin = "round";
      let first = true;
      for (let px = this.pad.l; px <= this.pad.l + this.pw; px += 1){
        const y = f(this.ix(px)); if (!isFinite(y)){ first = true; continue; }
        const py = this.Y(y); first ? c.moveTo(px, py) : c.lineTo(px, py); first = false;
      }
      c.stroke(); c.setLineDash([]);
    });
  }
  area(f, a, b, color){
    const lo = Math.max(a, this.x0), hi = Math.min(b, this.x1); if (!(hi > lo)) return;
    this.clip(c => {
      const n = Math.max(2, Math.ceil(this.X(hi) - this.X(lo)));
      c.beginPath(); c.moveTo(this.X(lo), this.Y(this.y0));
      for (let i = 0; i <= n; i++){ const x = lo + (hi - lo) * i / n; c.lineTo(this.X(x), this.Y(f(x))); }
      c.lineTo(this.X(hi), this.Y(this.y0)); c.closePath(); c.fillStyle = color; c.fill();
    });
  }
  vline(x, color, dash = [], y1 = this.y1, width = 1){
    if (x < this.x0 || x > this.x1) return;
    const c = this.ctx, px = Math.round(this.X(x)) + .5;
    c.save(); c.setLineDash(dash); c.strokeStyle = color; c.lineWidth = width;
    c.beginPath(); c.moveTo(px, this.Y(this.y0)); c.lineTo(px, this.Y(Math.min(y1, this.y1))); c.stroke(); c.restore();
  }
  pill(x, y, text, C, strong){
    const c = this.ctx; c.font = `${strong ? 600 : 500} 12px ${C.font}`;
    const w = c.measureText(text).width + 14, h = 20, l = clamp(x - w / 2, this.pad.l, this.pad.l + this.pw - w);
    c.fillStyle = strong ? C.accent : C.surface; c.strokeStyle = C.accent; c.lineWidth = 1;
    c.beginPath(); c.roundRect(l, y, w, h, 5); c.fill(); c.stroke();
    c.fillStyle = strong ? cssVar("--accent-ink") : C.accent; c.textAlign = "left"; c.textBaseline = "middle";
    c.fillText(text, l + 7, y + h / 2 + .5);
    return [l, l + w];
  }
}
