# Original native N3 stress at fixed lower histories

**VERIFIED.** The original N3 angular density `#123840` and axial density `#123841` recompile with their own eleven and twelve source terms. The guard has `Xminus=#28814`, `Xplus=#28824` and the original `eta=#2`. Replacing only the N3 coefficient leaves four lower transport products and the previous-order viscosity unchanged in each density. Two exact rational identities reproduce the remaining error densities. Omitting the first eta derivative in the axial flux or removing the shifted angular homogeneity term gives respectively six and twenty-four nonzero residual monomials. The original forward and backward signs, independent binders and fixed bounds come from the immutable C110 operand replay.

Let `u=Delta U3`, `f=Delta F3`, `p=Delta Pi3`, `V=Delta(Xv3)` and `V0=Xv0`, where the difference is original minus finite. Put `c=-A`, `a=-A-1/2`, `gamma=c+6h`, `beta=a+6h`, `omega=-2A+6h`, `tau=omega+1/2`. The ordinary source mass identity used in the replay is `V_X=-Z_gamma u` and `(V0)_X=-Z_c U0`. With the original `d=1-eta²` and `L=1-2h eta²`, define

```
Jz = 2 U0 u + p
Jt = 2 X (U0 f + u F0)
Bz = V0 u + V U0 - 2 X u_X + (X u - 2 eta X Jz)/L
Bt = 2 X (V0 f + V F0) - 4 X² f_X + (2 X² f - 2 eta X Jt)/L
Rz = (-(gamma+1)u + D eta u_eta + 2 eta (omega+1)Jz + d Jz_eta)/L
Rt = (-(beta+2)2X f + D eta (2X f)_eta + 2 eta (tau+1)Jt + d Jt_eta)/L.
```

The exact uncut error densities are `d_X Bz + Rz` and `d_X Bt + Rt`. The five original moment differences give `int u=0`, `int 2X f=0`, `int Jt=0`, and `int Jz=0`. For the last identity, use `p_X=2F0 f` at fixed lower history and ordinary integration by parts in the fifth moment. Both pressures retain the original zero axis gauge and the compensated outer zero. The integration bounds are fixed in eta, so the first eta derivative of each required moment identity also vanishes. The boundary terms vanish at zero and after the last bump by regularity, mass and pressure saturation. Thus the whole uncut signed error integrates to zero. On the original guarded interior the forward error minus backward error is the original uncut error integral from `0` to `Xminus`, divided by the corresponding radial normalizer. This formula retains that initial-prefix defect.

**CONDITIONAL.** The quantitative estimate assumes the original ordinary leading fields and moments used in C105/C110, including the fixed-endpoint eta derivative rule, source flat extensions, and the native value and first eta derivative tails with the original `Kcondition`. Keep exact N0, N1 and N2 fixed. Use `P_K` for the current velocity and regular average and `P_(K+1)` for pressure, as verified in C110. All estimates below are for real `eta∈[-1,1]` uniformly. For a field at fixed `X`, use `||g||_* = sup_eta |g| + sup_eta |g_eta|`. Let `H0=4096(1+U_*+F_*)` be the pinned C105 real leading norm from source roots `#2323,#2329`. In particular it bounds the needed real `U0,F0,v0` sizes through `Xplus`. The scalar dependency with 1,968 closed nodes is copied into the stress tail graph. Set `B=max(1,Xplus)`, `s=delta/(8*256^3)`, `E=1+2/s`, `e=4^-K/3` and `M=4 B² H0 E`.

The raw tail in `||.||_*` is bounded by `E e`. Hence each of the five local moment differences is bounded by `M e`. The full lower-moment difference is zero because the lower histories are exact and fixed. Write `R=Rbase`, `Ef=ef(0)`, `R1=R^(1-2lambda)`, `Rp=R^(-2-2lambda)` and `Rz=R^(-2lambda)`. The exact original amplitude `ef(eta)=Ef/(1+eta²)` gives `||1/ef||_*≤4/Ef` and `||ef||_*≤2Ef`. The inverse gain `Iu` is the maximum row sum of the original `Uinverse` with entry bounds `1+m²` against `[1/R,(1/R+4/(Ef R1))/(2lambda)]`. The gain `If` uses `Einverse` and `[1/R²,2/(Ef Rp),4/(Ef Rz)]`. The original bump height is at most `b0=2^15`. Set `bU=2 b0 Iu/R`, `bF=3 b0 If/R²`. Then the uniform `||.||_*` coefficient gains multiplying `e` are

```
TU = E + M bU
TF = E + M bF
TP = E + 2 B H0 E + 4 B Ef Rp M bF.
```

The pressure estimate retains the correct `K+1` raw error and both variable-bound prefixes. For the correction pressure, the derivative of the original positive angular monomial is accounted for using the actual eta-dependent amplitude in the `||.||_*` product. The common lower pressure terms cancel. The regular average keeps the same error bound as `U`, so the original mass formula gives `|V|≤16 B TU e`.

The source first two rows imply that the first raw `X` error is the `K−1` error in component four or five divided by `2 sqrt(X)`. Compute that quotient by the corresponding literal diagonal inverse. For `K>=Kcondition+2`, each input value and derivative is bounded by the original `K−2` tail, at most `16 E e` in the sum norm. The row has six entries in each coefficient matrix, each dominated by the original matrix bound `Ma`. Thus `X|Delta F_X|` and `X|Delta U_X|` have raw gains at most `48 B Ma E`, including the regular one-sided axis value. The taper adds `1024/t1` because the original `X kappa_X` is bounded by `64*9/t1`. The original bump derivative in normalized radius has bound `b1=8192*2048²=2^35`. Writing `y=sqrt(2X)/R`, each bump is supported at `1≤y≤4`, and `X d_X y=y/2`. Hence one can use weighted radial gains

```
DU = 48 B Ma E + 1024/t1 + 4 b1 Iu M/R
DF = 48 B Ma E + 1024/t1 + 3 (b1+b0) If M/R².
```

With `T=max(1,TU,TF,TP,DU,DF)`, the two boundary caps are `33 B H0 T e` and `58 B² H0 T e`. The two remainder caps are `22 H0 T e` and `36 B H0 T e`. Thus the absolute normalized integral error gains before dividing by the radial normalizer are bounded by `88 B H0 T` and `152 B² H0 T`, regardless of the chosen original integration direction. The axial and angular divisors are `sqrt(2X)` and `2X`. The guarded intervals have length at most `B`. Choose

```
G = 256 B³ H0 T max(1,1/sqrt(2 Xminus),1/(2 Xminus))
K = max(Kcondition+2,ceil(log_4(2^256 G))).
```

Each original forward stress error and each backward error on the original guard has uniform pointwise and absolute `L1(dX)` bounds at most `G 4^-K/3 < 2^-256`. The closed original gain and depth are symbolic. No formatted iterate is used in place of an infinite solution, and no certified depth is evaluated numerically.

**OPEN.** An independent exact coupled calculation now verifies the lower perturbation in `Omega2`, raw known pressure, and both angular and axial forcing slots with zero rational numerators. All 72 entries of the actual two matrices remain fixed. Quantitative coupling needs higher original N2 mixed estimates for `v2`, `v2_X` and `X v2_XX` with their eta traces over all switched branches, as well as the previous-order viscosity terms and a common ordinary analytic source strip on which the paired forcing is controlled. The C106 lower stress error alone does not provide those inputs. General Y, global jets and release remain open or on hold as before.

## Replay

Use the cached original M2 navier runtime and three earlier immutable inputs. The inputs are C110 `native-n3-operands.json`, C105 `coupled-n2-operands.json`, and C106 `coupled-n2-stress.json`. Pass fresh output paths.

```text
node replay_n3_fixed_stress.mjs ORIGINAL_RUNTIME C110_NATIVE C105_LEADING C106_PAIRED NEW_OPERANDS
python -B check_n3_fixed_stress.py --operands NEW_OPERANDS --out NEW_RESULT
```
