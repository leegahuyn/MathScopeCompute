# Raw Φ enclosures over the original real source range

The pinned C139 graph contains 567 live calls to the original natural
series. There are 15 calls with a literal rational radial argument,
all of them with node #474 equal to 4. The five such Φ calls are #4468,
#5748, #10450, #20811 and #81559, with eta derivatives of orders zero
through four respectively. C140 evaluated #4468 at the explicit
specialization eta = 0. The four literal eta derivatives remain open.

The enclosure here applies to all 77 rooted Φ calls of eta order zero,
covering 51 distinct source radial argument nodes. It allows the full
real interval −1 ≤ η ≤ 1. C139 transports the observed radial
arguments into 0 ≤ Y < 256/63 < 41/10 wherever the original native
branches and chart premises are defined. These premises and the C140
original A.21 pressure and same-datum ordinary Bρ norm remain
conditions of the result.

## Raw enclosure

For k from 0 through 3 put

$$
P_{N,k}(Y,\eta) =
\sum_{n=k}^N \frac{(-\chi(\eta))^n(n)_k Y^{n-k}}{2^n n!(n+1)!},
\qquad
\chi(\eta)=\frac{H_*(\eta)^2}{H_*(\eta)^2+\sigma_*^2}.
$$

The original real profile has 0 ≤ χ ≤ 1. The C140 coefficient proof
gives the stronger absolute-sum estimate
$\sum_n |a_n-b_n|5^n < 2^{-15852}$, uniformly in real |η| ≤ 1.
Both coefficient series are analytic in Y on a neighborhood of
$[0,41/10]$ by their convergence bounds. At 0 ≤ Y ≤ 41/10 every
derivative weight $(n)_kY^{n-k}/5^n$ is nonnegative. It is at most the
sum of all the derivative weights at 41/10, which is

$$
\sum_{n\ge k}(n)_k(41/10)^{n-k}/5^n
=\frac{5k!}{(5-41/10)^{k+1}} < 64
\qquad(0\le k\le3).
$$

Termwise radial differentiation therefore gives a uniform error
below $2^{-15846}$ from replacing the original derivative by the
infinite comparison series. The finite truncation adds less than
$2^{-264}$, using the first omitted term of the alternating series.
Consecutive magnitudes from that term onward have successive ratio at
most $(41/10)/(2(n+1-k)(n+2)) < 1$. Exact rational arithmetic
checks the bounds at degrees 38, 38, 38 and 39 for k = 0, 1, 2 and 3.
It yields

$$
\partial_Y^k\Phi(Y,\eta) \in
[P_{N,k}(Y,\eta)-2^{-262},\ P_{N,k}(Y,\eta)+2^{-262}].
$$

This is a pointwise raw enclosure of width $2^{-261}$ with endpoints
given by functions of the original source arguments. It specializes
to η = 0 by the exact substitution χ = 4000000/4000001. The packet
does not evaluate those endpoints in unresolved native physical
frames. It adds no accepted original Y case or final jet.

## Replay

The three C139 input files and two C140 input files are pinned by
SHA-256. Two executions with distinct output paths produce identical
JSON.

~~~text
python -B enclose_original_radial_phi.py C139/expanded.json C139/active-y-reach.json C139/transport-live.json C140/phi-y4.json C140/README.md phi-range.json
~~~

RELEASE HOLD.
