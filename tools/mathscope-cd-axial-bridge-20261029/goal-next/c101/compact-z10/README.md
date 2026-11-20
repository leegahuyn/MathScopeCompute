# Compact FiveMap \(P,J_z\) at pure axial order six

The original pre-FiveMap pressure moment is \(P=\int\mathcal H(g_r)\,dR\). Its axial companion is \(J_z=\int\mathcal H(\mathrm{flux}_z)\,dR-\frac12\int R^2\mathcal H(g_r)\,dR\). Here \(\mathcal H\) is the normalized common torus integral. The source contribution carrying the highest derivative of the Temporal potential is fixed by the \(-\varepsilon\partial_Z\mathcal H(\beta_T\gamma_T)\) arm of \(g_r\). For \(P_{Z^6}\) and \(J_{z,Z^6}\), its derivative of \(\beta_T\) can reach order seven, corresponding to order eight of the potential and order ten of the pressure covariance \(W_{rz}\).

## Exact nonzero response

Choose one nonconstant co-moving torus harmonic \(h\) with \(D_rh=0\), \(\mathcal H(h)=0\) and \(\mathcal H(h^2)=1/2\). Take a nonzero smooth compact radial profile \(a\), and put \(b=Ra\). The original Temporal inverse can produce the low potential \(ah\) from a \(W_{zz}\) input linear in \(Z\). Use the centered perturbation
\[
 \delta W_{rz}=
 \frac{(Z-Z_*)^{10}}{10!}\frac{c_i}{\varepsilon^2}
 N\left[\left(\frac{(Rb)'}R\right)'h\right].
\]
Across both original translated primitives the harmonic co-moves, and the inner radial integrands are exact derivatives. Since the whole boundary differences vanish, the original \(\chi\) terms have no effect on this leading coefficient. The resulting \(\delta\psi_{Z^8}=bh\) gives \(\delta\beta_{T,Z^7}=-\varepsilon b h\) while leaving \(\gamma_T\) through \(Z^7\) and \(\beta_T\) through \(Z^6\) unchanged at \(Z_*\). Both velocity pairs obey the original meridional divergence identity. Linear Temporal terms, including the pressure-density viscosity arm, have zero Haar mean. The remaining quadratic terms depend on lower derivatives under the perturbation. The weighted radial integration by parts yields the two nonzero responses
\[
 \delta P_{Z^6}=\frac{\varepsilon^2}{4}\int a^2\,dR,\qquad
 \delta J_{z,Z^6}=\frac{\varepsilon^2}{8}\int R^2 a^2\,dR .
\]
An exact rational polynomial test gives \(64/315\) and \(32/77\) after dividing by \(\varepsilon^2\). The identities hold for smooth compact bumps with the same signs. This verifies operator dependence through the original shifted inverse and Haar moment. Actual quantitative estimates for the original \(W_{rz}\), and any further identities specific to its Primary construction, remain open.

~~~text
python -B verify_compact_z10.py --runtime ORIGINAL_NAVIER_RUNTIME --crop C100_HIGH_CROP_JSON --out compact-z10.json
~~~
