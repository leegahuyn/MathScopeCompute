# The actual phase exponential at the selected Q, Lambda and C

[Attempt 0002](attempts/0002/receipt.json) completed on the original
Lean 4.34.0-rc2 kernel with exit 0 at 2026-10-09 23:46:42 UTC. All eight
audited declarations use only `propext`, `Classical.choice`, and
`Quot.sound`. The imported same-datum inputs, mass estimate, and eleven
fixed coefficient fields have pinned source and output hashes.

The exact choices are

\[
 Q=2^{260}P_*^2/\sigma^2,\qquad
 \Lambda=Q^{64},\qquad
 C=(1+Q^{300})^{10}\exp(Q^{200}).
\]

The source uses separate names `actualAmplitudeQ`,
`actualAmplitudeLambda`, and `actualAmplitudeC`; their definitions are
the literal expressions above. They do not select a second parameter
family. The coefficient space is the same original `AxisSpace` on
`[-33/32,33/32]` with `rho=sigma^2/65536`.

## Proved chain

1. On the complex tube of radius `32 rho`, the actual denominator
   `H^2+sigma^2` has norm at least `sigma^2/16`. The original `L` denominator
   is also separated from zero. The open thickening is convex and
   contains zero and the entire closed tube of radius `16 rho`.
2. The phase is the original segment integral of the actual normalized
   gradient. The original analytic primitive theorem supplies its
   holomorphy and exact derivative on the whole closed inner tube.
3. Every integration segment stays in that tube. The field bound
   `100/sigma^2` gives `norm(phase) <= 200/sigma^2 <= Q` there.
4. The literal normalization satisfies `C >= exp(Q^200)`. Since
   `Lambda norm(phase) <= Q^65 <= Q^200`, the actual complex exponential
   `exp(Lambda phase)/C` has norm at most one on the whole tube.
5. The original Cauchy coefficient constructor embeds this actual
   function into `AxisSpace`. Its norm is at most
   `radiusLoss(1/16) <= 2`, all positive radial coefficients vanish,
   and its zeroth coefficient is exactly the original `realAmplitude`.

These are supplied input proofs, rather than additional hypotheses on
the nonlinear fixed-point theorem. The actual contraction and finite
evaluation connection are recorded separately by the subsequent
assembly; this component alone retains `fullOriginalN303Completion=false`.

The accepted source SHA-256 is
`a960171b872ba7968305bad8839519421edb4a8eb45d487e3c6f18bace105679`.
Its `.olean` SHA-256 is
`008e35bd81b65111d0894e5b370be65e579528a9cbde943c8365051bd8884e26`.
The receipt also pins the exact source, compiled object, and receipt of
each imported component and confirms they remained unchanged.

Attempt 0001 failed on scalar inequality and rewriting tactics. Its
error-recovery axioms and failed exit remain visible; it is not an
accepted proof. Attempt 0002 has no `sorryAx` and no kernel error.
The exponentiation-threshold warning in its log is a simplification
warning, not an unproved term: the audited theorems were accepted by
the kernel without an additional axiom.

Run `python3 run_check.py` in the documented original runtime for a new,
append-only attempt. No original source, kernel, or dependency is edited.

## Actual real differential identity

The separate [dynamics attempt 0002](dynamics-attempts/0002/receipt.json)
also passed the original kernel. It imports the accepted amplitude
without changing its definitions and proves the real phase derivative,
the real amplitude derivative, and the exact original identity

\[
 \frac{\partial_\eta\bigl(\exp(\Lambda\,\mathrm{phase}(\eta))/C\bigr)}
      {\exp(\Lambda\,\mathrm{phase}(\eta))/C}
   =\Lambda\,\mathrm{realGradient}(\eta)
\]

throughout the selected real interval. All three audited declarations
use only the same standard axioms. `run_dynamics.py` creates a new
numbered dynamics attempt; the failed first conversion attempt is kept.
