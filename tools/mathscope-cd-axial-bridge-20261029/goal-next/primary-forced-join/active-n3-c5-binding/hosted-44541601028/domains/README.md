# Same-live N3 direct/split denominator handoff

The exact closure of the original GitHub run 44541601028 lists ten
divisors in the completed direct-versus-split comparison. This replay
pins the compact closure, original arithmetic frontier, source-native
band receipt, and the sealed first-cycle source checks. It reads
the same official source bytes for the common band and mean geometry.
Under the ordinary admitted source chart described below, every
listed divisor is strictly positive. Definedness of other native
operands and the opaque exponential inputs remains explicit.

## Ordinary chart and simple divisors

The original common band uses (Q=\exp(-\ell\log 2)>0) and the
regular radial coordinate (R>0). The original selected inverse has
(s\in[1/2,2]) on the chart image
(Z=s^{1/2-h}\eta), (T=s(1-\eta^2)), (|\eta|\le 1), with
the original (0<h<1/16). On this admitted image, the exact
typed rows give the following positive factors.

| Original ID | Real value |
| ---: | --- |
| 17732748 | (R\) |
| 17732766 | the original bracketed inverse (s\) |
| 17732767 | (R^2\) |
| 17733017 | (\log(4+\sqrt 2)>0\) |
| 17734051 | (R\sqrt Q\), with the same-run native receipt binding #17732740 to (Q\) |
| 17743697 | (\sqrt{2X_{0,Imean}}e^{1/2}\sqrt s\) |
| 17744107 | (2\sqrt s\) |
| 17745449 | product of the two actual exponentials, each positive for finite real inputs |

The chart's actual implicit residual is
(s-Z^2\exp(2h\log s)-T). Its (s) derivative is the denominator
for the implicit (s_Z) used before differentiation of the mean
radial scale. The compact arithmetic shell of this divisor is
#17744103 and binds (1-Z^2\exp(\#17744088)(2h/s)). The
source constructor fixes that exponent as (2h\log s).
The raw exponent child is absent from both compact exports.
The denominator on the original image is therefore
(1-2hZ^2s^{2h-1}=1-2h\eta^2>7/8), using
(2(1/2-h)+2h-1=0).

## The original whole positive bump mass

The original mean source uses (a=\sqrt{2X_{0,Imean}}e^{1/2}\sqrt s),
(u=10(R/a-1)), and the radial density

\[
\rho_0(R)=a^{-1}\exp[-1/(u(1-u))]\,\mathbf{1}_{0<u<1}.
\]

Replaying the unchanged `globalMeanGeometry` constructor with
the retained sparse prefix and allocation start #17743683 emits
the original integral #17743725 with all four actual operand
IDs #17743724, #17743710, #17743711, and #17743713. The emitted
unnormalized seed, division by that same integral, and cutoff
agree with every original overlapping record. The second
radial moment also matches the separate sealed #17743733
stage reference. The completed source stage checked the
same original full radial envelope and positive bump mass.
Local binder serials are replay-local. Only the retained records
are byte-backed by the compact exports. The omitted operands
are reconstructed by the pinned source constructor. The replay
checks that reversing the original endpoints changes the
retained literal integral.

The strict bump support in physical (X=R^2/(2s)) is
((eX_{0,Imean},e(11/10)^2X_{0,Imean})). The original mean patch
is wholly in ((X_a,X_b)). Its lower cutoff follows from
(X_{0,Imean}=X_p e^{-8}>X_a), as (X_p) is the later original
pulse radius on the same source.
The upper cutoff follows from (X_{0,Imean}e^5=X_p e^{-3}<X_b)
and (1+2\log(11/10)<5). The bracket on (s) therefore puts
the entire radial bump strictly inside the original fixed envelope
([\sqrt{X_a},2\sqrt{X_b}]). The variable substitution (dR=(a/10)du)
gives the exact domain-independent mass

\[
\rho_{\mathrm{mass}}=\tfrac1{10}\int_0^1e^{-1/(u(1-u))}\,du
\ge \tfrac1{20}e^{-16/3}>2^{-14}.
\]

On the interval (u\in[1/4,3/4]) the product (u(1-u)\) is
at least (3/16). The last strict comparison uses
(e^{16/3}<3^6) and (20\cdot3^6<2^{14}).
The source bump is bounded and continuous after zero extension,
so the ordinary integral exists.

### Directed enclosure of the original mass

The source substitution makes this whole-envelope mass constant in
the admitted slow variables. Its physical parameter derivatives
therefore vanish inside each admitted open chart. The same mass
normalizes the original radial seed.

On the symmetric half interval the integrand increases from its
zero extension at zero to \(e^{-4}\) at one half. Exact lower and
upper monotone sums at 128, 512, and 2,048 cells give strictly nested
intervals under the same normalization. The 2,048-cell output gives

| Quantity | Lower | Upper |
| --- | ---: | ---: |
| Original mass | 0.000702538681508 | 0.000703432999814 |
| Reciprocal mass | 1421.59949883 | 1423.40916781 |

The receipt records exact rational endpoints in addition to the
outward decimals. The exponential computation uses degree-18 and
degree-19 alternating sums at a reduced argument at most \(1/8\)
and 128-bit outward dyadic squaring. The simple lower bound
\(1/5000\) follows separately from the original middle-half estimate
and the exact integer comparison
\(24^{128}<250\cdot23^{128}\).

## Reproduce and scope

```text
node --max-old-space-size=3072 check_direct_denominators.mjs HOSTED_44541601028 ORIGINAL_RESEARCH_IDE NEW_RECEIPT.json
python -B enclose_mean_bump_mass.py NEW_RECEIPT.json NEW_MASS_RECEIPT.json
```

The replay checks the exact source receipt and constructor bindings.
The ordinary positivity arguments require the admitted chart,
genuine native denotation, and finite original exponent inputs.
The direct/split arithmetic identities remain distinct from numerical
residual size, higher regularity, final jets, and release decisions.
No Lean compilation or production changes occur. RELEASE HOLD.
