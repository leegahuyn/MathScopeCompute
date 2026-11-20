# Paired native N1, N2 and N3 on the original common radial collar

**VERIFIED.** The immutable C110 N3 prefix replays with actual systems `#3` and `#5` at N2 and N3, the same leading operands, original `eta`, actual radial endpoint `aSquared=#24805`, and the exact native diagonal `[0,0,2,0,3,1]`. Both 6-by-6 matrices are reconstructed using the original kernel at `4h` and `6h`. The original pressure and both angular and axial lower forcing identities are retained. The earlier exact C110 pressure and `Omega2` perturbation evidence stays in force.

For a current velocity error `f` at prescribed Picard depth, let `w` be the corresponding preceding-iterate error of component 4 or 5, with source diagonal `d_i=3` or `1`. If `r_i` is the corresponding difference of right-hand sides, then

```
f_X = w/(2 xi)
X f_XX = (r_i - (d_i+1)w/xi)/4,
```

where `X=xi²`. The second identity follows by differentiating the first and using the original diagonal equation for `w`. Both exact rational numerators vanish and both controls omitting the extra geometric `+1` fail. The quotient is computed as the actual regular source integral `w/xi=int_0^1 t^d_i r_i(t xi,eta) dt`; its axis limit is retained. This gives the weighted second radial derivative without differentiating the lower forcing in `X`.

**CONDITIONAL.** Use the established C98/C105 original ordinary leading, Picard and paired N1 input bounds. The native N1 strip is `delta/8`; use the C105 comparison strip `s1=delta/16`. Keep the native N2 and N3 strips `s2=delta/2^19`, `s3=delta/2^27`, the original real radial interval `[0,a²]` and `a=sqrt(aSquared)`. Use the original bounds `0<h<1/128`, `Q>2^260`, `delta^-1<Q²` and `a²=4 Q^-64 exp(t1/16)<5 Q^-64`. This covers both sides of the original B.26 radial core join with real `X`. The Cauchy bounds apply only in `eta`.

Let `Ma=2^20 Q^4`. The original matrix row sums are verified with the common `|exponents|<=4` envelope at `4h` and `6h`. The source leading bounds in C98/C105 give `F0<=8Q`, `F0_X<=16 Lambda Q²`, `U0<=8`, `U0_X<=Q/4` and `v0<=2^9/delta` in modulus on the needed input strip. Products with `X≤a²` give the C105 source bounds for `F0+X F0_X`, `X U0_X` and the shifted `Z` terms. The repeated matrix sum check stays below `2^20 Q²/delta`. In a length-`k` Volterra word, split the Cauchy loss on `S_(2s3)` to `S_(s3)` into `k` equal pieces. Each diagonal factor is at most one, the simplex contributes `a^k/k!`, and the at most `2^k` words and `k^k/k!<3^k` give

```
6 Ma a / s3 < 2^52 Q^-26 < 1/2.
```

This is a new paired N3 stability region on the full original common radial collar. The forced difference is bounded there by twice the initial diagonal integral, of norm at most `a Fd3`.

For each stage write `epsilon_j=4^-Kj/3`. Use the C105 N1 error `e=e0 Q^(-25(N-2))` and `Fd2=(2^25 H1/s1²)e`. The old paired N2 source value bound is `E2=epsilon_2+2a Fd2` on `S_s2`. For `K2>=Kcondition2+2`, its `K2−2` version is at most `16 E2`. One Cauchy loss to `S_(s2/2)` pays `2/s2` for the input derivative, so the original right-side difference has cap `J2=16 Ma (1+2/s2) E2+Fd2`. The first raw derivative has cap `J2/2`, and the weighted second derivative has caps `5J2/4` and `3J2/4`. All three hold through the regular axis. For `w=t1/64`, the actual cutoff gives

```
k1 = 9/(w Xa)
k2 = 9/(w Xa²)+8192/(w² Xa²)
Lcut = 1+3 k1+k2
N2Cut = Lcut (E2+2 J2).
```

`N2Cut` bounds each of the actual cut N2 velocity value, first `X` derivative and `X`-weighted second `X` derivative errors on `S_(s2/2)`. The original cut N1 inputs have the corresponding cap `e`. The two true lower velocities can be bounded by the native norms `M_i` and forcing caps `C_i` using the same diagonal formulas. The code chooses `P` as the maximum of one, the native leading `B_inner`, and `Lcut*(M_i+2*(Ma*(1+2/s_i)*M_i+C_i))` for `i=1,2`. This keeps the real ordinary leading and lower analytic floors, with no arbitrary profile coefficients. The eventual depth ensures `e+N2Cut≤1`, so the finite lower norms use at most twice `P`.

The exact regular mass reconstruction `avg(U)=int_0^1 U(tX)d t` controls `v`, `v_X` and `Xv_XX`, with the factor `t(tX)U_XX` in the last integral. Its eta derivative costs `4/s2` on the next strip, so a common charge is `64/s2`. For the subsequent `Z`, weighted first `X` derivative of `Z`, twice-applied `Z` and `T`, conservative charges are `2^8/s2`, `2^8/s2`, `2^17/s2²`, and `2^7/s2`. They follow from one or two Cauchy losses with `16/s2`, `|eta|≤2`, `|d|≤5`, `|L^-1|≤2` and `X≤1`. The resulting domain `S_(s2/16)` contains `S_(2s3)`. Summing the exact nine `Omega2` terms and all changes in the original lower pressure, angular and axial forcings gives

```
Fd3 = 2^35 P (e+N2Cut)/s2^4
E3  = epsilon_3+2a Fd3
J3  = 16 Ma (1+2/s3) E3+Fd3
N3Cut = Lcut (E3+2 J3).
```

The same native comparison at `K3>=Kcondition3+2` yields local pointwise bounds for original versus paired finite N3 raw and cut `F3,U3`, their first and `X`-weighted second radial derivatives, each through real eta order three by Cauchy on `S_(s3/2)`. The original pressure stays stored at `P_(K3+1)` and its raw value and first three eta derivative errors fit the same common bound. The script constructs the positive linear budget `e+N2Cut+6(1+16/s3)^3(E3+N3Cut)` and separates its three positive coefficients at `(e,epsilon_2,epsilon_3)`. It builds closed original depths `N,K2,K3` with each contribution less than `2^-258`. Their sum is strictly less than `2^-256`. These are symbolic original depths. No finite center is numerically evaluated.

**OPEN.** The whole N3 pressure and stress still use the global N2 Ipos and lower `Omega2` histories. The exact minimal additional error norms needed by the real whole `Omega2` first eta trace are the paired N2 `C_eta^3` value and fixed-average error of `U2`, the paired `C_eta^2` errors of `U2_X` and `XU2_XX` and their averages, plus the corresponding bounded true/finite fields and pressure and flux debts. The collar portion is supplied here. For the Ipos part it suffices to reprove the incoming N2 debts in real `C_eta^3`. The current C105 debts use only real `C_eta^1`. The `U1 Z v0` term in the original `Omega1` then needs the true leading `U0` through eta order five via its regular average. No claim of the full paired N3 coefficient or stress bound is made. General Y and final jets remain open, and release remains HOLD.

## Replay

Use the cached original M2 navier runtime, C110 `n3-fixed-stress-operands.json`, and C105 `coupled-n2.json`. All outputs must have fresh paths.

```text
node replay_n3_coupled_local.mjs ORIGINAL_RUNTIME C110_STRESS_OPERANDS C105_PAIRED NEW_OPERANDS
python -B check_n3_coupled_local.py --operands NEW_OPERANDS --out NEW_RESULT
```
