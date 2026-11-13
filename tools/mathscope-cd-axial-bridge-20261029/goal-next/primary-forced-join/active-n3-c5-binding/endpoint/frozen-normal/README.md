# Original selected N3 frozen normal and its pulse derivative

The run 43296617887 exports the genuine original two positive-sign mode-two systems, with keys 0:1 and 1:1. The independent extractor authenticates all 21,681,493 original source nodes by the uncompressed graph SHA256 and keeps 4,864 selected nodes. The replay checks the original homogeneous moving normal and its \(v\) derivative against the archived native Forced operands. The original normal formulas are

\[
n=(x_0-vH_R,\ p/R,\ p_z-\varepsilon vH_Z),\qquad
n'=(-H_R,\ 0,\ -\varepsilon H_Z).
\]

The first three formal coordinates \(X_{\rm rep},\eta_{\rm rep},s_{\rm rep}\) are original roots 17732753, 17732754, and 17732755. Their actual inputs are the same three representative roots 17733951, 17733956, and 17733936 for both branches. The pulse formal \(v=17732751\) goes to \(w=21661707\) and \(w=21675098\) respectively. The ordinary slow coordinates and fixed label are preserved.

All twelve scalar comparisons pass with identical sparse rational Laurent forms after the prescribed substitution. The replay canonicalizes sums, products and inverses and preserves native function identities, argument tuples, orders, and analytic operator operands. No new analytic equations or numerical values are assigned. The normal comparison does not clear denominator factors. Replacing the actual \(w\) by the original \(v\), or swapping the two actual representative inputs \(X,\eta\), is rejected in both branches.

Together with the prior archived frame receipt, this identifies the selected Forced \(A_\phi-4dI\) system with the same frozen homogeneous \(n,n'\), cylindrical \(K\) and \(d=\varepsilon k^2|n|^2\). The original tangent-plane basis \(B\) and envelope \(P\) therefore give the selected normalized equation \(z'=(M_1-3dI)z+B_{\rm left}g/P\) on the original primitive domain. This is an archived operand and equation identity. The source's stability, support, nonzero denominators and admitted pulse assumptions are retained. The proof covers the two selected alternatives and gives no complete Forced private seal, whole-K numerical intervals, or final jet promotion.

## Replay

~~~sh
python -B extract_frozen_normal.py HOSTED/witness frozen-normal-slots.json

python -B replay_frozen_normal.py frozen-normal-slots.json \
  791f179c5de4af5b1b3405af66b4482b2028d26944fd6b99fb63ece8a5d1e25e \
  GOAL_NEXT/first-force-repair/verify_repaired_first_force.py \
  ANNULAR/archived-frame-substitution-cached.json ORIGINAL_RUNTIME \
  frozen-normal-verified.json
~~~

HOSTED is the extracted original run 43296617887. ANNULAR is continuation36/annular-bound. ORIGINAL_RUNTIME is the pinned second-live node fixture research-ide. The verified receipt has SHA256 92d9dd59e63502b5325f54459d0016768244bb5f40aac5ae90c125434d1f8577.
