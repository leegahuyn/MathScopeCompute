# The selected same-datum analytic producer now runs in the original kernel

## Result and scope

`assembly-attempts/0002/ConcreteProducer.lean` compiles with exit code 0 in
the original Lean 4.34.0-rc2 runtime. Its nine audited declarations use
only `propext`, `Classical.choice`, and `Quot.sound`. They construct a
particular coefficient-space fixed point for the **actual selected new
pressure, radius, normalization and contraction scale**, prove its
uniqueness in the stated unit ball, and apply the original
`NaturalAxisBridge.integrated_solution` to it.

The previous assessments in `DIRECT_ORIGINAL_ROUTE.md` and the frozen
`../FORMAL_BRIDGE_REMAINING.md` describe an earlier stage. The missing
actual input construction identified there has now been implemented.
Those earlier documents and execution receipts have been retained so
that their historical status cannot be confused with a newly executed
proof. The numerical finite-jet consumers are separate modules that
import this frozen concrete producer. The concrete finite consumer also
passed the original kernel in `independent-review/formal-finite-jet/attempts/0006`.

This component supplies the actual axis solution and its formal error
connection for the same Theorem 4.6 leading profile used by the
continuation, gluing, cone, support and endpoint proofs. The final
assembly records those other components separately.

## Literal parameters and datum

The definitions are

\[
M_d=2^{20},\quad T=e^{M_d}+10,\quad P_*=e^{2T},\quad
\lambda=e^{-1000T},\quad h=e^{-8002T},\quad j=h^4,
\]
\[
\sigma=j/2000,\quad \rho=\sigma^2/65536,\quad
I=[-33/32,33/32],\quad Q=2^{260}P_*^2/\sigma^2,
\]
\[
\Lambda=Q^{64},\qquad C=(1+Q^{300})^{10}e^{Q^{200}}.
\]

`SameDatumInputs` defines the new clock and shape exponent with the
selected flattening length **128** and tail coefficient **1/256**.
`newClockWeight` is the square of the actual radial amplitude, and
`newShapeExponent` is its actual angular exponent. Its positivity,
measurability and integrability are proved. The left and right tails
are handled by exact exponential identities, while the finite middle
part is continuous. This supplies all six fields of the original
`PressureDatum.Admissible` directly.

The resulting pressure satisfies the kernel identity

\[
\mathrm{newPressure}(\eta)
 =-\tfrac12\int_{\mathbb R}\mathrm{newAngular}(y,\eta)^2\,dy.
\]

The root module `PressureSelection` additionally proves that the
selected terminal decay hold is positive, proves the complete ideal
prefix, and constructs the original `NaturalAxisData.PressureData`
for this same `newPressure`. In particular, the signs and smoothness
needed for the natural-axis data are conclusions about this particular
integral.

The comparison-only `canonicalTail` and `canonicalPressure` definitions
remain excluded. The original `OutgoingTail.TailData` fixes its own
flattening length and a coefficient strictly below 1/256; agreement of
the core constants would not establish equality with our new schedule.
The successful producer uses the separately defined new functions.

## Actual coefficient elements at the selected radius

The lower-level original constructor
`NaturalAxisCoefficients.boundedAxisElement` accepts an arbitrary
window. It is applied to our fixed window and radius, with outer
Cauchy radius exactly `16*rho`. The proof does not call the higher
existence theorem that selects a different radius by compactness.

The original Cauchy theorem produces all real adjacent derivatives,
the all-order weighted coefficient bounds, and the coefficient-space
element. The additional scalar proof
`radiusLoss_sixteenth_le_two` bounds the exact Cauchy radius loss by 2.
Thus no sequence of assumed derivative bounds is substituted for an
actual function.

On the entire complex tube of radius `16*rho`, the following bounds
are kernel theorems. Here `K=Pstar^2` is only an abbreviation in this
table, not a replacement parameter.

| Actual complex input | Complex value bound | Coefficient norm bound |
|---|---:|---:|
| one | 1 | 2 |
| eta | 2 | 4 |
| `d=1-eta^2` | 4 | 8 |
| `inverseL` | 2 | 4 |
| `Ustar` | 7 | 14 |
| `UstarEta` | 4 | 8 |
| `Wstar` | 40 | 80 |
| `Hstar` | 25 | 50 |
| `Zstar` for `newPressure` | `262144*K` | `524288*K` |
| `chi` | 1 | 2 |
| normalized gradient | `100/sigma^2` | `200/sigma^2` |

The pressure estimates used to prove the `Zstar` bound are
`norm(newComplexPressure z)<=512*K` on the pressure strip and
`norm(deriv newComplexPressure z)<=16384*K` on the selected tube.
They follow from the actual mass theorem `integral newClockWeight<=64*K`
and a radius-1/32 Cauchy estimate. These deliberately generous formal
bounds fit the already selected `Q`; they do not change the pressure or
replace the sharper analytic interval estimates elsewhere.

For the rational fields, the actual denominator bounds are

\[
|L(z)|\ge \tfrac12,\qquad
|H(z)^2+\sigma^2|\ge\tfrac12\sigma^2.
\]

`selectedElement_coefficient` identifies every radial coefficient:
coefficient zero is the actual real field and every positive radial
coefficient is zero. `selectedAxisData_compatible` fills all the
original compatibility fields, including the actual derivative of
`Ustar`.

## Actual operators and the chosen contraction scale

`OperatorBounds` uses `AxisContraction.coefficientOperators` without
changing any operator. The complete collection has the original bounds
shown below.

| Original operator | Proved operator norm bound |
|---|---:|
| product | 64 |
| average | 1 |
| primitive, multiply by Y, regular inverses 1 and 2 | 80 |
| parameter primitive | `80/rho` |
| inverse parameter products 1 and 2 | `5120/rho` |
| inverse mixed products 1 and 2 | `5120/rho` |
| inverse radial-dot products 1 and 2 | 5120 |

The exact scalar identity `Q*rho=2^244*Pstar^2` proves that all these
norms are at most `Q`. The actual fixed-field norms are also at most
`Q`. The angular resolvent is the original norm-convergent alternating
resolvent; its factorial majorant gives

\[
\|S\|\le e^{2560\|\chi\|}\le e^{5120}\le P_*^2.
\]

The actual reference pair consequently satisfies

\[
\|x_0\|\le 2^{34}P_*^2,\qquad \|x_0\|+1\le Q.
\]

`selectedInputNormBounds` fills every field of the root's original
remainder-bound bridge. That bridge unfolds the original controlled
remainder tree and derives its two literal polynomials. The resulting
threshold is at most `Q^64`, and its error estimate is

\[
\frac{B(Q)}{2Q^{64}}\le \frac{29}{Q^{53}}.
\]

Thus the chosen `Lambda=Q^64` satisfies the original contraction
threshold for the actual input data. No operator, reference, fixed-field,
or threshold norm assumption remains in `selectedInputNormBounds`.

## The actual positive amplitude is inserted

`AmplitudeInput` proves analyticity of the original complex segment
primitive `axisPhase` on the selected tube. It uses an explicit convex
open domain of radius `32*rho`, not a selected unknown neighborhood.
On the inner tube its norm is bounded by `200/sigma^2<=Q`.

For the actual selected normalization, the complex function

\[
g(z)=e^{\Lambda\,\mathrm{axisPhase}(z)}/C
\]

has norm at most one. The original Cauchy constructor gives the
actual coefficient element `actualAmplitudeInput` with norm at most
two. Its coefficient/value theorems identify it with the original
`realAmplitude h j sigma Lambda C`. `AmplitudeDynamics` proves its
actual logarithmic derivative on the whole real window:

\[
\frac{g'(\eta)}{g(\eta)}
  =\Lambda\,\mathrm{realGradient}(h,j,\sigma,\eta).
\]

`ConcreteProducer` inserts this particular element into the previously
proved contraction theorem. Its final `selectedFixedPoint_spec` has no
free amplitude, pressure, radius, threshold, or norm hypothesis.

## Exports for finite jets and the other stages

The namespace for all exports is `MathScope.SameDatumInputs`.

| Export | Concrete conclusion |
|---|---|
| `selectedFixedPoint_spec` | Actual fixed point, unit-ball membership, sharp error and uniqueness |
| `selectedFixedPoint_unique` | Any solution of this same equation in the ball equals the selected one |
| `selectedReference_phi_eq` | Angular reference is exactly `naturalResolvent ... chiInput oneInput` |
| `selectedPhi_reference_error` | Actual Phi differs from that precise reference by at most `29/Q^53` in coefficient norm |
| `selectedPhi_axis_coefficient` | The zeroth radial coefficient is exactly one on the whole closed window |
| `selected_scaled_solution` | Original smooth differential and integral system for Phi, u, the regular average, and pressure correction |
| `selected_uniform_mixed_error` | Every mixed ordinary derivative on every smaller radial interval has the original explicit error majorant |
| `selected_reference_leading_solution` | This same reference pair satisfies the original leading equations |
| `selected_actual_pressure_integral` | The selected pressure equals the literal new A.21 integral |
| `selected_actual_amplitude_logDerivative` | The actual normalized amplitude has its required differential identity |

The equality of `selectedElement .one` and `oneInput` is proved using
the original coefficient-space extensionality theorem. Their values
and all derivative coordinates are therefore not merely numerically
close: they are the same coefficient element. This identifies the
reference used by the evaluated finite comparisons with the reference
in the actual fixed-point theorem.

The frozen `AxisFiniteJet` module supplies the original coefficient
error, finite radial truncation, mixed derivative and separately
quantified rounding lemmas. `SelectedReferenceBoxes` and
`ConcreteFiniteJet` instantiate them with evaluated rational intervals.
The latter proves actual nonlinear coefficient enclosures for every
radial coefficient 0 through 24 at eta zero, with no remaining norm
hypothesis. For every real `abs(Y)<=5`, its actual finite-polynomial
theorem proves

\[
\left|\Phi(Y,0)-\sum_{n=0}^{24}c_nY^n\right|<2^{-118},
\]

where the `c_n` are explicitly recorded dyadic interval midpoints for
the same reference. The proof separates the nonlinear comparison error,
the factorial truncation error (less than `2^-120`), and coefficient
rounding (less than `2^-192`). General mixed derivative error and
truncation theorems apply to the actual selected Phi on the full
parameter window. The separate evaluated mixed-comparison receipt
records the finite angular chart and its rounding; the 125 mixed
coefficient boxes are not claimed to have been re-evaluated individually
by this 25-coefficient kernel module.

The numerical receipts and the formal no-premise producer are distinct
evidence records joined by these exact object identities.

## Exact finite radial/angular recurrence connection

`assembly-attempts/0004/ConcreteJetRecurrence.lean` is a further frozen
kernel-passing module. It projects the **literal original nonlinear
fixed-point equation** to every radial index, every angular derivative
order and every parameter value. It proves the resulting exact Phi and
u jet equations and their finite rectangular Taylor-block identity for
arbitrary truncation orders. The degree-24 radial, degree-4 angular
block is an explicit specialization.

This module also proves on the full window that the exact angular
reference coefficient is

\[
c_n^0(\eta)=\frac{(-\chi(h,j,\sigma,\eta)/2)^n}{n!(n+1)!},
\]

and proves equality of all its ordinary angular derivatives to the
derivatives of that explicit function. The normalized error export
`selected_normalized_xi_jet_error` states, with the actual selected
Phi and no norm assumption,

\[
\left|\frac{j^m}{m!}\,\partial_\eta^m c_n(\eta)
       -\frac{j^m}{m!}\,\partial_\eta^m c_n^0(\eta)\right|
\le \frac{j^m}{m!}\frac{29}{Q^{53}}w_\rho(n,m).
\]

The scaled coordinate is exactly `xi=eta/j`. These exports connect
the evaluated finite angular comparison and its positive nonlinear
error to the same selected coefficient family. The exact projection
identity does not assert direct numerical evaluation of the complete
4792-node nonlinear expression graph.

## Accepted immutable snapshots

All paths in this table are relative to this directory unless marked
as a sibling component. Every accepted module compiled in the original
kernel. Historical failed attempts remain failed and are not inputs to
the final replay.

| Module | Accepted snapshot | Audited declarations |
|---|---|---:|
| `SameDatumInputs` | `attempts/0012` | 15 |
| `FieldBounds` | `field-attempts/0009` | 8 |
| `OperatorBounds` | `operator-attempts/0004` | 5 |
| `ConcreteProducer` | `assembly-attempts/0002` | 9 |
| `SameDatumMass` | sibling `independent-review/formal-mass-bound/attempts/0002` | 5 |
| `ThresholdBridge` | symbolic-gluing `formal-threshold-bridge/attempts/0005` | 6 |
| `PressureSelection` | symbolic-gluing `formal-pressure-selection/attempts/0001` | 7 |
| `AmplitudeInput` | symbolic-gluing `formal-amplitude-input/attempts/0002` | 8 |
| `AmplitudeDynamics` | symbolic-gluing `formal-amplitude-input/dynamics-attempts/0002` | 3 |
| `AxisFiniteJet` | sibling `independent-review/formal-finite-jet/attempts/0002` | 8 |
| `SelectedReferenceBoxes` | sibling `independent-review/formal-finite-jet/attempts/0004` | 8 |
| `ConcreteFiniteJet` | sibling `independent-review/formal-finite-jet/attempts/0006` | 9 |
| `ConcreteJetRecurrence` | `assembly-attempts/0004` | 10 |

The `ConcreteProducer` source SHA256 is
`38b5ddc97514a00fcf9ee4f2cfc6a1030a2781bccb577fd8e14389ec97a3e7b2`.
Its receipt SHA256 is
`27713e2ae17299b39d80c22e27e2198978e827fe13f1bb77aa507f3da62c0546`.
Its output `.olean` SHA256 is
`893a7d08e45eccc0752138854cdabaaf1133aa769a77479ba462a7abfae118ea`.

The `ConcreteJetRecurrence` source SHA256 is
`8e7b8fdf8e60f2f52d7c88574cf3039c3c6abbe6253187f7b109a8e46df48561`.
Its receipt SHA256 is
`963bec64512aa384fb7fbeaf458b1b8cbe40442a1d0e2e094f01f598ad206193`.

The original commit remains
`f9e8bc5b38b6e212696e8a30e3e91517af887bbd`. The original kernel hash is
`cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5`.
Each actual run compares the original tracked files before and after,
and the final assembly runner additionally records every imported
source and `.olean`, its own output `.olean`, and the complete log.
The root's clean replay recompiles the whole accepted custom chain
from sources in a new empty output directory.
