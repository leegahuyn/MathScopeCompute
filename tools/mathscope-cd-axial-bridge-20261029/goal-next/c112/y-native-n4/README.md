# Original native N4 with exact lower histories

**VERIFIED.** The actual source producer recompiles the N4 prefix into 127,241 nodes. The earlier 123,870-node original N3 prefix matches byte for byte. N4 has separate actual and auxiliary systems `#7` and `#6`. The native analytic eta strip is `s=delta/2^35`, the actual radial endpoint remains `aSquared=#24805`, and the auxiliary natural radial scale is `(49/8)/Lambda`. Native `eta=#2` and the original physical order `n=4` remain distinct from Picard depth `K`.

The raw and whole `Omega3/X` each retain eleven source terms. In addition to time and radial viscosity, they contain each ordered pair `(0,3),(1,2),(2,1),(3,0)` in both transport sums and the original twice-applied axial operator on `v2`. The raw branch consumes the actual cut lower histories `N0..N3`, and the outer branch consumes their finalized whole histories. The exact switch uses `[aSquared,Xplus]`; the whole lower moment prefixes use `[0,Xplus]` with separate radial binders and unchanged eta. The N4 known pressure replays as `2 F1 F3 + F2² - Omega3/2`, where `Omega3` in this formula denotes the source density already divided by `X`. Removing `F2²` fails the exact control. The angular and axial forcing sums each retain `(1,3),(2,2),(3,1)` and previous-order viscosity from N3.

The original diagonal pressure row gives `d_X Pi_(K+1)=2 F0 F_K+pKnown`. The exact source depth-2/depth-3 replay checks this primitive and rejects using the same depth for both components. The two native regular-mass rows use weights zero and two with opposite signs. For their common right-side `g`, the two components are `∫₀^xi g(t)dt` and `-xi^-2∫₀^xi t² g(t)dt`, so their sum is the finite velocity average by integration by parts. The ordinary axis value comes from the original continuous extension. Substituting the finite expressions replaces 19 actual N4 calls, leaves the lower pressure and all lower integral prefixes unchanged, and produces zero rational numerators for all five original moment equations. The original zero axis and exterior pressure gauges remain in the replay.

The two guarded N4 stress densities are original axial `#127212` and weighted angular `#127211`, with fourteen and thirteen terms respectively. The paired signed directions use a minus sign from `Xminus=#28814` to `X` and a plus sign from `X` to `Xplus=#28824`. Both primitives retain eta and their independent radial binders. Holding original `N0..N3` fixed cancels all lower-only transport and the N3 previous viscosity in each error density. Their original definitions and η input remain intact. The two fixed-lower conservative forms have zero exact rational numerators. Removing an eta derivative or a homogeneity term fails.

**CONDITIONAL.** Use the source native analytic value and first eta derivative tails, original ordinary real leading and Picard solutions, flat cutoffs, and fixed-endpoint moment differentiation. Keep the original N0 through N3 histories exact and unchanged. The following gives pointwise and absolute `L1(dX)` error estimates on the full real `eta∈[-1,1]` domain, including all original radial branches. The velocity and average use `P_K` and the pressure uses `P_(K+1)`.

Write `e=4^-K/3`, `E=1+2/s`, `B=max(1,Xplus)`, and let `H=2^20(1+U_*+F_*)` from the original real leading mixed norm with radial-2 and eta-5. The raw value-plus-first-eta error is bounded by `E e`. The corresponding five original local densities have error caps `Ee`, `2B Ee`, `2H Ee`, `4BH Ee`, `2H(1+B)Ee`; all exact lower terms cancel. The whole moment error is at most `M e` where `M=4 B² H E`. The original eta-dependent amplitude is `ef=Ef/(1+eta²)` with `Ef=ef(0)`, so in the sum of uniform value and first derivative norms `||1/ef||≤4/Ef`, `||ef||≤2Ef`. Set `R=Rbase`, `R1=R^(1-2lambda)`, `Rp=R^(-2-2lambda)`, `Rz=R^(-2lambda)`. Let `Iu` and `If` be the maximum row sums of the original matrices using entry bounds `1+m²` against the cap vectors

```
ur = [1/R, (1/R+4/(Ef R1))/(2lambda)]
er = [1/R²,2/(Ef Rp),4/(Ef Rz)].
```

The bump height and first normalized radial derivative are at most `b0=2^15` and `b1=2^35` by the original compact support formula and checked sigma bounds. Write `bU=2 b0 Iu/R` and `bF=3 b0 If/R²`. The whole value-plus-first-eta gains multiplying `e` are

```
TU = E + bU M
TF = E + bF M
TP = E + 2 B H E + 4 B Ef Rp bF M.
```

The `TP` formula preserves the pressure gauge and the exact difference derivative `p_X=2 F0 f` at fixed lower histories, where `p=Delta Pi4` and `f=Delta F4`. On Ipos the ordinary pressure derivative uses the actual `ef` and radial monomial. Outside the original pressure support, both fields vanish. For the remaining weighted first `X` derivatives the exact source native diagonal inverse gives the quotient `w/(2sqrt(X))` from the original first two rows. Compare the `K−2` inputs on their original strip with `K>=Kcondition+2`. The source tail loses at most `16`, `2/s` for one eta derivative, and at most six entries in the applicable original coefficient row. This gives weighted raw gain `48 B matrixBound E`. The cut gain is `1024/t1`. The regular normalized bump radius `y=sqrt(2X)/R` satisfies `X d_X y=y/2` on each original profile with `1≤y≤4`. Consequently the two weighted derivative gains are

```
DU = 48 B matrixBound E + 1024/t1 + 4 b1 Iu M/R
DF = 48 B matrixBound E + 1024/t1 + 3 (b1+b0) If M/R².
```

For the fixed-lower source conservative identities write `u=Delta U4`, `V=Delta(Xv4)`, `V0=Xv0`, `c4=-A+8h`, `a4=-A-1/2+8h`, `omega=-2A+8h`, and `tau=omega+1/2`. Set `Jz=2 U0 u+p`, `Jt=2X(U0 f+u F0)`. The axial boundary term is `V0 u+V U0-2X u_X+(X u-2eta X Jz)/L`. The angular boundary term is `2X(V0 f+V F0)-4X² f_X+(2X²f-2eta X Jt)/L`. Each respective remainder has the form

```
[-b w + D eta w_eta + 2 eta (power+1) J + d J_eta]/L,
```

using `(b,w,power,J)=(c4+1,u,omega,Jz)` and `(a4+2,2X f,tau,Jt)`. The actual moment differences give `int u=0`, `int 2X f=0`, `int Jt=0`, `int Jz=0`. For `Jz`, integrate `-X p_X` in the fifth moment with the original axis and saturated pressure values. Eta differentiations of these integrals preserve both bounds. Both boundary terms vanish at zero and after saturation. Therefore the whole uncut signed stress error vanishes after integrating in `X`, while the forward error minus backward error on the guard keeps the normalized prefix error from `0` to `Xminus`.

Set `T=max(1,TU,TF,TP,DU,DF)`. The ordinary radial average gives `|V|≤16 B TU e`. The axial and angular boundary caps are `33 B H T e` and `58 B² H T e`; the remainder caps are `22 H T e` and `36 B H T e`. Integration from either actual endpoint gives caps `88 B H T e` and `152 B² H T e` before applying the radial normalizers. One more factor `B` pays absolute radial `L1`. The source replay constructs the closed depth and error

```
G = 256 B³ H T max(1,1/sqrt(2 Xminus),1/(2 Xminus))
K = max(Kcondition+2,ceil(log_4(2^256 G)))
G*4^-K/3 < 2^-256.
```

This common bound applies separately to the whole coefficient `F4,U4,Pi4` values and first eta derivatives, the indicated weighted first radial derivatives of `F4,U4`, and both original forward and guarded backward stress pointwise and absolute radial errors. The depth is symbolic. The native display routine explicitly refuses a count above eight; the high-accuracy finite center is not evaluated.

**OPEN.** The verified C111 paired N3 estimate supplies whole values and radial derivatives through real eta order one. Paired whole N4 still needs the `U3` value and mass-average errors through eta order three, first and `X`-weighted second radial errors through eta order two for `v3`, and a larger N2 bank through eta order three for `v2` in the previous viscosity of `Omega3` (with the corresponding mixed radial traces). Those stronger paired inputs are separate from the fixed-lower result above. General Y and the final jets remain open. Release remains HOLD.

## Replay

Pass the pinned original M2 navier runtime, C110 `native-n3-operands.json`, C111 `n3-paired-whole.json`, and C110 `n2-whole-mixed-operands.json` to `replay_native_n4.mjs` with a fresh output path. Check that output with `python -B check_native_n4.py --operands <output> --out <fresh-result>`.
