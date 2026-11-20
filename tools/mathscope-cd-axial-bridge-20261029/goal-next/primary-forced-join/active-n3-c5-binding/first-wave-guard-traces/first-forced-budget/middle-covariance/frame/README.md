# Middle fixed-label covariance and first Forced coefficient budget

The original middle target is specified on \(y=\log(X/X_a)\ge t_1/8\), \(d=\log(X_b/X)\ge 1/4\), \(|\eta|\le1\), \(1/2\le s\le2\), in the original selected box and fixed-label pulse. The authenticated C97 active target has ordinary physical slow derivatives through order eight bounded by \(M=\exp(H/2^{128})\). Its actual stronger log bound is \(H/2^{256}\).

Let \(B=B_{\rm norm}\), \(W=\exp(3B^{256}L_{\max})\), \(R=R_{\rm env}\), and \(w=(H_{\rm cov}^{-1}\bar T_0)/\sqrt S\). The two original normalized pulse masses give \(m_L\ge2^{-64}B^{-1}W^{-2}\) and \(m_U\le2^7BW^2\). On the original frozen cone, \(w\ge\kappa R^{-74}/(64m_U)\) and \(w\le2\tau/m_L\). Each component of the target is bounded by \(M\), and the original \(A_c>R^{-6}\) yields \(\tau\le2MR^6\). Hence

\[
\frac{1}{2\sqrt w}\le 2^{11/2}R^{42}B^{1/2}W\le2^{16}BW,
\qquad
\sqrt w\le2^{33}R^3B^{1/2}W\sqrt M\le2^{33}BWM.
\]

The final comparisons use \(B\ge R^{4096}\). The Gram entries and determinant use the same original masses. The fixed-label band powers stay \(2j-1/2\) for the Gram matrix, \(2j+1/2\) for the regular covariance weight, and \(2j+1/4\) for its square root.

The replay reproduces the original C92 coefficient calculation and changes two inputs for the middle region. Each regular target derivative has one power of \(M\), and the square-root base row gains one power of \(M\). It repeats the C92 recurrence through order eight and the 23 ordered-variation directions for both harmonics. Since the source coefficient polynomial is affine in the mean, a bound of \(M\) times the C91 mean coefficient model costs at most one additional common power of \(M\). The full coefficient-log degree vector with this allowance is \((29109,10121,437,1619)\) in \((\log2,\log B,\log W,\log M)\), so it fits \(H/2^{109}\). The same mean model must retain the required \(\varepsilon\) and band grades.

The original inner and middle guards overlap for \(y/t_1\in[1/8,1/4]\). The original outer regular-source and middle guards overlap for \(d\in[1/4,1/2]\). A disjoint partition of the open annulus for integration uses \(y\le t_1/4\), then \(y>t_1/4\) and \(d>1/4\), then \(d\le1/4\). The equality \(y+d=\log(X_b/X_a)>2\) excludes overlap between the first and last pieces. Derivatives always act on the original fields and original cutoff. Nonlocal original mean and pressure paths still require bounds over their entire actual path.

On the middle guard, \(\zeta^{-1}\le e^{128}<2^{185}\). If the actual middle raw and projected source, including the FiveMap fields, satisfies the existing grouped source grades and the recorded complete mean input allowance, the pre-existing Cartesian comparison fits \(H/2^{108}\) and gives physical \(\varepsilon\) grade \(69999/50000\). Against the original stage-one potential allocation this implies \(J^2_{\rm middle}/S_R<2^{-32}\) for the two first Forced harmonics. With the two collar estimates the sum of these three conditional contributions is \(<2^{-30}\). Attaching the whole-path mean, FiveMap pressure and raw source grades is separate evidence. This comparison leaves the coupled energy, subsequent corrections and final jets open.

~~~text
python -B verify_middle_frame_budget.py --goal GOAL_NEXT --attachment wrapped-middle.json --target middle-coeff-log.json --out middle-frame-budget.json
~~~
