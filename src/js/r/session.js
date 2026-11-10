"use strict";
/* ============================================================
   R session: real R (webR, R compiled to WebAssembly) running in a
   background worker, with no internet.

   The built page carries the webR files in one block
   (<script type="application/octet-stream" id="r-pack">, added by
   build.js). Starting R:
     1. unpack the block (base64 → gunzip → files);
     2. start webR. webR expects to download its files from a web
        address (BASE below). Nothing is downloaded: the page answers
        webR's request for its worker script, and the files are handed
        to the worker, which answers R's own requests from memory
        (WORKER_PRELUDE);
     3. run R's real console loop: lines are sent one at a time when R
        shows its prompt ("> " or "+ "), exactly like a terminal.

   One session lives for the whole visit: leaving the R page and coming
   back keeps the workspace, the console, the plots and the history.

   Listeners get (type, data):
     "state"   — RSession.state changed
     "out"     — { kind: "stdout" | "stderr" | "echo" | "info", text, prompt? }
     "prompt"  — R is waiting at RSession.prompt
     "plot"    — the plots changed (RSession.plots: [{ image: <canvas> }], RSession.plotIndex)
     "help"    — { title, html } or { title, text }
     "view"    — { title, total, columns, rows } from View(x)
     "env"     — RSession.env changed
     "files"   — RSession.files changed
   ============================================================ */
const RSession = (() => {
  const BASE = "https://r.probest.invalid/";       // never contacted: every request is answered locally
  const MAX_LINES = 4000;                           // console lines kept

  let webR = null, starting = null, packBuf = null;
  const S = {
    state: "off",              // off | starting | ready | failed | closed | none (this file has no R)
    error: "",
    prompt: "> ",
    waiting: false,            // R is at a prompt, waiting for a line
    queue: [],                 // lines waiting to be sent to R
    transcript: [],            // console output kept between page visits
    history: [],               // lines typed in the console
    plots: [],                 // [{ image: <canvas> }], one per plot page
    plotIndex: -1,
    env: [],                   // [{ name, cls, desc, value, frame }]
    files: [],                 // [{ name, dir, size }]
    cwd: "/home/web_user",
    plotSize: [0, 0],
    width: 0,
    versions: {},
  };
  const subs = new Set();
  const emit = (type, data) => { for (const f of subs) { try { f(type, data); } catch (e) { console.error(e); } } };
  const setState = (st, error = "") => { S.state = st; S.error = error; emit("state"); };
  const out = (kind, text, prompt) => {
    const line = { kind, text, prompt };
    S.transcript.push(line);
    if (S.transcript.length > MAX_LINES) S.transcript.splice(0, S.transcript.length - MAX_LINES);
    emit("out", line);
  };

  const packEl = () => document.getElementById("r-pack");
  const available = () => !!packEl() && typeof DecompressionStream === "function";

  /* ---------- unpacking ---------- */
  async function unpack(){
    if (packBuf) return packBuf;
    const b64 = packEl().textContent.trim();
    const res = await fetch("data:application/octet-stream;base64," + b64);
    packBuf = await new Response(res.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    return packBuf;
  }
  function readPack(buf){
    const headLen = new DataView(buf).getUint32(0, true);
    const index = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, headLen)));
    const start = 4 + headLen, files = {}, texts = {};
    for (const [name, off, len] of index){
      if (name === "webr.js" || name === "webr-worker.js") texts[name] = new TextDecoder().decode(new Uint8Array(buf, start + off, len));
      else files[name] = buf.slice(start + off, start + off + len);         // a copy, handed over to the worker
    }
    return { files, texts };
  }

  /* Runs in the worker before webR's own code. The page sends the files in the first
     message; requests for BASE/<file> are then answered from them. Blob addresses must be
     made inside the worker: a page opened from disk can't share its own with the worker.
     Parts of R's file system left out of the app (manuals, translations, map data; see
     vendor/webr/README.md) are answered with an empty folder instead of an error. */
  const WORKER_PRELUDE = `(function(){
const B=${JSON.stringify(BASE)},M={};
const type=f=>f.endsWith(".wasm")?"application/wasm":f.endsWith(".js")?"text/javascript":"application/octet-stream";
const blob=(x,t)=>URL.createObjectURL(new Blob([x],{type:t||"application/octet-stream"}));
self.addEventListener("message",e=>{const d=e.data;if(d&&d.probestFiles){e.stopImmediatePropagation();
for(const k in d.probestFiles)M[k]=blob(d.probestFiles[k],type(k));}});
const EMPTY_IMAGE=blob('{"files":[],"gzip":false}',"application/json"),EMPTY=blob(new Uint8Array(0));
const map=u=>{u=String(u);if(u.startsWith(B)){const k=u.slice(B.length).split(/[?#]/)[0];if(M[k])return M[k];
if(k.endsWith(".js.metadata"))return EMPTY_IMAGE;if(k.endsWith(".data"))return EMPTY;
console.warn("R asked for a file that is not in this app: "+k);}return u;};
const f=self.fetch;self.fetch=(i,o)=>f(typeof i==="string"||i instanceof URL?map(i):i,o);
const open=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(m,u,...r){const v=map(u);if(v!==String(u)&&String(m).toUpperCase()==="HEAD")m="GET";return open.call(this,m,v,...r);};
const imp=self.importScripts;self.importScripts=(...u)=>imp(...u.map(map));
})();
`;

  function loadScript(text){
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
      s.onload = resolve; s.onerror = () => reject(new Error("webR could not be loaded"));
      document.head.appendChild(s);
    });
  }

  /* ---------- starting ---------- */
  /* The R block sits after the app's script, so wait until the page has been read. */
  const pageRead = () => document.readyState !== "loading" ? Promise.resolve()
    : new Promise(r => document.addEventListener("DOMContentLoaded", r, { once: true }));

  function start(){
    if (S.state === "ready") return Promise.resolve(true);
    if (starting) return starting;
    starting = (async () => {
      setState("starting");
      await pageRead();
      if (!available()){ starting = null; setState("none"); return false; }
      try {
        const el = packEl();
        S.versions = { r: el.dataset.r, webr: el.dataset.webr };
        const { files, texts } = readPack(await unpack());
        if (typeof WebRLib === "undefined") await loadScript(texts["webr.js"]);
        const workerUrl = URL.createObjectURL(new Blob([WORKER_PRELUDE + texts["webr-worker.js"]], { type: "text/javascript" }));

        // webR asks for BASE/webr-worker.js with XMLHttpRequest, then starts a Worker from it.
        const xhrOpen = XMLHttpRequest.prototype.open, PageWorker = window.Worker;
        XMLHttpRequest.prototype.open = function(m, u, ...r){ if (String(u) === BASE + "webr-worker.js") u = workerUrl; return xhrOpen.call(this, m, u, ...r); };
        window.Worker = function(url, opts){
          const w = new PageWorker(url, opts);
          w.postMessage({ probestFiles: files }, Object.values(files));
          return w;
        };
        try {
          webR = new WebRLib.WebR({ baseUrl: BASE, channelType: WebRLib.ChannelType.PostMessage });
          await webR.init();
        } finally {
          window.Worker = PageWorker; XMLHttpRequest.prototype.open = xhrOpen;
        }
        await webR.evalRVoid(SETUP_R);
        // sizes measured while R was starting
        if (S.plotSize[0]) await webR.evalRVoid(`assign(".size", c(${S.plotSize[0]}, ${S.plotSize[1]}), envir = as.environment("probest:tools"))`);
        if (S.width) await webR.evalRVoid(`options(width = ${S.width})`);
        S.waiting = false; S.queue.length = 0;
        readLoop(webR);
        setState("ready");
        return true;
      } catch (e){
        console.error(e);
        webR = null;
        setState("failed", e && e.message || String(e));
        return false;
      } finally {
        starting = null;
      }
    })();
    return starting;
  }

  /* R code run once at start: helpers kept out of the workspace, in an attached
     environment "probest:tools" (it also masks View() and prints help as HTML). */
  const SETUP_R = String.raw`
local({
  tools_env <- attach(NULL, name = "probest:tools")
  assign(".size", c(640, 480), envir = tools_env)
  options(device = function(...) webr::canvas(width = get(".size", envir = as.environment("probest:tools"))[1],
                                              height = get(".size", envir = as.environment("probest:tools"))[2], bg = "white"),
          help_type = "text", menu.graphics = FALSE)
  webr::pager_install()

  # help pages as HTML: written to a file and shown with file.show(), which the app receives
  links <- new.env()          # links to other help pages, per package
  help_print <- function(x, ...) {
    paths <- as.character(x)
    if (!length(paths)) {
      cat(gettextf("No documentation for %s in specified packages and libraries:", sQuote(attr(x, "topic"))), "\n",
          gettextf("you could try %s", sQuote(paste0("??", attr(x, "topic")))), "\n", sep = "")
      return(invisible(x))
    }
    p <- paths[1]
    pkg <- basename(dirname(dirname(p)))
    if (is.null(links[[pkg]])) links[[pkg]] <- tools::findHTMLlinks(dirname(dirname(p)), level = 0:1)
    f <- tempfile(fileext = ".html")
    tools::Rd2HTML(utils:::.getHelpFile(p), out = f, package = pkg, Links = links[[pkg]], stylesheet = "", dynamic = FALSE)
    writeLines(c(paste0("<!--probest:help ", pkg, "-->"), readLines(f, warn = FALSE)), f)
    file.show(f, title = attr(x, "topic"), delete.file = TRUE)
    if (length(paths) > 1)
      cat(gettextf("Help on topic %s was found in several packages; showing %s.", sQuote(attr(x, "topic")), pkg), "\n")
    invisible(x)
  }
  registerS3method("print", "help_files_with_topic", help_print, envir = asNamespace("utils"))

  # View(x): the first 1000 rows, as CSV, for the Data tab
  assign("View", function(x, title) {
    if (missing(title)) title <- paste(deparse(substitute(x))[1], collapse = "")
    if (!is.data.frame(x)) x <- as.data.frame(x)
    total <- nrow(x)
    if (total > 1000) x <- x[seq_len(1000), , drop = FALSE]
    f <- tempfile(fileext = ".csv")
    writeLines(paste0("%%probest:view%%", total, "%%", title), f)
    suppressWarnings(utils::write.table(x, f, sep = ",", qmethod = "double", col.names = NA, append = TRUE))
    file.show(f, title = title, delete.file = TRUE)
    invisible(NULL)
  }, envir = tools_env)

  # the Environment tab: name, class, short description, value
  assign(".env", function() {
    e <- globalenv()
    unlist(lapply(ls(e), function(k) {
      x <- get(k, envir = e)
      d <- if (is.data.frame(x)) sprintf("%d obs. of %d variables", nrow(x), ncol(x))
        else if (is.function(x)) ""
        else if (is.matrix(x)) sprintf("%d x %d matrix", nrow(x), ncol(x))
        else if (is.list(x)) sprintf("List of %d", length(x))
        else if (is.factor(x)) sprintf("Factor w/ %d levels", nlevels(x))
        else if (is.atomic(x) && length(x) != 1) sprintf("%s [%d]", class(x)[1], length(x))
        else if (is.atomic(x)) ""
        else class(x)[1]
      v <- if (is.function(x)) sub("\\s*NULL$", "", paste(trimws(deparse(args(x))), collapse = " "))
        else if (is.atomic(x) && length(x) == 1 && !is.factor(x)) paste(format(x), collapse = "")
        else if (is.factor(x)) paste(paste0('"', utils::head(levels(x), 6), '"'), collapse = ", ")
        else if (is.list(x) && !is.data.frame(x)) ""
        else tryCatch(paste(utils::capture.output(utils::str(x, give.attr = FALSE, give.head = FALSE, vec.len = 3, max.level = 0, nchar.max = 60)), collapse = " "), error = function(e) "")
      c(k, class(x)[1], d, substr(trimws(v), 1, 160), if (is.data.frame(x) || is.matrix(x)) "1" else "0")
    }))
  }, envir = tools_env)

  # the Files tab: the working directory
  assign(".files", function() {
    f <- setdiff(list.files(getwd(), all.files = FALSE, include.dirs = TRUE), "default.profraw")
    i <- file.info(file.path(getwd(), f))
    c(getwd(), as.vector(rbind(f, ifelse(i$isdir, "1", "0"), format(i$size, scientific = FALSE, trim = TRUE))))
  }, envir = tools_env)

  # q() would end R for good in this page: point to Restart R instead
  quit_here <- function(...) cat("To start a new, empty session use the Restart R button; q() isn't available here.\n")
  assign("q", quit_here, envir = tools_env); assign("quit", quit_here, envir = tools_env)

  # Tab completion, with R's own completion engine (as in the R terminal)
  assign(".complete", function(line) {
    utils:::.assignLinebuffer(line); utils:::.assignEnd(nchar(line))
    token <- utils:::.guessTokenFromLine(); utils:::.completeToken()
    c(token, head(utils:::.retrieveCompletions(), 200))
  }, envir = tools_env)
})
invisible(NULL)
`;

  /* ---------- the console loop ---------- */
  async function readLoop(w){
    for (;;){
      let m;
      try { m = await w.read(); } catch (e){ break; }
      if (w !== webR) break;                                  // restarted: this loop belongs to the old session
      switch (m.type){
        case "stdout": out("stdout", String(m.data)); break;
        case "stderr": out("stderr", String(m.data)); break;
        case "prompt":
          S.prompt = String(m.data); S.waiting = true;
          emit("prompt");
          if (S.queue.length) pump(); else if (S.prompt === "> ") afterRun();
          break;
        case "canvas": canvasMessage(m.data); break;
        case "pager": pagerMessage(m.data); break;
        case "closed":
          webR = null; S.waiting = false; S.queue.length = 0;
          out("info", "R session ended.");
          setState("closed");
          return;
      }
    }
  }
  function pump(){
    if (!S.waiting || !S.queue.length || !webR) return;
    const line = S.queue.shift();
    S.waiting = false;
    out("echo", line, S.prompt);
    emit("prompt");
    webR.writeConsole(line);
  }

  /* Send code to R as if typed in the console (several lines are sent one by one). */
  function run(code, { history = false } = {}){
    if (S.state === "none") return;
    const lines = String(code).replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
    if (history && code.trim()){
      S.history = S.history.filter(h => h !== code.replace(/\n+$/, "")).concat(code.replace(/\n+$/, ""));
      if (S.history.length > 500) S.history.shift();
    }
    S.queue.push(...lines);
    if (S.state !== "ready") start(); else pump();
    emit("prompt");
  }
  const busy = () => S.state === "starting" || (S.state === "ready" && (!S.waiting || S.queue.length > 0));

  /* ---------- while R is idle ---------- */
  let refreshing = false, refreshAgain = false;
  async function afterRun(){
    if (refreshing){ refreshAgain = true; return; }
    refreshing = true;
    try {
      do { refreshAgain = false; await Promise.all([refreshEnv(), refreshFiles()]); } while (refreshAgain);
    } finally { refreshing = false; }
  }
  async function strings(code){
    if (!webR) return [];
    try { return await webR.evalRRaw(code, "string[]"); } catch (e){ return []; }
  }
  async function refreshEnv(){
    const v = await strings(`get(".env", envir = as.environment("probest:tools"))()`);
    const env = [];
    for (let i = 0; i + 4 < v.length; i += 5) env.push({ name: v[i], cls: v[i + 1], desc: v[i + 2], value: v[i + 3], frame: v[i + 4] === "1" });
    S.env = env; emit("env");
  }
  async function refreshFiles(){
    const v = await strings(`get(".files", envir = as.environment("probest:tools"))()`);
    if (!v.length) return;
    S.cwd = v[0];
    const files = [];
    for (let i = 1; i + 2 < v.length; i += 3) files.push({ name: v[i], dir: v[i + 1] === "1", size: +v[i + 2] });
    files.sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name));
    S.files = files; emit("files");
  }
  const rString = s => JSON.stringify(String(s));          // a JSON string is also a valid R string

  /* Completions for the text before the cursor: { token, list } or null. */
  async function complete(before){
    if (S.state !== "ready" || !S.waiting) return null;
    const v = await strings(`get(".complete", envir = as.environment("probest:tools"))(${rString(before)})`);
    if (!v.length) return null;
    return { token: v[0], list: v.slice(1) };
  }

  /* The size new plots are drawn at (CSS pixels; drawn at twice that for sharp screens). */
  function setPlotSize(w, h){
    w = Math.max(200, Math.round(w)); h = Math.max(160, Math.round(h));
    if (S.plotSize[0] === w && S.plotSize[1] === h) return;
    S.plotSize = [w, h];
    if (webR && S.state === "ready") webR.evalRVoid(`assign(".size", c(${w}, ${h}), envir = as.environment("probest:tools"))`).catch(() => {});
  }
  /* options(width) follows the console width, so printed output fits. */
  function setWidth(chars){
    chars = clamp(Math.floor(chars), 40, 200);
    if (S.width === chars) return;
    S.width = chars;
    if (webR && S.state === "ready") webR.evalRVoid(`options(width = ${chars})`).catch(() => {});
  }

  /* ---------- plots ---------- */
  /* R's canvas device sends each drawing step as an image to paint over the page so far. */
  function canvasMessage(d){
    if (d.event === "canvasNewPage"){
      S.plots.push({ image: null });
      if (S.plots.length > 60) S.plots.shift();
      S.plotIndex = S.plots.length - 1;
      emit("plot", { fresh: true });
    } else if (d.event === "canvasImage" && d.image){
      if (!S.plots.length){ S.plots.push({ image: null }); S.plotIndex = 0; }
      const p = S.plots[S.plots.length - 1];
      if (!p.image){ p.image = document.createElement("canvas"); p.image.width = d.image.width; p.image.height = d.image.height; }
      p.image.getContext("2d").drawImage(d.image, 0, 0);
      if (d.image.close) d.image.close();
      S.plotIndex = S.plots.length - 1;
      emit("plot", {});
    }
  }
  function showPlot(i){ if (i >= 0 && i < S.plots.length){ S.plotIndex = i; emit("plot", {}); } }
  function clearPlots(){ S.plots = []; S.plotIndex = -1; emit("plot", {}); }

  /* ---------- help, View(), and other text R wants to show ---------- */
  async function pagerMessage(d){
    let text = "";
    try { text = new TextDecoder().decode(await webR.FS.readFile(d.path)); } catch (e){ return; }
    if (d.deleteFile) webR.FS.unlink(d.path).catch(() => {});
    const title = String(d.title || "").replace(/^R Help on /, "");
    if (text.startsWith("<!--probest:help")) emit("help", { title, html: text, pkg: (text.match(/^<!--probest:help (\S+)-->/) || [])[1] });
    else if (text.startsWith("%%probest:view%%")) emit("view", parseView(text));
    else emit("help", { title, text });
  }
  function parseView(text){
    const nl = text.indexOf("\n"), head = text.slice(16, nl).split("%%");
    const rows = parseCSV(text.slice(nl + 1));
    const columns = rows.shift() || [];
    return { total: +head[0], title: head.slice(1).join("%%"), columns, rows };
  }
  function parseCSV(s){
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < s.length; i++){
      const c = s[i];
      if (q){
        if (c === '"'){ if (s[i + 1] === '"'){ cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ","){ row.push(cell); cell = ""; }
      else if (c === "\n"){ row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (c !== "\r") cell += c;
    }
    if (cell || row.length){ row.push(cell); rows.push(row); }
    return rows;
  }
  /* Ask for a help page without echoing anything in the console (links in the Help tab). */
  function help(topic, pkg){
    if (!webR || S.state !== "ready") return;
    const code = `print(utils::help(${rString(topic)}${pkg ? `, package = ${rString(pkg)}` : ""}))`;
    webR.evalRVoid(code).catch(() => {});
  }
  function view(name){
    if (webR && S.state === "ready") webR.evalRVoid(`get("View", envir = as.environment("probest:tools"))(get(${rString(name)}, envir = globalenv()), ${rString(name)})`).catch(() => {});
  }

  /* ---------- files ---------- */
  async function writeFile(name, bytes){
    if (!webR) return;
    await webR.FS.writeFile(S.cwd + "/" + name, new Uint8Array(bytes));
    refreshFiles();
  }
  async function readFile(name){ return webR ? webR.FS.readFile(S.cwd + "/" + name) : null; }
  async function removeFile(name){
    if (webR) await webR.evalRVoid(`unlink(${rString(name)}, recursive = TRUE)`).catch(() => {});
    refreshFiles();
  }

  /* ---------- restart ---------- */
  async function restart(){
    if (starting) await starting;
    const old = webR; webR = null;
    if (old){ try { old.close(); } catch (e){} }
    S.waiting = false; S.queue.length = 0; S.env = []; S.files = [];
    clearPlots(); emit("env"); emit("files");
    out("info", "Restarting R…");
    setState("off");
    return start();
  }

  return {
    get state(){ return S.state; }, get error(){ return S.error; },
    get prompt(){ return S.prompt; }, get waiting(){ return S.waiting; }, get queued(){ return S.queue.length; },
    get transcript(){ return S.transcript; }, get history(){ return S.history; },
    get plots(){ return S.plots; }, get plotIndex(){ return S.plotIndex; },
    get env(){ return S.env; }, get files(){ return S.files; }, get cwd(){ return S.cwd; },
    get versions(){ return S.versions; },
    available, start, run, busy, restart, complete, setPlotSize, setWidth,
    showPlot, clearPlots, help, view, writeFile, readFile, removeFile,
    clearTranscript(){ S.transcript.length = 0; },
    on(f){ subs.add(f); return () => subs.delete(f); },
  };
})();
