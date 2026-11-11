# Original third-order diagonal and whole-K endpoint center energy

**VERIFIED source bound.** The original third-order normalized angular coefficient has an actual historical cutoff selector with the required \(m=0\) bound. The replay also verifies its \(m=1\) radial bound. These are the missing clauses for the earlier whole-K center endpoint result. The actual construction through order three finishes with 123,870 coefficient graph nodes and 212,870 nodes after building the canonical cutoffs. It allocates no order-four coefficient.

## Original source and exact cutoff

The fresh original constructor agrees with all 120,820 nodes of the archived completed \(n\le2\) coefficient and stress graph prefix. Its third-order system consumes the original lower radial operands from orders \(0,1,2\) and retains the separate actual and auxiliary systems, the zero axis datum and the actual repaired five moments. Its third-order angular coefficient, axial coefficient and pressure roots are \(\#123548,\#123546,\#123642\). The exact third-order stress and raw residual roots match the prior independent order-three conservative replay.

The actual normalized angular coefficient is \(E_3=\sqrt{2X}F_3\). The canonical norm box is \([X_a/2,2X_b]\times[-1,1]\), so it covers the endpoint center cell \(2\le Y=\Lambda X\le5/2\). The original norm root for \(E_3\) is \(\#206642\), and the root for \(\partial_XE_3\) is \(\#208711\). They are retained in \(B_{3,0}=\#212757\) and \(B_{3,1}=\#212775\), respectively. The exact logarithm of the historical cutoff \(c_3\) is \(\#212868\), whose maximum retains both
\[
 \frac{3\log2+\log B_{3,0}}{3h},\qquad
 \frac{3\log2+\log B_{3,1}}{3h}.
\]
The independent checker reads the literal logarithm, product, inverse and maximum nodes. It authenticates the executed runtime modules against the original Git object and checks the original common selector rule \(b_3\ge c_3\).

At any point where \(b_3q\le1\), the original \(c_3q\le1\) and
\[
 B_{3,m}q^{3h}\le 2^{-3},\qquad
 B_{3,m}q^{6h}\le \tfrac18 q^{3h},\qquad m=0,1.
\]
For \(b_3q\ge1\) the term is zero, including the flat seam. The derivative here is in \(X\) at fixed \(q,\eta\), so the scalar cutoff has no \(X\) derivative. No numerical value of \(b_3\) or numerical supremum of the coefficient is required. This is a bound built from the actual source norm and exact selector DAG.

## Endpoint center consequence

At \(\rho=1/2\) with \(|\eta|\le\eta_*=\sigma_\star/\Lambda\), \(q\ge q_{\rm Big}/64\). The original common selector has \(b_nq_{\rm Big}\ge64\) for every \(n\ge4\), so these terms are identically zero including their cutoff seams. The only possible positive orders are \(1,2,3\). The third-order replay supplies the missing bounds and the same full positive-order swirl and radial derivative error is less than
\[
 \sum_{n=1}^3 2^{-n}q^{nh}<q^h<
 \frac{1}{512 C_{\rm Selected}\sqrt\Lambda}.
\]
For the common b_n realization, the prior exact core geometry and source annular zero-extension theorem identify the final swirl throughout this endpoint cell. The outer cutoff equals one there. The resulting normalized endpoint swirl energy satisfies
\[
 E_\theta^*(1/2)>
 \frac{\pi\tau_0\eta_*}{16 C_{\rm Selected}^2\Lambda^2}>0.
\]
The earlier signed local intervals for \(b\) and \(\partial_{r^2}b\) now apply at this endpoint as well.

This uses the original annular support theorems stated in the previous core proof. It supplies no full-center force, global jet enclosure or independent whole-K refinement. N7-06 and N8-05 remain OPEN, global jets remain 0/67, and RELEASE remains HOLD.

## Replay

Run with the archived exact runtime source, joined graph, and the pinned whole-K chart:

    node replay_third_diagonal.mjs <original-runtime-tree> third-diagonal-native.json
    python check_endpoint_third.py --repo <repo> --source <original-runtime-tree> \
      --joined <first-gauge-joined> --whole-k <whole-k-chart.json>

The targeted original source replay and independent prefix and selector readback both finished successfully. Neither command modifies the repository or compiles Lean.
