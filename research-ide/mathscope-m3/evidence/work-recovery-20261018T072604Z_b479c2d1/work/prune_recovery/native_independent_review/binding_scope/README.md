# Independent native binding and scope review

The frozen source bindings and finite symbolic indexed recipes pass this
independent review. No native numerical implementation or source producer was
executed, and existing tests were not repeated.

| Reviewed object | Result |
| --- | ---: |
| Native calls accounted for | 1,602 |
| Expression calls | 1,013 |
| Nonzero expression derivative requests | 811 |
| Semantic native calls | 589 |
| Indexed recipes | 34 |
| Retained indexed rows | 5,184 |
| Symbolic derivative terms compared | 6,804 |
| Raw source-parameter records compared with original gzip | 41 |
| Exact parameter ASTs compared with surviving source profile | 63 |

`FROZEN_BINDINGS_REVIEW.json` independently checks the native classification,
all actual call arities and derivative-order tuples, original formal and
direction parameter mappings, source definition hashes, and every indexed row's
local body, argument tuple, coefficient, label and guards. Its derivative check
uses closed multinomial coefficients for each directional map, then compares
the exact resulting source-node monomials and integer multiplicities. It does
not call the author's derivative-recipe implementation.

`MATRIX_PARAMETER_NORMALIZATION_REVIEW.json` separately checks the parameter
ASTs against the surviving source-profile literal and the 41 parameter nodes
against the original gzip stream. The transitive parameter closure contains 43
declared names and has no cycles. Both covariance registries retain their
original matrix, initial datum, parameters, time variable, length and norm
convention. Both auxiliary inverse registries retain the original irrational
direction, Haar-mean projection, and finite-sum-versus-limit distinction.

The 589 semantic calls comprise 490 natural, 31 Picard, 13 quadratic, 14
monotone, 4 covariance, 34 indexed and 3 auxiliary inverse calls. The 14
monotone defining bodies are implicit residuals; the 3 inverse bodies are
forcing terms. None can be evaluated as a direct replacement for its native
solution. The remaining 572 have no direct evaluation body.

The exact raw scalar export by itself lacks 411 of the 425 distinct indexed
body/formal/argument/coefficient/guard roots. The native author's direct-operand
supplement recovers those 411 roots and 18 additional caller/map roots.
`DIRECT_SUPPLEMENT_REVIEW.json` independently compares all 429 new records
with the original gzip after authenticating its complete compressed bytes and
exact header. The supplement covers all 453 requested direct roots; 418
immediate child dependencies remain outside the available records. This is
direct-record recovery, not recursive closure or evaluation. This review does
not re-prove matrix bounds, active guard domains, coefficient constancy,
chart-map validity, flat joins or numerical kernel/tail values; inherited
source conclusions retain their original scope.

The review reported two generic API guard gaps to the native author: outer
registry namespace/negative-index acceptance, and missing total indexed
derivative budget checks. The author added strict namespace/index validation
and total-order guards. The frozen source calls already met their source
budgets, so the reported gaps did not invalidate the reviewed frozen data.
The matrix/parameter report lists remaining generic validation limitations
separately from frozen-source violations; none was found in the frozen data.

Replay the independent frozen-data review from the workspace root:

```sh
python work/prune_recovery/native_independent_review/binding_scope/review_frozen_bindings.py
python work/prune_recovery/native_independent_review/binding_scope/review_direct_supplement.py --source work/recovery_git/recovered/runtime/source/original-parent.ndjson.gz
```

Every report identifies its exact input/source hashes and scope. This review
does not independently prove the source's analytic premises, compute field or
energy values, or close N706 or N805.
