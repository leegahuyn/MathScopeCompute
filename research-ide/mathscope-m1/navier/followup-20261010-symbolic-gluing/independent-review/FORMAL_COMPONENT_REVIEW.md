# Independent review of the actual pressure, amplitude, and contraction inputs

This review concerns the accepted `PressureSelection` attempt 0001,
`AmplitudeInput` attempt 0002, `AmplitudeDynamics` attempt 0002, and
`ThresholdBridge` attempt 0005. The threshold proof bytes are identical to
the accepted 0004 proof; 0005 additionally produced its module output. The
review also follows their actual use by `OperatorBounds` 0004 and
`ConcreteProducer` 0002.

The review finds no missing analytic premise in these components' stated
conclusions. The pressure and amplitude proofs use the new literal schedule
and the specified radius. The generic threshold proof retains its explicit
input norm requirements, and the concrete producer supplies those requirements
for the actual fields, operators, resolvent, and reference radius. This is a
source and provenance review, not a second claim to have independently run the
parent's original kernel executions. A separate clean compilation of all
custom sources is being prepared by the parent.

## 1. The selected pressure really is the new pressure

`SameDatumInputs` 0012 defines `newClockWeight` from the exact new angular
clock, with flattening length 128 and terminal coefficient `h/256`. The
pressure is `PressureDatum.pressure newClockWeight newShapeExponent`.
`PressureSelection` does not identify the original `OutgoingTail.TailData`
pressure with this new integral. It reuses the original release ODE and ramp
only: `releaseLag`, `releaseAdjustment`, and `rampEnd` depend on the selected
core lambda and h, not on the old flattening length or old terminal
coefficient. The new tail debt and the logarithmic wait are separate literal
definitions.

The new tail derivative is `(h/512) * sigma'((t-1)/2)` and integrates to
`h/256` on `[0,3]`. Nonnegativity and `0 < h < 1` give

\[
\frac{h/256}{1-h/256}\le Q_p\le
e^3\frac{h/256}{1-h/256}\le e^3 h/255<e^{-2}h.
\]

The last strict inequality follows from `e^5 < 3^5 = 243 < 255`.
The original `initialLag_gt_h` and `releaseLag_lower` imply
`Q_p < releaseLag canonicalTail canonicalTail.rampEnd`. Thus the actual
chosen logarithmic hold is strictly positive and its exponential decay hits
the new debt exactly. This matches the unchanged release ODE's debt, including
the division by `1-newTailRho`; no missing normalization was found.

Positive core, release, and tail clocks imply the exact ideal prefix for all
`y ≤ 0`, with `g(y)=Pstar² exp(y/5)` and `a(y)=1`. The final theorem invokes
the original `NaturalAxisData.pressureData_of_ideal_prefix` with the actual
`newPressure_admissible` and `Pstar_ge_two`. Consequently the conclusion is
`NaturalAxisData.PressureData newPressure`, with no argument requesting the
caller to supply positivity, smoothness, or a pressure bound. The additional
literal integral identity was already proved in the base module and is
exported by the concrete producer.

This proof supplies the real axis pressure hypotheses. It does not by itself
replace the independent narrow numerical pressure intervals or prove every
outer moment identity; those remain separate evidence components.

## 2. The amplitude is bounded on the specified tube

The amplitude producer uses the same `axisWindow`, `rho = sigma²/65536`,
`Q = 2^260 Pstar²/sigma²`, `Lambda = Q^64`, and
`C = (1+Q^300)^10 exp(Q^200)`. These are not parameters chosen anew by an
existence theorem. `ConcreteProducer` proves the amplitude's Lambda and C
equal the operator producer's selected Lambda and C by definitional equality.

The phase is the original straight-segment primitive of the actual complex
gradient. Holomorphicity is proved on an **open** convex thickening of radius
`32 rho`; that set contains zero and contains the closed `16 rho` tube. The
wide denominator bounds show that this open domain lies in the original
regular set. The primitive theorem therefore applies on an open neighborhood
of every point of the closed smaller tube. Merely knowing holomorphicity on
a closed set would not have sufficed; the explicit open neighborhood in this
proof resolves that issue.

Every segment from zero to a point in the smaller tube remains in that tube.
The already constructed gradient bound `100/sigma²` and `|z|≤2` yield
`|phase(z)|≤200/sigma²≤Q`. Hence

\[
\Re(\Lambda\,phase(z))\le Q^{65}\le Q^{200},\qquad
|e^{\Lambda phase(z)}/C|\le1.
\]

The original `boundedAxisElement` is then applied at **epsilon = rho** and
outer radius `16 rho`. Its coefficient theorem identifies the actual real
amplitude, and its norm theorem gives `radiusLoss(1/16)<2`. There is no
substitution of an unspecified existential epsilon. Radial constancy and the
exact real coefficient formula follow from the same constructor.

`AmplitudeDynamics` derives the real phase derivative from the complex
primitive derivative, differentiates the exact exponential divided by the
constant C, and uses the already proved positive amplitude to cancel the
denominator. It proves the literal logarithmic derivative
`Lambda * realGradient`, including on the real interval endpoints via an
ambient derivative. No finite difference or numerical derivative is used.

## 3. The contraction bounds are derived from the original remainder

`ThresholdBridge.InputNormBounds` contains the radius, resolvent, original
operator and field norms, and the three scalar bounds. It contains neither a
pre-assumed remainder bound nor a pre-assumed contraction conclusion.
`originalBound_le_polynomial` and `originalLip_le_polynomial` unfold the
original `controlledRemainder` and its original `Controlled` operations.
The literal positive expressions are bounded by monotonicity, then their
expanded polynomials are identified by the kernel's ring proof.

The independent exact integer polynomial replay recovers

\[
B=2Q^5+3Q^6+3Q^7+11Q^8+8Q^9+2Q^{10}+29Q^{11},
\]
\[
L=2Q^4+3Q^5+4Q^6+17Q^7+14Q^8+4Q^9+58Q^{10}.
\]

Their coefficient sums are 58 and 102. For the actual `Q≥2^260`, the
threshold is at most `161 Q^11≤Q^12≤Q^64` and the sharp displacement is at
most `58 Q^11/(2Q^64)=29/Q^53`. The theorem applies the unchanged original
`exists_unique_natural_fixedPoint`, retaining uniqueness within its radius
one ball. It does not claim uniqueness among all coefficient-space objects.

`OperatorBounds` supplies each field and operator norm from the selected
constructors. Its resolvent estimate uses the original factorial majorant and
`exp(5120)≤Pstar²`; the reference pair radius is also explicitly bounded by Q.
The final concrete producer substitutes `actualAmplitudeInput_norm` and
selects the fixed point of that actual map. Its scaled equations use the
original integrated equations and `integrated_solution`, and its uniform
mixed derivative error uses the original coefficient-space theorem.

## 4. Provenance and limits of this review

The append-only review receipt snapshots the exact accepted sources,
producer receipts, logs, and available runners. It checks their source,
output, log, runner, dependency, original-commit, and kernel pins where the
producer recorded them. All original tracked files are compared before and
after this review; the crucial original Lean files are also compared with
their bytes in the pinned git commit. The printed axiom lists in the actual
logs must match the producer records and use only `propext`,
`Classical.choice`, and `Quot.sound`.

This independent review distinguishes source reasoning, exact arithmetic
replay, receipt validation, and a new compilation. Only the first three are
performed by its verifier. The parent's forthcoming clean custom-module
compilation must be cited separately for its own execution evidence.

The concrete finite coefficient consumer is separate: `AxisFiniteJet` 0002,
`SelectedReferenceBoxes` 0004, and `ConcreteFiniteJet` 0006. It already proves
25 exact nonlinear dyadic coefficient enclosures and, at eta zero throughout
`|Y|≤5`, a finite-polynomial error below `2^-118`, with nonlinear comparison,
factorial truncation, and rounding accounted for separately. Neither that
consumer nor this review claims a direct kernel evaluation of all 4,792 old
symbolic nodes or of all 125 mixed coefficient intervals.
