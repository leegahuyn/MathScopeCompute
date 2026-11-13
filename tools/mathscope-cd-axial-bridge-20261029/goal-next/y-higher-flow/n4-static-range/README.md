# Conditional N4 literal natural Y range and physical root frame

The original N4 raw-base projection has 14 current/pressure and selector
roots, 1,169,752 reached AST nodes and 597 reached literal natural-series
calls. `range_flow_n4.py` is an explicitly scoped adaptation of the earlier
N2 obligation engine, with new N4 projection and registry pins, 14 roots and
597 targets. It imports **zero** prior successes. Its three complete runs
yield:

| Run | Conditionally discharged | Open | Unsupported entries |
| --- | ---: | ---: | ---: |
| Positive source assumptions including root-2 bracket | 597 | 0 | 0 |
| Do not assume the defined root-2 bracket | 593 | 4 | 29 |
| Remove the pinned loop-left positivity assumption | 439 | 158 | 322 |

The positive run transports 7,770 formal/actual obligations. The four
no-bracket targets are original calls #4758, #4784, #5177, #5299; their
remaining condition is `#4587658>=0`. Negative-control open cases are
deliberately withheld proof facts, not counterexamples to the source.
`verify_n4.mjs` pins the three receipts, the original reached graph and
registry, and the earlier N4 source-profile audit, independently checks
these counts and re-reads the exact root and native-call parameter nodes.
It does not independently reproduce the obligation engine's entire 1.17M
node analysis; that analysis is the Python run.

The range proof uses the earlier engine's sufficient envelope
`0<=Y<=4*exp(2*t1)<256/63<5` and its exact original branch/binder/native
obligation rules. The strict inequality assumes the pinned source
`0<t1<1/128` as used by the prior N2 flow (or any independently proved
stronger sufficient inequality), not merely `t1<1`. The source-guard audit
provides the original parameter facts, and the analysis treats an admitted
actual root-2 bracket as a conditional input. Natural-series definedness,
lazy branch and binder semantics, capture-free substitution, and source
native derivative semantics remain necessary premises. This is a static
N4 **raw-base** Y argument result, not the distinct global Y 523 criterion.

## Exact N4 source image and 14 actual simultaneous applications

The original registry's monotone system 2 has formal variable #4587644,
physical `(Z,T)=(#4587637,#4587638)`, bracket `[1/2,2]`, and body #4587653,
which the verifier decodes as

```text
s - Z^2*s^(2h) - T = 0.
```

The actual graph uses root #4587654, `X=#4587658=R^2/(2s)`, and
`eta=#4587663=Z/s^(1/2-h)`. In each of 14 original native expression
applications listed in `n4-verified.json`, the verifier reads the actual
definition parameters and checks the simultaneous substitutions
`formal X #4756 -> #4587658` and `formal eta #2 -> #4587663`; two of the
14 request one formal X derivative. This is a concrete subset, not a proof
that every N4 eta frame is transported correctly.

On the source preimage `s in [1/2,2]`, `|eta|<=1`, `0<h<1/16`, with
`Z=s^(1/2-h)*eta` and `T=s*(1-eta^2)`, the displayed equation is exact and
`T>=0`. For every u in `[1/2,2]`, `Z^2<=2` and
`u^(2h-1)<=2`, so the derivative of `u-Z^2*u^(2h)-T` is at least
`1-8h>1/2`. Thus s is the unique bracketed root on that admitted image,
and for real R the actual X is nonnegative. Conversely, for a positive
root and `T>=0`, `eta^2=1-T/s<=1`; at T=0 this gives |eta|=1. This is
an algebraic image/uniqueness reduction, not proof that arbitrary input
coordinates lie in the image, nor a native numerical evaluation.

## Boundaries

The 597 calls are the finite original literal-node set, including
conservatively reached inactive branch arms. Generated natural calls from
Picard expansion/differentiation (including the separately checked five
actual caller paths in `continuation40/y`), arbitrary n, all indexed or
coupled/Forced/FiveMap systems, actual domain/image membership for every
source frame, eta and cutoff boundary derivatives, native Picard
convergence, and all 67 final jets remain separate. In particular neither a
597/597 static calculation nor the fourteen source frames proves the Y
gate or changes RELEASE HOLD.

## Reproduction

Use Python 3 and Node.js from the workspace root. Each command takes explicit
paths; the three output filenames below are pinned by the verifier.

```text
python work/goal-next/continuation41/y/range_flow_n4.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/source-profile-data.mjs work/goal-next/continuation41/y/range-flow.json --transport --allow-defined-root2
python work/goal-next/continuation41/y/range_flow_n4.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/source-profile-data.mjs work/goal-next/continuation41/y/no-bracket.json --transport
python work/goal-next/continuation41/y/range_flow_n4.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/source-profile-data.mjs work/goal-next/continuation41/y/no-loop.json --transport --allow-defined-root2 --drop-loop-sign
node --max-old-space-size=4096 work/goal-next/continuation41/y/verify_n4.mjs work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-next/continuation41/y/range-flow.json work/goal-next/continuation41/y/no-bracket.json work/goal-next/continuation41/y/no-loop.json work/goal-next/y-n4/new15-audit.json work/goal-next/continuation41/y/n4-verified.json
```

No Lean was compiled locally and no Git mutation was made.
