# Independent replay of the hosted original N0 current and pressure

GitHub Actions run 43049274308 used evidence commit
`fbad12e9331c63b45da8292601a2b0fb6f54731e` and original source commit
`f8cb4034e86d7b669d52a6f2248aebba156b51b5`. The N0 job 130621621202
completed successfully. The overall run concluded failure because the
N3 build exceeded its 6 GiB RSS cap and the N4 build exhausted its
declared induction node budget. Their diagnostic artifacts contain no
current/pressure graph.

## VERIFIED · Original artifact bytes and source records

GitHub reports N0 artifact 13869266481 with size 5,867,233 bytes and
ZIP SHA-256 `83f02c00e2f6dec890a725c740910d5bb48b3c4b9cc153c4f20595e58ed8a4f5`.
The verifier recomputes this digest and compares all four ZIP entries
byte for byte with the original extracted files. It then streams all
983,154 graph records and checks the exact histogram, the 44,683,005
uncompressed bytes and graph SHA-256
`635d24c20d71fa94fa51aafce813f10a9059c7d3f985c8c210c33b4ffff85ca3`.
All ordinary graph operands refer to valid earlier records. Native
applications are checked against their registered arity and order.

The captured registry is raw-base only, with SHA-256
`132edc7a71fe43ea25fe79f914ffd2cf3d3c40bd510149d9bf197e52e9470b13`.
It has 788 base expression bodies, 3 quadratic and 3 monotone root
systems, 6 Picard systems, 2 registered global pulse systems,
12 auxiliary expression bodies and no auxiliary inverse. Each of
the six global mean components has 81 rows. Each of the six complete
auxiliary covariance components has 162 rows. The verifier checks
their actual local body, argument and derivative-map records.

All 11 manifest roots match the stage receipt. The raw pressure is
#642822, the retained full radial derivative #642836 and the ordinary
slow axial derivative #642842. The three raw residual roots are
#642878, #642861 and #642876. The axial stress is #633743. The checker
compares the actual two shared-integrand shifted pressure integrals,
their fixed endpoints, the pressure cutoff subtraction and the
opposite radial shift terms. The exact resulting identities are
\[
 D_r p_m=(g_r-\rho P)-A_0,\qquad
 D_rp_m-g_r=-\rho P-A_0,
\]
with the retained actual \(A_0\) at #642823. The axial residual contains
the literal \(\epsilon\partial_Zp_m\) term. The names in the manifest
therefore distinguish the full radial derivative from the ordinary
axial source derivative used before multiplication by \(\epsilon\).

## VERIFIED · Selector and exact prefix domain

Both actual selector rows are verified, including all 8 first and
15 second constraints. Their logarithms use each original coefficient
bound in \((n\log2+\log B)/(nh)\), the original historical log scale,
and the specified growth floor. In particular,
\[
 b_1\ge2^{\ell_{\min}+10}=q_{\rm Big}^{-1},\qquad b_2\ge16b_1.
\]
The actual N0 graph has no active background coefficient rows and no
application of its newly registered common time cutoff. The original
selector construction and historical coefficient bodies are still
present in the source prefix. The exact declared window is
\[
 \ell_0=\ell_{\min}+6\le\ell\le\lfloor\log_2 b_1\rfloor-1,
 \qquad Q=2^{-\ell},\quad q=sQ,\quad 1/2\le s\le2.
\]
The upper bound implies \(b_1q\ge1\). Monotone original selectors and
the flat zero endpoint of the original cutoff then make every omitted
background coefficient and all of its derivatives zero, including
at equality. The same admitted prefix is used over every candidate
cover label and over the held radial integral.

## OPEN · Physical membership and whole-K completeness

The integer window itself contains at least four labels from the
selector lower bound. The actual reference chart imposes the separate
strict condition \(0<q<q_{\rm Big}\). Together with \(q\ge Q/2\),
this requires \(\ell\ge\ell_{\min}+10\). An admitted band thus
requires \(b_1q_{\rm Big}\ge2\). On the whole-K slab
\(q<q_{\rm Big}/16\) forces \(\ell\ge\ell_{\min}+14\), so the
certified N0 band window can intersect the slab only if
\(b_1q_{\rm Big}\ge32\). The pointwise omitted-tail test alone would
require \(b_1q_{\rm Big}>16\). The actual comparison and an attained
physical N0 instance have not been established here.

The construction authenticates the parametric N0 current and pressure
stages. It records 81 candidate boxes without instantiating the
complete physical slab. Natural-series record and argument syntax
are checked. Actual reachable natural-series analytic ranges,
the other necessary prefix windows, the complete all-cycle field,
whole-K integrals and the final 67 jets remain open. RELEASE HOLD.

## Replay

Use Python with assertions enabled and the original Git objects in
`REPO`. The GitHub metadata is adjacent to the checker. The evidence ZIP holds the original GitHub download and its extracted graph in inputs/original-whole-k-n0.

```text
python check_hosted_n0.py --repo REPO --artifact inputs/original-whole-k-n0 --github-zip inputs/original-whole-k-n0/hosted-n0-artifact.zip --out independent-hosted-n0.json
```
