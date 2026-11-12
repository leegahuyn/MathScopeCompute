# Actual target C7: middle reduction and bounded outer kernels

The pinned 153,455-node target graph has SHA-256 `8ecdc6d5ba6faae0114249a5041eee1d8af1268e1ec98cc4f526a8b615bb70e5`. Its actual leading target bodies are #117773 and #117774. The 16 final component/order bounds #153439–#153454 contain three distinct FTC regions; they have not been numerically evaluated here.

## Middle region

The source middle rectangle is `Xa exp(t1/8)<=X<=Xb exp(-1/4)`, `-1<=eta<=1`, with positive `Xa,t1` and ordered endpoints. The original 72 rows have raw-target native partials through degree seven divided by the literal `zeta`; each retained FTC bound is the sum of four `sqrt(1+derivative²)` face terms, including mixed-face integrals. The checker verifies all 72 row definitions, 288 source faces and their actual endpoints, each occurrence in the original profile maximum, and 1,600 nonnegative downstream transport nodes to all 16 final roots.

For `y=log(X/Xa)`, `d=log(Xb/X)` on that rectangle, `y>=t1/8` and `d>=1/4`. Therefore `zeta^-1<=exp(128)<2^185`, and

    |∂X log(zeta^-1)| <= (1024/t1+512)/Xa.

The strict dyadic exponential bound follows from the exact first three positive terms of `log 2=2 sum_{k>=0} 1/((2k+1)3^(2k+1))`. If `C[j,m]` bounds every ordinary derivative of the actual raw component j through total degree `m+2` on this same rectangle, the literal middle four-face root for any row with `r+e=m<=7` obeys

    B[j,r,e] <= 3(1+Xb)
      + 3*2^185*(1+Xb*(1+(1024/t1+512)/Xa))*C[j,m].

The first term is indispensable because each source face uses `sqrt(1+x²)`, not `|x|`. The exact original annular inequalities `2 sqrt(Xb)<=Rstar` and `Xa^(-1/2)<=Rstar` may replace Xb by `Rstar²/4` and `Xa^-1` by `Rstar²`. Positivity of the downstream composition permits these bounds to replace the 72 middle face roots when separately supplied. This is not numerical closure: the actual C[j,m] remain unknown and both inner and outer branches still contribute. At m=7, the source shear `2X F_X` alone contains `2X F_X^10` in its ninth X derivative; the source axial shear `sqrt(2X) U_X` analogously contains `sqrt(2X) U_X^10`. The currently saved leading C8 norm does not supply those C10 jets.

## Outer Gamma, heat and kernel operands

The actual outer Gamma root is #119328. Its source integrand is the compactification of `Gamma(1+h)=integral_0^infinity exp(-v) v^h dv`. The pinned source profile gives `h=exp(-8002 T)`, `T=exp(1048576)+10>128`, so

    1-2^(-1024256) < Gamma(1+h) < 1.

For 0<h<1, concavity gives `t^h<=1-h+h*t`; the exponential tangent inequality gives `t^h>=1+h log t`. Integrating yields `1-h<Gamma(1+h)<1` because the magnitude of the negative log integral is less than `integral_0^1 -log(t)dt=1`. The bound resolves this original improper denominator without replacing h by zero. All 72 outer rows conservatively reach this definition; that reachability is an overapproximation and does not assert each differentiated expression depends nontrivially on it.

The actual normalized outer heat root #119354 and the actual first heat derivative root #119550 at its own Z argument are also bound to their complete original integrals. For every Z>=0,

    0 < H(Z) <= 1,
    H(Z) >= 1-h(1+h)Z >= 1-2hZ,
    -2^(-1024255) < H_Z(Z) <= 0,
    |H^(j)(Z)| <= h*j!*(j+1)! < 2^(-1024215), 1<=j<=9.

The identities follow by differentiating the positive Gamma-normalized measure; `log(1+Zv)<=Zv` gives the lower value bound, while each moment is `(1+h)_j`. In the actual nested outer J binder with `0<=delta<=1/2` and `|eta|<=1`, `0<=Z<=4/Xb`, so `H>1-2^(-1024253)/Xb`. The purely dyadic lower bound `1-2^(-1024253)` additionally assumes `Xb>=1`. These are Z-derivative bounds, not automatic bounds for all mixed delta/eta derivatives.

The source retains four compact improper J kernels: #119364 inviscid, #119561 viscous, #119679 pressure, each m=-3; and #119689 axial, m=0. Their actual [0,1] integrals and 1/4 factors are checked. For an original kernel with m>=-3, 0<=delta<=1/2 and bounded G,G',

    |J_(4,m) G| <= ||G||∞/4,
    |∂delta J_(4,m) G| <= ||G'||∞/4+(m+3)||G||∞/32.

The constants come from the exact integrals `integral exp(-4t)dt=1/4`, `integral t exp(-4t)dt=1/16` and the chain rule; the latter coefficient is zero for m=-3 and 3/32 for m=0. The still-unknown actual G and its higher derivative bounds, nested parameter derivatives, source chart and outer edge semantics prevent complete outer FTC closure.

These results concern exact prior source graphs with original parameter semantics and analytic prerequisites. They do not identify the separate newer live private family, numerically settle all 16 roots or 67 final jets, or change N7/N8 or RELEASE HOLD.

Portable replay arguments, in order:

    node target-middle-reduction.mjs TARGET_C7_JSON TARGET_C7_GRAPH_JSONL_GZ REPLAY_TARGET_C7_MJS ACTUAL_BACKGROUND_PHYSICAL_SEMINORMS_MJS
    node outer-kernel-bounds.mjs TARGET_C7_JSON TARGET_C7_GRAPH_JSONL_GZ SOURCE_PROFILE_DATA_MJS ACTUAL_STRESS_DIRECTION_PROGRAM_MJS

Both scripts default to the existing workspace locations if no arguments are supplied.
