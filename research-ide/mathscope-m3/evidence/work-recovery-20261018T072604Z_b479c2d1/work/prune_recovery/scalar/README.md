# Scalar source recovery after scratch loss

This directory contains a **new recovery implementation**, not the lost code.
The original source producer was not executed. The byte-pinned original gzip and
inherited verifier were recovered separately from Git. The standalone header
was compared byte-for-byte to the first gzip line; the pinned inherited verifier
then authenticated the entire stream and built a disposable SQLite cache.

| Check | Result |
| --- | ---: |
| Authenticated source nodes | 3,892,594 |
| Authenticated raw bytes | 209,857,208 |
| Existing packet records compared directly to source | 92,722 |
| Previously missing records recovered | 700 |
| Missing integral binding coordinates | 134 |
| Missing other operands | 566 |
| Complete raw initialized coefficient closure | 128,555 |
| Old packet records present in that closure | 60,704 |
| Closure records absent from the old packet | 67,851 |
| Additional records beyond the initial 700 holes | 67,151 |
| Raw native calls | 1,602 |
| Raw native definitions without an integer `body` | 572 |
| Targeted recovery negative controls | 9 passed |
| Lexical scoping controls | 10 passed |

The 67,851 count is a **set difference**, not a number to add to 92,722 to
calculate the closure size. The raw closure includes syntactic arguments,
integral coordinate binders, and every integer registry `body`. Its 572
bodyless boundaries are not the complete semantic kernel frontier: implicit
root equations and torus-inverse forcing bodies must not be mistaken for native
return values. The separate native review classifies these semantics.

`RAW_INITIALIZED_SCALAR_CLOSURE.json` retains exact source records and registry
hashes. `RECOVERED_MISSING_700.json` identifies every old hole, its original
requesting edge, recovered source record, and role. The initialized global tuple
remains velocity `[3825006,3825007,3825008]`, pressure `3825009`.

The lexical adapter is a symbolic binding plan. It keeps integral endpoints in
the caller scope, shadows only the integral body, and applies expression formals
simultaneously without capturing actual arguments. It checks all 4,212 integral
records / 876 binders and 1,013 expression calls across 111 definitions. Of those
calls, 202 have zero derivative order and 811 require the original formal
derivative materializer. It refuses to replace a derivative by its raw body.
It supplies neither an integrator nor a numerical native evaluator.

The separate `scalar_independent_review/INDEPENDENT_REVIEW.json` independently
compares all 160,573 distinct baseline/export source records to the authenticated
gzip and reconstructs the same raw closure. It does not trust SQLite.

## Disposable cache diagnostic

After the successful initial recovery, the first persisted cache was observed
to contain zero rows despite retaining a 195,805,184-byte file. Its cause has not
been established. `CACHE_ANOMALY.json` preserves that observation; no current
claim depends on that cache. A new destination was authenticated independently
and reopened both in the diagnostic process and a second process: both found
all 3,892,594 records. `cache_recheck/CACHE_PERSISTENCE_DIAGNOSTIC.json` records
that result. The negative controls use the exact export. Database files are
disposable and excluded from delivery.

## Historical final-state distinction

`HISTORICAL_FINITE_CYCLE_GRAPH_IDENTITY.json` inspects the preserved historical
receipt only. Its four stages recorded exact all-three numerator comparisons,
exit zero, and matching loaded-module/log hashes. No finite cycle or Windows run
was repeated. Those later live execution roots all exceed the original parent
stream's node count and belong to a separate execution. The fresh-five velocity
roots `[4311535,4311537,4311539]` and pressure `4311541` cannot be fetched from the
recovered original parent stream or relabeled as the initialized tuple.

Scalar numerical evaluation, whole-K integration, final-field evaluation, N706,
and N805 remain incomplete. Source record recovery does not establish any of
those mathematical or numerical obligations.

## Replay

From the project root, use a new output directory for each authentication:

```sh
python work/prune_recovery/scalar/code/recover_scalar_closure.py \
  --root recovered/base \
  --source work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz \
  --stage3 work/recovery_git/recovered/tools/n6-domain-transport-20261015/verify_domain_transport.py \
  --out /tmp/mathscope-scalar-recovery-fresh

python work/prune_recovery/scalar/code/test_scalar_recovery.py \
  --root recovered/base \
  --source work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz \
  --stage3 work/recovery_git/recovered/tools/n6-domain-transport-20261015/verify_domain_transport.py \
  --evidence /tmp/mathscope-scalar-recovery-fresh
```

The binding review has its own reproduction commands. Logs record the actual
exit statuses. All new source files and evidence are listed in
`SCALAR_ARTIFACT_MANIFEST.json`; database and Python cache files are excluded.
