# Highest slow derivatives in the archived FiveMap direct velocity

**VERIFIED source and operator identities.** The replay authenticates the original 4,456,994-node archive and native registry, checks 72 original nodes, and tests the Haar and shifted radial adjoint formulas with exact rational arithmetic. The reduction narrows the pure-slow C3 mean input of the archived mean–wave C2 calculation to four derivatives of the original primary potential. A [separate numerical replay](../../slow-nine/README.md) bounds the ordinary C8 potential and the required C3 mean on the fixed chart. Both routes use the admitted original chart, smooth torus source, original flat radial endpoints and fixed labels. Live-family and final-field attachments remain open.

## Source of the highest derivative

The actual direct FiveMap velocity is \(\#3614767\). Its two fresh target inputs are \(P=\#3614334\) and \(J_z=\#3614420\). Both native definitions have formals \((\ell,Z,T)\) and are independent of \(R,Y\). The slow scaling factors that multiply these targets are independent of \(R\), since the actual chart's \(s,\eta\) depend only on \(Z,T\). A radial derivative in a total-order-three direct FiveMap atom therefore leaves at most two derivatives on the fresh targets. The only potentially new target derivatives are \(D^\alpha=\partial_Z^a\partial_T^{3-a}\) for \(a=0,1,2,3\).

The original updated radial source contains \(-\epsilon\partial_Z(\beta_T\gamma_T+W_{rz})\). The two exact Temporal factors are \(\beta_T=\#1706773=-\epsilon\partial_Z\psi_T\) and \(\gamma_T=\#1706782=(I-A_1)\gamma_d\). The replay checks both terms of the differentiated product entering \(\#3613934\), the actual radial body \(\#3613993\), and the fresh target applications. For \(D^\alpha\partial_Z(\beta_T\gamma_T)\) the sole split requiring more than slow order six of a covariance has all four product derivatives on \(\beta_T\). Any other split uses \(\beta_T\) through slow three or \(\gamma_T\) through slow four. The same reduction holds for the weight \(R^2\) in \(J_z\). Other terms use the previous slow-six covariance and fixed operator bounds.

The early source \(E_z=\#643883\) contains \(\epsilon\partial_Z p\). Its shifted \(W_{rz,ZZ}\) native application is \(\#643800\), with the same derivative slots as the unshifted \(\#643048\) and with both shifted torus arguments retained. The left and whole integrals \(\#643806,\#643807\), including \(-\chi\) times the whole, give \(-\epsilon^2T_0W_{rz,ZZ}\) in \(E_z\). Differentiating either output cutoff or any lower factor costs at most slow six of \(W\). The top term in the fresh \(P\) after the Haar transfer below is

\[
\epsilon^4c_{i_0}^{-2}\int
\big\langle (T_1T_0)D^\alpha\partial_Z^4W_{rz},\ N^{-2}P_\perp(I-A_1)E_z\big\rangle_Y\,dR.
\]

For \(J_z\), insert \(-R^2/2\) in the integral. The \(\gamma_T^2\) term of \(J_z\) uses lower source degrees. The fixed \(T_1\) C5 bound is already available for all lower operator derivative terms.

## Haar and shifted radial adjoints

On the original mean-zero torus, \(N=v_t\cdot\partial_Y\) is skew-adjoint and its exact inverse is skew-adjoint on the admitted smooth source. The identity \(\langle N^{-1}f,N^{-1}g\rangle_Y=-\langle f,N^{-2}g\rangle_Y\) moves both inverse factors to the low \(\gamma_T\) source. The Haar projection can move to either side. No derivative in \(Y\) is required on the high \(D^\alpha\partial_Z^4W_{rz}\) operand. To bound the low operand, write \(D_k=k\cdot v_t\), \(E_k=k\cdot v_r\). The actual quadratic divisor gives \(|D_k|^{-1}<(4)\lVert k\rVert_\infty\) for \(k\ne0\). For \(|D_k|<1\), orthogonality and \(|v_t|^2=|v_r|^2>1\) give \(\lVert k\rVert_\infty^2\le 1+E_k^2\). When \(|D_k|\ge1\) the same upper bound \(|D_k|^{-2}\le16(1+E_k^2)\) holds directly. With \(\pi>3\), Parseval yields

\[
\lVert N^{-2}P_\perp g\rVert_2\le \frac49\left(\lVert g\rVert_2+\frac1{36}\lVert L^2g\rVert_2\right).
\]

The low source is available at the latter transverse order. These identities concern the complete original Fourier inverse, with its Haar mode and convergence already identified.

Set \(\widetilde Y=Y-\Phi(R)v_r\). The original shear translation conjugates \(D_R\) to \(\partial_R\) and preserves normalized Haar measure. In those coordinates, the adjoint for the original left-minus-whole operator in \(dR\,dY\) is

\[
T_e^*g(r)=r^e\left(\int_r^b R^{-e}g(R)\,dR-\int_a^b R^{-e}\chi(R)g(R)\,dR\right).
\]

In particular \(D_RT_e^*g=(e/r)T_e^*g-g\), and \(D_R(T_1T_0)^*g=-T_1^*g\). The weight \(R^j\) belongs in the low adjoint input. Both whole-cutoff terms remain in the adjoint. The exact tests reject omitting the rank-one cutoff, reversing the Haar sign, or removing the \(1/R\) connection in radial integration by parts.

## Four remaining potential derivatives

For each signed native row the imaginary part of \(W_{rz}\) is \(J_rJ_z/2\), where \(J_r=-\epsilon C_{\theta,Z}\), \(J_z=(D_R+1/R)C_\theta\). The two signed row bodies \(\#627167,\#630585\) and their actual differentiated potential slots are checked directly. Put \(\mu=(a+4,3-a)\) in \((Z,T)\). In \(\partial^\mu W_{rz}\), the mixed Leibniz terms need at most slow seven of \(C_\theta\). The leading real product needs primary amplitude through slow seven and no additional potential derivative.

The endpoint with all \(\mu\) derivatives on \(J_z\) is \(J_r(D_R+1/R)\partial^\mu C_\theta/2\). In the actual radial pairing, write \(h=(T_1T_0)^*g\) for the low test factor. The radial derivative transfers by

\[
\int J_r (D_R+1/R)f\,h=\int f[-(D_RJ_r)h-J_rD_Rh+J_rh/R].
\]

The original zero collar removes the boundary term, and \(D_Rh\) is a known adjoint source without any derivative of \(g\). Thus the \(J_z\) endpoint only needs \(\partial^\mu C_\theta\) of order seven. The \(J_r\) endpoint still needs the following four derivatives of order eight:

| \(a\) | Remaining \(C_\theta\) derivative | High \(W_{rz}\) derivative before radial transfer |
|---:|---|---|
| 0 | \(\partial_Z^5\partial_T^3\) | \(\partial_Z^4\partial_T^3\) |
| 1 | \(\partial_Z^6\partial_T^2\) | \(\partial_Z^5\partial_T^2\) |
| 2 | \(\partial_Z^7\partial_T\) | \(\partial_Z^6\partial_T\) |
| 3 | \(\partial_Z^8\) | \(\partial_Z^7\) |

For the direct source construction these potential derivatives require the same four weighted target directions of order eight and the corresponding original background directions with an extra \(R\) or \(Z\) derivative from \(K,n,n_v\). These are order-nine background directions. The leading-only source still fits background C8 and target C7. This is the demand of the demonstrated route, with no claim that an additional exact identity in the original primary fields is impossible.

The scalar counterexample tests the operator cancellation independently of any actual primary source claim. On \([1,2]\), take \(\phi(R)=R(R-1)^8(2-R)^8\) and one unit-torus sine. The compact radial source \(\partial_R(\partial_R+1/R)\phi\) yields exactly \(\phi\) through \(T_1T_0\), including the complete cutoff. The normalized Haar pairing of \(\phi\) with \((\partial_R+1/R)\phi\) is \(1/26447537160\) at weight 1 and zero at weight \(R^2\). This rules out deleting the high \(P\) pairing by a general Haar, divergence or radial adjoint identity. The actual FiveMap angular matrix is invertible, so the two distinct target responses cannot be discarded through a general cancellation between \(P,J_z\).

## Replay

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
w="$p/primary-forced-weights/higher-mean/adjoint-c3"
node "$w/check_fivemap_highest.mjs" "$p" "$graph" "$runtime" /tmp/fivemap-highest-directions.json
```

`graph` is the corrected archived first-cycle source export and `runtime` is the exact earlier source tree with the pinned source files. The final jet count is 0/67. RELEASE HOLD.
