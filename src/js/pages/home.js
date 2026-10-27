"use strict";
/* ============================================================
   Home (landing) page: what the app is, and every formula by topic.
   Not part of NAV; reached with an empty address (#/) or the app name.
   ============================================================ */
function HomePage(root){
  const all = navPages(), ready = all.filter(id => PAGES[id]).length;
  const topics = NAV.map(f => `
    <section class="topic">
      <h2>${t("folder." + f.folder)}</h2>
      <ul>${navPages(f.items).map(id => PAGES[id]
        ? `<li><a href="#/${id}">${t("nav." + id)}</a></li>`
        : `<li><a href="#/${id}" class="soon" title="${t("notBuilt")}">${t("nav." + id)}</a></li>`).join("")}</ul>
    </section>`).join("");
  root.innerHTML = `
  <div class="page home">
    <header class="home-head">
      <h1>${esc(APP.name)}</h1>
      <p class="home-lede">${t("home.lede")}</p>
      <p class="home-hint">${t("home.hint", { key: `<kbd>${esc($("#kbdHint").textContent)}</kbd>`, ready, total: all.length })}</p>
    </header>
    <div class="topics">${topics}</div>
  </div>`;
}
