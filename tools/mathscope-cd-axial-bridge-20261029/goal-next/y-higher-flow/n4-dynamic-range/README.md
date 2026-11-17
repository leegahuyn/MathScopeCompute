# N4 actual-caller dynamic derivative natural operands

This replay extends the five individual witnesses in `continuation40/y` to
all dynamically allocated natural-series nodes reachable by ordinary AST
edges in those **five specific** generated first-X-derivative expressions.
It neither treats these calls as original exported nodes nor expands native
definition bodies encountered in the generated expressions.

The checker pins and reads the complete original N4 graph, registry, two
native Picard modules and earlier source-caller guard receipt. It starts at
the original even-profile caller #28834, #120220, #123316, #126666 or
#130332, executes the source graph's formal X derivative and the actual
`materializePicardEvenDerivative` for orders 1 through 5. It starts with the
original prefix through #130347, so IDs allocated after that prefix are
replay-local and cannot be identified with original-export IDs. Original
nodes cannot have newer replay-allocated ordinary children. The checker
therefore traverses new nodes only and inventories every reached new
`actual_natural_series` node in this scope. It checks all five groups of
fresh IDs are pairwise distinct.

| Source order | Dynamic natural nodes | Direct | One log | Two logs |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 42 | 18 | 20 | 4 |
| 2 | 18 | 12 | 6 | 0 |
| 3 | 18 | 12 | 6 | 0 |
| 4 | 18 | 12 | 6 | 0 |
| 5 | 18 | 12 | 6 | 0 |
| Total | 114 | 66 | 44 | 4 |

Each recorded natural node has eta operand original formal #2. The exact
decoded Y expression is one of

```text
Lambda*xi^2
Lambda*Xa*exp(log(xi^2/Xa))
4*exp(log((Xa*exp(log(xi^2/Xa)))/Xa)),
```

where the actual AST gives `xi=sqrt(X)*u` or `xi=sqrt(X)*u*v`, using the
generated even-X integration coordinate u and, when present, the original
radial-average integration coordinate v. For each group of natural calls
sharing a Y operand, the checker first verifies ordinary reachability. Then,
for each relevant coordinate, it removes the corresponding original integral
body edges, retaining endpoint edges, and verifies that **all** calls in the
group are unreachable. It checks every matching integral has literal
endpoints `[0,1]`. For each one- and two-log group it separately removes the
arms selected after `xi^2>Xa` of every matching original smooth-piecewise
guard and verifies that all those calls become unreachable, while preserving
guard operands and the before arm. This establishes lexical domination in
the inspected finite ordinary AST, assuming the source's lazy branches and
capture-free binder semantics. A cut is a structural control, not a
numerical observation of an active branch.

For an actual caller frame with `0<=X<=Xcut=Xa*exp(t1/32)`, source
`Lambda*Xa=4`, positive Xa and Lambda, and `0<t1<1`, the exact two binder
intervals give `0<=xi^2<=Xcut`. Every selected log path additionally has
`xi^2>Xa`; this makes each displayed logarithm positive-domain and makes
each formula equal to `Lambda*xi^2`. Thus, for these 114 selected-path
operands,

```text
0 <= Y <= 4*exp(t1/32) < 128/31 < 5.
```

The source-specific upper caller guard was established in the separately
pinned `continuation30/y-picard-callers/top-calls.json`. Actual X
nonnegativity, eta image, source inequalities, the derivative formula and
smooth behavior at endpoints are separate assumptions; the conditional
source-image reduction for some actual `(X,eta)` frames appears in
`continuation41/y`. Here eta=#2 means the source formal is retained; it does
not establish every actual eta argument lies in `[-1,1]`.

The result covers neither all derivatives of all original callers, old
natural nodes, dynamically expanded native-definition bodies, coupled or
Forced graphs, arbitrary source n, actual infinite Picard convergence, nor
the overall Y and 67-jet release gates. RELEASE HOLD is unchanged.

Run with Node.js from the workspace root. Set `REPLAY` to this directory
and `OUTPUT` to the path for a new receipt.

```text
node --max-old-space-size=4096 REPLAY/source_dynamic.mjs \
  work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph \
  work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs \
  work/goal-next/continuation30/y-picard-callers/top-calls.json \
  OUTPUT
```

The induction adapter must be in the same source directory. This replay
reads its remaining imports from the archived runtime without individual
hash checks. PowerShell users should put the command on a single line or
use its native line continuations.
