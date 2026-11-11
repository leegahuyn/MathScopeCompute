# Physical cutoff sectors on the original K slab

**VERIFIED.** The exact original common scales give \(b_1q_{\rm Big}=1\),
\(b_2q_{\rm Big}=16\) and \(b_3q_{\rm Big}=32\). In coordinates
\(Q=q/\tau_0\), \(\rho=\tau/\tau_0\) and \(\zeta=z/z_0\),
the first three cutoff arguments are \(Q/32,Q/2,Q\). The literal
original K is \(r^2\le r_0^2/2,\ \zeta^2\le1/2\).

The inverse equation is \(Q-\zeta^2Q^{2h}=\rho\). On the admitted
bracket \([1/2,2]\), the derivative of its left side is at least
\(1-2h>7/8\), using \(Q^{2h-1}\le2\).
Its value at \(Q=1\) is \(1-\zeta^2\). The actual comparison is
therefore
\[
 Q<1\iff\rho+\zeta^2<1,\qquad
 Q=1\iff\rho+\zeta^2=1.
\]
The Lean theorem `whole_k_third_background_physical_split` compiled
in [GitHub run 43065016427](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43065016427).

| Physical sector | Second background cutoff | Third background cutoff |
| --- | --- | --- |
| \(\rho+\zeta^2<1\) | 1 | positive |
| \(\rho+\zeta^2=1\) | 1, positive-order jets zero | flat zero |
| \(\rho+\zeta^2>1\) | positive transition | flat zero |

The physical N2 omitted-order guard holds exactly on
\(\rho+\zeta^2\ge1\). The N3 physical guard holds on all K.
The original reference inverse and frozen representative constraints
also enter the selection of a working chart.

For integration in physical `(x,y,zeta,rho)` coordinates, the
third-cutoff positive region has exactly two-thirds of the K slab
measure. At each time its axial interval has length
\(2\sqrt{1-\rho}\). In the fourth **correction** case,
\(C=16/27\) is an exact conservative upper bound for possibly
nonzero (Q). The same monotonicity converts this to
\[
 \rho+C^{2h}\zeta^2<C.
\]
Its axial-time measure is at most
\((4/3)C^{-h}(5/54)^{3/2}\), strictly under one-sixteenth of the
whole-K measure fraction. The rational checker uses
\(C^{-h}<16/15\) and compares the squares of the measure ratios.
These sectors can be used as integration boundaries for the actual
field. The sector measure alone supplies no annular field value.

    python check_physical_cutoff_split.py --repo REPO \
      --scales higher-ftc/higher-ftc-maxima-verified.json \
      --chart WHOLE_K_CHART --tail ../final67/cut-correction-tail.json \
      --out physical-cutoff-split.json
