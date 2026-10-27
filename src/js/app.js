"use strict";
/* ============================================================
   App shell: sidebar, search, routing, language, theme.
   Loaded last; starts the app.
   ============================================================ */
const app = $("#app"), navEl = $("#nav"), mainEl = $("#main"), qEl = $("#q");
let cleanup = null;      // cleanup function returned by the current page
let keepScroll = false;  // true when re-rendering the same page (e.g. language change)

/* ---------- sidebar ---------- */
/* Search matches labels in every language, accent-insensitive ("media" finds "Média"). */
const fold = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const allLangs = key => Object.keys(I18N).map(l => I18N[l][key] || "").join(" ");

/* Which folders are open is remembered between visits. */
const OPEN_KEY = "sw-nav-open";
const openFolders = new Set((() => { try { return JSON.parse(store.get(OPEN_KEY)) || []; } catch { return []; } })());
const saveOpen = () => store.set(OPEN_KEY, JSON.stringify([...openFolders]));
const searching = () => qEl.value.trim() !== "";

const svg = (cls, d, box = 16) => `<svg class="${cls}" viewBox="0 0 ${box} ${box}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const ICON_CHEV = svg("chev", "M4.5 2.5 8 6l-3.5 3.5", 12);
const ICON_FOLDER = svg("closed", "M2 4.5A1.5 1.5 0 0 1 3.5 3h2.6l1.5 1.5h4.9A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z");
const ICON_FOLDER_OPEN = svg("open", "M2 11.5v-7A1.5 1.5 0 0 1 3.5 3h2.6l1.5 1.5h4.4A1.5 1.5 0 0 1 13.5 6v.8M2 11.5l1.6-3.8A1.5 1.5 0 0 1 5 6.8h8.6a.8.8 0 0 1 .7 1.1l-1.5 4.1a1.5 1.5 0 0 1-1.4 1H3.5A1.5 1.5 0 0 1 2 11.5z");
const ICON_COLLAPSE = svg("", "M4.5 2.5 8 6l3.5-3.5M4.5 13.5 8 10l3.5 3.5");
const ICON_EXPAND = svg("", "M4.5 6 8 2.5 11.5 6M4.5 10 8 13.5l3.5-3.5");

function renderNav(){
  const f = fold(qEl.value.trim()), cur = currentId();
  const hit = key => fold(allLangs(key)).includes(f);

  const page = id => `<a href="#/${id}" class="page-link${PAGES[id] ? "" : " soon"}"${PAGES[id] ? "" : ` title="${t("notBuilt")}"`}${id === cur ? ' aria-current="page"' : ""}>${t("nav." + id)}</a>`;

  // showAll: an enclosing folder matched the search, so show everything inside it.
  function node(n, base, showAll){
    if (!isFolder(n)) return !f || showAll || hit("nav." + n) ? page(n) : "";
    const path = joinPath(base, n.folder), self = f && hit("folder." + n.folder);
    const inner = n.items.map(c => node(c, path, showAll || self)).join("");
    if (!inner) return "";
    const open = f ? true : openFolders.has(path);          // searching opens every folder with a match
    const count = navPages(n.items).length;
    return `<div class="folder" data-path="${path}" data-open="${open}">
      <button class="folder-row" type="button" aria-expanded="${open}">${ICON_CHEV}<span class="ficon">${ICON_FOLDER}${ICON_FOLDER_OPEN}</span><span class="fname">${t("folder." + n.folder)}</span><span class="fcount" title="${t("pageCount", { n: count })}">${count}</span></button>
      <div class="folder-body"${open ? "" : " inert"}><div class="folder-inner">${inner}</div></div>
    </div>`;
  }

  navEl.innerHTML = NAV.map(n => node(n, "", false)).join("") || `<p class="nav-empty">${t("noMatch", { q: esc(qEl.value) })}</p>`;
  paintFoldBtn();
}

function setFolderOpen(el, open){
  el.dataset.open = open;
  el.querySelector(":scope > .folder-row").setAttribute("aria-expanded", open);
  el.querySelector(":scope > .folder-body").inert = !open;
  if (!searching()){ open ? openFolders.add(el.dataset.path) : openFolders.delete(el.dataset.path); saveOpen(); }
  paintFoldBtn();
}

/* Collapse-all / expand-all button next to the search box. */
const anyOpen = () => !!navEl.querySelector('.folder[data-open="true"]');
function paintFoldBtn(){
  const b = $("#foldBtn"), label = anyOpen() ? t("collapseAll") : t("expandAll");
  b.innerHTML = anyOpen() ? ICON_COLLAPSE : ICON_EXPAND;
  b.title = label; b.setAttribute("aria-label", label);
}
function toggleAllFolders(){
  const open = !anyOpen();
  if (searching()){ qEl.value = ""; }
  openFolders.clear();
  if (open) navFolders().forEach(p => openFolders.add(p));
  saveOpen(); renderNav();
}

/* Make sure the folders around a page are open. */
function revealPage(id){
  for (const p of navTrail(id) || []) openFolders.add(p);
  saveOpen();
}

function openNav(){ app.classList.add("nav-open"); $("#menuBtn").setAttribute("aria-expanded", "true"); }
function closeNav(){ app.classList.remove("nav-open"); $("#menuBtn").setAttribute("aria-expanded", "false"); }

/* ---------- routing (#/page-id) ---------- */
function currentId(){ return (location.hash.replace(/^#\/?/, "").split("?")[0]) || DEFAULT_PAGE; }
function labelFor(id){ return navPages().includes(id) ? t("nav." + id) : null; }

function route(){
  const id = currentId(), label = labelFor(id);
  if (cleanup){ cleanup(); cleanup = null; }
  if (PAGES[id]) cleanup = PAGES[id](mainEl) || null;
  else if (label) PlaceholderPage(mainEl, label);
  else { location.replace("#/" + DEFAULT_PAGE); return; }
  document.title = `${label} · Stats Workbench`;
  revealPage(id);
  renderNav();
  closeNav();
  if (!keepScroll){ mainEl.scrollTop = 0; window.scrollTo(0, 0); }
  keepScroll = false;
}

/* ---------- language ---------- */
function applyShellText(){
  qEl.placeholder = t("search"); qEl.setAttribute("aria-label", t("search"));
  navEl.setAttribute("aria-label", t("navLabel"));
  $("#menuBtn").setAttribute("aria-label", t("openMenu"));
  $("#langSeg").setAttribute("aria-label", t("language"));
  $$("#langSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === LANG));
  paintThemeBtn();
}

/* ---------- theme ---------- */
const sysDark = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => (document.documentElement.dataset.theme || (sysDark.matches ? "dark" : "light")) === "dark";
const ICON_SUN = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"/></svg>`;
const ICON_MOON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4.5 4.5 0 0 0 7 7z"/></svg>`;
function paintThemeBtn(){
  $("#themeBtn").innerHTML = isDark() ? ICON_SUN + t("lightTheme") : ICON_MOON + t("darkTheme");
}
const themeChanged = () => { paintThemeBtn(); document.dispatchEvent(new Event("themechange")); };

/* ---------- events ---------- */
qEl.addEventListener("input", () => renderNav());
navEl.addEventListener("click", e => {
  const row = e.target.closest(".folder-row");
  if (row){ const f = row.parentElement; setFolderOpen(f, f.dataset.open !== "true"); }
});
navEl.addEventListener("keydown", e => {            // Right opens a folder, Left closes it
  const row = e.target.closest(".folder-row");
  if (!row || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
  e.preventDefault(); setFolderOpen(row.parentElement, e.key === "ArrowRight");
});
$("#foldBtn").addEventListener("click", toggleAllFolders);
qEl.addEventListener("keydown", e => {
  if (e.key === "Escape"){ qEl.value = ""; renderNav(); qEl.blur(); }
  if (e.key === "Enter"){
    const a = navEl.querySelector("a:not(.soon)") || navEl.querySelector("a");
    if (a){ location.hash = a.getAttribute("href"); qEl.blur(); }
  }
});
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); openNav(); qEl.focus(); qEl.select(); }
});
$("#menuBtn").addEventListener("click", openNav);
$("#scrim").addEventListener("click", closeNav);
$$("#langSeg button").forEach(b => b.addEventListener("click", () => {
  if (b.dataset.lang === LANG) return;
  setLang(b.dataset.lang); applyShellText(); keepScroll = true; route();
}));
$("#themeBtn").addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next; store.set("sw-theme", next);
  themeChanged();
});
sysDark.addEventListener("change", themeChanged);
window.addEventListener("hashchange", route);

/* ---------- start ---------- */
if (/Mac|iPhone|iPad/.test(navigator.platform)) $("#kbdHint").textContent = "⌘K";
const savedTheme = store.get("sw-theme"); if (savedTheme) document.documentElement.dataset.theme = savedTheme;
setLang(detectLang(), false);
applyShellText();
route();
