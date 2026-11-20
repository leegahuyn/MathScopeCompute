# Signed centered flux on the original post-Forced source

The replay authenticates the 22,155,584 source records of run 44582875351. It binds the current mean \(g_r,P,J_\theta,J_z\) to native definitions 500–504 and the Signed stresses to 1276–1277. It verifies the original radial endpoints, the two Haar binders, and both terms of \(\partial_Z(c_\rho P)\). The refreshed full pressure includes the original background summand. The axial residual uses the separately retained incremental \(p_Z\).

## Exact source and pressure identities

The radial, angular and axial raw residuals have 176, 187 and 739 monomials. The replay separates terms linear in Temporal, quadratic Temporal terms, periodic derivatives of single covariance factors, compact initial FiveMap terms and the unprojected pressure. Linear Temporal terms have zero normalized Haar mean under the original convergent Fourier inverses and periodicity. The proof retains the quadratic and compact groups. Torus derivatives of a single periodic covariance integrate to zero when their actual coefficients are torus-independent.

At fixed \(Z,T\), write \(I f(R)=\int_\alpha^R f(r)\,dr\), \(J f=\int_\alpha^\beta f(r)\,dr\), and \(T_0 f=I f-\chi J f\). The original translated torus arguments become translations inside an invariant Haar integral. For the current \(\bar g=\mathcal H(g_r)\) and original normalized bump, \(P=J\bar g\), \(J\rho=1\). Thus \(\bar p=I\bar g-P I\rho\). This reduction cancels the entire averaged pressure cutoff term. Its complete axial derivative is \(I\bar g_Z-P_Z I\rho-P I\rho_Z\). The exact arithmetic rejects omission of the third term. The native unaveraged \(p_Z\) and its original \(\chi_Z\) term remain in the graph.

For angular weight \(e=2\) or axial weight \(e=1\), use \(F=\mathcal H(\text{weighted radial flux})\), \(W=\mathcal H(R^e v_e)\), \(G=\mathcal H(\text{weighted axial flux})\) with \(R\bar p\) added only on the axial row, and \(D=J_\theta\) or \(J_z+c_\rho P\). Then the actual centered primitive reduces to

\[
\Sigma=-R^{-e}\left(F(R)-F(\alpha)-\chi(F(\beta)-F(\alpha))
-\varepsilon T_0(W_T)+\varepsilon T_0(G_Z)-\varepsilon D_Z T_0\rho\right).
\]

The exact radial FTC and cutoff product rule have separate GitHub Lean proofs. The ordinary weighted conservation and pressure moment also give \(D=J G\) once the original flatness and moment conditions are supplied. The cutoff product \(\chi_T J W\) appears when commuting \(T_0\) with \(T\) differentiation and vanishes under whole weighted conservation. The uncollapsed native flux equations explicitly retain time, viscosity and endpoint terms.

## Weighted inputs through order two

The pressure source has radial divergence \(F_p' \) plus a density. With \(C_{ij}=\overline W_{ij}+\mathcal H(\mu_i\mu_j)\), \(U=2b\bar\beta+C_{rr}\), \(V=b\bar\gamma+G_0\bar\beta+C_{rz}\) and \(B=2V_0\bar v+C_{\theta\theta}\), use

\[
F_p=-U+\varepsilon(\bar\beta_R+\bar\beta/R),\qquad
f_p=(B-U)/R-\varepsilon V_Z+\varepsilon\bar\beta_T+\varepsilon^3\bar\beta_{ZZ}.
\]

The initial mean is unchanged during the first Forced substep. Its Temporal means vanish and the remaining \(\bar\beta,\bar v,\bar\gamma\) are the original compact FiveMap fields. The pressure density requires \(\beta_{F,Z^5}\) through the \(\varepsilon^3\) viscosity term. Thus the axial FiveMap solve needs \(J_\theta\) through pure \(Z^6\) and mixed \(Z^4T\). Before FiveMap, \(J_\theta\) uses only the \(v_T,\gamma_T\) product when these highest derivatives fall on Temporal velocities. Extending the original positive recurrences and their mixed chart majorants gives exactly the two previously checked selective \(W_{rz,Z^8}\) and \(L^2W_{rz,Z^8}\) inputs. All mixed slow-time covariance orders remain at most seven. The compact support lies in \(eX_0<X<e^2X_0\), where the inverse weight loss is less than three. This supplies the compact input grades under the original C98 chart, pulse, covariance and flatness premises.

For inner distance \(u=\log(X/X_a)/t_1\) and outer distance \(d=\log(X_b/X)\), the direct rational log-slope tests use \(u,d\le1/32\), width greater than two and \(t_1<1/128\). Each admitted centered collar integral with pole at most 512 gains three powers, with the opposite Gaussian and positive radial Jacobian retained. There can be up to two nested primitives, one from pressure and one from \(\Sigma\). On the complementary region the inverse weight is less than \(2^{7680}\). This transfer requires uniform weighted donor bounds and the original flat extension across each physical face.

For the original \(n=1\) angular terminal stress the replay attaches the source coefficient #17717057, the original angular whole moment #117072, and the complete exterior heat factor. Normalizing the heat amplitude by its actual boundary value at \((X_b,\eta=1)\) gives the source bound \(2^{-65343}\). Exact positive Taylor recurrences for the two square seeds, their reciprocal, the geometric coefficients and the full heat factor give \(\|B\|_{C^2_{\delta,\eta}}\le2^{-65000}\) on the original \(0\le\delta\le1/4\) terminal interval. With the same original backward integral, the stress coefficient is at most \(2^{-64993}X_b\) times \(\zeta\delta^{-3-3r}\) for \(\partial_\delta^r\partial_\eta^k\), \(r+k\le2\). The original conservative whole moment and real correspondence at the boundary remain hypotheses for applying this bound to the native stress.

The remaining early donor is the pure axial fifth derivative of the first Forced phase-free potential. Complementary input packets reduce the mixed high pressure derivatives, supply the corresponding mode-two estimate, and specify the sufficient Signed energy grade. The interior and other original stress arms, the complete Signed slice, later mean and whole \(K_1\) remain open.

~~~text
python -B verify_signed_pressure.py --goal GOAL_NEXT --artifact HOSTED_SOURCE --cache SOURCE_CACHE --runtime ORIGINAL_RESEARCH_IDE --out signed-pressure-flux.json
~~~
