# Original near-exterior energy at the temporal cutoff seam

**VERIFIED on the pinned original exterior identification.** The physical cell has \(s=r^2\), \(s_*=\tau_0X_b\), \(4\le y=s/s_*\le8\), \(1/4\le z/z_0\le3/8\), and the complete azimuthal angle. The energy computation uses \(1/2\le\rho=\tau/\tau_0\le17/32\), within the original \(K\). C109 proves \(1/2<q/\tau_0<1\), \(X/X_b>2\), and both spatial cutoff factors identically one on the cell. The original velocity is the nonzero heat swirl \(C K_{\rm sw} e_\theta\), \(C=\chi(\rho)\), with
\[
 K_{\rm sw}=B_h s^{-A}H(Z),\qquad A=1/2+h,\qquad Z=4\rho/(X_b y),\qquad M=AH+ZH'.
\]
The original radial force is retained in the source identification, and its work against the pure swirl is zero. The advective and pressure energy fluxes vanish on the cell faces. The axial gradient and axial flux vanish since both spatial cutoffs are flat and the exterior heat swirl is independent of \(z\) on this cell.

Normalize the physical energy, time-integrated dissipation, forcing work and integrated radial viscous flux by
\[
 N_{\rm cell}=\pi(z_0/8)B_h^2s_*^{1-2A}.
\]
In this normalization the directed quantities are
\[
\begin{aligned}
E(\rho)&=\tfrac12 C(\rho)^2\int_4^8 y^{-2A}H^2\,dy,\\
D&=X_b^{-1}\iint C^2y^{-2A-1}(4M^2+H^2)\,dy\,d\rho,\\
W&=\iint -CC' y^{-2A}H^2\,dy\,d\rho,\\
\Phi&=-4X_b^{-1}\int C^2[y^{-2A}HM]_4^8\,d\rho .
\end{aligned}
\]
The two terms in \(D\) are the radial derivative and the cylindrical angular connection. The outward normals at \(y=4,8\) are respectively \(-e_r,+e_r\). Physical time increases as \(\rho\) decreases, so the initial time is \(\rho=17/32\) and the final time is \(\rho=1/2\).

The temporal FTC ties the actual endpoint difference to the original work with the same \(\chi\):
\[
X_b(\Delta E-W)=-4\iint C^2y^{-2A-1}HH'\,dy\,d\rho,\qquad
\Delta E=E(1/2)-E(17/32).
\]
The symbolic check verifies
\[
 -4\,\partial_y(y^{-2A}HM)
 =y^{-2A-1}(4M^2+H^2-4HH')
\]
from the original radial heat equation \(AM+ZM'=H/4-H'\). Thus the correct balance is \(\Delta E+D-W-\Phi=0\). The interval calculation separately encloses the two endpoint energies, work, dissipation, radial flux and the FTC-correlated endpoint minus work. This preserves the positive original \(X_b^{-1}\) scale even when independent intervals for \(\Delta E\) and \(W\) are too wide to resolve it.

The second interval check also factors out original positive \(h\). The common limiting contribution to both \(X_b D\) and \(X_b\Phi\) is \(C^2/4\) per unit \(d\rho\). The calculation subtracts this analytic common term and keeps the exact positive \(h\) outside the remaining enclosure. It computes \((H-1)/h\), \(H'/h\) and \((y^{-2h}-1)/h\) directly. The normalized Laplace kernel yields alternating eighth-order Taylor enclosures for the first two quantities, with their correct even-order remainder signs. The last quotient uses the outward logarithm and exponential inequalities. Both \(h\) and \(X_b\) retain their original values and are not numerically substituted.

| Independent grid | \(\rho\) cells | Radial cells | Upper relative defect times \(X_b\) | Upper relative defect times \(X_b/h\) |
| --- | ---: | ---: | ---: | ---: |
| Base | 4 | 8 | 0.002316908 | 0.011088890 |
| Radial only | 4 | 16 | 0.001106892 | 0.006262458 |
| Time only | 8 | 8 | 0.002316904 | 0.011085447 |
| Both | 8 | 16 | 0.001106888 | 0.006259093 |

The table divides each enclosure of the absolute defect by a directed lower endpoint-energy bound. It gives outward decimal upper values. On the joint grid the relative enclosure is below \(0.0063\,h/X_b\). The independent correct-flux enclosure contains zero. Omitting the viscous flux gives a strictly positive scaled defect \(X_b(\Delta E+D-W)>0.007455181\). Reversing the flux gives \(X_b(\Delta E+D-W+\Phi)>0.015267680\). The same controls fail on the adjoining source-admitted plateau \([15/32,1/2]\), where work is exactly zero and the outward flux is still positive. That auxiliary interval does not enlarge the original \(K\).

The near-exterior flux and transition calculation uses a different physical normalization and domain from the previous distant exterior refinement. It remains a restricted patch. Whole \(K\) N7-06 and N8-05, the annular final-field integral, and final jets remain open. RELEASE HOLD.

~~~text
python -B verify_near_exterior_energy.py --workspace WORKSPACE --goal GOAL_NEXT --out near-exterior-energy.json
~~~
