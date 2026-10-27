"use strict";
/* ============================================================
   Translation engine. The strings live in js/locales/<lang>.js,
   which each add one entry to I18N. Missing keys fall back to English.
   ============================================================ */
const I18N = {};
let LANG = "en";

/* t("key") or t("key", { name: value }) for strings with {name} placeholders. */
function t(key, vars){
  let s = I18N[LANG]?.[key] ?? I18N.en?.[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  return s;
}

/* Saved choice, otherwise the browser's language, otherwise English. */
function detectLang(){
  const saved = store.get("sw-lang");
  if (I18N[saved]) return saved;
  const nav = (navigator.language || "").slice(0, 2).toLowerCase();
  return I18N[nav] ? nav : "en";
}
function setLang(l, save = true){
  if (!I18N[l]) return;
  LANG = l; if (save) store.set("sw-lang", l);
  document.documentElement.lang = t("htmlLang");
}
