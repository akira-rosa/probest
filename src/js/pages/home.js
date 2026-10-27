"use strict";
/* ============================================================
   Home (landing) page: the app name and every formula by topic.
   Not part of NAV; reached with an empty address (#/) or the app name.
   ============================================================ */
function HomePage(root){
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
    </header>
    <div class="topics">${topics}</div>
  </div>`;
}
