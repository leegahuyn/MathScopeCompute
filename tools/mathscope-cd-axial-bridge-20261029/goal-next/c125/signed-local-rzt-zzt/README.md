# Original Signed local stress derivatives RZT and ZZT

**VERIFIED source and exact chain.** The original angular and axial weighted local stress terms enter #21999622 and #22000445 as \(-\varepsilon R^e s^{-\alpha}W(q,X,\eta)\) with \(e=2,1\) and \(\alpha=A+1/2\). The protected source retains the six higher stress arms, their original selectors and the exact six whole moments at the same endpoints. At fixed label put \(a=\partial_T\log s\), \(b=\partial_Z\log s\), \(c=s^{-D}\), \(E=\partial_\eta\), and
\[
 \Lambda=q\partial_q-X\partial_X-D\eta\partial_\eta-\alpha.
\]
The \(RZT\) bracket, after extracting \(-\varepsilon R^{e-1}s^{-\alpha}\), is
\[
 (e+2X\partial_X)(a_Z\Lambda+ab\Lambda^2+ac E\Lambda)W .
\]
The \(ZZT\) bracket, after extracting \(-\varepsilon R^es^{-\alpha}\), is
\[
 [a_{ZZ}\Lambda+(2a_Zb+ab_Z)\Lambda^2+ab^2\Lambda^3
 +2a_ZcE\Lambda+2abc E\Lambda^2+ac^2E^2\Lambda]W.
\]
The exact \(c_Z=-Dbc\) term cancels the \([E,\Lambda]=-DE\) contribution from reordering. The free-jet expansions contain 49 and 90 monomials. Every positive \(q\)-Euler term retains the original \(q^{2nh}\) and \(\chi(b_nq)\). Its third derivative includes the genuine \((b_nq)^3\chi'''(b_nq)\) term. Removing any of the six \(ZZT\) groups changes the symbolic polynomial.

**CONDITIONAL donor caps.** The same C106 leading regular profiles and C107 middle exact raw profiles, fixed reflected primitives and source cutoff envelopes supply these directions. The inner collar \(0<u\le1/128\) has only the leading stress. The outer collar \(0<d\le1/32\) also retains the order-one angular backward integral. Its C107 bound holds for all mixed \(d,\eta\) orders through six and uses the unchanged whole zero moment through the same fixed radial endpoints. Third differentiation uses at most three hits of the nearest radial Gaussian. The middle uses the original C8 raw profile and finite Euler bounds and the original \(2^{30720}\) complement Gaussian restoration. With fixed original label, admitted chart and smooth trace premises, each new direction is bounded by \(\varepsilon\zeta\) times a coefficient of log at most \(H/2^{252}\), with band degree zero and nearest-face poles 9 inner, 12 outer and zero middle.

**OPEN** independently assembling these local operands with the centered pressure and remaining mean and covariance terms of the full Signed source. Final jets 0/67. RELEASE HOLD.

~~~text
python -B verify_signed_local_rzt_zzt.py --goal GOAL_NEXT --demand C125_SIGMA_DEPENDENCIES --out signed-local-rzt-zzt.json
~~~
