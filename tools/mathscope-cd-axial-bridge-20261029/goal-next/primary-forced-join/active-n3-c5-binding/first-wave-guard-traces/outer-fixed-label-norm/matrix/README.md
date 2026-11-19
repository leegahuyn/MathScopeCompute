# Fixed-label derivatives of the original normalized covariance matrix

## VERIFIED

The verifier reopens the authenticated 22,155,584-node original source cache and reconstructs the two original homogeneous frame families. The source stream SHA-256 is `faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96`. The corrected C88 receipt binds the original frame to 180 native matrix entries and 120 native projection entries. This check independently replays the two original matrix, basis and left-inverse constructions. It checks the native argument order `(R,Z,T,ell)`, the first slow jets of the two coefficient fields, their appearance in the normal and cylindrical matrix, and the absence of slow or torus coordinates from the frozen reference factors. The registered homogeneous initial data are `(1,0)` in each sign.

| Quantity | Source roots |
| --- | --- |
| `F`, `F_R`, `F_Z`, `F_T` | `#17732934`, `#17733119`, `#17733124`, `#17733129` |
| `G`, `G_R`, `G_Z`, `G_T` | `#17732935`, `#17733121`, `#17733126`, `#17733131` |
| Nonzero `K` entries `K_rθ`, `K_θr`, `K_zr` | `#17733152`, `#17733154`, `#17733121` |
| Positive mode-one homogeneous matrix | `[[17733353,17733330],[17733334,17733354]]` |
| Negative mode-one homogeneous matrix | `[[17733687,17733665],[17733669,17733688]]` |
| Positive and negative normalization `P` | `#17733391`, `#17733724` |
| Original background derivative norm through order eight | `#14220475` |

Write \(w\) for the original covariance integration variable, \(q=n\cdot n\), and \(t=n_\theta^2+n_z^2\). The exact coefficients used in the proof are

\[
\begin{aligned}
H_R&=pF_R+p_zG_R, & H_Z&=pF_Z+p_zG_Z,\\
n&=(x_0-wH_R,\ p/R,\ p_z-\epsilon wH_Z),\\
K&=\begin{pmatrix}0&-2F&0\\2F+RF_R&0&0\\G_R&0&0\end{pmatrix},\\
A_\phi&=-K+n(n^{\mathsf T}K-(\partial_w n)^{\mathsf T})/q,\\
M_m&=B_\ell(A_\phi B-\partial_w B)-(\lambda-d_{\rm ref}+m^2\epsilon k^2q)I,\quad m\in\{1,2\}.
\end{aligned}
\]

Here \(B_\ell\) denotes the source left inverse of \(B\). The ordered transverse unit vectors in the original basis have components \((n_\theta,n_z)/\sqrt t\) and \((n_z,-n_\theta)/\sqrt t\). For each sign \(\sigma\in\{-1,1\}\), the scalar mixing factor is \(c=c_0\sqrt{1+s^2}\) with \(s=\sigma u(1/2+w/L_s)\). Its slow derivatives vanish at fixed \(w\) and label. The same is true of the reference rates, \(P\), and the integration endpoint \(L_s\).

## CONDITIONAL

For each fixed label, work on the original perturbative cone over the full interval \(0\le w\le L_s\), with a slow neighborhood on which the original coefficient fields have their ordinary derivatives. Use the original positive denominator bounds and \(L_{\min}S\le L_s\le L_{\max}S\), with constants uniform in the admitted labels and \(S\ge1\). The source cone bounds \(n\), \(1/q\) and \(1/t\) by \(B_{\rm norm}^4\) at order zero. For order \(j\) assume a common physical slow derivative cap on these same-body \(F,G\) through \(j+1\). The original order-eight norm recipe is read back from source. Its applicability requires the admitted actual selector and a common analytic domain.

The derivative ledger uses triples \([c,a,b]\) to bound each entry or indicated matrix infinity norm by \(c A^a S^b\), where \(A\) dominates the frozen geometric constants and the assumed field cap. Every positive-order derivative of \(n\) costs at most one factor \(S\), from \(w\le L_{\max}S\). Derivatives of \(\partial_wn\) and \(K\) are bounded independently of \(S\). The exact product weights give \(D^j q,D^j t=O(S^{\min(j,2)})\) for \(j\ge 1\). Reciprocals use the differentiated identity \(q(1/q)=1\), and \(t^{-1/2}\) uses the set-partition chain rule. Differentiating the frame in \(w\) introduces \(\partial_wt\) and the same reciprocals. The original \(u\ge2\) gives \(|c|\le2u|c_0|\), \(|\partial_wc|\le u|c_0|/L_s\), and \(|1/c|\le1/|c_0|\). The native ceiling gives \(0\le m^2\epsilon k^2\le16\) in the two modes. Combining these bounds gives

\[
|D^j B|+|D^j\partial_wB|+|D^j B_\ell|+|D^j M_m|\ \le\ C_j S^j,\qquad 0\le j\le8.
\]

The exact integer check covers the mixed Leibniz weights for all 165 multi-indices in \(R,Z,T\). The original matrix and \(B\) have zero derivatives involving either torus angle. The estimate for the homogeneous state \(W'=M_1W\), \(W(0)=(1,0)\), uses the original forward propagator cap \(C_0=\exp(3B_{\rm norm}^{256}L_{\max})\). Each variation term indexed by \(1\le k\le j\) costs \(S^{1+k+2(j-k)}\le S^{2j}\), including the length of the interval. This yields \(D^jW=O(S^{2j})\) and \(D^j(BW)=O(S^{2j})\). Since the original tangent is \(P BW\), the latter is its normalized derivative estimate. The mode-two normalized matrix adds the scalar damping \(-3\epsilon k^2q I\) to the mode-one matrix, so the forward cap applies there as well. A zero-data normalized forced system with a separate \(O(S^j)\) projected forcing estimate has \(O(S^{2j+1})\) parameter derivatives.

## OPEN

The authenticated order-eight background recipe covers the field derivative demand through matrix order seven, once applied on the relevant actual domain. Order eight needs a uniform ninth-order cap on the original physical fields, or bounds through order eight on the specific \(F_R,G_R,H_R,H_Z\) combinations on the same domain. The registry's derivative allowance records which derivatives can be generated. Numerical field caps and target jet certification remain open. `jets=0/67`, `RELEASE HOLD`.

## Replay

Use Python with assertions enabled. The four input directories are the existing `goal-next` tree, hosted spatial artifact tree, authenticated signed-wave cache, and original forced-source runtime tree. The output path must be new.

```text
python -B verify_matrix_s_j.py --goal GOAL_NEXT --artifact HOSTED_ARTIFACT --cache SIGNED_WAVE_CACHE --outer-runtime ORIGINAL_FORCED_RUNTIME --out matrix-s-j-replay.json
```
