"use strict";
/* ============================================================
   Home (landing) page: every formula by topic, and below them an
   animated graph that morphs through the kinds of graph in the app
   (pages/home-anim.js). Not part of NAV; reached with an empty
   address (#/) or the app name.
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
    <h1 class="visually-hidden">${esc(APP.name)}</h1>
    <div class="topics">${topics}</div>
    <div class="home-anim" id="homeAnim"></div>
  </div>`;
  return homeAnimation($("#homeAnim", root));
}
