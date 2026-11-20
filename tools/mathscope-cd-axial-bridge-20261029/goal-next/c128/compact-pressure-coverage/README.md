# C128: 34 original compact mean inputs

The C127 original Signed pressure dependency census requests 34 additional
initialized compact mean directions. This source-pinned replay checks that
all 34 are among the 364 actual mixed mean requests in the original C128
pre-Signed pressure receipt. Six of them also match the independent C128
high-TT receipt. The other 28 include high first-time directions such as
beta_Z7T, whose source requires Jtheta_Z8T.

The replay recomputes the exact C103 compact moment sets and all 1,593
quadratic Haar branches for the 364 requests, and confirms that they match
the original pre-Signed evidence. The 34 requested roles need moment orders
at most P=7, Jz=7 and Jtheta=9. The original order-10 moving-profile budget
then reproduces the recorded coefficient log charge 59326 H/2^128. Each row
in `coverage.json` lists its epsilon and S exponents. If one Gaussian zeta
is restored on the admitted compact support, the stated coefficient charge
is 59327 H/2^128. Both source collars have zero compact contribution.

This is a conditional bound for the **initialized compact mean only**, using
the pinned original C98/C15 frame, admissible chart, source paths, moving
cutoff, smooth support, and Fourier premises. Post-Signed covariance,
noncompact mean, local stress and the complete Sigma join are separate.
Release remains HOLD.

From the workspace root, with all pinned original inputs present:

```text
python work/goal-next/continuation128/compact-pressure-coverage/verify_compact_pressure_coverage.py --work work/goal-next --out work/goal-next/continuation128/compact-pressure-coverage/reproduced.json
```

Two executions produced byte-identical output SHA256
`3ac0131ed8c4082dd3be8b25797c818114b3c8a0cd81837927ae52066529aeb6`.
