# C85: exceptional outer theta arm is n=1

The exact source replay corrects the C84 positional labels. Its three higher stress array arms have q exponents **6h, 4h, 2h**, hence actual orders **3, 2, 1**. The exceptional theta root `17744341` is the original **n=1** stress, not n=3. C84's exact stress pairings and Haar monomial grouping remain valid; its positional order labels and “outer theta n3” wording are superseded here.

**VERIFIED:** actual order mapping, original n1 forward/backward/whole integrals, the literal original terminal Gaussian coefficient, all four faces of its existing C0 FTC norm, and exact C1/C2 Laurent derivative recipes. **CONDITIONAL:** identifying the original raw angular density with this terminal formula uses the original support/heat identities and regularity listed below. The original stress whole moment is a separate open obligation in this replay. No numerical norm value is supplied. RELEASE HOLD remains.

## Original exceptional stress and exact moment boundary

The original n1 stress is root `117068`, with guard `[Xminus=28814,Xb=28826]` and forward body `117054`. Its source integrand is native expression0, `actual_n1_Ttheta_forward_integrand`, body `117048 = 2X * angularSupported117046`. The raw angular density is `117038`.

The forward integral `117051`, backward integral `117062`, and whole integral `117072` all use this same native function, with explicitly checked alpha-renamed binders. Their exact relation is

`Tforward - Tbackward = -Jtheta(eta)/(2X)`, `Jtheta = actual whole integral117072`.

The live root `17744341` retains this same forward function at actual `X=17744284=r^2/(2s)`, eta `17732775`, using actual integral `17744317`. No alternate stress function or native argument substitution is introduced.

If Jtheta is nonzero, the forward stress approaches `-Jtheta/(2Xb)` at the outer face and even C0 zero gluing fails. Its successive pure X tail derivatives have coefficients `-1/2, 1/2, -1, 3` multiplying `Jtheta*X^(-1),...,Jtheta*X^(-4)`. Compact integrand support and stored zero metadata do not prove Jtheta=0. The original conservative five-moment / full I2 heat restoration identity remains the exact source obligation for replacing the forward stress by its backward primitive.

This distinction does **not** impose Jtheta=0 on a bound for the **raw angular density**. The C85 local Haar flux calculation can consume the raw-density terminal factor without promoting the original stress's whole-moment claim.

## Literal original terminal coefficient

The same authenticated source graph already contains these native definitions:

| Definition | Body |
| --- | ---: |
| 32004, `ActualOrderOneTerminalSmoothFactor` | 17716949 |
| 32005, `ActualOrderOneTerminalCompleteHeat` | 17716976 |
| 32006, `ActualOrderOneTerminalPrimitiveSmoothCoefficient` | 17717057 |
| 32007, `ActualOrderOneWeighted_theta` | 117068 |

Let delta be actual source coordinate `17716930`, representing `log(Xb/X)`, on `0<delta<=1/4`. Actual calls `17716950`, `17716991`, `17716992` are A, A_delta and A_delta_delta of the same scalar factor definition32004. Actual call `17716977` is the complete heat factor H. With

`az=-2eta/L`, `bz=(-2D*eta*az+(1-eta^2)*az_eta)/L`, `L=1-2h*eta^2`, `D=1/2-h`,

the literal coefficient root **17717045** is verified exactly as

```
C = H * { az^2 * [delta^6 A'' + 16delta^3 A'
                  + (64-24delta^2)A]
          - bz * [delta^6 A' + 8delta^3 A] }
```

The actual direct expression `17717024` equals its factored expression `17717048`, `exp(-4/delta^2)*delta^-6*C`. Actual body `17717057` is `B=exp(-2delta)*C`. Hence the raw terminal density formula is

`Atheta = exp(2delta-4/delta^2)*delta^-6*B(delta,eta)`.

The graph comparison retains A', A'', the bz term, the full heat factor and every rational coefficient. It does not replace heat by a constant. Application to raw source density117038 uses the original n1 support reduction beyond Xplus, the actual terminal positive pressure square root, and `Z_b(Fheat)=0` from `actualHeatExteriorIdentity`; the latter removes the heat product cross terms. This source interpretation is stated separately from the exact terminal-program algebra.

## Existing source C0 bound and new derivative recipes

**B0 is original node17717108.** The replay checks it is precisely the sum of original faces

`17717067 + 17717079 + 17717091 + 17717105`.

These are the corner and three FTC face integrals of `sqrt(1+(native derivative)^2)` for native definition32006 on `[0,1/4] x [-1,1]`, with derivative orders `(0,0)`, `(1,0)`, `(0,1)`, `(1,1)`. Thus `sup |B| <= B0` under the original smoothness interpretation. It is an actual source functional, not an arbitrary supplied bound. No numerical evaluation is claimed.

It gives

`|Atheta| <= exp(1/2)*B0*exp(-4/delta^2)*delta^-6`.

For the original `t1<1/128` and total logarithmic shell width>2, the other endpoint's Gaussian inverse is at most `50176/50175`. Also `exp(1/2)<5/3`, using `e<11/4<25/9`. Exact rational checks yield the convenient strict cap

`|Atheta| < 2*B0*zeta*delta^-6`.

The regular source factor denominator stays positive on the terminal rectangle, and the complete nonnegative-z Laplace heat moments control every fixed derivative, including eta endpoints. Those are the finiteness premises for its FTC integrals. The original weighted primitive C0 norm `17717699` is also pinned, but is **not** mislabeled as a raw derivative bound.

For C1/C2, the receipt gives explicit FTC recipes K1 and K2 for `partial_delta B` and `partial_delta^2 B`, using the same original native definition32006 and all four faces. They are not assigned invented original node IDs. With K0=B0 and `Xedge=Xb*exp(-1/4)`, exact Laurent differentiation gives

| Raw profile derivative | Sufficient source bound |
| --- | --- |
| Atheta | `2*K0*zeta*delta^-6` |
| Atheta_X | `2*Xedge^-1*(9K0+K1)*zeta*delta^-9` |
| Atheta_XX | `2*Xedge^-2*(83K0+19K1+K2)*zeta*delta^-12` |

The conversion is `partial_X=-X^-1 partial_delta`, `partial_X^2=X^-2(partial_delta^2+partial_delta)`. The full signed Laurent polynomials are emitted in the receipt. Numeric K1/K2 generation is a separate run; this replay does not duplicate or claim it.

The original backward primitive's Gaussian estimate is independently checked: `(exp(-4/delta^2)*delta^-3)' = exp(-4/delta^2)*delta^-6*(8-3delta^2)`, with factor at least `125/16`, giving integration factor `16/125`. This is relevant to the original stress only after its actual whole moment is discharged.

## Replay

```powershell
python -B verify_theta_outer.py --goal <checkout>/tools/mathscope-cd-axial-bridge-20261029/goal-next --work <work>/goal-next --out theta-outer.json
```

The verifier uses committed source reader/exact algebra/cache helper and pinned original source modules at the hosted export's executing commit. External work data are the C70 original export and immutable C80 cache. All 22,155,584 source records and the native registry are authenticated again. Assertions are required; `-O` aborts. No repository edit, GitHub job/upload, local Lean compilation or original graph mutation is performed.
