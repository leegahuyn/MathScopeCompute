# Actual submitted theorem types: frozen parser failure review

This is a read-only diagnosis of the actual production packet. It does not override either failed audit, issue a new completion assessment, or alter the original source, producer, frozen auditors, or mathematical evidence.

## Actual result retained

Run **38014602021**, job **114101981614**, production commit `55dacb898f8c204bf0c5925ea901d75d6c2d0f46`, archive SHA-256 `1bc9b8134308ee9d8205c3273b96558ccb4efc456d0054da3ea033879c70d9b8`.

The unchanged independent reviewer actually returned exit **1**, `FAIL_OR_INCOMPLETE`, `N106Completed=false`, **347/350**. Its three failures are the two submitted-type recognition predicates and the requirement that the separate primary audit passed. The primary audit actually returned **233/234**, failing only “both submitted theorem types actually printed.” Both actual results remain preserved.

## Why the recognizer fails

At line 418, the frozen independent reviewer searches for each escaped theorem name immediately followed by `\s*:`. The actual submitted audit log prints `(nu : ℝ) (hnu : nu > 0)` between that name and the declaration colon. Consequently this pattern rejects both present, complete type outputs. The primary recognizer has the same limitation. This is an observed mismatch between the parser and these actual bytes, not evidence that the type output is absent.

## Original signatures and actual output

The source signatures before `:= by` in `ComparatorChallenges/NavierStokes.lean` and `NavierStokes/ComparatorSolution.lean` are textually identical for each declaration. Their SHA-256 values match both actual archived 2,669-file source hash manifests. The challenge file contains the reference placeholders; the submitted file instead invokes the original proof adapters. Reading a reference placeholder is not treating it as a submitted proof.

| Original option | Submitted declaration | Actual binders | Proposition after the binders |
| --- | --- | --- | --- |
| C | `NavierStokes.Comparator.navier_stokes_breakdown_R3` | `(nu : ℝ) (hnu : nu > 0)` | Existential initial data and forcing, `InitialVelocityConditionDecay`, `ForceConditionDecay`, and the negated existence of `NavierStokesExistenceAndSmoothnessRn nu u₀ f v p`. |
| D | `NavierStokes.Comparator.navier_stokes_breakdown_periodic` | `(nu : ℝ) (hnu : nu > 0)` | Existential initial data and forcing, `InitialVelocityConditionPeriodic`, `ForceConditionPeriodic`, and the negated existence of `NavierStokesExistenceAndSmoothnessPeriodic nu u₀ f v p`. |

Lean's actual output qualifies these predicates with `NavierStokes.Comparator`, omits the inferable existential binder types from its display, and formats the parenthesized negation as `¬∃`. These are consistent with the source signatures. Both associated actual axiom rows contain exactly `propext`, `Classical.choice`, and `Quot.sound`. The complete actual output is copied without alteration to `type-review-inputs/submitted-type-and-axiom-audit.log`.

The same actual packet also has the original protected Comparator stage exit 0, the nanoda acceptance marker followed by the Lean default-kernel acceptance marker and final `Your solution is okay!`, and pre-cleanup exit 0/EOF without timeout. Those are already successful predicates in the unchanged independent audit. This memo does not substitute a textual comparison for the original Comparator's declaration/kernel checks.

## Narrow next-chat repair to review

Retain these failed receipts and implement a new, append-only auditor version that recognizes the complete known declaration header including its binders, then validates the expected proposition block up to its corresponding axiom record. Keep exact names, parameter/positivity binders, C/D predicates, and separate exact axiom checks. A bare-name match would weaken the criterion and is not the suggested repair. Re-evaluate the same actual frozen archive and raw log with the corrected versions; issue no 70/0 assessment until both actual audits and the existing PASS-only assessment writer succeed.

No repair or new completion decision was made in this review.
