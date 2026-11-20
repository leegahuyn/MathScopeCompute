# Absolute outer stress error for the original N1 compensation

**VERIFIED**. The replay binds the original positive value majorants for the actual leading \(U_0,F_0\), the Ipos \(m_{\rm Const}\) mass integral, the last angular bump #117099, and the literal axial integrand #117047 in its forward and backward integral frames. The program extracts the full positive arithmetic dependency graphs for both leading majorants. Large source exponentials and ordinary quadratures remain exact expressions.

**CONDITIONAL** on the original ordinary leading, continuity and moment realization and the C100–C101 compensated approximation. There are explicit pointwise and \(L^1(dX)\) error bounds for the original unnormalized forward stresses throughout the outer region. The real source coordinates \(\eta\in[-1,1]\) are retained. In Ipos the estimates also hold on the stated smaller parameter strip for the error expressions. The original backward approximation gives a tighter outer enclosure and has zero difference past the final Ipos bump. The bounds retain the actual Ipos size and long pressure plateau, so there is no assertion of small absolute numerical error at all radii.

## Original scales and the gap before Ipos

Write \(g=X_{\rm cut}\), \(X_0=X_{\rm 0,Ipos}\), \(r=\sqrt{2X_0}\), \(r_g=\sqrt{2g}\), \(X_L=\#117099\), and \(x=\sqrt{2X}/r\). Let \(E=2^{73}Q^{-77}\), \(R_*=2^{46}Q^{-19}\), \(A_*=2^{17}Q^2gE\), \(B_*=2^{31}Q^2gE\). The pinned original leading procedure gives whole-value bounds \(U_*,F_*\), with \(U_*\) defined on \([0,\infty)\) and \(F_*\) through \(X_+\). The source replay records their exact arithmetic definitions and the real \(\eta\) domain.

In \(g\le X\le X_0\), C101 gives the exact accumulated pressure and mass error formula. With \(\overline B_m=2^8gE/\delta\), \(\overline B_p=2^{12}QgE/\delta\), it yields
\[
\begin{aligned}
 |\Delta T_z^{\rm for}(X)|
 &\le \frac{5gR_*+\overline B_m(U_*+8)+(X-g)\overline B_p}{\sqrt{2X}},\\
 |\Delta T_\theta^{\rm for}(X)|
 &\le \frac{9g^2R_*+2\overline B_m(XF_*+8gQ)}{2X}.
\end{aligned}
\]
The endpoint bounds at \(g\) use the original local leading values. The leading endpoint differences in the exact C101 formula can be retained instead of these uniform majorants. Substituting \(R=\sqrt{2X}\), the respective gap integral bounds are
\[
\begin{aligned}
 G_z &= [5gR_*+\overline B_m(U_*+8)](r-r_g)
        +\overline B_p\big[(r^3-r_g^3)/6-g(r-r_g)\big],\\
 G_\theta &=(9g^2R_*+16\overline B_m gQ)\log(X_0/g)/2
        +\overline B_m F_*(X_0-g).
\end{aligned}
\]
These are absolute error integrals, with the pressure plateau contributing explicitly.

## Original positive Ipos masses and pressure tail

On Ipos the retained leading source has \(U_0=0\), \(Xv_0=-m_{\rm Const}\), and \(F_0=K(\eta)r^{-1}x^{-s}\), where \(s=2+2\lambda\), \(0<\lambda<1/4\), \(|K|\le2\). The source radius has \(X_0=X_R\exp(60001T-12)\). The exact mass is \(m_{\rm Const}=X_R e(4+K_1)\), with original \(K_1=\int_0^{e^{M_d}-1} e^s k(s)ds\), \(0\le k\le4\). Therefore
\[
 \mu=\frac{m_{\rm Const}}{r^2}
 \le 2\exp(2-60000T)<2^{-59997}.
\]
The source keeps the exact \(m_{\rm Const}\) alongside this inequality.

Set \(H_*=2^{30}QgE\). Multiplying the original three angular inverse rows by \(2K/r\) gives
\(\|(2K/r)\Delta\beta\|_\infty\le H_*\). Indeed the corresponding RHS errors are bounded by
\(\max(2|K||\Delta m_1|/r^3,|\Delta m_2|,2|\Delta m_4|/r^2)\), and the original normalized inverse norm is at most \(2^{24}\). Thus the \(K\) denominators in the pressure and flux rows cancel.

For \(X_0\le X\le X_L\), put \(h_j=(2K/r)\Delta\beta_j\). Saturation of the original pressure row gives the exact backward tail
\[
 p(X)=-\sum_{j=0}^2 h_j\int_x^{x_L} y^{-s} b_{j+2}(y)\,dy,\qquad
 \int_X^{X_L}p(Y)\,dY=
 -\frac{r^2}{2}\sum_{j=0}^2 h_j\int_x^{x_L}(y^2-x^2)y^{-s}b_{j+2}(y)\,dy .
\]
This uses \(dY=r^2y\,dy\) and ordinary Fubini. The two weights \(x^2y^{-s}\) and \((y^2-x^2)y^{-s}\) are at most one on \(1\le x\le y\). Each bump has exact unit mass. Consequently \(X|p|\le(3/2)r^2H_*\) and \(\left|\int_X^{X_L}p\right|\le(3/2)r^2H_*\). Taking one \(\eta\)-derivative of the last integral on \(S_{\delta/16}\) gives \(24r^2H_*/\delta\).

The original mass tail is \(\int_X^{X_L}\Delta U_1=-\Delta M_1(X)\), with modulus at most \(8A_*\) by the two positive unit masses and their retained \(y\) factor. The weighted angular tails keep the original powers \(y^2\) and \(y^{1-2\lambda}\). In detail, \(\int_X^{X_L}2Y\Delta F_1(Y)dY\) has bound \(48r^3 B_*\), and \(\int_X^{X_L}2Y\Delta U_1(Y)F_0(Y)dY\) has bound \(16r A_*\). These estimates use the exact positive unit masses and do not charge a pointwise bump height in a tail integral.

## Absolute backward enclosure and exact late transfer

Take \(b_0=2^{15}\), \(b_1=2^{2070}\) from the original C101 bump derivative bounds. The C101 conservative boundary formulas on the Ipos wait insert \(Xv_0=-m_{\rm Const}\) and \(U_0=0\). The current radial velocity error has
\[
 |X\Delta v_1|\le 128 A_* b_0+ 2^{11} A_*/\delta
\]
by the actual stream reconstruction, \(|X\Delta U_1|\le16 A_* b_0\), and the mass tail and its Cauchy derivative. Combine it with the weighted tail bounds, their \(\eta\) derivatives, the C101 first radial derivative caps, and \(\sqrt{2X}\ge r,\ 2X\ge r^2\). This gives the following pointwise bounds for the differences of the original **backward** stress expressions on Ipos:
\[
\begin{aligned}
 I_z &=(32+2\mu) A_*b_0/r+32A_*b_1/r^3
                +2^{11}A_*/(r\delta)+2^8 rH_*/\delta,\\
 I_\theta &=(48+3\mu)rB_*b_0+48B_*(b_1+b_0)/r
                +(2^9b_0+2^{13}/\delta)A_*/r+12288rB_*/\delta .
\end{aligned}
\]
For the axial pressure parts, \(|2\eta/L|X |p|\) gives \(12 r^2H_*\) in the numerator and the derivative of the tail gives \(240 r^2H_*/\delta\). Their sum fits \(2^8 rH_*/\delta\) after dividing. For the angular case, after dividing by \(2X\) the leading wait transport gives \(3\mu r B_* b_0\), the viscous boundary gives \(48B_*(b_1+b_0)/r\), and the time boundary gives \(48rB_*b_0\). The reconstructed radial velocity and product boundaries contribute \((512b_0+4096/\delta)A_*/r\). The two angular tail terms add \((12288rB_*+4096A_*/r)/\delta\). Each coefficient is checked with rational arithmetic.

C101 identifies the exact difference of the normalized forward and backward errors as the uncut initial prefix \(P_{0,z}\) or \(P_{0,\theta}\) through \(X_{\rm minus}\), with moduli bounded by \(5gR_*\) and \(9g^2R_*\). For \(X_L\le X<X_+\) in the axial case, or \(X_L\le X<X_b\) in the angular case, the original backward error is exactly zero. The forward error is exactly \(P_{0,z}/\sqrt{2X}\) or \(P_{0,\theta}/(2X)\) there. The comparison to the original true forward stress uses the original exact full moments, so the two ordinary true stress primitives agree. The finite forward approximation retains its initial-prefix defect.

In particular the absolute forward error integrals throughout the full outer intervals obey
\[
\begin{aligned}
 \int_g^{X_+}|\Delta T_z^{\rm for}|\,dX
 &\le G_z+(X_L-X_0)I_z+5gR_*(\sqrt{2X_+}-r),\\
 \int_g^{X_b}|\Delta T_\theta^{\rm for}|\,dX
 &\le G_\theta+(X_L-X_0)I_\theta
          +(9/2)g^2R_*\log(X_b/X_0).
\end{aligned}
\]
The final terms are the integrated normalization of the exact forward/backward difference, including through Ipos. The angular result through \(X_+\) uses the same formula with \(X_b\) replaced by \(X_+\).

**OPEN**. Numerical quadrature values and any stronger numerical smallness requirement remain to be evaluated. The exterior stress error bounds are explicit source scale expressions. The higher recursions and final jets remain open.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation102/y-absolute-outer/final"
    $runtime = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    $n = "$p/hosted-43055678022-N4/original-whole-k-current-pressure-graph"
    $g = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
    node "$d/replay_n1_absolute_outer.mjs" $runtime "$n/original-source-functions.json" "$p/continuation100/y/final" "$p/continuation101/y-outer/final" $g "$d/operands-repeat.json"
    python -B "$d/check_n1_absolute_outer.py" "$d/operands-repeat.json" "$p/continuation101/y-outer/final" "$d/receipt-repeat.json"
