# Positive norm propagation for the last stage-zero axial pressure term

**VERIFIED arithmetic and source binding.** The replay authenticates the 4,456,994-node original graph and the two original Volterra definitions, then executes a 6,481-node positive bound program. Its physical axial pressure bound is root 6480. The independent readback reaches all sixteen weighted target roots and all seventeen relevant live background roots. The moving frame uses only positive-order \(G\) derivatives. The readback checks the transverse cutoff literals as exact integers and rejects an exact one-unit mutation.

**CONDITIONAL analytic bound.** The bound uses the same-box source uniform cone, moving-frame denominator and propagator estimates, smooth source extension across the row joins, and finiteness of the imported actual FTC norms. The source-only norm expressions are exact. Their definite integrals have no numerical interval evaluation in this receipt. The result bounds one summand of the first physical axial derivative of initialized mean pressure. It does not supply the sum over the remaining initial mean contributions or later active fields.

## Source and domain

Use the original whole-K \(q_{\rm Big}/64\le q<q_{\rm Big}/16\), \(X_a\le X\le X_b\) and \(|\eta|<3/4\), with fixed original reference band \(Q\), \(s=q/Q\in[1/2,2]\), \(R=r/\sqrt Q\), \(Z=z/Q^D\), \(D=1/2-h\). Here \(Q\) is a dyadic band, distinct from \(q/\tau_0\) in the chart receipt. Each active row has its own original fixed band and fixed representative. The raw target operands are \(\#623780,\#623787\), and the normalized target is \((\#623781,\#623788)\). The two live slow \(F,G\) fields have original coefficient orders zero through three on physical whole K. The frozen carrier uses the original leading representatives for \(\lambda_0,c_0,g_0\). Its \(R,Z\) derivatives are zero with labels fixed. No fourth frozen coefficient is needed for this derivative.

The two pulse matrices are \([[\#623351,\#623328],[\#623332,\#623352]]\) and \([[\#623685,\#623663],[\#623667,\#623686]]\). Their \(v\) coordinate is \(\#622805\), their length is \(\#623027\), and their registered initial vector is \((1,0)\). The first three actual parameters are live \(R,Z,T\). The next three are the representative and the final one is the frozen band. The hosted graph's \(\#622791\) is this band coordinate. The separate localization program has an identically numbered scalar \(q_{\rm Big}=2^{-(\ell_{\min}+10)}\). The replay imports that relation from the localization receipt, whose \(\ell_{\min}=\#617432\) belongs to the common prefix.

## Bound recurrence

The computation retains the downward-closed multi-indices
\[
\mathcal D=\{(0,j):0\le j\le7\}\cup\{(1,j):0\le j\le6\},
\qquad f_\alpha=\partial_{R,Z}^\alpha f/\alpha!.
\]
All series products are finite coefficient convolutions over \(\mathcal D\). For a nonzero denominator with \(|f_0|\ge l\), the reciprocal majorant starts at \(l^{-1}\). Its higher coefficients obey \(I_\alpha=l^{-1}\sum_{0<\beta\le\alpha}F_\beta I_{\alpha-\beta}\). For a square root with \(\sqrt{f_0}\ge l>0\), start with \(S_0=\sqrt{F_0}\) and use \(S_\alpha=(F_\alpha+\sum_{0<\beta<\alpha}S_\beta S_{\alpha-\beta})/(2l)\). The strict inequalities in the sum exclude both endpoint indices. All matrix entries and components are bounded in absolute value. The two independent signs use the same majorants.

For the frame the replay uses a pair of coefficient arrays for each function and its \(v\) derivative. The pair obeys the product rule, \((f^{-1})_v=-f_v/f^2\), and \((\sqrt f)_v=f_v/(2\sqrt f)\). This keeps the moving normal \(n_v\), the constrained pressure row \(n^\top K-n_v^\top\), and both parts of \(B_v=U_vJ+UJ_v\) in
\[
M=B_{\rm left}(A_\phi B-B_v)-\lambda I-(d-d_{\rm ref})I .
\]
In the source \(n=(x_0-v H_R,p/R,p_z-\epsilon v H_Z)\) and \(H=pF+p_zG\). The coarse estimates use \(\epsilon\le1\), \(\epsilon k^2\le4\), \(k\ge1\), \(\lambda_0\le R_*^{83}\), \(|c_0|\le R_*^{10}\), and the source lower bounds \(|n_t|,|n|\ge B_0^{-2}\), \(|c_0|\ge B_0^{-1}\). Here \(B_0=\#300170\), \(R_*=\#216823\), and \(r_0=\#300171=2^{-34}\). The original carrier bound
\[
1+(R_*+1)R_*^{42}\left(1+\frac{uR_*^{31}}{4r_0}+\frac u2\right)
\]
bounds \(|p|,|p_z|,|x_0|\). The frame reads the imported \(F,G\) norm row by actual derivative degree. The extra first-order shifts in \(H_R,H_Z,F_R,G_R\) require degree eight. The pulse derivative in \(B_v\) does not add a slow derivative.

With \(L_{\max}=2r_0(4+\sqrt2)\), \(S_*=(\ell_{\min}+17)^2\) and \(L_s\le L_{\max}S_*\), the original forward propagator is bounded by \(W=\exp(3B_0^{256}L_{\max})\). The stable bound is an analytic input from the source decomposition into \(\operatorname{diag}(0,-2\lambda)\) and errors of row sum at most \(3B_0^{256}/S\). Duhamel's formula on the exact differentiated system with zero positive-order initial data gives
\[
W_0=W,\qquad W_\alpha\le L_{\max}S_*W
  \sum_{0<\beta\le\alpha}\|M_\beta\|_\infty W_{\alpha-\beta}.
\]
The fixed Gaussian \(P(v)\le1\) and fixed longitudinal cutoff \(\psi(v)\le1\) have no slow derivatives. The bound for \(t=B P w\) gives each exact full covariance entry \(\#623405,\#623408,\#623737,\#623740\). The full native integral costs at most \(4r_0^2\) after taking its absolute integrand bound, since the original Haar and angular factors give \((D_g/2)c_i\int\chi^2d\xi\) and \(c_iL_s=2r_0\). No displayed finite Volterra series or pulse quadrature replaces either integral.

For the source determinant \(\#623792\), use \(|\det H|\ge d_*/S\) and the original entry bound \(e_{\rm up}\). The corresponding matrix infinity estimate is \(4e_{\rm up}S_*/d_*\). Differentiate \(H H^{-1}=I\) with the same normalized product rule. Then \(y=H^{-1}\bar T\) has the common weighted bound \(\zeta\delta_*^{-24}\) in all selected degrees. The original two weights satisfy \(y\ge c_y\zeta\) for \(X_a<X<X_b\). The recurrence for the actual square roots \(\#623824,\#623825\) factors out one \(\sqrt\zeta\) and gives pole 12 at degree zero and at most \(24m\) at every positive degree \(m\). The maximum pole is 168. Multiplying by the frame and fixed slow partitions gives the same common pole. Absorb it using
\[
\sqrt\zeta\,\delta_*^{-168}
\le1+84!\left((2/t_1^2)^{84}+(1/2)^{84}\right),
\qquad
\zeta=\exp(-t_1^2/d_a^2-4/d_b^2).
\]
The original smooth zero extension supplies the edge values. No reciprocal weight or Gaussian is evaluated at an edge.

The original fixed-label slow partition is a single bump divided by the square root of the sum of the three relevant squared bumps. Its denominator is at least \(1/2\) on the active support. The replay uses the exact source seed derivative recurrence through seven and ordinary chain composition, with mesh slopes at most \(S_*^3\). For the band factor it uses the existing analytic continuation of \(\log s\) on the radius-\(1/(128R_*)\) slow polydisc, \(|\log s|\le4\), and \(1/\log2<2\). This gives \(8(128R_*)^j\) for each positive normalized coefficient.

## Output bound

The local real angular covariance has the original two transverse factors \(\chi^2\) and \(\chi\chi'\). If \(U\) is the common bound for the fifteen jets of \(A_r^0,A_z^0,U_\theta\), the two absolute local bounds are
\[
M_j=32U^2\left((2+R_*)\|(\chi^2)^{(j)}\|_\infty+
  a_{\rm fast,max}\|(\chi\chi')^{(j)}\|_\infty\right),\quad j=0,2.
\]
The cutoff derivatives use exact integers, including the physical transverse slope \(2/r_0=2^{35}\). The coefficient \(a_{\rm fast,max}=4R_*^3\exp(h(\ell_{\min}+17)\log(2)/100000)\) follows from the original radial phase scale. The 162 original rows give \(G_0=41472 M_0\) and \(G_2=41472\cdot4^8 M_2\) for the common torus zero-order and twice-transverse bounds. This uses \(L\xi=\Lambda^\delta\), \(Lv=0\), \(0\le\delta\le4\), and \(\Lambda=4-\sqrt2<4\). The prior Fourier estimate gives \(85G_0/6+85G_2/216\) for \(N^{-1}P_\perp\).

The bound at root 6475 is for the exact normalized summand
\[
-\epsilon^6c_{i_0}^{-1}T_0T_1N^{-1}P_\perp T_0(\partial_Z^6W_{rz}).
\]
It takes the fixed radial operator norm \(\#7414\) twice for \(T_0\) and once for \(T_1\). The prior native lineage reads \(\#643048\) for early \(W_{rz,ZZ}\) and \(\#3613979\) for the late Temporal axial third partial. The common chart gives \(c_{i_0}^{-1}\le8(4+\sqrt2)S_*\), \(\epsilon^6\le2^{-6h(\ell_{\min}+13)}\), and \(Q^{-2A-D}\le2^{(3/2+h)(\ell_{\min}+17)}\), where \(A=1/2+h\). Root 6480 multiplies by the last factor to bound the corresponding physical \(\partial_z p\) term. Both live \(Q\) and each contributing own band \(Q_{\rm label}\) lie in \([q_{\rm Big}/128,q_{\rm Big}/8]\).

## Replay

Use Node with the existing pinned evidence files under GOAL_NEXT, the extracted corrected source graph directory from GitHub run 43010593847, and the original whole-K chart JSON. From this directory:

```text
node --max-old-space-size=3072 propagate_wrz_norm.mjs GOAL_NEXT HOSTED_GRAPH WHOLE_K_CHART wrz-positive-propagation.json
node check_wrz_propagation.mjs GOAL_NEXT wrz-positive-propagation.json wrz-positive-readback.json
```

In the working tree GOAL_NEXT is `work/goal-next`, HOSTED_GRAPH is `work/goal-next/corrected-flat/hosted-43010593847/corrected-first-cycle-graph`, and WHOLE_K_CHART is `work/goal-20261111/m3/whole-k-chart.json`. The producer reads the pinned directional receipts and compares the recorded compressed FTC graph hashes with the prior readback. The independent readback checks strict positivity for every reciprocal, exact positive-graph reachability and the final factorization.

In the combined archive, use `tools/mathscope-cd-axial-bridge-20261029/goal-next` for GOAL_NEXT, `inputs/corrected-first-cycle/corrected-first-cycle-graph` for HOSTED_GRAPH, and `tools/mathscope-cd-axial-bridge-20261029/goal-20261111/m3/whole-k-chart.json` for WHOLE_K_CHART.

The pressure sum, initialized Temporal and FiveMap scalar jet enclosures, later active terms, and final 67-atom interval execution remain open. N7-06 and N8-05 remain OPEN, jets 0/67, RELEASE HOLD.
