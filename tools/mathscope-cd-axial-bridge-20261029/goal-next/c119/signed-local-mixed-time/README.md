# Original mixed native-time derivatives of the local Signed stress

The original local weighted stress terms in the two residuals #21999622 and #22000445 are $-\varepsilon R^e s^{-\alpha} W(q,X,\eta)$, with $\alpha=A+1/2$ and $e=2,1$. At fixed source label, set $a=\partial_T\log s$, $b=\partial_Z\log s$ and
$\Lambda=q\partial_q-X\partial_X-D\eta\partial_\eta-\alpha$.
The original chart gives $a_R=0$ and $\eta_Z=s^{-D}-D\eta b$. Apply $\partial_R$ and $\partial_Z$ to the differentiated stress while retaining the physical multiplier. The two bracketed terms are

$$
\begin{aligned}
\partial_{RT}:&\quad e\Lambda W+2X\partial_X\Lambda W,\\
\partial_{ZT}:&\quad a_Z\Lambda W+ab\,\Lambda^2W+a s^{-D}\partial_\eta\Lambda W.
\end{aligned}
$$

The factored prefactors are $-a\varepsilon R^{e-1}s^{-\alpha}$ and $-\varepsilon R^e s^{-\alpha}$, respectively. The independent free-jet calculation checks the exact $\eta$ commutator $[\partial_\eta,\Lambda]W=-D\partial_\eta W$. It also checks the second logarithmic derivative of the original positive order weight $\chi(\sigma)q^{2nh}$, where $\sigma=b_nq$. Its terms are $(2nh)^2\chi+(4nh+1)\sigma\chi'+\sigma^2\chi''$ with $q^{2nh}$ retained. Removing the commutator, $a_Z$, the radial multiplier derivative, or $\chi''$ changes the polynomial.

**CONDITIONAL.** Two differentiations fit the original C107 admissible local source profile orders and the original C102 joint implicit chart. The reflected primitives and flat guard branches remain those of the same original stresses. A second derivative of the radial Gaussian contributes at most three additional powers of the radial logarithmic distance, on top of the first derivative. The two mixed native derivatives are bounded by $\varepsilon\zeta$ times at most the sixth and ninth pole on the inner and outer collar, with coefficient log at most $H/2^{253}$. The middle has no pole. This bounds the local stress branches of the early Signed source under the original ordinary smoothness and chart hypotheses.

~~~text
python -B verify_signed_local_mixed_time.py --goal GOAL_NEXT --out FRESH.json
~~~
