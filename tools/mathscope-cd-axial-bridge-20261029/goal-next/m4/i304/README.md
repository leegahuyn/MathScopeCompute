# I3-04 comparison reference and import audit

The original 99-page blueprint records I3-04 on page 20. Its recovery matrix already identified the exact precision-space adapter and four literature records. The outstanding application check concerned the user-facing view. The updated M4 audit and I3-04 detail now consume the same comparison data.

| Entry | Classification | Exact binding |
| --- | --- | --- |
| Bhatt–Scholze prism comparison | THEOREM REFERENCE | M1 S01 |
| Deligne trace formula | THEOREM REFERENCE | M1 S07 |
| Known BSD cases over ℚ in analytic rank 0 or 1 | THEOREM REFERENCE | M1 BSD-GZK-ANALYTIC-RANK-LE1 |
| OpenAI original Navier–Stokes manuscript | THEOREM REFERENCE | M1 NS-PAPER |
| Uniform continuity in the declared precision spaces | EXPORTED LEAN TARGET | `MathScope.M4.Comparison.uniform_continuity_adapter` imports and calls `MathScope.M4.Analytic.uniform_limit_uniformly_continuous` |

The precision-space theorem assumes uniform convergence of the functions and uniform continuity at every index. The exact target and upstream types, complete printed axioms, archived execution digest and source pins are in the receipts. The current application rebinds its archived core run and both dated hosted M0 runs. A second readback independently matched the GitHub Actions archive digest, compiler receipt, two source files, two compiled artifacts and their printed signatures. Both modules compiled successfully without warnings or axioms. [GitHub Actions run 42996997312](https://github.com/leegahuyn/MathScopeCompute/actions/runs/42996997312)

The verifier exercised nineteen negative controls, including claims of imported kernel authority for the four literature records, unrelated authentic evidence, a serialized receipt, edited types and stale source. Chromium exercised the same I3-04 interface at 1200×900 and 390×844. The visible panel kept four citations and one exact Lean target after a forged evidence import. The screenshots show local generated HTML. The release and publication flags retain their recorded states.

In a separate exact-byte checkout containing the source patch, set `REPO` to that checkout and `EVIDENCE` to this directory. GitHub CLI authentication permits fetching the preserved hosted artifact. A compatible Playwright module and a Chromium executable are required for the two browser views.

```text
python EVIDENCE/read_github_archive.py EVIDENCE REPO
node REPO/research-ide/mathscope-m4/audit-kernel-evidence.mjs --out EVIDENCE/audit-kernel-evidence.json
node REPO/research-ide/mathscope-m4/web/build-web-patch.mjs
node EVIDENCE/verify_panel.mjs REPO/research-ide/mathscope-m4/web/evidence/standalone.html PLAYWRIGHT_MODULE CHROMIUM_EXECUTABLE
node EVIDENCE/audit_i304.mjs REPO
node --test --test-reporter=tap REPO/research-ide/mathscope-m4/tests/kernel-evidence.test.mjs
```

The evidence records reference classifications and the named precision-space adapter. The underlying prism, trace, BSD and Navier–Stokes research obligations retain their original scope.
