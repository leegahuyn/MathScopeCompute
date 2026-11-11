# Independent review of the original terminal integral and square step

The original #275 calculation reproduced byte for byte with SHA-256
`7f656d06f0474bf425c6f8ad87d8c7cd327f7eee7c0ee748e9655869b8f49ebb`.
The replay streamed 4,420,257 nodes, authenticated the complete uncompressed
JSONL SHA-256, and checked the 24 typed nodes of the original expression.

## Source expression

The bound coordinate is #262, the endpoints are 1 and 3, and the actual
#267 operand is the first derivative of the source step at `(s-1)/2`.
The integrand is

```text
rho * exp((1-h)*s) * sigma'((s-1)/2) / (2*(1-rho))
rho = h/256
```

The change of variable `t=(s-1)/2` cancels the denominator factor 2.
Consequently `Qp=rho/(1-rho)*I`, where
`I=integral_0^1 exp((1-h)*(1+2*t))*sigma'(t) dt`.
Here rho denotes the terminal source parameter and the integration coordinate
t is local to this expression.

The pinned support blob `21a4dffe89f77056588fb00f0bac20e6881b8343`
specifies the square seed. The original interpreter
`research-ide/mathscope-m2/navier/actual-global-source-expressions.mjs`
at graph commit `f8cb4034e86d7b669d52a6f2248aebba156b51b5` and blob
`854bb862276d03c236b2df73ba1bb9a61373c4df` constructs the logistic
argument by squaring the reciprocal series, giving
`-1/t²+1/(1-t)²`. Its endpoint branches agree with the specified flat
extensions. The exact interval calculation uses these real-function semantics.

## Closed interval arithmetic and jets

- For `g(x)=exp(-1/x²)` at positive x, with `y=1/x`,
  `g^(n)(x)=P_n(y)*exp(-y²)` and
  `P_(n+1)=2*y³*P_n-y²*P'_n`. The implemented coefficient recurrence
  follows these two terms and gives maximum degree 36 for the public
  derivative cap 12.
- Each nonnegative monomial `y^k exp(-y²)` increases up to
  `sqrt(k/2)` and decreases after that point, with the k=0 case
  decreasing throughout. Its lower bound uses the two endpoints and its
  upper bound includes the critical point when present. An unbounded
  reciprocal interval includes the limiting endpoint 0. The coarse
  `y>8` endpoint enclosure is sound since `sqrt(36/2)<8`.
  Integer square-root bracketing, exact signed interval products, and
  outward dyadic rounding preserve the monomial bounds.
- `bounded_exp` applies the existing exact rational Taylor kernel
  on `q/4∈[-16,16]` and raises the resulting positive interval
  to the fourth power. The Taylor remainder uses the upper geometric
  ratio `t/(N+2)` after halving to `t≤1/2`. Inversion reverses
  the interval endpoints for negative arguments.
- The denominator `g(x)+g(1-x)` is at least `exp(-4)`
  throughout `[0,1]`, since one argument is at least 1/2.
  The quotient jet recurrence comes from differentiating
  `(g(x)+g(1-x))*sigma(x)=g(x)`. The reflected seed derivatives
  carry the factor `(-1)^n`. The value clamp to `[0,1]` and
  the first derivative clamp to `[0,infinity)` follow from positivity
  and the monotonicity of the quotient. At a crossed endpoint, the
  code takes the hull with the actual constant-branch jet.
- At the midpoint, the logistic exponent is zero and its first derivative
  is 32, giving `sigma'(1/2)=8`. Reflection
  `sigma(1-x)=1-sigma(x)` makes the positive even derivatives zero
  there. The independent rational Taylor recurrence reproduces the odd
  midpoint jets. A linear exponent seed would give the first derivative 2.
  All seed derivatives tend to zero at the flat endpoint because every
  polynomial in y times `exp(-y²)` tends to zero as `y→infinity`.

The `y>8` cap is justified for the bounded public orders 0 through 12.
The decimal formatter is used on positive integral bounds here. Its
current quotient-and-remainder format would need a sign-handling adjustment
before it could format negative endpoints.

## Integral cross-check and application

`sigma'` is nonnegative, so each cell's mass is exactly
`sigma(t_hi)-sigma(t_lo)` and lies in `[0,1]). The positive weight
increases with t and with `a=1-h`. With `0<h<2^-64`, the code
can multiply the enclosed mass by the weight interval from the left endpoint
at `a=1-2^-64` to the right endpoint at `a=1`. The stored 256-cell
outward decimal interval is `[7.400857450,7.458903096]` for I.

An independent exact check used integration by parts,
`I=exp(3*a)-2*a*integral_0^1 exp(a*(1+2*t))*sigma(t) dt`.
It evaluated the logistic formula `1/(1+exp(-z))) at 1,025 dyadic
endpoints and used ordinary monotone lower and upper rectangles on 1,024
cells. When `|z|>64`, its endpoint bounds used the logistic tail
`exp(-64)` toward 0 or 1. It reused the certified exponential kernel
and used a different algebraic representation of the step and integral.
The independent rational enclosure was

```text
[2521554789401952211072190166987854238073/340282366920938463463374607431768211456,
 2534903918396288547691603812501717772329/340282366920938463463374607431768211456]
```

Its outward decimal enclosure `[7.410183525,7.449413090]` lies strictly
inside the stored Stieltjes enclosure. Both enclosures imply
`h/35<Qp<h/34` by `Qp/h=I/(256-h)). With the independently positive
`Qb`, the wait ratio is therefore bounded by
`34*Qb/h < Qb/Qp < 35*Qb/h`. This tightens the terminal wait and
the corresponding terminal radial scale after the positive logarithm and
power operations are applied.

The whole-K cutoff comparison still needs the original stage norm
selectors `C_hat` and `P_hat` or a separate comparison for each active
scale. This #275 result provides no bound for those suprema or for the
actual final A, b and p jets. Its numerical scope is one source integral
and the real step operation through derivative order 12.
