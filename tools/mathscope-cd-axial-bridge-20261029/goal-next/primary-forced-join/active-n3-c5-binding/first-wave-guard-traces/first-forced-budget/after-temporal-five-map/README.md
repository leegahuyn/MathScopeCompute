# Actual post-Temporal defects and FiveMap

The fixed GitHub source run 44582875351 supplies the native registry and the authenticated 22,155,584-node stream. The replay binds zero-order applications to their native definitions. It checks the two \([0,1]\) Haar binders and the original whole radial envelope in each of the four radial integrals. The axial pressure moment retains the factor \(-R^2/2\) multiplying the Haar radial force.

## Verified source algebra

The exact expanded radial, angular and axial integrands have 132, 24 and 69 monomials. The replay records the coefficients and coordinate slots of the linear Temporal terms, the torus derivatives of single covariance factors, and the quadratic products. Every coefficient outside these factors is independent of both torus coordinates. The covariance terms with no torus derivative have exactly the original coefficients. The quadratic products are retained. For example, the Haar mean of \(\cos(2\pi Y_0)\) is zero and the Haar mean of its square is \(1/2\).

FiveMap uses the new \(P,J_\theta,J_z\) scaled by \(s^{2A}, s^{2A-3/2}, s^{2A-1}\). Clearing the denominators of the original sparse rational expressions gives zero in all five rows. Replacing the radial row's required value by zero or by the native post-FiveMap pressure defect gives a nonzero numerator. The source radial component keeps \(-\varepsilon/R\) times the left primitive of \(r\,\partial_Z\gamma_F\), with the original lower boundary. The homogeneous axial row makes the full weighted primitive vanish by the original profile change of variables.

## Ordinary bounds with full-path hypotheses

Under the original Fourier tail convergence, Haar translation invariance and differentiation on the retained chart, terms linear in Temporal fields have zero mean. Auxiliary derivatives of single periodic covariance factors also integrate to zero. The remaining radial density is

\[
-(\partial_R+1/R)\mathcal H(\beta_T^2+W_{rr})
-\varepsilon\partial_Z\mathcal H(\beta_T\gamma_T+W_{rz})
+\mathcal H(v_T^2+W_{\theta\theta})/R .
\]

The surviving angular and axial flux densities are \(R^2\mathcal H(\gamma_Tv_T+W_{\theta z})\) and \(R\mathcal H(\gamma_T^2+W_{zz})\). Use \(0<\varepsilon\le1\) and \(B_R\ge\max(1,\alpha^{-1},\beta,\beta-\alpha)\) for fixed radial limits \(\alpha,\beta\). If \(C_T\varepsilon\) and \(C_W\varepsilon\) cap the required Temporal and covariance derivatives uniformly over the full paths, the required unscaled defect derivatives are bounded by \(2^9B_R^4\varepsilon(C_T^2+C_W)\). The needed orders are three for \(P,J_z\) and four for \(J_\theta\).

For \(0<\lambda\le1/4\), the five original moments are \(x_0^p m_p\), where
\[
m_p=\frac1{10}\int_0^1(1+t/10)^p\exp[-1/(t(1-t))]\,dt.
\]
Restriction to \([1/4,3/4]\), \(p\ge-4\), \((11/10)^4<2\) and \(e<3\) give \(m_p>1/(40\cdot3^6)>2^{-16}\). The angular node gaps exceed \(1/8\) because consecutive sorted exponents differ by at least \(2/5\) and the smaller exponential exceeds \(1/3\). The axial ratio satisfies \(1-e^{-2\lambda/5}\ge\lambda/5\). GitHub Lean checks both exponential inequalities.

Put \(D=\max(1,\lambda^{-1},x_0,x_0^{-1},[K(2X_0)^{1/2+\lambda}]^{-1})\). Let \(E_\eta\ge1\) bound \(\eta\) and its first four physical \(Z\) derivatives. The actual \(s\) is the original monotone root of \(Z,T\) at #17732766. Its \(Z\)-dependence appears in \(\eta\), the scaled defects, and the bump profiles. In \(a^{-1}=[K(2X_0)^{1/2+\lambda}]^{-1}(1+\eta^2)\), the first factor is independent of physical \(Z\). The second has derivatives through order four bounded by \(2^5E_\eta^2\) on \(|\eta|\le1\). The moment lower bounds and inverse matrix entries give \(2^{37}D^5E_\eta^2\) times the maximum scaled defect jet as a coefficient bound. The angular system needs orders up to three.

Let \(E_s\ge1\) bound the physical \(Z\) derivatives through order four of \(s^{-A},s^{-1/2}\), and the three target scales. For the bump, set \(q=[t(1-t)]^{-1}\) and use \(q^j e^{-q}\le j!\). The fourth absolute derivative has majorant \((q^8+12q^7+48q^6+96q^5+84q^4+24q^3)e^{-q}\). The replay bounds the bump and its derivatives through order four by \(2^{20}\). All derivatives extend by zero at the endpoints. Positive-order mixed derivatives of the actual argument \(10(Rs^{-1/2}/(x_0e^{j/5})-1)\) have cap \(10DB_RE_s\) through order four. The chain rule has at most 15 partitions, yielding \(2^{44}B_R^4D^5E_s^5\) for the profiles with their amplitude. The product cap is \(2^{87}B_R^4D^{10}E_s^5E_\eta^2\) times the scaled defect bound for \(v_F,\gamma_F\) through total order three, and for \(\gamma_F\) through total order four with its own target.

The weighted left primitive \(R^{-1}\int_\alpha^R r f(r)\,dr\) differentiates through radial order three with cost at most \(2^7B_R^6\). The formula for \(\beta_F\) adds one explicit \(\varepsilon\) and one \(Z\) derivative of \(\gamma_F\). The input hence uses \(J_\theta\) through \(Z^4\). Uniform input grade \(\varepsilon^\delta\), with \(0<\delta\le1\) and nonnegative band grades \(b_T,b_W\) for \(S\ge1\), gives output grades \(\delta,\delta,1+\delta\) and band exponent \(\max(2b_T,b_W)\) before separately charging the displayed scalar factors.

The remaining whole-path proof covers the actual cumulative and whole translated integrals. Write \(T_e f=I_e f-\chi J_e f\), where the integrals carry \(R^{-e}r^e\) and translation \(\Phi(r)-\Phi(R)\). At fixed envelope and \(a_{\rm ref}=\partial_R\Phi\), the ordinary identities are \(\partial_R I_e=f-a_{\rm ref}L I_e-e I_e/R\), \(\partial_R J_e=-a_{\rm ref}L J_e-e J_e/R\), and \(\partial_Z T_e f=T_e(\partial_Zf)-\chi_Z J_e f\). The radial derivative of \(T_e\) keeps the term \(-\chi_R J_e\), which also appears in the realized Temporal axial velocity. The source pressure retains \(\rho P\). Its projected contribution vanishes by torus independence and translation invariance. The outstanding estimate requires a uniform envelope on every translated source path, differentiated cutoff factors, and the coupling to the native middle Forced source.

~~~text
python -B verify_after_temporal_five_map.py --goal GOAL_NEXT --artifact HOSTED_44582875351 --cache SOURCE_CACHE --out after-temporal-five-map.json
~~~
