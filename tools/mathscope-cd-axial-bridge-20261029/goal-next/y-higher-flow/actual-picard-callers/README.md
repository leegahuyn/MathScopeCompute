# Original guarded callers to generated Picard derivative Y

This replay connects a specific original reached source caller in each of
the five N4 Picard systems to a dynamically generated derivative operand.
It improves the prior arbitrary-X derivative demonstration by using the
actual caller and the prior source-guard receipt; it does not establish all
caller frames or all Y calls.

`source_caller.mjs` reads and hashes the complete original 7,358,162-node N4
stream and its original registry. It checks the primary Picard implementation,
the induction adapter and `top-calls.json` against fixed SHA-256 pins. For
each row it checks the exact original source node
`actual_background_even_profile(system,0,X,#2,0,0)` at `X=#4756`, and checks
that the pinned prior source guard audit contains this caller in its matching
guarded group. The prior audit's [README](../../continuation30/y-picard-callers/README.md)
describes its 2,388,184-edge must-dataflow traversal and negative controls;
this new replay does not repeat that traversal.

The replay calls the actual original graph derivative on the caller, checks
that it produces the corresponding even-profile derivative with radial order
1 and unchanged X/eta, then executes the original higher-order
`materializePicardEvenDerivative` for that derivative. In the generated AST it
finds a path to a natural-series call below both the generated even-X
integral and original Picard radial-average integral. It checks both binders
have literal endpoints `[0,1]` and that the natural call's exact native operand
is `Lambda*(sqrt(X)*u*v)^2`, with eta #2. The ordered source systems and
caller IDs are:

| Order | System | Original caller | Fresh derivative expression | Fresh natural call |
| --- | ---: | ---: | ---: | ---: |
| 1 | 0 | 28834 | 132377 | 132294 |
| 2 | 3 | 120220 | 133531 | 133289 |
| 3 | 5 | 123316 | 134838 | 134596 |
| 4 | 7 | 126666 | 136298 | 136056 |
| 5 | 9 | 130332 | 137912 | 137670 |

The fresh IDs are from this replay's graph after loading a prefix; they are
not original-export node IDs. All five original callers are component 0,
which links to component 4 through the retained original source coefficient
`A0[0][4]=1`; the reproduced actual path avoids assuming this coupling.

For a source frame satisfying the separate nonnegative-X premise, the prior
guard audit yields `X<=Xcut=Xa*exp(t1/32)` when the guarded caller is
selected. Since `u,v` are each in `[0,1]`, and under the source parameter
facts `Lambda>0`, `Lambda*Xa=4`, `0<t1<1`, it follows that

```text
0 <= Y = Lambda*X*u^2*v^2 <= 4*exp(t1/32) < 128/31 < 5.
```

The strict bound uses `exp(x)<1/(1-x)` for `0<x<1`. The parameter facts
are established by the separate pinned source-profile audit in
`work/goal-next/y-n4/audit_new15.py`; they are assumptions here. AST reach
conservatively traverses all piecewise arms, so this proves a conditional
domain bound for the displayed argument if its path is selected; it does
not assert that the path is active at a particular input. The original
caller is a value node; this replay forms its requested formal X derivative
and is not claiming the unmodified original value graph already contains
the generated node. Differentiating the enclosing source cutoff may create
additional terms and has its own regularity requirements.

Still open: proving `X>=0` for every actual frame, the eta image and lazy
branch semantics, full derivatives including cutoff terms, log-dependent
and other natural operands, Picard convergence and derivative/limit
transport, general n and complete Y/jet gates. The finite replay is not a
value evaluation or a proof of those analytical premises. RELEASE HOLD.

Reproduce with Node.js from the workspace root:

```text
node --max-old-space-size=4096 work/goal-next/continuation40/y/source_caller.mjs \
  work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph \
  work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs \
  work/goal-next/continuation30/y-picard-callers/top-calls.json \
  work/goal-next/continuation40/y/source-caller.json
```

The induction adapter must be in the same source directory. Its other
imported dependencies are part of the archived source tree but are not
individually pinned here. Use one line or PowerShell line continuations on
Windows. No local Lean compilation, branch change or commit was made.
