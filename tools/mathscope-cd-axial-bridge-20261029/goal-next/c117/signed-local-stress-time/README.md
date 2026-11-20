# Original first native-time derivative of the local Signed stress

**VERIFIED source and symbolic chain.** In the original weighted radial residuals #21999622 and #22000445, the local stress part is $-\varepsilon R^e s^{-A-1/2} W(q,X,\eta)$ with $e=2$ for the angular component and $e=1$ for the axial component. The source readback retains the same leading slots #32017/#32018 and all six positive guarded stress rows. In the fixed label chart, $R,Q,\varepsilon$ are constant under $T$, $q=Qs$, $X=R^2/(2s)$, and $\eta=Z/s^D$. The original inverse interval and monotonicity give $0<s_T/s\le4$. At fixed $R,Z$ the factor multiplying $-\varepsilon R^e s^{-A-1/2}(s_T/s)$ is

$$
(q\partial_q-X\partial_X-D\eta\partial_\eta-A-1/2) W.
$$

For positive order $n$, $q\partial_q$ contributes $q^{2nh}[(b_nq)\chi'(b_nq)+2nh\chi(b_nq)]$ with the exact fixed $b_n$. Omitting the scaling drift, the actual eta derivative, or the cutoff derivative changes the free symbolic polynomial. This rule differentiates the physical pullback of the same stress before the subsequent pressure and moment operations.

**CONDITIONAL weighted local bound.** The original narrow inner collar includes the leading stress only. There $X\partial_X=t_1^{-1}\partial_u$ and a first derivative adds at most three powers of $u^{-1}$ to the C107 Gaussian estimate. The narrow outer collar has the same leading contribution plus the original order-one angular backward primitive. There $X\partial_X=-\partial_d$. The exact earlier profile bound covers both one more radial derivative and the first one-sided eta derivative, so the largest pole is $d^{-6}$. The outer endpoint and the whole moment in the backward formula remain fixed at differentiation. The middle uses the actual raw mixed derivatives of the twelve profiles, one original Euler cutoff derivative and the same complement restoration of $\zeta$. Those inputs also give equality of the inherited flat joins after the first physical derivative. An additional conservative $2^{16384}B_{\rm norm}^{32}$ finite coefficient charge fits under $\exp(H/2^{256})$ in the original hierarchy. Together with C107 the conditional log cap is $H/2^{254}$, with one factor $\varepsilon\zeta$.

The receipt supplies the two local radial stress branches to a first $T$ derivative of the whole Signed source. Mixed higher time derivatives, the other pressure/covariance/mean branches, the complete second correction and the final 67 jets remain open.

~~~text
python -B verify_signed_local_time_stress.py --goal GOAL_NEXT --runtime ORIGINAL_NAVIER_DIRECTORY --out FRESH.json
~~~
