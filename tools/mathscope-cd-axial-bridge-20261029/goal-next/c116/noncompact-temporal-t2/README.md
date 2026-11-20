# Noncompact Temporal through two native time derivatives

**VERIFIED original time transfer and exact derivative composition.** The source \(\beta,v,\gamma\) are the output of the first Temporal step before the compact FiveMap increment. The replay checks all 36 ordinary \((R,Z,T,L)\) requests with \(r+z+l\le1\), \(t\le2\). This includes all twelve directions with two time derivatives and the Signed axial pressure input \(\beta_{ZTT}\). The 297 distinct Primary covariance directions used by the whole and collar recurrences have ordinary slow order at most six, time order at most two and transverse \(L\) order at most four. They are inside the same original C98 RZT/L range. The actual Fourier input uses the two centered sources #17754253 and #17754268, with the pair \((f,L^2f)\) and the original multiplier estimate.

## Moving shell and fixed integration bounds

The native shifted integral substitutes \(r\) for \(R\) and \(Y+(\Phi(r)-\Phi(R))v_r\) for \(Y\). The original shift, \(v_r\), and the two whole-path endpoints #17743711 and #17743713 are fixed under \(T\). The left primitive endpoint \(R\) is also fixed in this partial derivative. Both \(T\) derivatives commute with each integral and with the fixed-label directional inverse. On the middle retain the exact Leibniz derivatives of \(\chi\) and the \(\chi_R J/R\) correction in \(\gamma\). The finite differentiated inverse uses the same zero-mean Green multiplier and Gaussian, which is independent of the auxiliary torus.

On the narrow collars the native cutoff \(\chi\) is constant 0 or 1, and \(\rho,\chi_R\) and their local jets vanish. Thus after time differentiation the shifted \(I-\chi J\) is the left short primitive at \(u=\log(X/X_a)/t_1\le1/128\), or the negative right short primitive at \(d=\log(X_b/X)\le1/32\). This does use the actual movement of the support since \(s=s(Z,T)\). The shell endpoints are \(R_a=\sqrt{2sX_a}\), \(R_b=\sqrt{2sX_b}\). With a moving lower endpoint \(a(T)\), the second Leibniz correction is
\[
 -2a_T f_T(a,T)-a_T^2 f_R(a,T)-a_{TT}f(a,T).
\]
The upper endpoint has the same terms with positive signs. Here \(f\) includes the full shifted integrand and \(f_R\) means differentiation in its integration variable. The original flat Gaussian collar and the fixed shift give zero traces for these terms. The exact polynomial control \(f=1,\ a=T^2\) gives correction \(-2\) when flatness is absent. Thus a moving endpoint generally cannot be discarded. For the original problem one may differentiate the fixed whole/left integrals first, then shorten, which avoids moving-face derivatives entirely.

The original short integrals use radial Jacobians \(t_1R/2\) and \(R/2\) in \(u,d\). They keep both Gaussian factors in \(\zeta\) and gain three poles at every pure value integration. The largest new input pole at a shortening step is 24 inner or 27 outer, inside the checked range of 512. Radial differentiation still has the exact FTC shift term \(-a_{\rm rad}L\mathcal T_\chi f\) alongside the endpoint. Centering removes the torus-independent pressure \(\rho P\) in the Temporal inverse. This establishes ordinary weighted traces under the original flat source realization.

## Conditional output caps

Each collar row keeps one full \(\zeta\). The pure time requests \(\beta_{TT},v_{TT},\gamma_{TT}\) have band powers \(33/2,21/2,27/2\) and poles 15 inner and 18 outer. The \(\beta_{ZTT}\) row has band power \(39/2\) and poles 18 and 21. The actual collar epsilon grades for the pure time rows are respectively \(199999/100000,99999/100000,99999/100000\). Taking all 36 rows and the middle jointly gives grades \(99999/50000,99999/100000,49999/50000\). The log cap is \(H/2^{113}\) under the same C98 admitted Primary and source geometric constants. The middle keeps both actual fixed intervals and the complete \(\chi_R\) terms. Restoring one Gaussian there uses the original positive complementary weight bound \(\zeta^{-1}<2^{30720}\). The recorded whole-path band powers are unchanged by this restoration.

The packet supplies the noncompact Temporal part of the Signed time mean. The compact FiveMap time moments and their own derivatives, full Signed and Repeat time estimates, and final jet comparisons remain open. The final count stays 0/67 and release remains HOLD.

~~~text
python -B verify_temporal_t2.py --work WORK --goal GOAL_NEXT --runtime ORIGINAL_NAVIER_DIRECTORY --out temporal-t2.json
~~~
