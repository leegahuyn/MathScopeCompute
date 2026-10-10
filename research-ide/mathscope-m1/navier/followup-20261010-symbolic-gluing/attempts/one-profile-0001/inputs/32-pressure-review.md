# Independent review of the corrected pressure-prefix enclosure

## Scope

The accepted prefix is `attempts/pressure-prefix-0002/receipt.json`.
Run 0001 is rejected: its flat-collar factor was a lower-endpoint point
instead of an interval including one. This review does not use run 0001
as supporting evidence. Its preservation with a rejection record is the
correct audit treatment.

The reviewed current producer is `certify_pressure_prefix.py`; the analytic
connection is `PRESSURE_DATUM_INTERVAL.md`. This review concerns the
continuous numerical enclosure and its connection to the exact datum,
not a complete evaluated all-eta axis or a Lean proof term.

## Taylor integration and directed arithmetic

The producer's interval multiplication partitions all possible sign cases;
each returned endpoint is the correct minimum or maximum endpoint product
for that case. Scaling, positive reciprocal, convolution, and all rational
conversions round outward with integer floor and ceiling. Negative scaling
reverses the endpoints. No floating point approximation enters an interval.

At a real center t, the coefficient recurrences expand exactly

`L(z)=(1-z)^(-2)-z^(-2)`, `q=exp(L)`, and `sigma=q/(1+q)`.

On the right half the producer reflects t to `1-t` and changes the sign
of the physical increment. Returning `1/(1+q)` there is exactly the
identity `sigma(z)=1-sigma(1-z)`, including all coefficient signs.

For the scaled coordinate with physical step `h=1/2048`, the R recurrence
is

`(k+1) R[k+1]=(h/5)(R[k]-6 sum_(j=0)^k sigma[j] R[k-j])`.

This is the literal ODE `R'=(1/5-6 sigma/5)R`; the producer implements
both the scale h and the convolution. Coefficients through degree 96
only require the corresponding earlier step coefficients. Every entering
value of R is propagated as an interval, including its prior uncertainty.

The polynomial integral uses exact integer common-denominator weights
`1/(k+1)`. Adding the analytic tail to each endpoint and each cell integral
encloses the complete continuous integral; this is not an endpoint-only
or sample-only quadrature argument.

## Complex-disc estimate

For the left part of the body, `|w|<=1/16` gives

`Re((1+w)^(-2)) >= 2-(16/15)^2 = 194/225`.

Together with `|1-z|>=109/160`, this implies `Re L(z)<-4`, so the
denominator `1+q` cannot vanish and `|sigma(z)|<1`. Reflection gives
the right-half bound below two. In the middle, the vertical-segment
bound on the imaginary part of L is below `2/3`; its cosine is at least
`7/9`, again keeping the denominator nonzero and giving `|sigma|<2`.

Starting from the actual real primitive, the whole-disc estimate is

`Re log R(z) <= 1/5+(13/5)/256 < 1/4`.

Thus `|R|<2` on every radius-`1/256` disc used by the producer.
Cauchy's coefficient bound makes the discarded tail at a cell endpoint
at most `2(1/8)^97/(1-1/8)`. Multiplying that bound by the physical
cell length safely bounds the integral remainder. The estimate applies
to the actual R, while interval propagation encloses its Taylor data.

## Flat collars

On `0<=t<=1/16`, monotonicity and the explicit logarithmic quotient
give `0<=Sigma(t)<epsilon=2^-350`. Therefore

`1-2epsilon <= exp(-6 Sigma(t)/5) <= 1`.

Both endpoints are needed. The corrected producer includes them. The
left collar integral and the initial body value are consequently

`5(exp(1/80)-1) * [1-2epsilon,1]`,

`exp(1/80) * [1-2epsilon,1]`.

The symmetry identity is
`Sigma(t)=t-1/2+Sigma(1-t)`. It turns the right collar into

`exp(-2/5)(exp(1/16)-1) * [1-2epsilon,1]`.

These formulas were independently derived from the integral and agree
with run 0002. The rejected point-factor version would not enclose all
possible collar values, regardless of the small size of the omission.

## Connection to the exact entire datum

The first unit transition gives `E^2=P^2 f^2 R`; step symmetry makes its
end value `P1=P exp(-1/5)`. The following axial interval has the actual
angular factor f throughout and contributes the finite exponential
integral. Extending that exponential to infinity gives the scalar term
`exp(-2/5)/2` in cP.

For the subsequent unedited tail, the stated monotone radial coefficient
has logarithmic derivative at most `-1/2`. Its squared integral is at
most its squared entering value. On the complex parameter strip,
`|f^(2theta)|<2` uniformly for `0<=theta<=1`. Both the actual tail
and the artificial exponential continuation therefore contribute less
than `exp(-T)` in normalized modulus. Their difference is bounded by
`2exp(-T)`. This comparison retains the actual datum as its definition;
the rational function `-cP/(1+eta^2)^2` is an approximation with that
analytic error.

The radius-`1/16` Cauchy estimate multiplies the error coefficient of
order k by `16^k`. Through k=48 this error is far smaller than the
accepted scalar quadrature width. The even coefficients of
`(1+eta^2)^(-2)` are exactly `(-1)^m(m+1)`, and odd coefficients
vanish by the evenness of the full datum. Multiplication by k! converts
coefficients to derivatives; it must not be omitted when those intervals
are consumed by a core calculation.

No inclusion defect was found in the corrected continuous quadrature
or the stated analytic datum comparison. Source hashes and the accepted
receipt still need to accompany every downstream evaluated-core result.
