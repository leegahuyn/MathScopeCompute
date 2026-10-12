# Exact original auxiliary-torus Fourier inverse kernel

`source-auxiliary-fourier.mjs` supplies the exact finite Fourier part and a
retained tail for the original direction
`N = (sqrt(2)-1) partial_y0 + partial_y1` on the normalized unit two-torus.
The original reference is Lemma 8.6 and equations (8.19)–(8.23) of the source
paper retained by the project, pages 95–96. Its SHA-256 is
`0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f`.

These are generic calculus kernels. Every result has
`sourceAuthenticated: false`. An actual source caller must privately attach
the complete original periodic body, establish its flat periodic joins, retain
all slow parameters, and execute its derivative closure. The kernel does not
declare the final N6 construction complete.

## Exact divisor and zero mode

For an integer mode `k=(k0,k1)`, set `m=k1-k0` and `n=k0`. Then

```text
d_k = m+n*sqrt(2)
1/d_k = (m-n*sqrt(2))/(m^2-2*n^2).
```

For every nonzero integer mode, the integer quadratic norm is nonzero. The
kernel decides that property with integer arithmetic, including near-resonant
Pell pairs, and rejects `(0,0)`. Since the nonzero integer norm has absolute
value at least one,

```text
|1/d_k| <= |m|+sqrt(2)*|n| <= (2+sqrt(2))*max(|k0|,|k1|).
```

No approximate direction or binary64 square root decides invertibility.
The value of pi remains the exact graph expression
`4*integral_0^1 1/(1+t^2) dt`.

## Finite part and retained source mean

For the actual input body `F`, the coefficient producer retains exact
normalized Haar integrals `C_k=integral F*cos(2*pi*k.y)` and
`S_k=integral F*sin(2*pi*k.y)`. The zero mean is extracted and returned
separately. The real pair for each nonzero half-lattice frequency is

```text
2*(C_k*sin(2*pi*k.y)-S_k*cos(2*pi*k.y))/(2*pi*d_k).
```

Applying `N` gives the corresponding cosine/sine source projection exactly.
The half-lattice is `k0>0`, or `k0=0` and `k1>0`; both conjugate frequencies
are therefore counted exactly once. The finite output is not identified with
the full inverse. Its omitted tail remains part of the result.

## Derivative bound from the actual body

For output torus derivative order `m`, the kernel differentiates the original
body through the two pure orders `r=m+4`. For each resulting `g`, the anchored
two-dimensional fundamental theorem of calculus gives

```text
|g(x,y)| <= |g(0,0)| + integral_0^1 |g_x(u,0)| du
          + integral_0^1 |g_y(0,v)| dv
          + integral_0^1 integral_0^1 |g_xy(u,v)| du dv.
```

Each absolute value is bounded by `sqrt(1+g^2)`. Both pure derivative bounds
are combined by an exact maximum. Slow parameters stay free. These retained
face integrals come from actual generated derivatives, including the mixed
face; no caller-supplied norm or bound is accepted. A source facade that cannot
materialize a requested derivative must report its resource or source limit.

## Complete omitted-mode tail

Integrating a coefficient by parts in its largest frequency component `r=m+4`
times, applying the original divisor bound, and then differentiating the
output `m` times gives the per-mode bound

```text
(2+sqrt(2))*C_(m+4)/((2*pi)^5*|k|max^3).
```

The square shell `|k|max=n` has `8n` integer modes, and the full positive series
satisfies `sum_(n>K) n^-2 <= 1/K`. Thus every omitted mode is retained under

```text
8*(2+sqrt(2))*C_(m+4)/((2*pi)^5*K).
```

This bound covers every torus multi-index of total order `m`, for each fixed
slow parameter. It requires the source smooth periodicity premise. It is not
a bound for arbitrary slow derivatives unless those derivatives are supplied
as the actual source body and their required torus derivatives are generated.

## API and resource limits

| Export | Result |
|---|---|
| `exactAuxiliaryPi(G)` | Exact pi integral and defining nodes |
| `exactAuxiliaryDivisor(G,k)` | Exact quadratic divisor, reciprocal and nonzero proof |
| `actualFourierCoefficient(G,{body,Y,k})` | Exact real coefficient integrals; zero coefficient allowed |
| `sourceTorusDerivativeBound(G,{body,Y,derivativeOrder})` | Actual pure and mixed source derivative face integrals |
| `auxiliaryInverseTail(G,{body,Y,cutoff,derivativeOrder})` | Full omitted square tail |
| `finiteAuxiliaryInverse(G,{body,Y,cutoff,derivativeOrders})` | Exact finite part, mean, source projection and all requested tails |

The explicit finite cutoff ranges from 1 through 8. Tail-only cutoffs are
positive exact integers of at most 4096 bits. Output derivative orders range
from 0 through 8; the underlying bound requires source derivatives through
`m+6`. The normalized physical temporal operator also has the original factor
`c_i` and the separate `-epsilon*partial_T` part. The source caller must apply
the former and retain the latter's correction; this generic inverse does not
discard either obligation.

## Observed verification

[`evidence/auxiliary-fourier-kernel-20261012/attempt1/receipt.json`](evidence/auxiliary-fourier-kernel-20261012/attempt1/receipt.json)
records **5/5 Node tests**, **662/662 independent exact checks**, and unchanged
bytes for **13** captured source files. The execution took **0.570 seconds**.
Complete source snapshots, emitted expressions, TAP log and independent
results are retained beside the receipt.

`tests/run-auxiliary-fourier-kernel.py` independently interprets the emitted
source graph over `Q(sqrt(2),pi,i)` with Python `Fraction`. It validates the exact
pi integral before using formal pi algebra, evaluates unit-torus integrals by
integer-frequency orthogonality, and checks the retained constant mean and
nonzero modes of an explicit real trigonometric polynomial. It also checks
297 exact divisors, the signs and factors in `N` applied to the inverse,
actual FTC derivative roots, shell counts and the complete positive-series
tail rule. These generic kernel checks do not authenticate a final original
N6 source field or issue a new Lean proof.
