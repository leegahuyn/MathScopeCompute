# MathScope M0 — checked Lean foundations and proof provenance

## Delivered boundary

M0 contains an actual local Lean run for six modules and eight audited theorem
targets. It supplies five selectable proof bundles. The browser rechecks their
exact source and audit identity against an immutable release allowlist. It does
not run a new Lean compiler and never issues the older application's `FORMAL
PASS` status. Its successful status is **`LOCAL_AUDIT_VERIFIED`**, accompanied by
the exact theorem type, scope, and foundational/custom axiom lists.

Two independently submitted false source files were rejected by the same Lean
frontend: `0 = 1` by `rfl`, and a finite matrix certificate with a corrupted sign.
The JavaScript proof provenance tests additionally reject source edits, altered
hashes, assumption changes, target/environment changes, fabricated audits,
dependency cycles, open references, and receipt replay through JSON.

This completes the **minimum local proof gate** specified for the M0 foundation:
an exact finite theorem and a conditional real spectral theorem pass the kernel,
while bad certificates, circular dependencies and stale hashes are rejected.
The broader domain formalization tasks in I3 remain staged work as described
below. In particular, the real spectral result is an elementary implication on
a set of real numbers. It is not a spectral theorem, a semigroup construction,
a quantum Yang–Mills model, or a continuum-limit theorem.

## Actual checked theorem scopes

| Target | Mathematical scope | `#print axioms` |
|---|---|---|
| `Finite.differential_squared_zero` | Every vector in `Z^4`, for the specified `5×4` and `3×5` differentials | `propext` |
| `Finite.matrix_product_zero` | The literal fixed `3×4` product is zero | `propext` |
| `Finite.integer_fixture` | The one exact vector `(-7, 9007199254740993, 11, -13)` | No axioms |
| `Analytic.gap_excludes_interval` | A supplied `GapAt spectrum delta` excludes every positive energy below delta | Standard three |
| `Analytic.smaller_positive_gap` | A smaller positive lower bound remains valid on the same real spectrum | Standard three |
| `Analytic.gap_transfer` | A gap on a certified superset transfers to its subset | Standard three |
| `Comparison.transport_gap` | The preceding implication through an explicit `SpectrumComparison.inclusion` adapter | Standard three |
| `Conditional.selected_gap_excludes_interval` | A consequence of the selected uninterpreted spectrum and user-assumed gap at 1 | Standard three plus the two named user axioms |

Here “standard three” means `propext`, `Classical.choice`, and `Quot.sound`.
The two custom axioms are:

```lean
MathScope.M0.Conditional.selectedSpectrum
MathScope.M0.Conditional.userAssumedGapAtOne
```

The full theorem types, source hashes, exact logs, elapsed times and compilation
exit codes are in `evidence/lean-validation.json`. No successful target contains
`sorryAx`, and all successful module builds emitted zero warnings.

The fixed finite matrix complex is the D=1 Čech–de Rham fixture from the blueprint.
Checking its chain condition does not identify it with the full prismatic
complex, prove the omitted-weight contraction, establish Frobenius compatibility,
or complete a geometric comparison.

## Module separation

```text
MathScope/M0/Defs.lean         concrete integer modules and differentials
MathScope/M0/Finite.lean       fixed finite statements; imports Defs only
MathScope/M0/Analytic.lean     real spectral predicates and explicit hypotheses
MathScope/M0/Comparison.lean   proved local spectral inclusion adapter
MathScope/M0/Conditional.lean isolated custom assumptions and their consequence
MathScope/M0/Open.lean        research metadata only; no mathematical axioms
```

`Finite`, `Analytic`, and `Comparison` do not import `Conditional` or `Open`.
`Open` records `RH_GLOBAL_BRIDGE`, `BSD_UNIVERSAL` and `YM_CONTINUUM` as research
open, and known-prism-comparison implementation as model development. Kernel
checking this metadata module does not prove any of its named problems.

## Browser API and trust model

```javascript
import {
  listShippedProofs, getShippedProofBundle, prepareProofJob,
  assessProofEvidence, exportProofRequest, isVerifiedProofReceipt,
} from './proof.mjs';

const selected = listShippedProofs()[0];
const bundle = getShippedProofBundle(selected.id);
const job = await prepareProofJob(bundle.jobSpec);
const result = await assessProofEvidence(job, bundle);

if (result.verified && isVerifiedProofReceipt(result.receipt)) {
  // Display LOCAL_AUDIT_VERIFIED and the exact scope/axioms in the M0 pane.
}

const downloadable = exportProofRequest(job, bundle);
```

For an edited source, clone `bundle.jobSpec`, edit the relevant source file's
`content`, and call `prepareProofJob` again. Comparing that new job with the old
bundle returns **`STALE`**. The new job is exportable, with
`EXPORT_AND_PINNED_AUDIT_ONLY` capability. No hidden request is sent to the fixed
C-014/Golden compiler service, which does not advertise arbitrary M0 source
compilation.

Every job binds:

- exact UTF-8 source bytes and relative paths;
- the precise target declaration and claim ID;
- the explicit assumption ledger and dependency graph;
- mathematical context, such as a delta value and its role;
- the pinned toolchain/environment and imported artifact manifest.

The immutable release allowlist binds the entire audit JSON, including exit
status, theorem type, custom axioms, source hashes and negative controls.
Imported JSON starts untrusted. An exact copy of a shipped audit can receive a
fresh receipt only after this comparison is actually performed. Altered or
unknown audits remain `UNTRUSTED_IMPORTED`.

Receipts are immutable objects branded in a private JavaScript `WeakSet`.
Serializing a receipt destroys that authority. This brand prevents ordinary
metadata import or copied status strings from creating a verifier result; it is
not a signature service and does not defend against an attacker who can replace
the application's JavaScript release itself.

The receipt includes `sourceDigest`, `assumptionsDigest`, `dependencyDigest`,
`contextDigest`, `environmentDigest`, `bindingDigest`, `auditDigest`, `jobId`,
the exact `targetType`, and the bound context. The five shipped contexts do not
bind an arbitrary application's claim revision or payload hash. Therefore a
verified source receipt must **not** be attached to a different semantic claim
merely because its display ID is reused. A future `VERIFIED_BY` graph insertion
must also check a source/target revision and payload binding in its context.
Until such a bridge is supplied, store the ProofJob and audit as records and
display the local audit separately.

The shared `effectiveEvidenceTrust` helper follows the same rule: call it with
the actual branded receipt object itself and the trusted
`isVerifiedProofReceipt` predicate. A different raw record, even with the same
claim ID or copied source/job digest, remains `REVALIDATION_REQUIRED`. Explicit
hypothesis results keep their conditional label even if their custom axiom list
is empty. The proof regression suite covers both cases (24 tests passed).

`auditDependencyGraph` is a structural guard only. It catches explicit graph
cycles, reachable user axioms at incompatible grades, references without kernel
adapters, and open inputs. With `closeResearchGate: true`, it also rejects the
literal desired conclusion restated as an assumption. It does not decide all
logical equivalences or detect every possible circular mathematical argument.

## Pinned execution environment

- Lean **4.34.1**, commit `5045d0056413266e57c625dcd7c365b10e377c52`.
- mathlib commit `d13f23b723b8a846827a245b89c10fc7d3f11612`.
- Runtime, shared library, frontend driver, and mathlib manifest hashes are
  recorded in `lean-validation.json`.
- A recursively resolved closure of **2,258** Lean modules is recorded in
  `lean-environment.json`, including source hashes and available `.olean`,
  `.olean.private`, and `.ir` hashes. There are zero unresolved imports.
- The import parser reads Lean module headers, including `public`, `meta`, and
  `import all` forms. The compiler's `#print axioms` audit independently records
  the target theorem's actual transitive axiom dependencies.
- The normal official Lean frontend and kernel were used. Runtime, kernel and
  verifier guards were unchanged.

The environment could not discover its executable installation root through
`/proc/<pid>/exe`, so a small C driver supplied `Lean.initSearchPath` explicitly
and called the official frontend. Its source is included as
`lean/lean-embed-check.c`. On a normal installation this embedding is unnecessary.

The browser payload contains only the compact environment summary/digests,
relevant source files and target audits. The complete closure remains a separate
downloadable evidence file. The five generated fixture bundles occupy about
50 KB before application bundling.

## Reproduce with a normal installation

From the included `lean` directory, with Lean/Lake installed:

```bash
lake update
lake exe cache get Mathlib.Basic.Real.Basic
lake build MathScope.M0.Finite MathScope.M0.Analytic MathScope.M0.Conditional MathScope.M0.Comparison
lake env lean MathScope/M0/Finite.lean
lake env lean MathScope/M0/Analytic.lean
lake env lean MathScope/M0/Conditional.lean
lake env lean MathScope/M0/Comparison.lean
lake env lean MathScope/M0/Open.lean
lake env lean NegativeFalse.lean
lake env lean NegativeMatrix.lean
```

The last two commands must exit nonzero. Inspect their logs along with the
successful targets' types and axiom dependencies. Do not combine the two
negative-control files into a normal “all files must pass” release target.

For the supplied execution workspace, `python lean/reproduce.py` rebuilds the
six modules, reruns the two negative controls, and refreshes raw audit records.
It expects the explicit Lean distribution and pinned mathlib tree named in its
arguments/workspace. `package_audits.py` is a separate release-time action that
packages already successful, source-matched audit records. The browser cannot
run it or use it to approve a newly submitted source.

From the project root, run the browser-compatible proof provenance tests:

```bash
node --test mathscope-m0/tests/proof.test.mjs
```

## Checklist coverage for this M0 delivery

| Item | M0 status | Implemented now | Remaining scope |
|---|---|---|---|
| I3-01 | Foundation complete | Defs/Finite/Analytic/Comparison/Conditional/Open separation; custom-axiom grade guard | The domain modules will expand in later milestones |
| I3-02 | Partial | Exact fixed matrices, universal integer-coordinate d²=0, exact large-integer fixture, false matrix rejection | Delta identities, semilinear chain maps, prime-interval, Lie bracket and holonomy certificates |
| I3-03 | Partial | Explicit real domain, same energy unit, positive-gap hypothesis and quantifiers | Completeness, uniform convergence, semigroup/spectral measure and PDE stability theorems |
| I3-04 | Partial | A real proved spectrum-inclusion adapter; reference/open guards | Actual prism/trace/BSD/NS theorem imports and adapters |
| I3-05 | Foundation complete | Source-bound jobs, one-character stale check, changed assumptions/context/environment, downloadable source | Arbitrary-source remote compiler and domain-specific code generators |
| I3-06 | Foundation complete | Actual pinned kernel, eight targets, axioms/types/logs/commits/digests/warnings, two negative controls | The same audit protocol for future domain theorem targets |
| I3-07 | Foundation complete | Open/development gates, graph cycle rejection, literal goal-as-assumption guard, no silent grade upgrade | New research theorems themselves remain open |
| I3-08 | Data/API complete | One claim ID supplies student/expert explanations and the exact same audit record | Root UI integration and browser acceptance are recorded separately |

No additional mathematical design decision is required to use these local M0
audits. Choosing and deploying an arbitrary-source compilation service is an
explicit later capability decision; existing fixed theorem compiler endpoints
are not advertised as supporting that operation.
