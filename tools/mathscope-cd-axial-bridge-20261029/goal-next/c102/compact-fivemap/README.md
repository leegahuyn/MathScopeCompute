# Compact FiveMap and high mode-one mean inputs

The original high mode-one source demands three torus-independent FiveMap directions for each of \(\beta,v,\gamma\), namely \((R,Z)=(0,5),(0,6),(1,5)\). A positive \(L\) derivative annihilates the compact FiveMap field. The compact radial component uses one more \(Z\) derivative of its angular moment through the original primitive. The five-profile map therefore uses \(P,J_z\) through \(Z^6\) and \(J_\theta\) through \(Z^7\). The original Haar product \(-\varepsilon\partial_Z\mathcal H(\beta_T\gamma_T)\) reaches order seven in both Temporal factors. The angular flux reaches order seven of \(v_T,\gamma_T\) as well. The C101 nonzero high-order perturbation test for the pressure path, which first appears at order ten of \(W_{rz}\), is pinned separately.

The typed Temporal recurrence uses all three pure \(Z^j\) rows for \(0\le j\le7\) and the original additional mixed mean directions. It records 267 distinct unprojected covariance requests, 118 shifted radial integrals, 24 cutoff derivatives and 56 inverse requests. Before exact radial integration by parts, 28 covariance requests exceed ordinary slow order seven.

* Four \(W_{rz,Z^8}\) requests at \(L^0,L^1,L^2,L^3\) follow from C98's \(L^0,L^2,L^4\) bounds and unit-segment Taylor interpolation on the whole common torus.
* The shifted fundamental theorem of calculus removes \(W_{rz,RZ^7}\) and \(W_{rz,RZ^8}\) from the high \(\beta_T\) primitive. The remaining \(W_{rz,RZ^7}\) in \(\gamma_{T,Z^7}\) and \(W_{r\theta,RZ^7}\) in \(v_{T,Z^7}\) enter only through whole normalized Haar products with an order-zero partner. For \(e=1,2\), use \(r^e D_e^{(e)}f=D_r(r^e f)\) and move \(D_r\) onto the other weighted factor. The periodic torus integral of \(L\) of the product vanishes. Whole endpoint terms use the original flatness. The new lower-partner derivative uses only ordinary covariance order four and fits the existing C7 bound. The band slope moved to the partner equals the slope removed from the higher covariance.
* The resulting 18 sufficient selective covariance rows are \(W_{rz,Z^9},W_{rz,Z^{10}}\), three components \(W_{rr},W_{\theta\theta},W_{zz}\) at both \(Z^8,Z^9\), and \(W_{\theta z,Z^8}\), each at \(L^0,L^2\). The eight additions beyond C101's ten are the three \(Z^9\) component pairs and the \(W_{\theta z,Z^8}\) pair. The latter enters through the original \(\varepsilon\partial_Z W_{\theta z}\) in the \(v_T\) equation.

## Conditional grade budget

The 246 compact Haar product terms retain at least \(\varepsilon^{199997/100000}\) before absorption, including an extra conservative \(\varepsilon^{-1/100000}\) for the radial integration by parts. The additional band exponent in \(S\) is at most \(41/2\) for \(P,J_z\) and \(23/2\) for \(J_\theta\). These terms fit the original epsilon gain even with a high covariance coefficient log cap \(H/2^{108}\). The linear Haar \(W_{rz,Z}\) term retains its explicit \(\varepsilon\) and absorbs its additional \(S^3\) separately. The 15 direct mixed Temporal mean requests also satisfy the required eikonal and ordinary-gradient grades under their quantitative covariance hypotheses.

The complete typed inventory keeps the original source labels, cutoff, same-body linear mean and periodic boundary conditions. Quantitative enclosures of the 18 selective covariance rows and their attachment to the actual compact mean constants remain separate.

~~~text
python -B verify_compact_fivemap_crop.py --premean C97_PREMEAN_PY --mode-one C100_MODE1_JSON --linear-crop C100_HIGH_CROP_JSON --compact-witness C101_COMPACT_Z10_JSON --five-map C99_SIGNED_PRESSURE_JSON --out compact-fivemap-crop.json
~~~
