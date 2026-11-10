# Independent review of `SourceRowFive.lean`

## Pinned artifacts and compilation

The reviewed `SourceRowFive.lean` has SHA-256
`0fc2dbb3dc4d0025dae77dee077a31c59f90a7dcf0545ced50d0730f5933ad50`,
matching `work/ci/row5-20261110/source-sha256.txt`. The authenticated AST
checker `check_source_row.py` has SHA-256
`f395c3cd818aa1ac4becd77ef68903bd144ae2da50e7496afa967565c54b8925`;
its result JSON is
`40193582bf3701a2dd8a40e95ba70aa426f5688024f02bdb3ac73dedec3df4c9f`.

GitHub Actions run [42734312183](https://github.com/leegahuyn/MathScopeCompute/actions/runs/42734312183)
completed with `success` on commit `38fa5af3b6d0e5522abbeea939906f639b0e4204`.
The archived log reports Lean 4.34.1. All three named `#print axioms` entries
list `propext`, `Classical.choice`, and `Quot.sound`; `sorryAx` does not occur
in the proof summary. The source was not compiled locally in this review.

## Comparison of definitions

The Lean expressions were compared term-by-term with the authenticated
`check_source_row.py` projection and its conditional substitution:

* `A`, `D`, `L`, `delta`, `gamma`, and `pressureWeight` match the exact
  order-one substitutions `A=1/2+h`, `D=1/2-h`, `lambda_1=2h`,
  `gamma=-A+lambda_1`, and `pressureWeight=-2A+lambda_1`.
* `radialFactor` agrees with the source #29440 projection after the explicit
  hypotheses `average(U1)=U1+K1` and `partial_eta average=U1_eta+K1_eta`.
  It is `v1_factor`; the manuscript radial profile is `V1=X*v1_factor`.
  `pulledBackRaw` uses `xi^2 * radialFactor * U0X`, so there is exactly one
  factor of X in this term. The Python checker's internal symbol `V1` also
  denotes this factor and its JSON records the corrected meaning.
* The remaining seven terms in `pulledBackRaw` match the source's T term,
  leading-radial transport, leading-axial transport, U1 times leading axial
  Z derivative, pressure Z derivative, radial viscosity, and lower-order
  axial viscosity, respectively, with the listed substitutions. Pressure uses
  `Pi_X=2 F0 F1-Omega/2`; the lower viscosity is represented by the same
  scalar `Visc` on both sides, rather than independently proved equal.
* `sourceRowFive` agrees with the projected system-0 A0 and A1 row 5 and
  forcing: in the respective scalar unknowns its nonzero coefficients are for
  `F,U,K,P,W,U_eta,K_eta,P_eta`, with `-2 Visc` and the pressure forcing.
  The literal-zero stored entries and `F_eta,W_eta` do not contribute.
* Here `xi=sqrt(X)` is the inner variable, so `X=xi^2`. The paper's separate
  rescaled radial variable satisfies `X=R^2/2`, giving `R=sqrt(2)*xi` for
  nonnegative xi. These substitutions are consistent and must not be confused.
  With `W=partial_xi U1`, the two source derivatives become
  `U1_X=W/(2xi)` and `U1_XX=(U1_xixi-W/xi)/(4xi^2)` for `xi != 0`.

## Meaning of the three theorems

1. `raw_row_identity` is a universal algebraic identity for the independent
   scalar fields in `Jet` when `xi != 0` and `L != 0`. It does not assume
   or establish the row equation, so the identity is not circular.
2. `raw_zero_of_row_equation` derives zero for the defined scalar expression
   from the explicit hypothesis `Uxx + W/xi = sourceRowFive`. This is useful
   once the source's Picard row and all source-to-jet substitutions have been
   proved; it does **not** prove that this hypothesis holds.
3. `raw_zero_iff_row_equation` gives the corresponding two-way scalar
   equivalence under the same nonzero denominators. It does not assert that
   either side is true or that the scalar expression is an evaluated source
   residual.

The Lean code does not import an interpreted original graph. The connection
between AST IDs and these formulas relies on the separate Python checker and
the meanings assigned to its abstract field/derivative atoms. The algebraic
theorems remain conditional on actual operation definedness, smooth source and
Picard semantics, equality of actual leading profiles and required derivatives,
pressure reconstruction, the average identity, and native-domain binding.
The excluded axis `xi=0` requires an independent limit. This file does not
establish Picard convergence or its row equation, cutoff boundary jets, total
integrability or moment cancellation, all `n>=1`, M3/M4 acceptance, or RELEASE.
In particular the source `#672` actual total moment remains OPEN.
