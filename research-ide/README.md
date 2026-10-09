# MathScope Research IDE — M0/M1 English source and evidence edition

MathScope connects a mathematical object, its assumptions, a bounded computation, a visualization, and the evidence supporting the result. This directory contains the **M0 research foundation and M1 arithmetic, cohomology, gauge-field, and Navier–Stokes modules**, with an English guide and an English example launcher.

The computation sources and historical evidence are preserved from **v54 / `16f4f911`**. The M1 engine is `1.2.0`, the NS engine is `1.3.0-m1`, and the installed registry contains **59 runnable examples**. The original v54 acceptance assessment is **61 PASS / 7 PARTIAL / 2 BLOCKED out of 70 criteria**: the six remaining M0 items passed, while a complete certified NS leading profile remained unfinished. See [current status](docs/CURRENT_STATUS_EN.md) before interpreting any result as a completed milestone.

The new outer audit **rejects the current `Md=1`, `logP=14` global candidate**: its `Pc` is negative at a rigorously enclosed interior point. The added continuous moment and joining certificates retain their local scopes. The [follow-up addendum](docs/FOLLOWUP_2026_10_10_EN.md) includes the counterexample, the exact-domain results, the new source-parameter regeneration CLI, and the remaining original gates.

**[Open the deployed MathScope research workspace](https://project29770.websitepublisher.ai/v0.3.1.html#research-objects/ns)**

## Run a calculation

Use **Node.js 24 or later**. The standalone CLI needs no npm packages, Python installation, Lean installation, or browser session. Run these commands from the directory containing this README:

```bash
node tools/mathscope-en.mjs list
node tools/mathscope-en.mjs run prime-1000 --out ./runs/prime-1000
node tools/mathscope-en.mjs run p1-p3 --out ./runs/p1-p3
node tools/mathscope-en.mjs run g2-projection --out ./runs/g2-projection
```

For the NS follow-up components:

```bash
node tools/mathscope-en.mjs run ns-source-pressure-bounds --out ./runs/pressure
node tools/mathscope-en.mjs run ns-axis-source-exact-bounds --out ./runs/axis
node tools/mathscope-en.mjs run ns-source-inner-gluing --out ./runs/gluing
```

Every `--out` directory must be new. The gluing example returns **`PARTIAL` and exit code 2** while saving its computed output and unresolved conditions. That is an intentional result grade. `COMPLETED` for the pressure or axis examples means the requested local bound calculation completed; it does not certify a full NS solution.

The English launcher delegates `run` to the original pinned CLI. Its English labels are a separate presentation catalog; it does not change requests, budgets, precision, source pins, result hashes, or mathematical conclusions. Original diagnostic text and historical labels may remain in Korean. The [installation guide](docs/INSTALL_AND_REPRODUCIBILITY_EN.md) explains the outputs, exit codes, source verification, and independent checks.

## What is implemented

| Area | Concrete computation | Scope to retain |
|---|---|---|
| M0 | Typed objects and assumptions, precision loss, resource budgets, immutable revisions, evidence storage, replay, and Lean audit bindings | A recorded assumption remains an assumption; importing a JSON result does not create proof authority. |
| Primes and arithmetic | Segmented prime enumeration, primality certificates, π/ψ/Li₂, exact integers and rationals, p-adic precision, Smith/Tor computations, local Euler factors | A completed finite interval is not an enumeration of all primes or a proof of RH/BSD. |
| Point and ℙ¹ | Explicit integral Čech–de Rham comparison complexes, all-weight contractions, reduction, Frobenius, and cohomology | Prismatic identification uses explicit comparison hypotheses and external theorem references; arbitrary prisms and E∞ structures are outside this implementation. |
| Gauge fields | Fourteen concrete compact matrix-group adapters, BPST and full-basis fields, curvature, gauge transformations, finite holonomy, 4D observations and 3D projections | Classical calculations do not construct a quantum Yang–Mills theory or prove its mass gap. |
| NS | Similarity coordinates, heat exterior, Taylor–Green reference, finite axis/core components, and eight follow-up construction families | A finite component, exact local bound, or sampled cone check is not a globally certified leading profile. |

The supported compact adapters are **SU(2–6), SO(3,5–8), Sp(1–3), and G₂**. Unsupported global forms or exceptional groups are not silently replaced by similarly named fields. Delta has four explicitly different roles: an assumed lower bound, a unit change, a classical scale, or a declared effective model.

## Documentation map

| Document | Purpose |
|---|---|
| [INSTALL_AND_REPRODUCIBILITY_EN.md](docs/INSTALL_AND_REPRODUCIBILITY_EN.md) | Installation, commands, outputs, exit codes, tests, and reproducing with the pinned sources |
| [MATHEMATICAL_SCOPE_EN.md](docs/MATHEMATICAL_SCOPE_EN.md) | Objects, supported domains, exact versus approximate calculations, and interpretation of visualizations |
| [ACCEPTANCE_CRITERIA_EN.md](docs/ACCEPTANCE_CRITERIA_EN.md) | Complete English translation of all 70 original titles, requirements, and acceptance criteria, with original IDs and v54 status |
| [NS_FOLLOWUP_COMPONENTS_EN.md](docs/NS_FOLLOWUP_COMPONENTS_EN.md) | All eight NS construction families, source formulas, checks, examples, and unproved connections |
| [NS_GATES_EN.md](docs/NS_GATES_EN.md) | The nine outstanding v54 gates and exactly what evidence is needed to close each |
| [EVIDENCE_AND_PROVENANCE_EN.md](docs/EVIDENCE_AND_PROVENANCE_EN.md) | Proof audits, independent verification, failure history, hashes, and the immutable build snapshot |
| [PACKAGING_AND_TRANSLATION_EN.md](docs/PACKAGING_AND_TRANSLATION_EN.md) | What was translated, what remains unchanged, source selection, and original-archive restoration |
| [CURRENT_STATUS_EN.md](docs/CURRENT_STATUS_EN.md) | Frozen baseline and any separately recorded follow-up status |
| [FOLLOWUP_2026_10_10_EN.md](docs/FOLLOWUP_2026_10_10_EN.md) | New continuous integral, same-source continuation, joining-loop, and original verification work, with its remaining conditions |

## Validation recorded by the baseline

The v54 browser observation ledger records **19/19** checks. The v53 core, follow-up integration, M0 regression, and CLI cohorts record **19/19**, **19/19**, **82/82**, and **48/48** respectively. The mathematical Worker is identical between v53 and v54; these cohorts keep their actual execution versions. The CLI total is a count of assertions and controls, not 48 examples all executed.

Independent NS checks include **306** pressure comparisons, **82** source-axis comparisons, and **691** gluing comparisons. The three-stencil gluing fixture has maximum normalized moment residual approximately **2.914×10⁻¹⁰** and passes **97/97 sampled** central cone checks. It retains `fullProfileCertified:false` and `intervalNewtonCertified:false`.

Formal records are separated into **71 local component targets**, **2 original rc2 C/D declaration audits**, **16 imported axis declaration references**, and **4 additional scalar targets**. Their scopes and toolchain versions must not be pooled into a claim of 93 newly proved global theorems. See the [evidence guide](docs/EVIDENCE_AND_PROVENANCE_EN.md).

## Repository integration

This module is designed to live under `research-ide` beside the existing MathScopeCompute Python backend. Its standalone Node Worker is not automatically an HTTP endpoint of that backend. The browser workspace files integrate with the existing MathScope/M0 page; serving this directory alone does not reproduce an authenticated or fully installed MathScope site.

The sibling directories `mathscope-m0`, `mathscope-m1`, and `mathscope-extension` must retain their relative locations. The English edition keeps every original file byte-for-byte intact. The normal source tree contains 693 original files. An optional `archive-members/` directory stores the other 242 unchanged rendered QA images at their original relative paths, so GitHub Actions can reconstruct a full English release ZIP. The packager places those images back at their original paths in the full ZIP without duplicating the auxiliary directory. The public final screenshot remains available at [browser-v54-final.jpg](mathscope-m1/evidence/browser-v54-final.jpg).

## Source and attribution

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the preserved upstream license and the distinction from the MathScope project's licensing status. The original source archive is identified by SHA-256:

```text
ccc8d6dd7bc85f8e5a054aa04c0adab6f1ebd3172a175c667180cf9ef75b58f9
```

The original paper and Lean repository, comparison theorems, and third-party licenses are linked from their unchanged source records. Full external papers, toolchains, dependency caches, and the complete external NS checkout are not bundled. Existing license files remain authoritative; this English documentation layer does not relicense third-party code or evidence.
