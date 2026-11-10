"use strict";
/* ============================================================
   R code editing: syntax highlighting, the script editor and Tab
   completion (used by the editor and the console).

   The editor is a <textarea> (so typing, selection, undo, copy and
   paste are the browser's own) over a highlighted copy of the same
   text. Keys follow RStudio:
     Ctrl+Enter          run the selection, or the current statement
     Ctrl+Shift+Enter    run the whole script
     Tab / Shift+Tab     complete a name; indent / outdent the selection
     Ctrl+Shift+C        comment / uncomment lines
     Alt+-               insert " <- "      Ctrl+Shift+M   insert " |> "
     Ctrl+S              save the script
   (Cmd instead of Ctrl on a Mac.)
   ============================================================ */
const R_KEYWORDS = new Set(["if", "else", "repeat", "while", "function", "for", "in", "next", "break",
  "TRUE", "FALSE", "NULL", "Inf", "NaN", "NA", "NA_integer_", "NA_real_", "NA_character_", "NA_complex_"]);

/* Split R code into [type, text] tokens. Unfinished strings run to the end. */
function tokenizeR(code){
  const toks = [], n = code.length;
  let i = 0;
  const isId = c => /[A-Za-z0-9._À-￿]/.test(c);
  while (i < n){
    const c = code[i];
    if (c === "#"){ let j = code.indexOf("\n", i); if (j < 0) j = n; toks.push(["cmt", code.slice(i, j)]); i = j; continue; }
    if (c === '"' || c === "'" || c === "`"){
      let j = i + 1;
      while (j < n && code[j] !== c){ if (code[j] === "\\") j++; j++; }
      toks.push([c === "`" ? "id" : "str", code.slice(i, j + 1)]); i = j + 1; continue;
    }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(code[i + 1] || ""))){
      const m = code.slice(i).match(/^(0[xX][0-9a-fA-F]+|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)[Li]?/);
      toks.push(["num", m[0]]); i += m[0].length; continue;
    }
    if (isId(c)){
      let j = i; while (j < n && isId(code[j])) j++;
      const w = code.slice(i, j);
      let k = j; while (k < n && (code[k] === " " || code[k] === "\t")) k++;
      toks.push([R_KEYWORDS.has(w) ? "kw" : code[k] === "(" ? "fn" : "id", w]); i = j; continue;
    }
    if (c === "%"){ const j = code.indexOf("%", i + 1); if (j > 0 && !code.slice(i, j).includes("\n")){ toks.push(["op", code.slice(i, j + 1)]); i = j + 1; continue; } }
    const op = code.slice(i).match(/^(<<-|->>|<-|->|\|>|==|!=|<=|>=|&&|\|\||::|[-+*/^<>=!&|~?:$@])/);
    if (op){ toks.push(["op", op[0]]); i += op[0].length; continue; }
    let j = i + 1; while (j < n && !/[#"'`0-9A-Za-z._%<>=!&|~?:$@+*/^-]/.test(code[j]) && !/[À-￿]/.test(code[j])) j++;
    toks.push(["", code.slice(i, j)]); i = j;
  }
  return toks;
}
const highlightR = code => tokenizeR(code).map(([t, s]) => t ? `<span class="t-${t}">${esc(s)}</span>` : esc(s)).join("");

/* Bracket depth and "the line continues" for each line, to find whole statements. */
function lineInfo(lines){
  let depth = 0;
  return lines.map(line => {
    const start = depth;
    const code = tokenizeR(line).filter(([t]) => t !== "cmt");
    for (const [t, s] of code) if (!t) for (const ch of s){ if ("([{".includes(ch)) depth++; else if (")]}".includes(ch)) depth = Math.max(0, depth - 1); }
    const last = code.map(x => x[1]).join("").trimEnd();
    const cont = /(<-|<<-|=|\+|-|\*|\/|\^|,|\||&|\|>|%[^%]*%|~|\(|\[|\{)$/.test(last);
    return { start, end: depth, cont, blank: !last.trim() };
  });
}
/* The statement around line i: [first, last] line numbers. */
function statementAt(lines, i){
  const info = lineInfo(lines);
  let first = i;
  while (first > 0 && (info[first].start > 0 || info[first - 1].cont || /^\s*else\b/.test(lines[first]))) first--;
  let last = first;
  while (last < lines.length - 1 && (info[last].end > 0 || info[last].cont || /^\s*else\b/.test(lines[last + 1] || ""))) last++;
  return [first, Math.max(last, i)];
}

/* Type text at the cursor so that Ctrl+Z can undo it. */
function typeText(ta, text){
  ta.focus();
  let ok = false;
  try { ok = document.execCommand("insertText", false, text); } catch (e){}
  if (!ok){
    ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/* Size of one character of the textarea's monospace font. */
function charBox(ta){
  const cs = getComputedStyle(ta), probe = document.createElement("span");
  probe.textContent = "M".repeat(20);
  probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
  for (const k of ["fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing", "fontVariantLigatures"]) probe.style[k] = cs[k];
  document.body.appendChild(probe);
  const w = probe.getBoundingClientRect().width / 20;
  probe.remove();
  return { w, h: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5 };
}

/* ---------- Tab completion ----------
   complete(ta, getList): getList(textBeforeCursor) → { token, list } (from R).
   One match is inserted; several open a list under the cursor (arrows, Enter/Tab, Esc). */
const Completion = (() => {
  let box = null, state = null;
  function close(){ if (box){ box.remove(); box = null; } state = null; }
  function accept(i){
    if (!state) return;
    const { ta, token, list } = state, word = list[i];
    close();
    ta.setSelectionRange(ta.selectionStart - token.length, ta.selectionStart);
    typeText(ta, word);
  }
  function paint(){
    box.innerHTML = state.list.map((w, i) => `<li role="option" data-i="${i}"${i === state.sel ? ' aria-selected="true"' : ""}>${esc(w)}</li>`).join("");
    const cur = box.querySelector('[aria-selected="true"]'); if (cur) cur.scrollIntoView({ block: "nearest" });
  }
  async function complete(ta, getList){
    const before = ta.value.slice(0, ta.selectionStart).split("\n").pop();
    if (!/[A-Za-z0-9._$@:"'\/]$/.test(before)) return false;
    const res = await getList(before);
    if (!res || !res.list.length) return true;
    const { token, list } = res;
    if (list.length === 1){ ta.setSelectionRange(ta.selectionStart - token.length, ta.selectionStart); typeText(ta, list[0]); return true; }
    let common = list[0];
    for (const w of list) while (!w.startsWith(common)) common = common.slice(0, -1);
    if (common.length > token.length){ ta.setSelectionRange(ta.selectionStart - token.length, ta.selectionStart); typeText(ta, common); return true; }
    // a list under the cursor
    const ch = charBox(ta), r = ta.getBoundingClientRect(), cs = getComputedStyle(ta);
    const lines = ta.value.slice(0, ta.selectionStart).split("\n");
    const x = r.left + parseFloat(cs.paddingLeft) + (lines[lines.length - 1].length - token.length) * ch.w - ta.scrollLeft;
    const y = r.top + parseFloat(cs.paddingTop) + lines.length * ch.h - ta.scrollTop;
    close();
    state = { ta, token, list, sel: 0 };
    box = document.createElement("ul");
    box.className = "r-complete"; box.setAttribute("role", "listbox");
    const below = y + 220 < innerHeight;
    box.style.cssText = `left:${Math.max(4, Math.min(x, innerWidth - 260))}px;${below ? `top:${y + 2}px` : `bottom:${innerHeight - y + ch.h + 2}px`}`;
    document.body.appendChild(box);
    box.addEventListener("mousedown", e => { const li = e.target.closest("li"); if (li){ e.preventDefault(); accept(+li.dataset.i); } });
    paint();
    return true;
  }
  /* Keys while the list is open; returns true when the key was used. */
  function key(e){
    if (!state) return false;
    if (e.key === "ArrowDown" || e.key === "ArrowUp"){ state.sel = (state.sel + (e.key === "ArrowDown" ? 1 : -1) + state.list.length) % state.list.length; paint(); return true; }
    if (e.key === "Enter" || e.key === "Tab"){ accept(state.sel); return true; }
    if (e.key === "Escape"){ close(); return true; }
    close(); return false;
  }
  addEventListener("blur", close);
  document.addEventListener("scroll", close, true);
  return { complete, key, close, get open(){ return !!state; } };
})();

/* ---------- the script editor ----------
   opts: { value, label, onChange(text), onRun(code), onRunAll(code), onSave(), complete(before) } */
function RCodeEditor(host, opts){
  host.innerHTML = `<div class="ed">
    <div class="ed-gutter" aria-hidden="true"><div class="ed-nums"></div></div>
    <div class="ed-body">
      <pre class="ed-hl" aria-hidden="true"><code></code></pre>
      <textarea class="ed-input" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" wrap="off" aria-label="${esc(opts.label || "")}"></textarea>
    </div>
  </div>`;
  const ta = $(".ed-input", host), code = $(".ed-hl code", host), hl = $(".ed-hl", host), nums = $(".ed-nums", host);
  ta.value = opts.value || "";
  let lineCount = 0, raf = 0;

  function paint(){
    raf = 0;
    code.innerHTML = highlightR(ta.value) + "\n";
    const n = ta.value.split("\n").length;
    if (n !== lineCount){ lineCount = n; nums.textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n"); }
    sync();
  }
  function sync(){
    hl.style.transform = `translate(${-ta.scrollLeft}px,${-ta.scrollTop}px)`;
    nums.style.transform = `translateY(${-ta.scrollTop}px)`;
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };

  const lineStartAt = p => ta.value.lastIndexOf("\n", p - 1) + 1;
  const lineEndAt = p => { const i = ta.value.indexOf("\n", p); return i < 0 ? ta.value.length : i; };
  /* Select whole lines of the selection, replace them with fn(lines), keep them selected. */
  function editLines(fn){
    const a = lineStartAt(ta.selectionStart);
    const b = lineEndAt(ta.selectionEnd > ta.selectionStart && ta.value[ta.selectionEnd - 1] === "\n" ? ta.selectionEnd - 1 : ta.selectionEnd);
    const text = fn(ta.value.slice(a, b).split("\n")).join("\n");
    ta.setSelectionRange(a, b); typeText(ta, text); ta.setSelectionRange(a, a + text.length);
  }
  function toggleComment(){
    editLines(lines => {
      const code = lines.filter(l => l.trim());
      const all = code.length && code.every(l => /^\s*#/.test(l));
      return lines.map(l => !l.trim() ? l : all ? l.replace(/^(\s*)# ?/, "$1") : l.replace(/^(\s*)/, "$1# "));
    });
  }

  /* The code Ctrl+Enter runs: the selection, or the statement at the cursor (the cursor then moves on). */
  function chunkToRun(){
    if (ta.selectionEnd > ta.selectionStart) return ta.value.slice(ta.selectionStart, ta.selectionEnd);
    const lines = ta.value.split("\n");
    let i = ta.value.slice(0, ta.selectionStart).split("\n").length - 1;
    while (i < lines.length && !lines[i].trim()) i++;
    if (i >= lines.length) return "";
    const [first, last] = statementAt(lines, i);
    let next = last + 1;
    while (next < lines.length && !lines[next].trim()) next++;
    const pos = next < lines.length ? lines.slice(0, next).join("\n").length + 1 : ta.value.length;
    ta.setSelectionRange(pos, pos);
    keepCaretVisible();
    return lines.slice(first, last + 1).join("\n");
  }
  function keepCaretVisible(){
    const ch = charBox(ta), line = ta.value.slice(0, ta.selectionStart).split("\n").length - 1;
    const y = line * ch.h;
    if (y < ta.scrollTop) ta.scrollTop = y;
    else if (y + ch.h * 2 > ta.scrollTop + ta.clientHeight) ta.scrollTop = y + ch.h * 2 - ta.clientHeight;
  }

  ta.addEventListener("input", () => { schedule(); opts.onChange && opts.onChange(ta.value); });
  ta.addEventListener("scroll", sync);
  ta.addEventListener("blur", () => Completion.close());
  ta.addEventListener("keydown", async e => {
    if (Completion.key(e)){ e.preventDefault(); return; }
    const mod = e.ctrlKey || e.metaKey, k = e.key;
    if (mod && k === "Enter"){
      e.preventDefault();
      if (e.shiftKey) opts.onRunAll && opts.onRunAll(ta.value);
      else { const c = chunkToRun(); if (c.trim()) opts.onRun && opts.onRun(c); }
      return;
    }
    if (mod && e.shiftKey && k.toLowerCase() === "c"){ e.preventDefault(); toggleComment(); return; }
    if (mod && e.shiftKey && k.toLowerCase() === "m"){ e.preventDefault(); typeText(ta, " |> "); return; }
    if (e.altKey && (k === "-" || e.code === "Minus")){ e.preventDefault(); typeText(ta, " <- "); return; }
    if (mod && !e.shiftKey && k.toLowerCase() === "s"){ e.preventDefault(); opts.onSave && opts.onSave(); return; }
    if (k === "Tab" && !mod && !e.altKey){
      e.preventDefault();
      const multi = ta.value.slice(ta.selectionStart, ta.selectionEnd).includes("\n");
      if (e.shiftKey) { editLines(lines => lines.map(l => l.replace(/^( {1,2}|\t)/, ""))); return; }
      if (multi){ editLines(lines => lines.map(l => l.trim() ? "  " + l : l)); return; }
      if (ta.selectionStart === ta.selectionEnd && opts.complete && await Completion.complete(ta, opts.complete)) return;
      typeText(ta, "  ");
      return;
    }
    if (k === "Enter" && !mod && !e.shiftKey && !e.altKey){
      e.preventDefault();
      const p = ta.selectionStart, line = ta.value.slice(lineStartAt(p), p);
      const indent = line.match(/^\s*/)[0], opener = /[{(\[]\s*$/.test(line);
      const closer = opener && /^\s*[)}\]]/.test(ta.value.slice(p, lineEndAt(p)));
      const inner = indent + (opener ? "  " : "");
      if (closer){ typeText(ta, "\n" + inner + "\n" + indent); const q = ta.selectionStart - indent.length - 1; ta.setSelectionRange(q, q); }
      else typeText(ta, "\n" + inner);
      return;
    }
    if (k === "}" && !mod){
      const p = ta.selectionStart, a = lineStartAt(p), before = ta.value.slice(a, p);
      if (/^\s+$/.test(before) && ta.selectionStart === ta.selectionEnd){
        e.preventDefault();
        ta.setSelectionRange(a, p); typeText(ta, before.slice(0, Math.max(0, before.length - 2)) + "}");
      }
    }
  });
  paint();

  return {
    textarea: ta,
    get value(){ return ta.value; },
    set value(v){ ta.value = v; ta.setSelectionRange(0, 0); ta.scrollTop = 0; paint(); },
    focus(){ ta.focus(); },
    runSelection(){ const c = chunkToRun(); if (c.trim()) opts.onRun && opts.onRun(c); },
  };
}
