# One source datum, explicit continuation bounds, and the remaining proof boundary

This document describes the mathematical implications used by
`refine_continuation.py`. It is part of the evidence, not a generated Lean proof.
The rational comparisons are executable, the finite moment-map comparison is
independently expanded in `independent_map_bound.py`, and the function-space
existence/identification statements still use the published Appendix B theorems.
No finite collection of sampled fluid values is used to infer a uniform bound.

The selected datum is `uniform-source-debt-final.json`. Its axis certificate is
`source-axis-cone-refined.json`; its newly computed, rounded interval prefix is
`axis-prefix-final.json`. The old `uniform-source-debt-small-j.json` is preserved
as an earlier, different datum. In particular its rational activation widths are
not claimed to satisfy the comparisons below.

## 1. Definitions, domain and source anchors

The paper is the pinned 166-page *Finite Time Blowup for Navier–Stokes*, SHA256
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.
The associated repository commit is
`f9e8bc5b38b6e212696e8a30e3e91517af887bbd`.

| Argument | Paper anchor | Formal source or executable input |
|---|---|---|
| Physical parameter range | (4.1), pp.24–25 | The profile parameter is \(\eta=z/q^D\), with \(\tau=q(1-\eta^2)>0\) |
| Five moments and reconstruction | (4.15)–(4.16), pp.27–30 | `exact-polynomial.mjs`, `independent_core.py` |
| Cone variables and quadratic test | (4.20)–(4.22), pp.30–31 | `independent_map_bound.py` |
| Same pressure at every radial scale | A.21–A.23, Lemma A.5, pp.133–134 | `pressure-analytic.mjs`, `datum-ledger.mjs` |
| Infinite coefficient ball | B.4–B.16, pp.144–148 | `AxisCoefficientSpace.lean`, `AxisContraction.lean`, `refine-axis-certificate.mjs` |
| Exact natural core | B.14–B.18, pp.147–149 | `NaturalAxisBridge.lean`, `NaturalCoefficientBridge.lean` |
| Reference cutoff and its controls | B.22–B.25, pp.150–151 | The exact radial integrals used below |
| Activation, flat factor and shear changes | B.26–B.32, pp.152–154 | `refine_continuation.py` |
| Long shape transition | B.33–B.39, pp.154–156 | `uniform-source-debt-final.json` |

Every occurrence of “all parameters” or “uniform” below means
\(\eta\in[-1,1]\). It does **not** mean \(\eta\in\mathbb R\).
For positive physical time-to-endpoint \(\tau\), (4.1) gives
\(|\eta|<1\); the endpoints \(\eta=\pm1\) describe the corresponding one-sided
limits. Thus the compact interval is the original profile domain. This is not
the unrelated substitution \(z/\sqrt{1+z^2}\).

Write

\[
A=\tfrac12+h,\quad D=\tfrac12-h,\quad d=1-\eta^2,
\quad L=1-2h\eta^2,\quad L_{\min}=1-2h,
\]
\[
U_*=4\eta+j,\quad H_*=D\eta+dU_*,\quad
W_*=1-2D\eta U_*-4d=-3+8h\eta^2-2Dj\eta,
\]
\[
\chi=\frac{H_*^2}{H_*^2+\sigma_*^2},\qquad
\xi_0=-\frac{\Lambda L H_*}{H_*^2+\sigma_*^2}.
\]

The radial variable in the axis coefficient space is \(Y=\Lambda X\).
The selected positive amplitude is
\(g(\eta)=\exp(\Lambda\,\mathrm{phase}(\eta)-\log C)\), and
\(F=g\Phi\), \(E=\sqrt{2X}F\), \(U=U_*+u/\Lambda\).
Here \(F\) denotes the regular angular factor, not a finite Taylor polynomial.

## 2. Refining the infinite fixed point for the low-chi margin

The frozen source generator gives a remainder bound \(B\), a remainder
Lipschitz bound, a common analytic coefficient radius \(\rho\), and an axis
threshold. Those bounds are uniform for \(\Lambda\ge1\) and normalized amplitude
norm at most two. Its original choice makes the displacement from the reference
pair at most \(1/400\). That is sufficient for positivity of \(\Phi\), but does
not by itself imply an axial margin of size \(\delta_*=10^{-11}\).

`refine-axis-certificate.mjs` reruns that generator and selects

\[
\Lambda=\max\left\{\Lambda_{\rm source},
\left\lceil\frac{50B}{\delta_*}\right\rceil\right\},
\qquad R=\frac B{2\Lambda}\le\frac{\delta_*}{100}.
\]

The unchanged controlled-remainder estimate therefore applies to the **new**
fixed point. The normalization threshold is changed to
\(\log C\ge\Lambda\,\mathrm{phaseUpper}+1\). No old finite axis array is asserted
to equal this new sequence. Its 1024-bit interval recurrence is recomputed.

Set \(r=41/10\) and \(q=1-r/20=159/200\). If
\(e=\Phi-f_0(Y\chi)\), the weighted coefficient norm gives on the whole rectangle

\[
|e|\le R/q,\qquad |e_Y|\le e_Y^+:=R/(20q^2),\qquad
|e_\eta|\le e_\eta^+:=R/(4\rho q^2).
\]

These estimates follow by summing the positive geometric series and its first
derivative after dropping only factors that are at most one. The same radial
derivative estimate holds for the error in
\(u_0=-YZ_*/(2L)\). In particular

\[
|n_s-Z_*/L|\le2e_Y^+<\delta_*/2.
\]

The source's interval cutoff cover verifies
\(\chi\le.99\Rightarrow |Z_*|>\delta_*\). Hence the refined natural core has a
nonzero axial margin in that region. This implication is not inferred from the
eta-zero display jet.

The alternating real series gives, on \(0\le z\le4.1\),

\[
0<c\le\Phi\le 1+R/q=:\Phi_+<2,
\qquad -1/4\le f_0'(z)<0.
\]

The lower constant is the source's exact cubic lower bound minus \(R/q\).
All mixed derivative bounds used below come from

\[
b_{k,m}=
\frac{M(k+m)!}{20^k\rho^m(m+1)^2q^{k+m+1}},
\]

where \(M\) is the generated upper bound for the full infinite sequence. A
conservative old upper bound for \(M\) remains valid after the refinement.

## 3. A quantitative lower bound for the actual source

The exact source formula is

\[
S_q=-Wl-h(1-2\eta U)-H_c(\log E)_\eta,
\qquad H_c=D\eta+dU,
\]

with \(l=1+Y\Phi_Y/\Phi\) in the natural core. The reference cutoff multiplies
the logarithmic slope by a number in \([0,1]\); its additional parameter-gradient
error is bounded by the integral of the cutoff slope derivative.

Let \(\delta_U\) and \(\delta_{U,1}\) be the **new** upper bounds for
\(|U-U_*|\) and \(|U_\eta-4|\), respectively. They include the actual axis
\(b_{00}/\Lambda\), \(b_{01}/\Lambda\) terms and the newly decreased activation
integrals. Put \(\delta_W=\delta_U+\delta_{U,1}\), \(W_+=4+\delta_W\).
The final certificate retains these terms separately. Replacing them merely by
\(j\) would not be sufficient: it would lose the useful \(O(1/\Lambda)\) error.

On the real parameter interval, the elementary bounds are

\[
|H_*|\le5,\quad |H_*'|\le9,\quad
\sqrt{H_*^2+\sigma_*^2}\le6,
\quad H_*\chi'=2H_*'\chi(1-\chi).
\]

Thus

\[
-H_c\xi_0\ge\Lambda L\chi
-\frac{\Lambda\delta_U}{\sigma_*}\sqrt\chi.
\]

In the remaining gradient, the part containing \(H_*f_0'Y\chi'\) costs at most
\(r\,9\chi/(2c)\). The part containing \(H_*e_\eta\) costs at most
\(6e_\eta^+\sqrt\chi/c\). Replacing \(H_*\) by \(H_c\) costs at most

\[
\frac{\delta_U}{c}\left(\frac{9r}{2\sigma_*}+e_\eta^+\right).
\]

The logarithmic radial slope costs at most
\(W_+r\chi/(4c)+W_+r e_Y^+/c\). The remaining axial and gradient-integral errors
are bounded by \(\delta_W+11h+6\delta_\ell\), where \(\delta_\ell\) is the
computed bound for the additional eta derivative of \(\log F\).

Consequently the code computes exactly

\[
B_\chi=\frac{W_+r}{4c}+\frac{9r}{2c},\qquad
B_{\sqrt\chi}=\frac{\Lambda\delta_U}{\sigma_*}+\frac{6e_\eta^+}{c},
\]
\[
B_{\rm c}=\delta_W+\frac{W_+r e_Y^+}{c}+11h
+\frac{\delta_U}{c}\left(\frac{9r}{2\sigma_*}+e_\eta^+\right)+6\delta_\ell.
\]

The comparison \(B_\chi<\Lambda L_{\min}/100\) is checked rationally. Young's
inequality gives

\[
B_{\sqrt\chi}\sqrt\chi
\le\frac{\Lambda L_{\min}}{20}\chi
+\frac{5B_{\sqrt\chi}^2}{\Lambda L_{\min}}.
\]

Therefore, throughout the natural core and the reference continuation,

\[
S_q\ge .94\Lambda L\chi+
3-8h-j-B_{\rm c}-\frac{5B_{\sqrt\chi}^2}{\Lambda L_{\min}}.
\]

The last constant has the certified rational value displayed as
\(2.9999998098995113\), and in particular is greater than \(12/5\).
No division by \(\chi\) was made at a zero of \(H_*\).

Positive \(S_q\) and the exact integrated natural-core identity imply
\(p_1>0\), hence \(\Phi_Y<0\) away from the axis. Cutting this nonpositive
logarithmic slope between zero and itself keeps
\(c\le F_{\rm ref}/g\le\Phi_+<2\). The positive integral representation now gives

\[
Q_{s,\rm ref}\ge\frac c2,
\qquad p_{1,\rm ref}\ge\frac{2c}{\Lambda}
\quad(X_0\le X\le110).
\]

The ratio \(g(\eta)\) cancels inside the radial integral. These are not lower
bounds obtained by substituting an underflowed value of \(g\).

## 4. The whole-reference endpoint alternative and Vmax

On \(\chi>.99\), the alternating series estimate in B.19 is
\(f_0(z)+zf_0'(z)<-.18\), for \(z=4\chi\). Its derivative comparison gives

\[
p_1(4/\Lambda)\ge
2+\frac{2(.18-R/q-4e_Y^+)}{\Phi_+}>2.3.
\]

Since the reference logarithmic slope is at most one and
\(S_{q,\rm ref}\ge.94\Lambda L\chi+2.4\), the equation
\(D_Xp_1=XS_q/L-lp_1\) prevents a downward crossing of \(2.3\) in this region.

On \(\chi\le.99\), compare the exact axial source to \(Z_*\). The code uses

\[
|S_{n,\rm ref}-Z_*|
\le5r b_{10}/\Lambda+22\delta_{U,\rm ref}
+5\delta_{U,\rm ref,1}
+(880J_1+2200)\exp[-2(\log C-\Lambda Z)]<\delta_*/2.
\]

Here \(Z\) is the source's generated upper bound for \(|\zeta_*|\),
\(J_1\) bounds the eta derivative of the reference logarithmic factor, and the
last term bounds the forward pressure increment and its first derivative. It
comes from \(|F_{\rm ref}|\le2e^{-\log C+\Lambda Z}\) on \([0,110]\), not from
the pressure at a sampled eta value. The first three terms follow by subtracting
the explicit polynomial source at \(U_*\), using the reference cutoff derivative
bound. The equation \(D_Xn_s+n_s=S_n/L\), together with the natural-core margin,
preserves the sign and \(|n_s|\ge\delta_*/2\).

Put \(\mathcal L=\log C+\Lambda Z\). The lower angular bound is

\[
E_{\rm ref}^2\ge\frac8\Lambda c^2 e^{-2\mathcal L}.
\]

Using the already computed \(p_1^+\), \(n_s^+\), define

\[
V_A=\left\lceil p_1^+
+\frac{(110n_s^+)^2\Lambda^2}{16c^3}+1\right\rceil.
\]

Then \(v_r=p_{1,r}+p_{2,r}^2/p_{1,r}\le V_Ae^{2\mathcal L}\). The large-C check
on the complementary low-chi region is also explicit:

\[
\frac{p_{2,r}^2}{p_{1,r}}
\ge\frac{\delta_*^2}{220\Lambda^2p_1^+}
 e^{2(\log C-\Lambda Z)}>3.
\]

The last strict inequality uses a positive integer bit-length upper bound and
\(e^t>2^t\), with no numerical exponentiation of \(C\). Thus the two regions
cover the whole parameter interval and give \(v_r>2.3\) everywhere on the
reference continuation. For \(X\ge100\), the positive comparison also gives
\(p_{1,r}>3\), with considerable spare margin.

## 5. The comparison constant: a field-to-moment derivation

### 5.1 Meaning of B0 and Gamma

The integer \(B_0\) in the JSON is \(10^6(1+\sum\lceil|b_i|\rceil)^4\).
The list includes the generated pressure bounds through order three, logarithmic
angular bounds through order three, \(p_1,n_s\) through two eta derivatives,
the finite radial log length, \(\Lambda/c\), \(1/X_0\), \(1/L_{\min}\), and the
reference slope bounds through order three. Its value is written as a 2497-digit
integer. Set

\[
\Gamma=B_0e^{\mathcal L}\ge1.
\]

On the intervals to which the small comparison is applied, both angular fields
are at most one, both axial fields and their first eta derivatives have magnitude
at most five, all five moments and their first eta derivatives are bounded by
\(B_0\), and \(|\Pi_0|,|\Pi_0'|\le B_0\). The regular lower angular bounds give
\(1/E,1/H\le\Gamma\). Also
\(1/p_{1,r}\le B_0\), \(|p_{2,r}|\le\Gamma\), \(|p_{1,r}|\le B_0\).
The latter three comparisons are checked directly using the generated rational
bounds in `referenceRatiosBelowGamma`.

The moments do not introduce an unbounded integral at zero. On the core the
regular factor \(F\) bounds \(C_p=\int F^2dX\) and its derivatives. Differences
of the fields vanish before \(X_0\); their pressure difference can also be bounded
in the finite logarithmic interval. The upper radial limit is 110.

### 5.2 Input differences

Let \(v=\log(F/F_r)\), \(w=U-U_r\), and let \(s\ge0\). On activation take
\(s=ye_a(y)\); monotonicity of \(e_a\) and the exact B.27 integrals give

\[
|v|,|v_\eta|,|w|,|w_\eta|\le B_0s.
\]

After activation and through the two short final transitions, use
\(s=t_1+\kappa_0+\omega_1+\omega_2\). The reference cutoff contributes at most
\(2t_1\) times the bounded natural slopes. The remaining integrals have length
at most the computed radial-log length and coefficient at most \(\kappa_0\).
`globalReferenceComparisonControl` verifies that the sum of these control
constants is less than \(B_0\). Hence the same displayed four bounds apply.

The comparison interval ends at
\(X_{\rm end}=100\exp(\omega_1+\omega_2)\), the end of the a-interpolation.
It does not include the remaining constant-a interval
\([X_{\rm end},110]\). There the logarithmic factor acquires the finite change
\(-.4\log(X/X_{\rm end})\), which need not be small with the transition widths.
Section 7 uses a direct source bound and barrier on that interval.

The selected widths ensure \(|v|\le1\). The real exponential inequalities
\(|e^v-1|\le3|v|\), \(e^v\le3\) imply

\[
|\Delta E|\le3B_0s,\qquad |\Delta E_\eta|\le6B_0^2s.
\]

Since \(\sqrt{2X}<15\), these give the corresponding \(H\) bounds. The following
explicit table bounds the primitive differences before division by \(s\).
The numerical constants deliberately retain room above the elementary product
bounds. They use only \(X\le110\), the bounded fields just stated, and a
logarithmic integration length at most \(B_0\).

| Difference | Value divided by s | First eta derivative divided by s |
|---|---:|---:|
| \(U\) | \(B_0\) | \(B_0\) |
| \(H\) | \(45B_0\) | \(90B_0^2\) |
| \(M\) | \(110B_0\) | \(110B_0\) |
| \(I\) | \(4950B_0\) | \(9900B_0^2\) |
| \(J\) | \(26400B_0\) | \(79200B_0^2\) |
| \(S\) | \(1430B_0\) | \(3190B_0^2\) |
| \(C_p\) | \(3B_0^2\) | \(9B_0^3\) |

For example \(\Delta(UH)=U\Delta H+H_r\Delta U\). Differentiating this
identity once gives the four terms used in the J row. For the pressure row use
\(dC_p=E^2dy/2\) and
\(\Delta(E E_\eta)=\Delta E\,(E_r)_\eta+E\Delta E_\eta\).
Because \(B_0\ge10^6\), every table entry is at most \(B_0^4\).

The inverse differences obey the exact identity
\(1/a-1/b=(b-a)/(ab)\). Thus they are bounded by \(\Gamma^6s\) for the E and H
inverses; all primitive and field differences are bounded by \(\Gamma^4s\).

### 5.3 Independent algebra for the reconstructed moment map

The correctly arranged formulas are

\[
p_1=\frac{-XW+N_Q/H}{L},
\quad N_Q=(1-h)I-D\eta I_\eta-dJ_\eta+2(h-D)\eta J,
\]
\[
p_2=\frac{-XWU+D(M-\eta M_\eta)+4h\eta S-dS_\eta
+X(4A\eta\Pi-d\Pi_\eta)}{LE}.
\]

In particular, the \(-WU\) term of \(N_s\) is not divided by X. The independent
SymPy program expands these rational expressions after introducing independent
inverse variables and applies the exact monomial telescoping identity. It gives

\[
|\Delta p_1|\le
\left(\tfrac{21}{2}\Gamma^6+5\Gamma^7+\tfrac{21}{2}\Gamma^8\right)s,
\]
\[
|\Delta p_2|\le
(9\Gamma^6+9\Gamma^7+9\Gamma^8+27\Gamma^9+5\Gamma^{11})s.
\]

Both are bounded by \(100\Gamma^{12}s\). This finite algebra is checked
independently, including the historical wrong \(-WU/X\) negative control.
The coefficient sums are 26 and 59. They are not guessed generic constants.

### 5.4 Cone-variable composition

Let \(r_E=E_r/E=e^{-v}\), \(t_0=p_{2,r}/p_{1,r}\),
\(t=t_0r_E\). The common positive shear factor cancels in this ratio. Then

\[
|r_E-1|\le3\Gamma s,\quad |t|\le3\Gamma^2,
\quad |t-t_0|\le3\Gamma^3s.
\]

Using \(P_c=p_1+tp_2\), \(J_c=p_2-tp_1\), and
\(v_s=\kappa p_{1,r}(1+t^2)\), the independent positive-polynomial comparison is

\[
|P_c-v_r|, |J_c|
\le[100\Gamma^{12}(1+3\Gamma^2)+3\Gamma^4]s,
\]
\[
|v_s-\kappa v_r|\le12\Gamma^4s.
\]

The first polynomial has coefficient sum 403 and degree 14. All three are
therefore strictly below

\[
K s,\qquad K=1000\Gamma^{16}.
\]

These statements require the analytic input differences in Section 5.2. The
symbolic algebra alone does not supply those hypotheses. The division by a very
small \(\kappa_0\) never appears in this argument.

## 6. Actual widths chosen after C and activation cone

For each old rational envelope \(w_{\rm old}\) (the activation width, kappa, and
the two final widths), choose the exact positive real number

\[
w=\frac{w_{\rm old}}{10^8 B_0^{20}(1+V_A)}e^{-24\mathcal L}.
\]

The JSON stores the rational factors and exponent separately. It never stores
zero for these widths. They are selected after the final finite \(\log C\).
The old width envelopes are used only as upper bounds. In particular the previous
C0/C1 moment-debt estimates remain valid for this newly selected continuation.

Canceling the displayed exponentials proves directly

\[
K\sum w\le\frac{\sum w_{\rm old}}{100000},\qquad
t_1K(1+V_{\max})\le\frac{(t_1)_{\rm old}}{100000},\qquad
\kappa_0 V_{\max}<\frac{(\kappa_0)_{\rm old}}{10^8}.
\]

On the activation interval, \(s=ye_a\). Since \(v_r>2.3\), these bounds give
\(P_c>2.29\) and \(P_c-v_s\ge2e_a\). Whenever \(v_s>2\),

\[
(v_s-2)J_c^2\le2V_{\max}(Kt_1)^2e_a^2
<2(P_c-v_s)^2.
\]

The last strict inequality has a large rational margin: the left coefficient is
less than \(2\cdot10^{-4}\), while the right coefficient is at least 8. The
quadratic cone test therefore applies. When \(v_s\le2\), \(P_c>2.29\) gives the
strict relaxed condition directly.

After activation, the global comparison gives \(P_c>2.29\), \(v_s<1\), through
the constant-small-shear interval. At the axial cutoff its reference comparison
is \(p_{1,r}+\beta p_{2,r}^2/p_{1,r}\ge p_{1,r}>3\), for \(0\le\beta\le1\).
During the subsequent interpolation of a to .8, the axial shear is zero,
\(P_c=p_1>2\), and \(v_s=a\le.8\). The two widths fit before Xi because their
sum is below the old .02 bound and
\(e^{.02}\le1/(1-.02)<1.1\).

## 7. Constant slope, B.34, and a reserved inner collar

After the short transitions, a is exactly .8 and the axial slope is zero. Its
remaining eta-gradient error is still the small integral error, since the final
radial slope is independent of eta. The same chi/square-root-chi absorption gives

\[
S_q\ge s_{\mathrm{const}}>1,\qquad
s_{\mathrm{const}}\approx1.79999984194.
\]

At a hypothetical downward crossing of \(p_1=2\), the exact differential
equation gives \(D_Xp_1> X-1.2>0\). Thus \(p_1>2\) reaches Xi.

For B.34 the length check uses the independently bounded actual step derivative
\(\|\sigma'\|_\infty<9\) and
\(T_{sh}\ge180(\ell^++1)\). Therefore \(.55\le l\le.65\),
\(.7\le a\le.9\), and \(b_s=0\). The eta gradient is a convex combination of
the old one and \((\log f)'\). Completing the square yields

\[
-H_c(\log f)'\ge-\frac{j^2}{2D}-2\delta_U.
\]

Together with the retained old-gradient bound, this gives
\(S_q\ge s_{\mathrm{shape}}>1\), where the exact rational lower bound is displayed
as approximately \(s_{\mathrm{shape}}=1.649999845945\), on the **whole** B.34 interval. Again a barrier preserves
\(p_1>2\), now using \(X-1.3>0\). This proves the strict relaxed inequalities
through the long shape transition, before the separately audited restoration
and five-moment correction.

For a concrete first admissible collar choose

\[
N_c=\lceil2\mathcal L\rceil+\operatorname{bitlength}(1+V_A)+20,
\qquad 0<y\le t_1/N_c.
\]

The A.5 formula gives
\(\sigma(t)\le\exp(-1/t^2+4)\), for \(0<t\le1/2\). The saved exact comparison
\(N_c^2-4>2\mathcal L+\operatorname{bitlength}(1+V_A)+10\) consequently makes
\(e_a\) small enough that \(v_s\ge9/4\) on this collar. The quantities used in
the quadratic cone test stay strictly positive there.

The manuscript's inner edge vector (called B0 there, separately from the integer
comparison bound B0 above) has the strictly positive norm bound

\[
|B_0(0,\eta)|=|F(X_0,\eta)p_{s,r}(X_0,\eta)|
\ge\frac{2c^2}{\Lambda}e^{-\mathcal L}.
\]

The saved common nonzero eta tube is

\[
r_\eta=\min\left\{\rho/8,
\frac{c\rho(1-r/20-1/8)^2}{4M}\right\}>0.
\]

Indeed the coefficient series on that complex tube bounds \(|\Phi_\eta|\) by
\(M/[\rho(1-r/20-1/8)^2]\); continuation from its positive real lower bound
keeps \(\Phi\) away from zero. The B.22/B.26 expressions are parameter analytic
on this common smaller neighborhood. The original A.9/B.30 smooth-division
argument then applies to the **actual** scalar
\(e_a=(1-\kappa_0)\sigma(y/t_1)\): the field differences are in
\(e_a y^3C^\infty\), their forward moment differences are in
\(e_a y^6C^\infty\), and
\(T_0=e_aB_0\) has the stated nonzero edge vector. This is an inner-endpoint
conclusion. It says nothing by itself about the exterior endpoint after heat
replacement or radial cone modulation.

## 8. Second eta derivatives and what remains outside this certificate

The additional `p1Eta2Bound` and `nsEta2Bound` differentiate the reference source
and its positive integral representation twice. The code uses the first three
logarithmic angular derivatives, the first three axial derivatives, and the
pressure derivatives through order three. For example

\[
|(\log F)_{\eta\eta\eta}|
\le2\Lambda Z/r_C^2+b_{03}/c
+3b_{01}b_{02}/c^2+2b_{01}^3/c^3+1.
\]

The extra one covers the newly decreased reference cutoff integral. Differentiating
\(F^2\) produces \(2J_3+12J_1J_2+8J_1^3\), used in the third pressure bound.
The scaled widths make
\(|G_i''|\le b_{02}/\Lambda+(t_1+\kappa_0T)55n_{s,\eta\eta}^+<j\).
The B.34 amplitude can be bounded by a stronger finite dyadic number without
changing the already fixed C; the corresponding early second-derivative moment
errors are checked below \(2^{-128}\).

These bounds supply the C2 moment inputs for the separate continuous implicit
root and slow-modulation calculations. They do not determine the outer A.4/A.7
pressure-neutral corrections, the complete finite-N C.12 field, or the exterior
stress limit. Nor does this document turn the generated all-eta analytic source
premise bundle into a Lean proof. Those boundaries remain explicit in the JSON.

The pressure scale is not an additional circular dependency. A.21 integrates in
\(y=\log(X/X_R)\), with \(dX/X=dy\), so its complete schedule and pressure datum
are unchanged when the final
\(X_R=110\exp(10(\log C+14))\) is selected. Reinstating later corrections still
requires their actual zero pressure-increment identities.
