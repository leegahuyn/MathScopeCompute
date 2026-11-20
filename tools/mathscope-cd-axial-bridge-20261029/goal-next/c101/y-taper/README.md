# Original N1 taper trace and local forward-stress errors

**VERIFIED**. Nine exact rational source identities bind the radial drift, diffusion, product derivatives and taper derivative in the original N1 angular and axial source. The original axial integrand is #117047. Its original estimates below use the interval \(X_{\rm minus}\le X\le X_{\rm cut}\), with actual source thresholds #28814, #28819 and #28823 inside the registered raw domain. The taper is independent of \(\eta\), and its step is the original squared-flat step. Each recorded cleared numerator is zero.

**CONDITIONAL** on the C100 coherent ordinary fields, the original local leading restriction and C55 bounds, and ordinary integration. Write \(g=X_{\rm cut}\), \(E=2^{73}Q^{-77}\), \(R_*=2^{46}Q^{-19}\). The normalized forward axial error \(\sqrt{2X}\,\Delta T_z\) and angular error \(2X\,\Delta T_\theta\) have an explicit single taper trace each. Subtracting those traces leaves uniform bounds \(5gR_*\) and \(9g^2R_*\), respectively. The full errors integrated in real \(X\) over the active taper are at most \(3gE\) and \(5g^2E\). These bounds hold uniformly for \(\eta\) in the open strip \(S_{\delta/16}\). The approximation uses the same C100 pressure primitive, source leading histories and local cutoff.

## Exact endpoint reduction

Use \(\Delta=\text{original}-\text{finite}\). Let \(e_U,e_F\) be the raw velocity errors, \(u,f\) their tapered errors, and \(p=\Delta\Pi_1\). Up to the source endpoint \(g\), \(u=\kappa e_U\), \(f=\kappa e_F\) with the actual taper. Let
\[
 B=1/L+v_0-2\eta U_0/L,\qquad
 u_t=\frac{\log(X/X_a)-t_1/64}{t_1/64}.
\]
The exact taper rule is \(X\kappa_X=-(64/t_1)\sigma'(u_t)\).

The axial radial drift in the original residual is \(X B u_X\), and the angular drift in \(r_\theta/\sqrt{2X}\) is \(X B f_X\). The remaining density terms \(Z_0\) and \(\Theta_0\) use the field, the parameter derivative, the radial velocity error, or the pressure error. Their pressure term has the original \(p_X=2F_0 f\), valid on both sides of \(X_{\rm keep}\) by C100's pressure construction and the same leading history. With \(a=X_{\rm minus}\), exact integration gives
\[
\begin{aligned}
\int_a^X \Delta r_z &=
 [-2x u_x+x B u]_a^X + \int_a^X [ Z_0-(xB)_x u]\,dx,\\
\int_a^X 2x\Delta(r_\theta/\sqrt{2x}) &=
 [-4x^2 f_x+2x^2 B f]_a^X
 + \int_a^X [2x\Theta_0-(2x^2B)_x f]\,dx.
\end{aligned}
\]
In the first line the original radial diffusion is \(-2(xu_x)_x\). In the second, its weighted form is \(-4(x^2f_x)_x\). The exact lower boundary terms remain present. The original forward primitives are negatives of these integrals after dividing by \(\sqrt{2X}\) and \(2X\), respectively. At \(a\), \(\sigma'(u_t)=0\) since \(a<X_{\rm keep}\). Therefore the only terms proportional to \(t_1^{-1}\) are
\[
 C_z(X)=-128\,\sigma'(u_t)e_U(X)/t_1,\qquad
 C_\theta(X)=-256\,X\,\sigma'(u_t)e_F(X)/t_1.
\]
They vanish outside the active taper.

## Uniform remainders and integration through the narrow taper

On the original local domain, \(0<X\le g<5Q^{-64}\) and \(Qg<1\). Use \(\|u\|,\|f\|,\|p\|\le E\) on \(S_{\delta/8}\), and \(\|e_{U,X}\|,\|e_{F,X}\|\le R_*\) on \(S_{\delta/16}\). Cauchy gives pure \(\eta\) first derivatives bounded by \(16E/\delta\). The reconstructed \(v_1\) error is at most \(2^8E/\delta\), by C99 value transfer with the C100 error. Directly from the same leading field bounds,
\[
 |B|\le2^{10}/\delta,\quad |X B_X|\le2^{10}/\delta,\quad
 |(XB)_X|\le2^{11}/\delta,\quad
 |(2X^2B)_X|\le 2^{13}X/\delta.
\]
The finite arithmetic checker bounds the nondiffusive axial integrand after integration by parts by \(2^{14} E/\delta\), and the angular one by \(2^{18}XQ^2 E/\delta\). The convective boundary contributions at both ends cost at most \(2^{11}gE/\delta\) and \(2^{12}g^2 E/\delta\). The smooth parts of the diffusion boundaries cost \(4g R_*\) and \(8g^2 R_*\). Since \(\delta^{-1}<Q^2\), \(Q>2^{260}\), the nondiffusive and convective terms fit one more \(g R_*\) or \(g^2 R_*\). This gives the two stated uniform bounds with the explicit traces subtracted.

The exact Jacobian \(dX=X(t_1/64)\,du_t\) and \(\int_0^1\sigma'(u_t)du_t=1\) give \(\|C_z\|_{L^1(X_{\rm keep},g)}\le2gE\) and \(\|C_\theta\|_{L^1(X_{\rm keep},g)}\le4g^2E\). The taper length is at most \(gt_1/64\). With \(t_1\le Q^{-120}\), multiplying the uniform remainders by the taper length adds at most \(gE\) and \(g^2E\). The full errors across the entire local interval are bounded in \(L^1\) by \(5g^2R_*+2gE\) and \(9g^3R_*+4g^2E\).

At the taper midpoint the original step has \(\sigma'(1/2)=8\). A generic constant raw error leaves the exact axial multiplier \(-1024/t_1\), and the angular multiplier \(-2048X/t_1\). This checks the necessity of retaining the pointwise taper trace. For a separate sufficient depth estimate, \(N\) whole-collar Picard terms give the raw value tail \(E_N\le2^{27}Q^{-25-25N}\). Since \(t_1=C_{\rm Selected}^{-120}\) and \(g>4Q^{-64}\), both pointwise traces then fit \(gR_*\) and \(g^2R_*\) if
\[
 N\ge 3+\left\lceil\frac{24\log C_{\rm Selected}}{5\log Q}\right\rceil.
\]
This is an exact symbolic sufficient depth. The replay evaluates the two-term local bounds and the arithmetic comparison for the depth formula.

**OPEN**. Pointwise unscaled taper values at the original two-term accuracy require either explicit evaluation of the retained trace or a stronger raw pointwise tail. The full stress beyond \(X_{\rm cut}\), its other weighted histories, higher orders and final jets are still open.

## Replay

    $p = 'work/goal-next'
    $d = "$p/continuation101/y-taper/final"
    $r = "$p/continuation30/forced-probe/runtime/research-ide/mathscope-m2/navier"
    $n = "$p/hosted-43055678022-N4/original-whole-k-current-pressure-graph"
    $g = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next'
    node "$d/replay_n1_taper_flux.mjs" $r "$n/original-source-functions.json" "$p/continuation99/y/final" "$p/continuation100/y/final" "$d/operands-repeat.json"
    python -B "$d/check_n1_taper_flux.py" "$d/operands-repeat.json" "$p/continuation100/y/final" "$p/continuation99/y/final" $g "$d/receipt-repeat.json"
