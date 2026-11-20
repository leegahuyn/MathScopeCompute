# C125 original pre-Signed mean inputs

This is a conditional source-bound arithmetic replay for the three newly
required pre-Signed old-mean operands. `verify_extra_mean.py` reuses the pinned
C103 whole-path and compact moment recurrences, C98 primary covariance, C11
higher primary covariance, C102 compact profile budget, and the pinned C119
original four-module source binding. The C125 dependency receipt, original
FiveMap nodes, moving scale, endpoints, and Sigma coefficient formula are
checked explicitly. All inputs are pinned in the program; the C119 binding
checks the four original source module hashes and exact code markers.

| Operand | Conditional compact factor | Coefficient log cap |
| --- | --- | --- |
| beta_ZZZTT | epsilon^2 S^(37/2) | 51952 H/2^128 |
| gamma_ZZTT | epsilon S^(25/2) | 51952 H/2^128 |
| v_ZZTT | epsilon S^(25/2) | 51952 H/2^128 |

The cap is exp(51952 H/2^128). Source profile, chart, temporal/Fourier, smooth
moving cutoff, and prior C98/C11/C103 analytic premises remain conditional.
This does not verify the newly demanded Forced covariance, Signed stress,
global seam conditions, or any complete gate. Release remains HOLD.

The combined recurrence needs 330 distinct primary covariance rows, of which
the only two beyond the C98 range are W_rz Z^6 T^2 and W_rz Z^6 T^2 L^2;
they require the C11 high donor. Linear compact covariance remains in C7.
Maximum moment orders are P=4, Jz=4, Jtheta=6. The new beta primitive has
Z^4 T^2 on its four source factors: 350 distinct Leibniz products of total
multiplicity 4096 per axial copy, with a nonzero moving-scale negative control.

Run from the workspace root with Python 3 (the work directory must contain the
pinned inputs under the paths named in the script):

```text
python work/goal-next/continuation125/sigma-extra-mean/verify_extra_mean.py --work work/goal-next --out work/goal-next/continuation125/sigma-extra-mean/reproduced.json
```

The two existing replays are byte-identical, SHA256
`b880bac8b64973a0bb7076d0b04105f7bcb84671585aa810701c96f5a271865e`.
The verifier SHA256 is
`340c4c855e1d3207196b61adb5f1b5b805d264890dc5423921222937497f4a3e`.
