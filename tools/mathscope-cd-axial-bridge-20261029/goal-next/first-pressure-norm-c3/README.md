# Actual third-order pressure and Temporal transfers

This extension uses the same authenticated corrected first cycle from GitHub Actions run 43010593847, the same 4,456,994-node source graph and native registry, and the same admitted original reference chart as the preceding pressure estimate. The replay rereads both actual normalized \(T_0\) pressure bodies, the actual \(T_1\) potential and its derivative branches, and the source definitions of the cutoff and compact normalization. All norm constants below are exact rational or integer upper bounds. Let
\[
 M=\max(1,2\sqrt{X_b},(\sqrt{X_a})^{-1})\le\mathrm{C12EnvelopeR}.
\]
Each \(C^m\) norm is the maximum over the original ordinary chart partials of order at most \(m\) in \((R,Z,T,Y_0,Y_1)\) with the reference band frozen. The operator transfers assume these input derivatives exist with the stated uniform norms on the source shell. Axis and strict exterior values use the established zero extensions.

| Actual output | Bound |
| --- | --- |
| Normalized mean pressure difference, \(C^3\) | \(2^{108}M^5\|\#4455275-\#3614891\|_{C^3}\) |
| Actual Temporal potential \(\psi=\#4454155\), \(C^3\) | \(2^{62}M^6\|\gamma_d\|_{C^3}\), \(\gamma_d=\#4454011\) |
| Actual radial velocity \(\beta=\#4454158\), \(C^2\) | \(\epsilon M^5(2^{39}\|\partial_Z\gamma_d\|_{C^2}+2^{57}\|\gamma_d\|_{C^2})\) |
| Actual axial velocity \(\gamma=\#4454167\), \(C^2\) | \(2^{58}M^5\|\gamma_d\|_{C^2}\) |
| Actual direct swirl \(\Delta v=\#4454009\), \(C^2\) | The \(C^2\) norm of the same desired theta inverse velocity |

## Source geometry and derivative bounds through three

For \(F(s,Z,T)=s-Z^2s^{2h}-T\), use the original \(\frac12\le s\le2\), \(|Z|<2\), \(0<h<1/64\), and \(F_s>1/2\). The preceding bounds are \(s_1=16\) and \(s_2=552\). The only third partial derivatives of \(F\) that may contribute are \(F_{sss},F_{ssZ},F_{sZZ}\), bounded by \(4,1,1/4\). Writing each slow tangent to the chart as \((s_i,e_i)\), differentiating \(F=0\) three times gives one \(F_s s_{ijk}\), one third differential of \(F\) on three first tangents, and three second differential terms coupling the second and first tangents. This gives
\[
 s_3\le 2\bigl(4s_1^3+3s_1^2+3s_1/4+3s_2(s_1+1/2)\bigr)
      =88976<2^{17}.
\]
For the exact patch coordinate \(b=10(R/(x_0\sqrt{s})-1)\), the reciprocal scale has third derivative bounded by
\(2(15s_1^3+9\cdot2^{10}s_1+2^{17})=679936\).
On the active transition \(R/(x_0\sqrt{s})\le11/10\), this and the mixed \(R\)-derivative estimate give \(b_3<2^{22}\). Here \(b_1<2^8\) and \(b_2<2^{15}\) are the previous bounds.

Differentiating the original square seed \(a(u)=e^{-1/u^2}\) three times gives
\[
 a'''(u)=(8u^{-9}-36u^{-7}+24u^{-5})e^{-1/u^2}.
\]
For \(0<u\le1\), replacing each odd power of \(1/u\) by the next even power and using \(x^ke^{-x}\le k!\) bounds this by \(1968\) in absolute value. Differentiating \(\sigma(a(u)+a(1-u))=a(u)\) three times and using the earlier denominator \(1/81\), seed derivatives and quotient derivatives gives \(|\sigma'''|\le839446416<2^{30}\). The exact third-order chain rule gives \(\|\chi\|_{C^3}\le2^{55}\). All positive-order step derivatives vanish on the outer branches.

For the compact normalizer, the third derivative of the linear seed \(e^{-1/u}\) is \((u^{-6}-6u^{-5}+6u^{-4})e^{-1/u}\) and has bound \(1584\). The compact seed \(e^{-1/u}e^{-1/(1-u)}\) has third derivative bounded by \(2\cdot1584+6\cdot36\cdot2=3600\). With the exact constant normalizing mass and the reciprocal scale derivatives, the resulting bound is \(\|\rho\|_{C^3}<2^{51}\).

## The third derivative of the actual shifted integrals

The exact phase \(\Phi\) has \(1<d_r<3/2\), a positive coefficient at most one, and \(|\Phi'|\le2M\), \(|\Phi''|\le M\), \(|\Phi'''|\le M^2\) on the original shell. At fixed radial binder \(r\), write the actual translated input as \(g=f(r,Z,T,Y+(\Phi(r)-\Phi(R))v_r)\). The third derivative in the external radial variable has the three terms \(-\Phi'''Lf+3\Phi'\Phi''L^2f-(\Phi')^3L^3f\), where the common radial torus vector has \(\ell^1\) norm below two. Thus the third shifted derivative constant is \(2+24+64=90\) multiplying \(M^3\|f\|_{C^3}\). The other mixed third partials have smaller bounds because the external shift depends only on \(R\).

For the actual partial integral \(I(R)=\int_{R_i}^R g(r,R)\,dr\), the two positions of \(R\) at the diagonal endpoint must both be differentiated. The exact third derivative is
\[
 I_{RRR}=f_{RR}(R)+g_{rR}(R,R)+2g_{RR}(R,R)+\int_{R_i}^R g_{RRR}(r,R)\,dr.
\]
Here \(|g_{rR}(R,R)|\le (4M+16M^2)\|f\|_{C^2}\), and \(|g_{RR}|\le18M^2\|f\|_{C^2}\). Mixed third derivatives have no greater coefficient. This gives \(147M^4\|f\|_{C^3}\) for the partial and \(90M^4\|f\|_{C^3}\) for the fixed whole \(J\). With the checked cutoff derivatives, \(T_0 f=I-\chi J\) costs at most \(2^{56}M^4\) on \(C^3\).

For the actual mean pressure difference use \(f=\Delta g_r-\rho\Delta P\). The normalized Haar and whole radial integrals give \(\|\Delta P\|_{C^3}\le M\|\Delta g_r\|_{C^3}\). The compact normalization costs at most \(2^{52}M\) through three, proving the first row. For the actual Temporal potential use \(\psi=R^{-1}T_0(R\gamma_d)\), with \(4M\) as a \(C^3\) bound for multiplication by \(R\) and \(j!M^{j+1}\) for the \(j\)-th derivative of \(R^{-1}\). This proves the second row.

## Which third-order inputs the realized velocity actually needs

The source curl is \(\beta=-\epsilon\psi_Z\) and \(\gamma=(\partial_R+\Phi'L+R^{-1})\psi\). The graph replay checks the actual shifted \(L\)-integrals \(\#4454139,\#4454140\), both native inverse derivative orders and their formal-to-actual torus shift. The graph's explicit FTC root \(\#4454182\) reduces exactly to \(\#4454184=\#4454011-\#4454181\), with \(\#4454181=R^{-1}\chi_R J(R\gamma_d)\). The actual curl root \(\#4454167\) equals this explicit FTC expression by differentiating the same retained potential. The shifted \(L\) terms cancel between the ordinary radial derivative and the \(\Phi'L\) part. The cutoff term remains explicitly in the formula. An opposite-sign cutoff control fails the exact identity.

Since \(\Phi\), the radial endpoints and the reference \(\epsilon\) have no \(Z\) dependence, the exact radial velocity is
\[
 \beta=-\epsilon R^{-1}\bigl[T_0(R\partial_Z\gamma_d)-\chi_Z J(R\gamma_d)\bigr].
\]
The replay binds the actual \(\chi_Z\) and \(\chi_R\) derivative roots to the original patch argument and verifies that the actual native potential application in \(\beta\) uses its \(Z\)-partial. The \(C^2\) bound for either \(\chi_Z J/R\) or \(\chi_R J/R\) applied to \(R\gamma_d\) is \(2^{57}M^5\|\gamma_d\|_{C^2}\) by the previous partial/whole estimates, the new \(C^3\) cutoff bound, and Leibniz. The first term of \(\beta\) costs \(2^{39}M^5\|\partial_Z\gamma_d\|_{C^2}\). In these bounds, only the radial component uses third-order desired-axial derivatives, with a distinguished \(Z\) derivative. The axial and direct swirl components use desired inverses through order two.

For the same original zero-mode inverse, the available two-extra-derivative estimate would use \(\|E_\theta\|_{C^4}\), \(\|E_z\|_{C^4}\) and \(\|\partial_Z E_z\|_{C^4}\) on these actual sources. The exact raw bodies are \(\#4229105\) and \(\#4229480\). The last input is fifth-order only with a distinguished \(Z\) derivative, since the original fixed \(c_{i_0}\) commutes with \(\partial_Z\) and the zero Fourier mode is projected. The Fourier proof directly uses \(\partial_{Y_j}^2 D^\alpha\) of those three input functions for \(|\alpha|\le2\). Their actual uniform source norms remain open. This transfer does not supply the other first-cycle Cartesian gauge and wave pressure estimates, the actual first cutoff \(C,P\), or final jets. RELEASE HOLD.

Reproduce from the evidence package using the pinned repository and extracted GitHub graph.

    python first-pressure-norm-c3/check_first_pressure_c3.py --repo <repository> --artifact <extracted-run-43010593847> --pressure-receipt pressure-exterior/corrected-pressure-exterior.json --c2-receipt first-pressure-norm/first-pressure-norm.json --out first-pressure-c3.json

