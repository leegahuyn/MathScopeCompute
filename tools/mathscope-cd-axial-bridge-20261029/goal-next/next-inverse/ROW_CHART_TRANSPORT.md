# Original chart change for the nonzero conservative residual

Let a fixed original row use band label \(\ell\), common index \(i_0\),
row index \(i_\ell\) and \(d=i_\ell-i_0\). The verified reference
to own chart has
\[
 \rho=Q_{\rm ref}/Q_\ell=2^{\ell-\ell_{\rm ref}},\qquad
 (R_\ell,Z_\ell,T_\ell)=(\rho^{1/2}R_{\rm ref},\rho^D Z_{\rm ref},\rho T_{\rm ref}).
\]
The same two common torus coordinates and the physical angle appear on
both sides. Frozen labels, representatives and copies have zero
derivatives in the five physical and auxiliary directions and the
angle. The exact replay binds the three original band indices and
differences on all 162 original rows.

## Differential factors

The original radial primitive on a band with index \(i\) is
\(\Lambda^i r^{d_r}\), where
\(r=\sqrt{Q_\ell}R_\ell=\sqrt{Q_{\rm ref}}R_{\rm ref}\).
Differentiating the common reference primitive in its slow radial
coordinate gives
\[
 a_{\rm ref}=\Lambda^{i_0}d_r r^{d_r-1}\sqrt{Q_{\rm ref}}
            =\rho^{1/2}\,a_\ell/\Lambda^d.
\]
The original own lift uses \(a_\ell/\Lambda^d\) for its common-torus
radial fast coefficient. Thus both the slow and fast summands in
\(D_r\) have the common factor \(\rho^{1/2}\). The normalized axial
derivative has factor \(\rho^{h+D}=\rho^{1/2}\), and the angular
derivative \(R^{-1}\partial_\theta\) has the same factor.

The normalized time derivative on the original reference chart is
\(-\epsilon_{\rm ref}\partial_{T_{\rm ref}}+c_{i_0}(Q_{\rm ref})N\).
Both summands have factor \(\rho^{1+h}\), since
\(\epsilon_{\rm ref}=\rho^h\epsilon_\ell\) and
\[
 c_{i_0}(Q_{\rm ref})
 =T_g^{i_0}Q_{\rm ref}^{1+h}
 =\rho^{1+h}\,c_{i_\ell}(Q_\ell)/T_g^d .
\]
Every scalar Laplacian term and every extra cylindrical vector connection
has factor \(\rho\). The velocity and pressure rescalings are
\(\rho^A\) and \(\rho^{2A}\), respectively. Thus time, tensor divergence,
vector viscosity, and pressure gradient all scale by
\(\rho^{2A+1/2}\). The Python receipt records the exact source operands
and the rational power identities. The reached physical conservative
roots contain the checked reference radial, axial and time coefficients.

## Consequence for the second source

At a point with a fixed valid own chart and a single active wave row,
suppose the original fields have the required ordinary jets and every
other wave row and its derivative factors vanish there. The exact
post-Five velocity and pressure are the common mean plus this active
row. Pull the entire refreshed mean into the own chart, with inverse
velocity and pressure factors. The differential factors above show that
the direct reference conservative residual equals the own conservative
residual rescaled by \(\rho^{2A+1/2}\). Keeping the common phase, the
nonzero Fourier coefficients agree after the same rescaling. The purely
mean differential terms and mean-only products contribute at mode zero.
The actual mean–wave products remain at the wave modes.

The finite candidate constructor subtracts the explicit Primary,
first-Forced and Signed principal cutoff pieces from that own-chart
nonzero residual. The operator verification applies to the guarded
coefficients it produces. For the guard to represent the unguarded
supported source, the original analytic zero extension is needed. In
particular, the initial residual and primary derivative vanish in the
pulse collars wherever their operands have the declared ordinary
semantics. Zero input along a whole fixed transverse path gives a zero
forced solution there. The particular and signed principal derivatives
also carry the interior cutoff derivative. Slow, shell and transverse
seams and the complete native source derivative bounds require their
separate proofs. The actual new candidate still needs the independent
corrected graph comparison.

Run the exact source replay with Python assertions enabled:

    python check_row_chart_transport.py --repo REPO --graph ORIGINAL_NODES --registry ORIGINAL_FUNCTIONS --palette PALETTE_RECEIPT --out row-chart-transport.json
