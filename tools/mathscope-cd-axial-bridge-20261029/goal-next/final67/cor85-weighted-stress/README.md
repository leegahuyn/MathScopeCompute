# Exact Sigma flux path and local proof boundary

VERIFIED: the replay binds the original post-Forced mean path and proves five differential identities exactly. The two weighted complete mean flux identities and three covariance-increment identities all reduce to zero. A control detects the missing c_rho,Z times P term if the full derivative of Jz+c_rho P is replaced by an incomplete formula.

CONDITIONAL: the original Corollary8.5 source compatibility turns the retained compact primitive into the reduced Sigma formula below. An external local norm proof may reuse the same field and finite C5 degree program after every primitive premise is established on the actual local path closure.

OPEN: actual complete weighted mean/Forced norms, actual local C5 rebase, Sigma spatial C2 bounds, full mean v C3, source image/atlas transport and all final gates. This packet claims no new numerical cap or final energy comparison.

## Complete source path and pressure terms

The exact original `source-global-forced-current.mjs`, in `constructGlobalForcedCurrent`, calls `reconstructUpdatedFullMeanPressure` with `velocity:source.mean.stages.moments.velocity`. Thus the angular Forced substep keeps the initialized mean velocity fixed and refreshes the full covariance and pressure. `source-global-updated-mean-stress.mjs`, in `bindLatestMean`, checks that same velocity component by component before `attachGlobalForcedMeanStress` supplies `stage:forced.mean`. The saved same-family report retains all20 native systems; none has a certified output class bound yet.

Write Dr=partial_R+a L, Dz=epsilon partial_Z, and time=-epsilon partial_T+ci N. The source `exactFullAuxiliaryMeanPDE` and `reconstructUpdatedMeanStress` give the full radial fluxes

    FR_theta = R^2*(b*v+beta*V+beta*v+W_rtheta-stress_theta)
               -epsilon*(R^2*Dr(v)-R*v),
    FR_z = R*(b*gamma+beta*G0+beta*gamma+W_rz-stress_z)
           -epsilon*R*Dr(gamma),

and axial fluxes, including the newly reconstructed pressure,

    FZ_theta = R^2*(G0*v+V*gamma+gamma*v+W_thetaz)
               -epsilon^2*R^2*partial_Z(v),
    FZ_z = R*(2*G0*gamma+gamma^2+W_zz+p)
           -epsilon^2*R*partial_Z(gamma).

The exact checked identities are

    R^2 Etheta = time(R^2 v)+Dr(FR_theta)+Dz(FZ_theta),
    R Ez = time(R gamma)+Dr(FR_z)+Dz(FZ_z).

The independent SymPy verification includes the original two torus directions and all a(R), time, cylindrical and viscous terms before Haar averaging. It does not multiply separate averages to approximate an average of products.

Let bars denote the complete normalized auxiliary Haar average, e=2 or1, u_j=v or gamma, and M_j=Jtheta or Jz+c_rho P. Under the source's smooth periodicity, compact endpoint fluxes and compatibility which makes the whole weighted source zero,

    Sigma_j = R^-e [ -FRbar_j
       +epsilon partial_T integral_a^R(R^e mean_u_j)
       -epsilon partial_Z integral_a^R(FZbar_j)
       +epsilon partial_Z(M_j) integral_a^R rho ].

The compact-cutoff whole integral remains a literal source node. Its reduction uses the actual conservation/periodicity/pressure proof, not numerical cancellation or an omitted term. The original rho and chi depend on s(Z,T). In particular raw p_Z retains -chi_Z times wholeSource. A Haar/compatibility argument is required to remove it; chi cannot be frozen during differentiation. The full c_rho P product remains inside partial_Z.

The original background stress is explicitly epsilon*s^(-A-1/2)*actual(Ttheta,Tz). All remaining pressure paths in Sigma occur inside the displayed epsilon-weighted axial derivative or epsilon partial_Z(Jz+c_rho P). Corollary8.5 introduces no new negative epsilon power. Actual norms of those pressure and moment operands remain necessary.

Since the mean velocity, background and original stress are fixed during Forced, the replay also proves

    delta gr = -De(deltaW_rr,1)-epsilon partial_Z(deltaW_rz)+deltaW_thetatheta/R,
    delta Etheta = De(deltaW_rtheta,2)+epsilon partial_Z(deltaW_thetaz),
    delta Ez = De(deltaW_rz,1)+epsilon partial_Z(deltaW_zz+delta p).

The actual T0 pressure reconstruction is linear in delta gr-rho delta P. Hence Sigma_afterForced=Sigma_afterInitializedMean+L_actual(deltaW). The initialized mean stress term needs a source bound; m1/m2 wave forcing estimates alone do not bound it.

## Signed loss and useful threshold

The actual Signed map takes no fresh square root of Sigma. It uses the original positive amplitude a_j and

    delta a_j=(H^-1 Sigma)_j/(2 epsilon a_j),
    signedAmplitude=sqrt(epsilon)*delta a_j*chi*psi*t_j,
    signedPotential=(n cross signedAmplitude)/(k |n|^2).

With Sigma=O(epsilon^gamma), the explicit epsilon powers of A, G_A, U and G_U are respectively gamma, gamma-1/2, gamma-1/2 and gamma-1, before separately bounded phase losses. Thus the epsilon^-3/4 spatial cap route requires gamma_Sigma>=1/4 with the appropriate remaining loss allowance. Merely O(1) Sigma does not suffice. The reciprocal a_j derivatives use y_j=a_j^2>=c_y zeta; they consume weighted y/H jets and c_y, without another independent epsilon inverse. A Forced wave exponent at least1/8 would give covariance exponent at least1/4 against the original epsilon^1/2 Primary wave, conditional on every actual cross term and the independent initialized mean terms being controlled.

## Local C8 is a proof input, not a field substitution

The exact source C5 proof base is

    K_global=max(2^128,B6,W_prop^8,dstar^-1,cy^-1/2,Haar,Ccoeff7,N0,...,N6),
    B6=max(Bnorm,Cslow8,8!,Lmax,2).

Here K_global is norm-namespace root18310069, Cslow8 is14220475, B6 is14220496, the independent cutoff/map maximum is18310062, and N0..N6 are the seven target roots saved in the receipt. The constructor uses G=target.G and PG=current.G. K_global is an envelope in the separate proof graph, not a parameter defining the already constructed actual field. The same field can receive a new external local proof base. It is invalid to infer the smaller inequality merely by replacing K_global in an existing K_global^p bound. The API does not issue a new private class seal for an arbitrary supplied K.

The cutoff/map maximum requires original C7 partition/pulse and chart/radial-phase estimates. The target roots require fixed leading T0 weighted inner/outer/middle estimates. Neither follows from an ordinary Cslow8 bound alone. All those independent primitive leaves must separately be dominated by the candidate local base.

Precise source anchors resolve the live/frozen distinction:

- `source-global-band.mjs`, `attachGlobalSourceBand`: `leadingFields` comes from `src.records[0].global.F/U`; F0,FR0,GR0 are `atRep` of those leading fields and their displayed first radial derivatives.
- The same constructor passes **full** `fields.F`, `partial_R(fields.F)`, `partial_R(fields.G)` and phase-speed derivatives to `actualMovingPulseFrame` at the live R/Z/T argument. The representative and carriers are frozen before differentiation.
- `source-initialized-angular.mjs`, `originalFixedLiftPulsePath`: H_w=Y+(ci_label/Tg^delta)*(w-v(Y))*v_t substitutes only Y0/Y1. R,Z,T and qActual=Q*s(Z,T) stay fixed along the pulse.
- The current SHA-pinned `bind_live_primary_c5.mjs`, `bindForcedTemplate`, checks the actual native w variable, original length and equality `pull.root[Y:=H_w]=pull.mapped=f.bound.originalSource` for the complete20-system binder.

The replay authenticates these exact source anchors. Failing a broad full C8 estimate at a frozen N4 representative is therefore not itself a failure to bound the three leading-only F0/FR0/GR0 values. This does not assert that arbitrary full fields at representatives are leading-only. The original global proof base covers more points than a proposed local proof needs; a physical map and a global norm proof must not be conflated. The local proof still needs actual native images, all label/flat joins and the complete radial paths of the mean/pressure operators.

## What the archived mean positive programs supply

The pinned mean-path JSON has8438 positive arithmetic records. Its graph is the original N1 archive, not the new N3 source. Existing programs provide full mean C2 and requested longitudinal subsets, plus transverse C3 beta/gamma and positive-L cases. Their use with local C8 requires an independent same-family primitive-leaf and operator/path binding; replacing the old interval endpoints alone gives no new source theorem.

The documented remaining pure-slow total-v C3 route is FiveMap v C3 -> fresh P/Jz C3 -> Temporal beta C4 -> T1 C5 -> Ez C5 -> Wrz slow7, including the L^2 Fourier-loss input. Available potential slow7 supplies full curl only through slow6. Local C8 alone does not upgrade that missing route. An alternative can exploit the exact R-independence of FiveMap target coefficients before taking the spatial/time derivatives needed for Sigma; that selective calculation is not proved here.

Replay uses Python with SymPy and reads only frozen original Git blobs and the small existing reports:

```text
python -B verify_sigma_transfer.py GOAL_NEXT EXISTING_44553053960_BUNDLE NEW_OUTPUT.json
```

Final deliverables are the script, sigma-transfer.json, replay-log.json, README.md and MANIFEST.json. No new run is queried, no large artifact is downloaded, no local Lean is compiled, and the repository/base67 are untouched.
