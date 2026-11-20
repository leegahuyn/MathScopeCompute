# Original N2 absolute stress error and local pressure-drive sensitivity

**VERIFIED.** The unchanged original N2 prefix reproduces the signed axial density #120791, the weighted angular density #120790, and their forward and backward radius binders. Both N2 stresses retain the same native \(\eta=\#2\) and independent fixed \(X_-=\#28814\), \(X_+=\#28824\). The N1 angular endpoint is the distinct original \(X_b=\#28826\). All ten axial and nine angular summands, the three frozen lower-only terms in each, and both signs of the primitive normalization were checked against the source. The two conservative error identities have zero rational numerators. Deleting the N2 \(2h\) contribution leaves two nonzero numerator monomials.

**CONDITIONAL.** Under the same ordinary source assumptions as C103, retain the original leading order and N1 exactly, and use original actual system #3's finite depth \(K\) for \(F_2,U_2\) and depth \(K+1\) for the compatible pressure. Then the original forward axial and angular stress errors each have pointwise and absolute \(L^1(dX)\) bounds on \([X_-,X_+]\). The sufficient depth specified below makes each bound strictly smaller than \(2^{-256}\), uniformly for real \(\eta\in[-1,1]\). An additional calculation bounds the local N2 pressure forcing when the original N1 lower input is approximated.

## Same-source conservative error

Write \(f,u,v,p\) for true-minus-finite differences of \(F_2,U_2,v_2,\Pi_2\). Set \(V=Xv\), \(V_0=Xv_0\) and let \(U_0,F_0\) be the original leading profiles. Put
\[
 c=-A,\quad a=-A-\tfrac12,\quad
 \gamma=c+4h,\quad\beta=a+4h,\quad
 \omega=-2A+4h,\quad\tau=\omega+\tfrac12 .
\]
The same mass reconstruction gives \((V_0)_X=-Z_c U_0\) and \(V_X=-Z_\gamma u\). In particular, differentiating \(V=L^{-1}(2\eta Xu-2\eta(D+4h)\Delta M-d\,\partial_\eta\Delta M)\) uses the original \(\Delta M_X=u\) and \(1-D=A\). All pure N1 terms and its previous-order viscous terms cancel in the N2 stress difference.

Define
\[
 \begin{aligned}
 j_z&=2U_0u+p,&j_\theta&=2X(U_0f+uF_0),\\
 B_z&=V_0u+VU_0-2Xu_X+(Xu-2\eta Xj_z)/L,\\
 B_\theta&=2X(V_0f+VF_0)-4X^2 f_X+(2X^2 f-2\eta Xj_\theta)/L .
 \end{aligned}
\]
The ordinary radial errors in the two original integrands are \(\partial_X B_z+R_z\) and \(\partial_X B_\theta+R_\theta\), with the angular weight \(2X\) already included. The remaining densities are
\[
\begin{aligned}
 R_z&=L^{-1}\big[-(\gamma+1)u+D\eta u_\eta+
          2\eta(\omega+1)j_z+d(j_z)_\eta\big],\\
 R_\theta&=L^{-1}\big[-(\beta+2)2X f+D\eta(2X f)_\eta+
          2\eta(\tau+1)j_\theta+d(j_\theta)_\eta\big].
\end{aligned}
\]
Here \(\omega+1=2h\) and \(2(\tau+1)=1+4h\), both retained from the actual N2 exponents. The independent rational replay substitutes freely specified radial and parameter jets, with the two reconstructed radial derivatives of \(V\) and \(V_0\). Equality for these arbitrary jets verifies the product rules at a point. Its two forward primitives are negative integrals from \(X_-\), divided by \(\sqrt{2X}\) axially or \(2X\) angularly. The backward primitives are positive integrals from \(X\) to \(X_+\) with the same normalization.

The exact C103 repair differences make the four ordinary integrals of \(u,\ 2Xf,\ j_\theta,\ j_z\) vanish on \([0,X_+]\). For \(j_z\), the original fifth row cancels \(\int(2U_0u-Xp_X)\); pressure saturation and integration by parts give \(\int j_z=0\). The conservative boundary terms vanish at the axis and after the last Ipos bump. The same fixed endpoints allow the parameter derivatives of the four zero integrals. Therefore the whole uncut signed difference cancels in each direction. The normalized forward-minus-backward error equals the uncut initial error prefix through \(X_-\). Beyond the last Ipos bump the backward error is exactly zero, and the forward error still includes this finite-approximation prefix. This conclusion uses the finite difference moments and does not set the prefix to zero.

## Absolute stress bounds at fixed original N1

Use \(C=C_{\rm Selected}\), \(B=C^{11}\), \(H=1+U_*+F_*\) with the exact original C102 leading value bounds, and the original N2 strip \(s=\delta/2^{19}\). On the actual interval \(X\le X_+<X_b<B\), both \(U_*,F_*\) apply at real \(\eta\). Write \(C_2\) for the actual registered #118568. The original matrix per-entry bound implies at most \(6C_2\) in each matrix row. For \(K\ge K_{\rm condition}+2\), put \(E=4^{-K}/3\). The raw \(K-2\) tail is \(16E\). Cauchy from \(S_s\) to \(S_{s/2}\) bounds \((A_0+A_1\partial_\eta)(W-P_{K-2})\) by \(6C_2(1+2/s)16E\). If \(w=W-P_{K-1}\), the diagonal equation bounds \((1+c_i)w_i/\xi\) by that same quantity. The original equations for the first two rows give \(e_X=w_i/(2\xi)\) and \(Xe_{XX}=(w_i'-w_i/\xi)/4\) for the two velocity errors. Thus the absolute raw first and weighted second radial errors both fit
\[
 R=2^8 C_2 E/s .
\]
Parity gives the ordinary one-sided axis interpretation.

On the local exact taper, \(X|\kappa_X|\le9\cdot64/t_1\). On Ipos the original two or three normalized bumps give weighted first-derivative bounds \(16A_*b_1/r^2\) or \(24B_*(b_1+b_0)/r\), where \(A_*=2^{17}Q^2gE,\ B_*=2^{31}Q^2gE,\ g=X_{\rm cut},\ r=\sqrt{2X_0},\ b_0=2^{15},\ b_1=2^{2070}\). Both are less than \(E\) by \(r>1,\ g<5Q^{-64}\), and \(Q>2^{260}\). The global first radial errors therefore obey \(|Xu_X|,|X f_X|\le\mathcal D=R+2^{10}C^{120}E\).

On the error support of \(f,u\), the source \(V_0\) has modulus at most \(2B\), using the original local \(v_0\) bound and \(V_0=-m_{\rm Const}\), \(m_{\rm Const}<r^2\), on Ipos. C103 gives \(|V|\le E\). The products in \(j_z,j_\theta\) only need the original complex leading bounds locally and on Ipos, because \(f,u=0\) elsewhere. This gives \(|j_z|\le17E,\ |j_\theta|\le32XQE\) on \(S_s\) including the pressure plateau, and Cauchy gives their first parameter derivatives bounded by \(34E/s,\ 64XQE/s\) on \(S_{s/2}\). The two boundary terms need only the real leading value bounds away from local support. On the real domain all four estimates are
\[
 \begin{aligned}
 |B_z|&\le74B H E+2\mathcal D,&
 |R_z|&\le2^9 E/s,\\
 |B_\theta|&\le140B^2 H Q E+4B\mathcal D,&
 |R_\theta|&\le2^{10}XQE/s .
 \end{aligned}
\]
Both normalized integrals are estimated by their two boundary values plus the corresponding integrated remainder. Since \(X_-\ge4Q^{-64}\), the reciprocals of the original normalizations are at most \(Q^{32}\) and \(Q^{64}\), respectively. Each integration length is less than \(B\). Thus both sup errors and both \(L^1(dX)\) errors are bounded by \(\mathcal M E\), where
\[
 \mathcal M=2^{14} Q^{65}B^3 H(1+C_2+C^{120})/s .
\]
The exact rational coefficient comparisons for the two bounds are \(5780\) and \(11544\), both below \(2^{14}\). The stress branches outside the original support agree exactly by the same original source guards. The depth
\[
 K_*=\max\!\left(K_{\rm condition}+2,\
     \left\lceil (256\log2+\log\mathcal M)/\log4\right\rceil\right)
\]
then gives errors below \(2^{-256}\), using the original \(1/3\) remainder factor. This depth specifies a finite expression with ordinary source inputs; it does not evaluate its enormous index or numerical centers.

## Separate N1 approximation effect on the N2 inner pressure drive

On the registered \([0,a^2]\), retain the original already cut N1 functions. For the true-minus-finite error of the original lower pressure drive, the exact source identity is
\[
 \Delta p_{\rm known}
  =(F_{1,t}+\widehat F_{1,t})\Delta F_{1,t}
    -\tfrac12\Delta(\Omega_1/X).
\]
The first Omega's previous-order viscosity uses \(v_0\) and cancels. Its changed terms are the slow time and radial viscosity applied to \(\Delta v_1\), the two original \(v_0,\Delta v_1\) radial transport products, and \(U_0 Z_{2h-1}\Delta v_1+\Delta U_1 Z_{-1}v_0\). The original runtime and a separate arbitrary-jet identity verify this exact difference.

Use \(s_1=\delta/16\). Let \(E_1,R_1\) be the N1 raw velocity, first radial and weighted second radial caps of C100 at the chosen finite N1 depth, on the indicated strip. The exact derivatives of the original taper satisfy
\[
 |\kappa_X|<2^8Q^{64}/t_1,\qquad X|\kappa_{XX}|<2^{24}Q^{64}/t_1^2
\]
on the taper, where \(X\ge X_a=4Q^{-64}\). Combined with the original raw errors, all first and weighted second radial errors of the cut fields fit
\[
 B_\Delta=2^{25}Q^{64}t_1^{-2}(E_1+R_1)
\]
on \(S_{s_1}\), as do their values. In the N1 average, differentiating under the fixed integral introduces \(t^k\); for the weighted second derivative the cap becomes at most \(\int_0^1 t\,B_\Delta\,dt\). Cauchy gives the reconstructed \(\Delta v_1\) value, first radial and weighted second radial caps \(2^6 B_\Delta/s_1\) on \(S_{s_1/2}\). A further loss gives \(|(\Delta v_1)_\eta|\le2^8 B_\Delta/s_1^2\) on \(S_{s_1/4}\). The actual leading local \(v_0,Xv_{0,X}\) bounds are \(2^9/\delta\), and the pure eta bound is \(2^{11}/\delta^2\). The original N1 local absolute bound makes the square difference at most \(3E_1\). The exact time, radial viscosity and two transport groups give
\[
 |\Delta p_{\rm known}|\le2^{19}B_\Delta/s_1^2
\]
on \(S_{s_1/4}\) throughout the actual interval, so its original pressure forcing row difference is at most \(2\sqrt X\) times this bound. This calculation retains \(t_1^{-2}\) and the original \(X\)-weights. The global N2 lower-moment retargeting and changes to the other N2 forcing components require separate estimates for a coupled N1/N2 approximation.

**OPEN.** Numerical evaluation of the finite expressions and source quadratures, the whole coupled N1/N2 error, the remaining recursions, and final jets. No gate status is promoted.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation104/y-n2-stress/final"
    $runtime = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    node --stack-size=65500 "$d/replay_n2_stress_conservation.mjs" $runtime "$p/continuation103/y-n2/final" "$p/continuation102/y-absolute-outer/final" "$p/continuation102/y-absolute-quantitative/final" "$d/operands-repeat.json"
    python -B "$d/check_n2_absolute_stress.py" --operands "$d/operands-repeat.json" --c103 "$p/continuation103/y-n2/final/n2-pressure-compensation.json" --c102 "$p/continuation102/y-absolute-quantitative/final/n1-outer-depth.json" --c100 "$p/continuation100/y/final/n1-radial-seams.json" --c101-taper "$p/continuation101/y-taper/final/n1-taper-flux.json" --c101-outer "$p/continuation101/y-outer/final/n1-outer-flux.json" --c102-outer "$p/continuation102/y-absolute-outer/final/n1-absolute-outer.json" --out "$d/result-repeat.json"
