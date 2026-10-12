# Initial N6 class estimates: actual source and premise map

Date: 2026-10-12. This is an implementation review, not a new class certificate.
It identifies the exact existing bodies to which the original estimates must
be applied. A finite derivative graph supplies a source expression; it does
not alone prove a uniform weighted seminorm bound.

The source is *Finite Time Blowup for Navier–Stokes*, especially pp. 77–79,
84–88, 89–100 and 106–107. The retained PDF SHA-256 is
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The original parameter expressions and the positive lambda remain fixed.

## 1. The actual tuple and its current evidence

`source-global-initial-mean.mjs` has already constructed, in order, the full
primary pressure, the temporal update, the pressure of that updated tuple,
the five-profile update using its new P/J defects, and another full pressure.
The partial construction is the same 102,746 bytes in all four observed
attempts, SHA-256
`873d331724dadce29348434d444c8f2ab4bfa767d6a05ab0eae37747931dead7`.
The two conservation identities and all full nonlinear difference identities
passed. Attempt 4 passed 29/31 tests; its remaining derivative audit reached
the declared 6,500,000-node limit. All four receipts and source snapshots
are retained. The separate actual Fourier class-operator attachment in
attempt 4 passed, while its input current norms remain explicit premises.

For the private initialized mean `s`, the following are actual object paths,
not interchangeable expression identifiers from another graph:

| Object | Actual source path |
| --- | --- |
| Common expression facade | `s.G === s.temporal.G` |
| Original current | `s.temporal.pressure.current` |
| Current band and original family | `s.temporal.pressure.current.band` and `.band.family` |
| Full pre-update pressure and residuals | `s.temporal.pressure.pressure.value`, `.residual.Etheta`, `.residual.Ez` |
| Actual temporal inverse sources | `s.temporal.inverses.theta.body`, `.z.body` |
| Post-temporal velocity and P/J | `s.stages.temporal.velocity`, `.mean.P`, `.mean.Jtheta`, `.mean.Jz` |
| Five-map input defects | `s.bumps.actualInputDefects` |
| Post-five-map velocity, residuals and pressure | `s.stages.moments.velocity`, `.mean`, `.pressure.value` |
| Retained nonlinear remainder integrals | `s.nonlinear.remainderDefects` |

There is no `s.current` or `s.pressure` shorthand. The original underlying
source graph is `s.G.baseGraph === s.temporal.pressure.current.G`.
Constants generated in a separate norm graph must retain their graph
namespace; their integer node identifiers cannot be inserted into this graph.

## 2. Stable primary pulse estimates already have an implementation route

The required stability estimate is stronger than an absolute Gronwall bound
`exp(M*Ls)`. The latter may grow exponentially in the band parameter S and
does not prove the original polynomial-S wave class.

The original normalized system factors out
`P(v)=exp(integral(Ls/2,v,lambda-dref))`. It preserves the dissipative
diagonal `diag(0,-2*lambda)` and treats only the actual projected error and
`d-dref` as perturbations. The fixed primitive source bounds give an infinity
logarithmic norm at most `(2*E+Ed)/S`. Since `Ls <= Lmax*S`, its evolution
bound is `W=exp((2*E+Ed)*Lmax)`, independent of S. The source constants have
`E=Ed=Bnorm^256`, so the same bound is `exp(3*E*Lmax)`. Neither lambda nor the
negative diagonal is discarded.

These steps are already represented by the unchanged M2 modules:

| Required operation | Existing implementation | Additional M3 attachment needed |
| --- | --- | --- |
| Bind actual normalized matrix and envelope | `actual-pulse-gaussian-power-kernel.mjs:normalizedHomogeneousPulseBinding` | Pass both actual M3 `frame.wMatrix` systems, original P, lambda, dref, damping and projected error. |
| Stable mixed derivative recurrence | `actual-all-order-gaussian-jet-kernel.mjs:stableMixedVolterraPowerRecurrence` and `allOrderMixedGaussianJetPowerAudit` | Bind the actual primitive coefficient bounds and fixed source derivative orders; retain every lower-jet binomial term. |
| H inverse, positive weights and square-root jets | `actual-global-wave-bound-kernel.mjs:originalWeightedCovarianceJetPowers` | Supply the actual determinant/positivity floors and actual weighted target norms through the requested orders. |
| Actual finite target seminorm generation | `family.constructTargetWeightedNorms({derivativeOrder})` | Execute this method on the same private family; the stored recipe alone is not a computed norm row. |
| Complete per-band class adapter pattern | `actual-common-global-wave-bounds.mjs` | Use a new M3-private attachment. Do not forge its M2 physical-band seal. |

The M3 band retains the necessary source relationships:

- `band.family.uniformCovariance.primitiveProof` records the actual completed
  versus leading coefficient estimates on the original boxes, the complete
  normal and normal derivative, the frame and pressure terms, rounding and
  damping. `band.bounds.primitive` refers to that same primitive proof.
- The original common source threshold and its conditions are retained in
  `band.bounds`. The slow point and frozen representative are in the same
  original mesh box of diameter at most `4/S^3`. The all-fixed-order recipe
  does not choose a smaller q* for each derivative order.
- `band.families[j]` retains the full moving normal, the actual frame,
  `wMatrix`, reference lambda and dref, full damping, original P, the exact
  homogeneous Volterra system with e1 data, and `t=B*(P*w)`.
- Its carrier integers and representative are frozen before the slow and
  pulse derivatives. The full `H_R` and `H_Z` remain present.
- `band.target.H` is built from the literal original Haar/covariance
  integrals. `band.target.weights` and square-root weights are the actual
  `H^-1*T`. The determinant and positivity floors in `band.quantitative`
  come from the same original family.

For every requested finite order, the stable derivative recurrence solves
the actual variational equation with source
`D^I g + sum(0<J<=I, binom(I,J)*D^J A*D^(I-J)z)`. Its interval integration
adds a power of S. The higher-harmonic scalar damping is nonpositive; the
original evolution estimate is uniform over the finitely used nonzero
harmonics. The common source and fixed coefficient norms must be attached
before applying that recurrence to a new forced source. A generic forced
Volterra kernel with an exponential tail is useful for a finite evaluator
but does not replace this class estimate.

## 3. The primary covariance cancellation needed by (9.11)

`source-global-current.mjs` represents each of the two real waves per box
with its complete potential curl. `current.local.rows[j].curl.leading` is
the original primary amplitude; `.curl.remainder` contains the full slow,
auxiliary and cylindrical connection derivatives. The actual angular mean
is one half of the sum of the corresponding leading-leading and
remainder-remainder products. All six symmetric covariance components and
all 81 source boxes are retained. No derivative is taken only at one point
or at a single selected torus preimage.

The already executed signed-source module contains an internal
`sourceHAndLeadingIdentity(state)` proof. It binds the actual Haar integrals,
`a^2=y`, `H*y=T`, the source chart law, all original squared partition
functions and exact physical exponent conversion. Consequently the leading
primary covariance cancels the leading original stress exactly, including
the derivatives of the full squared partition. This proof is not exported;
a new current-class adapter should execute an additive equivalent binding
on its actual current, or consume an appropriate private proof object. A
historical JSON node identifier is not that binding.

The complete equations used for the class argument are (9.11):

```
Haar(Etheta) = (dR+2/R)(Haar(Wrtheta)-SigmaTheta0)
              -(dR+2/R)(SigmaTheta-SigmaTheta0)
              +epsilon*dZ Haar(Wztheta)

Haar(Ez)     = (dR+1/R)(Haar(Wrz)-SigmaZ0)
              -(dR+1/R)(SigmaZ-SigmaZ0)
              +epsilon*dZ Haar(Wzz+p_m).
```

The input roots are `pressure.covariance.fullAngularMean`, the complete
original stress in `pressure.residual.fullOriginalStress`, and the full
shifted pressure `pressure.pressure.value`. Their torus normalization is
the common index `i(ell_ref-2)`, with integer covering differences 0 through
4 and normalized Haar mass one. The pressure includes both directions,
the density subtraction, A0, and the full endpoint terms.

Once the source primary/full-curl class bounds above are attached, the
terms with a curl correction have class `M_(3/2-kappa)` before divergence,
and the conservative sufficient bound after divergence is
`M_(3/2-2*kappa)`. The higher original stress, axial flux and axial pressure
terms have residual exponent at least `2-kappa`. The original fixed kappa
then yields the displayed `M_1.49` mean-residual estimate. The exact
cancellation, derivative loss and source constant inventories are separate
premises; finite graph materialization does not prove this estimate alone.

## 4. Temporal update: exact source and all remaining terms

Write `H0=1-kappa`. The private temporal inverse binds exactly
`pressure.residual.Etheta` and `.Ez`, retains their whole Haar means, and
uses the original N and ci. Its actual Fourier gate already checks the
full coefficient source, four extra derivatives, zero mode, source tails,
meridional potential and axial cutoff A1.

`source-fourier-class-majorants.mjs` separately supplies the complete
all-frequency operator bound. For the original direction and every fixed
output order m, the inverse needs m+4 source derivatives and contributes
one S power through `ci^-1`, with no epsilon-exponent loss. The source
attachment checks the exact reference index and all current residual
bodies. It does not supply the missing input `M_H0` seminorms.

With those actual input norms established, the temporal tangential means
belong to `M_H0`, their radial component to `M_(H0+1)`, and the pressure
change to `M_H0`. The following retained terms explain the improvement to
`M_(H0+1-2*kappa)` in the new mean residual:

| Term after cancellation of the original fast time source | Actual gain |
| --- | --- |
| Slow time derivative | One epsilon power |
| Linear radial flux | Original b is `O(epsilon)`, or the new radial mean has its extra epsilon |
| Axial flux and pressure derivative | One epsilon power from Dz |
| Viscosity | `1-2*kappa` after two spatial derivative losses |
| Quadratic radial mean flux | Contains a radial mean component |

`source-global-initial-mean.mjs` recomputes these complete equations before
extracting the five new defects. The mean-wave interaction has wave
exponent at least H0. The defects remain `S_H0` at this intermediate stage.
Each assertion still needs the actual source seminorm composition; none is
inferred from a cancellation flag in a receipt.

## 5. Five-map update: exact nonlinear source to be bounded

The new five-map coefficients use `s.stages.temporal.mean.P/Jtheta/Jz`.
They are not the old primary-current defects. The fixed original positive
lambda, a and all five profile equations are retained. The fixed mean
majorant modules supply actual source operator constants on their separated
original `(s,X,eta)` collar, with the exact q/Q powers and the radial
epsilon gain. Their input defect norms remain premises.

Let the previous mean be `(beta,v,gamma)` and its five-map increment be
`(db,dv,dg)`. The actual complete remainder kernel retains

```
Rg = -time(db)
     -(Dr+1/R)(2*b*db + 2*beta*db + db^2)
     -Dz(b*dg + G*db + beta*dg + gamma*db + db*dg)
     +(2*v*dv + dv^2)/R + epsilon*lapVector(db),

Jtheta_remainder_integrand = R^2*(gamma*dv + v*dg + dg*dv),
Jz_velocity_remainder_integrand = R*(2*gamma*dg + dg^2).
```

The separate linear terms `2*V*dv/R`, `R^2*(G*dv+V*dg)` and
`2*R*G*dg-R*V*dv` are the terms canceled by the actual five equations.
The new defects are the full Haar/radial integrals of Rg and the displayed
flux remainders, with the additional `-1/2*integral(R^2*Rg)` in Jz.
These identities are checked before integration; the subsequent exact
integral reduction explicitly uses linearity and Fubini.

Every remaining product has the additional mean or radial epsilon factor,
or an axial, viscous or slow time gain. Applying the source bounds for this
same tuple gives the conservative target `S_(H0+0.9-2*kappa)` used by the
class induction. Original (9.9) then has slack to `M_0.9`, `M_1.9` and
`W_0.68`; the desired initial residual orders are B0=0.7 and C0*=1.2.
The numerical labels here are exact rational exponents, not estimates of
the size of an expression at a sample point.

## 6. Remaining implementation boundary

The concrete next class work is an actual M3 primary/stable-pulse and
covariance adapter, generation of its requested source norm leaves, and a
checked composition of the complete residual formulas above. The fixed
mean and Fourier leaves can be connected without changing their constants.
The observed forced-current construction separately supplies the complete
nonzero harmonic source and pressure when its gate passes.

The experimental `source-global-class.mjs` is not a completed substitute for
these bindings. Neither a metadata statement of Proposition 9.5 nor the
existence of finitely many high derivative expressions supplies missing
uniform bounds. Conversely, it is not necessary to numerically evaluate
the full field at every point: an authenticated source recipe with the
original fixed-order norm generators, exact cancellation identities and
checked inequalities is the relevant constructive goal.

## 7. Fixed radial and rho operator leaf, observed 17:27 UTC

`source-radial-class-majorants.mjs` now generates source-only constants for
all three original operators `T_e` and `A_e`, `e=0,1,2`, with the complete
pressure input `g_r-rho*P`. The normalized original rho is constructed from
its actual seed, positive full mass and separated original mean collar.
Every requested mixed rho derivative is retained. The same original
`sigma_2` quotient supplies arbitrary finite cutoff derivatives, without
extrapolating the older twelve-jet numerical interpreter.

The gate at `evidence/source-radial-class-majorants-20261012/attempt1`
passed 12 Node tests and 725 independent exact checks, with all 134 source
dependencies unchanged. Its requested pressure output order was 2 and
radial integration-by-parts order was 3. These require rho/source order 11
and cutoff order 3; the demands are not conflated. The generic independent
control also constructed the literal original cutoff derivatives through
order 14. The source constant certificate is an expression program, not
an evaluated floating-point bound.

For each fixed output order `m` and positive IBP order `p`, the full flat
remainder needs `m+2p+3` source derivatives. The `p` radial derivatives and
the `p+3` torus derivatives both remain. The original common reference
phase gives the exact bound

```
M^-1 <= Lambda*2^(2*rho_g*(1+h)) * epsilon_ref^kappa_s * S_ref^rho_g,
M = Lambda^i0 * Q_ref^(d_r/2), i0=i(ell_ref-2).
```

Both logarithmic Gaussian edges and the middle collar are bounded
separately; a backward primitive is not estimated by its inner-edge
weight where that primitive is nonzero. The whole weighted Haar moment
is required for `A_e` flatness, including every required slow derivative.
It is not required for the supported `T_e` norm.

The pressure product uses the actual normalized Haar mass one and the
whole radial projection `P=integral_R Haar(g_r)`. Its constant is
`1+2^m*C_rho(m)*C_projection`, before applying `T_0` or `A_0`. Thus no
separate arbitrary bound on P is introduced. An actual bound on the
complete `g_r` is still required. The private pressure/current attachment
has not yet executed; the fixed-source gate does not supply that missing
input norm or promote initialized j=0.

## 8. Original background and higher stress normalization

The current full original stress is exactly
`epsilon_ref*s^(-A-1/2)*T_profile(qActual,X,eta)`, where
`qActual=Q_ref*s`. The profile in `band.background.normalizedBodies`
retains the original leading stress and every active positive coefficient.
Its order-n increment is

```
epsilon_ref*s^(-A-1/2) * qActual^(2*n*h)
  * chi(b_n*qActual) * T_n(X,eta).
```

Subtracting the actual leading profile therefore gives the higher stress
used in (9.11), not the later Corollary 8.5 stress reconstructed from a
new current. The same private family supplies the n=1 direct weighted
bound with pole `3+3*m` and the n>=2 compact direct weighted bounds.
Every Euler cutoff derivative weight is included before selecting the
common dyadic constant.

For fixed m, keep the actual finite block below `J=max(2,m)` and apply the
same source selector inequality beyond it. Since `0<qActual<=1`, first use
`qActual^(n*h)<=qActual^(2*h)` for n>=J, and then sum `2^-n`. Only after
that step convert `qActual=Q_ref*s`: `s^(2*h)<=4` on the original strip.
The normalized higher-stress tail is at most
`4*2^(1-J)*epsilon_ref^2` times the fixed slow coefficient constant.
The exterior original epsilon factor gives exponent 3. Applying an
n-dependent bound on `s^(n*h)` after summation without retaining it would
be incorrect. Original b similarly keeps its explicit exterior epsilon
and its complete radial stream cutoff bracket.
