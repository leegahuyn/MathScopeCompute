# Original N2 stress error under simultaneous N1 and N2 approximation

**VERIFIED.** The original N2 axial #120791 and weighted angular #120790 bodies, with ten and nine summands respectively, retain native \(\eta=\#2\), \(X_-=\#28814\) and \(X_+=\#28824\). The forward and backward primitives have their original independent binders and the exact opposite signs. Coupled conservative differences and the angular viscous weight identity have zero rational numerators. Four separate controls that omit a lower transport boundary or the previous-order viscosity give nonzero numerators \(323,405,326,312\).

**CONDITIONAL.** Under the C105 ordinary source hypotheses, the actual leading source is held fixed, while both positive orders use their own finite original recurrences and all original moment repairs. The two explicit depths below guarantee an error below \(2^{-256}\) for each N2 axial and angular stress at each real point of the original domain. The same upper bound holds separately for the two absolute \(L^1(dX)\) errors. The bounds keep all N1 error terms that disappear in C104's fixed-N1 comparison.

## Coupled error identities

Write \(u_i=\Delta U_i,\ f_i=\Delta F_i,\ p=\Delta\Pi_2,\ V_i=Xv_i\), where \(\Delta\) always means true original minus finite approximation. Write \(C=C_{\rm Selected}\), \(B=C^{11}\), \(c_j=-A+2jh\) and \(a_j=-A-\tfrac12+2jh\). The exact source pressure and angular product exponents are
\[
 \omega=-2A+4h,\qquad \tau=\omega+\tfrac12,\qquad
 \omega+1=2h,\qquad 2(\tau+1)=1+4h .
\]
For both true and finite fields the same ordinary mass identity gives \((V_j)_X=-Z_{c_j}U_j\). In particular the first derivative of each \(V_j\) at the replay anchor is determined by the corresponding source \(U_j\) jet. Define
\[
 \begin{aligned}
 J_z&=2U_0u_2+\Delta(U_1^2)+p,\\
 J_\theta&=2X\left(U_0f_2+u_2F_0+\Delta(U_1F_1)\right),\\
 B_z&=V_0u_2+\Delta(V_1U_1)+(\Delta V_2)U_0-2X(u_2)_X
                       +(Xu_2-2\eta X J_z)/L,\\
 B_\theta&=2X\left(V_0f_2+\Delta(V_1F_1)+(\Delta V_2)F_0\right)
                 -4X^2(f_2)_X+(2X^2f_2-2\eta X J_\theta)/L .
 \end{aligned}
\]
Direct source substitution and the freely assigned jets verify the two original density errors \(\partial_X B_z+R_z\) and \(\partial_X B_\theta+R_\theta\) with
\[
 \begin{aligned}
 R_z={}&[-(c_2+1)u_2+D\eta(u_2)_\eta+2\eta(\omega+1)J_z+d(J_z)_\eta]/L
                      -Z_{c_1-D}Z_{c_1}u_1,\\
 R_\theta={}&[-(a_2+2)2Xf_2+D\eta(2Xf_2)_\eta
              +2\eta(\tau+1)J_\theta+d(J_\theta)_\eta]/L
                      -2X Z_{a_1-D}Z_{a_1}f_1 .
 \end{aligned}
\]
The pressure term \(p\) contains the full coupled lower history of C105. It includes the changed lower pressure primitive and the changed Ipos coefficient. The two products \(\Delta(V_1U_1)\), \(\Delta(V_1F_1)\) and both previous-order viscosity terms remain in the replay.

The original uncut N2 signed differences cancel after the last Ipos bump. Its first, second and fourth moment differences give zero integrals for \(u_2,2Xf_2,J_\theta\), respectively. The fifth gives zero integral for \(2U_0u_2+\Delta(U_1^2)-Xp_X\), which is the integral of \(J_z\) by ordinary integration by parts and pressure saturation. These fixed-bound zero equations are identities in \(\eta\), so their displayed first \(\eta\) derivatives also vanish. The remaining previous-order axial term uses the original N1 zero integral of \(u_1\). Its angular partner uses the original N1 zero integral of \(2Xf_1\), together with the separately verified identity
\[
 2X Z_{a_1-D}Z_{a_1} f_1
    =Z_{a_1-D+1}Z_{a_1+1}(2Xf_1).
\]
For a smooth compactly supported \(g\), the \(X\) integration of \(Z_b g\) is the parameter operator
\[
 L^{-1}\left(2\eta(b+1)\int g+d\,\partial_\eta\int g\right)
\]
when \([Xg]\) vanishes. Apply it twice to the two N1 zero moments, keeping the ordinary fixed-bound \(\eta\) derivatives and flat endpoints. The boundary terms \(B_z,B_\theta\) vanish at the axis and after the final Ipos bump.

It follows that each normalized forward-minus-backward error is the uncut error integral from zero to \(X_-\). Beyond #117099 the backward error is zero and the finite forward approximation still has the initial-prefix error divided by its original radial normalizer. The guarded approximation retains the original zero exterior.

## Whole-support coefficient budgets needed for the stresses

Use the C105 scales \(s_1=\delta/16,\ s=\delta/2^{19}, a=\sqrt{a^2_{\rm source}}\), the source leading norm \(L_0\), the N1 value bound \(N_1\), the N1 perturbation \(e\) and the full lower forcing perturbation \(F_d\). Write \(\epsilon_K=4^{-K}/3\). The paired raw N2 value error is \(E_2=\epsilon_K+2aF_d\). With \(K\ge K_{\rm condition}+2\), the same paired difference two iterates earlier is bounded by \(16E_2\), keeping the fixed-\(N_1\) and \(2aF_d\) terms separate. Let \(w=W-\widehat P_{K-1}\). The original \(i=4,5\) diagonal equations give \(w_i/\xi\) from an integral whose right side is the coefficient operation on the \(K-2\) error plus the forcing difference. The first two original rows give the first raw \(X\) errors as \(w_i/(2\xi)\). Since \(\|A_0\|,\|A_1\|\le2^{20}Q^4\), a Cauchy loss \(s/2\) bounds these first radial errors by
\[
 R_2=2^{25}Q^4 E_2/s+F_d
\]
on the real domain including the axis trace.

For the original N2 taper \(X|\kappa_X|\le9\cdot64/t_1<2^{10}C^{120}\). For its Ipos error, let \(M_{\rm err}\) be the C105 five incoming moment error cap. The exact pair of inverse calibrations bound the scaled errors \(r\Delta\alpha,\Delta\beta/r\) by \(2^{30}Q^2 M_{\rm err}\). The actual bump derivative \(2^{2070}\), height \(2^{15}\), \(r>1\), and \(X<8r^2\) on bump supports imply the whole weighted first derivative cap
\[
 \mathcal D_2=R_2+2^{10}C^{120}E_2+2^{2120}Q^2 M_{\rm err}
\]
for both \(X(u_2)_X\) and \(X(f_2)_X\).

The only higher field derivatives used in the bound are in the previous-order \(Z^2\) terms. The whole N1 errors \(u_1,f_1\) with their first radial and \(X\)-weighted second radial derivatives are bounded by \(e\) on \(S_{s_1}\). For \(X\le B\), the original \(Z_b\) and \(X\partial_X Z_b\) formulas bound these two expressions by \(2^6 B e/s_1\) and \(2^7 B e/s_1\) on \(S_{s_1/2}\), respectively. The mixed \(X,\eta\) input follows by Cauchy on the first radial derivative. The further \(\eta\) derivative of \(Z_b\) costs \(4/s_1\), giving
\[
 |Z_{c_1-D}Z_{c_1}u_1|,\quad |Z_{a_1-D}Z_{a_1}f_1|
 \le 2^{14} B e/s_1^2\le B D_1,\qquad D_1=2^{14}e/s_1^3.
\]
For current-order products the real \(C^1\) parameter bounds of C105 suffice.

On the real interval write \(S_2\) for the C105 real value-plus-parameter error of \(F_2,U_2\), and \(\mathcal Z\) for the C105 full coefficient value cap. The same C105 pressure density integrated on length \(B\) gives \(\|p\|_{C^1_\eta}\le B(2L_0 S_2+D_L)\le\mathcal Z\), with \(D_L\) the lower three-density error. C105 also gives \(|\Delta V_2|\le2^8 B S_2\). The true and finite N1 \(v_1\) both have modulus at most \(2^4 N_1\) by their actual mass average and derivative in \(\eta\). Since \(|\Delta v_1|\le D_1\), the two lower transport boundary products are bounded by \(2^5 B N_1 D_1\).

Set
\[
 G=L_0 S_2+N_1D_1+\mathcal Z+\mathcal D_2 .
\]
Then \(J_z,J_\theta\) have real \(C^1_\eta\) bounds \(2G,4BG\). In the two boundary and remainder expressions this gives
\[
 |B_z|\le2^9 B G,\quad |B_\theta|\le2^{10}B^2 G,\quad
 |R_z|\le2^6 B G,\quad |R_\theta|\le2^7 B^2 G .
\]
The exact integer coefficients before relaxation are \(301,602,39,78\) in the stated respective units. Since \(X\ge X_-\ge4Q^{-64}\), the normalizer reciprocals are at most \(Q^{32},Q^{64}\). The two endpoint terms, two remainder integrals and an additional integration of length at most \(B\) give the common upper bound
\[
 \mathcal C=2^{12}Q^{64}B^4 G
\]
for the pointwise and absolute radial integral errors of each guarded original stress.

## Explicit two depths

In the preceding expression \(\mathcal C\) depends linearly with nonnegative coefficients on two error inputs \((\epsilon_K,e)\). The positive coefficients \(P_K,P_N\) are obtained by using \((1,0)\) and \((0,1)\) in the displayed budget formulas, with all original field scales fixed. This operation computes two coefficients of an estimate, with no change to the original source parameters. In particular C105 gives \(F_d=(2^{25}H_1/s_1^2)e\), \(D_L=(2^{32}B^2L_0^2 N_1/s_1^3)e\), \(M_{\rm err}=2^6 L_0(4E_2/s)+BD_L\) and \(S_2=4E_2/s+2^{48}Q^2 M_{\rm err}\). The error \(e=e_0Q^{-25(N-2)}\) uses the original \(e_0=2^{25}Q^{64}t_1^{-2}(2^{73}Q^{-77}+2^{46}Q^{-19})\). Select
\[
 \begin{aligned}
 N&=2+\left\lceil\frac{\log(1+\max(2^{14}e_0/s_1^3,\ 2^{257}P_N e_0))}{25\log Q}\right\rceil,\\
 K&=\max\!\left(K_{\rm condition}+2,\left\lceil\frac{257\log 2+\log(1+P_K)}{\log4}\right\rceil\right).
 \end{aligned}
\]
Then \(D_1\le1\) and each contribution \(P_K\epsilon_K,P_N e\) is less than \(2^{-257}\). The four announced errors are therefore strictly below \(2^{-256}\).

**OPEN.** Numerically evaluating the two finite centers and original integrals, subsequent orders, and final jets. These conclusions use the original ordinary leading and Picard realizations and their original fixed-endpoint integral meanings. No gate status is promoted.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation106/y-coupled-n2-stress/final"
    $r = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    node --stack-size=65500 "$d/replay_coupled_n2_stress.mjs" $r "$p/continuation104/y-n2-stress/final" "$p/continuation105/y-coupled-n2/final" "$d/operands-repeat.json"
    python -B "$d/check_coupled_n2_stress.py" --operands "$d/operands-repeat.json" --fixed "$p/continuation104/y-n2-stress/final/n2-absolute-stress.json" --paired "$p/continuation105/y-coupled-n2/final/coupled-n2.json" --out "$d/result-repeat.json"
