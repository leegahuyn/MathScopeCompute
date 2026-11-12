# Initialized angular pressure and four stage-zero pressure atoms

**VERIFIED source identity and exact arithmetic.** Both signed angular pressure bodies \(\#3625754,\#3652129\) retain the original moving-normal coefficient and the exact conjugate sine pair. The producer authenticates the full 4,456,994-node source and 162 indexed pressure rows. Its signed polynomial replay verifies the phase, normal, squared norm, denominator, all three signed pressure contractions, and the full native amplitude. It compares 219 nontrivial native subtrees per sign under the common simultaneous representative substitution
\[
(\#622807,\#622808,\#622809)\longmapsto(\#623950,\#623955,\#623935).
\]
The representative's actual defining closure is independent of live \(R,Z,T,\xi,v,\theta\). The independent checker reads the original sine pair separately, rejects a literal sign flip, and checks the complete positive graph and final source branch sums.

**CONDITIONAL quantitative result.** The replay constructs exact positive bounds for all four pressure atoms of the actual initialization \(\#3859821\). It imports the original source stability, cone, denominator and flat extension premises, the actual source FTC norm expressions, the original physical chart and the independently replayed slow-background and initialized mean pressure bounds. The FTC integrals remain symbolic. The calculation concerns stage zero. Later active corrections and their interval evidence remain open, so final jets remain 0/67 and RELEASE HOLD.

| Physical initialized pressure atom | Positive root |
|---|---:|
| \(p\) | 213 |
| \(\partial_xp\) | 216 |
| \(\partial_yp\) | 218 |
| \(\partial_zp\) | 221 |

## Physical domain and source branch

Use \(q_{\rm Big}/64\le q<q_{\rm Big}/16\), \(X_a\le X\le X_b\), and \(|\eta|<3/4\) on the original whole-K slab. The original stage-zero annular chart uses a fixed dyadic reference \(Q\) and each contributing row uses its own fixed dyadic \(Q_{\rm row}\). All such bands are in \([q_{\rm Big}/128,q_{\rm Big}/8]\). The stage-zero field uses nearest fixed reference charts for the mean. Integer labels and nearest copies are fixed in each derivative. The original zero extensions supply seam values.

The actual total \(\#3859821\) is angular \(\#3674937\) plus background \(\#622935\) and mean \(\#3615361\). Angular row values and derivative maps match the independently verified original covariance cover, with the additional unchanged physical angle slot. The producer uses their original \(2A\) pressure scaling. Each row therefore contributes \(Q_{\rm row}^{-2A}\) times its native own-chart normalized pressure, \(A=1/2+h\). In that chart the spatial operators use \(R=r/\sqrt{Q_{\rm row}}\), \(Z=z/Q_{\rm row}^D\), \(D=1/2-h\), and \(\epsilon=Q_{\rm row}^h\). Spatial differentiation freezes the pulse coordinate \(v\). The transverse derivative of the radial operator is the original \(a_{\rm fast}\partial_\xi\).

## Signed angular coefficient and spatial bounds

Let \(A^0=\sqrt{\epsilon}\sqrt{y}\,\psi(v)\,\Pi_{\rm slow}\,t\) on a retained row, with the original signed Volterra amplitude \(t\), square-root covariance weight \(\sqrt y\), longitudinal pulse cutoff \(\psi\), and product of the four slow partition factors \(\Pi_{\rm slow}\). The exact local signed pressure equals
\[
-k^{-1}\chi(\xi)C\sin(k\Phi),\qquad
C=\frac{(n^\top K-n_v^\top)A^0}{|n|^2}.
\]
This follows from the two actual half-amplitudes and \(\sin(-k\Phi)=-\sin(k\Phi)\). The phase and moving normal satisfy the exact identities
\[
\partial_R\Phi=n_r,\qquad
\partial_Z\Phi=n_z/\epsilon,\qquad
\partial_\theta\Phi=R n_\theta,\qquad
\partial_\xi\Phi=0.
\]
Thus the factor \(k\) cancels in every phase derivative of the pressure. The coefficient derivative retains \(1/k\le1\) from the original positive integer carrier.

The positive first-order program uses actual live \(F,G\) C2 roots from the source C8 namespace, original lower \(|n|,|n_t|\ge B_0^{-2}\), and the existing exact stable \(w,w_{R,Z}\) and weighted square-root bounds from the initialized mean replay. The moving frame and all three pressure contractions use the absolute product rule. The original four partition factors have absolute values at most one. Their first derivative is bounded by \(4\) times the one-factor derivative norm times the maximum of the mesh slope \(S_*^3\) and the band slope bound \(1024R_*\). The existing Gaussian absorption bounds the coefficient derivatives without dividing by a vanishing weight at the source edge.

If \(C_0,C_1\) are the resulting common absolute coefficient and first derivative bounds, the pressure value costs \(C_0\). The normalized spatial derivative costs are
\[
\begin{aligned}
R\text{ direction}&:\ C_1+a_{\max}\|\chi'\|_\infty C_0+|n_r|_{\max}C_0,\\
Z\text{ direction}&:\ C_1+\epsilon^{-1}|n_z|_{\max}C_0,\\
R^{-1}\partial_\theta&:\ |n_\theta|_{\max}C_0.
\end{aligned}
\]
The exact integer \(\chi'\) bound is imported from the transverse replay. The radial and angular costs combine for each Cartesian horizontal derivative. The physical factors are \(Q_{\rm row}^{-2A}\), \(Q_{\rm row}^{-2A-1/2}\), and \(Q_{\rm row}^{-2A-D}\) respectively. Sum the original 162 rows and use the dyadic envelope. These are angular roots 199, 204, 208, and 210 for value, radial, axial and Cartesian horizontal. Each final atom adds the corresponding actual slow-background and mean pressure bounds.

## Replay

Use the authenticated corrected source graph from GitHub run 43010593847 and the pinned prior evidence files under GOAL_NEXT.

```text
node replay_angular_pressure.mjs GOAL_NEXT HOSTED_GRAPH initialized-angular-pressure.json
node check_angular_pressure.mjs GOAL_NEXT HOSTED_GRAPH initialized-angular-pressure.json initialized-angular-pressure-readback.json
```

In the working tree GOAL_NEXT is `work/goal-next` and HOSTED_GRAPH is `work/goal-next/corrected-flat/hosted-43010593847/corrected-first-cycle-graph`. No local Lean compilation or numerical integration was used.
