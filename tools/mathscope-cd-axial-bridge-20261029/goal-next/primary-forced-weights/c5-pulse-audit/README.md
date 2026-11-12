# Archived pulse derivative budget

The original phase-free imaginary velocity is the full curl remainder, so
five derivatives of the velocity need **six** derivatives of the pre-curl
coefficient. For the original Volterra equation `w_v=Mw`, the normalized
positive recurrence through total degree six needs the matrix `M` through
degree five. Since `M` contains `B_v`, the moving frame `B` needs degree six.
Its normal contains `H_R,H_Z`, so this route needs live background `F,G`
through degree seven. Pressure through degree four needs the phase-free
amplitude and normal/pressure factors through degree four.

The archived lower-covariance receipt supplies slow `w`, square-root weight,
partition and cutoff entries through order six. Its weighted square-root
pole at this order is 144. The actual imported background C8 and weighted
target C7 norm graphs have finite numerical endpoints for every recorded
bound root. The checker verifies that those endpoints have exactly the graph
hashes and roots imported by the earlier source program. This is a degree
budget and an exact recurrence, not a constructed high-order source bound.

On the positive-weight interior, retain `sqrt(zeta)*delta_*^(-144)` and the
actual `P(v)` until the end. The earlier C3 potential code multiplies by a
Gaussian absorption bound to obtain an unweighted estimate; using that
absorbed estimate alone cannot establish the desired `sqrt(zeta)` weight.
Never divide by the transverse or longitudinal cutoff. Flat extensions and
overlap identities must be justified on the original chart at each seam.
The original fixed label, representative and band stay frozen under all
derivatives. The archived chart is distinct from the newer private family.

Still needed are the degree-six moving-frame/pulse positive graph attached to
the actual source, a weighted `C5` wave and `C4` pressure bound and its
numerical evaluation, original epsilon bookkeeping for the full curl, the
endpoint domination and current-family attachment. No final jet, N7/N8 gate,
or release verdict is advanced.

## Replay

Merge prior `Continuation20`, `21`, `23`, `25` and `26` delta ZIPs at their
package root, preserving paths. These contain all source input files below;
the checker and receipt are new. Set `p` to the saved goal directory:

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
python "$p/primary-forced-weights/c5-pulse-audit/audit_pulse_order6.py" \
  --potential "$p/whole-k-primary-potential-c3/initialized-primary-potential-c3.json" \
  --lower "$p/whole-k-annular-pressure-lower/lower-covariance-pressure.json" \
  --background "$p/whole-k-annular-wrz-norm/numerical/background-c8-complete.json" \
  --target "$p/whole-k-annular-wrz-norm/target-numerical/target-c7-complete.json" \
  --background-graph "$p/whole-k-annular-wrz-norm/background-c8.json" \
  --target-graph "$p/whole-k-annular-wrz-norm/target-c7.json" \
  --curl inputs/mode-one-source/research-ide/mathscope-m2/navier/actual-full-curl.mjs \
  --out pulse-order6.json
```

The standard-library Python replay prints `PASS`; this does not compile Lean.

## Fixed-slab scalar candidate

`check_slab_k.py` checks a conservative explicit candidate `K=T10`, with
`T0=2^30` and `T(j+1)=exp(Tj)`. It uses the numerical full-slow endpoint
receipt, the original directed source constants and the literal source
cutoff/map definitions. Every one of the 37 numeric endpoints checked is a
positive exponential tower of height at most six with innermost rational
strictly below `2^30`. The original `h` upper endpoint gives `h<1/64`.

The checker extends the pinned integer smooth-step derivative recurrence to
order nine. This is necessary even though the source chart/cutoff helper has
`n=7`: its time FTC expression contains the square of the ninth step
derivative. The partition itself is differentiated through order eight,
including the extra one-dimensional FTC face. On its active branch the
denominator is at least `1/4`; on its zero branch it is not evaluated. All
resulting explicit finite coefficients are less than `2^100000<T1`.

For the three-dimensional chart FTC, write the inverse chart as
`s=T+Z^2*s^(2h)`. Around the real box `1/2<=s<=2`, `|eta|<=1`, profile discs
of radius `1/4096` move `Z=s^D eta` and `T=s(1-eta^2)` by less than
`4/4096` and `11/4096`. The earlier inverse-chart contraction leaves a
physical `Z,T` polydisc of radius `1/256` around each shifted point and
keeps `|log s|<=4`. Cauchy therefore bounds each slow derivative of order
at most seven and the two `s,eta` FTC face derivatives by
`4*7!*256^7*4096^2`. There is no `X` or `R` dependence in `log s`. Retain
the original FTC unit integrands on the `X` faces and multiply by the full
box factor `(1+3/2)(1+2Xb-Xa/2)(1+2)`. The original annular radius bound
then gives the explicit coefficient used by the checker. This argument
assumes the cited contraction and the standard complex Cauchy estimate; it
is a written analytic proof, not a Lean theorem.

With `R=Rstar`, `r0=2^-34`, `u=2/kappa`, `W=exp(3 Bnorm^256 Lmax)`, the
original scalar formulas give

```text
dstar^-1 <= 3000000 * r0^-3 * W^4 * R^172
cy^-1/2  <= 64 * R^64 * W * kappa^-1/2.
```

The original source inequalities give `u>=2`, `1<Dgeom<4`, `Tg<6`,
`Lmax<1`, `massLower>=1/(480 W^2 R^83)` and `massUpper<=32 W^2`. Thus
the enumerated cutoff/chart/radius factors are below `T7`, `W^8<T8`, and
the two reciprocal factors are below `T9`. The exact exponential tower
`T10` dominates all of these and the archived slab C8/C7 endpoints.

This is a candidate for a **new fixed-slab version** of the scalar premise.
The original literal global `B_m` contains an enlarged all-band FTC norm;
the fixed-slab numerical bounds do not establish an upper bound on that
literal expression. The full mixed-jet proof must be rechecked on the slab,
including all points used by the Volterra time path, frozen representative
data, the original stability/cone and target lower bounds, Gaussian
domination, and seam extensions. No new live-family seal or C5 field bound
is claimed.

For replay from the merged package root, include the four source runtime
files from `work/goal-next/continuation27/original-primary-degree-runtime`
under `inputs/original-primary-degree-runtime`, and include the new
`full-slow-norms.json`. Older delta 24 has the fixed numerical input and
delta 21 has the lower-covariance producer and receipt.

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
r=inputs/original-primary-degree-runtime/research-ide
python "$p/primary-forced-weights/c5-pulse-audit/check_slab_k.py" \
  --norms "$p/primary-forced-weights/full-slow-norms/full-slow-norms.json" \
  --fixed "$p/whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json" \
  --lower "$p/whole-k-annular-pressure-lower/lower-covariance-pressure.json" \
  --lower-code "$p/whole-k-annular-pressure-lower/propagate_lower_covariance.mjs" \
  --global-class "$r/mathscope-m3/navier/source-global-class.mjs" \
  --family "$r/mathscope-m2/navier/actual-common-admissible-family.mjs" \
  --time "$r/mathscope-m2/navier/actual-gaussian-flat-tail-kernel.mjs" \
  --bump "$r/mathscope-m2/navier/actual-covariance-global-assembly.mjs" \
  --out slab-k.json
```
