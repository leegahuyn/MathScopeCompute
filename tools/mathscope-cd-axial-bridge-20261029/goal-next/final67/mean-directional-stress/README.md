# Directional initialized-mean target jets

The directional reduction succeeds for the FiveMap gauge itself and isolates a smaller missing Sigma input. It does not close weighted Sigma C2. The replay uses exact source bindings and symbolic multi-index bookkeeping, without modifying the repository or running Lean locally.

Let P0,Jz0,Jtheta0 denote the **input** defects used by the initialized FiveMap. They are different from the later fresh pressure and moment defects in the Signed stress. The original pressure constructor checks that each is independent of R. Its FiveMap coefficient inverse is linear, so all s(Z,T) powers, inverse-matrix entries and fixed profile copies can be kept inside kernels:

    vFive=P0*fP(R,Z,T)+Jz0*fJ(R,Z,T),
    psiFive=Jtheta0*gPsi(R,Z,T),
    betaFive=-epsilon*partial_Z psiFive,
    gammaFive=partial_R psiFive+psiFive/R.

The kernels remain functions of Z and T. The replay checks these source anchors and differentiates all four groups A,U,G_A,G_U, including the angular cylindrical connections. Exact required target orders for the gauge and first spatial velocity derivatives alone are:

| Input target | Necessary directional orders in this gauge program |
|---|---|
| P0, Jz0 | Z orders0–1, no T derivative |
| Jtheta0 | Z orders0–2, no T derivative |

Thus full isotropic v C3 is unnecessary for this isolated gauge calculation. Fixed profile/kernel derivative bounds and actual native branch transport remain necessary.

The Sigma_theta time term does retain third directional target derivatives. After the source conservation and compatibility reductions from the previous packet, its FiveMap part is exactly

    epsilon*partial_T(P0*KP+Jz0*KJ),
    KP=R^-2 integral_a^R r^2*fP(r,Z,T) dr,

with the corresponding KJ. R derivatives act only on the kernels. The six spatial multi-indices of total order through two produce target_T for RR, target_ZT for RZ and **epsilon^3 target_ZZT** for ZZ, together with lower product-rule terms. Other explicit theta fluxes contain P0/Jz0 and Z derivatives but no time derivative of those input targets. Axial fluxes also retain Z3 target paths; no T2 or T3 derivative of the input targets is introduced by this outer calculation.

The exact formal control P0=(T-1)Z^2, Jz0=0 at the admissible normalized slow point T=1,Z=0 yields

    (epsilon partial_Z)^2 Sigma_theta,time =2 epsilon^3 KP(R,0,1).

All lower target jets in this path vanish there. A FiveMap profile that corrects a nonzero target moment cannot be identically zero, and its weighted partial primitive cannot vanish identically if its derivative is that nonzero profile. A zero **whole** angular-velocity moment does not remove the partial primitive. This control disproves elimination using R-independence and conservation alone. It substitutes no actual original target values and is not a counterexample to the original Navier–Stokes field. An additional source identity relating the actual input defects could still give further cancellation; none is established here.

The full pressure introduces further conservative directional paths. From betaFive=-epsilon partial_Z psiFive, its time contribution to the radial pressure source, followed by the axial pressure flux, reaches epsilon^5 Jtheta0_Z4T after weighted Dz2. Its axial viscosity path reaches epsilon^7 Jtheta0_Z6. The packet lists60 path/spatial-shape combinations with their retained epsilon powers. These are derivative paths, not a claim that every highest coefficient survives the special actual radial profiles. The actual normalized pressure and complete latest Jz+c_rho P terms must be combined before asserting necessity or cancellation. Ordinary rho/chi s(Z,T) derivatives remain in those kernels.

A selective next covariance input replaces an isotropic order-seven demand. The original source path is

    P0 contains epsilon*partial_T betaTemporal,
    betaTemporal contains epsilon*partial_Z T1 N^-1 Ez,
    prior Ez contains epsilon*partial_Z T0(-epsilon*partial_Z Wrz).

Consequently P0_ZZT has a highest prior covariance path **partial_Z^5 partial_T^2 Wrz**, with epsilon^4. The outer weighted Sigma_theta Dz2 time term makes its explicit factor epsilon^7. The original N^-1 anisotropic loss, including L2, ci^-1, T0/T1 kernels and shift/cutoff derivatives must remain. Wrz here is the full angular mean on the common Y torus **before auxiliary Haar**, so its fast terms cannot be discarded by a Haar argument at this stage.

The leading covariance part needs amplitude Z5T2. The full imaginary curl covariance part reaches potential jets Z6T2, R Z5T2 and L Z5T2. The first two have ordinary slow total order eight; the L path retains the original transverse derivative. No bound on these actual jets is inferred from the existing potential slow-seven data or local C8 alone. These exact directional inputs are narrower targets than a complete isotropic mean C3 theorem.

The existing full-isotropic missing route remains recorded for comparison. This packet encloses no actual target jet and closes no stage allocation. N7-06, N8-05, final jets0/67 and RELEASE HOLD remain unchanged.

Replay with Python/SymPy and a readable checkout of the frozen original commit:

```text
python -B verify_mean_directional.py GOAL_NEXT C60_SIGMA_TRANSFER_JSON NEW_OUTPUT.json
```

C60_SIGMA_TRANSFER_JSON is the prior cap-rebase/final/sigma-transfer.json or its integrated copy. The final five files are the script, mean-directional.json, replay-log.json, README.md and MANIFEST.json.
