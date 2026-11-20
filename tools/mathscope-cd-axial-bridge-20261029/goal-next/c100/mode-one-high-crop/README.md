# Higher initialized mean covariance required by original mode one

## VERIFIED

The typed original Temporal recurrence produces 14 conservative covariance rows above ordinary slow order seven from the selective mode-one demands. Four \(W_{rz,Z^8}\) rows are covered by the existing C98 even \(L^0,L^2,L^4\) rows and the exact unit-segment Taylor estimate
\[
\|Lf\|_\infty\le 2\|f\|_\infty+\tfrac12\|L^2f\|_\infty.
\]
Use the estimate on \(f\) and on \(L^2 f\) on the original common torus with its constant \(L\) direction.

The two mixed \(W_{rz,RZ^7}\) rows arise only from the direct radial divergence inside the Temporal radial potential for \(\beta_{T,Z^6}\). They reduce by the original shifted fundamental theorem of calculus. In the notation \(T_\chi=I-\chi J\), the identity is
\[
T_\chi\!\left(rN^{-1}D_e^{(1)} f\right)
   =N^{-1}[rf]_{\mathrm{left}}-\chi N^{-1}[rf]_{\mathrm{whole}}.
\]
Each endpoint retains its original torus transport. Here \(rD_e^{(1)}f=D_r(rf)\), the shift derivative is the original radial-fast multiplier of \(L\), and \(N^{-1}\) on centered modes commutes with both the translation and the cylindrical radial derivative. Ordinary \(Z\) derivatives preserve the transfer since the phase is fixed in \(Z\). The bound now needs \(W_{rz,Z^7}\), at both transported endpoints.

The remaining sufficient new linear Temporal inputs are pure \(W_{rz,Z^9}\) at \(L^0,L^2\) and pure \(Z^8\) for \(W_{rr},W_{\theta\theta},W_{zz}\), also at \(L^0,L^2\). The three eighth-order stresses enter the shared pressure–axial combination and can be supplied by a suitable bound for that combination. The displayed \(L^2\) is the established sufficient inverse estimate.

There is a surviving ninth-order operator. With \(C\) the common torus mean-free \(W_{rz}\), its coefficient in \(\beta_{T,Z^6}\) is
\[
-\frac{\varepsilon^3}{c_i R}\,T_\chi\!\left[rN^{-1}T_\chi(\partial_Z^9 C)\right].
\]
The axial residual, pressure derivative and original cutoff are bound to #17754268, #17754234 and #17743734. A \(Z\) derivative landing on the cutoff leaves at most eight derivatives on \(W_{rz}\). The zero-mode correction removes the constant torus mode. For any nonconstant Fourier harmonic with nonzero \(N\) frequency, a co-moving profile \(e^{ik\cdot(Y-\phi(r)v_r)}f(r)(Z-Z_*)^9/9!\) factors out of both native translations. With \(f\) a nonzero nonnegative smooth radial bump in a flat collar, the two left intervals or two right intervals give a strictly positive radial integral. Exact rational kernel checks return \(31/105\) and \(13/35\) for a polynomial test profile. All lower ordinary \(Z\) derivatives of that profile vanish at \(Z_*\).

The native mode-one term carrying \(\beta_{T,Z^6}\) uses \(\varepsilon U_z e_r\) from \((U\cdot\nabla)M\). After applying the original negative projection its coefficient is \(-\varepsilon U_z\Pi_n e_r\). The regular projector satisfies \(q_n(\Pi_n e_r)_r=n_\theta^2+n_z^2\), positive when the native nonzero angular normal is present. This shows the leading coefficient is a genuine operator term. Actual quantitative bounds for the covariance and the source field remain necessary.

## OPEN

The eight new linear Temporal rows still need original whole-path enclosures. The separate compact FiveMap route needs its own estimates. Through the radial primitive it may ask \(J_\theta\) through \(Z^7\). A direct \(P,J_z\) quadratic route at \(Z^6\) may use \(\beta_{T,Z^7}\) and \(W_{rz,Z^{10}}\) unless further weighted identities reduce the demand. The current exact crop addresses only linear Temporal. Stage energy and final jets remain open.

~~~text
python -B verify_high_mean_crop.py --premean C97_PREMEAN_CODE --mode-one C100_MODE_ONE_JSON --z8 C98_Z8_JSON --temporal ACTUAL_INITIAL_TEMPORAL_JSON --runtime ORIGINAL_NAVIER_RUNTIME --out high-mean-crop.json
~~~
