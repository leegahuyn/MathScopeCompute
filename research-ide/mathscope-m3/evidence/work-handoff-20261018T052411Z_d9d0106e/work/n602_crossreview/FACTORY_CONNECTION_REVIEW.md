# N6-02 finite-cycle connection review

Status: architecture review complete; implementation and execution review pending. This document does not award N6-02 or certify unexecuted later stages.

## Original finite criterion

Blueprint p62 requires the residual-update identity with latest pressure after every substep, independent direct PDE versus decomposed residual within an error budget, and retention of the old flat tail and new quadratic remainder. Original paper pp108–111 gives the ordered cycle: supported forced harmonics; signed stress correction; zero-Haar temporal correction; fresh five-equation correction. Pressure is reconstructed after each. Thus one actual complete finite cycle, including each of its four poststep comparisons, is an appropriate implemented test scope. It does not require literal execution at every integer stage j and does not extend a finite numerical comparison to unexecuted j.

The input to every step must be the actual preceding state. The existing initial pretemporal signed success is a different path and is not being rerun or counted as the later signed step.

## Concrete factory boundary

Start a new private successor at `assertGlobalForcedCurrent(forced)`. Do not change original seals or create a fake GlobalCurrentState. Use `G=forced.G`, `initialized=forced.input`, `pressure0=initialized.mean.temporal.pressure`, original current and band from `pressure0.current`.

Retain:

- Complete current mean: `forced.mean.completeBetaVGamma`.
- Complete actual wave inventories: each `forced.templates[t].waveRows` (currently all four modes -2,-1,1,2).
- Complete forced angular pressure: `forced.assembly.angularPressureField.root` or its equivalent complete per-template pressure rows.
- Latest complete pressure/defects from `forced.mean`.
- Original background/stress, rho/chi, cover, support, both signs, five fixed lift differences, original fixed H and positive a.

The existing `attachGlobalSignedCurrent` asserts the original GlobalCurrentState, computes its previous wave only from the initial full primary curl, and calls `buildGlobalMeanState`, which explicitly initializes beta/v/gamma to zero. It cannot be used unchanged for the forced successor.

## Actual current signed target

The most direct original p109 implementation forms `Ebar_e=Haar(E_e)` from the latest complete mean residual, then `M_e=integral R^e Ebar_e dR` on the entire supported radial envelope, for e=2 (theta) and e=1 (z). With `b_e=rho/R^e`, define

    H_e = Ebar_e - (rho/R^e)*M_e
    Sigma_e = -R^(-e) * (integral_left^R r^e H_e dr - chi*integral_left^right r^e H_e dr).

The whole weighted integral is exactly zero by normalized rho; retain its raw root and the cutoff remainder in the calculation. Whole integration must include every crossed source cell. The fixed radial envelope and pressure translation are unchanged.

The preserved 9.10 moments additionally imply `M_2=epsilon*partial_Z Jtheta` and `M_1=epsilon*partial_Z(Jz+cRho*P)`, where `cRho=1/2 integral R^2 rho`. These are useful independent compatibility checks. The entire cRho*P product stays inside the Z derivative. Using the raw M_e integral avoids applying the initial-only zero-mean flux proof to a nonzero current.

`exactSignedCovarianceInverse` is the reusable generic kernel: feed the new Sigma and the unchanged original H and positive a. The signed correction uses the homogeneous pressure coefficient and the full curl of its potential. It is added to the current m=1 and m=-1 rows; all forced m=2 and m=-2 rows are retained. Do not solve for a new square root of a signed covariance target.

If verifying the four-term covariance expansion, its previous remainder is the actual forced m=1 coefficient minus the original primary transverse coefficient. The initial curl remainder alone is insufficient. Recompute all six full auxiliary covariance fields using `exactAngularWaveCovariance`, retaining all m+n=0 pairs before auxiliary averaging.

The private `completeSourceField` helper in the forced module supplies an exact assembly pattern: ten fixed-lift/sign templates, all 162 contributions, both auxiliary derivative columns, original guards before local roots, unchanged physical velocity/pressure/residual exponents. A new successor may duplicate this small structural helper with explicit provenance. It may not relabel a new state as an old authenticated state.

## Temporal and fresh five maps

`SourceCoupledExpressions` already supports `defineAuxiliaryInverse`, `auxiliaryInverseSystem`, and `auxiliaryInverseValue`. Define each new inverse on the actual post-signed Etheta/Ez, with the original Y direction, slow arguments, exact Haar projection, and genuine infinite-limit semantics. `finiteAuxiliaryInverse`, `checkActualFiniteAuxiliaryIdentity`, and actual source derivative-tail producers are reusable kernels. A finite Fourier sum must not replace the exact inverse.

`realizeOriginalTemporalPotential` returns an increment, not a replacement mean. Set `newMean=oldMean+potential.velocity`. The actual axial increment is gammaDesired minus its retained A1 cutoff remainder. Retain `Fax=ci*N(deltaGamma-gammaDesired)` as a new flat-ledger root, as required on original p110. The full wave covariance and angular pressure stay unchanged during this mean step.

Call `reconstructUpdatedFullMeanPressure` on the complete summed mean. Use its new P/Jtheta/Jz to solve the five equations. Only the original profile copies, matrix, positive lambda and support proof are reused from the initial template. Preserve the original scaling of five-row targets: s^(2A), s^(2A-3/2), s^(2A-1). The existing `attachGlobalInitializedMean` uses the temporal increment as its whole previous mean and is therefore also initial-only; its later-stage analogue must add the earlier current mean.

Add the five-equation increment, realize its meridional potential, and reconstruct full pressure again. `exactFullMeanMomentRemainders` accepts arbitrary old means and is the reusable full nonlinear defect-change kernel. Fresh defects are actual nonzero remainders, not values to replace by zero. The first two homogeneous moment rows preserve the original exact constraints.

## Independent residual comparison and retained ledger

At each poststep assemble `u=background+complete current mean+all current waves` and `p=background pressure+latest mean pressure+all current angular pressure`. The direct path uses `exactRealCylindricalPDE`. The second path independently computes the linear pressure/time/viscous increment plus both ordered old/new tensor products and the full new increment square. It must use the old actual field and pressure roots and the new actual ones. The existing pretemporal successor contains an explicit independent tensor-divergence implementation that can be reused as a generic algebra kernel with new authentic inputs.

Exact symbolic equality for all three complete functions gives a zero error budget; it is not a numerical quadrature enclosure. Declared source roots and full defining bodies must remain attached to this equality. Generic abstract identity checks alone do not establish that the intended current was used.

The ledger must identify old F, new temporal Fax, each reconstructed pressure A0, and every new quadratic remainder. No source term may be erased by defining a force as the residual and checking it against itself. Wrong-state, stale-pressure, omitted-mode, omitted-quadratic and replaced-mean controls should reject the corresponding defects wherever these are nonzero.

## Review boundary

No original sources or existing successor files were edited. No previous pretemporal run or derivative tests were repeated. The only artifacts written by this reviewer are under `work/n602_crossreview`. Candidate hashes, source joins, execution outcomes, and final acceptance remain pending the new continuation implementation.
