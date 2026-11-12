# Transverse norm for the last initialized mean covariance input

**VERIFIED.** A Fourier estimate for the original two-torus requires only transverse derivatives in its two extra orders. The replay checks both local \(W_{rz}\) bodies, the six native primary potentials, all 162 signed common-torus rows, their original fixed-label maps, and the actual Volterra and positive covariance-weight inputs. The two extra derivatives act entirely on the explicit transverse cutoff. Its needed orders through three have exact integer bounds.

**CONDITIONAL.** For the last late-pressure term the actual slow weighted target needs the finite directional order-seven set listed below, and the actual slow \(F,G\) need the displayed directional order-eight set. This avoids using the generic target C9 and background C11 requests for this term. The directional high slow norms remain symbolic. This result does not lower any separately retained all-component norm request. Final jets 0/67, N7-06 and N8-05 OPEN, RELEASE HOLD.

## The remaining actual term

Use \(L=v_r\cdot\partial_Y\), \(N=v_t\cdot\partial_Y\), with \(v_r=(1,1-\sqrt2)\) and \(v_t=(\sqrt2-1,1)\). The previous stage-zero source replay gives the early pressure \(W_{rz,ZZ}\) partial at \(\#643048\) and the late radial viscosity Temporal \(\psi_{T,ZZZ}\) partial at \(\#3613979\). The highest axial derivative in the late pressure, before its physical scale factor, has the term
\[
 -\epsilon^6c_{i_0}^{-1}
  T_0 T_1 N^{-1}P_\perp T_0\bigl(\partial_Z^6W_{rz}\bigr).
\]
Here each \(T_e\) is its original shifted radial operator, \(P_\perp\) removes the Haar mean, and a derivative on a radial cutoff leaves a lower axial order on \(W\). The coefficient follows from \(-\epsilon^4T_0\psi_{T,ZZZZ}\) in late pressure, the actual \(\psi_T=T_1(-c_{i_0}^{-1}N^{-1}P_\perp E_z)\), and the early \(E_z\) term \(-\epsilon^2T_0W_{rz,ZZ}\). Both early pressure centering and the high late Temporal centering have zero contribution to this term. The three fixed radial operators commute with \(N^{-1}P_\perp\) and with \(L\), by torus translation invariance, their auxiliary-independent cutoffs, and the uniformly convergent inverse series below. Their fixed unweighted bounds apply at order zero to the highest term.

## Exact anisotropic Fourier bound

Set \(\alpha=\sqrt2-1\), \(t_k=\alpha k_0+k_1\), \(r_k=k_0-\alpha k_1\), and \(n=\|k\|_\infty\). For \(n\ge1\), the nonzero quadratic norm gives \(|t_k|\ge1/(4n)\). On a dyadic shell \(N\le n<2N\), two different \(t_k\)'s are separated by at least \(1/(16N)\). As in the previous proof, \(\sum_{\rm shell}|t_k|^{-2}\le1024N^2\).

The inverse linear transform gives \(\max(|t_k|,|r_k|)\ge2N/3\), since \(0<\alpha<1/2\). On \(|t_k|\le N/2\) it follows that \(|r_k|\ge2N/3\). This part of \(\sum_{\rm shell}|t_k|^{-2}(1+|r_k|^4)^{-1}\) is bounded by \(5184/N^2\). On \(|t_k|>N/2\), fix \(k_1\). For each integer \(j\ge0\) the strip \(j\le|r_k|<j+1\) contains at most two \(k_0\)'s. Their weight sum is at most \(2(1+\sum_{j\ge1}j^{-4})<6\). There are at most \(4N\) values of \(k_1\), and \(t_k^{-2}<4/N^2\), so the second part is bounded by \(96/N\). Summing dyadic shells gives an exact bound \(7104<85^2\). Parseval and Cauchy–Schwarz now give on the original normalized torus
\[
 \|N^{-1}P_\perp f\|_\infty
 \le \frac{85}{6}\|f\|_2+\frac{85}{216}\|L^2f\|_2 .
\]
Use the exact multipliers \(2\pi i\,t_k\) and \(2\pi i\,r_k\) and \(\pi>3\). The proof of the pointwise inequality also gives the dyadic tail bound with square sum at most \(6912/N^2+192/N\). In \(L^2\) itself,
\[
 \|N^{-1}P_\perp f\|_2\le\|f\|_2+\tfrac16\|Lf\|_2 .
\]
For \(|t_k|\ge1\) this follows directly. For \(|t_k|<1\), use \(|t_k|^{-1}\le4n\le6(1+|r_k|)\) and Parseval. These estimates apply to the original registered infinite inverse with no finite-mode replacement.

## Actual local cutoff and complete cover

The actual normalized local \(W_{rz}\) bodies have roots \(\#627174,\#630592\). Removing their original seven zero exterior guards gives \(\#627167,\#630585\). Both are exactly sums of terms proportional to \(\chi^2\) or \(\chi\chi'\), with \(\chi=\#623043\). The six native potential bodies \(\#625322\)–\(\#625324\) and \(\#628773\)–\(\#628775\) each carry exactly one \(\chi\); the checker verifies the distinct actual formal and actual \(\xi\) slots for every retained native partial. The transverse mass in the H solve binds \(\xi\) inside its integral and gives no free transverse derivative.

To exhibit the complete curl, write \(C_\theta=\chi U_\theta\), with \(U_\theta=(n\times A^0)_\theta/(k|n|^2)\). Here \(A^0\) is the actual weighted primary amplitude stripped of its one transverse factor, still carrying \(\sqrt{\epsilon}\sqrt{y}\), the longitudinal cutoff, the original normalized pulse, and the slow partition. Tangency makes the leading real curl coefficient \(\chi A^0\). The radial and axial imaginary coefficients are exactly \(-\epsilon\chi\,U_{\theta,Z}\) and \(\chi(U_{\theta,R}+U_\theta/R)+a_{\rm fast}\chi' U_\theta\). Hence the angular covariance is
\[
 W_{rz}^{\rm loc}
 =\tfrac12\chi^2\!\left[A_r^0A_z^0-
      \epsilon U_{\theta,Z}(U_{\theta,R}+U_\theta/R)\right]
  -\tfrac12\epsilon a_{\rm fast}\chi\chi' U_{\theta,Z}U_\theta .
\]
There is no derivative of an angular phase in this average.

The actual common-torus registry row preserves \(\xi=v_r^\top J_g^\delta(Y-\mathrm{center}-\mathrm{copy})/D_{\rm geom}\), \(v=(r_0+v_t^\top J_g^\delta(Y-\mathrm{center}-\mathrm{copy})/D_{\rm geom})/c_i\). The checker verifies both columns of the exact derivative maps and all five integer matrices \(J_g^\delta\) for each of the 162 rows. Since the original vectors are orthogonal eigenvectors, \(L\xi=\Lambda^\delta\) and \(Lv=0\). The label and copy are frozen during differentiation. The original flat joins supply the extended derivatives. The original \(Z\) map and covariance prefactor give the exact slow scale ratio power \(2A+6D=4-4h<4\), with ratio at most four. Thus the global norm costs at most \(162\cdot4^4\) times its local bound, with the extra \(\Lambda^8\) factor for \(L^2\). There is no longitudinal derivative in this estimate.

The original \(\chi\) equals one for \(|\xi|\le r_0/4\), zero for \(|\xi|\ge3r_0/4\), and \(\sigma_2(3/2-2|\xi|/r_0)\) in between, with \(r_0=2^{-34}\). For the original seed \(e^{-1/t^2}\) the exact derivative majorants through three are \(1,4,36,1968\). The positive denominator in \(\sigma_2\) is at least \(e^{-4}>1/64\). Apply the quotient recurrence and multiply by \(2^{35j}\) on the transitions to obtain each integer \(\chi\) bound in the receipt. On the plateau and exterior the positive-order derivatives vanish. The second derivatives of the two monomials are \(2(\chi')^2+2\chi\chi''\) and \(3\chi'\chi''+\chi\chi^{(3)}\), respectively. All endpoint derivatives are supplied by the original flat extension.

## Exact directional slow program

The maximum local slow jet set for \(A_r^0,A_z^0,U_\theta\), the two live normalized target components, and the pulse/weight calculations is
\[
 \mathcal D=\{(0,j):0\le j\le7\}\ \cup\
             \{(1,j):0\le j\le6\},
 \qquad (r,z)\equiv\partial_R^r\partial_Z^z .
\]
This includes the \(\partial_Z^7U_\theta\) term and \(\partial_R\partial_Z^6 U_\theta\) in the actual curl. The six derivatives of \(A_r^0A_z^0\) use only the lower part. The target \(T=(\#623781,\#623788)\), covariance matrix H, determinant \(\#623792\), and positive square roots \(\#623824,\#623825\) remain exact source operands. All H entries are full original pulse integrals, with fixed endpoints. The actual two Volterra matrices have native \(F,G\) leaves only through first slow derivatives. The same is true of the explicit \(n,n',B,B'\) in the frame. Here \(B'\) is a pulse derivative of the moving basis, so it adds no slow derivative. Therefore the genuinely required \(F,G\) slow inventory is \(\mathcal D\cup(\mathcal D+(1,0))\cup(\mathcal D+(0,1))\). Its highest jets are \(\partial_Z^8\), \(\partial_R\partial_Z^7\), and \(\partial_R^2\partial_Z^6\). There is no slow \(T\) derivative in this last term. In a generic source generator these input degrees may be requested as full C7/C8 rows, but no higher slow degree is used here.

The receipt provides every exact multi-index binomial split for the finite bound program. Use product, positive inverse and square-root recurrences on the actual frame. For the normalized Volterra system use \(U_w(0)=W\) for the zero-order stable bound and
\[
 U_w(\nu)\le L_s W\!
 \sum_{0<\beta\le\nu}\binom{\nu}{\beta}U_M(\beta)U_w(\nu-\beta).
\]
The initial data \(w(0)=(1,0)\) have zero slow derivative. This is the original stable propagator bound \(W\), not an exponent growing with the angular carrier. The Gaussian \(P(v)\) is independent of slow derivatives at the fixed representative and stays in \(t=B P w\). Bound H via its full integrals and the H inverse by differentiating \(HH^{-1}=I\), with the original \(|\det H|\ge d_*/S\). Then \(y=H^{-1}T\) is weighted and the original \(y\ge c_y\zeta\) gives the square-root recurrence with one \(\sqrt\zeta\) and finite poles. The original \(n,n_t,c_0\) lower bounds keep every other inverse valid. Absorb the resulting finite Gaussian pole in the already proved two-edge manner. With any common resulting bound \(U\) on the selected jets, local covariance bounds are
\[
 32 U^2\big((2+R_*)B_{\chi^2,j}+a_{{\rm fast},\max}B_{\chi\chi',j}\big),\quad j=0,2 .
\]
Here the factor \(32\) includes the angular half and \(2^6\) from the exact six axial Leibniz terms. The fixed \(a_{{\rm fast},\max}\) is finite on the original whole-K chart by the original radial phase scale. The common row factors above and the anisotropic inverse bound close this last norm as soon as its directional target and \(F,G\) leaves are supplied. The complete physical stage-zero bound also requires the other lower-direction terms of the previous route.

## Replay

GRAPH is the extracted corrected first-cycle source from GitHub run 43010593847. SHARP is the earlier directional-mean-proof.json with its pinned SHA-256. Python uses only its standard library. The Node supplement independently checks the literal axial and covariance reference powers at every original row. Both stream the original graph and write only the named JSON.

```text
python check_transverse_wrz.py --graph GRAPH --sharp SHARP --out transverse-wrz-bound.json
node check_transverse_axial_scale.mjs GRAPH transverse-wrz-bound.json transverse-axial-scale.json
```

This is an analytic and exact-source reduction. No new Lean theorem or numerical bound on the high slow leaves was supplied.
