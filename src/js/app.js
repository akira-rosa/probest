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

function renderNav(filter = ""){
  const f = fold(filter.trim()), cur = currentId();
  const html = NAV.map(g => {
    const gText = fold(allLangs("group." + g.key));
    const items = g.items.filter(id => !f || gText.includes(f) || fold(allLangs("nav." + id)).includes(f));
    if (!items.length) return "";
    return `<div class="nav-group"><h3>${t("group." + g.key)}</h3>${items.map(id =>
      `<a href="#/${id}" class="${PAGES[id] ? "" : "soon"}" ${PAGES[id] ? "" : `title="${t("notBuilt")}"`} ${id === cur ? 'aria-current="page"' : ""}>${t("nav." + id)}</a>`).join("")}</div>`;
  }).join("");
  navEl.innerHTML = html || `<p class="nav-empty">${t("noMatch", { q: esc(filter) })}</p>`;
}

function openNav(){ app.classList.add("nav-open"); $("#menuBtn").setAttribute("aria-expanded", "true"); }
function closeNav(){ app.classList.remove("nav-open"); $("#menuBtn").setAttribute("aria-expanded", "false"); }

/* ---------- routing (#/page-id) ---------- */
function currentId(){ return (location.hash.replace(/^#\/?/, "").split("?")[0]) || DEFAULT_PAGE; }
function labelFor(id){ return NAV.some(g => g.items.includes(id)) ? t("nav." + id) : null; }

function route(){
  const id = currentId(), label = labelFor(id);
  if (cleanup){ cleanup(); cleanup = null; }
  if (PAGES[id]) cleanup = PAGES[id](mainEl) || null;
  else if (label) PlaceholderPage(mainEl, label);
  else { location.replace("#/" + DEFAULT_PAGE); return; }
  document.title = `${label} · Stats Workbench`;
  renderNav(qEl.value);
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
qEl.addEventListener("input", () => renderNav(qEl.value));
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
