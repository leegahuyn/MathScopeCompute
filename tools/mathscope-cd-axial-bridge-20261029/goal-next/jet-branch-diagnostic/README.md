# Branch and derivative-order diagnostic at the attained N1 chart

The original 67 targets are classified by the exact independent-variable multiindices. Each Cartesian gauge component has 1 value, 4 first, 8 second and 6 third derivatives. The radial direct scalar \(b(s_{\rm cyl},z,\tau)\) has 1 value, 3 first and 2 second derivatives. The full pressure has 1 value and 3 first derivatives. Thus 23 requests are at most first order and 44 are second or third order. The JSON lists all 67 original labels by order. A first-order request may still need a first-order compatibility proof if its closed evaluation cell crosses an actual source join.

## Exact local chart

The already-authenticated attained N1 chart has \(\ell=L+2\), \(R_w=\sqrt{X_a+X_b}\), \(Z=0,T=1,s=1\). The original inverse enclosure covers \(Z\in[-1/8,1/8]\) and \(T\in[15/16,17/16]\). The exact original \(s=T+Z^2s^{2h}\), with \(s^{2h}<2\) on the admitted root bracket, gives \(s\in[15/16,35/32]\) throughout this box. The earlier interval for \(s\) is included verbatim in the JSON. On this box the coefficient prefix remains valid, because the original selector has \(b_2\ge16b_1\), and the attained reference label is two bands above \(L=\lfloor\log_2 b_1\rfloor\).

For a separately declared radial subcell \(R/R_w\in[15/16,17/16]\), the original \(X=R^2/(2s)\) obeys
\[
 X/X_a>135/112,\qquad X/X_b<289/320 .
\]
The bound uses the verified \(X_b>e^5X_{0,I_{\rm mean}}>2X_a\). It also gives \(X>(45/112)X_b>e^3X_{0,I_{\rm mean}}\). All three actual FiveMap bump profiles and the original mean patch transition lie below \(e^3X_{0,I_{\rm mean}}\). This cell has the original \(\chi_{\rm mean}=1\), \(\rho_{\rm mean}=0\), and \(A_1=0\) in the Temporal curl. The exact first-cycle FiveMap direct swirl and meridional correction vanish on the cell. The actual Temporal axial velocity equals \(\gamma_d\) there. Its meridional potential still uses the shifted upper radial tail ending at \(R_{\rm out}\). The cell has no intrinsic radial stress-shell seam, but individual mesh, label and auxiliary torus joins require their own source compatibility analysis.

The background coefficient cutoff \(\chi(b_1q)\) is another distinct factor. Its argument is \(2^{\{\log_2 b_1\}-2}s\), in \([15/64,35/64)\) over the local box. The source factor is positive throughout and strictly on the unit plateau at the attained center. Its lower transition can enter the box only if the fractional part makes \(2^{\{\log_2 b_1\}}>64/35\). This implication is on the conservative \(s\) box.

## Original first stage cutoff versus outer localization

The corrected source log-scale max \(\#617465\) contains \(\#617464=(\ell_{\min}+10)\log2\). Therefore the original integer \(j=L-\ell_{\min}-10\ge0\) and
\[
 q/q_{\rm Big}=s\,2^{-j-2},\qquad
 \log(a_1q)=d-(j+2)\log2+\log s,\qquad d=\log a_1-\log(1/q_{\rm Big})\ge1.
\]
The first stage cutoff has value one at arguments at most \(1/2\) and value zero at arguments at least \(1\), with flat derivatives at both endpoints. A rational enclosure for \(d\) and the exact integer \(j\) therefore decide the branch whenever the resulting logarithm interval lies entirely in one closed flat branch or in the open transition. The script uses exact rational logarithm series with a directed tail bound. It reports unresolved overlap when the interval meets a branch boundary. On the conditional minimum branch \(d=1\), \(j=0\) gives a strict positive transition throughout the local box because \(e\,s/4\in(1/2,1)\), using \(8/3<e<3\). Every \(j\ge1\) gives the unit plateau because \(e\,s/8<1/2\). Even without the minimum-scale condition, \(j=0\) rules out the unit plateau on this local box. No value of the actual \(j\) or \(a_1\) is assumed.

The distinct outer localization has arguments \(2(x^2+y^2)\), \(2(z/z_0)^2\), and \(\tau/\tau_0\), with \(\tau_0=q_{\rm Big}/32\), \(z_0=\tau_0^{1/2-h}\). On the local box the first two factors are rigorously one. For the radial factor use \(Q\le q_{\rm Big}/4\), \(R<R_{\rm out}\le R_*\) and \(q_{\rm Big}R_*^2<1\), from \(\log(1/q_{\rm Big})>R_*^{1024}/2\). For the axial factor, \(|Z|\le1/8\), \(D<1/2\), and \(Q/\tau_0=2^{3-j}\) give \((z/z_0)^2\le1/8\). The outer time argument is exactly \(2^{3-j}T\).

| Actual integer \(j\), if supplied | Outer time factor over \(T\in[15/16,17/16]\) |
| --- | --- |
| \(j\le2\) | Entirely beyond the outer upper time support |
| \(j=3\) | Crosses the upper flat seam at \(T=1\) |
| \(j=4\) | Crosses the lower flat seam at \(T=1\) |
| \(j\ge5\) | Unit plateau |

For example, \(j=3,T=1\) gives the exact upper seam with all cutoff jets zero, while \(j=3,T=15/16\) has a strictly positive transition factor. At \(j=4,T=1\) the exact lower seam has value one and all positive derivatives zero, while \(j=4,T=17/16\) is in the transition. A cell crossing either seam needs enclosure on both sides. This distinguishes a positive cutoff factor from a nonzero underlying first correction, which still depends on the actual source values.

The previous whole-K comparison slab has \(1/2\le\tau/\tau_0\le1\) and the conservative \(q/q_{\rm Big}\in[1/64,1/16]\). It is a separate domain. For example, the attained \(T=1,Z=0\) point belongs to the endpoints of that time slab for \(j=3,4\), while the \(j=0\) attained point has \(q/q_{\rm Big}=1/4\) and lies outside it. Its first stage transition at the conditional minimum scale does not contradict the unit-plateau conclusion on the whole-K comparison slab.

An independent selector check reduces the source \(b_1\) to
\(\log b_1=\max((\ell_{\min}+10)\log2,h^{-1}\log(2N))\).
Here \(N\) is the maximum of the four current \(m=1\) norms
and one historical norm. Thus \(j=0\) exactly when
\(N<2^{h(\ell_{\min}+11)-1}\), with equality giving \(j=1\).
One necessary quantitative input is the original pressure FTC
face integral #539452, with integrand
\(\sqrt{1+(\partial_X\partial_\eta\Pi_1)^2}\) over
\([0,X_+]\times[-1,1]\). The pressure norm and the remaining
source norms have to be bounded to select the actual branch.

    python jet-branch-diagnostic/check_b1.py --source EXTRACTED_RUN/corrected-first-cycle-graph --out b1-comparison.json

This diagnostic certifies derivative orders and the stated branch conditions. The preceding common-reference transfer estimates retain their actual input norm hypotheses. The actual \(j\), actual first scale, live mesh seam inventory, and final all-stage field enclosures remain open. No 67-jet count changes. RELEASE HOLD.

Reproduce with the original repository, extracted corrected run, and three pinned evidence files. The optional arguments report a diagnostic only for the supplied \(j\) and \(d\) enclosure.

    python jet-branch-diagnostic/check_jet_branches.py --repo REPO --artifact EXTRACTED_RUN --native final67/native-input-enclosures.json --whole-k WHOLE_K_CHART --c3 first-pressure-norm-c3/first-pressure-c3.json --out jet-branch-diagnostic.json

