"use strict";
/* ============================================================
   Page: R documentation — a short guide to the R used in the
   course, by topic. Every example has "Run in R" (opens the R
   console and runs it) and "Copy". Titles and explanations are
   in the locale files ("rg.sec.<section>", "rg.<item>.t" / ".d");
   the code is the same in every language.
   ============================================================ */
const R_GUIDE = [
  { id: "basics", items: [
    { id: "assign", code: "x <- 5\ny <- x * 2\ny" },
    { id: "vector", code: "x <- c(4, 8, 15, 16, 23, 42)\nlength(x)\nsum(x)\nsort(x, decreasing = TRUE)" },
    { id: "seq", code: "1:10\nseq(0, 1, by = 0.25)\nrep(c(\"a\", \"b\"), times = 3)" },
    { id: "index", code: "x <- c(4, 8, 15, 16, 23, 42)\nx[2]\nx[2:4]\nx[x > 10]\nwhich(x > 10)" },
    { id: "arith", code: "x <- c(1, 2, 3)\nx * 10\nx^2\nsqrt(16)\nexp(1)\nlog(100, base = 10)\nround(pi, 2)" },
    { id: "help", code: "?mean\nexample(mean)" }
  ] },
  { id: "data", items: [
    { id: "dataframe", code: "df <- data.frame(name = c(\"Ana\", \"Bruno\", \"Carla\"), grade = c(7.5, 8, 6.5))\ndf\ndf$grade\nmean(df$grade)\nnrow(df)" },
    { id: "builtin", code: "head(mtcars)\nstr(iris)\nsummary(iris)" },
    { id: "csv", code: "write.csv(mtcars, \"cars.csv\", row.names = FALSE)\ncars <- read.csv(\"cars.csv\")\nhead(cars)" },
    { id: "subset", code: "subset(mtcars, mpg > 25, select = c(mpg, wt))\nmtcars[mtcars$cyl == 4, \"mpg\"]" },
    { id: "table", code: "table(mtcars$cyl)\nprop.table(table(mtcars$cyl))\ntable(mtcars$cyl, mtcars$am)" },
    { id: "view", code: "View(mtcars)" }
  ] },
  { id: "descriptive", items: [
    { id: "center", code: "x <- c(4, 5, 5, 6, 6, 7, 7, 8)\nmean(x)\nmedian(x)\nmean(x, trim = 0.1)" },
    { id: "spread", code: "x <- c(4, 5, 5, 6, 6, 7, 7, 8)\nvar(x)\nsd(x)\nrange(x)\ndiff(range(x))\nsd(x) / mean(x)" },
    { id: "popsd", code: "x <- c(4, 5, 5, 6, 6, 7, 7, 8)\nn <- length(x)\nsqrt(sum((x - mean(x))^2) / n)" },
    { id: "quantile", code: "x <- c(3, 5, 6, 7, 10, 11)\nquantile(x)\nquantile(x, 0.9)\nIQR(x)\nsummary(x)" },
    { id: "box", code: "x <- c(3, 5, 6, 7, 10, 11, 25)\nboxplot(x, horizontal = TRUE)\nboxplot.stats(x)$out" },
    { id: "classes", code: "x <- mtcars$mpg\nclasses <- cut(x, breaks = seq(10, 35, by = 5), right = FALSE)\ntable(classes)\nhist(x, breaks = seq(10, 35, by = 5), right = FALSE)" },
    { id: "mode", code: "x <- c(2, 3, 3, 5, 7, 7, 7)\nfreq <- table(x)\nnames(freq)[freq == max(freq)]" }
  ] },
  { id: "probability", items: [
    { id: "counting", code: "factorial(5)\nchoose(10, 3)\nfactorial(10) / factorial(10 - 3)" },
    { id: "sample", code: "set.seed(1)\nsample(1:6, 10, replace = TRUE)\nsample(c(\"H\", \"T\"), 1)" },
    { id: "simulate", code: "set.seed(1)\nrolls <- sample(1:6, 10000, replace = TRUE)\nmean(rolls == 6)" },
    { id: "ev", code: "x <- c(0, 1, 2)\np <- c(1/4, 1/2, 1/4)\nEX <- sum(x * p)\nVX <- sum(x^2 * p) - EX^2\nc(EX, VX, sqrt(VX))" }
  ] },
  { id: "distributions", items: [
    { id: "dpqr", code: "dbinom(3, size = 10, prob = 0.5)\npbinom(3, size = 10, prob = 0.5)\nqbinom(0.5, size = 10, prob = 0.5)\nrbinom(5, size = 10, prob = 0.5)" },
    { id: "binom", code: "n <- 18; p <- 0.1\ndbinom(2, n, p)\npbinom(2, n, p)\n1 - pbinom(2, n, p)\nsum(dbinom(1:3, n, p))" },
    { id: "hyper", code: "dhyper(1, m = 4, n = 6, k = 3)\nphyper(1, m = 4, n = 6, k = 3)" },
    { id: "pois", code: "dpois(0, lambda = 2)\nppois(2, lambda = 2)\n1 - ppois(2, lambda = 2)" },
    { id: "unifexp", code: "punif(3, min = 0, max = 10)\npexp(2, rate = 0.5)\n1 - pexp(2, rate = 0.5)" },
    { id: "norm", code: "pnorm(1.96)\npnorm(70, mean = 60, sd = 8)\n1 - pnorm(70, mean = 60, sd = 8)\nqnorm(0.975)\nqnorm(0.95, mean = 60, sd = 8)" },
    { id: "tchif", code: "qt(0.975, df = 9)\npt(2.1, df = 9, lower.tail = FALSE)\nqchisq(0.95, df = 2)\npchisq(5.99, df = 2, lower.tail = FALSE)\nqf(0.95, df1 = 3, df2 = 12)" },
    { id: "approx", code: "n <- 100; p <- 0.3\npbinom(35, n, p)\npnorm(35.5, mean = n * p, sd = sqrt(n * p * (1 - p)))" },
    { id: "curve", code: "curve(dnorm(x, mean = 60, sd = 8), from = 30, to = 90)\nabline(v = 70, lty = 2)" }
  ] },
  { id: "estimation", items: [
    { id: "cimean", code: "x <- c(5.1, 4.9, 5.6, 5.8, 6.0, 5.3, 4.7, 5.5, 5.2, 5.9)\nt.test(x, conf.level = 0.95)$conf.int" },
    { id: "cimanual", code: "x <- c(5.1, 4.9, 5.6, 5.8, 6.0, 5.3, 4.7, 5.5, 5.2, 5.9)\nn <- length(x); m <- mean(x); s <- sd(x)\nt <- qt(0.975, df = n - 1)\nm + c(-1, 1) * t * s / sqrt(n)" },
    { id: "cisigma", code: "xbar <- 52.3; sigma <- 4; n <- 25\nz <- qnorm(0.975)\nxbar + c(-1, 1) * z * sigma / sqrt(n)" },
    { id: "ciprop", code: "x <- 120; n <- 400; p <- x / n\nz <- qnorm(0.975)\np + c(-1, 1) * z * sqrt(p * (1 - p) / n)\nprop.test(x, n, correct = FALSE)$conf.int" },
    { id: "size", code: "z <- qnorm(0.975); e <- 0.02\nn0 <- z^2 * 0.25 / e^2\nN <- 3000\nceiling(N * n0 / (N + n0 - 1))" }
  ] },
  { id: "tests", items: [
    { id: "ttest", code: "x <- c(4, 5, 5, 6, 6, 7, 7, 8)\nt.test(x, mu = 5)\nt.test(x, mu = 5, alternative = \"greater\")" },
    { id: "ztest", code: "xbar <- 52.3; mu0 <- 50; sigma <- 4; n <- 25\nz <- (xbar - mu0) / (sigma / sqrt(n))\nz\n2 * pnorm(-abs(z))" },
    { id: "proptest", code: "prop.test(x = 30, n = 100, p = 0.25, correct = FALSE)\nbinom.test(30, 100, p = 0.25)" },
    { id: "chisq", code: "tab <- matrix(c(500, 30, 4500, 270, 1500, 50), nrow = 2)\nchisq.test(tab, correct = FALSE)\nchisq.test(tab)$expected" },
    { id: "gof", code: "observed <- c(18, 22, 20, 25, 15)\nchisq.test(observed, p = rep(1/5, 5))" },
    { id: "twosample", code: "a <- c(12.1, 11.8, 12.6, 12.0, 11.5, 12.3)\nb <- c(11.2, 11.9, 11.4, 11.0, 11.6, 11.3)\nt.test(a, b, var.equal = TRUE)\nt.test(a, b)\nvar.test(a, b)" },
    { id: "paired", code: "before <- c(72, 80, 65, 90, 77, 84)\nafter <- c(70, 76, 66, 85, 73, 80)\nt.test(after, before, paired = TRUE)" },
    { id: "anova", code: "fit <- aov(Sepal.Length ~ Species, data = iris)\nsummary(fit)" },
    { id: "normality", code: "x <- c(4, 5, 5, 6, 6, 7, 7, 8)\nshapiro.test(x)\nqqnorm(x)\nqqline(x)" }
  ] },
  { id: "regression", items: [
    { id: "cor", code: "cor(mtcars$wt, mtcars$mpg)\ncor.test(mtcars$wt, mtcars$mpg)" },
    { id: "lm", code: "fit <- lm(mpg ~ wt, data = mtcars)\ncoef(fit)\nsummary(fit)" },
    { id: "predict", code: "fit <- lm(mpg ~ wt, data = mtcars)\npredict(fit, newdata = data.frame(wt = 3))\npredict(fit, newdata = data.frame(wt = 3), interval = \"prediction\")" },
    { id: "regplot", code: "fit <- lm(mpg ~ wt, data = mtcars)\nplot(mpg ~ wt, data = mtcars)\nabline(fit, col = \"red\")" },
    { id: "resid", code: "fit <- lm(mpg ~ wt, data = mtcars)\nplot(fitted(fit), resid(fit))\nabline(h = 0, lty = 2)" }
  ] },
  { id: "plots", items: [
    { id: "hist", code: "hist(mtcars$mpg, xlab = \"mpg\", col = \"lightblue\")" },
    { id: "bar", code: "counts <- table(mtcars$cyl)\nbarplot(counts)\npie(counts)" },
    { id: "boxgroups", code: "boxplot(mpg ~ cyl, data = mtcars)" },
    { id: "points", code: "x <- 0:10\nplot(x, dbinom(x, 10, 0.3), type = \"h\", lwd = 3)\npoints(x, dbinom(x, 10, 0.5), col = \"red\", pch = 19)\nlegend(\"topright\", c(\"p = 0.3\", \"p = 0.5\"), col = c(\"black\", \"red\"), lty = 1)" },
    { id: "layout", code: "par(mfrow = c(1, 2))\nhist(mtcars$mpg)\nboxplot(mtcars$mpg)\npar(mfrow = c(1, 1))" }
  ] },
  { id: "programming", items: [
    { id: "function", code: "cv <- function(x) sd(x) / mean(x)\ncv(c(4, 5, 5, 6, 6, 7, 7, 8))" },
    { id: "control", code: "for (i in 1:3) {\n  print(i^2)\n}\nx <- 7\nif (x > 5) \"big\" else \"small\"" },
    { id: "apply", code: "sapply(mtcars[, 1:4], mean)\ntapply(mtcars$mpg, mtcars$cyl, mean)\naggregate(mpg ~ cyl, data = mtcars, FUN = mean)" }
  ] }
];

PAGES["r-guide"] = function RGuidePage(root){
  const ui = RGuidePage.ui || (RGuidePage.ui = { q: "" });
  const sections = R_GUIDE.map(s => `
    <section class="sect sect-wide rg-sect" data-sec="${s.id}" id="rg-${s.id}">
      <h2>${t("rg.sec." + s.id)}</h2>
      <div class="rg-items">${s.items.map(i => `
        <article class="rg-item" data-item="${i.id}">
          <div class="rg-head">
            <h3>${esc(t("rg." + i.id + ".t"))}</h3>
            <span class="sect-actions">
              <button class="btn copy" type="button" data-run="${i.id}">${t("runInR")}</button>
              <button class="btn copy" type="button" data-copy-item="${i.id}">${t("copy")}</button>
            </span>
          </div>
          <p class="rg-text">${esc(t("rg." + i.id + ".d"))}</p>
          <pre class="code rg-code"><code>${highlightR(i.code)}</code></pre>
        </article>`).join("")}</div>
    </section>`).join("");

  root.innerHTML = `
  <div class="page rg-page">
    <header class="page-head"><h1>${t("nav.r-guide")}</h1></header>
    <div class="rg-tools">
      <input class="r-field rg-search" id="rgQ" type="search" placeholder="${t("rg.search")}" aria-label="${t("rg.search")}" autocomplete="off" spellcheck="false">
      <nav class="rg-toc" aria-label="${t("rg.contents")}">${R_GUIDE.map(s => `<button class="btn" type="button" data-goto="${s.id}">${t("rg.sec." + s.id)}</button>`).join("")}</nav>
    </div>
    <p class="rw-empty rg-none" id="rgNone" hidden></p>
    <div class="sections rg-sections">${sections}</div>
  </div>`;

  const byId = Object.fromEntries(R_GUIDE.flatMap(s => s.items.map(i => [i.id, i])));
  const fold = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  /* Search: matches the title, the explanation and the code. */
  function filter(){
    const q = fold(ui.q.trim());
    let shown = 0;
    $$(".rg-sect", root).forEach(sec => {
      let any = false;
      $$(".rg-item", sec).forEach(el => {
        const id = el.dataset.item;
        const hit = !q || fold(t("rg." + id + ".t") + " " + t("rg." + id + ".d") + " " + byId[id].code).includes(q);
        el.hidden = !hit; any = any || hit; shown += hit;
      });
      sec.hidden = !any;
    });
    const none = $("#rgNone", root);
    none.hidden = shown > 0; none.textContent = t("rg.noMatch", { q: ui.q.trim() });
  }
  const qEl = $("#rgQ", root);
  qEl.value = ui.q;
  qEl.addEventListener("input", () => { ui.q = qEl.value; filter(); });
  qEl.addEventListener("keydown", e => { if (e.key === "Escape"){ qEl.value = ui.q = ""; filter(); } });

  root.addEventListener("click", async e => {
    const go = e.target.closest("[data-goto]");
    if (go){
      if (ui.q){ qEl.value = ui.q = ""; filter(); }
      $("#rg-" + go.dataset.goto, root).scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const run = e.target.closest("[data-run]");
    if (run){ openInR(byId[run.dataset.run].code); return; }
    const cp = e.target.closest("[data-copy-item]");
    if (cp){
      let ok = false;
      try { await navigator.clipboard.writeText(byId[cp.dataset.copyItem].code); ok = true; } catch {}
      cp.textContent = ok ? t("copied") : t("copyFailed");
      setTimeout(() => { cp.textContent = t("copy"); }, 1600);
    }
  });
  filter();
};
