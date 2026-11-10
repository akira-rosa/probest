#!/usr/bin/env node
/*
  Build: join src/ into one self-contained HTML file.

    node build.js              -> dist/probest.html (minified)
    node build.js --pretty     -> the same file, not minified (readable, for debugging)
    node build.js --watch      -> rebuild whenever a file in src/ changes
    node build.js --no-r       -> leave R out (a light file; the R console page says so)
    node build.js --out x.html -> choose the output file

  How it works: src/index.html lists every stylesheet (<link rel="stylesheet">)
  and script (<script src>) in load order. Each local file is read and inlined
  in that same order: all CSS into one <style>, all JS into one <script>.
  HTML comments in src/index.html are dropped. Then the CSS and JS are
  minified (minify.js): comments and whitespace are removed and variables,
  parameters and functions get short names in the built file. The source
  files are never changed. No dependencies, Node 16+.

  R: the R console page runs real R (webR, R compiled to WebAssembly) with
  no internet. The webR files in vendor/webr/ are packed into the page as
  one gzip'd, base64 block (<script type="application/octet-stream"
  id="r-pack">), which src/js/r/session.js unpacks when R starts.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { minifyJS, minifyCSS, shortenNames } = require("./minify.js");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const ENTRY = path.join(SRC, "index.html");

const args = process.argv.slice(2);
const watch = args.includes("--watch") || args.includes("-w");
const pretty = args.includes("--pretty");
const withR = !args.includes("--no-r");
const outArg = args.indexOf("--out");
const OUT = path.resolve(ROOT, outArg >= 0 && args[outArg + 1] ? args[outArg + 1] : "dist/probest.html");

const isLocal = href => !/^([a-z]+:)?\/\//i.test(href) && !href.startsWith("data:");
const rel = p => path.relative(ROOT, p).split(path.sep).join("/");

function read(file, from){
  const full = path.resolve(SRC, file);
  if (!fs.existsSync(full)) throw new Error(`${file} is listed in ${rel(from)} but does not exist`);
  return fs.readFileSync(full, "utf8").replace(/^\uFEFF/, "").trimEnd();
}

/* The version shown in the app (src/js/core/app-info.js) must match package.json. */
function checkVersion(){
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
  const info = fs.readFileSync(path.join(SRC, "js/core/app-info.js"), "utf8").match(/version:\s*"([^"]+)"/);
  if (!info) throw new Error("no version found in src/js/core/app-info.js");
  if (info[1] !== pkg) throw new Error(`version mismatch: package.json has ${pkg}, src/js/core/app-info.js has ${info[1]}`);
  return pkg;
}

function build(){
  const started = Date.now();
  const version = checkVersion();
  let html = fs.readFileSync(ENTRY, "utf8");

  // 1. Drop HTML comments (developer notes, grouping labels).
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  if (!pretty) html = html.replace(/\n[ \t]+/g, "\n");          // indentation of the page skeleton

  // 2. Stylesheets -> one <style> where the first <link> was.
  const css = [];
  html = html.replace(/[ \t]*<link\b[^>]*\brel=["']stylesheet["'][^>]*>[ \t]*\r?\n?/gi, tag => {
    const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1];
    if (!href || !isLocal(href)) return tag;               // keep remote stylesheets as they are
    css.push(`/* ---- ${href} ---- */\n` + read(href, ENTRY));
    return css.length === 1 ? "@@STYLES@@\n" : "";
  });

  // 3. Scripts -> one <script> where the first <script src> was.
  const js = [];
  html = html.replace(/[ \t]*<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>[ \t]*\r?\n?/gi, (tag, src) => {
    if (!isLocal(src)) return tag;
    js.push(`/* ---- ${src} ---- */\n` + read(src, ENTRY));
    return js.length === 1 ? "@@SCRIPTS@@\n" : "";
  });

  // Minify (or not), then inline. Inline text must not close its own tag early.
  let cssText = css.join("\n\n"), jsText = js.join("\n\n");
  if (!pretty){
    cssText = minifyCSS(cssText);
    // each file is minified on its own; ";" keeps them apart whatever they end with
    jsText = js.map(f => minifyJS(f)).join(";\n");
    const short = shortenNames(jsText);
    if (short.code) jsText = short.code;
    else console.warn(`Note: names were not shortened (${short.error}); the file still works, it is just larger.`);
  }
  const style = `<style>\n${cssText.replace(/<\/style/gi, "<\\/style")}\n</style>`;
  const script = `<script>\n${jsText.replace(/<\/script/gi, "<\\/script")}\n</script>`;
  html = html.replace("@@STYLES@@", () => style).replace("@@SCRIPTS@@", () => script);

  // 4. Tidy blank lines and add a banner.
  html = html.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n");

  // 5. R (webR), packed at the end of the page so the app starts before the browser reaches it.
  let rInfo = "";
  if (withR){
    const pack = rPack();
    html = html.replace(/<\/body>(?![\s\S]*<\/body>)/i, () =>
      `<script type="application/octet-stream" id="r-pack" data-webr="${pack.webr}" data-r="${pack.r}">${pack.text}</script>\n</body>`);
    rInfo = `, R ${pack.r} via webR ${pack.webr}: ${(pack.text.length / 1048576).toFixed(1)} MB`;
  }
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  html = html.replace(/^(<!doctype html>)/i,
    `$1\n<!-- Built ${stamp} by build.js from src/. Do not edit this file: edit src/ and run "npm run build". -->`);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
  const size = Buffer.byteLength(html) > 1048576 ? `${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB` : `${kb} KB`;
  console.log(`Built ${rel(OUT)} v${version}${pretty ? " (pretty)" : ""}${withR ? "" : " (without R)"}  (${css.length} stylesheets, ${js.length} scripts${rInfo}; ${size}, ${Date.now() - started} ms)`);
}

/* ---------- R (webR) ----------
   Every file in vendor/webr/ except the notes (README.md, LICENSE.md, versions.json)
   goes into one block: [4-byte length][JSON index of [path, offset, size]][the files],
   gzip'd and base64'd. webr.js is an ES module; it is wrapped so that it defines only
   the global WebRLib and runs as a plain script. Cached between builds in watch mode. */
const WEBR = path.join(ROOT, "vendor", "webr");
const WEBR_NOTES = new Set(["README.md", "LICENSE.md", "versions.json"]);
let rPackCache = null;

function listFiles(dir, base = dir, out = []){
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })){
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) listFiles(p, base, out);
    else out.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return out.sort();
}

function classicWebR(src){
  const m = src.match(/export\s*\{([^}]*)\};?\s*(\/\/# sourceMappingURL=\S+\s*)?$/);
  if (!m) throw new Error("vendor/webr/webr.js: the export list was not found (has the webR version changed?)");
  if (/^\s*import\s/m.test(src.slice(0, 2000))) throw new Error("vendor/webr/webr.js imports other modules; use the browser build of webr.js");
  const names = m[1].split(",").map(p => { const [local, as] = p.trim().split(/\s+as\s+/); return `${as || local}:${local}`; });
  return `var WebRLib=(function(){"use strict";${src.slice(0, m.index)};return{${names.join(",")}};})();\n`;
}

function rPack(){
  if (!fs.existsSync(WEBR)) throw new Error("vendor/webr/ is missing (or build with --no-r)");
  const files = listFiles(WEBR).filter(f => !WEBR_NOTES.has(f));
  const key = files.map(f => { const st = fs.statSync(path.join(WEBR, f)); return `${f}:${st.size}:${st.mtimeMs}`; }).join("|");
  if (rPackCache && rPackCache.key === key) return rPackCache;
  const zlib = require("zlib");
  const index = [], bufs = [];
  let offset = 0;
  for (const f of files){
    let b = fs.readFileSync(path.join(WEBR, f));
    if (f === "webr.js") b = Buffer.from(classicWebR(b.toString("utf8")));
    index.push([f, offset, b.length]); bufs.push(b); offset += b.length;
  }
  const head = Buffer.from(JSON.stringify(index)), len = Buffer.alloc(4);
  len.writeUInt32LE(head.length);
  const gz = zlib.gzipSync(Buffer.concat([len, head, ...bufs]), { level: 9 });
  const versions = JSON.parse(fs.readFileSync(path.join(WEBR, "versions.json"), "utf8"));
  rPackCache = { key, text: gz.toString("base64"), webr: versions.webr, r: versions.r };
  return rPackCache;
}

function safeBuild(){
  try { build(); return true; }
  catch (e){ console.error("Build failed: " + e.message); return false; }
}

if (!watch){
  process.exit(safeBuild() ? 0 : 1);
}

/* Watch mode: poll modification times (works the same on Windows, macOS and Linux). */
function snapshot(dir, acc = new Map()){
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })){
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) snapshot(p, acc);
    else acc.set(p, fs.statSync(p).mtimeMs);
  }
  return acc;
}
const same = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

safeBuild();
console.log("Watching src/ for changes. Press Ctrl+C to stop.");
let last = snapshot(SRC);
setInterval(() => {
  let now;
  try { now = snapshot(SRC); } catch { return; }       // a file was mid-save; try again next tick
  if (!same(now, last)){ last = now; safeBuild(); }
}, 400);
