# Absolute error for the original N1 stresses at a source-selected Picard depth

**VERIFIED.** The original source replay binds A.2's twelve stage lengths and endpoints, both A.13 wait integrals, and the actual \(X_{\rm cut},X_0,X_L,X_+,X_b\). It pins the previously verified exact N1 recurrence, the original supported axial body #117047, and the leading value majorants with the same original operands. The rational checker proves six source-scale error budgets and also finds that the previous two-term pressure gap envelope exceeds one.

**CONDITIONAL.** Assume the same ordinary leading, natural/B.26, calibration moment and compensated-field realization used by C98–C102. The explicit finite N1 approximation below has both pointwise and unweighted \(L^1(dX)\) stress errors less than \(2^{-256}\) on the actual real axial interval \([X_-,X_+]\), and the actual real angular interval \([X_-,X_b]\), uniformly for \(\eta\in[-1,1]\). The two stress approximations have exact agreement with the original on the entire region from the last Ipos angular bump \(X_L\) through their respective outer cutoff. This is a theorem about the specified finite Picard form with its ordinary original leading inputs and quadratures.

## The original terminal range and the size of the two-term envelope

Write \(C=C_{\rm Selected}\), \(g=X_{\rm cut}\), and \(r=\sqrt{2X_0}\). The original \(T=e^{1048576}+10>128\), \(\lambda=e^{-1000T}\), \(h=e^{-8002T}\), and \(X_R=110 C^{10}e^{20T}\) are retained. In this paragraph only, the A.13 wait uses \(\rho_A=h/256\); the C98 analytic-strip \(\rho\) is a different source quantity.

The original \(Q_{\rm steep}\) is positive and less than four since \(0<( \lambda-h)/(1-\lambda)<1/3\), \(0\le S(s)=\int_0^s\sigma(t)dt\le s\) on \([0,1]\), and \(e<3\). The original flattened \(Q_b\) is positive with \(1<Q_b<7+32008T\), by bounding its \(Q_{\rm hold}=Q_{\rm steep}+(1-h)32008T\) contribution and using \(e^{-1/2}>1/2\), \(e^{1/2}<2\). The original \(Q_p\) lies between \(\rho_A\) and \(27\rho_A/(1-\rho_A)<1\), using the exact unit integral of \(\sigma'((s-1)/2)/2\) from \(1\) to \(3\). Since \(e^T>T^4/24>7+32008T\), the wait lies between zero and \(2(8003T+8)=16006T+16\).

Summing the exact twelve lengths gives the outer logarithmic coordinate
\[
 y_b=13e^{1000T}+122009T+135+\mathrm{wait}.
\]
The preceding bound and \(\log 110<5\) give \(y_b+20T+\log 110<15 e^{1000T}\). The original \(Q>e^{64020T}\), \(\log C\ge Q^{200}>15e^{1000T}\), and \(X_b=X_R e^{y_b}\) imply \(X_b<C^{11}\), hence \(\sqrt{2X}\le C^6\) up to the original \(X_b\). The geometry retains \(X_+<X_b\) and \(X_L<X_+\).

For the old two-term stress enclosure, its specific gap pressure summand equals \(\overline B_p\int_{r_g}^r(R^2/2-g)\,dR\), where \(r_g=\sqrt{2g}\). It is at least \(\overline B_p r^3/32\) by restricting to \([r/2,r]\), since \(r>C^5>4\) and \(g<1\). Also \(\overline B_p=2^{12}QgE/\delta>2^{87}Q^{-140}\) from \(E=2^{73}Q^{-77},g>4Q^{-64},\delta<1\). The source \(C\) exceeds \(Q^{10000}\) by the degree-51 term of \(e^{Q^{200}}\). Thus this old upper envelope exceeds one by itself. This diagnoses the particular bound, and leaves the true size of the two-term error undetermined.

## One original recurrence with arbitrary finite depth

Let \(\mathcal B=A_0+A_1\partial_\eta\) and \(P_0=0,\ P_j=G_0 f+G_0\mathcal B P_{j-1}\), with the source diagonal and fixed integral from C100. For an integer \(N\ge2\), use \(P_N\) for \(F_1,U_1\) and the pressure component of \(P_{N+1}\) for \(\Pi_1\). The original pressure equation contains no derivative acting on \(F_1\) in this row and gives exactly \(\widehat\Pi_X=2F_0\widehat F+p_{\rm known}\). Thus the C100 original pressure seam and same five moment corrections apply with this depth. The finite expressions still consume the same original cutoff locations and all 18 original raw calls.

With \(J_N=Q^{-25(N-2)}\), the C100 geometric tail \(2^{23}Q^{-26}<Q^{-25}\) gives the field value error \(E_N\le J_N E\) on \(S_{\delta/8}\). For the two raw velocity components, their \(\xi\) derivatives are the corresponding components of \(w=W-P_{N-1}\). Since \(w=G_0\mathcal B(W-P_{N-2})\), the diagonal equation bounds \((1+c_i)w_i/\xi\) by the sup norm of \(\mathcal B(W-P_{N-2})\). That sup norm on \(S_{\delta/16}\) is less than \(2^{20}Q^6 (2^{27}Q^{-25}J_N)\). Indeed one further Cauchy loss gives the factor \(1+16/\delta\), bounded by \(2^5Q^2\). The formulas \(e_X=w_i/(2\xi)\) and \(Xe_{XX}=(w_i'-w_i/\xi)/4\) then bound both radial errors by \(R_N=J_N 2^{46}Q^{-19}\). This includes the axis traces by C100 parity. All C101–C102 error expressions are linear in these value and radial caps because the leading data are common. Consequently each of those bounds scales by \(J_N\).

## Matching both original stress cutoffs

Use the original squared-flat step as \(\chi(X)=\sigma((\sqrt{2X}/r-1)/(x_L-1))\) where \(x_L=14337/4096\), with \(\chi=0\) through \(X_0\) and \(\chi=1\) from \(X_L\) onward. On the original overlap use
\[
 T_N=(1-\chi)T_N^{\rm for}+\chi T_N^{\rm back}.
\]
Both exact ordinary primitives give the original stress by its moment closure. This blend leaves the local and gap estimates unchanged and bounds the error on Ipos by the C102 backward error plus the axial \(5g R_N/\sqrt{2X}\) or angular \(9g^2 R_N/(2X)\) prefix defect. Beyond \(X_L\) the Ipos fields and all original necessary histories agree in the two calculations, so the backward stress error is identically zero there. The original physical stress outer gates are kept. This finite stress approximation is formed from the same source expression and both original integration directions, with this explicit choice of blend.

Let \(H=1+U_*+F_*\), taking the pinned original positive leading value norms. On the local interval \([X_-,g]\), the C101 taper trace provides a pointwise contribution bounded by \(1152 E_N C^{120}/\sqrt{2X}\) axially and \(1152 E_N C^{120}\) angularly. The untapered terms are bounded by \(5gR_N/\sqrt{2X}\) and \(9g^2 R_N/(2X)\). With \(X\ge4Q^{-64}\) the checker bounds their sums by \(H C^{120}Q^{-10}J_N/8\). The local interval has length less than one. On the gap and on Ipos, \(g<5Q^{-64}\), \(\delta^{-1}<Q^2\), \(1<r<C^6\), and the separate C102 weighted pressure, angular tails and pointwise caps give a common upper bound \(H C^6 Q^{-10}J_N/8\). The outer interval has length less than \(C^{11}\); the actual final part has zero error.

It follows that for a nonnegative integer \(k\), the exact source depth
\[
 N=2+\left\lceil\frac{120\log C+\log H+k\log 2}{25\log Q}\right\rceil
\]
gives \(H C^{120}J_N\le2^{-k}\). Both stress errors, in pointwise value and absolute integrated norm, are strictly below \(2^{-k}\); the total integrated prefactor is at most \((C^{120}+C^{17})Q^{-10}H J_N/8\). The receipt uses \(k=256\). The estimate retains the exact original leading value envelopes and records the whole A.2 and A.13 geometry. The fixed Picard depth is selected by an exact real expression with a ceiling; materializing that enormous integer or enumerating its terms is unnecessary for the inequality.

**OPEN.** Numerical evaluation of the selected finite approximation and its ordinary leading quadratures, an independent proof of the inherited analytic realization, higher recursive orders, and final jets. The error bound has a different stated depth from the C100 two-term approximation.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation102/y-absolute-quantitative/final"
    $runtime = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    $absolute = "$p/continuation102/y-absolute-outer/final"
    node "$d/replay_n1_outer_scales.mjs" $runtime $absolute "$d/operands-repeat.json"
    python -B "$d/check_n1_outer_depth.py" "$d/operands-repeat.json" $absolute "$p/continuation101/y-taper/final" "$p/continuation100/y/final" "$d/result-repeat.json"
