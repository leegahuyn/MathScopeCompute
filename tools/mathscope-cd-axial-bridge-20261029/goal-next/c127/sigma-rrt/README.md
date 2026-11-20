# C127 original Signed Sigma_RRT and old L²v_TT

The source-bound census uses the exact existing C108 recurrence at target
RRT on both original Signed flux kernels #22001223/#22001224, including the
actual incremental pressure #22000443 and original radial endpoints
#17743711/#17743713. Previous C119/C125 all-six-component Forced donors did
not include W^-_rtheta,RRT or W^-_rz,RRT. The C127 pre-Signed receipt provides
those two with the same original source family.

The original local RRT stress is checked with the exact radial and temporal
chain rule, retaining 18 terms and the original cutoff/profile assumptions.
The new compact initialized gamma_RTT and v_RTT rows are separately replayed;
their common upper bound is epsilon S^(19/2) exp(30468H/2^128). The
three-region source recurrence attaches both new inputs and the original
C117/C119 time and mixed-time local stress donors. Its conditional joined
Sigma_RRT bound is epsilon zeta S^(101/2), collar pole at most 36, and
coefficient exp(524329H/2^128). Every resulting source trace is checked
against the independent source census.

An additional original Temporal mean input for the late direct swirl is
L²v_TT. The replay gives temporal grade epsilon^(99999/100000) S^(21/2),
with coefficient exp(26998H/2^128). Its native compact FiveMap contribution
is exactly zero because that compact field is independent of L.

These are **conditional** source-bound estimates. Their original admitted
fixed-label chart, source mean/covariance bounds, support, cutoff and Fourier
premises remain necessary. They do not establish full post-Signed evolution,
complete M3/M4 gates, final jets or release readiness. RELEASE HOLD.

From the workspace root, with Python 3 and the pinned input files present,
replay in the following order. The full `WORK`, `GOAL`, and `RUNTIME` paths
must point to the corresponding original inputs; use any output filenames.

```text
python verify_sigma_rrt.py --work WORK --goal GOAL --out replay.json
python verify_local_rrt.py --work WORK --goal GOAL --out local.json
python verify_compact_rrt.py --work WORK --out compact.json
python verify_sigma_rrt_join.py --work WORK --goal GOAL --runtime RUNTIME --out join.json
python verify_old_v_ttl2.py --work WORK --out old-v-ttl2.json
```

Here `RUNTIME` is the pinned original `mathscope-m3/navier` directory. The
scripts live beside this README. Their outputs in this directory are paired
with byte-identical second replays. `MANIFEST.json` lists their SHA-256 hashes.
