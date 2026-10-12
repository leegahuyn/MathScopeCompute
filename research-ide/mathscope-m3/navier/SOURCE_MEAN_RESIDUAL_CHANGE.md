# Complete mean residual changes and initialized source identity

This additive package supplies the complete difference algebra needed to
transport the original initial mean residual estimate through the temporal
update and the subsequent five-profile update. It retains every term of the
original two tangential equations. It does not grant actual-source norm
authority to its polynomial fixtures.

## Exact source equations

Write the old mean velocity as `(beta,v,gamma)`, the increment as
`(db,dv,dg)`, and the complete pressure difference as `dp`. The unchanged
background is `(b,V,G)`. With the original operators `D_r`, `D_z`, `N` and
epsilon, `exactFullMeanResidualChange` constructs the original full PDE
before and after the update. It then verifies the following identities:

\[
\begin{aligned}
\Delta E_\theta-c_{i_0}N\delta v
={}&-\epsilon\partial_T\delta v
 +(D_r+2/R)[(b+\beta)\delta v+(V+v)\delta\beta
                         +\delta\beta\delta v]\\
 &+\epsilon\partial_Z[(G+\gamma)\delta v+(V+v)\delta\gamma
                         +\delta\gamma\delta v]
 -\epsilon(\Delta_0-R^{-2})\delta v,\\
\Delta E_z-c_{i_0}N\delta\gamma
={}&-\epsilon\partial_T\delta\gamma
 +(D_r+1/R)[(b+\beta)\delta\gamma+(G+\gamma)\delta\beta
                         +\delta\beta\delta\gamma]\\
 &+\epsilon\partial_Z[2(G+\gamma)\delta\gamma+
                         (\delta\gamma)^2+\delta p]
 -\epsilon\Delta_0\delta\gamma.
\end{aligned}
\]

The 19 separate flux products are stored, together with four slow groups
for each equation. The scalar/vector Laplacians include both applications
of the variable-coefficient radial derivative, the derivative of its fast
multiplier, both mixed slow/torus terms, the cylindrical connection and
the axial term. The complete identical covariance and original stress
cancel in the difference; neither is declared zero.

The fast time increment is kept separate. In a temporal update the exact
inverse cancels the centered source, but the full realized axial velocity
is the desired velocity minus the actual `A1` remainder. Thus a positive
IBP estimate for that remainder is a separate requirement. A raw `A1`
norm does not establish flatness. For the actual five-profile increment,
the source constructor separately verifies no auxiliary dependence.

## Every requested finite norm order

`originalMeanResidualChangeDemand({order:m})` requires the increment
through `m+2`, the old velocity and background through `m+1`, and the
complete pressure change through `m+1`. The fixed radial coefficient is
needed through `m+1`. These demands are the direct finite consequence of
the displayed operators.

`composeOriginalMeanResidualChangeRows` applies the complete Leibniz
convolution at every product. Every row bounds all five-coordinate mixed
derivatives through its stated order. Epsilon powers, polynomial powers,
boundary poles, and Gaussian weights remain separate. No sampled or
caller-provided norm is given source authority by this arithmetic kernel.

For the original initial `alpha=1-kappa_s`, the tangential velocities and
pressure have exponent `alpha`, radial velocities have `alpha+1`, and the
background radial component has exponent 1. Every slow difference has
exponent at least `alpha+1-2*kappa_s = 2-3*kappa_s = 199997/100000`.
This is strictly greater than the original mean residual exponent 1.49.
The proof applies at every finite derivative order because each recurrence
has finitely many full product terms and source-only finite constants.
The actual initial Haar residual estimate and the actual positive-IBP
cutoff estimate must still be supplied before applying this implication
to a complete initialized source.

## Live source capability

`attachOriginalInitializedNormAuthority(mean)` accepts only a live mean
accepted by `assertGlobalInitializedMean`, with the identical private
common family. It binds the actual temporal velocity, freshly computed
three targets, all five coefficients, updated velocity, latest complete
pressure, nonlinear remainder roots and conservation rows. It also
retains the actual family target-norm producer function by identity.

Each consumer rechecks the unchanged parents and public record against a
private WeakMap seal. A copied record, source hash, arbitrary id or
completion label cannot construct a capability. The capability establishes
source identity and the original source recipe only. A serialized receipt
does not recreate the live producer, and this package does not claim a
positive live capability execution on the archived initialized current.

## Observed gate

`tests/run-mean-residual-change-kernel.py --attempt 1` completed with:

- 8 Node tests PASS.
- 5,804 independent exact checks PASS using `Q(sqrt(2))` Laurent maps and
  exact rational exponent arithmetic.
- 130 complete dependency source files preserved and unchanged.
- Actual Node maximum RSS 147,927,040 bytes under the 512 MiB test bound.

The independent checker reconstructs both full original equations, all
19 products, all four slow groups, both uncancelled fast terms, and all
second mixed-coordinate identity controls. It independently differentiates
coefficient maps and proves whole-box input and output norm bounds for
the polynomial fixtures. Omitting pressure, time, a slow group or the
variable-fast-coefficient derivative is detected.

Evidence is in `evidence/source-mean-residual-change-20261012/attempt1/`.
The receipt keeps actual-source attachment, complete initialization class,
and complete N6 flags false. No original M3 completion flag is changed by
this package.
