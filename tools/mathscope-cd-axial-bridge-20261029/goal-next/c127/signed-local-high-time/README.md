# Four higher local Signed stress derivatives

**VERIFIED source and chain.** The original local weighted radial stresses feed #21999622 and #22000445. Both retain the six actual positive arms, their cutoff selectors, the six fixed whole zero moments and the angular order-one backward primitive. The C125 \(RZT\) and \(ZZT\) polynomials reproduce exactly before extending the recurrence.

Write \(a=\partial_T\log s\), \(b=\partial_Z\log s\), \(c=s^{-D}\), \(E=\partial_\eta\), and \(\Lambda=q\partial_q-X\partial_X-D\eta\partial_\eta-(A+1/2)\). After removing \(-\varepsilon R^e s^{-A-1/2}\), the original \(T\) derivative starts at \(a\Lambda W\). For each further \(Z\) derivative, write the normal-ordered terms as \(c^jP_{p,j}E^j\Lambda^p W\). The next coefficient table independently collects \(\partial_ZP_{p,j}\), \(bP_{p,j}\) shifted in \(p\), and \(P_{p,j}\) shifted in \(j\). The factor derivative \(c_Z=-Dbc\) cancels the commutator contribution \(jDbc^j\). The one \(R\) derivative is the original \(e+2X\partial_X\) bracket with the radial prefactor lowered to \(R^{e-1}\). Direct free-jet and normal-ordered calculations agree for every row.

The original cutoff derivative signs and weights are retained as positive-order source inputs before any estimates. The highest \(q\)-Euler slot in \(Z^4T\) includes \((b_nq)^5\chi^{(5)}(b_nq)\) with its original \(q^{2nh}\). Exact repeated Euler differentiation agrees with the independent Stirling-number expansion through order five.

| Native derivative | Free-jet terms | Highest cutoff Euler order | Inner pole | Outer pole |
| --- | --- | --- | --- | --- |
| \(Z^3T\) | 295 | 4 | 12 | 15 |
| \(Z^4T\) | 849 | 5 | 15 | 18 |
| \(RZ^2T\) | 200 | 3 | 12 | 15 |
| \(RZ^3T\) | 653 | 4 | 15 | 18 |

**CONDITIONAL caps.** Each row is bounded by \(\varepsilon\zeta\) with band degree zero, coefficient logarithm at most \(H/2^{252}\), and the displayed nearest-collar pole. The middle has pole zero. The largest actual terminal mixed \(d,\eta\) request is five, within the original C107 six-derivative cap. The same C107 twelve raw positive profiles through C8 cover the middle, including their two original viscosity derivatives and \(2^{30720}\) Gaussian restoration. Both C106 regular leading collars are independently pinned. The six whole moments and fixed endpoints remain necessary for the reflected primitive. The \(n=1\) angular cutoff is on its original unit plateau on this early slab, and all \(n\ge4\) original scalar cutoff jets are zero there. The bounds assume the original admitted chart, flat extensions, analytic realization and one-sided original profile derivatives at the prescribed endpoints.

**OPEN** the quantitative pressure, covariance and mean inputs for the complete higher Signed targets. Final jets 0/67. RELEASE HOLD.

~~~text
python -B verify_signed_local_high_time.py --goal GOAL_NEXT --dependencies C127_DEPENDENCIES --prior-local C125_LOCAL_STRESS --out signed-local-high-time.json
~~~
