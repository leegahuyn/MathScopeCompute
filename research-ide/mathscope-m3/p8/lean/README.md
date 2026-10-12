# P8 finite Lean consumers

This subproject pins Lean **4.34.1**, kernel commit
`5045d0056413266e57c625dcd7c365b10e377c52`, and mathlib commit
`d13f23b723b8a846827a245b89c10fc7d3f11612`, matching the successful M1
arithmetic environment. `pins.json` records exact byte copies of the inherited
Algebra and Precision source; P8 recompiles them and imports actual declarations.

The new consumers cover the inherited integer differential and unit contraction,
an exhaustive residue-pair enumeration for `y² = x³ − x` over F5 with a declared
one-point projective completion, a universal integer 2×2 matrix trace recurrence,
the printed companion-matrix trace prefix, bounded residue reconstruction, a
finite place-variable polynomial regrouping, and a truncated exact Euler-series
coefficient identity. The companion matrix is a polynomial model, **not** a
computed crystalline or prismatic Frobenius matrix. The finite Euler prefix has
no analytic tail certificate. Geometric comparison and all global conjecture
bridges remain outside these declarations.

Run on the Linux CI runner, after installing the pinned official Lean toolchain:

```sh
cd research-ide/mathscope-m3/p8/lean
lake update
lake exe cache get
python ../tools/audit_lean.py --output ../evidence/lean-audit
```

No local toolchain download is performed by the auditor. It compiles four local
modules in dependency order, runs a fresh `Audit.lean` consumer, and requires all
12 named targets with their exact printed types and axiom sets. It records source,
input, target manifest, binary/runtime, mathlib, and recursive source/compiled
import closure hashes. Eight false propositions must fail through the expected
`decide` semantic diagnostic; a missing import or crashed process does not count.
Unexpected custom axioms, missing targets, duplicate targets, placeholders, or
source changes during the run fail closed. Imported audit JSON remains
`UNTRUSTED_REQUIRES_REEXECUTION` and cannot itself issue a fresh proof badge.

The successful output is `audit.json` with status
`KERNEL_CHECKED_FINITE_SCOPES`; failures write `FAILED` and return nonzero.
Compilation has not been claimed by merely creating this source. `finite-input.json`
and `MathScope/P8/Generated.lean` are checked against the deterministic JavaScript
exporter before compilation. Parser tests and integer recomputation tests are
separate from actual kernel execution.

Regenerate input/source with `node ../tools/generate_finite.mjs --write` from this
directory, or use `--check` to compare existing bytes. The browser-facing
`finite-certificates.mjs` has no Node imports or filesystem access.

Reference for the proof boundary: the official
[Lean proof validation guide](https://lean-lang.org/doc/reference/latest/ValidatingProofs/)
describes validating the actual declaration, its type, and axioms. The pinned
[Omega source](https://github.com/leanprover/lean4/blob/5045d0056413266e57c625dcd7c365b10e377c52/src/Lean/Elab/Tactic/Omega.lean)
provides the integer arithmetic tactic used for the printed modulus-625 theorem.
