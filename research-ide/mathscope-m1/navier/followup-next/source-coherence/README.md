# Source coherence and explicit inner-continuation evidence

This directory supplies one source-linked analytic axis and inner continuation,
with exact bounds, a rounded interval evaluator, and independently checked finite
algebra. It preserves the earlier examples and adds a new parameter selection.

**It is not a completed global Navier–Stokes profile certificate.** The selected
outer parameters include `Md=1`. The directed-interval certificate
`../outer-uniform/axial-midpoint-certificate.json` evaluates an actual
axial-transition point, eta=3/4 and axial y=exp(1/2)-1, with
`Pc/XR` enclosed approximately in `[-143.313, -141.612]`. Thus the required
positive A.4 cone condition fails for this unchanged outer datum, at every
positive radial scale. The certificates here must not be combined into a global
PASS. This is a failed required parameter choice, not a negative claim about
other outer parameters or about the manuscript's general existence theorem.

The local statements remain useful even if that outer parameter choice is
rejected. They specify exactly which analytic source, radius, amplitude, widths,
and implicit moment root are being computed. A new outer parameter selection
would require a newly generated pressure, axis and continuation datum.

## Selected datum and numerical representation

The latest parameter file is `uniform-source-debt-final.json`, SHA256
`ac79c8268a501f9762b5f13f6efe114809a94e568efc614e2fd66ceae4303c7a`.

Its pressure is the actual positive-mixture A.21 target generated from the
pinned source schedule, with `Md=1`, `logP=14`, `lambda=0.0002`, `Tf=64`, and
`co=0.005`. The actual binary64 h value is retained exactly as

\[
h=3022314549036573/302231454903657293676544,
\qquad j_0=1/10000000000.
\]

The axis Lambda is a 161-digit integer computed from the source remainder
bound. Its fixed-point error is at most `1/10000000000000`, which is sufficient
for the source's `deltaStar/100` target. The final `logC` is a 210-digit integer.
The normalization factor C is the positive real number `exp(logC)`; it is never evaluated as
an overflowing floating-point number.

After the final C is selected, the activation width, small shear factor, and two
terminal transition widths are stored as exact positive scaled exponentials:

\[
w=\frac{w_{old}}{10^8 B_0^{20}(1+V_A)}
\exp[-24(\log C+\Lambda Z)].
\]

The rational factors are retained separately, including the 2497-digit B0. The
old rational widths are now upper envelopes, and the final analytic continuation
uses the displayed smaller positive values. The earlier source files remain
unchanged and are explicitly different data.

The profile parameter domain is **eta in [-1,1]**, as in the original manuscript.
Its physical relation is `eta=z/q^D` with `tau=q*(1-eta^2)`. The interval includes
the one-sided endpoint limits; it is not a claim about all real eta values.

## Implemented results

| Result | Evidence | Exact scope |
|---|---|---|
| Actual A.21 pressure bound generation | `source-axis-cone-refined.json` | Same ideal schedule pressure and its analytic majorants |
| Radial-scale independence | `datum-ledger-final.json` | Change of variables for every positive XR; executable recalculations at logXR 0, 20, 100 |
| Automatic low-chi axis refinement | `refine-axis-certificate.mjs` | Remainder-based Lambda selection and new infinite fixed point |
| Actual nonlinear interval prefix | `axis-prefix-final.json` | Radial degree 24, eta Taylor degree 2, 1024-bit directed arithmetic, infinite radial tail |
| Explicit reference and activation bounds | `continuation-refinement.json` | 30 exact scalar comparisons plus the documented analytic implication chain |
| C0/C1/C2 moment-debt bounds | `uniform-source-debt-final.json` | One final continuation, eta in [-1,1], source-bound normalized debt rows |
| Inner exact functional reconstruction | `CONTINUATION_REFINEMENT.md` | Published infinite-core identities and exact B.22/B.26/B.34 definitions; not a truncated polynomial identity assertion |
| Independent finite reconstruction | `core-audit.json`, `core-independent.json` | Nine exact identities for the actual old Float64 polynomial fixture; 37 independent checks |
| New local Lean proofs | `CoreAlgebra.lean`, `PositiveScales.lean` | Ten algebra/margin theorems; actual h/j SmallParameters instantiation; scale positivity and nonzero theorems |
| Mathematical negative control | `negative-axial-lean.log` | Lean rejects an intentionally false axial formula with exit code 1 |
| Exact logarithmic observations | `source-log-observations-final.json` | 35 interval observations of the same final datum, preserving enormous offsets and tiny positive factors |

The source/reference lower bound has a constant term approximately
`2.9999998098995113`, strictly greater than 2.4, after the chi and square-root-chi
terms are absorbed. The constant-a and complete B.34 shape transitions have
rational Sq lower bounds displayed as approximately `1.79999984194` and
`1.649999845945`; each is strictly greater than one. These are consequences of the displayed
analytic estimate chain and its exact scalar comparisons. They are not
observations from a mesh and have not been exported as a complete Lean proof.

The source-dependent moment root, joining rectangle, loop and local-frequency
calculations are in the sibling `../uniform-gluing/` directory. Their final
files carry the same source-file hash. The factored widths were selected small
enough that the prior C0/C1 debt estimates remain valid; the additional C2 bounds
are computed explicitly.

## Logarithmic evaluator

`source-log-evaluator.mjs` loads the actual internal source and interval
certificates. The public input accepts only a profile selection, phase, rational
coordinate, and rational eta. It accepts no caller-supplied proof flag, norm,
pressure mass, interval width, or amplitude.

From this directory:

```bash
node --input-type=module - <<'JS'
import {evaluateSourceProfileLog} from './source-log-evaluator.mjs';
const observation = evaluateSourceProfileLog({
  profile: 'final',
  phase: 'axis',
  coordinate: '41/10',
  eta: '0'
});
console.log(JSON.stringify(observation, null, 2));
JS
```

Supported phases are:

| Phase | Coordinate | Eta | Meaning |
|---|---|---|---|
| `axis` | `0`, `1`, `2`, `4`, or `41/10` | `0` | Y=Lambda*X; source-bound Phi/U and log F/E enclosures |
| `shape-transition` | Rational fraction from `0` to `1` | `0` | B.34 fraction y/Tsh, with the exact large logarithmic offset retained |
| `joining` | Rational log x from `-8` to `-5` | Rational from `-1` to `1` | Ideal/restoration fields and the same implicit root enclosed by its certified coefficient ball |
| `activation-factor` | Rational y/t1 from `0` to `1` | Rational from `-1` to `1` | The actual scalar flat activation factor and selected positive width in logarithmic coordinates |

`profile: 'initial-small-j'` selects the preserved earlier datum for comparison.
It never silently mixes its widths with the final source prefix.

Every large logarithmic value has `offsetExact` and a directed dyadic remainder.
The displayed relation is `log(value)=offsetExact+remainder`. A floating-point
display of an interval center is not its mathematical definition. At the
Cartesian axis E is exactly zero because its radial square-root factor is zero;
F remains positive. At the activation endpoint the source step is exactly zero.
Those two defined zeros are distinguished from positive values too small for
binary64.

The evaluator returns enclosures, not a fabricated exact trajectory inside an
uncertainty interval. In particular its eta-zero axis jets do not themselves
prove an all-eta coefficient-space theorem.

## Verification and reproducible entry points

Run the finite independent checks from this directory:

```bash
node interval-audit.mjs
python independent_intervals.py
python independent_map_bound.py
python independent_continuation.py
python independent_core.py
node datum-ledger.mjs --final
```

The recorded results are:

| Verification | Result | What it tests |
|---|---:|---|
| Independent intervals | 758 / 758 | Fraction arithmetic containment, independent 500-digit transcendental values, exact first source recurrence coefficients, tail formula, datum integrity |
| Independent reconstruction | 37 / 37 | SymPy reconstruction from the actual Float64 coefficients, nine polynomial identities, actual nonzero truncated residuals |
| Independent map bound | 8 / 8 | Exact moment-map telescoping polynomials, reciprocal identity, cone composition, historical wrong-formula rejection |
| Independent continuation | 38 / 38 | Exact scaled-exponential factorization, monotone envelope transfer, reduced cone inequalities, same-prefix binding |
| Input rejection audit | 12 / 12 | Unsupported profiles/fields, inexact coordinates, invalid domains, and zero denominators |
| Core algebra Lean | Exit 0 | Ten actual scalar/algebra theorems in the pinned rc2 kernel |
| Positive scale Lean | Exit 0 | Three actual theorems, including the exact original SmallParameters instantiation |
| False axial Lean control | Expected exit 1 | The false equation reduces to an unsolved False goal |

The transcendental cross-checks are independent numerical verification at 500
decimal digits. The producer's enclosure justification is instead its directed
integer arithmetic, positive Taylor sums and explicit geometric remainder.

`run-source-formal.py` reuses the recorded official rc2 environment and runs the
small local Lean files. It deliberately also runs the false file in
`negative-control/`; failure of that file is the expected result. It does not
rebuild or modify the original official source tree. Both successful theorem
files report only the usual `propext`, `Classical.choice`, and `Quot.sound`
dependencies; they contain no sorry-based proof of the requested global claim.

For fresh mathematical computation, call `certifySourceAxisForCone` from
`refine-axis-certificate.mjs` with the source pressure parameters and j0; then
run `derive_uniform_debt.py` with the newly generated axis filename, followed by
`refine_continuation.py`. The latter fixes the selected final data. Run
`runSourceAxisPrefix` from `axis-prefix.mjs` with `sourceSelection: 'cone-margin'`
and that exact `logC` to recompute the interval coefficients. Dependent files in
`../uniform-gluing/` must then be regenerated from the new source hash. Changing
an outer parameter while retaining an old source hash is rejected.

## Proof boundaries and open original requirements

The whole analytic argument is in `CONTINUATION_REFINEMENT.md`; the earlier C0/C1
estimate derivation is in `UNIFORM_SOURCE_DEBT.md`. The finite coefficient-space
arithmetic is tied to the pinned A.21 source and published existence and
uniqueness theorems. The entire generated analytic premise bundle has **not**
been assembled into a new Lean proof. Importing an original theorem or proving
the positive scale formula does not discharge all those hypotheses.

The following requirements therefore remain separate:

1. The actual A.4 outer cone and its quantitative parameter selection. The
   current Md=1 choice has a directed-interval counterexample and must not be
   described as satisfying the full outer construction. A successful replacement
   requires new pressure, axis and continuation data.
2. All outer moment corrections, A.7 heat compensation, and exact equality of
   the completely corrected pressure with the A.21 target.
3. The complete compact interval, incoming moment errors, finite frequency and
   global guarantees for C.12 modulation. A local joining frequency is not that
   global frequency.
4. The final exterior stress support, nonzero interior, flat factorization and
   endpoint direction after every outer edit and modulation. The inner collar
   argument in this directory does not settle the exterior endpoint.
5. The complete Lean realization of the selected infinite source and its
   executed interval arrays. The existing finite polynomial example has
   provably nonzero residuals and is intentionally not declared an exact
   infinite solution.

These limitations are encoded in the JSON gates as well as this document.
Earlier successful local examples, different values of logP, and different
choices of C or Lambda are retained as separate evidence. None is combined with
another to manufacture a global completion claim.


## Source-parametric regeneration

`rebuild-source-variant.mjs` now regenerates a separate local chain from actual
Md, logP, h, lambda, logXR, Tf, and co inputs without modifying the original
source records. The two parameterized generators read exact logP from the
actual pressure certificate. They compute the corresponding P* lower bound,
outer radius, separation coordinate, and all downstream source-dependent
constants.

The baseline parity run reproduced all bytes of the three original debt and
continuation JSON files with **no excluded fields**; the final source hash
remains ac79c8268a501f9762b5f13f6efe114809a94e568efc614e2fd66ceae4303c7a.
A separate Md=1.01, logP=15 parameter-path run recomputed the actual pressure,
axis, 18/18 debt checks, 30/30 continuation checks, and degree-24 radial,
eta-degree-2, 1024-bit interval prefix. Its exact source hash is
fa43ec55cc374f87a7289183c97b0742278d30b1adca7dbe1635d7941a1e685f.
The independent parameter and binding audit passed **21/21** checks.

This second run is an implemented local example; it is not a recommended or
certified global outer choice. Every variant receipt keeps global and generated
analytic Lean gates false. Unsupported producer ranges and failed scalar
conditions remain failures. Instructions, exact substitutions, and the range
boundary are in `PARAMETRIC_REGENERATION.md`; the executed records are under
`variants/` and in `independent-variant.json`.
