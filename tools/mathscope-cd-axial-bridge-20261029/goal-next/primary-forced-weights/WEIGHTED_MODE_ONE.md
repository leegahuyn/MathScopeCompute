# Conditional original mode-one mean interaction, pointwise order zero

The actual live join 43219432398 constructs the same-family C5 current, target C3, Primary C2 and corrected first Forced source. Its case `0:-1`, mode one, real radial raw #4576550, primary flat subtraction #4579554, supported #4582026, mapped path source #4740988 and wrapper #4741084 are pinned directly from that hosted receipt. The live graph was not exported; these integer IDs are not independently AST-replayed here. The older separately authenticated 4,197,115-node source graph has an independent exact coefficient replay of all 120 components and confirms this same conservative source structure; no assertion equates the two node namespaces or their private families.

Let M be the initialized perturbation mean and a the nonzero fundamental wave coefficient on one fixed original label and chart. The original source constructs `div(M tensor a + a tensor M)` in cylindrical coordinates. It does not silently replace the conservative form by an advective form. Let M0 and A0 be max component bounds, M1 and A1 max bounds on the phase-free `D_R,D_Z` component derivatives, Nmax the maximum absolute component of the exact phase gradient, and Rinv a bound on 1/R. The actual harmonic assembly includes both phase terms and the radial/azimuthal connection. The exact integer coefficient ledger shows, for each component,

    |I_j| <= 4 (M0 A1 + A0 M1) + (4 Rinv + 6 k Nmax) M0 A0.

This bound does not assume the divergence of either operand vanishes and does not use a false cancellation of the two Fourier factors. The monomial check accounts for all product derivatives and both cylindrical connection terms, and pins the original source implementation. Any additional common band/pulse pullback factors must be included in the ingredient bounds below.

Assume the following source-bound estimates hold on that same valid fixed-label path, with nonnegative finite source constants and 0<epsilon,zeta,delta,P<=1:

    M0 <= C_m epsilon^(1-2kappa_s) zeta delta^-b
    M1 <= C_m epsilon^(1-3kappa_s) zeta delta^-b
    A0 <= C_a epsilon^(1/2) sqrt(zeta) delta^-p P(v)
    A1 <= C_a epsilon^(1/2-kappa_s) sqrt(zeta) delta^-p P(v)
    k <= C_k epsilon^-1/2, Nmax <= C_n, 1/R <= C_r.

Then the concrete pointwise order-zero estimate is

    |I_j| <= C_m C_a (8+4C_r+6C_k C_n)
             epsilon^(1-3kappa_s) sqrt(zeta) delta^(-(b+p)) P(v).

The source kappa_s=1/100000 makes the phase exponent `1-2kappa_s`, the two product-derivative exponents `3/2-3kappa_s`, and the connection exponent `3/2-2kappa_s`, all at least `1-3kappa_s`. The extra radial factor zeta^(3/2) is bounded by sqrt(zeta). These four integer-rational comparisons are checked in the executable. This proves only the displayed implication, not the full original W class or the entire supported source.

The older authentic scalar-selector program has psiT C3 #1287, psiFive C3 #3580 and direct v C2 #3601, all in that separate selector graph and all carrying epsilon^(1-kappa_s) zeta. Their listed source powers and radial poles are retained; the IDs are graph roots, not numerical constants. Together with the actual beta=-epsilon ∂Z psi and gamma=D_R psi+psi/R, radial-fast a=O(epsilon^-kappa_s), and its first derivative bound, they motivate the stated M0 and M1 powers. For M1 the second D_R acting on psi must include a², so it costs two kappa_s factors. Establishing these bounds for all actual components and their Y derivatives on the current live family is a separate source obligation. The older selector requires weighted target C16, background C18, Primary/common-Y C15 and coefficient prefix 14; it is not silently attached to the new C5 join.

Unweighted mean bounds do preserve the wave's sqrt(zeta) P(v) factor if the phase-free wave derivatives have that same envelope, but they cannot by themselves supply the required positive epsilon power. A strict local algebraic countermodel is M=e_theta, a=(1/n)e^(in theta)e_z, epsilon=n^-2, R=1: both are divergence-free on an annular patch and the z component of the mixed conservative interaction is exactly i, while the wave magnitude is sqrt(epsilon). This is a countermodel to the inference, not a claim that the actual initialized mean equals the example. A slab-specific constant may absorb epsilon^-1, but that is not the original uniform W-class estimate as Q tends to zero.

Missing: same-live-family weighted mean C1 and transverse jets, actual A1 and nMax bounds along H_w, common-reference band and support/flat join transport, all derivative orders required by W, and the separately subtracted uncut primary tail and other forcing terms. Even an independent proof of this mean interaction alone does not establish any complete first Forced input, N7/N8 gate, final jet or release.

Run `node weighted-mode-one.mjs GOAL_NEXT ORIGINAL_M3_NAVIER`. The output `weighted-mode-one.json` records the fixed source hashes, tested coefficient and exponent arithmetic, the actual live example, assumptions and scope. No Lean compilation or new GitHub run was performed.
