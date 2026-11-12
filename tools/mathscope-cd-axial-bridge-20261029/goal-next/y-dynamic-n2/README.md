# Original N2 natural-call derivative readback

The checker streams the exact 2,852,905-node original graph. It runs the pinned induction derivative implementation on original node #118955 and checks the generated radial and axial natural-series calls against original nodes #119013 and #119149. Both preserve the local original Y and eta arguments. The separate materialization control replaces both formal arguments and confirms the new Y changes when its bound radial variable changes. The latter control uses a small registered harness around the authentic source body.

The replay establishes these operator identities on the authentic prefix. Actual range after arbitrary later binder substitutions, dynamic Picard evaluation and Forced calls remains OPEN.

From the combined evidence directory:

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
i=inputs/original-axial-n2
node "$p/y-dynamic-n2/n2-real-derivative.mjs" \
  "$i/original-n2-current-pressure-graph/original-source-nodes.jsonl.gz" \
  inputs/original-core-runtime/research-ide/mathscope-m2/navier/actual-continuation-exact-functions.mjs \
  "$i/y-reached.json"
```
