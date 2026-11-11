# Source-bound low-order background and target middle denominator

The source-shape replay checks original commit f8cb4034, five Git blob IDs, and the 4,456,994-node corrected first-cycle graph hash. It verifies the graph addition chain whose source-constructor operands include `Ftotal=#216829`, `Gtotal=#215575`, and `Bnorm=#300170`, with the positive `2^128` term #300162. The same five producer blobs are identical at original PR30 commit a9b3a5b. The replay checks source code fragments and node shapes; it is not an independent Lean or analytic validation of those source claims.

The actual source C2 background producer states that all ordinary slow derivatives of F and G through order two are bounded by the corresponding positive `FTotalConstant` and `GTotalConstant`, for fixed Q with 0<Q<=1/2, q=Qs<=1, 1/2<=s<=2 and the producer's enlarged X annulus. At eta=±1 the heat and time endpoints use their stated one-sided semantics. The original common family invokes the same roots and explicitly states that the original scale-independent Euler cutoff estimates extend to its enlarged b_n sequence. **Conditional on those source C2 and enlarged-sequence proofs**, both norms are bounded by `Bnorm` because those two nonnegative constants are explicit terms of the same Bnorm sum. This gives a useful actual background source bound; it is not a bound on C3–C5, the wave or correction pressure, or the initial cutoff C/P.

In the weighted target producer the middle rectangle has `X >= Xa*exp(t1/8)` and `X <= Xb*exp(-1/4)`, while the original source weight is

    zeta = exp(-t1^2/log(X/Xa)^2 - 4/log(Xb/X)^2).

For every point of this declared rectangle, t1>0 and the two log distances are at least t1/8 and 1/4. Consequently

    zeta^(-1) <= exp(64+64) = exp(128) < 2^256 <= Bnorm^2.

The strict exponential comparison uses e<3<4, and `Bnorm>=2^128` uses the positive source sum. Thus the only explicit `derivative/zeta` in the middle target norm has a modest source-only inverse bound. It does not bound its numerator derivatives, their FTC face integrals, or the separate inner and outer regular factors. At the zero endpoints one must not divide by zeta; the native code instead uses regular collar factors and one-sided FTC limits. Nonempty rectangle and native regularity are separate source obligations.

At requested order m=3, source loops request 60 anchored target FTC rows (20 per inner, outer and middle region), with four faces each, and the family C5 leading-background loop requests 42 profile jets (21 for each of F and U). The target outer work counter is charged 60 times, but each FTC row may expand many expression nodes, so these integers do not predict memory or runtime. The completed-background prefix also increases to 5 in the C5 construction. Work/graph budgets and hosted status remain actual execution questions.

Reproduce with:

    python check_primary_c2_target.py --repo <checkout> --graph <extracted-corrected-graph> --out result.json

The replay does not show that actual C/P for the initial first cutoff meets its previously derived threshold. The quantitative higher background norms, repaired Forced weighted input, Cartesian gauge assembly, differentiated pressure, and later stages remain OPEN. RELEASE HOLD.
