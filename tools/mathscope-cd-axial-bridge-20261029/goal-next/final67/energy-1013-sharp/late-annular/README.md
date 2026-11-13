# Later correction energy scales

**VERIFIED exact transfer of the existing coarse bound.** The pinned
original selector ledger gives the physical derivative exponent
\(j h/20-\ell'_m\), where \(\ell'_0=4+5h\) and
\(\ell'_1=6+13h/2\). With the annular measure proportional to \(\tau_0\),
the common physical normalizations and the original exterior force scale
\(S_R\), its standalone energy and dissipation ratios retain the powers
\(\tau_0^{-7+(j/10-6)h}\) and \(\tau_0^{-10+(j/10-9)h}\). These
negative powers prevent using this estimate for the numerical budget.
Stage 4 already lies on the two spatial plateaux. The obstruction holds
there even without any outer spatial cutoff derivatives. Stages 2 and 3
additionally need the axial localization terms from their potentials.

**CONDITIONAL sharper source transfer.** The manuscript pp. 113–114
gives spatial cost \(s_x=1/2+h/2\), the retained normalized stage gain
\(jh/10\), and the distinct physical rescalings of potential and direct
velocity. Use these before collapsing them into the common estimate
(9.17). For the actual physical increment, the needed pointwise bounds
are

\[
 |\partial_x^r A_j|\le K_{j,A,r}\,q^{1/2-A+jh/10-rs_x},\quad r\le2,
 \qquad
 |\partial_x^r B_j|\le K_{j,B,r}\,q^{-A+jh/10-rs_x},\quad r\le1.
\]

The constants include the actual finite logarithmic weights, labels and
Cartesian component norms on this slab. They do not require any pressure
or time derivative input. For the correction cutoff, \(q\) depends only on
\(z,t\), and an active derivative of \(\chi(a_jq)\) has \(a_jq\le1\).
The original chart gives \(q_z/q=2\eta q^{-D}/(1-2h\eta^2)\). Its
derivative and \(\eta_z=(1-\eta^2)q^{-D}/(1-2h\eta^2)\) imply
\(|q_z/q|\le3q^{-D}\), \(|q_{zz}/q|\le24q^{-2D}\) on the actual slab.
The stage cutoff derivatives thus cost at most \(q^{-D}\) and
\(q^{-2D}\), with the finite original cutoff constants. The outer radial
cutoff is one on all correction support, and the outer axial cutoff has
the same costs since \(1/2\le q/\tau_0<2\) and \(z_0=\tau_0^D\).
As \(D\le s_x\), the product rule for the complete cutoff-before-curl
velocity yields no higher power loss than \(s_x\) per spatial derivative.

It follows that the normalized velocity and normalized weighted gradient
carry respectively \(\tau_0^{(j/10-1/2)h}\) and
\(\tau_0^{(j/10-1)h}\), absorbing the bounded range of \(q/\tau_0\)
into constants. After squaring, multiplying by the annular measure,
and dividing by \(S_R\), the powers are
\(\tau_0^{(1+j/5)h}\) for energy and \(\tau_0^{jh/5}\) for dissipation.
All three later stages therefore have positive powers in this comparison.
Quantitative closure still requires the actual constants in the two
displayed bounds. Use the norm triangle across stages before squaring
because the correction fields can overlap. The \(j\ge5\) terms vanish
by the independently checked selector growth on whole K.

Run `check_late_annular_scales.py --tail <cut-correction-tail.json>
--out <late-annular-scales.json>` to verify all six original coarse
rows and the sharp affine powers with rational arithmetic. The original
annular bound and N7-06/N8-05 remain open.
