# Original temporal pre-Signed covariance supplement

The original both-mode recurrence passes twice for 25 covariance directions, 116 wave gauges and 586 initialized mean roles. Both runs produce identical full covariance and schedule. The genuine added native all-six targets are (0,0,1,4), (0,1,1,3), (0,2,1,3), (1,0,1,3), (1,1,1,2) and (2,1,1,0), in (R,Z,T,L) order. All six components have εζ grade with common logarithmic coefficient rank 357940 in H/2^128 units. The independent Σ request takes rθ and rz at (2,1,1,0) with band S^(107/2), native residual pole 39 on either collar and zero pole in the admitted middle.

Six Primary covariance seeds in the shifted initialized mean use velocity L9 and potential L10. Protected both-sign rθ/rz source blocks have only χ² and χχ′ transverse monomials. The source cover gives Lξ=(4−√2)^δ and Lv=0 at fixed label. The exact ninth derivative has binomial mass 512 and reaches χ^(10). Its elementary factor cap takes 544 bits including 81^9 and the native offset scale. The original C106 cutoff recurrence reaches order 19, with frame through ordinary RZT order 15. Its enclosure covers the three new positive-T Primary L9 rows. The other three are independently pinned to C108 spatial evidence, with the earlier numerical rows also preserved exactly. Direct first-wave recipes have L≤7 for U, ≤5 for Uo and ≤6 for P, within their own prior L8 support.

The arithmetic applies under the original admitted chart, same-reference shifts, complete original radial paths, common torus and smooth guarded endpoint hypotheses. It supplies a pre-Signed donor for separate Signed pairing and Σ. Full Repeat and final jets remain open. Release stays HOLD.

## Reproduction

`WORK` is the previous-cycle scratch root `work/goal-next`. `GOAL` is the repository evidence root `tools/mathscope-cd-axial-bridge-20261029/goal-next`. Set `ORIGINAL_ROOT` to `WORK/continuation66/stage2/runtime-exact`, `ORIGINAL_NAVIER` to `ORIGINAL_ROOT/research-ide/mathscope-m3/navier`, and `ORIGINAL_RESEARCH_IDE` to `ORIGINAL_ROOT/research-ide`. Set these JSON input paths.

- `C125` uses `WORK/continuation125/sigma-rzt-zzt/sigma-rzt-zzt-dependencies.json`.
- `C127` uses `WORK/continuation127/late-wrz-sigma-dependencies/late-wrz-sigma-dependencies.json`.
- `C126` uses `WORK/continuation126/late-wrz-mixed-frontier/late-wrz-mixed-frontier.json`.
- `TEMPORAL` uses `WORK/continuation129/temporal-velocity-time/frontier.json`.
- `SIGMA_R2ZT` uses `WORK/continuation130/sigma-rrzt/recurrence.json`.

```text
python -B replay_temporal_presigned.py --action census --work WORK --goal GOAL --runtime ORIGINAL_NAVIER --prior C125 --frontier C127 --pointwise C126 --late TEMPORAL --sigma SIGMA_R2ZT --out requirements.json
python -B replay_temporal_presigned.py --action covariance --work WORK --goal GOAL --runtime ORIGINAL_NAVIER --prior C125 --frontier C127 --pointwise C126 --late TEMPORAL --sigma SIGMA_R2ZT --requirements requirements.json --schedule covariance-schedule.json --out full-covariance-first.json
python -B replay_temporal_presigned.py --action covariance --work WORK --goal GOAL --runtime ORIGINAL_NAVIER --prior C125 --frontier C127 --pointwise C126 --late TEMPORAL --sigma SIGMA_R2ZT --requirements requirements.json --schedule covariance-schedule-second.json --out full-covariance-second.json
python -B check_primary_l9.py --goal GOAL --runtime ORIGINAL_RESEARCH_IDE --requirements requirements.json --out original-primary-l9.json
python -B check_direct_primary_support.py --work WORK --requirements requirements.json --out direct-primary-support.json
python -B check_temporal_presigned_receipt.py --first full-covariance-first.json --second full-covariance-second.json --schedule covariance-schedule.json --schedule-repeat covariance-schedule-second.json --requirements requirements.json --l9 original-primary-l9.json --out temporal-presigned-supplement.json
```
