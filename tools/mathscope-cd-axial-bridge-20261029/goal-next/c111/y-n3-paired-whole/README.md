# Whole paired original N3 pressure and stresses

**VERIFIED.** The original paired N3 route recompiles with all nine source `Omega2` terms in each of its two branches, the native switch at `aSquared` and the cutoff at `Xplus`. It preserves the native `eta=#2`. The exact source variation of the twelve-term axial density `#123841` and eleven-term weighted angular density `#123840` has the coupled conservative forms below. The two rational numerators are zero. Removing the lower transport boundaries gives residual counts `696,936`, while removing previous-order viscosity gives `368,354`. The weighted angular viscosity shift and all five moment identities under arbitrary new source debts pass. The original normalized forward primitive uses `Xminus=#28814 → X` with a minus sign. The separate backward density uses `X → Xplus=#28824` with a plus sign. The immutable native and mixed-input C110 packets are inputs to this replay.

**CONDITIONAL.** Use the original ordinary native leading fields and analytic eta tails, the original fixed-endpoint moment integrals with first eta differentiation, and the ordinary source pressure and flat extension identities already used by C105/C110. These conditions are needed for interpreting the symbolic graph as the physical source functions. The proof treats the same exact leading field on both sides and pairs all three positive orders. There is no numerical evaluation of the finite field centers or the certified term counts.

## Whole lower errors and original magnitude floors

Use `||g||_m = sum_(j=0)^m sup_eta |d_eta^j g|/j!` at fixed real `X`, and `B=max(1,Xplus)`. This norm is submultiplicative. The original real geometry supplies `||eta||_m≤2`, `||d||_m≤4`, `||1/L||_m≤128` for `m≤5`. Use the source leading envelope `H=2^20(1+U_*+F_*)` at radial-2 and eta-5. It covers the needed `F0,U0,v0` and mixed radial derivatives with fixed ordinary average. The leading source scalar program has 2,659 copied positive nodes. Write `Lcut=1+3k1+k2`, `Ma=2^20 Q^4`, `E(s)=1+2/s`, and `Mi,Ci,si` for the corresponding original native norm and input caps. For each true lower solution define a radial cap through `S_(si/2)` by

```
V_i = Lcut*(Mi+2*(Ma*E(si)*Mi+Ci)).
```

This uses the exact original diagonal inverse for the raw first and `X`-weighted second radial derivatives. In this formula `s1` is the native N1 width `delta/8`. Below, `s1'=delta/16` denotes the C105 comparison width. Together with the N1 difference `e≤1`, the matched true and finite N1 raw/cut values and first and weighted second derivatives are bounded in `||.||_3` by `LB1=(1+V_1)*(1+1/s1')^3`. Put `O0=2^15 B H²` for the original leading `Omega0/X` density and `W1=4 B² H LB1+B² O0` for the N1 source incoming moments. The whole mixed N1 bound and its actual regular mass projection are dominated by `A1=4096*(LB1+W1*QBump)`, where `QBump=UGain+FGain` is the closed positive sum of the original inverse-and-bump estimates in the whole N2 mixed packet. This bounds the needed true and finite N1 `F,U,v` magnitudes, including the radius derivatives on the support.

The full true and finite N2 `F,U` value bound in `||.||_1` starts with `LB2=E(s2)*(1+M2)`. The same N1 floors bound the seven terms of either `Omega1/X` in `||.||_1` by `O1=2^30 B² H A1`, including the unchanged leading twice-applied `Z` term. The original N2 incoming moment cap is `W2=4B² H LB2+2B²(A1²+O1)`. The value correction gains `uValue+fValue` and the regular average then give `A2=4096*(LB2+W2*(uValue+fValue))` for true and finite N2 `F,U` in `||.||_1` and `v2` in value. The proof uses mixed error derivatives of `v2`. The cross-products involving fixed leading and pure N2 terms require no true or finite mixed derivative norm of `v2`.

Let `A=max(1,H,A1,A2)` and `D1=2^16(1+1/s1')^5 e` be the needed N1 mixed error cap, including its regular radial component. Use the whole paired N2 bank `S2=g1 e+g2 N2Cut`. The code uses the same gain construction with the N1 value cap `A1`. Set `D2=4096 S2` for the corresponding F/U and `v2` error jets, including `v2,v2_X,X v2_XX` through the second eta derivative. Write `Derr=D1+D2`. The `Z`, weighted radial `Z`, `T`, and twice-applied `Z` charges in the required norms are bounded by `2^13 B`, `2^13 B`, `2^11 B`, and `2^28 B²`. For the last charge, first bound `Z g` in the second eta norm and `X d_X Z g` in the first eta norm. The derivative of the previous `Z` then uses the second eta norm. The exact nine source terms with lower perturbations give

```
||Delta Omega2||_1 ≤ 2^30 B² A Derr
D3 = 2^32 B³ A Derr.
```

Here `Omega2` denotes the source density already divided by `X`. The three complete lower N3 pressure and flux integrand errors are bounded by `D3`, with the factor `X` retained in the original fifth moment flux. In the `(0,2)` and `(2,0)` products a changed term is paired with unchanged leading data. In `(1,1)` both terms change. The previous-order viscosity uses `Delta v1`. The original two `Omega2` branches share the bound, and the outer continuation stays zero where its actual guard requires it. The three true and finite lower nonlinear integrals retain their original fixed endpoints.

## Native pressure and compensation

The paired local C110 packet gives raw `E3=4^-K3/3+2a Fd3` and the case with stored pressure at `P_(K3+1)`, where `a=sqrt(aSquared)`. It gives `N3Cut` for the cut N3 values and first and weighted second `X` derivatives on `S_(s3/2)`. Write `E3star=E(s3)*N3Cut` for the corresponding whole real eta-one local inputs. All five original completed N3 debts, including the three lower sources, have errors at most `Moment3=4 B² H E3star+B D3`. Its correction uses the original continuous `Uinverse`, `Einverse`, and both bump families, so

```
S3 = E3star + QBump Moment3
P3 = E3star + B (2 H S3 + D3).
```

The first cap covers whole `F3,U3` and their first and `X`-weighted second radial derivatives in `||.||_1`. The second covers whole `Pi3` in `||.||_1`. Indeed the compatible pressure row and both source prefixes give `Delta Pi3_X=2 F0 Delta F3+Delta p_known` with the same original axis gauge. This formula includes the changed lower pressure prefix and the changed normalizing debts. The source pressure saturates to zero after the correction support, as does the corresponding error. The `X` differentiation used here is ordinary along the relevant source branches.

## Coupled conservative reduction and stress bound

Write `u=Delta U3`, `f=Delta F3`, `p=Delta Pi3`, `V=Delta(Xv3)`, `Vi=Xvi`, `c_j=-Aphysical+2jh`, `a_j=-Aphysical-1/2+2jh`, `omega=-2Aphysical+6h`, and `tau=omega+1/2`. The independent exact source replay uses `V_X=-Z_(c3) u` and each lower source mass law. The two variations become `d_X Bz+Rz` and `d_X Bt+Rt`, with

```
Jz = 2 U0 u + Delta(U1 U2 + U2 U1) + p
Jt = 2 X (U0 f + u F0 + Delta(U1 F2 + U2 F1))
Bz = V0 u + V U0 + Delta(V1 U2 + V2 U1) - 2 X u_X + (X u - 2 eta X Jz)/L
Bt = 2 X (V0 f + V F0 + Delta(V1 F2 + V2 F1)) - 4 X² f_X + (2 X² f - 2 eta X Jt)/L
Rz = (-(c3+1)u + D eta u_eta + 2 eta (omega+1) Jz + d Jz_eta)/L - Z_(c2-D) Z_(c2) Delta U2
Rt = (-(a3+2)2X f + D eta (2X f)_eta + 2 eta (tau+1) Jt + d Jt_eta)/L - 2X Z_(a2-D) Z_(a2) Delta F2.
```

The N3 corrected differences have `int u=0`, `int 2X f=0`, `int Jt=0` and `int Jz=0`. For `Jz`, integrate `-X Delta Pi3_X` by parts in the original fifth moment. Their first eta derivatives also vanish because the integration endpoints are eta independent. The boundary parts vanish at the axis and after saturation. The remaining lower viscosity integrals vanish by the two N2 moment differences and the original shift `2X Z_(a2-D) Z_(a2)g=Z_(a2-D+1) Z_(a2+1)(2Xg)`. To integrate a single `Z_b`, retain the exact operator on the moment `int g`, namely `L^-1(2 eta (b+1) int g+d*d_eta int g)` when `[Xg]` vanishes. Apply it twice to the original zero moments. It follows that the complete uncut signed errors integrate to zero. On the original guard the forward error minus backward error therefore equals the signed prefix error from `0` to `Xminus` divided by its respective original normalizer. That prefix is retained.

Set `C=A(S3+Derr)+P3` and `J=C+2^28 B² D2`. The original average gives `|V|≤16 B S3`, and `||Jz||_1≤2 C` and `||Jt||_1≤4 B C`. The respective boundary factors can be bounded by `32 B J` and `64 B² J`. The respective ordinary remainder factors, with previous viscosity, fit `17 J` and `38 B J`. Integrating in either of the actual directions gives `81 B J` and `166 B² J` before applying the divisors `sqrt(2X)` and `2X`. One more interval length bound pays the absolute `L1(dX)` errors. Hence the same common scalar

```
G = 256 B³ max(1,1/sqrt(2 Xminus),1/(2 Xminus)) J
```

bounds whole `F3,U3,Pi3` and both original guarded stress errors pointwise and in their respective absolute `X` integrals, with the backward statement on its original open guard. `G+e+N2Cut` is positive linear in `e`, `4^-K2/3`, and `4^-K3/3`. Its three source gains are obtained by setting one of those inputs to one and the other two to zero. Those substitutions extract scalar coefficients, keeping the original source constants. The exact closed depths `N,K2,K3` choose each contribution below `2^-258` and ensure the native floors `Kj>=Kcondition_j+2`. The resulting common error cap is strictly below `2^-256`. The additions pay `e≤1` and `N2Cut≤1` in the preceding source magnitude bounds.

**OPEN.** General-order ordinary realization and numerical centers, higher N≥4 coupled errors, whole-field certification and final jets remain open. The proof gives a finite original N3 coupled bound under the stated source premises. It does not promote gate counts or release.

## Replay

Run `node replay_n3_paired_whole.mjs ORIGINAL_RUNTIME C110_FIXED_STRESS_OPERANDS C110_PAIRED_LOCAL_OPERANDS C110_WHOLE_N2_OPERANDS NEW_OPERANDS` followed by `python -B check_n3_paired_whole.py --operands NEW_OPERANDS --out NEW_RESULT` in the workspace. The three operand hashes and original runtime pins are enforced in the code.
