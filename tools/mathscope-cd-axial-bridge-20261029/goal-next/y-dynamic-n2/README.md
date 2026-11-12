# Original N2 natural-call derivative readback

The checker streams the exact 2,852,905-node original graph. It runs the pinned induction derivative implementation on original node #118955 and checks the generated radial and axial natural-series calls against original nodes #119013 and #119149. Both preserve the local original Y and eta arguments. The separate materialization control replaces both formal arguments and confirms the new Y changes when its bound radial variable changes. The latter control uses a small registered harness around the authentic source body.

The replay establishes these operator identities on the authentic prefix. Actual range after arbitrary later binder substitutions, dynamic Picard evaluation and Forced calls remains OPEN.

The original local moment `#120279` binds `#120276` on `[0,Xcut]` and calls
native expression system 11 with that exact radial argument. A second replay
expands the literal finite Picard sum and follows a natural-series call with
three actual nested integration binders in `[0,1]`. On the active branch,
`Xa < v² <= Xcut < Xa exp(t1/16)` and
`Y = Λ v² <= 4 exp(t1/32) < 5` with the original source constants. The
inactive branch evaluates to zero at the guard. This is a range statement for
the identified finite-sum call under the source real and native semantics.
The Picard limit and complete dynamic coverage remain OPEN.

The [five-moment replay](n2-all-local-moment-picard.json) binds the exact
local integral in each of the five actual order-two moment definitions.
It checks both realized Picard components at all seven local uses and 291
distinct generated natural calls in the original three-term partial sums.
It tracks the lexical unit-interval binders and the original lazy radial
branches. The two negative controls remove the strict radial guard and
enlarge the unit binder. Both fail. [GitHub Lean](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43235628663)
proves the unit-product inequality, the finite radial bound, and the two
real logarithm normalizations used by the replay. The nonlocal lower
contributions and nested prior profile bodies retain their separate scope.

From the combined evidence directory:

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
i=inputs/original-axial-n2
node "$p/y-dynamic-n2/n2-real-derivative.mjs" \
  "$i/original-n2-current-pressure-graph/original-source-nodes.jsonl.gz" \
  inputs/original-core-runtime/research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs \
  "$i/y-reached.json"
node "$p/y-dynamic-n2/n2-moment-native-binder.mjs" \
  "$i/original-n2-current-pressure-graph" \
  inputs/original-core-runtime/research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs
node "$p/y-dynamic-n2/n2-all-local-moment-picard.mjs" \
  "$i/original-n2-current-pressure-graph" \
  inputs/original-core-runtime/research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs
```
