# Independent energy recovery review

Decision: **PASS for the stated recovery scope.** Reviewed final energy manifest
`da7fced4f849d8fcd31015826558077bbccec888e964d0d4a369403d362a3269`:
25 payload files, 974,514 bytes. N7-06 and N8-05 remain OPEN, M3 remains 62/64,
and actual last-resolved tau remains null.

The independent Python polynomial implementation reconstructed
`u=curl(C*A)+C*b*(-y,x,0)`, all nine Cartesian gradient components, complete
pressure `C*p`, and
`f=-partial_tau(u)-Delta(u)+(u dot grad)u+grad(C*p)`.
All 540 emitted terms and 82 atoms agree exactly. Captured original operator
rows and source pins also agree. The review detects omitted curl-cutoff terms,
the wrong physical-time sign, and omitted pressure cutoff. The Cartesian
representation introduces no division by radius at the axis. This exact
algebra assumes the stated smooth source jets; it supplies no actual jet values.

The 142 additional source records were compared directly against the pinned
original gzip, independently of SQLite. All four constituent cones were
reconstructed. They meet 584 of the current 589 semantic native calls and add
the original indexed pressure call 3676897. The psi/compactPsi names are bound
to `$.source.actualRoots.potential` of the original norm archive
`d98a245f1fc563ba44c48d21c59a43d6787fc3895d922472bb3f3ab6e04d9a6d`
and to the frozen family. Its 28 selected scalar bindings agree with source.
The extra pressure recipe preserves all 162 original rows, guards, labels,
local bodies, zero-order requests, and the other complete-pressure child3677236.
These are initialized constituents, not identified final summed field values.

The generic energy checker requires exactly zero initial energy and uses the
square of the integral of the force norm. It does not replace that quantity by
the force-squared integral, or promote zero inclusion in a defect interval to
an identity proof. The original localization source records a positive initial
zero interval because its temporal cutoff and all derivatives vanish there.
Actual whole-K quadrature and independent spatial/time refinement are absent.

Three review findings were corrected before this final decision:

1. Historical missing700/bodyless138 is now explicitly separated from the
   current missing0/raw128555/semantic589/nonzero-expression-derivative811.
2. The actual adapter now pins the canonical operator binding, copies caller
   input, and checks integrity again before emitting requests. Independent
   mutations of atoms, polynomials, source pins, and post-construction state
   all fail closed; mutating the original caller dictionary cannot alter it.
3. Named potential and pressure roots now have original metadata assertions,
   in addition to raw source-record authentication.

The actual adapter still raises `MISSING_ACTUAL_JET`, requesting 67 field jets
and 13 cutoff jets. Generic polynomial fixtures are not actual field evidence.
Initial1260/1260 obligations and final M3 62/64 are distinct scoped inventories.
No source producer, native numeric evaluator, or SQLite cache was executed or
opened by this independent review.

Run from the extracted workspace root, using Python 3.12 and its standard library:

```sh
python work/prune_recovery/energy_independent_review/code/check_energy_algebra.py
python work/prune_recovery/energy_independent_review/code/check_energy_boundary.py
python work/prune_recovery/energy_independent_review/code/check_final_freeze.py
```

The boundary checker also reads the frozen independent scalar edge-rule checker
at `work/prune_recovery/scalar_independent_review/code/review_recovery.py` and
its `INDEPENDENT_REVIEW.json`. The original files remain under `recovered/base`;
the gzip is under `work/recovery_git/recovered/runtime/source`.

Results: `ALGEBRA_REVIEW.json`, `BOUNDARY_REVIEW.json`, and
`FINAL_FREEZE_REVIEW.json`. All three saved runs have exit0 and empty stderr in
`logs`. The algebra report records the pre-correction code snapshot while
testing the unchanged operator binding; the boundary and final-freeze reports
pin the final corrected backend and entire final payload.
