"use strict";
/* ============================================================
   Placeholder for pages not built yet
   ============================================================ */
function PlaceholderPage(root, label){
  root.innerHTML = `<div class="page"><div class="empty">
    <h1>${label}</h1>
    <p>${t("phBody")}</p>
    <p><a href="#/">${t("phLink")}</a></p>
  </div></div>`;
}
