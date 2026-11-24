# Repeat contribution to the annular energy integral

The original second Repeat candidate has three velocity fields with
live indexed roots 22382206, 22382257 and 22382308, and one pressure
field with root 22382359. Its source uses ten fixed difference/sign
cases and the original 162 signed rows. The archived predecessor wave
uses relative modes \(\pm1,\pm2\); the Repeat increment uses
\(\pm1,\pm2,\pm3,\pm4\). The expansion is taken at fixed \(r,z,\tau\),
fixed auxiliary arguments, and the original fixed signed label.
The physical Fourier index is \(n=m\omega\) on that original row.

Let \(M\) be an unchanged, physical-angle-independent part of the
velocity, \(O\) the preexisting nonzero angular wave and \(V\) the
Repeat wave alone. For the uncut update and normalized physical
angle average \(\langle\cdot\rangle_\theta\), the C148 archived
diagonal covariance sums give
\[
 \frac12\big\langle |M+O+V|^2-|M+O|^2\big\rangle_\theta
       = \frac12(\Delta W_{rr}+\Delta W_{\theta\theta}+\Delta W_{zz}).
\]
The six physical angular covariance increment roots belong to the
C148 append namespace, where IDs differ from the live Repeat field
namespace. The three diagonal roots in that append are
22387074, 22387209 and 22387299. Keep \(\Delta W\) only for the
comparison above and retain the original physical \(b^{2A}\) scaling.

The identity follows by expanding the square, using the zero
physical-angle average of every nonzero integer carrier, and using
the orthogonality of different physical integers. Under the
original C143 fixed-row support and admission premises, there are no
distinct-row products. This applies to the overlapping slow cases
because their admitted fast supports are separated by positive gaps.
Before applying any separation premise the required procedure is to
group equal physical integer frequencies, then take the products.
A plain sum of squared coefficients per row would miss a mixed
product at a colliding integer when both rows have nonzero values.
No assumption of cancellation among distinct corrections is used.

The archived term evidence retains the two mixed families and
the quadratic family separately. If a real angle-independent scalar
\(k\) simply multiplies \(V\), the corresponding terms use \(k\)
on the mixed families and \(k^2\) on the quadratic family. The
following operator is required for the actual cutoff-before-curl.

## Original localization and dissipation

On the physical annulus the radial spatial gate is on its plateau.
For stage \(j\), put \(T_j=C\chi(a_jq)\) for the original outer
space-time gate \(C\) and original \(j\)-th selector \(a_j\).
If \(A_{j,n}\) is the complete same-source vector-potential coefficient
and \(U_{j,n}=(\nabla\times A_j+B_j)_n\) is its uncut gauge velocity,
then the localized stage coefficient is
\[
 V_{j,n}=T_j U_{j,n}+(\partial_z T_j) J A_{j,n},
 \qquad J(v_r,v_\theta,v_z)=(-v_\theta,v_r,0).
\]
Here \(T_j\) is independent of physical angle and of \(r\) on the
plateau. This follows directly from the curl product rule. A stage
cutoff or outer cutoff applied to a previously formed covariance
does not account for the \((\partial_z T_j) J A_{j,n}\) term.
Candidate pressure is separate and does not enter the kinetic
energy.

For a cylindrical coefficient \(a_n\) on \(r>0\), use the three
physical gradient columns in the orthonormal cylindrical frame,
\[
 \mathcal{D}_r a_n=\partial_r a_n,\quad
 \mathcal{D}_z a_n=\partial_z a_n,\quad
 \mathcal{D}_\theta a_n=r^{-1}(in\,a_n+J a_n).
\]
The derivatives hold the remaining physical coordinates fixed.
Use the physically pulled-back coefficient before taking the
derivative. The winding on each fixed label is an integer locally
independent of \(r,z,\tau\), while the remaining carrier phase can
vary in those directions. The \(J\) term also acts on the zero mode.
Using orthogonality, the change in twice the local kinetic energy
density when adding \(V\) to \(U\) is
\[
 \sum_n\big(2\operatorname{Re}(U_n\cdot\overline{V_n})+|V_n|^2\big).
\]
For the change in the local gradient-squared density apply the same
identity to \(\mathcal{D}_a U_n,\mathcal{D}_a V_n\) and sum over
\(a=r,z,\theta\). These densities use the common normalized angular
measure. The cell weights in ANNULAR-WEIGHT.md then account for the
physical radial and axial change of variables and the full angular
measure.

**Open at the first numerical step.** This formula still needs
same-source cell enclosures for the complete localized coefficients
and their physical derivatives, including \(A_{j,n}\) in the cutoff
curl. For the whole final annulus it also needs the actual completed
later stages, original selected cutoffs, and all source joins. The
C148 uncut covariance record is an operand identity. The sufficient
same-field energy budget on the final annulus remains
\(2(E_{\mathrm{ann}}+D_{\mathrm{ann}})\le2^{-21}S_R\) in the
existing normalization. There is no new certified whole-\(K\)
energy or final-field refinement comparison in this packet.
