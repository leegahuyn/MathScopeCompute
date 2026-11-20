# Original initialized-mean operands with low-order time derivatives

**VERIFIED source recurrence.** The original grouped Forced mode-one source has mean and mean-increment factors with at most one prior spatial derivative. Covering all distributions of native `R+Z+L<=2,T<=1` through that source requires a conservative bank of 120 mean queries. Twelve extra queries cover the original second-`T` linear means in the low Signed-stress seed, including `beta_ZTT` from the axial pressure gradient. The exact earlier four-variable recurrence retains the original `I-chi*J`, the shift in `R`, the original directional Fourier inverse, and its extra `L^2` input. The verifier uses that complete recurrence and compares overlapping results with the earlier C103 replay.

The replay binds 759 covariance directions to the existing original Primary donors. Exactly two require degree eight, namely `W_rz(0,7,1,0)` and `W_rz(0,7,1,2)` in `RZTL` order. They are exact earlier C103 rows, present in the separate C103 higher-degree inventory, rather than extrapolations from degree-seven data. The remaining 757 are in the original C98 range. Taking successive derivatives of the original centered pressure and initialized radial-velocity formula produces the additional axial derivatives. The compact linear contribution only needs C98 degree-seven data. The compact nonlinear contribution retains 372 exact Leibniz branches; the mixed derivative orders of the original `P,Jz,Jtheta` moments reach 4, 4 and 5. The corresponding positive-time moment counts are 6, 6 and 8.

**CONDITIONAL compact mean.** The original compact map reproduces its fixed radial primitive and normalized moment coefficients, including the moving scaled coefficients. The coefficient charge is 28,589 units of `H/2^128` before restoring the annular Gaussian and 28,591 after restoration. On the original compact interval the exponent cost is bounded by `1/128^2+4/9 < 1`. The compact field remains flat and identically zero on the two designated narrow collars. The claim uses the pinned whole-path original Primary covariance and admitted native coordinate realizations.

**OPEN.** The packet alone leaves the noncompact collar transfer and the simultaneous whole original Forced and Signed estimate open. It leaves the final whole-field jets at 0/67 and the release on HOLD.

```text
python -B verify_mean_time_operands.py --goal GOAL_NEXT --primary PINNED_C98_GLOBAL_PRIMARY_COVARIANCE --out FRESH.json
```
