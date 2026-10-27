"use strict";
/* ============================================================
   Page: Confidence interval for a proportion
     p̂ = y/n     IC(p, γ) = p̂ ± z_γ·√(p̂(1 − p̂)/n)
   Sources: Barbetta 7.3.2 (eq. 7.27 to 7.29, Ex. 7.3) · Bussab & Morettin 11.6
   ============================================================ */
PAGES["ci-proportion"] = ciPage({
  id: "ci-proportion", key: "ci-prop", mode: "prop",
  state: { conf: 95, n: 400, y: 240, ref: "", zTable: true, example: "systems95" },
  examples: [
    { id: "systems95", set: { conf: 95, n: 400, y: 240 }, source: "Barbetta · Ex. 7.3" },
    { id: "systems99", set: { conf: 99, n: 400, y: 240 }, source: "Barbetta · Ex. 7.3" },
    { id: "happy", set: { conf: 95, n: 164, y: 35 }, source: "slides" },
    { id: "brand", set: { conf: 95, n: 200, y: 140 }, source: "slides" },
    { id: "buildings", set: { conf: 95, n: 200, y: 110 }, source: () => `Barbetta · ${t("exercise")} 7.10` },
    { id: "pads", set: { conf: 95, n: 600, y: 18 }, source: () => `Barbetta · ${t("exercise")} 7.11` },
  ],
  notes: ["note.large", "note.width", "note.pct", "note.size"],
  sources: ["src.barbetta", "src.bussab", "src.slides"],
});
