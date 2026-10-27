"use strict";
/* ============================================================
   Free-form canvas for diagrams that are not x–y graphs
   (Venn diagram, Bayes mosaic). Handles size, pixel ratio and
   pointer dragging; the page draws everything itself.

     const b = new Board(canvas, {
       draw(b) { … b.ctx, b.w, b.h … },
       hit(x, y)  → a drag target or null      (cursor "grab" over it)
       drag(target, x, y, dx, dy)              while dragging (pixels)
       click(x, y)                             tap without moving
     });
   ============================================================ */
class Board {
  constructor(canvas, opts){
    Object.assign(this, { c: canvas, ctx: canvas.getContext("2d"), o: opts, w: 0, h: 0, dragging: null });
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(canvas);
    canvas.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      const [x, y] = this.local(e), t = this.o.hit?.(x, y);
      this.dragging = { t, x0: x, y0: y, moved: false };
      if (t){ canvas.setPointerCapture(e.pointerId); canvas.classList.add("dragging"); e.preventDefault(); }
    });
    canvas.addEventListener("pointermove", e => {
      const [x, y] = this.local(e), d = this.dragging;
      if (d?.t){
        if (Math.abs(x - d.x0) + Math.abs(y - d.y0) > 2) d.moved = true;
        this.o.drag?.(d.t, x, y, x - d.x0, y - d.y0); this.draw();
      } else if (!d) canvas.style.cursor = this.o.hit?.(x, y) ? "grab" : (this.o.click ? "pointer" : "");
    });
    const end = e => {
      const d = this.dragging; this.dragging = null; canvas.classList.remove("dragging");
      if (d && !d.moved && e?.type === "pointerup"){ const [x, y] = this.local(e); this.o.click?.(x, y); }
      this.o.end?.(); this.draw();
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", () => end());
  }
  destroy(){ this.ro.disconnect(); }
  local(e){ const r = this.c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  resize(){
    const r = this.c.getBoundingClientRect(); this.dpr = window.devicePixelRatio || 1;
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * this.dpr); this.c.height = Math.round(r.height * this.dpr);
    this.draw();
  }
  draw(){
    if (!this.w || !this.h) return;
    const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.w, this.h);
    this.o.draw(this);
  }
  colors(){
    return { ink: cssVar("--ink"), muted: cssVar("--muted"), faint: cssVar("--faint"), line: cssVar("--line"),
             grid: cssVar("--grid"), accent: cssVar("--accent"), fill: cssVar("--fill"), soft: cssVar("--accent-soft"),
             pin: cssVar("--pin"), bar: cssVar("--bar"), surface: cssVar("--surface"), bg: cssVar("--bg"),
             accentInk: cssVar("--accent-ink"), font: cssVar("--ui") };
  }
  /* text helper: c.text("…", x, y, { align, base, size, weight, color }) */
  text(s, x, y, { align = "center", base = "middle", size = 12.5, weight = 500, color } = {}){
    const c = this.ctx; c.font = `${weight} ${size}px ${cssVar("--ui")}`;
    c.textAlign = align; c.textBaseline = base; c.fillStyle = color || cssVar("--ink"); c.fillText(s, x, y);
    return c.measureText(s).width;
  }
}

/* ---------- probabilities typed as decimals or fractions ("0.3", "0,3", "1/6") ---------- */
function parseProb(str){
  const s = String(str ?? "").trim();
  const m = s.match(/^([^/]+)\/([^/]+)$/);
  if (m){ const a = parseNum(m[1]), b = parseNum(m[2]); return a != null && b ? a / b : null; }
  return parseNum(s);
}
/* A probability as MathML: a fraction stays a fraction, a decimal is shown with up to 4 decimals. */
function probMath(raw, v = parseProb(raw)){
  const m = String(raw ?? "").trim().match(/^([^/]+)\/([^/]+)$/);
  if (m) return M.frac(M.n(trim(parseNum(m[1]), 6)), M.n(trim(parseNum(m[2]), 6)));
  return M.n(trim(v, 4));
}
/* Text for an input: fractions as typed, decimals in the language's format. */
const probIn = raw => /\//.test(String(raw)) ? String(raw) : loc(String(raw));
/* Number shown for a probability in results: 4 decimals, trailing zeros removed. */
const pShow = v => show(trim(v, 4));
