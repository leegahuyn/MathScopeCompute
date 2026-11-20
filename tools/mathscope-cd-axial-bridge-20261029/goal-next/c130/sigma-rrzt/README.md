# C130 original Signed Sigma_R²ZT

The source-pinned recurrence targets the two original Signed flux kernels
#22001223/#22001224, with incremental pressure #22000443 and original fixed
radial endpoints #17743711/#17743713. It uses the existing C125 arithmetic,
with the same expanded readback bank already used by C128. It finds two new
pre-Signed covariance components at R²ZT, namely r-theta and rz; two new
compact means gamma_RZTT and v_RZTT; and the R²ZT local stress.

The new compact means are conditionally bounded by epsilon S^(25/2) with
coefficient exp(30467H/2^128), using 300 original C98 covariance roles. The
local stress is conditionally bounded by epsilon zeta with inner/outer/middle
poles 12/15/0 and coefficient exp(H/2^252); its exact source chain has 96
terms. All three source, compact, and local calculations have byte-identical
second replays. The 52 noncompact mean product roles used by the target
appear in the 364-row C128 original high-pressure mean roster.

The previous pre-Signed receipt does not contain the actual R²ZT covariance
row and is rejected by the join. The new original-source all-six row includes
the exact census hash, and the three-region Signed recurrence accepts it
alongside the separately pinned compact and local inputs. The resulting
conditional Sigma_R²ZT cap is epsilon zeta S^(107/2), pole at most 39 and
coefficient exp(524333H/2^128). All bounds remain conditional on the original
admitted fixed-label source, chart, support, Fourier premises, and the original
frame hypotheses. The independent L9 native-shape checker and all six L9
rows are pinned into the joined receipt. Full post-Signed covariance,
M3/M4 gates and final jets are separate. Release remains HOLD.

From the workspace root, with the pinned input files present, run in order
(the last replay requires the actual additional pre-Signed receipt):

```text
python work/goal-next/continuation130/sigma-rrzt/verify_sigma_rrzt.py --work WORK --goal GOAL --out work/goal-next/continuation130/sigma-rrzt/recurrence.json
python work/goal-next/continuation130/sigma-rrzt/verify_compact_rztt.py --work WORK --out work/goal-next/continuation130/sigma-rrzt/compact.json
python work/goal-next/continuation130/sigma-rrzt/verify_local_rrzt.py --work WORK --goal GOAL --out work/goal-next/continuation130/sigma-rrzt/local.json
python work/goal-next/continuation130/sigma-rrzt/verify_sigma_rrzt_join.py --work WORK --goal GOAL --runtime RUNTIME --extra EXTRA --extra-sha 797fe48f34b1cfcd7c5e66e78955ba17d5bb2b6edd8176cfbd79ec4e14d13fac --out work/goal-next/continuation130/sigma-rrzt/join.json
```

`RUNTIME` is the pinned original `mathscope-m3/navier` directory. `EXTRA` is
the authenticated C129 `full-covariance-first.json`. The final two joined
replays are byte-identical, SHA256
`00d57efc37cceec1dcc907792d9da7db92278ed77298c6b52bef008c402e2cc3`.
The previous joined receipt is retained as `join-before-l9.json`.
