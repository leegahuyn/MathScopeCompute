# Geometry of the original first Forced source

## VERIFIED

The replay authenticated 22,155,584 original source nodes and identified every one of the 121 non-field coefficient roots in the twenty first Forced systems. It tested 22 shapes per mode-one chart and seven per mode-two chart. The exact comparisons use the source \(\sqrt2\) relation and preserve each chart's five possible integer palette levels, frozen representatives and original pulse lift.

In the code, \(w\) is the mapped pulse endpoint, \(\delta\) is the fixed palette level, \(C_F\) is the admitted common \(F,G\) slow norm, and \(\omega=pF+p_zG\). The source geometry includes

\[
n_r=x_0-w\omega_R,\qquad n_\theta=p/R,\qquad
n_z=p_z-\varepsilon w\omega_Z,\qquad
D_t\phi=-\omega+\varepsilon w\omega_T.
\]

The actual radial-fast coefficient and its derivative are \(a/\Lambda^\delta\) and \((d_r-1)a/(R\Lambda^\delta)\). The time coefficient is \(c_i/T_g^\delta\). The exact table keeps the affine \(\partial_{Y_i}v\) factors that appear in the ungrouped radial phase terms. The reference mean factors are \(\mathcal R^{-1/2}\), \(\mathcal R^{-D}\) and \(\mathcal R^{-A}\) for \(\mathcal R=Q_{\rm ref}/Q_{\rm own}\).

For all sixty mode-one raw real and imaginary scalars, the replay extracts the carrier-time term and carrier-linear mean products. With \(U\) the normalized Primary velocity and \(M\) the whole initialized mean rescaled from the reference chart, the exact block is

\[
i k\big[(D_t\phi+n\cdot M)U+(n\cdot U)M\big].
\]

The actual reference arguments are \((R/\sqrt{\mathcal R},Z/\mathcal R^D,T/\mathcal R,\ell_{\rm ref},Y_0,Y_1)\). On the common physical chart, \(s_{\rm ref}=s_{\rm own}/\mathcal R\) follows by inserting this value into the original monotone equation. The two charts therefore have identical \(X,\eta,q\). In particular, the actual cutoff weights, including those in background \(b\), are evaluated at the same physical \(q\). The source powers of \(\mathcal R\) exactly send the rescaled reference background to \((b,RF,G)\), including the original \(\varepsilon s^{-1/2}\) multiplier of \(b\).

Writing \(M=(b,RF,G)+\Delta\), the resulting phase remainder is

\[
D_t\phi+n\cdot M
=b n_r+\varepsilon w(\omega_T-G\omega_Z)+n\cdot\Delta .
\]

C91 supplies the exact same-body minimum \(\varepsilon\) exponents \(199994/100000\) in the beta ledger and \(99999/100000\) in each remaining component of \(\Delta\). The remaining carrier coefficient has no sign. In the other conservative term, the real part of \(n\cdot U\) vanishes by the original full-curl tangency. Its imaginary part retains the explicit \(k^{-1}\), so multiplying it by \(k\) loses no power of \(\varepsilon\).

An independent rational check counts the 360 reassociated mode-one terms and checks every other original raw monomial against its geometry and C91 field grades. It uses \(k^{-1}\le\sqrt\varepsilon\) for the field envelopes and \(k\le2\varepsilon^{-1/2}\) for geometry. The minimum \(\varepsilon\) exponent is \(49999/100000\) in the remaining mean–velocity terms and \(1/2\) in the remaining pressure, tail, linear velocity, and pure mode-two terms. The reassociated eikonal part has exponent at least \(99999/100000\). The independent conservative part has exponent at least \(49999/100000\), allowing for one transverse radial-fast factor in the imaginary velocity. These grades retain the explicit powers of \(S\) and the radial poles. The field norms that multiply them remain conditional.

## CONDITIONAL NUMERICAL CAPS

Fix the source cone, the actual endpoint path \(H_w\), the original positive radial interval and the original directed slab \(q_{\rm Big}/64\le q<q_{\rm Big}/16\). For all coefficients and all four needed \(R,Z\) derivative orders the JSON gives a sum of bounds of the form

\[
2^{20}B_{\rm norm}^{12}C_F\, S^{s-b\rho_g}\varepsilon^e k^a,
\]

with \(C_F\ge1\), where each \((s,e,a,b)\) is listed by actual coefficient. Positive \(L\) derivatives of these grouped coefficients vanish at fixed \(w\). \(F,G\) jets through six suffice for this geometry, since the largest original derivative inside a coefficient is \(\omega_{RR}\) or \(\omega_{ZZ}\). The adverse \(S^1\) in \(w\) and in \(\partial_{Y_i}v\) is retained. The time phase table keeps its \(S^0\) term and its \(\varepsilon S\) term separately. The pressure and diffusion geometry keep \(k\) explicit. The original bound \(k\le2\varepsilon^{-1/2}\) can be applied after combining it with the field powers.

The original directed C10 receipt supplies \(\log C_F\le H/2^{128}\), with \(H=-h\log\tau_0\), on the stated slab. The source threshold gives \(H>B_{\rm norm}^{511}/2\) and \(B_{\rm norm}\ge2^{128}\). Exact integer inequalities then bound the source-only logarithm of one geometry factor by \(H/2^{127}\). The largest product of non-field coefficients contains four factors in mode one and two in mode two. Including the exact positive raw coefficients and four derivative distributions gives logarithm below \(H/2^{124}\), with the explicit scale powers and field norms still separated.

Using \(A=2B_{\rm norm}^5 C_F\) in the C89 frame ledger, every required matrix, projection and moving basis derivative through four has a source-only logarithmic bound \(H/2^{123}\). The exact C90 ordered coefficients use \(A\) through power 73 and the original propagator through power five. The combined matrix and basis logarithm before the propagator, pulse mass and label powers is below \(H/2^{121}\). Including the propagator gives \(H/2^{24}\) before applying the mass and label factors. These budgets use the original radius, covariance and propagator premises and the same physical threshold \(H\).

## OPEN

The coefficient maxima require the same admitted source chart and ordinary derivatives. The strict directed logarithmic comparison is local to the original slab. The signed complete eikonal after the leading transport cancellation still contains \(b\), the derivative combination \(\omega_T-G\omega_Z\) and the complete \(\Delta\), together with the independent conservative remainder. The same-weight numerical field norms, remaining pressure and nonlinear correction intervals, N7-06 energy, N8-05 convergence and final jets require separate evidence. `jets 0/67`, `RELEASE HOLD`.

## Replay

```text
python -B verify_geometry.py --goal GOAL --artifact HOSTED --cache C80_CACHE --primary C91_PRIMARY_JSON --out NEW_JSON
python -B verify_epsilon_grades.py --factor C90_FACTOR_JSON --geometry NEW_JSON --primary C91_PRIMARY_JSON --out NEW_GRADE_JSON
```
