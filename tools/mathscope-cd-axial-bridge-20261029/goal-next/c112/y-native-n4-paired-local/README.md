# Paired original N4 on the common native radial collar

**VERIFIED.** The original N4 pressure and forcing are reconstructed at physical order four with the unchanged matrices and native eta. With the exact leading field held fixed and all three positive lower fields paired, the `Omega3`, known pressure, angular forcing and axial forcing differences have zero exact rational numerators. The previous-order `Z²` acting on `Delta v2` in `Omega3` is essential. Removing it gives 312 residual monomials. The known pressure retains `2F1F3+F2²` and the angular and axial inputs each retain previous viscosity on `Delta F3` or `Delta U3`. The full actual matrices keep all 72 coefficient entries.

**CONDITIONAL.** Use the original ordinary C98/C105 leading analytic inputs, native Picard solutions and paired C110 local estimates. On `0≤X≤a²`, retain the original real core and B.26 collar and the actual eta tube. With `Ma=2^20 Q^4`, `a<3 Q^-32`, `delta^-1<Q²`, and `s4=delta/2^35`, the original ordered Volterra words have ratio `6Ma a/s4<2^60 Q^-26<1/2`. The source matrix proof retains the same leading operands and `|exponents|≤4` audit at `8h`. The each-word Cauchy losses occur in eta, with the source radial diagonal inverse and ordered integration retained.

Write `e` for the original N1 cut perturbation and use `N2Cut,N3Cut` from the exact local C110 recursion. On `S_(s3/2)` they control the value, first radial derivative and `X`-weighted second radial derivative. The true original field cap `H3` is the maximum of one, the leading `B_inner`, and for `j=1,2,3` the original norm-based caps `Lcut*(M_j+2*(Ma*(1+2/s_j)*M_j+C_j))`. Here `Lcut=1+3 k1+k2` is the original thin cutoff derivative factor. The resulting paired lower cap is at most `2 H3` by the final depth choices. The original average formula bounds `v,v_X,Xv_XX` with charge `64/s3`. On the smaller eta strips the original `Z`, weighted radial derivative of `Z`, twice-applied `Z`, and `T` charges are `2^8/s3`, `2^8/s3`, `2^17/s3²`, and `2^7/s3`. In particular `S_(s3/16)` contains the native input strip `S_(2s4)`. For the eleven-term `Omega3` difference use the two linear terms, four terms of each transport type and the previous `Z²` term. The exact product difference is `a b-a_hat b_hat=(a-a_hat)b+a_hat(b-b_hat)`. Including the known pressure and all three original nonzero forcing rows gives

```
Fd4 = 2^36 H3 (e+N2Cut+N3Cut)/s3^4
E4 = 4^-K4/3 + 2 a Fd4
J4 = 16 Ma (1+2/s4) E4 + Fd4
N4Cut = Lcut*(E4+2 J4).
```

The native `K4−2` tail provides the exact first radial and weighted second radial images as in the original N2/N3 comparison. The raw and cut `F4,U4` errors for value, `d_X` and `X d_X²`, and the raw pressure error with `P_(K4+1)`, are covered through real eta order three by `6(1+16/s4)^3(E4+N4Cut)`. Choose the four explicit closed original depths using the positive linear coefficients of this bound plus `e+N2Cut+N3Cut`. The source budgets pay each of the four contributions by less than `2^-259` and keep the original `Kcondition_j+2` floors. Their sum is less than `2^-256`. The closed depths preserve the native pressure storage and no finite numerical center is evaluated.

**OPEN.** The positive-order lower estimates used here run on the common radial collar. The whole N4 paired lower moments and stresses still require the whole higher eta input identified in the fixed-history packet. No general Y, final jet or release status changes.

## Replay

Run `node replay_n4_paired_local.mjs ORIGINAL_RUNTIME C112_FIXED_OPERANDS C110_PAIRED_LOCAL_OPERANDS NEW_OPERANDS`, then `python -B check_n4_paired_local.py --operands NEW_OPERANDS --out NEW_RESULT`. The inputs and source runtime are hash pinned.
