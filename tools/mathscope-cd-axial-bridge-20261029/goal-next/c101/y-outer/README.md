# Original N1 outer compensating fields and signed stress errors

**VERIFIED**. The original runtime and unchanged graph reproduce 15 conservative source identities, the two actual weighted mass prefixes, and the three actual weighted pressure prefixes in Ipos. Axial density #117047 and full integrals #117075 and #117072 retain their source meanings. The last angular bump ends at the actual source radius #117099. The saturated mass and pressure use original repair rows 0 and 2, respectively. The same C100 substitutions preserve all five original repair identities.

**CONDITIONAL** on the same ordinary original leading and C100 field realization, the original moment denotation and ordinary differentiation. Beyond \(X_{\rm cut}\), the difference between the original and finite fields is supported through the final Ipos bump, including any accumulated mass and pressure in the gaps. The original \(X_+\) and angular terminal \(X_b\) are strictly later. The signed axial outer integral from \(X_{\rm cut}\) to \(X_+\) has error at most \(5gR_*\), and the correspondingly weighted angular integral from \(X_{\rm cut}\) to \(X_b\) has error at most \(9g^2R_*\), where \(g=X_{\rm cut}\) and \(R_*=2^{46}Q^{-19}\). The same bounds apply to errors in the two signed integrals beginning at \(X_{\rm minus}\). Uniform pointwise and absolute integrals over the intervening outer region remain distinct.

## Ipos differentiation and prefix errors

Let the difference \(\Delta\) be original minus C100 finite. Write \(r=R_b\), \(x=\sqrt{2X}/r\), and \(E=2^{73}Q^{-77}\). On the five source bumps \(1<x<4\). C99's actual inverse gives
\[
 \|r\Delta\alpha\|_\infty\le A_*:=2^{17}Q^2gE,\qquad
 \|\Delta\beta/r\|_\infty\le B_*:=2^{31}Q^2gE .
\]
The exact unchanged normalized step derivative is \(b_j(x)=\sigma'((x-\ell_j)/w)/w\), with \(w=2^{-11}\). The pinned step bounds give \(|b_j^{(i)}|\le b_i\) for \(b_0=2^{15}\), \(b_1=2^{2070}\), \(b_2=2^{2081}\). The error fields are
\[
 \Delta U_1=\sum_{j=0}^1\Delta\alpha_j b_j(x)/r,\qquad
 \Delta F_1=\sum_{j=0}^2\Delta\beta_j b_{j+2}(x)/(r^2x).
\]
Since \(\partial_X=r^{-2}x^{-1}\partial_x\), two applications of the exact operator yield the following ordinary bounds on \(S_{\delta/8}\), including the flat bump endpoints.

| Error | Value | First \(X\) derivative | Second \(X\) derivative |
| --- | --- | --- | --- |
| \(\Delta U_1\) | \(2A_*b_0/r^2\) | \(2A_*b_1/r^4\) | \(2A_*(b_1+b_2)/r^6\) |
| \(\Delta F_1\) | \(3B_*b_0/r\) | \(3B_*(b_1+b_0)/r^3\) | \(3B_*(b_2+3b_1+3b_0)/r^5\) |
| \(\Delta\Pi_1\) | \(2^{33}QgE\) | \(12B_*b_0/r^2\) | \(B_*(42b_0+12b_1)/r^4\) |
| \(\Delta M_1\) | \(2^{21}Q^2gE\) | \(\Delta U_1\) bound | \(\Delta U_{1,X}\) bound |

For the pressure derivatives use the original Ipos \(F_0=K(\eta)r^{-1}x^{-2-2\lambda}\), \(|K|\le 2\), \(0<\lambda<1/4\). Its first \(X\) derivative has modulus at most \(5r^{-3}\). The original leading \(\Omega\) pressure and weighted flux histories are identical in both expressions. Thus \(\Delta\Pi_{1,X}=2F_0\Delta F_1\). The pressure prefix above \(g\) equals the local pressure moment difference plus the three weighted angular prefixes, multiplied by \(2K/r\). Each normalized pressure prefix integral is at most one; each normalized mass prefix integral is at most four. Saturation and the two exact moment identities make \(\Delta M_1\) and \(\Delta\Pi_1\) zero after their respective final bumps. The reconstructed \(\Delta v_1\) follows the mass endpoint and its parameter derivatives. Beyond the last angular bump, every positive-order field difference used by either stress density is zero. The leading fields are the same on both sides of this comparison.

## Exact partial error across the gap before Ipos

For \(g\le X\le X_0\), the two positive-order velocity errors are zero and their mass and pressure errors are fixed local moment errors \(m=\Delta m_0\) and \(p=\Delta m_2\). The original velocity reconstruction gives \(X\Delta v_1=B_m\), where
\[
 B_m=\frac{-2(D+\lambda_1)\eta\,m-dm_\eta}{L},
 \qquad B_p=\frac{-2\eta\,p+dp_\eta}{L}.
\]
In this gap the only axial density terms left are \(B_m U_{0,X}+B_p\). The only weighted angular term is \(2B_m \partial_X(X F_0)\). Thus the exact additions to the two error integrals from \(g\) to \(X\) are
\[
 B_m[U_0(X)-U_0(g)]+(X-g)B_p,\qquad
 2B_m[XF_0(X)-gF_0(g)] .
\]
The original \(m,p\) bounds and Cauchy give \(|B_m|\le2^8gE/\delta\) and \(|B_p|\le2^{12}QgE/\delta\) on \(S_{\delta/16}\). The actual leading values in brackets are retained on the real domain. In particular the long pressure plateau is present explicitly in the axial partial error even though the full signed error cancels.

## Conservative difference in the whole annulus

Set \(u=\Delta U_1,\ f=\Delta F_1,\ v=\Delta v_1,\ p=\Delta\Pi_1\). With original exponents
\[
 c=-A,\quad b=-A-\tfrac12,\quad \gamma=c+\lambda_1,\quad
 \beta=b+\lambda_1 ,
\]
the exact source identities are \(c+\gamma=-1\) and \(c+\beta=b+\gamma=-3/2\). The same source mass equations give
\[
 (Xv_0)_X=-Z_c(U_0),\qquad (Xv)_X=-Z_\gamma(u).
\]
They follow from the original mass reconstruction by differentiating \(M_X=U\), including the commuting \(\eta\) derivative. Using these two identities, the original axial and angular convective groups have the diagonal conservative combinations below. Define
\[
\begin{aligned}
 j_z &=2U_0u+p,&
 j_\theta&=2X(U_0f+u F_0),\\
 B_z&=X(v_0u+v U_0)-2X u_X+(Xu-2\eta X j_z)/L,&
 B_\theta&=2X^2(v_0f+vF_0)-4X^2 f_X+
                   (2X^2 f-2\eta Xj_\theta)/L .
\end{aligned}
\]
The exact error densities of the original formulas are
\[
\begin{aligned}
 \Delta r_z &=
 \partial_X B_z+\frac{-(\gamma+1)u+D\eta u_\eta+d\,\partial_\eta j_z}{L},\\
 2X\Delta(r_\theta/\sqrt{2X}) &=
 \partial_X B_\theta + \frac{-(\beta+2)2Xf+D\eta\,\partial_\eta(2Xf)+
                              \eta j_\theta+d\,\partial_\eta j_\theta}{L}.
\end{aligned}
\]
These equations describe the uncut density before selecting the original zero exterior. All independent leading viscosity terms cancel in the difference. The source replay checks the original time and axial transport terms with their exact \(X\) weights and quadrature parameter.

For the axial formula, the original mass row and weighted flux row give \(\int u=0\) and \(\int j_z=0\). The flux difference uses \(\int(2U_0u-Xp_X)\) from the actual fifth repair. Because \(Xp\) is zero at both ends, ordinary integration by parts gives \(\int j_z\) with the same value. For the angular formula the original \(2Xf\) and \(j_\theta\) rows separately give zero. The equalities are functions of \(\eta\) on a fixed radial interval. Differentiation under the finite integrals uses the stated ordinary fixed-order regularity. The boundary fluxes vanish at the axis by C100 regularity and the powers of \(X\), and they vanish after the last angular bump by the saturated errors. Thus both uncut signed difference integrals from zero to any later radius equal zero.

The C101 local estimates also apply to the prefixes from zero to \(X_{\rm cut}\) or \(X_{\rm minus}\). The lower boundary terms at zero vanish and the taper derivative is zero at both of these upper endpoints. The signed outer errors are the negatives of the corresponding prefixes through \(X_{\rm cut}\), giving \(5gR_*\) and \(9g^2R_*\). The normalized clipped forward difference at every radius after the last angular bump and before the corresponding outer switch equals its uncut prefix from zero to \(X_{\rm minus}\). Thus the corresponding complete signed clipped errors also obey the same two bounds. This retains a definite finite-approximation defect term at the cutoff, which the source replay does not set to zero.

**OPEN**. The uncut difference integrals cancel after the full compensated support. The signed clipped error has a small explicit bound. To bound every pointwise outer stress difference, or its absolute radial integral across the large gaps before Ipos, further bounds on actual leading boundary amplitudes and weighted pressure prefixes are needed. Higher recursive orders and final jets remain open.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation101/y-outer/final"
    $r = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    $n = "$p/hosted-43055678022-N4/original-whole-k-current-pressure-graph"
    $g = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
    node "$d/replay_n1_outer_flux.mjs" $r "$n/original-source-functions.json" "$p/continuation99/y/final" "$p/continuation100/y/final" "$p/continuation101/y-taper/final" "$d/operands-repeat.json"
    python -B "$d/check_n1_outer_flux.py" "$d/operands-repeat.json" "$p/continuation99/y/final" "$p/continuation100/y/final" "$p/continuation101/y-taper/final" $g "$d/receipt-repeat.json"
