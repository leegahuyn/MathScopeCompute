# Actual initialized mean perturbation through spatial order two

**CONDITIONAL source bounds.** The hosted original 4,456,994-node graph
provides the mean perturbations \(\beta=\#3614790\), \(v=\#3614791\),
\(\gamma=\#3614792\). This is the same authenticated initialization used
for the pressure replay. The later C5 live Primary–Forced run is a separate
execution. Its private family has not been identified with this saved graph.

On each fixed original dyadic band and with fixed row labels,
\(L=v_r\cdot\partial_Y\), \(D_R=\partial_R+aL\), and
\(D_Z=\epsilon\partial_Z\). The original shifted radial integrals evaluate
their integrand at \(Y+(\Phi(r)-\Phi(R))v_r\). This translation and the radial
weights and cutoffs are independent of \(Y\). Thus \(L\) commutes with the
registered smooth shifted integrals, including the whole-integral cutoff
remainder in \(A_1\), and with the auxiliary Fourier inverse. The native
FiveMap checks establish its independence of the auxiliary variables.

The positive program takes \(L,L^2\) of the actual Temporal formulas
\(v_T=-c_{i_0}^{-1}N^{-1}P_\perp E_\theta\),
\(\psi_T=T_1\gamma_d\),
\(\beta_T=-\epsilon\partial_Z\psi_T\), and
\(\gamma_T=\gamma_d-A_1\gamma_d\), where
\(\gamma_d=-c_{i_0}^{-1}N^{-1}P_\perp E_z\).
The original anisotropic bound for \(L^j\) of the inverse retains the
source norms at orders \(j\) and \(j+2\). The covariance and the radial
operator bounds retain the whole shifted source from the \(Z\) derivative.

Let \(M_j,L_j,LL_j\) denote ordinary slow order \(j\) bounds for each
normalized scalar, its \(L\) derivative and its \(L^2\) derivative.
With bounds \(a_0,a_1\) for the radial-phase coefficient and its first
derivatives and \(\epsilon\le1\), the radial second derivative costs
\(M_2+2a_0L_1+a_1L_0+a_0^2LL_0\). The mixed derivative costs
\(M_2+a_0L_1+a_1L_0\). Physical velocity multiplies these normalized
results by \(Q^{-A}\), with another \(Q^{-1/2}\) per spatial derivative.

| Perturbation | Value | R | Z | RR | RZ | ZZ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| \(\beta\) | 7590 | 7619 | 7591 | 7623 | 7625 | 7610 |
| \(v\) | 7602 | 7627 | 7603 | 7631 | 7633 | 7613 |
| \(\gamma\) | 7594 | 7635 | 7595 | 7639 | 7641 | 7615 |

The independent checker authenticates 972 native covariance rows and
reconstructs all 18 bounds in the 8,349-node exact positive graph.
The bounds use the original source geometry, denominator and stability
estimates, smooth joins and the finite source FTC norm expressions.
Actual frozen-representative transport, time derivatives, the weighted
Forced class and numerical final-field enclosures remain OPEN.

```sh
node --max-old-space-size=3072 "$p/whole-k-annular-pressure-lower/propagate_lower_covariance.mjs" \
  "$p" "$graph" "$chart" /tmp/mean-transverse-c2.json --mean-spatial-c2
node "$p/whole-k-annular-pressure-lower/check-mean-transverse-c2.mjs" \
  "$p" "$graph" /tmp/mean-transverse-c2.json /tmp/mean-transverse-c2-readback.json
```
