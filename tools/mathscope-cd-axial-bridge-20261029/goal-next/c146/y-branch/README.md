# Original real Y range through selected branches

The original First FiveMap real radial ledger has 523 exact Natural
call IDs. C145 independently established 142 of those IDs. This replay
independently verifies 369 further rows on the same original 11 physical
roots and 1,745 registered native definition entries. All 369 are
outside the C145 set. The cumulative mathematical evidence for the
original radial criterion is 511/523.

## Source and semantics

The replay rereads the full original 4,420,257-record stream, checks
its uncompressed SHA-256, and matches each of the 159,655 reached
records against its original stream line. The pinned original
source producer and exact-functions runtime bind the selected rules.
At a piecewise comparison the before branch gives \(x\le l\), the
middle branch gives \(l<x<r\), and the after branch gives \(x\ge r\).
The after bound includes exact endpoint specialization. The guard
operands stay in the outer scope. At an integral the body variable
lies between the two defined real endpoints. Both endpoints stay in
the outer scope. Every native definition entry starts with no
caller range assumptions.

The independent checker walks source paths forward. It carries
atomic lower and upper range facts from a selected piecewise arm or a
bound integral variable. An interval fact for the body is added only
after both endpoints meet it. The walk resets facts depending on a
newly bound coordinate, including facts about opaque operations.
The exact normalizations use positive \(\Lambda,X_a\), the identity
\(\Lambda X_a=4\), and monotonicity of exp and log on their source
domains. Upper facts consequently reduce to comparison against
\(4e^{2t_1}\), \(X_ae^{2t_1}\), \(2t_1\), or
\(\log X_a+2t_1\). The pinned profile gives
\(4e^{2t_1}<256/63<5\).

## Results

- The first 223 added IDs pass without a lemma supplying the sign of
  the original loop-left endpoint.
- The remaining 146 pass after checking the original profile identities
  for \(\mathrm{loopILeft}=(4/\Lambda)e^{t_1/8}>0\),
  \(X_R=110(C_{\mathrm{selected}}P_*)^{10}>0\), and
  \(\mathrm{I1Right}=\mathrm{X0I1}\,e^5>0\). These are consequences of
  the same pinned source profile. Products with positive exponentials
  retain their sign wherever their source guard expression is defined.
- Removing the middle-arm upper implication opens six exact original
  IDs with Y operand #3845. The separate artificial unbound entry
  at #10205 opens precisely that original ID in its group.

The replay uses original First FiveMap defined real occurrences, with
no slow inverse bracket, native formal-to-actual bound transport,
external chart-image premise, or evidence from the later active N3
export. The exact 12 remaining original IDs are listed in
forward-branch.json with their typed operands. The published ledger
files and numerical final jet counts retain their existing status.
RELEASE HOLD.

## Replay

~~~text
python -B audit_branch_ranges.py C145/replay_original_y_ledger.py C145/admissions.json ORIGINAL_NO_LOOP_CONTROL.json ORIGINAL_ENTRY_LOCAL.json ORIGINAL_REACHED.json source-profile-data.mjs actual-global-source-expressions.mjs actual-continuation-exact-functions.mjs ORIGINAL_UNCOMPRESSED_STREAM_IN_GZIP forward-branch.json
~~~
