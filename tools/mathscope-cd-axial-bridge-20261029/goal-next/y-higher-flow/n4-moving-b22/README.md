# Original #121999 B22 moving-endpoint range

**VERIFIED.** Original N4 site #121999 requests mixed derivative
`(radial order, eta order)=(2,1)` of component 1 of Picard system 3,
with exact operands X=#120241 and eta=#2. System 3 is original order 2.
The pinned original materializer produces 82,848 reached ordinary nodes
and 1,221 fresh natural-series call nodes. One of these, replay-local
#137622, retains the original operand `#3845=4 exp(#3843)`. Its
`#3843` coordinate is bound inside integral #137624. The endpoints
are t1 and `log(exp(w)/Xa)`, with (w) the original B22 partial-moment
coordinate #3819.

The independent Python replay checks exact typed operands and traverses
all ordinary paths from the materialization root to the selected calls.
It reduces monotone upper-bound obligations through exact logarithm and
exponential syntax, substitutes both real endpoints when a coordinate
leaves its integral scope, and transports strict positivity only through
the appropriate arm of a source guard. A bound-dependent obligation that
cannot be discharged remains at its original integral. Transfer across
this integral checks the interval between both endpoints, so reversed
orientation causes no inference about their order. In particular, some
right endpoints of the enclosing #3819 integrals continue through original
B26 log-radius coordinates. Their exact bindings also enter the replay.
No native value oracle or floating-point sampling is used.

| Scope | Calls | Endpoint transfers | Guard positivity discharges | Open |
| --- | ---: | ---: | ---: | ---: |
| Original witness `Y=#3845` | 1 | 40 | 22 | 0 |
| All fresh `4 exp(u)` baseline-time operands in this materialization | 10 | 50 | 22 | 0 |

The family uses seven distinct time coordinates. Withholding binder
transfer leaves seven scoped time debts, one in the minimal witness.
Withholding the lazy-guard facts leaves ten scoped positivity debts in
both runs. The controls are proof sensitivity tests.

**CONDITIONAL.** Under the pinned original chart ingress
`0 <= X <= Xcut = Xa exp(t1/32)`, source Xa and t1 positivity, and the
original real lazy and capture-free integral semantics, the symbolic
inequalities prove every selected-path time coordinate satisfies
`u <= 2*t1`. Hence

```text
0 < Y = 4*exp(u) <= 4*exp(2*t1) < 256/63 < 5
```

where the last strict bounds use the source inequality `0<t1<1/128`.
These calls all retain the original eta formal, so the admitted eta range
follows from the caller ingress as well.

**OPEN.** The other 1,211 fresh natural call operands at #121999, other
original higher-system requests, typed-definition descent, exact native
derivative values and native infinite semantics need separate evidence.
This replay narrows a source-bound higher-order obligation and does not
promote any release gate.

Run from the workspace root with Node.js 24 and Python 3. The materializer
authenticates the original 7,358,162-node stream and the prior flow inputs.
The independent verifier pins the compressed output.

```powershell
$audit = 'work/goal-next/continuation71/y-domain-b22'
$graph = 'work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph'
$source = 'work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier'
$flow = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/y-higher-flow'
node --max-old-space-size=4096 "$audit/replay_moving_endpoint.mjs" $graph 'work/goal-next/y-n4/reached.json' $source $flow "$audit/moving-graph.json.gz"
python -B "$audit/verify_moving_endpoint.py" "$audit/moving-graph.json.gz" "$audit/range.json"
python -B "$audit/verify_moving_endpoint.py" "$audit/moving-graph.json.gz" "$audit/without-binders.json" --drop-binders
python -B "$audit/verify_moving_endpoint.py" "$audit/moving-graph.json.gz" "$audit/without-guards.json" --drop-guards
python -B "$audit/verify_moving_endpoint.py" "$audit/moving-graph.json.gz" "$audit/family-range.json" --all-baseline-time
python -B "$audit/verify_moving_endpoint.py" "$audit/moving-graph.json.gz" "$audit/family-without-binders.json" --all-baseline-time --drop-binders
python -B "$audit/verify_moving_endpoint.py" "$audit/moving-graph.json.gz" "$audit/family-without-guards.json" --all-baseline-time --drop-guards
```
