# C132 original FiveMap source-wave coverage

`wave-157.json` compares the 157 candidate post-Signed W+ roles from the
original C131 conservative FiveMap recurrence against pinned C108 spatial,
C130 94-row, C127, C131 and new six-row conditional receipts. Of the 157,
144 have an attached receipt in this snapshot. The remaining 13 have
positive slow-time order; ten of them have all required source Sigma and
pre-gauge directions but still require an actual native paired-curl replay.
This is a conservative inventory, not a minimal actual FiveMap first-time
input list. In particular, the Sigma_R²Z²T demand appears only in that
unreduced inventory and is not asserted as necessary for the optimized
FiveMap route.

`six-caps.json` conditionally replays the six requested original W+ rows
rr, theta-theta, zz at Z³T with L^0/L². Each retains the actual fixed-label
Primary, Forced and Signed curls and original conjugate Haar pairings. All
six have whole-path epsilon grade 99999/100000. `two-caps.json` separately
does the same for W+_thetaz,T and W+_zz,T. The prior-gauge inputs pin the
source-authenticated C130 L9 and C131 matrix-order-nine receipts.

These are conditional on the same source frame, original admitted chart,
flat supports and Fourier assumptions. Other FiveMap inputs, full velocity
norms, M3/M4 and final jets remain separate. RELEASE HOLD. Each JSON has a
byte-identical second replay. The manifest records each file's SHA-256.

From the workspace root, with all pinned inputs available, run in order:

```text
python work/goal-next/continuation132/fivemap-wave-coverage/verify_pressure_six.py --work WORK --goal GOAL --out work/goal-next/continuation132/fivemap-wave-coverage/six-classification.json
python work/goal-next/continuation132/fivemap-wave-coverage/verify_pressure_six_caps.py --work WORK --goal GOAL --out work/goal-next/continuation132/fivemap-wave-coverage/six-caps.json
python work/goal-next/continuation132/fivemap-wave-coverage/verify_wave_157.py --work WORK --goal GOAL --out work/goal-next/continuation132/fivemap-wave-coverage/wave-157.json
python work/goal-next/continuation132/fivemap-wave-coverage/verify_independent_two.py --work WORK --goal GOAL --out work/goal-next/continuation132/fivemap-wave-coverage/two-caps.json
```
