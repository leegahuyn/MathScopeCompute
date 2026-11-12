# All 67 original initialized atoms on the whole-K annulus

**VERIFIED source references and arithmetic.** The certificate joins the original slow-background, initialized mean, initialized primary, and initialized pressure proofs. The 516-node positive graph has one bound root for each of the 57 gauge, six direct scalar and four pressure requests. Independent readback reproduces the exact third radial operator and six radial-square coefficient rows, checks the transverse order-seven integer and fast time cancellation operands, and verifies all 67 branch sums.

**CONDITIONAL analytic scope.** The roots bound the actual annular stage-zero field on \(q_{\rm Big}/64\le q<q_{\rm Big}/16\), \(X_a\le X\le X_b\), and \(|\eta|<3/4\). The proof uses the original analytic hypotheses recorded by the prior source certificates, including the exact source FTC integrals and smooth fixed-cover joins. These integrals have no numerical interval evaluation here. The later active correction stages and final-field enclosure remain open. Final jets 0/67, RELEASE HOLD.

## Last transverse input and exact time cancellation

The original initialized mean gauge is \(Q^{-h}(\psi_T+\psi_5)e_\theta\), with actual operands \(\psi_T=\#1706770\) and \(\psi_5=\#3614778\). The original direct scalar is \(Q^{-A-1/2}(v_T+v_5)/R\), with \(v_T=\#1706624\) and \(v_5=\#3614767\). The source ordinary bounds for \(\psi_T,\psi_5,v_T,v_5\), together with earlier \(L\psi_T,L^2\psi_T,Lv_T\), are already available. Here \(L=v_r\cdot\partial_Y\). The last spatial inputs are the values of \(L^3\psi_T\) and \(L^2v_T\).

For the first one the two-order transverse estimate of \(N^{-1}P_\perp L^3E_z\) uses \(L^3E_z\) and \(L^5E_z\). The radial derivative in \(E_z\) then requires the value of \(L^6W\). Each actual local covariance is the half sum of the leading and imaginary curl products. The former carries a single \(\chi(\xi)\) in each factor. The latter carries \(\chi\) and \(\chi'\) in each factor, with the known positive local bounds from the actual coefficient \(C=n\times A^0/|n|^2\) and pulse amplitude \(A^0\) of the primary replay. Their derivatives through six use the original \(\chi^{(7)}\) integer bound. The exact \(\xi\) map gives \(L\xi=\Lambda^\delta\), \(Lv=0\), so \(L^6\) costs at most \(4^{24}\). The \(2A\) covariance ratio and 162 rows add \(4^2\cdot162\). No extra ordinary slow \(W\) order is needed for this last value.

The retained early nonzero-Haar source operands are \(\#643882\) and \(\#643867\). The radial derivative in \(E_z\) and its actual shifted early pressure source retain the cutoff \(\chi_Z\) and raw whole integral. The \(E_\theta\) inverse for \(L^2v_T\) requires \(L^2E_\theta\) and \(L^4E_\theta\), which are covered by the earlier covariance norms. Use the original anisotropic pointwise estimate \(85\|f\|_2/6+85\|L^2f\|_2/216\) and the original fixed radial operator constants. These produce \(L^3\psi_T\) and \(L^2v_T\) without a longitudinal derivative of the covariance.

All time requests in the 57 gauge atoms have exactly one physical time derivative and total degree at most two. The only time request in the six direct atoms is first time order. In the original fixed reference band the normalized time derivative is \(-\partial_T+c_{i_0}N/\epsilon\). The original \(\psi_T=-c_{i_0}^{-1}T_1N^{-1}P_\perp E_z\) and \(v_T=-c_{i_0}^{-1}N^{-1}P_\perp E_\theta\) give
\[
(-\partial_T+c_{i_0}N/\epsilon)\psi_T
=-\partial_T\psi_T-\epsilon^{-1}T_1P_\perp E_z,\qquad
(-\partial_T+c_{i_0}N/\epsilon)v_T
=-\partial_Tv_T-\epsilon^{-1}P_\perp E_\theta.
\]
The exact Fourier inverse acts on the nonzero Haar modes and commutes with the fixed radial translations. For absolute bounds, \(P_\perp\) costs at most two. The \(z,t\) mixed gauge atom uses the C1 bound on \(T_1E_z\), and the horizontal mixed atom also uses \(LT_1E_z=T_1LE_z\). The FiveMap scalar functions have no auxiliary \(Y\) dependence and use their ordinary slow jets.

## Atom transport and assembly

The physical radial derivative uses \(D_r=\partial_R+a(R)L\), with \(|a'|\le4R_*a_{\max}\) and \(|a''|\le12R_*^2a_{\max}\). Its third-order identity is
\[
D_r^3=\partial_R^3+3a\partial_R^2L+3a^2\partial_RL^2+a^3L^3
 +3a'\partial_RL+3aa'L^2+a''L .
\]
Together with the time cancellation above, this gives all requested scalar \(\psi\) derivatives. The direct \(b\) transport uses \((2R)^{-1}D_r\) on \(v/R\) at fixed normalized \(r^2/Q\), through two derivatives. The exact atom ledger supplies the Cartesian rotation of the mean azimuthal gauge and the exact Laurent factors for \(v/R\). Each mean atom uses its original physical dyadic exponent and reference band, with lower bound \(Q\ge2^{-(\ell_{\min}+17)}\).

The 38 horizontal gauge roots sum the actual slow, mean and primary bounds. The 19 axial gauge roots are the original primary roots because both other axial components are zero. Each direct root sums the original slow and mean scalar terms. The four pressure roots import the complete initialized pressure bounds for actual source \(\#3859821\). The combined bound roots are under `roots.all`, with the exact branch receipts in `pins`.

## Replay

GOAL_NEXT is the directory containing the pinned earlier evidence, with the same structure as `work/goal-next` in the working tree.

```text
node replay_initialized_gauge.mjs GOAL_NEXT initialized-stage-zero-atoms.json
node check_initialized_gauge.mjs GOAL_NEXT initialized-stage-zero-atoms.json initialized-stage-zero-atoms-readback.json
```

The earlier primary and mean receipts stream and authenticate the full original graph. This thin join verifies their recorded hashes and source identities. No local Lean compilation or numerical quadrature was used.
