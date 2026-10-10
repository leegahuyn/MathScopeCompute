# Independent review of the evaluated mixed Phi array

The targeted audit `mixed-phi-review-001.json` completed with actual
exit code zero and **858/858 checks passed**. It reviews the mixed
producer receipt with SHA-256
`eb7e2448416c4be63d86c41d2be7ad6c6c11c057bc2a852b30b95807232e49b5`.
The proof, producer, imported arithmetic helper, axis and continuation
receipts, and independent verifier are all copied and hashed in
`mixed-phi-review-001.inputs/`. No unrelated earlier calculation was
rerun for this audit.

## Actual algebra and outward arithmetic

The coordinate is `xi=eta/j`, with the same positive `j=h^4`. Direct
substitution in `H*=D eta+(1-eta^2)(4eta+j)` gives exactly

`H*(j xi)/j = 1+(9/2-h)xi-j^2 xi^2-4j^2 xi^3`.

The input boxes for h and j squared contain their actual positive
values. The independent verifier computes chi as
`1-epsilon/(H^2+epsilon)`, where `epsilon=1/4000000`, using a
finite geometric inverse through Taylor degree four. It then uses
binomial powers of the nonconstant part of chi to compute all 125
radial/xi Taylor coefficients. This differs from both the producer's
radial recurrence and its full-power oracle. All independent exact
rational intervals lie inside the corresponding directed intervals.

The 75 mixed derivative values are independently evaluated by interval
Horner after differentiating the finite radial polynomial. All are
contained in the saved directed comparison intervals. The complete
finite comparison interval widths are below `2^-190`; this includes
input widening and all directed arithmetic. The positive nonlinear and
infinite-series errors are checked separately. The producer's operation
count of 4,534 belongs to its original run and is not represented as
the independent verifier's operation count.

## The two radii and the actual nonlinear error

On the comparison-only disk `|xi|<=1/16`, the exact transport
polynomial differs from one by less than `3/10`. Its square plus
epsilon therefore has modulus greater than `12/25`, and the identity
for chi gives `|chi|<2`. This proves holomorphy of the comparison and
justifies the Cauchy factor `m!16^m` for its radial-series tail.
The radial tail starts at degree 25 and has successive ratio bounded
by `Y/[(26-k)27]` when the chi bound is two.

The actual nonlinear Phi does not need that larger disk. Its coefficient
error is already controlled in the actual coefficient space by
`29 Q^-53`. Converting an eta derivative into a xi Taylor coefficient
multiplies by `j^m/m!`. Since `j<=1` and `rho^-1<=Q`, the remaining
loss is at most `Q^m`. The exact original weight consequently gives

`29*2^(-260(53-m))*binom(n+m,m)/(20^n(n+1)^2(m+1)^2)`.

For mixed derivative evaluation it gives

`29*2^(-260(53-m))*(m+k)!/[(m+1)^2*20^k]*(1-Y/20)^(-m-k-1)`.

The factorials, radial normalization, and positive error were checked
for every stored row. Each comparison Cauchy tail plus actual Banach
evaluation error is below `2^-90`, and the reported final interval
contains its directed comparison interval enlarged by this entire error.
The output is explicitly `j^m partial_eta^m partial_Y^k Phi(Y,0)`.

For the genuine finite chart, `|eta|<=rho/4` lies strictly within the
actual parameter neighborhood, since `rho/4=sigma^2/262144` is smaller
than `sigma^2/2048`. Its xi radius is
`rho/(4j)=j/(262144*4000000)<2^-16000`. The comparison's absolute
radial sum on its larger disk is below `exp(4.1)<243`; Cauchy's
geometric Taylor remainder after degree four is therefore below
`2^-79000`. The actual nonlinear value error is added separately using
the uniform real Banach bound. A value enclosure obtained by evaluating
the stored comparison coefficient intervals, or their wider actual
coefficient intervals, and adding these remainders is thus valid on
that chart. The larger comparison disk is never assumed to be a domain
of the unknown nonlinear solution.

## Scope

This is an evaluated finite comparison array that encloses coefficients
and derivatives of the same actual nonlinear Phi. It does not directly
evaluate every node of the nonlinear recurrence graph, cover `[-1,1]`
by this single tiny chart, or instantiate the original Lean analytic
premises. Those three limitations are explicit in the producer and
independent receipts and were not changed by this review.
