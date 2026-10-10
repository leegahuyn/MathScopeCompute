# Same-profile continuous gluing and evidence assembly

This addition constructs the continuous B.8 and C.2 five-moment maps for
the new exact outer parameter family. It attaches their actual incoming
axis, continuation, heat and modulation debts. It also evaluates the
actual pressure datum and finite core quantities, and joins the
quantitative loop and stress arguments to one parameter hierarchy.

The scope is the leading profile and annular stress in Theorem 4.6 of
the supplied paper. The full Navier–Stokes solution and the original
protected Comparator are separate. The assembly explicitly retains the
uncompleted original N3-03 kernel connection.

## Start with the accepted assembly

Read [ONE_PROFILE_SPECIFICATION.md](ONE_PROFILE_SPECIFICATION.md), then
[the accepted assembly receipt](attempts/one-profile-0002/receipt.json).
The latter passed **292/292 attachment and expression checks**, records
**63 exact parameter expressions**, and preserves **137 input byte
snapshots**. Its independent audit passed **295/295** checks in
[`assembly-review/0001/receipt.json`](../followup-20261010-final-stress-audit/assembly-review/0001/receipt.json).

The parameter identity is
`e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152`.
The mathematical evidence identity is
`ff3b1590aa49499417910962736fe2deb8e6088acd7d77e281fd8aba6807c206`.
These hashes identify the exact expressions and attached evidence; they
do not replace the written analytic proofs or the missing kernel terms.

The actual final choices include `S=C^100000`, `R=exp(S^256)`,
`N=1+ceil(R^50)` and `kappa=R^-10`. The expressions are finite and exact.
The tiny positive `lambda`, `h`, `j0` and `muMoment` are never replaced
by zero, and the enormous integer N is not evaluated as a machine integer.

## Subsequent original-kernel input proofs

The historical assembly above predates the following actual kernel runs.
They are attached separately, preserving its frozen input snapshots.

| Component | Accepted attempt | Actual conclusion |
| --- | --- | --- |
| [Literal remainder bounds](formal-threshold-bridge/README.md) | `formal-threshold-bridge/attempts/0004`, compiled export `0005` | The original remainder and Lipschitz definitions give threshold at most `Q^64` and error at most `29/Q^53` once the explicitly listed input norms are supplied |
| [Actual pressure selection](formal-pressure-selection/README.md) | `formal-pressure-selection/attempts/0001` | Positive actual tail debt, exact logarithmic hold, ideal prefix and the original `PressureData` predicate for the actual new pressure |
| [Actual normalized amplitude](formal-amplitude-input/README.md) | `formal-amplitude-input/attempts/0002` | Original phase primitive, exact selected exponential, norm at most two, radial constancy, and literal real-amplitude value in the same coefficient space |

The connected actual fixed fields and pressure mass estimate are in
`../followup-20261010-same-datum-axis/formal-input-producer/` and its
independent-review directory. These successful components do not by
themselves replace the final N3-03 assessment: the actual fixed-point and
finite-evaluation connection must also have accepted receipts.

## Accepted evidence and domains

| Component | Accepted artifact | Executed result and actual scope |
| --- | --- | --- |
| New C.2 map | `attempts/0001/certificate.json` | 13/13 checks; continuous 88-bit outward enclosures, all quadratic terms, the positive-lambda divided logarithm and full eta domain |
| New B.8 map | `attempts/b8-0001/certificate.json` | 12/12 checks; the literal width-1/4096, non-unit-mass bumps and scale mu=h^2 |
| Infinite axis | `../followup-20261010-same-datum-axis/axis-envelope-certificate.json` | 51/51 exact checks; the original complete operator tree and the same A.21 datum |
| Actual continuation debt | `../followup-20261010-same-datum-axis/continuation-debt-certificate.json` | 180/180 checks; actual same-axis debt and ordinary eta derivatives through order four |
| Actual preloop source | `../followup-20261010-same-datum-axis/global-source-envelope-certificate.json` | 104/104 checks; the full derivative table fits S=C^100000 |
| Actual lower gaps | `../followup-20261010-final-stress-audit/preloop-gap-review/0001/receipt.json` | 66 scalar, 14 source, 4 negative-control checks; continuous actual B.8 and full-J margins |
| Actual pressure quadrature | `attempts/pressure-prefix-0002/receipt.json` | 1,792 continuous Taylor cells at 384-bit precision, degree 96, with outward collars and positive tails |
| Actual A.21 datum evaluator | `attempts/pressure-datum-0001/receipt.json` | 76/76 checks; 49 pressure Taylor coefficient intervals and the all-real-eta analytic error |
| Actual core values | `attempts/core-intervals-0002/receipt.json` | 239/239 checks; 75 evaluated quantities at five radii and eta zero, with specified derivatives and positive error budgets |
| Actual mixed Phi coefficients | `../followup-20261010-same-datum-axis/evaluated-phi-mixed-comparison.json` | 360/360 checks; 125 coefficient boxes, 75 mixed values, and the finite eta chart `abs(eta)<=rho/4` |
| Loop derivatives | `attempts/loop-derivatives-0001/receipt.json` | 50/50 checks; the original implicit loop, its endpoint extensions, and zero-mean primitives |
| Frequency and restoration | `attempts/c12-0001/receipt.json` | 28 scalar checks and 2 negative controls; the complete continuous C_eta^2 moment debt and one frequency contract |
| Final stress | `../followup-20261010-final-stress-audit/stress-assembly/0002/receipt.json` | 49 scalar, 4 source and 4 negative-control checks; full annulus, actual unchanged collars and the exact flat factor |

The actual normalized pressure has

`Pi0/Pstar^2 = -cP/(1+eta^2)^2 + analyticError`,

where `cP=3.31462273001433254645298506290413385879609451632699...`.
The continuous coefficient interval has width below `2^-279`.
The analytic error is strictly below `2^-1400` on the whole horizontal
strip `abs(Im eta)<=1/16`. This is an enclosure of the **actual integral**;
the rational-looking leading expression is not substituted as its datum.

Standalone receipts preserve the assumptions present when they were
created. For example, a C.2 receipt does not itself contain the upstream
debt, and a loop receipt does not itself select an actual S. The accepted
assembly supplies those exact inputs and verifies their hashes and
parameter identities. Their earlier conditional flags are kept as history.

## Independent checks

The independent Fraction audits passed 58/58 for C.2, 39/39 for B.8,
179/179 for actual source derivative bounds, 75/75 for the loop/C.12
arithmetic, 75/75 for actual preloop gaps, 553/553 for the accepted pressure
and core input, and 858/858 for mixed Phi. The last audit recomputed the
125 coefficients and 75 values without importing their producer.
The 220-digit mpmath comparison is separately marked as a diagnostic;
agreement in that comparison is not called an interval proof.

Counts refer to the stated assertions, not to new global theorems. The
continuous claims rely on the complete written derivations linked by
each receipt as well as on their executed arithmetic.

## Reproduction without replacing history

From the repository root, the following repeats the assembly with a new
output directory. The fixed accepted receipts remain the inputs:

```sh
python3 -B research-ide/mathscope-m1/navier/followup-20261010-symbolic-gluing/assemble_one_profile.py \
  --gap-receipt research-ide/mathscope-m1/navier/followup-20261010-final-stress-audit/preloop-gap-review/0001/receipt.json \
  --stress-receipt research-ide/mathscope-m1/navier/followup-20261010-final-stress-audit/stress-assembly/0002/receipt.json \
  --core-receipt research-ide/mathscope-m1/navier/followup-20261010-symbolic-gluing/attempts/core-intervals-0002/receipt.json \
  --output /tmp/mathscope-new-assembly/receipt.json
```

The individual `certify_symbolic_c2.py`, `certify_symbolic_b8.py`,
`certify_pressure_prefix.py`, `check_pressure_datum_interval.py`,
`evaluate_core_intervals.py`, `check_loop_derivative_envelope.py` and
`check_c12_frequency_contract.py` also require a new `--output` path.
Axis, continuation, source and mixed-Phi checkers operate read-only when
their `--write` flag is omitted. Do not use `--write` on an archived
accepted source set. The release verifier checks the entire original
archive and the separate addon hashes.

## Preserved rejected and superseded records

`pressure-prefix-0001` is explicitly rejected: its collar factor used
a point instead of an interval including one. The corrected accepted
attempt is `pressure-prefix-0002`. The original rejected bytes remain.

`core-intervals-0001` used an earlier axis revision; `core-intervals-0002`
is the accepted value evaluation against the final source freeze.
The first independent pressure/core review records 551/553 and two stale
hash failures. Its replacement passed 553/553; the failed review is kept.

`one-profile-0001` was a successful earlier attachment check. Attempt
0002 adds the outer snapshot, the independent gap review and the clarified
mixed-Phi domain. The underlying mathematical parameter expressions did
not change. Use attempt 0002 for the final assembly assessment.

The original rejected `Md=1, logP=14` candidate and all original v54
criterion/status bytes remain outside these new inputs. No local or
conditional success silently promotes a whole-profile or Comparator flag.
