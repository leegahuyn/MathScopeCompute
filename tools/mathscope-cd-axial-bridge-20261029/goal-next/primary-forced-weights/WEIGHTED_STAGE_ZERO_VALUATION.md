# Fixed-slab epsilon valuation of the actual initialized mean

This is a conditional analytic strengthening of the existing source-bound positive norm programs. It does not run a new private-family constructor or re-prove the original stability and FTC inputs. The executable pins the independently read back original 4,456,994-node initialized graph, six actual gauge bodies, 162 source rows, 972 covariance rows, the positive norm graph and the earlier separate live join. The final valuation is a mathematical propagation through the audited producer formulas, supported by exact integer arithmetic; it is not a complete automatic node-by-node valuation of every positive graph node.

On each original fixed active row, the actual primary amplitude contains `sqrt(epsilon)` and the pre-curl potential contains `sqrt(epsilon)/k`, with original `k=ceil(epsilon^(-1/2))`. Thus potential ≤ epsilon times the remaining source norm. The actual curl has real leading amplitude of order epsilon^(1/2); its imaginary remainder has the potential's epsilon times at most one radial `a_fast` factor, giving epsilon^(1-kappa_s). The source row uses exactly `1/2*(leading_i*leading_j+remainder_i*remainder_j)`, so both products are retained and no real-imaginary term is invented. On `epsilon<=1`, `2-2*kappa_s>=1`, hence every local W jet entering the pinned finite norm program has one epsilon factor. The actual transverse and slow derivatives use the original fixed-label/source derivative bounds; no division by flat cutoffs is used.

The row conversion and all original 162 summands are already retained in the positive norm. All actual contributing own bands and the fixed reference lie in `[qBig/128,qBig/8]`; with `h<1/64`, their epsilon ratios are <2. Hence replacing the row epsilons by the reference epsilon costs at most factor 2 in W. Applying the fixed radial and Fourier operators and the same-source Etheta/Ez formulas, including the shifted whole-integral cutoff terms, loses at most epsilon^(-kappa_s) via the one radial fast coefficient. The Temporal tangential velocities and potential are thus bounded by factor `2 epsilon^(1-kappa_s)` times their original norm expressions. The actual Temporal radial velocity has the additional epsilon from `beta_T=-epsilon ∂Z psi_T`.

The fresh targets use actual W and the quadratic products of the Temporal fields after the exact zero-Haar cancellation of linear Temporal terms. Their fixed source norm expressions therefore cost at most factor `4 epsilon` times their prior majorants; the source's original fixed FiveMap inverse and kernels keep that factor. FiveMap beta has its own extra epsilon. Combining Temporal and FiveMap gives the following source-derived fixed-slab bounds. Positive root numbers refer exclusively to `mean-path-longitudinal.json`:

    C0 = 4 max(#7590,#7602,#7594)
    C1 = 4 max(#7619,#7591,#7627,#7603,#7635,#7595)
    |M| <= C0 epsilon^(1-kappa_s)
    max(|D_R M|,|D_Z M|) <= C1 epsilon^(1-2kappa_s).

The corresponding radial component beta has the additional epsilon in each bound. The original norm expressions already use the fixed-slab `a_fast,max` and `S_*`, so this statement does not produce a band-independent constant for the original asymptotic class as Q tends to zero. The factor 4 accounts for the 2-band covariance transport and squaring the Temporal bound in the fresh targets; the finite source coefficients and all fixed radial/FiveMap bounds remain symbolic.

For the original mixed conservative mode-one interaction, the separate `weighted-mode-one.mjs` verifies the exact coefficient inequality

    |I_j| <= 4(M0 A1 + A0 M1) + (4/R + 6 k nMax) M0 A0.

If, on the same actual path, the wave supplies `A0<=Ca epsilon^(1/2) sqrt(zeta) delta^-p P(v)`, its phase-free derivative supplies `A1<=Ca epsilon^(1/2-kappa_s) sqrt(zeta) delta^-p P(v)`, and original `k<=Ck epsilon^-1/2`, `nMax<=Cn`, `1/R<=Cr`, then

    |I_j| <= Ca [4(C0+C1)+4 Cr C0+6 Ck Cn C0]
              epsilon^(1-3kappa_s) sqrt(zeta) delta^-p P(v).

The actual sharper intermediate exponents are `1-kappa_s` for the carrier, `3/2-2kappa_s` for each derivative product, and `3/2-kappa_s` for the cylindrical connection. The mean needs no retained zeta weight: the wave supplies `sqrt(zeta) P(v)`. These powers are checked as integer multiples of 1/100000. The source lower bounds, positivity, smooth flat joins, original fixed Y paths and imported norms remain premises, and the wave estimate itself is not constructed by this valuation.

The original newer run 43219432398 binds a C2 Primary and its actual Forced input on one separate live private family. This earlier initialized graph has not been proved to be that same private family, and the new compact run has no full graph export. The one-point mean-interaction estimate is not a complete W-alpha certificate: all derivative directions, original label/path domain, the uncut primary-flat subtraction, every full source component, asymptotic uniformity and later stages remain open. No counters or RELEASE status change.

Run from the workspace root: `node weighted-stage-zero-valuation.mjs GOAL_NEXT ORIGINAL_M3_NAVIER`. See also `weighted-stage-zero-valuation.json`, `WEIGHTED_MODE_ONE.md` and the underlying positive-graph readback.
