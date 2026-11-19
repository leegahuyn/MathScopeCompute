# Complete explicit argument check at original N4 site #121999

**VERIFIED.** Original site #121999 is the actual order-2 mixed derivative
request `(system 3, component 1, X #120241, eta #2, radial order 2, eta order 1)`.
The prior original materializer produced the pinned 82,848-node ordinary
operand graph. This check independently enumerates all 1,221 fresh natural
calls. It also authenticates the separate original ingress receipt for this
exact source site. The receipt places #120241 under the original cutoff and
the actual unit-interval binder #120240. The current proof extends the
previous ten B22 time operands to all the generated natural operands at
this one original site.

| Exact generated operand shape | Fresh natural calls certified |
| --- | ---: |
| Literal 4 | 2 |
| Bound natural coordinate | 6 |
| `Lambda` times a product | 442 |
| `4 exp(u)` | 139 |
| `Lambda` times a squared radius | 632 |
| Total | **1,221** |

The Python checker tracks separate per-call obligations for real
definedness, nonnegativity and the upper bound (4exp(2t_1)). It
applies the monotone logarithm and exponential rules to exact source
operands and transports each interval obligation through both actual
integration endpoints. A guarded logarithm requires strict positivity
in its actual selected arm. Obligations that depend on an integration
coordinate remain scoped unless its binder discharges them. Target
membership follows actual operand edges, and the proof uses integer
bitsets and exact rational arithmetic. All natural calls retain eta #2.

**CONDITIONAL.** Under the source geometry (X_a>0), (Lambda X_a=4),
(0<t_1<1/128), and the original caller frame
(0le Xle X_{mathrm{cut}}=X_aexp(t_1/32)), (|eta|le1), each
verified natural operand satisfies (0le Yle4exp(2t_1)<256/63<5).
The strict comparison follows from (exp(s)<1/(1-s)) for (0<s<1).
Source branches and integrals use their real lazy evaluation and
capture-free binder semantics.

The checker also proves two explicit native ingress results within this
same materialization. All 595 generated system-0 even-profile calls have
their squared radial argument in ([0,X_{mathrm{cut}}]). All 353 generated
system-3 Picard calls have their radial argument in
([0,sqrt{X_{mathrm{cut}}}]). The exact arguments factor into the
original (sqrt X) times bound unit-interval coordinates, or its square
times further bound unit-interval coordinates. Both original systems
admit radius through (a=sqrt{X_aexp(t_1/16)}), as checked in the
original N4 coefficient recursion audit. These calls also retain eta #2.
The joint positive replay records 413 endpoint transfers and 706 guard
positivity discharges, with zero open input obligations at these sites.

| Proof facts available | Open natural arguments | Open native ingress arguments |
| --- | ---: | ---: |
| All source facts | 0 | 0 |
| Withhold integration binders | 1,216 | 948 |
| Withhold lazy-guard facts | 575 | 0 |
| Withhold the original radial frame | 1,207 | 948 |

**OPEN.** Other original higher-system derivative sites, descent through
the typed native bodies, native limits and actual derivative agreement
need independent verification. This result does not promote the overall
Y or final-jet gate.

The compressed graph is the C71 original materializer output with
SHA-256 `a03d0431f725251e46c8d1d5331c52998fd3b94851ed5bb1b2888eb0ed3dd025`.
The original ingress keeps its recorded SHA-256
`54ef4870cf5a839a54b770b55a03e5deb7b8065f0e8eb291e769c3fe63d1cd0a`.
From the workspace root, use the frozen graph and original ingress inputs.

```powershell
$audit = 'work/goal-next/continuation72/y-higher-family'
$graph = 'work/goal-next/continuation71/y-domain-b22/moving-graph.json.gz'
$ingress = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/y-higher-flow/y-picard-callers/top-calls.json'
python -B "$audit/verify_higher_family.py" $graph "$audit/range.json" $ingress --include-native-ingress
python -B "$audit/verify_higher_family.py" $graph "$audit/without-binders.json" $ingress --include-native-ingress --drop-binders
python -B "$audit/verify_higher_family.py" $graph "$audit/without-guards.json" $ingress --include-native-ingress --drop-guards
python -B "$audit/verify_higher_family.py" $graph "$audit/without-radial-frame.json" $ingress --include-native-ingress --drop-radial-frame
```
