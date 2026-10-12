# N8: original background inner-path enclosures and independent core refinements

This implementation executes the original source background construction and
retains exact positive time expressions, three separately normalized velocity
component intervals, the source coefficient tail, and an explicit final-field
identification boundary. It also provides fresh, inexpensive refinements of the
original leading core. It does not mark N8-04, N8-05, N8-08 or all of M3 complete.

## Observed source gate

The successful observed run is
[`evidence/source-near-terminal-20261012/attempt2/receipt.json`](evidence/source-near-terminal-20261012/attempt2/receipt.json).
It records Node **10/10**, independent Python `Fraction` **38/38**, unchanged bytes
for **117** source dependencies, **270.408 seconds**, and a peak Node RSS of
**3,962,298,368 bytes**. The source construction has **624,264** expression nodes;
the complete closed scalar program exported for the observations has **29,571**
nodes. The raw failure from attempt 1 remains in its original directory.

The certificate SHA-256 is
`b56f023e8dd9e3fd1d622837563151fe79f36f374f82cabe4d479c5e39d3dc70`.
The complete archive canonical SHA-256 is
`031746bd29798e382f88679d39ff6fcd86138eeaf42db0c0b7b53fa505020b05`.
`tests/build-near-terminal-evidence.py` verifies the receipt, every recorded
artifact, the before/after source closure, the exact interval rules, and the
scope before generating `source-near-terminal-evidence-data.mjs`. Its `--check`
option also requires the generated module to be current.

The original failure involved graph identity, not a lost mathematical value:
rebuilding `exp(-(-log(tau)))` produces a different node ID in an expression
graph that does not simplify double negation. `retainSourceLogTime` now preserves
the original positive exponential node and checks the exact rational identity
`s + log(tau) = 0`. The cheap regression gate tests preserved decimal nodes,
including `1e-1000`, and rejects mismatched logarithms or substituted zero.

## One exact source point and time for all three components

The original inner ray is `X = 2/Lambda`, `Y = 2`, `eta = 0`, `theta = 0`.
At this angle the Cartesian components agree with radial, azimuthal, and axial
components respectively. Let `C` be the authenticated common source coefficient
bound, and write:

```text
eScale = 2/(CSelected*sqrt(Lambda))
Cstar = max(C*sqrt(Lambda), C/eScale, C/j0)
s_d = -log(plateau) + (log(1+4*Cstar) + d*log(2))/(2*h)
tau_d = exp(-s_d) > 0
```

Every row at `d = 0, 2, 4, 8, 12` uses this same positive source expression for
all three components. No physical time or velocity is converted into a finite
binary64 sample. In particular, a displayed `t` rounded to 1 never changes the
internal positive `tau` into zero.

The reduced leading coefficients and their exact positive scales are:

| Direction | Reduced leading coefficient | Scale in `tau^A*u` | Scale in physical `u` |
|---|---|---|---|
| Radial | `-partial_eta averageU(2/Lambda,0)` | `tau^h/sqrt(Lambda)` | `tau^(-1/2)/sqrt(Lambda)` |
| Azimuthal | `Phi(2,0)` | `eScale` | `tau^(-A)*eScale` |
| Axial | `U(2/Lambda,0)/j0` | `j0` | `tau^(-A)*j0` |

The equality of the two radial physical scaling expressions uses the exact
source identity `A-h=1/2`. The source evaluator retains its positive nonlinear
comparison error and positive pressure analytic error before these scales are
applied. The leading source branch restriction retains accumulated noncore
mass integrals; a compact integrand is not used to erase a nonzero moment.

The radial source correction estimate is `C*tau^(3h)`, while the azimuthal and
axial estimates are `C*tau^(2h)`. After each direction's normalization, all three
errors are bounded by `Cstar*tau^(2h)`. The chosen time gives the exact bound

```text
Cstar*tau_d^(2h)
 = Cstar*plateau^(2h)*2^(-d)/(1+4*Cstar)
 < 2^(-d-2).
```

Each stored interval is the complete leading interval widened by the rational
radius `2^(-d-2)`. The UI displays its two outward rounded endpoints as an
interval bar. It does not use a midpoint as an observed velocity or interpolate
between depths. Three separate axes show the distinct normalized quantities.

For example, at depth 12 the rational source correction radius is `1/16384`.
The outward display intervals are approximately radial
`[-4.000061035156251,-3.9999389648437496]`, azimuthal
`[0.5766638608091124,0.5767859311216126]`, and axial
`[0.9999389648437499,1.0000610351562502]`. These are the reduced coefficients on
their own normalized axes; they are not physical binary64 velocities.

## Decimal observations and final-field scope

The authenticated original small constants make all six prescribed decimal
observations, `1e-2`, `1e-4`, `1e-8`, `1e-12`, `1e-40`, and `1e-1000`, lie in the
defined initial zero extension of the common6/M2 localization. The recorded
zeros come from that exact source cutoff branch, not from absent field values.
The nonzero inner-path observations therefore use the exact source-dependent
`s_d` expressions rather than ordinary decimal approximations to zero.

The full final N6 field has not been constructed here. Transferring the
background inner-path result to the final localized velocity retains the
external source identities in Propositions 9.9 and 10.1 and the unexecuted
final N6 construction. The consumer now also rehashes the separately recorded
original source-domain execution. It verifies canonical equality of the source
binding and equality of the captured localization `qStar` with that record's
`qBig`, before attaching its domain prerequisite evidence.

The separate N7 execution is
[`evidence/source-exterior-force-jets-20261012/attempt2/receipt.json`](evidence/source-exterior-force-jets-20261012/attempt2/receipt.json).
It passes **11/11 source tests** and **52/52 independent Fraction checks**.
Its five fixed initial premises and twelve domain checks support the explicit
source application of Lemma 9.7 and Proposition 9.9. The permitted domain is
`qBig/q_common=1/64`; the cutoff support upper bound is `qBig/4`, with an exact
positive gap `qBig/4` to the domain half. The canonical domain/exterior archive
hash is `7dd8e216a7bdccd6cbb7b64a323d53e891560d999f87e13b92a1add2a0df5d5e`.
The source-domain artifact hash is
`1350acb65cae056f094e8d90dd557d0b44d1c5f51d55149b2aa1089f9ed2ae5c`.

This updates only the additive consumer, view and tests. The historical N8
certificate, its full scalar program, the generated archive, and all 117
captured successful source files remain unchanged. The verified definition
domain is not presented as an executed nonzero final field. Later fixed linear
correction stages need not shrink that chosen domain; their remaining
implementation obligations are preserved separately.

`lastResolvedTau` identifies the last archived positive source row, depth 12;
it does not claim that a smaller source time is impossible or that an
uncomputed all-space field is resolved there. The corresponding next-record
limit is exhaustion of the archived observation set. Underflow is never
reported as the mathematical reason for a failure.

## Fresh independent core refinements

`evaluateSourceCoreRefinement` changes one control at a time, with the other
two controls fixed:

| Family | Default variants | Held fixed |
|---|---|---|
| Nested spatial point grid | 1, 2, 4 subintervals in exact `Y in [2,3]`, `eta=0` | Comparison degree 32; arithmetic 256 bits |
| Comparison series degree | 32, 48, 64 | Two spatial subintervals; arithmetic 256 bits |
| Directed arithmetic | 128, 192, 256 bits | Two spatial subintervals; comparison degree 32 |

The default plan executes 17 distinct original core points/controls and compares
exact intervals at shared coordinates. Increasing the point count does not
assert a uniform between-point interpolation bound or resolution of the
annular pulse width. Increasing the comparison degree does not rerun the
entire nonlinear fixed-point recurrence. No final-source Fourier cutoff or
omitted angular-mode tail is silently supplied.

The recorded independent gate is
[`evidence/source-core-refinement-20261012/attempt2/receipt.json`](evidence/source-core-refinement-20261012/attempt2/receipt.json).
It executes a fresh default plan in **0.215 seconds**, preserves the bytes of
10 dependency files, and passes **196/196** independent `Fraction` checks. These
checks recompute the exact eta-zero comparison series and its positive source
errors, verify the positive radial/axial scaling enclosures, and independently
compare common-point interval widths. This adds numerical evidence for the
leading-core refinements while retaining the remaining full-field obligations.
The resource guard counts the exact union of the baseline and all variants
before execution, including when no variant contains the baseline controls.
The earlier attempt and its original source bytes remain in attempt 1. A
regression rejects a plan whose variant-only count would be 155 but whose
actual baseline-inclusive count is 170, beyond the cap of 160 evaluations.

## Runtime and view interfaces

| Module | Exports / behavior |
|---|---|
| `source-near-terminal.mjs` | Heavy authenticated construction, assertion, certificate, exact interval widening, and source log-time retention |
| `source-near-terminal-evidence.mjs` | `recordedSourceNearTerminal`, `sourceNearTerminalObservations`; immutable archive plus separate same-source domain revalidation, no heavy constructor |
| `source-core-refinement.mjs` | `evaluateSourceCoreRefinement`, `validateSourceCoreRefinement`, `sourceCoreRefinementObservations`; fresh directed core evaluations |
| `../web/navier-near-terminal-view.mjs` | Panel, compact summary, exact-row selection, and accessible three-axis interval SVG |

The intended dispatch operations are `N8/source-near-terminal-record` and
`N8/source-core-refinement`. Both observation contracts leave generic spatial
`samples` and `curves` empty. Dedicated views consume the exact source record
or the exact refinement table directly. The complete scalar program remains
in the exported result even when the DOM summary omits its large node list.

The cheap source-log regression passes 2 tests, core-refinement contracts pass
3 tests, and the actual archive/view contracts pass 7 tests. The latter exercise
full source retention, archive tamper rejection, three-axis endpoint placement,
keyboard selection, scope preservation, and rejection of physical binary64 or
fabricated spatial samples. The heavy gate and independent checks are recorded
separately above.
