# Third-party sources and licensing notices

This English edition preserves the existing license files and source notices. It does not introduce a blanket license for the MathScope code or relicense third-party material. No repository-wide MathScope license was present in the delivered source archive or the inspected MathScopeCompute checkout when this edition was prepared.

## Selected original Navier–Stokes sources

The unchanged files under `mathscope-m1/navier/sources/official-repo/` come from:

- Repository: [openai/NavierStokesAndEuler](https://github.com/openai/NavierStokesAndEuler)
- Commit: `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`
- Preserved license: [Apache License 2.0](mathscope-m1/navier/sources/official-repo/LICENSE)
- License-file SHA-256: `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`

The selected source files are `Flatness.lean`, `ProblemStatement.lean`, `AnalyticCoefficientBounds.lean`, `AxisContraction.lean`, `AxisModelBounds.lean`, `AxisOperators.lean`, `AxisResolvent.lean`, `AxisWeightEstimates.lean`, `NaturalAxisBridge.lean`, `NaturalAxisCoefficients.lean`, and `NaturalAxisData.lean`. Their original paths and digests are recorded in the preserved source manifest. They have not been translated or modified in this edition. The complete external repository and its dependencies are not bundled.

## Research papers and theorem references

The guides cite the original NS paper, prismatic comparison sources, and mathematical problem statements. Full external papers and extracted full-paper text are not included in this source distribution. References, theorem names, source locations, and locally generated mathematical arguments remain distinct from redistributing the original papers.

## Dependencies obtained separately

Node.js, Python, Lean, mathlib, Comparator, lean4export, Landrun, nanoda, mpmath, and SymPy are not supplied here as installed toolchains or dependency caches. Their upstream licenses continue to apply when they are separately obtained. Historical environment manifests identify the versions used in the recorded audits; they do not transfer ownership or licensing of those projects.

## MathScope and the English additions

The mathematical source and historical records remain attributed to the MathScope project. English guides, localization data, and packaging utilities were prepared as an accompanying edition at the project owner's request. The preserved third-party Apache license applies to the identified upstream files; it should not be assumed to license every other file in the tree.
