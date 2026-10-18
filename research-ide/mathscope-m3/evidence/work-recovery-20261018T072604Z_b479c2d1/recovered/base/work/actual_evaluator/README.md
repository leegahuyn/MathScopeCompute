# Actual numerical continuation: executed partial results

N7-06 and N8-05 remain open. This directory preserves the original source profile and does not alter the frozen mathematical family in `work/remaining_chain`.

Three concrete routes were executed:

1. **Exact angular integration of actual initialized coefficients.** The frontend checks all ten original fixed-label templates, their literal conjugate coefficients and the exact cancellation in `k * partial_theta(phase)`. The resulting nonzero integer frequency is an original piecewise source root, not a materialized enormous integer. It produces 473 expression nodes for the angular mean kinetic energy and the complete cylindrical angular-gradient contribution, including the `R^-2` metric and frame connections. These expressions retain the original coefficient roots. They are local initialized-field integrands, not the final localized field.
2. **Actual original core evaluation with independent twofold refinements.** Eight unchanged source modules recovered from the pinned source ZIP were executed. Seven distinct evaluations used the same original source profile, directed dyadic arithmetic, positive nonlinear comparison error and pressure analytic error. The grid, comparison polynomial degree and precision were independently doubled. The comparison degree is not the actual nonlinear recurrence order. Fourier, axial and pulse refinements are absent, so this is not an N8-05 four-axis table.
3. **Original numeric-backend and resource tests.** The unchanged diagnostic backend was called on the actual `h`, `T` and `lambda` expressions and returned `EXACT_SOURCE_SCALE_NOT_REPRESENTABLE` for each. An exact source-bound inequality separately proves that expanding the original integer carrier requires more than `2^4107` bits. This excludes only the declared ordinary integer-storage route. Symbolic, logarithmic and coefficient-domain evaluation are not declared impossible.

## Reproduce without overwriting archived evidence

Run from the package root:

```bash
python work/actual_evaluator/code/actual_angular_energy.py --root . --output-dir work/actual_evaluator/fresh_evidence
python work/actual_evaluator/code/actual_scale_budget.py --root . --output-dir work/actual_evaluator/fresh_evidence
python work/actual_evaluator/code/actual_picard_term_budget.py --root . --output-dir work/actual_evaluator/fresh_evidence
node work/actual_evaluator/code/run_original_numeric_backend.mjs . work/actual_evaluator/fresh_evidence
node work/actual_evaluator/code/run_actual_core_2x.mjs . work/actual_evaluator/fresh_evidence
```

The scripts read existing recovered inputs. `INPUT_MANIFEST.json` pins the scalar packets and original files; `CORE_SOURCE_MANIFEST.json` pins the eight copied original evaluator modules. Both analytical source-family JSON hashes remain unchanged.

`copy_repro_inputs.py --root . --destination PATH` creates a bounded independent replay tree with the required inputs and copied modules. Timing fields in fresh core execution receipts may differ; exact coefficient/scale evidence should agree.

## What the actual partial numeric table shows

All displayed widths below are approximate displays of exact rational interval widths in `ACTUAL_CORE_REFINEMENT_TABLE.csv`. They refer to common points `Y=2,3`, `X=Y/Lambda`, `eta=0` and the original leading `Phi`, not whole-field errors.

| Independently changed control | Fixed controls | Maximum width before | Maximum width after | Interpretation |
|---|---|---:|---:|---|
| Grid 1 to 2 | degree 32, bits 128 | 8.1683e-24 | 8.1683e-24 | Existing points agree; one new point added. No interpolation bound. |
| Comparison degree 32 to 64 | grid 1, bits 128 | 8.1683e-24 | 1.5136e-8 | Interval widens from rounding amplification. No degree-convergence claim. |
| Arithmetic bits 128 to 256 | grid 1, degree 32 | 8.1683e-24 | 4.3719e-60 | Same actual point enclosures narrow. Other positive errors remain. |

The complete output includes the positive nonlinear Banach displacement, comparison tail and pressure error separately. None is silently set to zero. `ACTUAL_CORE_TWO_FOLD_EXECUTION.json` contains the full original result and exact endpoints.

## Concrete remaining boundaries

The angular coefficient dependency walk did not stop at missing shallow call bodies. It joined 22 recovered packets carrying the same original header SHA, checked every overlapping scalar record for equality, and assembled 92,722 scalar records. Actual coefficient expression expansion reached 60,693 present records, with 700 unavailable scalar body/argument records and 138 non-expression native-kernel call boundaries. The evidence identifies every remaining root and its requesting source edge. These are limits of this recovered executable packet and current numeric backend, not claims that the original mathematical functions are undefined.

An optional read-only collector is supplied for the separately running genuine finite-cycle constructor. It can export up to 100,000 actual initial scalar nodes if that existing run reaches the required stage and has memory headroom. It neither reruns construction nor reconstructs private seals. Its new execution IDs must be rebound before reuse.

The original Picard0 tail condition was also followed after the phase-removal route. Its 74-node constant cone gives exactly `Kcondition = ceil(72*2^139*Q_profile^465*exp(t1/16)/(t1^4*rho^5))`. Here `Q_profile` is the fixed source parameter at node24797, distinct from the shrinking band scale `Q_band=2^-ell` at node622794. The unchanged parameters imply `Q_profile>2^260` and `0<t1,rho<1`, hence `Kcondition>2^121045`. The supported literal series route therefore exceeds a one-million-term budget. This does not prove that the sufficient tail index is optimal, nor exclude accelerated or alternative certified algorithms. Evaluating a positive norm-expression bound does not require summing these terms; evaluating the actual coefficient still needs a separate numerical method.

Even a completed initial coefficient evaluator must still be connected to the actual recursive corrections, a fully evaluated permitted cutoff schedule, potential-before-curl localization and its cross terms, actual force, complete compact-K quadrature, spatial/time errors, active cutoff selection and separate tails. The frozen exact-sup/min selector is a valid mathematical definition; no effective evaluation of that selector is claimed. A different sufficient computable schedule would be a separately identified continuation and would require reapplication of the four analytical clauses.

N7-06 needs actual whole-K energy terms and independently refined spatial/time defects consistent with the paper's viscosity-one estimate. N8-05 needs actual grid/Fourier/coefficient-order/precision twofold comparisons with each other control fixed, plus tail and resolution budgets. Neither follows from the core table, formal Parseval identity or the raw-carrier resource bound. No positive actual terminal time has been resolved here, so `actual_last_resolved_tau` is `null` throughout.
