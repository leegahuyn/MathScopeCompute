# Final handoff: the quantified outer replacement and its exact boundary

## Completed result

This addition replaces the rejected fixed-logP outer experiment with one
specified family of positive finite real expressions. Its continuous
construction and estimates cover the finite A.4 interval, for every
`eta in [-1,1]`, from `X/XR=exp(-8)` through terminal local coordinate
`y=1/2`, at every `XR >= 2^40`.

The parameter expressions are

\[
M_d=2^{20},\quad T=e^{M_d}+10,\quad P_*=e^{2T},\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad
c_o=1/256,\quad T_f=128.
\]

Their canonical expression-tree SHA-256 is
`38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8`.
The powers and exponentials remain exact expressions. No extremely small
positive parameter is replaced by zero, and no enormous finite coordinate
is treated as infinity.

The written argument specifies the actual angular correction by a uniform
contraction of its continuous two-moment map. It then specifies the pulse
corrections by the actual two linear moment equations, and chooses one
smooth amplitude function by the actual total-S equation and a uniform
simple-root bound. Pressure neutrality, the angular reset, M=J=0 and
S(infinity)=0 are defining exact identities proved by those arguments.
They are not omitted or zeroed numerical residuals.

The construction order is E history, angular reset, terminal wait and
exterior E, pulse corrections and amplitude root, then the same field's
A.21 pressure. The release-energy bound used to select the amplitude
depends only on the fixed E schedule. It does not presuppose that root
or S(infinity)=0, so the later use of the moment identities is acyclic.

The independent reviews found no blocking defect in the stated finite
outer argument. The original relaxed cone is the required conclusion at
the initial and axial points with v=2; the admissible cone is concluded
only where the extra strict-shear hypothesis v>2 holds. The actual radial
threshold is checked, as well as the intermediate ratio inequalities.

## Distinct forms of evidence

| Evidence | Actual result | What it establishes |
| --- | --- | --- |
| `check_outer_envelopes.py` | 106/106 | Exact finite arithmetic supporting the explicit stage constants |
| `independent-axial/` | 47/47 | Whole-cell step bound, whole axial estimates, actual cone threshold and positive finite terminal wait |
| `independent-review-axial/` | 16/16; nonmutating 47/47 replay | Independent continuous axial review and exact algebra checks |
| `independent-review-pulse/` | 45/45; nonmutating 106/106 replay | Incoming moments, exact correction roots, total-S/C1 argument and full pulse cone review |
| `independent-postpulse/` | 21/21 | Independent release-energy, exterior, actual radial threshold and complex pressure review |
| `actual-main-pulse-integral.json` | 11/11 | An outward enclosure of the actual continuous source main-pulse integral |
| `main-pulse-integral-independent.json` | 15/15 | Exact endpoint checks and a separate 70-digit numerical crosscheck |
| `test_outer_envelopes.py` | 8/8 in the completed execution | Rejection of omitted cutoff, invalid smallness, hidden analytic assumptions and false promotion |
| `formal-cone/attempts/0001/` | Actual Lean exit code 0; seven theorems | Conditional cone-threshold theorems in the original Lean predicates |

The review prose contains the continuous reasoning. The finite check
counts do not by themselves prove differentiation under an integral,
smoothness, the implicit-function argument or the infinite-tail bounds.
The numerical diagnostic is not the enclosure proof.

The main source shape's computed enclosure is

\[
K_b\in[0.2450496191973,\;0.2450496212058].
\]

It retains both non-polynomial collars and the exact central primitive.
The central formula uses the exact identity
`sigma(1-t)=1-sigma(t)`, hence `integral_0^1 sigma=1/2`.
Together with the reviewed nonzero total-S error bound, it encloses the
single amplitude function uniformly by

\[
\operatorname{Amp}(\eta)\in
[1.0100502641935,\;1.0100502683328].
\]

These displayed decimal intervals are widened; the receipt stores exact
88-bit outward endpoints. The approximate zero-error diagnostic center
`1.010050266264900596...` is not substituted for the eta-dependent root.

## Exact source and Lean bindings

The reviewed mathematical derivation has SHA-256
`ffb859d1f6b79aad9aa45e7c5173e8b727cd7a554f6ea28697dc9a108b3dbd81`.
The corresponding scalar program and historical receipt have SHA-256
`b5a84d2408d1acc29c170e97db2a8d79600da93e46c678123f7b6a8547fc6889`
and
`7da0ae60395cd3a8d2d428546271485daacbb570dd4757e284d7318c25b1a18d`.

The original paper SHA-256 is
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The seven conditional statements use the original cone predicates at
commit `f9e8bc5b38b6e212696e8a30e3e91517af887bbd` and its original
Lean 4.34.0-rc2 kernel. The checked source SHA-256 is
`2ef73e70050448a95d7d778f74e6aedd35531bd7cc0bd8932e75a18c75f79dff`;
the actual first-attempt result SHA-256 is
`5f8f915c3c45e254b5dbbcf0ed811e00dbe790277799e5d119b52ddaadc27171`.
All seven axiom audits contain only `propext`, `Classical.choice` and
`Quot.sound`. The original tracked source and kernel stayed unchanged.

The exact analytic functions and their bounds have **not** been supplied
as Lean proofs of those theorems' hypotheses. This is a checked conditional
algebraic consumer, not a kernel-checked construction of the outer field.

`final-review-bindings.json` records the later combined review state and
binds the reviewed source, independent reviews, integral records and
conditional Lean result. It preserves the older envelope receipt's
earlier incomplete-audit flag instead of rewriting historical evidence.
`snapshot-manifest.json` binds every delivered file in this addition;
`verify_final_snapshot.py` performs a read-only check of those bindings
and the required claim boundaries.

## Original completion criteria still open

This result does not close an original N3 acceptance gate. In particular:

- **N3-02 remains partial:** the new pressure and finite A.4 outer argument
  do not supply the subsequent A.7 heat compensation and reserved patch.
- **N3-03 and N3-04 remain partial:** the B.2 infinite axis and its exact
  leading identities have not been regenerated for this new pressure.
- **N3-05 remains open:** the old certified local joining map belongs to
  the old pressure. Its certificate cannot be attached to this new datum;
  new same-source B.8 joining and all required moments are still needed.
- **N3-06 remains open:** global C.12 incoming-moment and finite-frequency
  certification for the one new completed profile has not been supplied.
- **N3-07 remains partial:** the final support, heat replacement, stress
  and endpoint claims have not been established for that completed field.

The new outer constants advance N3-01's parameter hierarchy, but do not
complete the hierarchy for a final profile. This directory makes no
separate claim about the official build or Comparator acceptance items.

The historical `Md=1, logP=14` counterexample and the rejection of its
fixed-logP admissible Md family remain valid for those different inputs.
No old axis pressure, old local joining success, or historical source
status is silently reused as evidence for this new candidate.

## Reproduction

From this directory, run `python3 -B verify_final_snapshot.py` first for
a read-only source and receipt check. The computation and review commands
are listed in [README.md](README.md). Re-running the conditional Lean
check requires the separately installed original pinned environment;
the successful attempt and its full compiler log are included here.
