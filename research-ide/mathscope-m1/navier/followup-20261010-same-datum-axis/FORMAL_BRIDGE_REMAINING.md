# Exact remaining kernel bridge for the new axis and evaluated jets

## Result

The mathematical same-datum construction, finite expression graph,
outward-rounded comparison evaluations, continuous incoming debt, and
explicit source derivative bounds have been supplied. They do not yet
constitute a Lean term instantiating the original analytic theorem for
this actual new A.21 datum. The first missing item is the construction
of the new analytic input functions as elements of the original
`AxisCoefficientSpace.AxisSpace I rho`, with their actual all-order
derivative bounds and their connection to the new outer pressure.

This is an identified proof obligation, not a failure of the original
conditional theorem or of its default build. The source inspected here
is commit `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`.

## 1. The genuine reverse constructor already present upstream

`AxisCoefficientSpace.ofSmoothFamily` takes an actual family
`F : Nat -> Real -> Real`, proofs of `ContDiffOn Real infinity (F n)`
on the fixed window, and a proof, for **every** n,m and eta, that its
actual iterated derivative is bounded by `C * weight rho n m`.
Its theorem `norm_ofSmoothFamily_le` then gives the coefficient-space
norm bound. The adjacent-jet version `ofJetFamily` requires continuity,
actual adjacent derivative identities, and the same all-order weighted
bound. These are executable source constructors, not untrusted norm
fields.

For each fixed input f in this construction, the intended radial family
is `F 0=f`, `F (n+1)=0`. The source's
`coefficient_ofSmoothFamily` and `jet_ofSmoothFamily` theorems then
identify the constructed coefficient with f and its real derivatives.
The functions are 1, eta, d, inverseL, Ustar, UstarEta, Wstar, Hstar,
zeta, Zstar, chi, and the final positive amplitude g. The first
nonpolynomial obligations are the separated rational chi/zeta and the
actual pressure term in Zstar. For g the proved uniform complex bound
must also be exported at the final C.

The prose Cauchy producer gives these all-order bounds mathematically.
No tool in this addition has converted that proof into the required
Lean `hF` and `hbound` arguments. Merely defining a new structure whose
fields are these desired propositions would not fill the gap.

## 2. Obligations after those elements have been constructed

| Required Lean object or theorem | Actual mathematical input | Current formal status |
| --- | --- | --- |
| New A.21 pressure definition and equality with the outer pressure integral | Exact new outer schedule and its pressure-neutral edits | Not instantiated in Lean by this addition |
| `Window`, positive rho, and the radial-constant input elements | I=[-33/32,33/32], rho=sigma^2/65536 and the actual functions above | Exact expressions and mathematical bounds supplied; full constructor terms missing |
| `AxisContraction.AxisData` | A,D,h and the eleven fixed coefficient fields | Source has the structure; new instance with all input identities missing |
| `NaturalAxisBridge.CompatibleData` | Radial constancy, one/eta evaluation, and UstarEta=derivative Ustar | Actual identities proved in prose; full constructor term missing |
| Amplitude element, radial constancy and norm<=2 | g=exp(Lambda psi)/C, final C=(1+Q^300)^10 exp(Q^200) | Mathematical and coefficient bounds supplied; element/proofs missing |
| Original `contractionThreshold<=Lambda` | Full original bound tree, Q>=2^260, Lambda=Q^64 | Exact scalar/polynomial certificate supplied; bound on the instantiated Lean operator norms missing |
| Same coefficient-space fixed point | Original `exists_unique_natural_fixedPoint` or `natural_axis_profiles` at that instance | Upstream theorem checked, new application term missing |
| Evaluation of that point and the leading profile equations | `NaturalAxisBridge.integrated_solution` and actual pressure primitive | Prose identification supplied; new kernel application missing |
| Numerical finite jet enclosure theorem | Directed intervals, exact comparison coefficients, Banach remainder and tails | Executed interval receipts supplied; reflected arithmetic/evaluation theorem not supplied |

`CompatibleData` is not a PDE residual assumption: the inspected source
requires radial constancy of each input, exact values of one and eta,
and the exact derivative relation for Ustar. Nevertheless those fields
must be proved for the specific constructed elements before invoking
the bridge. The finite checker does not treat the structure's mere
availability as a proof of them.

## 3. Why importing the final existence theorem is insufficient

The inspected `NaturalAxisBridge.exists_scaled_profiles` takes rho>0,
chi, AxisData, `CompatibleData`, and an amplitude norm bound. It
returns a threshold depending on those objects, then requires the
chosen Lambda to exceed it and requires the actual amplitude to be
radially constant and norm bounded. Its solution functions are the
evaluations of the resulting coefficient fixed point.

For this task, selecting different convenient input elements would
produce a different fixed point. Setting the positive amplitude to
zero would remove the pressure source and change the problem. Neither
operation would justify the N24 graph or the evaluated new-datum
receipts. A successful kernel build of the upstream conditional theorem
does not identify the new data with that theorem's parameters.

## 4. Smallest useful next formal implementation

The first meaningful executable implementation is a **new concrete
input producer**, using `ofSmoothFamily` and the exact new pressure
definition, with no additional existence assumptions. It should prove
the Cauchy-to-weight inequality once, instantiate it for the listed
fixed fields, and produce their norm bounds. With those terms present,
the existing operator theorems and the exact positive-polynomial
inequalities can produce the same fixed point, after which the radial
coefficient recurrence is an induction and the comparison intervals
can be reflected against the existing norm-to-evaluation theorem.

Proving a few independent rational identities, or adding another
conditional theorem parameterized by the missing input bounds, would
be executable but would not connect a numerical jet to this same
fixed point. This addition therefore does not report such a substitute
as completion of N3-03 or of the full N3-04 formal requirement.
