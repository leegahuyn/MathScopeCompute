# Original order-one axial stress binding

The exact positive-order stress producer and its original source test were
materialized from 63 Git blobs. Every byte hash matches the original independent
execution record in `historical-process.json`. The new test run executed the
source constructor once for positive orders 1 and 2 and passed all eight tests.
The separate prefix replay constructed the same proof and emitted a SHA-256
of its first 117,100 nodes. Python matched that prefix against the authenticated
4,420,257-node first-FiveMap export and independently matched the fixed and Picard
registries. The exported expression registry maps expression 1 to `#117047`
and `#672` to `#117069`, with formal arguments `[X#4756, eta#2]`.

The source producer proves the complete mass and pressure flux moments using
the original positive profiles and pressure primitive. It retains all ordered
products and the radial flux boundaries in the conservative identities. The
order-one axial previous-order term consumes the original leading `M0` identity.
At order two it consumes the previous positive-order moment. For angular order
one it uses the separate compensated leading moment and the `Xb` endpoint.
The axial endpoint is `Xplus`. The executed order-one result binds raw `#117045`,
supported density `#117047`, forward and backward integrals `#117057` and
`#117066`, and original total `#117075`. It checks the total and the signed
primitive split with the same density. The case of changing the original
coefficient or omitting a required whole moment is rejected by the source tests.

The radial normalization is `X = R²/2` and `dX = R dR`. The source's formal real
profile variables are used with the original nonzero denominators and the
inward convention at `eta = ±1`. The proof uses the original smooth inner
Picard solution and its mixed derivative interpretation. Archived independent
regularity evidence for that same Picard0, fixed data, and 117,100-node prefix
supplies the analytic input, including the left collar and right flat join.
The source producer verifies the identities by exact AST/rational comparisons
and the documented analytic arguments. The previously compiled Lean files
verify separate algebra, operator and integral lemmas. This run does not give
a Lean proof of the JavaScript interpreter or the full final field.

The generated execution is for orders 1 and 2. The indeterminate-exponent
conservative identity is a recurrence schema. Application at every native
caller and arbitrarily large order still requires its real-domain and recursive
premises. The first-FiveMap export contains no final all-cycle `A,b,p`.

From this directory run the original tests and the two replay steps:

```text
node --max-old-space-size=3072 --test --test-reporter=tap source/research-ide/mathscope-m2/navier/tests/actual-positive-global-stress-source.test.mjs
node --max-old-space-size=3072 replay_positive_stress.mjs new-prefix-replay.json
python bind_prefix_to_export.py --graph <archive-root>/inputs/graph --replay new-prefix-replay.json --out new-axial-binding.json
```

The original analytic derivation is in Lemma 5.2, Step 4, pages 53–54 of the
[OpenAI manuscript](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf).
