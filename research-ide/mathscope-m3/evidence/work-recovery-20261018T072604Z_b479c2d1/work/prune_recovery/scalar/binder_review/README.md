# Scalar lexical binding review

This is a new, narrowly scoped adapter and review. It is not the lost scalar
implementation, a source producer, a derivative materializer, an integrator, or
a numerical evaluator.

The actual-source audit checks the parent's freshly recovered raw closure:

| Check | Result |
| --- | ---: |
| Integral records | 4,212 |
| Distinct integral coordinate binders | 876 |
| Expression-native calls | 1,013 |
| Distinct expression definitions | 111 |
| Zero-order expression calls | 202 |
| Calls needing formal derivative materialization | 811 |
| Undeclared syntactic coordinates in those formal bodies | 0 |
| Synthetic scoping controls | 10 passed |

`ACTUAL_BINDING_REVIEW.json` contains the exact node/registry inventory, input
hashes, recovered source-file hashes, and derivative-budget checks. It inherits
whole-source authentication from `SCALAR_RECOVERY_RECEIPT.json`; it does not
independently authenticate the gzip stream. The formal free-coordinate check
uses source argument operands and integral scope. Native numerical kernels
remain explicit opaque boundaries.

Replay reads all source nodes directly from the exact JSON export and fails
closed on a missing node. It does not open or depend on a SQLite cache.

The reviewed contract is:

1. `definite_integral` is `[body, binder, left, right]`. The binder must be a
   coordinate and binds only the body. Both endpoints keep the incoming scope,
   even if they contain the same coordinate ID. The conservative capture helper
   includes the binder as a graph child to recover its record; that does not
   turn it into an evaluated scalar operand.
2. A native expression call first differentiates its retained defining body in
   formal parameter order, then applies the complete argument tuple
   simultaneously. Evaluating the raw defining body for a nonzero derivative
   tuple is incorrect. Finite derivative budgets remain explicit failures.
3. Actual arguments keep the caller environment. The callee receives only its
   declared formals. An integral inside the callee must not capture a coordinate
   free in an actual argument. A lookup for an undeclared formal fails rather
   than falling back to the caller or a global numeric value.
4. Evaluated-value caches require the node ID and immutable scope identity.
   A node-only cache is unsafe across integral samples and native calls.

`scoped_bindings.py` implements these rules as symbolic plans. `ScopedRef`
couples a source ID with a lexical frame; `IntegralPlan.integrand_at` creates a
new shadowing frame; expression actuals are closures over the unchanged caller
frame. `ExpressionPlan.zero_order_body()` deliberately refuses every nonzero
derivative tuple. There is no API to smuggle in an unauthenticated derivative
root. A separately source-bound derivative materializer is still required.

The adapter expects an already authenticated node lookup and a registry
definition resolved by the pinned native resolver. It does not authenticate a
caller-supplied registry definition itself. The actual audit verifies each
definition digest against the recovered raw closure's native-call record.
Facade total-order limits must come from the pinned owning header.

Relevant reviewed source locations:

- `actual-continuation-exact-functions.mjs`: lines 97–131 define formal closure,
  free coordinates, finite derivative tuples and derivative-before-substitution;
  lines 291–313 alpha-rename colliding integral binders; lines 362–367 retain
  endpoint Leibniz terms and skip inactive fixed-endpoint evaluations.
- `actual-residual-order-induction-expressions.mjs`: lines 67–80 preserve formal
  bodies while declaring finite per-parameter derivative budgets.
- `source-auxiliary-expressions.mjs`: lines 124–134 give capture-free integral
  substitution; lines 168–202 check budgets and materialize formal derivatives.
- `source-coupled-expressions.mjs`: lines 124–132 give capture-free integral
  substitution; lines 190–234 check budgets and materialize formal derivatives.
- `source-forced-pulse.mjs`: lines 131–139 give capture-free integral
  substitution; lines 184–215 check budgets and materialize formal derivatives.

All five recovered source files are byte-pinned in the report. Their contents
are read for review; their constructors are not executed or modified.

Reproduce from the workspace root:

```sh
python -m unittest discover -s work/prune_recovery/scalar/binder_review -p 'test_*.py' -v
python work/prune_recovery/scalar/binder_review/audit_actual_bindings.py
```

The tests use small synthetic graphs to check scoping mistakes. Their passes
are not original-field numerical evidence. This review does not close scalar
numerical evaluation, final-field evaluation, N706, or N805.
