"use strict";
/* ============================================================
   Page: R console — real R, offline, laid out like RStudio:
     script editor (top left) · console (bottom left)
     Environment · Plots · Help · Data · Files (right)
   The R session itself lives in js/r/session.js and survives
   leaving the page. Every "In R" box on the other pages has a
   "Run in R" button that brings its code here and runs it.
   ============================================================ */
const R_SCRIPT_KEY = "probest-r-script";
let rInbox = null;              // code sent by a "Run in R" button, run when the page opens

/* Called by the "Run in R" buttons (ui.js). */
function openInR(code){
  rInbox = code;
  if (currentId() === "r") PAGES.r.runInbox();
  else location.hash = "#/r";
}

/* R and webR versions, from the packed R block (build.js writes them there). The block is at
   the end of the page, so while the page is still loading the versions of vendor/webr are shown;
   paintStatus() puts in the packed ones once R starts. */
function rVersions(){
  const el = document.getElementById("r-pack");
  return { r: el ? el.dataset.r : "4.6.0", webr: el ? el.dataset.webr : "0.6.0" };
}

PAGES.r = function RPage(root){
  const ui = RPage.ui || (RPage.ui = { tab: "env", help: null, view: null, helpBack: [] });

  root.innerHTML = `
  <div class="page page-r">
    <header class="page-head r-head">
      <h1>${t("nav.r")}</h1>
      <span class="r-status" id="rStatus" role="status"></span>
      <span class="r-head-actions">
        <button class="btn" id="rRestart" type="button" title="${t("r.restartTitle")}">${t("r.restart")}</button>
      </span>
    </header>

    <div class="r-missing" id="rMissing" hidden></div>

    <section class="rw" id="rw">
      <div class="rw-pane rw-script">
        <div class="rw-bar">
          <span class="rw-title">${t("r.script")}</span>
          <span class="rw-actions">
            <button class="btn" id="edNew" type="button">${t("r.new")}</button>
            <button class="btn" id="edOpen" type="button">${t("r.open")}</button>
            <button class="btn" id="edSave" type="button" title="Ctrl+S">${t("r.save")}</button>
            <span class="rw-sep"></span>
            <button class="btn primary" id="edRun" type="button" title="Ctrl+Enter">${t("r.run")}</button>
            <button class="btn" id="edRunAll" type="button" title="Ctrl+Shift+Enter">${t("r.runAll")}</button>
          </span>
          <input type="file" id="edFile" accept=".R,.r,.txt,text/plain" hidden>
        </div>
        <div class="rw-ed" id="ed"></div>
      </div>

      <div class="rw-pane rw-console">
        <div class="rw-bar">
          <span class="rw-title">${t("r.console")}</span>
          <span class="rw-cwd" id="conCwd"></span>
          <span class="rw-actions"><button class="btn" id="conClear" type="button" title="Ctrl+L">${t("r.clear")}</button></span>
        </div>
        <div class="con" id="con">
          <div class="con-out" id="conOut" aria-live="polite"></div>
          <div class="con-in"><span class="con-prompt" id="conPrompt">&gt;</span><textarea id="conIn" rows="1" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="${t("r.consoleInput")}"></textarea></div>
        </div>
      </div>

      <div class="rw-pane rw-side">
        <div class="rw-bar rw-tabs" role="tablist">
          ${["env", "plots", "help", "data", "files"].map(k => `<button role="tab" type="button" data-tab="${k}" aria-selected="false">${t("r.tab." + k)}</button>`).join("")}
        </div>
        <div class="rw-tab" data-panel="env" id="envPanel"></div>
        <div class="rw-tab" data-panel="plots">
          <div class="rw-subbar">
            <button class="icon-btn" id="plPrev" type="button" aria-label="${t("r.prevPlot")}">‹</button>
            <span class="pl-count" id="plCount"></span>
            <button class="icon-btn" id="plNext" type="button" aria-label="${t("r.nextPlot")}">›</button>
            <span class="rw-actions">
              <button class="btn" id="plZoom" type="button">${t("r.zoom")}</button>
              <button class="btn" id="plSave" type="button">${t("r.savePng")}</button>
              <button class="btn" id="plClear" type="button">${t("r.clearPlots")}</button>
            </span>
          </div>
          <div class="pl-area" id="plArea"><canvas id="plCanvas" hidden></canvas><p class="rw-empty" id="plEmpty">${t("r.noPlots")}</p></div>
        </div>
        <div class="rw-tab" data-panel="help">
          <form class="rw-subbar" id="helpForm">
            <button class="icon-btn" id="helpBack" type="button" aria-label="${t("r.back")}">‹</button>
            <input class="r-field" id="helpQ" type="search" placeholder="${t("r.helpSearch")}" aria-label="${t("r.helpSearch")}" autocomplete="off" spellcheck="false">
          </form>
          <div class="help-body" id="helpBody"></div>
        </div>
        <div class="rw-tab" data-panel="data"><div class="data-head" id="dataHead"></div><div class="data-body" id="dataBody"></div></div>
        <div class="rw-tab" data-panel="files">
          <div class="rw-subbar">
            <span class="rw-cwd" id="fileCwd"></span>
            <span class="rw-actions"><button class="btn" id="fileUp" type="button">${t("r.upload")}</button></span>
            <input type="file" id="fileIn" multiple hidden>
          </div>
          <div class="files-body" id="filesBody"></div>
        </div>
      </div>
    </section>

    <section class="sections">
      <div class="sect sect-wide">
        <h2>${t("about")}</h2>
        <p class="about" id="rAbout">${t("r.about", rVersions())}</p>
        <h3>${t("goodToKnow")}</h3>
        ${listHtml(["r.note.offline", "r.note.session", "r.note.packages", "r.note.files", "r.note.stop"].map(k => t(k)), "notes")}
      </div>
      <div class="sect sect-wide">
        <h2>${t("r.keys")}</h2>
        <table class="vars-table r-keys"><tbody>
          ${[["Ctrl+Enter", "r.key.run"], ["Ctrl+Shift+Enter", "r.key.runAll"], ["Tab", "r.key.tab"], ["↑ ↓", "r.key.history"],
             ["Ctrl+L", "r.key.clear"], ["Ctrl+Shift+C", "r.key.comment"], ["Alt+−", "r.key.assign"], ["Ctrl+Shift+M", "r.key.pipe"], ["Ctrl+S", "r.key.save"]]
            .map(([k, d]) => `<tr><td class="r-kbd"><kbd>${k}</kbd></td><td class="v-desc">${t(d)}</td></tr>`).join("")}
        </tbody></table>
      </div>
      <div class="sect sect-wide"><h2>${t("sources")}</h2>${listHtml([t("r.src.webr"), t("r.src.r")], "sources")}</div>
    </section>
  </div>`;

  const statusEl = $("#rStatus", root), conOut = $("#conOut", root), conIn = $("#conIn", root), promptEl = $("#conPrompt", root);
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  if (isMac) $$("kbd", root).forEach(k => { k.textContent = k.textContent.replace(/Ctrl/g, "⌘").replace(/Alt/g, "⌥"); });

  /* ---------- status ---------- */
  function paintStatus(){
    const st = RSession.state, busy = RSession.busy();
    const label = st === "ready" ? (busy ? t("r.busy") : t("r.ready")) : st === "starting" ? t("r.starting")
      : st === "failed" ? t("r.failed") : st === "closed" ? t("r.closed") : st === "none" ? t("r.none") : t("r.off");
    statusEl.textContent = label;
    statusEl.dataset.state = st === "ready" && busy ? "busy" : st;
    if (st === "ready" && RSession.versions.r){
      statusEl.title = `R ${RSession.versions.r} · webR ${RSession.versions.webr}`;
      $("#rAbout", root).textContent = t("r.about", RSession.versions);
    }
    $("#rRestart", root).hidden = st === "none";
    const missing = $("#rMissing", root);
    missing.hidden = st !== "none" && st !== "failed";
    if (st === "none") missing.innerHTML = t("r.noneLong");
    if (st === "failed") missing.innerHTML = `${t("r.failedLong")} <code>${esc(RSession.error)}</code> <button class="btn" id="rRetry" type="button">${t("r.retry")}</button>`;
    promptEl.textContent = RSession.waiting && !RSession.queued ? RSession.prompt.trimEnd() : busy ? "" : ">";
  }

  /* ---------- console ---------- */
  const nearBottom = () => conOut.scrollHeight - conOut.scrollTop - conOut.clientHeight < 40;
  function lineEl(l){
    const d = document.createElement("div");
    d.className = "c-" + l.kind;
    if (l.kind === "echo") d.innerHTML = `<span class="c-ps">${esc(l.prompt || "> ")}</span>${highlightR(l.text)}`;
    else d.textContent = l.text === "" ? " " : l.text;
    return d;
  }
  function paintConsole(){
    conOut.textContent = "";
    const frag = document.createDocumentFragment();
    RSession.transcript.forEach(l => frag.appendChild(lineEl(l)));
    conOut.appendChild(frag);
    conOut.scrollTop = conOut.scrollHeight;
  }
  let histPos = -1, draft = "";
  function submit(){
    const code = conIn.value;
    conIn.value = ""; fitInput(); histPos = -1;
    if (RSession.state === "none") return;
    RSession.run(code, { history: true });
    conOut.scrollTop = conOut.scrollHeight;
  }
  function fitInput(){ conIn.style.height = "auto"; conIn.style.height = Math.min(conIn.scrollHeight, 160) + "px"; }
  conIn.addEventListener("input", fitInput);
  conIn.addEventListener("blur", () => Completion.close());
  conIn.addEventListener("keydown", async e => {
    if (Completion.key(e)){ e.preventDefault(); return; }
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === "Enter" && !e.shiftKey){ e.preventDefault(); submit(); return; }
    if (mod && e.key.toLowerCase() === "l"){ e.preventDefault(); clearConsole(); return; }
    if (e.key === "Escape"){ conIn.value = ""; fitInput(); return; }
    if (e.key === "Tab" && !mod){ e.preventDefault(); await Completion.complete(conIn, RSession.complete); return; }
    if (e.altKey && (e.key === "-" || e.code === "Minus")){ e.preventDefault(); typeText(conIn, " <- "); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === "m"){ e.preventDefault(); typeText(conIn, " |> "); return; }
    const h = RSession.history;
    const firstLine = !conIn.value.slice(0, conIn.selectionStart).includes("\n");
    const lastLine = !conIn.value.slice(conIn.selectionEnd).includes("\n");
    if (e.key === "ArrowUp" && firstLine && h.length){
      e.preventDefault();
      if (histPos < 0){ draft = conIn.value; histPos = h.length; }
      histPos = Math.max(0, histPos - 1); conIn.value = h[histPos]; fitInput();
    } else if (e.key === "ArrowDown" && lastLine && histPos >= 0){
      e.preventDefault();
      histPos++;
      if (histPos >= h.length){ histPos = -1; conIn.value = draft; } else conIn.value = h[histPos];
      fitInput();
    }
  });
  $("#con", root).addEventListener("mouseup", e => {
    if (!e.target.closest(".con-in") && !getSelection().toString()) conIn.focus();
  });
  function clearConsole(){ RSession.clearTranscript(); conOut.textContent = ""; }
  $("#conClear", root).addEventListener("click", clearConsole);

  /* ---------- script editor ---------- */
  const editor = RCodeEditor($("#ed", root), {
    label: t("r.script"),
    value: store.get(R_SCRIPT_KEY) ?? t("r.starter"),
    onChange: (() => { let tm = 0; return v => { clearTimeout(tm); tm = setTimeout(() => store.set(R_SCRIPT_KEY, v), 300); }; })(),
    onRun: code => { if (RSession.state !== "none") RSession.run(code); },
    onRunAll: code => { if (RSession.state !== "none" && code.trim()) RSession.run(code); },
    onSave: saveScript,
    complete: RSession.complete,
  });
  function download(name, blob){
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function saveScript(){ download("script.R", new Blob([editor.value], { type: "text/plain" })); }
  $("#edSave", root).addEventListener("click", saveScript);
  $("#edNew", root).addEventListener("click", () => { editor.value = ""; store.set(R_SCRIPT_KEY, ""); editor.focus(); });
  $("#edOpen", root).addEventListener("click", () => $("#edFile", root).click());
  $("#edFile", root).addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    editor.value = await f.text(); store.set(R_SCRIPT_KEY, editor.value); e.target.value = "";
  });
  $("#edRun", root).addEventListener("click", () => { editor.runSelection(); editor.focus(); });
  $("#edRunAll", root).addEventListener("click", () => { if (editor.value.trim() && RSession.state !== "none") RSession.run(editor.value); });

  /* ---------- tabs ---------- */
  function showTab(k){
    ui.tab = k;
    $$(".rw-tabs [data-tab]", root).forEach(b => b.setAttribute("aria-selected", b.dataset.tab === k));
    $$(".rw-tab", root).forEach(p => { p.hidden = p.dataset.panel !== k; });
    if (k === "plots") paintPlot();
  }
  $(".rw-tabs", root).addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) showTab(b.dataset.tab); });

  /* ---------- Environment ---------- */
  function paintEnv(){
    const list = RSession.env, el = $("#envPanel", root);
    if (!list.length){ el.innerHTML = `<p class="rw-empty">${t("r.emptyEnv")}</p>`; return; }
    el.innerHTML = `<table class="r-table env-table"><thead><tr><th>${t("r.name")}</th><th>${t("r.value")}</th></tr></thead><tbody>${list.map(o => `
      <tr><td class="env-name" title="${esc(o.cls)}">${esc(o.name)}</td>
      <td class="env-val"><span class="env-desc">${esc(o.desc)}</span>${o.frame
        ? ` <button class="link-btn" type="button" data-view="${esc(o.name)}">${t("r.viewData")}</button>`
        : ` <span class="env-preview">${esc(o.value)}</span>`}</td></tr>`).join("")}</tbody></table>`;
  }
  $("#envPanel", root).addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (b) RSession.view(b.dataset.view); });

  /* ---------- Plots ---------- */
  const plCanvas = $("#plCanvas", root);
  function paintPlot(){
    const plots = RSession.plots, i = RSession.plotIndex, p = plots[i];
    $("#plCount", root).textContent = plots.length ? `${i + 1} / ${plots.length}` : "";
    $("#plPrev", root).disabled = i <= 0; $("#plNext", root).disabled = i >= plots.length - 1;
    ["plZoom", "plSave", "plClear"].forEach(id => { $("#" + id, root).disabled = !plots.length; });
    const img = p && p.image;
    plCanvas.hidden = !img; $("#plEmpty", root).hidden = !!img;
    if (!img) return;
    plCanvas.width = img.width; plCanvas.height = img.height;
    plCanvas.getContext("2d").drawImage(img, 0, 0);
  }
  $("#plPrev", root).addEventListener("click", () => RSession.showPlot(RSession.plotIndex - 1));
  $("#plNext", root).addEventListener("click", () => RSession.showPlot(RSession.plotIndex + 1));
  $("#plClear", root).addEventListener("click", () => RSession.clearPlots());
  $("#plSave", root).addEventListener("click", () => plCanvas.toBlob(b => b && download(`plot-${RSession.plotIndex + 1}.png`, b), "image/png"));
  $("#plZoom", root).addEventListener("click", () => {
    if (plCanvas.hidden) return;
    const box = document.createElement("div");
    box.className = "r-zoom";
    box.innerHTML = `<img alt="" src="${plCanvas.toDataURL("image/png")}"><button class="btn" type="button">${t("r.close")}</button>`;
    const close = () => { box.remove(); removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    box.addEventListener("click", close); addEventListener("keydown", onKey);
    document.body.appendChild(box);
  });
  // new plots are drawn to fit the Plots tab (measured from the side pane, so it works while the tab is hidden)
  const side = $(".rw-side", root);
  const plotRO = new ResizeObserver(() => {
    const r = side.getBoundingClientRect(), bars = $(".rw-tabs", root).offsetHeight + 42;
    if (r.width > 50) RSession.setPlotSize(r.width - 18, r.height - bars - 18);
  });
  plotRO.observe(side);

  /* ---------- Help ---------- */
  const helpBody = $("#helpBody", root);
  function paintHelp(){
    const h = ui.help;
    $("#helpBack", root).disabled = !ui.helpBack.length;
    if (!h){ helpBody.innerHTML = `<p class="rw-empty">${t("r.helpEmpty")}</p>`; return; }
    if (h.text != null){ helpBody.innerHTML = `<pre class="help-text">${esc(h.text.replace(/_\x08/g, ""))}</pre>`; return; }
    const doc = new DOMParser().parseFromString(h.html, "text/html");
    doc.querySelectorAll("script, link, style, meta, title").forEach(n => n.remove());
    helpBody.innerHTML = `<div class="help-html">${doc.body.innerHTML}</div>`;
    helpBody.scrollTop = 0;
  }
  helpBody.addEventListener("click", e => {
    const a = e.target.closest("a"); if (!a) return;
    const href = a.getAttribute("href") || "";
    const m = href.match(/(?:\.\.\/\.\.\/([\w.]+)\/(?:html|help)\/|^)([^/#?]+)\.html(?:#.*)?$/);
    e.preventDefault();
    if (m) RSession.help(decodeURIComponent(m[2]), m[1] || (ui.help && ui.help.pkg));
    else if (/^https?:/.test(href)) window.open(href, "_blank", "noopener");
  });
  $("#helpForm", root).addEventListener("submit", e => {
    e.preventDefault();
    const q = $("#helpQ", root).value.trim();
    if (q) RSession.help(q);
  });
  $("#helpBack", root).addEventListener("click", () => {
    if (!ui.helpBack.length) return;
    ui.help = ui.helpBack.pop(); paintHelp();
  });

  /* ---------- Data (View) ---------- */
  function paintView(){
    const v = ui.view, head = $("#dataHead", root), body = $("#dataBody", root);
    if (!v){ head.textContent = ""; body.innerHTML = `<p class="rw-empty">${t("r.dataEmpty")}</p>`; return; }
    head.textContent = t(v.total > v.rows.length ? "r.dataShown" : "r.dataAll", { name: v.title, n: v.total, k: v.rows.length });
    const cols = v.columns.slice(1);
    body.innerHTML = `<table class="r-table data-table"><thead><tr><th></th>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${
      v.rows.map(r => `<tr><th>${esc(r[0])}</th>${r.slice(1).map(c => `<td>${c === "NA" ? '<span class="na">NA</span>' : esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  /* ---------- Files ---------- */
  const fmtSize = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;
  function paintFiles(){
    $("#fileCwd", root).textContent = RSession.cwd; $("#conCwd", root).textContent = RSession.cwd;
    const el = $("#filesBody", root), files = RSession.files;
    if (!files.length){ el.innerHTML = `<p class="rw-empty">${t("r.noFiles")}</p>`; return; }
    el.innerHTML = `<table class="r-table files-table"><tbody>${files.map(f => `
      <tr><td class="f-name">${f.dir ? "📁 " : ""}${esc(f.name)}</td><td class="f-size">${f.dir ? "" : fmtSize(f.size)}</td>
      <td class="f-act">${f.dir ? "" : `${/\.r$/i.test(f.name) ? `<button class="link-btn" type="button" data-open="${esc(f.name)}">${t("r.openScript")}</button>` : ""}
        <button class="link-btn" type="button" data-down="${esc(f.name)}">${t("r.download")}</button>`}
        <button class="link-btn danger" type="button" data-del="${esc(f.name)}">${t("r.delete")}</button></td></tr>`).join("")}</tbody></table>`;
  }
  $("#filesBody", root).addEventListener("click", async e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.down){ const bytes = await RSession.readFile(b.dataset.down); if (bytes) download(b.dataset.down, new Blob([bytes])); }
    if (b.dataset.open){ const bytes = await RSession.readFile(b.dataset.open); if (bytes){ editor.value = new TextDecoder().decode(bytes); store.set(R_SCRIPT_KEY, editor.value); } }
    if (b.dataset.del){
      if (b.dataset.armed){ RSession.removeFile(b.dataset.del); return; }
      b.dataset.armed = "1"; b.textContent = t("r.confirmDelete");
      setTimeout(() => { if (b.isConnected){ delete b.dataset.armed; b.textContent = t("r.delete"); } }, 3000);
    }
  });
  $("#fileUp", root).addEventListener("click", () => $("#fileIn", root).click());
  $("#fileIn", root).addEventListener("change", async e => {
    for (const f of e.target.files) await RSession.writeFile(f.name, await f.arrayBuffer());
    e.target.value = "";
  });

  /* ---------- restart ---------- */
  const restartBtn = $("#rRestart", root);
  restartBtn.addEventListener("click", () => {
    if (!restartBtn.dataset.armed){
      restartBtn.dataset.armed = "1"; restartBtn.textContent = t("r.restartConfirm");
      setTimeout(() => { if (restartBtn.isConnected){ delete restartBtn.dataset.armed; restartBtn.textContent = t("r.restart"); } }, 3000);
      return;
    }
    delete restartBtn.dataset.armed; restartBtn.textContent = t("r.restart");
    RSession.restart();
  });
  root.addEventListener("click", e => { if (e.target.id === "rRetry") RSession.start(); });

  /* ---------- session events ---------- */
  const off = RSession.on((type, data) => {
    if (type === "out"){ const stick = nearBottom(); conOut.appendChild(lineEl(data)); if (conOut.childElementCount > 4000) conOut.firstChild.remove(); if (stick || data.kind === "echo") conOut.scrollTop = conOut.scrollHeight; }
    else if (type === "state" || type === "prompt"){ paintStatus(); if (type === "state" && RSession.state === "ready") runInbox(); }
    else if (type === "plot"){ if (data && data.fresh) showTab("plots"); else if (ui.tab === "plots") paintPlot(); }
    else if (type === "env") paintEnv();
    else if (type === "files") paintFiles();
    else if (type === "help"){ if (ui.help) ui.helpBack.push(ui.help); if (ui.helpBack.length > 30) ui.helpBack.shift(); ui.help = data; paintHelp(); showTab("help"); }
    else if (type === "view"){ ui.view = data; paintView(); showTab("data"); }
  });

  // options(width) follows the console's width
  const conRO = new ResizeObserver(() => {
    const w = conOut.clientWidth; if (w < 50) return;
    RSession.setWidth((w - 16) / charBox(conIn).w);
  });
  conRO.observe(conOut);

  function runInbox(){
    if (rInbox == null || RSession.state === "none") return;
    const code = rInbox; rInbox = null;
    RSession.run(code);
    conIn.focus();
  }
  PAGES.r.runInbox = runInbox;

  paintConsole(); paintStatus(); paintEnv(); paintHelp(); paintView(); paintFiles(); showTab(ui.tab);
  RSession.start().then(ok => { if (ok) runInbox(); });
  if (!rInbox) conIn.focus({ preventScroll: true });

  return () => { off(); plotRO.disconnect(); conRO.disconnect(); Completion.close(); };
};
