# Directed energy integration on the original heat exterior

The fixed physical subdomain is \(2^{-1024}\le s=r^2\le1/2\), \(\zeta^2\le1/2\), \(1/2\le\rho\le1\), with the full azimuthal circle. Here \(\rho=\tau/\tau_0\), \(\zeta=z/\tau_0^{1/2-h}\), \(B=2^A c_\infty\), \(M=\tau_0^{2A}B^2\), \(U=\tau_0^A u\), and \(F=\tau_0^{A+1}f\). The original heat-exterior and cutoff-force certificates are pinned by SHA-256.

The source bounds \(h<2^{-4096}\) and \(\log(1/q_{\rm Big})>(64/h)^2/2\) imply \(\tau_0<2^{-8192}\) and \(\tau_0^{2h}<2^{-4096}\). The original radial heat formula and its derivative give

\[
 \left|rK/B-1\right|<2^{-4000},\qquad
 \left|r^2 K_r/B+1\right|<2\cdot 2^{-4000}.
\]

Write \(R=\chi(2s)\), \(Z=\chi(2\zeta^2)\), \(c=\chi(\rho)\), \(I_R=\int R^2\,ds/s\), and \(I_Z=\int Z^2\,d\zeta\). The leading endpoint energy, work, force square and squared \(L^1_\rho L^2_x\) norm divided by \(M\) are respectively

\[
 \tfrac{\pi}{2}I_R I_Z,\qquad
 \pi I_R I_Z\int-c c'\,d\rho,\qquad
 \pi I_R I_Z\int(c')^2\,d\rho,\qquad
 \pi I_R I_Z .
\]

The radial plateau contributes exactly \(1022\log2\) to \(I_R\). The time integral of \(|c'|\) is one by monotonicity and the exact endpoint values. The checker retains the original vector force, including the pressure cutoff and commutators, and encloses its difference from the leading term. Transverse dissipation and the inner viscous flux are integrated with weight \(\tau_0\), and axial dissipation with weight \(\tau_0^{2h}\). The inner outward normal is \(-e_r\). Pure swirl eliminates pressure and advective energy flux on this subdomain. The outer cutoff faces are flat.

| Quantity | Outward rounded enclosure |
| --- | --- |
| Endpoint energy divided by \(M\) | [1314.07, 1322.79] |
| Work divided by \(M\) | [1270.97, 1369.18] |
| Force square divided by \(M\) | [8377.93, 8909.26] |
| Squared exterior \(L^1_\rho L^2_x\) force divided by \(M\) | [2628.15, 2645.57] |

The absolute interval defect for \(E+D-W-\Phi\), divided by a lower bound on endpoint energy, is at most 0.084986 on the base grid, 0.077846 on the spatial refinement, 0.048831 on the time refinement and 0.041929 with both refinements. Changing only directed arithmetic precision leaves these displayed bounds unchanged. The original cutoff and source parameters are identical across all runs.

The spatial \(L^2\) integral over all \(K\) dominates the exterior integral at each time, yielding an actual lower bound \(2628M\) on the squared force norm in the recorded normalization. The excluded center still requires the actual final field and integrals. N7-06, N8-05 and the final jets remain open.

```sh
python check_exterior_energy_refinement.py --localization-source /path/to/pinned/localization/source --out exterior-energy-refinement.json
```

The exact intervals and scope are in [the receipt](exterior-energy-refinement.json).
