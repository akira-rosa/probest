"use strict";
/* ============================================================
   Page: Test for a proportion
     z = (y′ − n·p₀) / √(n·p₀·(1 − p₀)),  y′ = y − 0.5 if y > n·p₀, y + 0.5 if y < n·p₀
   Valid when n·p₀ > 5 and n·(1 − p₀) > 5.
   Sources: Barbetta 8.7 (eq. 8.1 to 8.7, Ex. 8.6) · Bussab & Morettin 12
   ============================================================ */
PAGES["test-proportion"] = testPage({
  id: "test-proportion", key: "tp", mode: "prop",
  state: { h1: "gt", alpha: 1, p0: 0.015, n: 500, y: 9, cc: true, zTable: true, example: "parts" },
  examples: [
    { id: "parts", set: { h1: "gt", alpha: 1, p0: 0.015, n: 500, y: 9 }, source: "Barbetta · Ex. 8.6" },
    { id: "coin", set: { h1: "gt", alpha: 5, p0: 0.5, n: 50, y: 31 }, source: () => `Barbetta · ${t("exercise")} 8.13` },
    { id: "smart", set: { h1: "gt", alpha: 5, p0: 0.5, n: 60, y: 40 }, source: () => `Barbetta · ${t("exercise")} 8.15` },
    { id: "systems", set: { h1: "ne", alpha: 5, p0: 0.5, n: 40, y: 24 }, source: () => `Barbetta · ${t("exercise")} 8.16` },
    { id: "maker", set: { h1: "lt", alpha: 1, p0: 0.9, n: 50, y: 42 }, source: () => `Barbetta · ${t("exercise")} 8.17` },
  ],
  notes: ["note.cc", "note.cond", "note.side"],
  sources: ["src.barbetta", "src.bussab"],
});
