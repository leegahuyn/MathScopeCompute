# Original first-cycle wave pressure in the Repeat residual

**VERIFIED original pressure applications.** The archived materialized Repeat append contains 200 distinct pressure calls, spread over 40 \(W\) capsules in the ten sign/label charts. Each positive harmonic \(m=1,2\) has a real and imaginary pressure capsule with exactly five applications. The four first orders are \(R,Z,Y_0,Y_1\), in slots 1, 2, 7 and 8 after the zero-based origin. Twenty capsule tuples have length 13 and twenty have length 14. The original call keeps its complete formal/actual parameter tuple. The independently pinned active protected metadata agrees on all forty bodies and derivative-order patterns. The twenty active mode-two body roots match the separate C120 native normal-pressure readback.

The materialized archive readback checks all 240 raw scalar outputs. The radial pressure term reads the same-part \(R,Y_0,Y_1\) derivatives and the opposite complex part of the pressure value. The axial term reads the same-part \(Z\) derivative and the opposite pressure value; the azimuthal term reads only the opposite pressure value. Every raw harmonic 3 or 4 has zero pressure input. The whole post-Five mean pressure belongs to the zero-mode pressure gradient, which is linear. The same-run active candidate materialized suffix remains a separate readback.

The complete physical pressure gradient is
\[
  \big(D_R+a_{\rm rad} L,\ 0,\ \varepsilon D_Z\big)\widehat\pi_m
       +imk\,n\,\widehat\pi_m,\qquad \widehat\pi_m=\pi_m/P.
\]
It is multiplied by the original \(P e^{imk\phi}\). The actual \(P\) is constant in native \(R,Z,T,L\), and the original path satisfies \(L v=0\). The two independent \(Y\) derivative applications may each contain a pulse-clock derivative, which cancels in \(L\). The exact radial derivative closure for this grouped pressure term is value, \(R,Z,L,RR,RZ,RL\). No \(T\) pressure derivative enters the raw residual. The 14-row enclosure adds the already needed lower spatial orders and selected same-body mixed \(T\) orders.

## Native pressure and principal relation

With \(q_n=|n|^2\), the actual forced inverse and mapped cutoff produce
\[
 \frac{\pi_{F,m}}P
 =\frac{i\psi(v)}{mkq_n}\left[
       (K^{\mathsf T}n-n_v)\cdot(t_m/P)+P^{m-1}\,n\cdot(f_m/P^m)
   \right].
\]
Both normal terms are retained. A normal source \(f=n\lambda\) has zero projected source and can have zero state while its pressure remains nonzero. The exact test with \(n=f=e_\theta\), \(m=2,k=5\), produces \(\pi=i/10\) and cancels \(f\) by the pressure phase gradient. Omitting \(n\cdot f\) fails that cancellation. The original positive cone supplies the pressure normal reciprocal without a radial Gaussian cost. The actual cutoff and \(P(v)\) appear with their fixed original derivative rules.

The Forced principal equation with the mapped cutoff is
\[
 \partial_v(\psi t_m)+K\psi t_m
 +m^2\varepsilon k^2 q_n\psi t_m
 +imk n\psi\pi_m + f_m=(1-\psi)f_m+\psi_vt_m .
\]
The two exact right-hand terms are the registered Repeat subtractions. Subtracting them from the principal wave block leaves \(-f_m\). The ordinary curl corrections, spatial commutators and remaining nonlinear terms stay in the complete Repeat residual. The homogeneous Primary and Signed pressure use only the moving-normal tangent row \((K^{\mathsf T}n-n_v)\cdot t_{\rm hom}\). Its principal cancellation retains the original \(\psi_v\) tail. An isolated Signed or Primary pressure phase term must still pay the ordinary \(k\) factor in a raw magnitude comparison.

## Conditional pressure bounds

The positive reciprocal, normal row, projector, basis and normalized pulse expansion are recomputed at each order. Mode one uses its original pulse mass \(O(S)\) and Mode two retains the original \(P\) factor with mass \(O(S^{1/2})\). For \(j=r+z+t\) on each original narrow collar, the phase-free Forced pressure bounds keep
\[
\begin{array}{ll}
 m=1 & \varepsilon^{99996/100000} k^{-1}\sqrt{\zeta}\,
          S^{71/4+3j}c^{-(21/2+3j)},\\
 m=2 & \varepsilon^{99999/100000}(2k)^{-1}\zeta\,
          S^{23/2+3j}c^{-(13+3j)} ,
\end{array}
\]
where \(c=u\) or \(d\) for its own radial face. Separate source-only coefficient charges stay below \(H/2^{111}\) and \(H/2^{112}\). The native Signed pressure uses its actual positive Cramer root and the same mixed \(\Sigma\) data. Its explicit factor is \(\sqrt{\varepsilon}/(\varepsilon k)\le1\). The common normalized Signed pressure grade is one with \(\sqrt\zeta\), maximal band \(S^{287/4}\), and finite pole 54. The recorded coefficient log bound is below \(H/2^{106}\). The admitted middle keeps the full fixed-path profiles with no collar pole. The Primary pressure is independently transferred from its original C106 quotient ledger.

Restoring the carrier in the gradient gives the separate Mode One pressure phase grade \(1/2\), ordinary radial grade \(99999/100000\), and ordinary axial grade two. The Mode Two grades are \(99999/100000,74999/50000,249999/100000\), respectively. The radial coefficient's actual \(\varepsilon^{-1/100000}\) is charged. This proves the stated isolated pressure contributions and their finite radial Gaussian bounds under the original admitted profiles. A stronger aggregate epsilon grade requires the complete original principal and nonlinear combination. No conclusion about the full active Repeat append or later correction gate follows from the pressure alone. Final jets remain 0/67 and RELEASE HOLD.

~~~text
python -B verify_pressure_applications.py --work WORK --out pressure-applications.json
python -B verify_repeat_wave_pressure.py --work WORK --goal GOAL_NEXT --runtime ORIGINAL_RUNTIME --applications pressure-applications.json --out repeat-wave-pressure.json
~~~
