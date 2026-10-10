# Independent review of the original Lean route for the fixed new datum

## Decision

The original generic coefficient-space and contraction theorems can preserve
the new choices `I=[-33/32,33/32]`, `rho=sigma^2/65536`, and
`Lambda=Q^64`. The convenience constructor `exists_analyticInputs` does not
by itself identify those choices. More seriously, instantiating the original
`OutgoingTail.TailData` with the new `P,m,lam,wait,h` does **not** identify the
new literal outer schedule: its flattening duration and terminal coefficient
are fixed differently in the original source.

This is a read-only review of the pinned source. It identifies reusable proof
terms and the actual remaining proof obligations. It is not a newly compiled
Lean proof of the complete new pressure or nonlinear fixed point. No original
source, source freeze, existing certificate, or running Comparator was changed.

## 1. The original schedule and the selected schedule

The pinned original commit is
`f9e8bc5b38b6e212696e8a30e3e91517af887bbd`. Source bytes examined here are
copied and hashed in the companion independent review receipt.

The new outer expressions are `Md=2^20`, `T=exp(Md)+10`,
`Pstar=exp(2T)`, `lambda=exp(-1000T)`, `h=exp(-8002T)`,
`Tf=128`, and `co=1/256`.

| Part | Original source definition | Relationship to the new schedule |
|---|---|---|
| Literal smooth step | `OutgoingSchedule.sigma` | Same prescribed step. |
| Initial and axial angular field | `radialAmplitude` integrates `slope-1/2`; `angular` multiplies by `1/(1+eta^2)` | Same expressions when `P=Pstar`, `dropLength=T`, `lam=lambda`. |
| Axial decrease | `dropCoefficient m y`; `axial_drop` evaluates at global clock `1+t` | Same local formula `4(1-sigma(log(1+t)/Md))*eta`. |
| Reserved shaped wait | `Parameters.wait`; `paperParameters` selects `60 log(1/lam)` | Equals `60000T` for the new positive lambda. |
| Pulse end | `pulseStart + 13/lam` | Same stage position. This does not assert that the separate selected pulse-moment coefficients are identical. |
| Flattening | `flattenLength=10*(stepBound+1)*log 2+1` | A fixed chosen original number; no proof identifies it with `128`. |
| Uniform wait | `uniformWait=30 log(1/lam)` | Same duration `30000T`, after its own flattening end. |
| Release slopes | Unit transition to `-1`, hold `4 log(1/h)`, unit transition to `-h` | Same relative slope formulas. Absolute stage locations depend on flattening. |
| Initial release lag | `initialLag=(lam-h)/(1-lam)` | Same reset value. Using it as the actual incoming lag requires the exact angular reset equation. |
| Terminal coefficient | `tailCoefficient=exp(-5)/(16*(stepBound+1))` | Provably not the new `1/256`. |
| Terminal taper | `tailShape=1-rho+rho*sigma((t-1)/2)`, `rho=tailCoefficient*h` | Same family, different fixed coefficient. |
| Terminal wait | `decayHold=log(releaseLag(rampEnd)/tailDebt)/(1-h)` | Same selection formula applied to its own terminal debt; no identity with the new selected wait follows. |

`stepBound` is `Classical.choose exists_sigma_derivative_bound`. The source
proves `stepBound>=1`, but it does not make `stepBound` the particular explicit
derivative bound used in the new interval audit. `TailData` has only `core`,
`h`, `h_pos`, and `h_small` fields; neither `Tf` nor `co` can be supplied to it.

There is an elementary quantitative obstruction for the coefficient. Since
`exp(5)>=1+5+25/2=37/2` and `stepBound+1>=2`,

\[
 0<c_{o,\mathrm{original}}\le\frac{1}{32(37/2)}
 =\frac1{592}<\frac1{256}=c_{o,\mathrm{new}}.
\]

This rules out identifying the two literal taper coefficients. It does not
claim, solely from that inequality, that two complete pressure integrals could
never happen to agree. Rather, no equality of their actual fields or pressure
functions has been provided, so the original `SchedulePressure.axisPressure_eq`
is not a proof of equality for the new datum.

## 2. The shortest pressure interface does not require the entire original tail

`PressureDatum.Admissible g a 1` has just these fields:

1. `cap_nonneg : 0 <= 1`;
2. `integrable : Integrable g`;
3. `nonneg : forall y, 0 <= g y`;
4. `measurable : Measurable a`;
5. `exponent_nonneg : forall y, 0 <= a y`;
6. `exponent_le : forall y, a y <= 1`.

For the new actual unedited pressure schedule, define
`a(y)=1-sigma((y-endpoint)/128)` and `g(y)=E_unedited(y,0)^2`, with
the actual new reset, terminal wait and `co=1/256` in `E_unedited`.
The exponent fields follow from the literal step. Nonnegativity follows
from the square. Integrability can be proved by splitting the clock into
the left ideal interval, a finite middle interval, and the eventual exact
power tail. Their weight formulas are respectively `Pstar^2*exp(y/5)`,
a continuous function on a compact interval, and a constant times
`exp(-(1+2h)*y)`. All endpoint identities and constants must be derived
from those actual definitions, rather than accepted as a new opaque field.

The real factorization used in `SchedulePressure.angular_factorization`
is purely algebraic: an arbitrary eta-independent radial multiplier cancels
in the ratio to eta zero. The same argument for `Tf=128` gives

\[
 E(y,\eta)^2=g(y)\exp[-2a(y)\log(1+\eta^2)].
\]

Then `PressureDatum.pressure`, `integrable_kernel`, `complexPressure`,
`hasDerivAt_complexPressure`, and the existing analyticity and real-value
theorems apply directly to the new functions. The exact zero pressure
increment of the later angular moment correction is a separate equality
needed to identify this unedited integral with the corrected final field.

The `Admissible` structure alone gives no explicit bound by `4K`, where
`K=Pstar^2`. The actual mass estimate `integral(g)/2<=4K`, ideal-prefix
identity, and resulting complex bounds `|P|<=5K`, `|P'|<=160K` must also
be supplied from this same new schedule for the fixed norm budget `Q`.
An unspecified compactness bound cannot silently be substituted for them.

## 3. Preserving the fixed real window and radius

`NaturalAxisCoefficients.window` is `[-11/10,11/10]`, whereas the new proof
uses `[-33/32,33/32]`. Its `CoefficientFamily` and `AnalyticInputs` structures
hard-code the former window. Moreover `exists_coefficientFamily_on_neighborhood`
selects `epsilon=outerRadius/2`, while the new proof uses a ratio `1/16`.
The general existence theorem therefore does not identify the fixed new
coefficient space or its explicit norm envelope.

The source already provides a generic alternative:

```
NaturalAxisCoefficients.boundedAxisElement
  {I} {epsilon outerRadius B} {f}
  (0 < epsilon) (epsilon < outerRadius) (0 < B)
  (AnalyticOnNhd complex f (closedTube I outerRadius))
  (forall z in closedTube I outerRadius, norm (f z) <= B)
```

It produces an element of `AxisSpace I epsilon`. The existing
`boundedAxisElement_norm` and `boundedAxisElement_coefficient` identify
its actual norm bound and real coefficients. Its construction uses
`AnalyticCoefficientBounds.realJet`, `cauchy_bound_le_weight`, and
`UnitHolomorphic.toAxisSpace`; thus compatibility of all real derivative
jets is already proved by the original source.

Use `I` equal to the new window, `epsilon=rho`, and `outerRadius=16rho`.
This smaller closed tube lies inside the actual common complex tube from
the new proof. The exact norm loss is

\[
 \operatorname{radiusLoss}(1/16)
 =\frac{1+1/16}{(1-1/16)^3}
 =\frac{4352}{3375}<\frac43<2.
\]

For a shorter Lean bound, `(m+1)^2<=4^m` bounds its defining series by the
geometric sum `4/3`. Construct `AxisData` and the corresponding
`NaturalAxisBridge.CompatibleData` directly for this `I,rho`, using the
generic coefficient identity. There is no need to alter the original
hard-coded convenience structures. A solution obtained instead on the
larger original window would need a proved restriction map and uniqueness
comparison before being identified with the new one.

For the normalized amplitude, use
`AnalyticCoefficientBounds.uniform_normalizedExp_axisData`, which also
accepts arbitrary `I,epsilon,outerRadius` and an explicit real-part bound.
The new primitive bound `|psi|<=64/sigma^2` gives the actual permitted
normalizer `Caxis=exp(64*Lambda/sigma^2+1)`. The original
`AnalyticPrimitive` theorems supply the derivative of the actual integral
primitive on the explicit convex tube. Choosing an unrelated compact
supremum or a different amplitude would not preserve the new fixed point.

## 4. Preserving Lambda = Q^64

The exact reusable conclusion is
`AxisContraction.exists_unique_natural_fixedPoint`. Its input is

\[
 \Lambda\ge 1+B_{\rm original}(R,2)+L_{\rm original}(R,2),
 \qquad R=\|\operatorname{referencePair}\|+1.
\]

The `B` and `L` here are the numerical fields of the source's complete
`controlledRemainder` tree; they are not an arbitrary norm or Lipschitz
assumption. To instantiate the theorem at the selected Lambda, prove the
actual field norms, actual operator norms, and `R<=Q`, then propagate those
bounds through that same positive tree. The audited upper polynomials are

\[
 B(Q)=2Q^5+3Q^6+3Q^7+11Q^8+8Q^9+2Q^{10}+29Q^{11}
 \le58Q^{11},
\]
\[
 L(Q)=2Q^4+3Q^5+4Q^6+17Q^7+14Q^8+4Q^9+58Q^{10}
 \le102Q^{10}.
\]

For `Q>=2^260`, `1+58Q^11+102Q^10<=161Q^11<=Q^12<=Q^64`.
The fixed-point displacement and contraction are then bounded by
`29Q^-53` and `51Q^-54`, as in the frozen analytic proof.

The original operator estimates already give multiplication `64`, average
`1`, primitives and regular inverses `80`, parameter primitive `80/rho`,
and mixed/parameter products `5120/rho` (dot products `5120`). The
single identity `Q*rho=2^244*K` puts all these within `Q`.

A useful formal shortcut for the resolvent preserves the selected `Q`.
`AxisResolvent.naturalResolvent_norm_le`, followed by the existing
`factorialMajorant_le_exp_term` and exponential sum, gives

\[
 \|S\|\le\exp(2560\|\chi\|)\le e^{5120}\le K,
\]

because the actual source has `T>=2^20+11` and `K=exp(4T)`. Thus a new
formal proof of the sharper Bessel-type `exp(160)` estimate is unnecessary
for `S<=Q` and `R<=Q`. For example, even the loose compatible input bounds
`norm inverseL<=4`, `norm Zstar<=3600K` give
`norm reference_u<=36,864,000K`; `norm reference_phi<=2K` and the extra
ball radius one are also absorbed by `Q`. This shortcut is restricted to
the actual selected source parameters, not the broader `Q>=2^260` abstract
family without its relation to `K`.

Finally, the resulting coefficient fixed point must be connected using
`fixedPoint_integrated_equations` and the original actual resolvent identity,
then the coefficient evaluation/derivative bridge. Uniqueness in the same
radius-one ball identifies it with the Picard limit used by the frozen
mathematical construction. None of these final instantiated equalities is
claimed proved merely because the generic theorem exists.

## 5. Completion boundary of this review

The companion checks pin the source and selected parameter expressions,
recompute the elementary scalar comparisons above, and verify the cited
declarations occur in the examined source. They do not compile these new
applications. At the time of review, a producer for actual `one`, `eta`, and
`inverseL` coefficients was being developed in the separate formal input
folder. This review does not assign its later state or promote N3-03.

The critical next interface is the new actual `g,a` pressure constructor
with its proved integrability, factorization, and explicit mass bound. The
rest of the fixed-radius path is supported by the reusable generic source
theorems described above.
