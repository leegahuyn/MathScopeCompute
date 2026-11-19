# Original N3 Wzz before auxiliary Haar

**VERIFIED.** The archived 21,681,493-node original N3 stream binds
`Wzz` to common-torus field 5 and application `#17753403`. Both source
signs have guarded local roots `#17738743` and `#17742161` and interior
roots `#17738736` and `#17742154`. The two interiors are exactly one half
of the sum of an axial leading square and an axial imaginary curl square.
The leading factor has transverse shape \(\chi B_0\), and the imaginary
curl has shape \(\chi C_0+\chi' C_1\). Each coefficient is independent of
\(\xi\) at the fixed original slow coordinates, labels and pulse value.
The replay verifies the native potential application slots and both
transverse derivative orders used in the two original curl squares.

Consequently the full local shape is
\[
 f(\xi)=B\chi(\xi)^2+C\chi(\xi)\chi'(\xi)+D\chi'(\xi)^2.
\]
All three monomials occur in the retained symbolic polynomial. This
statement concerns the source expression and allows the coefficient of
any term to vanish at individual arguments. The same shape holds after
any admissible pure slow derivatives with local \(\xi,v\) fixed. In each
sign's local guard stack, only the single transverse interval
\((-r_0,r_0)\) depends on \(\xi\). The other six guards stay fixed while
sampling. At guard and copy seams the original flat extension supplies
the derivatives. All 162 row maps, coefficients and guards match the
independently replayed C75 `Wrz` row maps.

## Conditional three-sample estimate

Let \(M\) be a pointwise cap from the original local class for the chosen
pure slow jet at the three original coordinates
\(0,+r_0/2,-r_0/2\). The transition step has derivative 8 at its midpoint,
and \(r_0=2^{-34}\). The values at the two half-radius points are
\(\chi=1/2\) and \(\chi'=\mp2^{38}\). At zero the plateau gives
\(\chi=1,\chi'=0\). Thus
\[
B=f(0),\qquad
C=\frac{f(-r_0/2)-f(r_0/2)}{2^{38}},\qquad
D=\frac{f(r_0/2)+f(-r_0/2)-f(0)/2}{2^{77}}.
\]
It follows that \(|B|\le M\), \(|C|\le2^{-37}M\), and
\(|D|\le5\cdot2^{-78}M\). With the independently pinned original
\(c_j\ge\sup|\chi^{(j)}|\), this gives
\[
 \sup |\partial_\xi^2 f|\le M\left[
  2c_1^2+2c_2+2^{-37}(3c_1c_2+c_3)
  +5\cdot2^{-78}(2c_2^2+2c_1c_3)\right].
\]
The exact bracket is `73480008268573299053216957202432`. The common
coordinate rule \(L\xi=\Lambda^\delta,Lv=0\) costs at most
\((13/5)^8\) in \(L^2\). Here \(L^2 f\) means the second derivative
in the torus direction \(L\). The normalized Haar measure has mass one.
The original anisotropic Fourier bound is
\[
\|N^{-1}P_\perp f\|_\infty\le
 \tfrac{85}{6}\|f\|_2+\tfrac{85}{216}\|L^2f\|_2.
\]
There is no extra slow derivative in this transfer. For a local gain
\(\epsilon_{\rm label}^{\beta}\), the reference scale for
\(\partial_Z^a\partial_T^b\) is
\(\rho^{2A+aD+b-\beta h}\epsilon_{\rm ref}^{\beta}\). With the admitted
reference ratios and original gains, the band factors are at most 128
for \(a\le3,b\le1\) and 512 for \(a\le5,b\le1\). Using the same local
pointwise cap after expressing it in reference coefficients, the whole
162-row inverse overhead is below \(2^{130}\) and \(2^{132}\),
respectively. These are multipliers on the existing source pointwise
caps at those orders.

## Original Jz0 uses

The original fresh `Jz0` flux uses `Wzz` at its radial binder
`#21374536`, beside the retained Temporal axial square `#21374560`. The
direct \(\int R\,\overline{W_{zz}}\,dR\) branch needs no inverse.
Differentiating it through \(Z^2T\) needs the same source slow orders on
\(W_{zz}\). In the original early axial source `#17754268`, the `Wzz`
leg is exactly \(+\epsilon\partial_Z W_{zz}\) at `#17754264`. This is the
input to native inverse system 1. Its contribution to the desired
Temporal axial velocity is
\[
 g=-\epsilon c_{i0}^{-1}N^{-1}P_\perp\partial_Z W_{zz}.
\]
The original \(T_1\) identity gives its realized contribution as
\[
 \gamma_{zz}=g-\frac{\partial_R\chi_r}{R}
 \int_{R_a}^{R_b}r\,
 g\big(r,Z,T,Y+(\Phi(r)-\Phi(R))v_r\big)\,dr,
\]
where \(\chi_r\) is the original radial cutoff and \(R_a=\sqrt{X_a}\),
\(R_b=2\sqrt{X_b}\). The radial translation and endpoints are fixed in
\(Z,T\) at the original reference label. Every nonzero `Wzz` radial input
is reindexed and guarded at the same physical \(q\), and the exterior
indexed input and its inverse are zero. For a fixed-chart slow
multi-index \(\alpha\) in \((Z,T)\), the corresponding explicit estimate
for this leg is
\[
 \|\partial^\alpha\gamma_{zz}\|_\infty\le
 \|\partial^\alpha g\|_\infty+
 \frac{R_b^2-R_a^2}{2R}
 \sum_{\nu\le\alpha}\binom{\alpha}{\nu}
 |\partial^\nu\partial_R\chi_r|
 \sup_{r\in[R_a,R_b]}\|\partial^{\alpha-\nu}g(r)\|_\infty .
\]
The torus supremum and radial integration have their original roles.
No radial observation Gaussian is carried through the integral.
In the `gamma^2` product at \(Z^2T\), the highest `Wzz` allocation
therefore uses \(\partial_Z^3\partial_T W_{zz}\). In the weighted radial
source's `beta_Z*gamma` product, the `Wzz` leg through \(\beta_Z\) has
the two axial derivatives in \(\beta_Z=-\epsilon\partial_Z^2\psi\)
before the same product derivatives. This allocation uses at most
\(\partial_Z^5\partial_T W_{zz}\). The three-sample estimate applies
to both orders under their original pointwise class assumptions.

**OPEN.** The mixed derivative caps of the radial cutoff, numeric
radial and product estimates for the complete `gamma^2` and weighted
radial source, and all other Temporal and pressure source legs remain
separate. The archived source readback does not certify a new hosted
native gate. Final jets stay 0/67 and RELEASE HOLD.

The Python replay checks eight pinned inputs, both local graphs,
the 162 common row maps, the original defect paths, and exact rational
sample and Fourier constants. Run it in the preserved workspace.

```text
python -B verify_wzz_cutoff.py NEW_RECEIPT.json
```
