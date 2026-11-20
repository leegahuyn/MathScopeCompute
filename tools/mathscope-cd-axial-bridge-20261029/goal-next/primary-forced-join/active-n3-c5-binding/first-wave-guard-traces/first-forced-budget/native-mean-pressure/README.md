# Native pressure and FiveMap transfer for the first Forced modes

The exact replay authenticates the 22,155,584-node source and the two original first Forced polynomial receipts. It resolves the registered initialized pressure and velocity calls, the positive native \(s(Z,T)\) root, the radial cutoff \(\chi\), and the whole support normalizer of \(\rho\). The 120 real and imaginary source scalars cover both positive modes in each of the ten original charts. The negative modes are their original conjugates.

## Angular projection

The initialized full mean pressure is assigned angular mode zero. Its gradient has the same angular mode and cancels from the updated-minus-previous nonzero residual. The exact source expansion checks its absence, including underneath retained native scalar calls. Mode 1 is affine in the initialized mean velocity. Each of its mean monomials has a single original Primary velocity factor. Mode 2 has no initialized mean velocity factor. The Temporal velocity still contains the original projected pressure used to produce it. The zero angular mode and pressure of later stages are outside this exclusion.

## Original geometry and weighted endpoints

The actual implicit equation is \(s-Z^2s^{2h}-T=0\). On the admitted image \(Z=s^{1/2-h}\eta\), the implicit denominator is \(1-2h\eta^2\). GitHub Lean checks its lower bound \(7/8\) under \(0\le h\le1/16\) and \(\eta^2\le1\). The Taylor recurrence removes the implicit linear term and bounds the remaining binomial coefficients. It produces explicit ordinary slow bounds for \(s\), its needed powers, and \(\eta\) through order seven. The cutoff uses the original step based on \(e^{-1/u^2}\). Its exact step denominator is at least \(e^{-4}>1/128\). The normalization density instead uses \(e^{-1/[u(1-u)]}\), with constant mass greater than \(2^{-16}\) after the full radial change of variable. The fixed envelope contains the whole transition. The derivative bounds for \(\chi\) and \(\rho\) through mixed order seven are at most \(B_{\rm norm}\).

For \(U=\mathcal H(\beta_T^2+W_{rr})\) the unweighted radial integral contributes \(-[U]_\alpha^\beta\) and the cylindrical term \(-\int U/R\). The \(R^2\)-weighted radial integral gives

\[
\int_\alpha^\beta(-R^2 U_R-RU)\,dR
= -[R^2U]_\alpha^\beta+\int_\alpha^\beta RU\,dR .
\]

The Lean proof retains both endpoints. In the source norm transfer both endpoint values are bounded with the same whole-path input, so the estimate does not require either endpoint to be declared zero for this step. The Temporal pressure integration from the previous stage still uses its original periodic lifts and flat covariance traces.

## Exact derivative demands and conditional energy transfer

The actual mean jet requests reach total order five and axial order four. FiveMap needs \(P,J_z\) through \(Z^4\), and \(J_\theta\) through \(Z^5\) because the radial component differentiates the left weighted primitive once in \(Z\). The primitive's upper endpoint uses the corresponding lower radial derivatives. All pure torus derivatives of FiveMap vanish. Normalized Haar leaves 136 quadratic Leibniz terms in these target estimates. Their extra \(\varepsilon\) powers absorb the additional band powers and the enlarged coefficient of the two selective \(C^8\) covariance derivatives. The only eighth-order roles are \(W_{rz,Z^8}\) and \(L^2 W_{rz,Z^8}\) from the higher Temporal pressure derivative. Both are attached to the separate original \(C^9\) potential/frame replay. The other roles use the global \(C^7\) covariance replay. The latter uses all original cover contributions and the original endpoints.

Under the original admitted fixed-label and ordinary jet hypotheses, the resulting FiveMap bounds have grades \(\varepsilon S^{1/2+3z}\) for the angular and axial components and \(\varepsilon^2 S^{7/2+3z}\) for the radial component. The mean coefficient fits one \(M=\exp(H/2^{128})\) reserve over the middle covariance coefficient. The middle first Forced slice retains the corrected physical exponent \(139993/100000\) and its conditional ratio \(J_{\rm middle}^2/S_R<2^{-32}\). The same two-mode energy over the three disjoint radial slices is \(<2^{-30}\) with the original collar premises. This estimate covers the first two Forced harmonics. The rest of \(K_1\), full N7-06 and N8-05 require separate bounds.

~~~text
python -B verify_mean_pressure_enclosure.py --goal GOAL_NEXT --artifact HOSTED_SOURCE --cache SOURCE_CACHE --runtime ORIGINAL_RESEARCH_IDE --global-covariance GLOBAL_C7_JSON --selective-covariance SELECTIVE_C8_JSON --out mean-pressure-enclosure.json
~~~
