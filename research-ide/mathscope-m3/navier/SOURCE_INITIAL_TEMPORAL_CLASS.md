# Complete initial and temporal class composition

The initial residual adapter binds the actual `Etheta` and `Ez` from the
same complete common torus pressure/current to the source-only covariance,
original stress, and full shifted pressure norm programs. The temporal
adapter then binds both original Fourier inverse sources, the complete
`T1` potential, the nonzero `A1` cutoff remainder, the extra radial epsilon
factor, and both retained slow-time derivatives.

## Exact derivative demands

For an initial tangential residual through order `m`, the full pressure
and original stress require order `m+1`. The pressure producer therefore
requires the complete common-torus covariance through `m+2`; the original
primary producer uses background derivatives through `m+5` and weighted
target derivatives through `m+3`.

For temporal output through order `m`, including its radial velocity,
fast cutoff error, and slow-time residual, the original temporal Fourier
inverse requires the complete initial residual pair through `m+5`.
If the cutoff estimate requests `p>0` radial integrations by parts, that
source demand is `m+2p+8`. The kernels retain this finite demand explicitly.
The output class exponent is `1-kappa_s` for the desired tangential
velocities and the raw cutoff remainder. The radial velocity and both
slow-time terms retain the additional epsilon, giving `2-kappa_s`.

The fast cutoff contribution uses the literal original common index at
`ell_ref-2`. Its factorization proves `0<ci0<=1`; the two torus time
coefficients have absolute sum `sqrt(2)`. No slowly varying continuous
band parameter replaces the original floor.

## What was observed

`evidence/source-initial-temporal-class-kernel-20261012/attempt2` records
10 passing Node tests and 2,823 independent exact Fraction/Laurent
checks. All 150 captured source files remained unchanged. The Node
process reported a 260,923,392-byte RSS high-water mark, below its 512 MiB
limit. Total elapsed time was 14.47 seconds. The parent process sampler
can see only its launcher in this execution environment; the child
self-report is retained explicitly rather than treating that small
launcher measurement as the test peak.

The independent replay differentiates complete coefficient maps over
`Q(sqrt(2))`, checks all 56 mixed five-coordinate jets through order 3
for both equations, and proves coefficient bounds over the entire
fixture box. It checks every initial/temporal derivative demand, the
full `ci0` logarithmic identity, and all retained temporal norm products.
Omitted pressure, stress, and irrational torus-direction controls fail.
An auxiliary-dependent stress is retained and cannot use the original
stress-independence premise.

Attempt 1 is preserved with its 10 Node and 2,821 independent passing
checks. Attempt 2 adds direct child memory observation; it does not
change the initial or temporal mathematics.

## Scope and source families

The light gate uses explicit polynomial fixtures for independent
arithmetic and rejection controls. It does not authenticate those
fixture norm values as the actual Navier--Stokes source, and it does
not claim that either private actual-current attachment was executed.
The complete initialization tuple, its improved post-update defects,
and the original M3 completion count remain separate obligations.

The actual graph hierarchy inherits `ActualInductionExpressions`, which
preserves original function bodies while allowing a declared finite
derivative budget. Its natural, Picard, and shared-expression methods
override the historical order-12 methods. The same canonical source
norm recipe supplies every finite requested order. A selected execution
generates a finite prefix; the mathematical finite-order recurrence and
the actually materialized prefix are recorded separately.

The private adapters reject caller-supplied norms, copied result records,
changed source nodes, and completion labels. Both parents and both norm
and actual-source namespaces are retained in their complete dependent
certificate programs. Neither an unexpanded higher derivative nor a
cutoff remainder is silently replaced by zero.
