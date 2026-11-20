# Original whole N2 eta-five and N3 eta-three error bank

**VERIFIED.** The source leading norm producer executes at radial order two and eta order seven. Its two original whole leading roots are `#4328` and `#4334`, with 3,496 closed scalar nodes. The original N4 graph prefix remains unchanged. The two branches of `Omega1/X`, `Omega2/X`, and `Omega3/X` recompile with seven, nine, and eleven terms per branch, with previous-viscosity orders zero, one, and two respectively. All nine whole lower moment integrals preserve the original eta, separate radial binders, and source range `[0,Xplus]`. The matrix inverses and actual `Ipos` supports are the same as the C110 mixed derivative replay. The exact amplitude identity is `ef(eta)=Ef/(1+eta²)`, with `Ef=ef(0)`. The normalized radius, `Ipos` endpoints and outer guard are eta independent.

**CONDITIONAL.** Assume the pinned original ordinary leading and Picard realizations, the C105 paired N1 bounds, the C110 common native radial cutoff and mixed bounds, and the fixed-bound source moments with their ordinary eta derivatives and flat radial extensions. The leading is held fixed and both positive lower stages are paired. Use `||g||_m=sum_(j=0)^m sup_eta|d_eta^j g|/j!` over `eta∈[-1,1]`, where this norm is submultiplicative. For `m≤7` the original geometric bounds are `||eta||_m≤2`, `||d||_m≤4`, `||1/L||_m≤512`, the last by Cauchy at radius `1/2`. For the original radial mass formula these yield a common gain `2^16` from `U` and its regular average through eta `m+1` to `v` through eta `m`, for `m≤6`. The same charge applies to first radial and `X`-weighted second radial derivatives. For the second derivative the averaged term uses `X t² U_XX(t X)=t (tX) U_XX(tX)`. The exact pressure is kept at `P_(K+1)` for the velocity at `P_K`.

Write `B=max(1,Xplus)` and `H=2^22(1+U_*+F_*)` from the actual source leading norm. It bounds the needed `U0,F0,v0` and radial derivatives. The leading `v0` through eta six uses the original `U0` through eta seven. The needed ordinary `Z`, weighted radial derivative of `Z`, `T`, and twice-applied `Z` charges are bounded by `2^15 B`, `2^15 B`, `2^14 B`, and `2^31 B²`. For two `Z` applications at eta order three, first bound `Zg` through eta four and its weighted radial derivative through eta three. On the leading profile the available unweighted second derivative costs at most the same two factors of `B`. The loads are exact integers in the independent arithmetic replay.

## Whole N2 eta-five transfer

Use `s1'=delta/16` for the C105 N1 comparison width, native `s1=delta/8`, and let `s2,s3` be the unchanged native widths. The local C110 error inputs are `e` for paired N1 and `N2Cut,N3Cut` on `S_(s2/2),S_(s3/2)`. The original native norm `Mi`, source input bound `Ci`, common matrix cap `Ma=2^20 Q^4`, and the original thin cutoff derivative factor `Tcut=1+3k1+k2` give the true cut radial magnitudes through `S_(si/2)` by

```
Abs_i = Tcut*(Mi+2*(Ma*(1+2/si)*Mi+Ci)).
```

This is the original first and weighted-second `X` image through the diagonal inverse, with a Cauchy loss in eta only. The final depths ensure `e,N2Cut,N3Cut≤1`. For N1 let `L1=(1+Abs_1)(1+1/s1')^5`. The true and finite original N1 cut values have this real eta-five norm bound, as do the needed first and `X`-weighted second radial derivatives. The original leading `Omega0/X` has eta-five cap `O0=2^18 B H²`. Its exact moment contributions give original N1 incoming cap `W1=4 B² H L1+B² O0`. Thus `A1=2^16(L1+W1 Qbump)` bounds the needed true and finite whole N1 fields, using the original amplitude and Ipos derivative gains `Qbump=UGain+FGain`. In particular `F1,U1` retain eta-five norms and the corresponding radial `v1` norms through eta four. The gain in `||1/ef||_m` for all `m≥2` is `5/Ef`, so the same actual inverse row bounds, normalized bump profiles and their radial derivatives as in C110 apply at these orders.

The paired whole N1 error is controlled by `D1=2^18(1+1/s1')^7 e`. It includes radial `v1` through eta six from the C105 analytic eta error and just one differentiated regular average. In the exact seven-term `Delta Omega1`, the previous leading viscosity term cancels. The remaining leading–error products and the time and radial terms give `DeltaO1=2^18 B H D1` in eta five. The three original lower N2 nonlinear integrand errors have the common eta-five cap `Dlow2=4B A1 D1+B DeltaO1`, with the factor `X` retained in the fifth debt. Put

```
eta2 = (1+2/s2)^5 N2Cut
M2err = 4 B² H eta2 + B Dlow2
S2 = eta2 + Qbump M2err
D2 = 2^16 S2.
```

`M2err` applies separately to all five original N2 incoming moments. `S2` bounds the whole `F2,U2` errors in eta five for the value, first `X` derivative, and `X`-weighted second `X` derivative. `D2` gives the analogous `v2` errors through eta four. The mass representation and its zero exterior are the same source formulas. The eta-five argument uses Cauchy only for the N1 and native lower errors, and ordinary fixed-bound differentiation for the whole moment integrals.

## Whole N3 eta-three transfer

For n=2 use `L2=(1+Abs_2)(1+2/s2)^3` for true and finite local real eta-three radial magnitudes. The original seven-term whole `Omega1/X` has eta-three magnitude bound `O1=2^33 B² H A1`. Its prior `Z² v0` uses the unchanged leading bank. The N2 incoming magnitudes are at most `W2=4B² H L2+2B²(A1²+O1)`. The true and finite whole N2 values and requisite radial forms after applying the original inverse are bounded by `A2=2^16(L2+Qbump W2)`, for `F2,U2` through eta three and `v2` through eta two. The eta-three *error* calculation in `Omega2/X` can use the stronger `D2` from above. In its `(0,2)` and `(2,0)` pairs, the fixed leading factor multiplies the N2 error. The `(1,1)` pair uses the true and finite N1 magnitude bounds. The previous-order `Z²` acts on the N1 error. With `A=max(1,H,A1,A2)` the actual bounds are

```
DeltaO2 = 2^33 B² A(D1+D2)
Dlow3 = 2^35 B³ A(D1+D2)
eta3 = (1+2/s3)^3 N3Cut
M3err = 4 B² H eta3+B Dlow3
S3 = eta3+Qbump M3err
D3 = 2^16 S3
P3 = eta3+B(2 H S3+Dlow3).
```

The first two bound the whole eta-three `Omega2` and all three original nonlinear lower integrand errors. `M3err` bounds all five original N3 debts. `S3` gives the same whole radial error family for `F3,U3` through eta three and `D3` the family for `v3` through eta two. The `P3` bound gives whole `Pi3` through eta three using both original pressure prefixes and the matched native storage. The derivative of its pressure variation is `2F0 DeltaF3+Delta p_known`, with the two lower pressure histories and the complete outer gauge retained. The result additionally records the true and paired N3 full value magnitudes needed in N4 cross-products, using the same `Omega2` source forms and original normalized correction.

The exact source scalar graph builds the positive linear estimate `e+N2Cut+N3Cut+120(D2+D3+P3)` from the three underlying error parameters `e`, `4^-K2/3`, `4^-K3/3`. All original parameter and norm operands are fixed. The three closed symbolic depths make each contribution less than `2^-258` and require `Kj>=Kcondition_j+2`. The factor `120=5!` converts the norm bound into a bound on each individual ordinary derivative, so every listed error is strictly below `2^-256` on the whole real source support. Neither the closed depths nor the finite centers are evaluated numerically.

**OPEN.** This bank supplies the paired whole mixed inputs needed for the N4 `Omega3` first eta trace and its previous `Z² v2` term. The full paired N4 pressure, compensation and stress aggregation is a separate source check. General Y and final jets stay open and release stays HOLD.

## Replay

Run `node replay_eta_bank.mjs ORIGINAL_RUNTIME C112_FIXED_N4 C110_WHOLE_N2 C110_LOCAL_N3 C111_WHOLE_N3 NEW_OPERANDS`. Then run `python -B check_eta_bank.py --operands NEW_OPERANDS --out NEW_RESULT`. All four operand receipts and original source modules are hash pinned.
