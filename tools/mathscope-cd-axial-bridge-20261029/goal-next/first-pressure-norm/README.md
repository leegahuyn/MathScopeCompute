# Low-order bounds for the actual first corrected shifted pressure and Temporal potential

This is an exact operator estimate on the authenticated corrected first-cycle graph from GitHub Actions run 43010593847. The code rereads the two actual \(T_0\) bodies and the actual \(T_1\) realization, including stage-specific pressure normalization, the original radial shifts, and their formal-to-actual arguments. It uses the existing exact exterior proof for these same sources. It does not replace the actual raw radial forcing by an arbitrary family with a supplied estimate.

Let \(R_i=\sqrt{X_a}\), \(R_o=2\sqrt{X_b}\) and \(M=\max(1,R_o,R_i^{-1})\). Norms are the maximum absolute value of every ordinary partial of order at most \(m\) in \(R,Z,T,Y_0,Y_1\), with reference \(\ell\) held fixed and the original admitted chart and common torus. The estimates below apply to \(m=0,1,2\), assuming the displayed input norm is finite and the ordinary derivatives through the given order exist on the shell. Their constants are uniform in the original admitted reference band. Axis and exterior values use the established zero extensions.

| Actual output | \(m=0\) | \(m=1\) | \(m=2\) | Input seminorm |
| --- | ---: | ---: | ---: | --- |
| Normalized mean pressure difference | \(2^{17}M^2\) | \(2^{44}M^3\) | \(2^{76}M^4\) | \(\|g_{r,\mathrm{final}}-g_{r,J_0}\|_{C^m}\) |
| Actual Temporal meridional potential | \(2^3M^3\) | \(2^{21}M^4\) | \(2^{41}M^5\) | \(\|\gamma_d\|_{C^m}\) for the actual normalized desired axial inverse velocity |

The source operands in the first row are \(\#4455275-\#3614891\). This is the normalized **mean** component. The angular pressure has its separate actual indexed source fields. The second row is the actual \(T_1\) gauge \(\#4454155\), with its axial source \(\gamma_d=-c_{i_0}^{-1}N^{-1}E_z^\circ\), the actual cutoff term, and the radial division retained.

## Uniform original radial shift

The source phase is \(\Phi(R)=\Lambda_g^{i_0}(\sqrt Q R)^{d_r}\). Here \(Q=2^{-\ell}\), \(T_g=4+\sqrt2\), \(\Lambda_g=4-\sqrt2\), \(\rho_g=\log\Lambda_g/\log T_g\), and \(d_r=2((1+h)\rho_g-h/100000)\). Write \(i_0=x-\delta\) where \(x=((1+h)(\ell-2)\log2-2\log(\ell-2))/\log T_g\) and \(0\le\delta<1\). The exact floor/exponent identity is
\[
 \Phi(R)=\Lambda_g^{-\delta} 2^{-2(1+h)\rho_g}(\ell-2)^{-2\rho_g}
             Q^{h/100000}R^{d_r}.
\]
Its coefficient is positive and at most 1. The comparisons \(\Lambda_g^2>T_g\) and \(\Lambda_g^3<T_g^2\) follow by squaring \(14>9\sqrt2\) and \(70<58\sqrt2\). They give \(1/2<\rho_g<2/3\), and \(0<h<1/64\) gives \(1<d_r<3/2\). Thus \(|\Phi'|\le2M\) and \(|\Phi''|\le M\) on the source shell. There is no \(q\) or \(|\log q|\) loss from this radial phase.

The original fixed norm parameter \(R_*=\mathrm{C12EnvelopeR}\) dominates \(M\). For \(L_c=\log CSelected\) and original large time parameter \(T_*\), the source tree gives \(L_c>800T_*\), \(R_*=\exp(\exp(25600000L_c))\), \(h=\exp(-8002T_*)\), and \(\lambda=\exp(-1000T_*)\). The initial radius is \(R_i^{-1}=Q_{\rm source}^{32}/2\) and \(\log Q_{\rm source}<L_c\). The terminal tree has \(\log X_b=\log X_R+3+\#218+\#280\) and \(\#218=132+90001T_*+13/\lambda-4\log h\). For its logarithmic correction \(\#280\), the checked numerator \(\#259\) is at most \(2(4+32008T_*+3)<100000T_*\). This uses \(0\le\sigma\le1\) in the positive compact integrals and \(e<3\). The checked denominator \(\#275\) is at least \(h/256\), by \(\int_1^3\sigma'((u-1)/2)\,du/2=1\), the positive exponential factor at least 1, and \(1-h/256<1\). Therefore \(\#280<16200T_*\). Using \(T_*>10\), \(\lambda^{-1}<h^{-1}\), and the exact \(\log X_R=\log110+10L_c+20T_*\) yields \(\log X_b<200L_c+13/h\). The positive exponential series then gives \(\log R_o<\log R_*\). This uses the actual terminal annulus upper endpoint and the actual original fixed normalization constants, without evaluating the nested exponentials numerically.

## Cutoff and normalized mass

The actual mean patch coordinate is \(b=10(R/(x_0\sqrt s)-1)\), \(x_0=\sqrt{2X_{0,I_{\rm mean}}}\exp(1/2)>1\). For the original implicit equation \(s-Z^2s^{2h}-T=0\), \(F_s=1-2h\eta^2>1/2\), \(|Z|<2\), \(s\in[1/2,2]\). The first derivatives in \(Z,T\) have bound 16. The second derivatives have bound \(2(4+16+256)=552\) using \(|F_{ZZ}|\le4\), \(|F_{sZ}|\le1/2\) and \(|F_{ss}|\le1\). On the active patch \(0\le b\le1\), the corresponding first and second derivatives of \(b\), including the \(R\) derivatives, are bounded by \(2^8\) and \(2^{15}\).

The step is the original square-seed step \(\sigma(u)=a(u)/(a(u)+a(1-u))\) with \(a(u)=\exp(-1/u^2)\) for \(u>0\) and its flat zero extension. On \([0,1]\), \(\|a'\|\le4\) and \(\|a''\|\le36\) follow from \(x^k e^{-x}\le k!\). The denominator is at least \(e^{-4}>1/81\). The derivative numerator after quotient simplification is \((1-\sigma)a'(u)+\sigma a'(1-u)\), so \(0\le\sigma'\le324\). Differentiating the quotient identity once more gives \(|\sigma''|\le81(108+16\cdot324)\). Hence the actual \(\chi=\sigma(b)\) has derivative bounds \(2^{17}\) and \(2^{36}\). Outside the transition, all positive-order derivatives vanish.

The normalizer \(\rho(R)\) is the actual compact bump divided by its original full-annulus mass. Substituting \(u=b\) proves that mass is \(\frac1{10}\int_0^1 e^{-1/(u(1-u))}\,du\), independent of \(Z,T\). Restrict to \([1/4,3/4]\) to bound its reciprocal by \(20\cdot3^6\). The compact numerator seed splits into \(\exp(-1/u)\exp(-1/(1-u))\). Its first and second derivatives have bounds 4 and 80 by the same factorial argument. The prefactor \((x_0\sqrt s)^{-1}\) has \(C^0,C^1,C^2\) bounds \(2,32,3584\). Leibniz and the exact chain rule give \(\|\rho\|_{C^m}\le2^{15},2^{25},2^{38}\), respectively. This denominator is the actual common mass of both stage-specific pressure normalizers.

## Differentiated actual integrals

At each fixed \(r\), the actual shifted integrand for input \(f\) is \(g(r,R,Z,T,Y)=f(r,Z,T,Y+(\Phi(r)-\Phi(R))v_r)\). The original radial torus vector has \(\ell^1\) norm \(\sqrt2<2\). Thus the maximum first and second derivative bounds in the external variables of \(g\) are \(4M\|f\|_{C^1}\) and \(18M^2\|f\|_{C^2}\). In the second derivative estimate the terms \(-\Phi''L f\) and \((\Phi')^2L^2f\) are both retained. At the moving endpoint \(r=R\), \(g(R,R)=f(R)\) exactly. Differentiating the partial twice in \(R\) gives \(f_R(R)+g_R(R,R)+\int g_{RR}\), so the bound includes both endpoint terms. The resulting partial-integral constants are \((1,5,23)\) and the whole-integral constants \((1,4,18)\), multiplying \(M^{m+1}\|f\|_{C^m}\). Product differentiation of the exact subtraction \(\chi\) times the whole gives \(\|T_0 f\|_{C^m}\le (2,2^{18},2^{37})_m M^{m+1}\|f\|_{C^m}\).

For the actual pressure difference set \(f=\Delta g_r-\rho\Delta P\). The bound \(\|\Delta P\|_{C^m(Z,T)}\le M\|\Delta g_r\|_{C^m}\) uses the original normalized two-torus Haar mass one and the same full radial interval. Applying the checked \(\rho\) bounds gives the first table row. For the actual meridional potential use \(\psi=R^{-1}T_0(R\gamma_d)\). Both multipliers are estimated through order two on the shell, using \(3M\) for \(R\) and \(j!M^{j+1}\) for the \(j\)-th derivative of \(R^{-1}\). This gives the second table row, including the exact original cutoff subtraction.

The \(C^2\) pressure and potential transfer factors fit the first cutoff budget \(2^a B_*^b h^{-c}W^d\), since \(M\le R_*\) and the original \(B_*\ge R_*^{4096}\). These estimates still require the actual uniform weighted seminorms of \(\#4455275-\#3614891\) and of the desired inverse axial velocity. The [third-order extension](../first-pressure-norm-c3/README.md) gives the corresponding \(C^3\) transfers and separates the input derivatives required by the realized velocities. The angular wave pressure norms, the common Cartesian correction norm, the actual first \(C,P\) selectors, and final jets remain open. RELEASE HOLD.

Reproduce from the evidence package with the pinned repository and the extracted GitHub graph.

    python first-pressure-norm/check_first_pressure_norm.py --repo <repository> --artifact <extracted-run-43010593847> --pressure-receipt pressure-exterior/corrected-pressure-exterior.json --out first-pressure-norm.json

