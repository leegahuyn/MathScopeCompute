# A concrete input producer and the narrower remaining pressure obligation

This addition refines the route described in the frozen
`FORMAL_BRIDGE_REMAINING.md`. It does not modify that frozen document or
any source used by the existing analytic and interval receipts.

## Executed same-datum kernel inputs

`SameDatumInputs.lean` defines the actual new `Md`, `T`, positive `h`,
`j=h^4`, `sigma=j/2000`, `rho=sigma^2/65536`, and the actual coefficient
window `[-33/32,33/32]`. It constructs the literal one and eta functions
with their complete adjacent derivative chains using the original
`AxisCoefficientSpace.ofJetFamily`. It proves their all-order weighted
bounds, norm bounds, and identities of every radial coefficient.

The file also supplies an actual instance of the original complex
Cauchy producer for `inverseL=(1-2h eta^2)^(-1)`. Its complex neighborhood
has radius **16 times the chosen rho**, and no existential radius is
substituted. The denominator norm is at least 1/2 on this entire tube.
The original `NaturalAxisCoefficients.boundedAxisElement` then constructs
the true coefficient element. A proved bound
`radiusLoss(1/16)<=2` gives norm at most four. The equality with the
actual inverse-L function is a kernel theorem.

The independent runs are append-only under `attempts/`. Each run
preserves the exact Lean file, complete diagnostic output, printed
axioms, kernel hash, original commit, and original tracked-source hashes
before and after execution. Failed drafts remain failed. The first
successful one/eta run is `0003`; the first successful inverse-L run is
`0005`. The allowed printed axioms are ordinary Lean/mathlib foundational
axioms (`propext`, `Classical.choice`, `Quot.sound`); no accepted producer
uses `sorryAx` or a postulated derivative bound.

## The upstream Cauchy constructor is already available

The original repository contains more than the abstract reverse
constructor. `AnalyticCoefficientBounds.lean` proves the Cauchy estimate,
the equality between real restrictions of complex jets and genuine
real iterated derivatives, and their adjacent derivative identities.
`UnitHolomorphic.toAxisSpace` turns those proved jets into an actual
coefficient element. `NaturalAxisCoefficients.boundedAxisElement` handles
an explicit finite complex value bound on an arbitrary supplied window.
These existing theorems are used by the inverse-L instance above.

The first missing piece is therefore **not a missing generic Cauchy
theory**. It is the explicit application of that theory to all the
new pressure-dependent fields and the final positive amplitude, with
our chosen window, rho, Q and C.

The higher `NaturalAxisCoefficients.CoefficientFamily` and
`AnalyticInputs` structures fix a different window, `[-11/10,11/10]`.
Their existence theorems also choose a neighborhood radius and a value
bound by compactness. Those values have not been identified with the
fixed new rho and Q. The lower, arbitrary-window constructor is the
appropriate route for the current profile.

## Why the canonical schedule wrapper is excluded

The original `SchedulePressure` module supplies an actual pressure
integral and its complex extension from `OutgoingTail.TailData`. It
proves smoothness, pressure signs, and analyticity, without assuming
those properties of a caller-provided pressure.

The new parameters `P=exp(2T)`, `m=Md`, `lambda=exp(-1000T)`, and
`wait=60000T` can be inserted in its core schedule. However its complete
tail fixes

* `flattenLength=10*(stepBound+1)*log(2)+1`;
* `tailCoefficient=exp(-5)/(16*(stepBound+1))`.

The frozen new schedule uses `Tf=128` and `co=1/256`. In particular the
original tail coefficient is strictly less than `1/256`, so the two
complete schedules cannot be identified merely by equating the core
parameters. Accordingly the comparison objects in the Lean file are
named `canonicalTail`, `canonicalPressure`, and
`canonicalComplexPressure`. Their theorems are **not evidence that the
new A.21 datum has been embedded**, and are excluded by the run receipt.
The transient pre-rename draft is retained only in failed attempt 0006.

The viable direct route is to define the new clock weight and shape
exponent literally and prove `PressureDatum.Admissible` for those
functions. That original theorem then supplies the correct pressure's
holomorphic extension and real identity. The remaining explicit value
bounds on the chosen tube, assembly of all fields, amplitude construction,
and the chosen contraction threshold must still be instantiated. A
generic existence theorem or the pressure of the canonical tail cannot
replace those steps.
