# TODO

Possible future pages. They are **not** in the sidebar (`src/js/nav.js`); a page is added to
the menu only when it is built. Formula pages are named after their formula; the statistical
tables get their own section.

Book references: **B** = Barbetta, Reis & Bornia (section or appendix table),
**BM** = Bussab & Morettin (section, problem or table).

Rough size of each item, including checking it against the book examples in both languages:

| Size | What it means | Working time |
|------|---------------|--------------|
| S | fits a page template we already have (distribution, data, Venn, interval, test, pairs) with numerics we already have | about 1 hour |
| M | needs a new numeric routine (such as the F distribution), a new kind of input, or several linked results | about 3 hours |
| L | needs a new page template (such as ANOVA tables or a function you type in) | about 1 day |

## Statistical tables (the books' appendices)
Each table is generated from the app's own numerics, not typed in, so it always agrees with the
calculators. The plan: choose the book's layout (they differ, for example the normal table is
the upper tail in B and P(0 ≤ Z ≤ z) in BM); highlight the row, column and cell for a value; link
to it from each calculator ("see it in the table"); and print it cleanly on A4.

- Table page template: layout per book, highlighting, links, print styles **(L)**
- Standard normal (B Table 3 · BM Table III) **(S)**
- Student's t (B Table 4 · BM Table V) **(S)**
- Chi-square (B Table 5 · BM Table IV) **(S)**
- F distribution (B Table 6 · BM Table VI), needs the F numerics **(M)**
- Binomial (B Table 1 · BM Table I) **(S)**
- Poisson (B Table 2, cumulative · BM Table II) **(S)**
- Minimum |r| for a significant Pearson correlation (B Table 10) **(S)**
- Random numbers (BM Table VII) **(S)**
- Kolmogorov–Smirnov critical values (B Table 7 · BM Table X) **(M)**
- Lilliefors critical values (B Table 7); there is no formula for them, so an approximation must match the book **(M)**
- Wilcoxon signed-rank (B Table 8 · BM Table IX), exact distribution by counting **(M)**
- Mann–Whitney U (B Table 9 · BM Table VIII), exact distribution by counting **(M)**

## Data tables and charts
- Frequency distribution table and histogram, with Sturges' rule c = 1 + 3.3 log n (B 3.3 · BM 2.2–2.3; the rule itself is from the course, not the books) **(M)**
- Stem-and-leaf plot (B 3.3 · BM 2.4) **(S)**
- Contingency table with row and column percentages (B 10.2.1 · BM 4.2) **(S)**
- Normal probability plot / q-q plot (B 6.4 · BM 4.7) **(M)**

## Descriptive statistics
- Coefficient of variation: CV = s / x̄ (B 3.4.1 · BM 3.2) **(S)**
- Mode (BM 3.1) **(S)**
- Mean absolute deviation (BM 3.2) **(S)**
- Interquartile range and outlier fences, as a formula (B 3.4.2 · BM 3.3–3.4); the box plot already draws them **(S)**
- Covariance: cov(x, y) (BM 4.5) **(S)**
- Contingency coefficient C for two qualitative variables (BM 4.4) **(S)**

## Probability
- Combinations: C(n, k) = n! / (k! (n − k)!) (B 4.2.1 · BM 5) **(S)**
- Classical probability: P(A) = m / n (B 4.2.1) **(S)**
- Product rule as its own page (B 4.3.1); today it is a formula on the conditional probability page **(S)**
- Total probability as its own page (B 4.4); today it is part of Bayes' theorem **(S)**

## Discrete random variables
- Bernoulli distribution (B 5.2.1 · BM 6.6.2) **(S)**
- Discrete uniform distribution (BM 6.6.1) **(S)**
- Cumulative distribution function F(x) of a discrete variable (B 5.1.2 · BM 6.5) **(S)**
- Geometric distribution, with the lack of memory (BM 6, Problem 55) **(S)**
- Negative binomial (Pascal) distribution (BM 6, Problem 57) **(S)**
- Multinomial distribution (BM 14, Problem 27) **(M)**
- Two variables: joint and marginal distributions, covariance, E(X + Y), Var(X + Y) (B 5.1.4 · BM 8.1–8.4) **(M)**

## Continuous random variables
- Normal approximation to the binomial and the Poisson, with continuity correction (B 6.3 · BM 7.5) **(M)**
- Any density you type in: check it integrates to 1, then E(X), Var(X) and F(x) (B 6.1 · BM 7.1–7.3); needs a formula parser and numerical integration **(L)**
- Student's t distribution (BM 7.7.3) **(S)**
- Chi-square distribution (BM 7.7.2) **(S)**
- F distribution (BM 7.7.4); its numerics are shared with the F table and the F test **(M)**
- Gamma distribution (BM 7.7.1) **(S)**
- Weibull, lognormal and beta distributions (BM 7, Problems) **(S each)**

## Sampling distributions and estimation
- Sampling distribution of the mean, standard error σ / √n and the central limit theorem, with simulated samples (B 7.2.1 · BM 10.8) **(M)**
- Sampling distribution of the proportion (B 7.2.2 · BM 10.9) **(S)**
- Confidence interval for a variance, IC(σ²) with chi-square (BM 12.9) **(S)**
- Sample size for comparing two means (B 9.4) **(M)**

## Hypothesis tests
- Test for one variance, chi-square (B 8.9 · BM 12.9) **(S)**
- Type II error, power and the power curve (B 8.3, 8.10 · BM 12.7) **(M)**
- Paired t test (B 9.2 · BM 13.4.1) **(M)**
- t test for two independent samples, equal or unequal variances (B 9.3 · BM 13.3.1) **(M)**
- F test for two variances (B 9.5 · BM 13.2) **(M)**
- Test and interval for two proportions (BM 13.5) **(S)**
- Chi-square goodness-of-fit test (B 10.1.1 · BM 14.2) **(M)**
- Chi-square test of homogeneity (BM 14.3); same arithmetic as the independence test **(S)**
- Kolmogorov–Smirnov test (B 10.1.2 · BM 14.6) **(M)**
- Lilliefors test (B 10.1.3) **(M)**
- Sign test (B 10.3.1) **(S)**
- Wilcoxon signed-rank test (B 10.3.2 · BM 13.4.2) **(M)**
- Mann–Whitney test (B 10.3.3 · BM 13.3.2) **(M)**

## Analysis of variance and design of experiments
- One-way ANOVA with its table (B 9.6.1 · BM 15.2–15.3) **(L)**
- ANOVA with blocks (B 9.6.2) **(M)**
- Comparing the means afterwards, with Bonferroni's correction (BM 15.4) **(M)**
- Homoscedasticity test (BM 15.5) **(M)**
- ANOVA in factorial designs (B 9.7) **(L)**
- Effects in 2ᵏ factorial designs (B 9.8) **(L)**

## Correlation and regression
- Coefficient of determination R² and the ANOVA of the regression (B 11.3.2 · BM 16.3) **(S)**
- Inference on the line: σ̂, intervals and tests for the intercept and the slope (B 11.3.3 · BM 16.4.1–16.4.3) **(M)**
- Confidence interval for the mean response and prediction interval (BM 16.4.4) **(M)**
- Residual plot (B 11.3.4 · BM 16.5) **(S)**
- Line through the origin (BM 16.6.1) **(S)**
- Transformations and non-linear models, such as y = a·eᵇˣ (B 11.3.5 · BM 16.6.2) **(M)**
- Multiple regression (B 11.4) **(L)**

## Estimate

| | Items | S | M | L | Working time |
|---|---:|---:|---:|---:|---:|
| Statistical tables | 13 | 7 | 5 | 1 | about 4 days |
| Data tables and charts | 4 | 2 | 2 | 0 | about 1 day |
| Descriptive statistics | 6 | 6 | 0 | 0 | about 1 day |
| Probability | 4 | 4 | 0 | 0 | about half a day |
| Discrete random variables | 7 | 5 | 2 | 0 | about 1½ days |
| Continuous random variables | 9 | 6 | 2 | 1 | about 2½ days |
| Sampling distributions and estimation | 4 | 2 | 2 | 0 | about 1 day |
| Hypothesis tests | 13 | 4 | 9 | 0 | about 4 days |
| ANOVA and design of experiments | 6 | 0 | 3 | 3 | about 4 days |
| Correlation and regression | 7 | 3 | 3 | 1 | about 2½ days |
| **Total** | **73** | **39** | **28** | **6** | **about 21 working days (170 hours)** |

Days are 8 hours; S = 1 h, M = 3 h, L = 8 h. The Weibull, lognormal and beta pages count as
three S items. Shared work makes later items cheaper: the F numerics serve the F table, the F
distribution, the F test and ANOVA; the exact nonparametric distributions serve both their
tables and their tests.

## Not planned
- "Which model?" guide: not a formula.
- Theory without a calculation to explore: estimator properties, method of moments and
  maximum likelihood (BM 11.2–11.5), Bayesian inference (BM 11.8), simulation (BM 9).
- Resistant regression (BM 16.7), symmetry plots and transformations of data (BM 3.5–3.6),
  observations over time (B 3.5) and survey planning (B 2).
