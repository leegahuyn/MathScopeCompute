# Original pre-Signed L²Z³T wave inputs

Two executions of the pinned original both-mode recurrence passed with byte-identical covariance and native schedule. Conditional on the admitted original analytic profiles, the genuine pre-Signed target `(R,Z,T,L)=(0,3,1,2)` is bounded in all six covariance components by
`exp(357940 H/2^128) ε ζ S^(107/2)` times the native residual collar-pole factor of degree 39. The admitted middle has no pole. The exact Haar/product ledger has 120 ordered products in each region.

The protected pre-Signed rz source is #21728334. The later W⁺ rz action #22031219 also has the independent Signed delta #22031063. The latter requires 62 pre-wave directions at L²Z³T. C127 and C128 together supplied 50 directions, and older spatial evidence for both modes supplied six more at T=0. The replay computes all 62 with the same original recurrence and includes the six previously missing positive-T directions. The case Z³T uses 26 directions, all already covered in each of C127 and C128.

The new six ModeOne gauges share phase-free grade ε^(29999/20000), with band at most 131/4, collar pole at most 51/2, middle pole zero and log rank 170394 in H/2^128 units. The corresponding ModeTwo gauges have grade ε^(99999/100000), retained ζ, an explicit `1/(2k)` carrier, band at most 53/2, collar pole at most 28 and log rank 57791. C107 native Signed geometry independently reproduces ordinary depth five and transverse χ depth three from the pinned cutoff and frame evidence. On the fixed chart, the identity `C=χ(ξ)B` and `LB=0` place every L on χ without any division at a zero of the cutoff. The four additional Σ directions are Z³T, Z⁴T, RZ²T and RZ³T and use no transverse Σ derivative.

The extended full recurrence uses 19 covariance targets, 86 gauges and 472 mean roles. It uses the original Primary through ordinary order 13 and L order 7, the original cutoff through order 12, and compact P/Jz/Jθ moments through 9/9/10. Both the source and the bounds are conditional on the same admitted fixed-label chart, native radial paths, smooth guard traces and analytic profiles as the pinned C128 recurrence. The output provides the complete pre-Signed donor for the separate numerical Signed pairing. The full Repeat and final jet closures remain open.

## Reproduction

`WORK` is the previous-cycle scratch evidence root (`work/goal-next`). `GOAL` is the repository evidence root (`tools/mathscope-cd-axial-bridge-20261029/goal-next`). `ORIGINAL_ROOT` is the extracted verified original runtime (`WORK/continuation66/stage2/runtime-exact`). `ORIGINAL_NAVIER` is `ORIGINAL_ROOT/research-ide/mathscope-m3/navier`. `C125`, `C127`, and `C126` are the respective source-census JSON paths shown in the receipt. Run with Python standard library only.

```text
python -B probe_late_pressure_l2.py --work WORK --goal GOAL --runtime ORIGINAL_NAVIER --demand C127 --prior C125 --frontier C126 --out fresh-requirements.json
python -B verify_late_pressure_l2.py --work WORK --goal GOAL --runtime ORIGINAL_NAVIER --prior C125 --frontier C127 --pointwise C126 --requirements fresh-requirements.json --schedule fresh-schedule.json --out fresh-covariance.json
python -B verify_late_pressure_l2.py --work WORK --goal GOAL --runtime ORIGINAL_NAVIER --prior C125 --frontier C127 --pointwise C126 --requirements fresh-requirements.json --schedule repeated-schedule.json --out repeated-covariance.json
python -B check_late_pressure_wave_receipt.py --work WORK --goal GOAL --runtime ORIGINAL_ROOT --first fresh-covariance.json --second repeated-covariance.json --requirements fresh-requirements.json --schedule fresh-schedule.json --out fresh-wave-receipt.json
```
