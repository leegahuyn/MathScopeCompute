# I3-03 analytic assumptions and current target coverage

The p.20 criterion requires precise statements of completeness, uniform
convergence, interchange of derivatives and limits, semigroup bounds,
spectral measures, and stability constants. It also requires the norm,
domain and quantifiers for each lemma that differentiates an infinite
sum or uses a continuum limit.

`exact-analytic-obligations.json` preserves the six identifiers in the
original M4 obligation registry and expands their precise mathematical
conditions. The derivative specification includes the partial-sum
interpretation and local uniform derivative convergence. The spectral
specification quantifies strong countable additivity, the square-integral
domain and norm convergence of the truncated spectral integrals.

The fresh core GitHub build exposes three analytic targets. The uniform
limit theorem and its exact adapter use the declared precision-ball
norm substitute and uniform convergence over the whole domain. The
conditional Cauchy limit uses the named user axiom `assumedComplete`.
The archived current source and compiler logs are bound by SHA-256.
The inherited M0 spectral lemmas are also inventoried from their exact
source. They concern supplied real sets of energies and retain their
separate historical Mathlib compilation evidence.

The derivative-interchange, semigroup, spectral-measure and stability
statements have `OPEN_SPECIFICATION` status. The actual M4 targets in
this audit do not consume those four obligations. Their future use
requires a specific model and proof. This specification audit supplies
no evidence for the source graph's actual Picard solution, infinite
order Navier–Stokes construction or any physical continuum model.

To reproduce the check, supply the separate new worktree and the
extracted GitHub artifact directory. The script compares current Git
blobs with the compiled source at the successful run's SHA, checks the
raw compiler log hashes and matches the precise obligation annotations
to the current analytic theorem inventory. The inventory excludes nested
Lean comments and quoted strings, and checks every theorem and axiom
declaration against the exact audited module list.

```text
python audit_analytic_scope.py --repo WORKTREE --ci CI_ARTIFACT --out I3-03_RECEIPT_v2.json
```

The artifact is from [GitHub Actions run 42996997312](https://github.com/leegahuyn/MathScopeCompute/actions/runs/42996997312).
