# Final summation consumer and exact source-scale windows

This module implements the finite positive-window part of (9.21) and the
single-fixed-stage comparison in Lemma 5.4. It does not manufacture the
complete-current norm inputs needed to close original N6-08.

## Executed behavior

`prepareFinalSummationWindow` consumes a privately checked rational cutoff
schedule. It retains every possibly active index, records the first cutoff
that is zero throughout the requested window, and refuses to resolve a
window when the finite prefix has not reached that index.

`prepareSourceScalarFinalWindow` retains the original exact exponent
`h=exp(-8002*(exp(1048576)+10))`. Each stage uses every supplied derivative
majorant through its stage order and the actual source-only scalar norm
root. Its scale is the maximum of the sufficient logarithmic thresholds.
All scales satisfy `L_(j+1)>=L_j+1`, with `a_j=exp(L_j)`.

On the relative window `log(1/q) in [L_J+1,L_J+3/2]`, stages 1 through J
have cutoff exactly one. Only stage J+1 can be in transition or zero;
every stage at least J+2 is zero. This complete conservative active set is
proved by exact order relations. No enormous exponential is converted to
binary64, and the positive h is never replaced by zero. A private source
adapter must still authenticate the common domain and all supplied norms.

`constructFinalSummationFromRoots` consumes the supplied Cartesian
potential, direct azimuthal scalar and pressure roots. A scalar b(s,z,t)
is pulled back at s=x1^2+x2^2 to form the direct vector b(-x2,x1,0).
Thus b is the azimuthal velocity divided by the radius. Complete potential
cutoffs are differentiated before taking the curl. The exact transition
term `grad(chi) cross A` is retained. Pressure receives its own cutoff.
The operator verifies direct versus expanded curls and the axisymmetric
direct-mean divergence. A rational identity may reduce a piecewise node
only when all three of its branches are literally the same operand.
This exact reduction leaves the original graph unchanged.

The fixed uncut U_J is returned only when every increment through J is
actually supplied. A valid cutoff field can exist without those uncut
increments; in that case its fixed reference is explicitly unavailable.
Both metadata and the existing source graph prefix, source parameters and
captured function definitions are protected by the private result seal.

`fixedStageFinalResidualComparison` uses one finite U_J, its residual and
its own flat E_(J,m,N). It requires the error through m+2 derivatives and
the finite velocity through at least m+1 derivatives. The exact Cartesian
Navier–Stokes difference constant is `6*2^m`. The comparison never sums
the finite-stage flat remainders. Original scalar exponents require their
separate source order proof and cannot enter this rational comparison by
implicit conversion.

## Observed validation

| Attempt | Node tests | Independent checks | Result |
|---|---:|---:|---|
| 1 | 10/10 | 1,279 | Rational window, complete curl and fixed-J consumer passed. |
| 2 | 13/13 | 1,326/1,335 | Nine independent scalar checks did not account for exact folding of the rational base scale. The failed record is preserved. |
| 3 | 13/13 | 1,335/1,335 | Original-h scalar graph, relative window and the corrected independent constant-fold handling passed. |

Attempt 3 captured 15 source files before execution and confirmed every
byte afterward. Its receipt SHA-256 is
`5ec13daba8d23301b86f86ba22c9ad13580f93a9947bcaf0341de0037856a175`.
The independent Python verifier uses exact Fraction/Laurent arithmetic
and separate 80-digit Decimal formulas for the generic analytic cutoff
and complete curl. The original h is a formal indeterminate in the
algebra checks; no source-scale numerical value is asserted.

## Remaining source attachment

The exercised fields and norm values are explicit fixtures. Authentication
of complete original correction roots, all current norm constants and
the common q domain remains required. Accordingly, every original final
field, original criterion, whole-K energy and whole-M3 completion flag
remains false. These kernels prepare the remaining construction without
changing the original 55/64 acceptance assessment.
