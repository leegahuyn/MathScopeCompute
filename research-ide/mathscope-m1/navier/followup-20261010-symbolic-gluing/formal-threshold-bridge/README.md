# Original-kernel threshold and sharp-error bridge

The accepted original Lean 4.34.0-rc2 execution is
[`attempts/0004/receipt.json`](attempts/0004/receipt.json), completed at
**2026-10-09 23:28:04 UTC** with exit code zero. All six requested
declarations were printed and use only `propext`, `Classical.choice`
and `Quot.sound`. The 2,669 original tracked files and original kernel
were unchanged. This is an actual check on the pinned original source
commit `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`.

## What this proves

`ThresholdBridge.lean` imports the original `AxisContraction` module.
It unfolds the actual `controlledRemainder`, `remainderBound` and
`remainderLip`, propagates norms through every term, and proves that
the resulting bounds are below the two polynomials used in the new
same-datum certificate:

```
B(Q) = 2Q^5 + 3Q^6 + 3Q^7 + 11Q^8 + 8Q^9 + 2Q^10 + 29Q^11
L(Q) = 2Q^4 + 3Q^5 + 4Q^6 + 17Q^7 + 14Q^8 + 4Q^9 + 58Q^10
```

For `Q>=1`, the source proves `B(Q)<=58Q^11` and `L(Q)<=102Q^10`.
For `Q>=2^260` it obtains the original threshold inequality
`1+B(Q)+L(Q)<=Q^64`. Its sharp error theorem retains
`B(Q)/(2Q^64)<=29/Q^53`, rather than replacing that bound by a looser
one unsuitable for the later derivative estimates.

`exists_unique_fixedPoint_at_Q64` then applies the **original**
`exists_unique_natural_fixedPoint` theorem. It returns the fixed point,
its unit-ball membership, the exact original nonlinear fixed-point
equation, the sharp error, and uniqueness in that ball. The nonlinear
remainder and its estimates are not represented by arbitrary asserted
bound fields.

## The explicit inputs still required

`InputNormBounds` lists 28 real inequalities: the norms of the 13
original bounded operators, the resolvent, the ten fixed coefficient
elements, the reference-ball radius, and the three scalar magnitudes.
Each operator/coefficient/radius bound must be at most the **same Q**;
`abs(A), abs(D), abs(h)` must be at most one. The amplitude norm must
be at most two. These inequalities remain premises of this reusable
bridge until the actual same-datum producer supplies them.

Consequently this file is useful formal progress toward N3-03, but its
successful execution alone does not instantiate the new pressure-dependent
AxisData, prove every original analytic premise, or identify every
numerical jet with the resulting fixed point. The accepted receipt keeps
`fullOriginalN303Completion:false`.

## History and reproduction

The source and complete output of every attempt are preserved. Attempt
0001 checked the initial coefficient norm lemmas. Attempt 0002 records
unclosed associativity goals and a tactic heartbeat timeout; attempt
0003 records remaining tactic issues. Their failed status and printed
`sorryAx` from Lean's error recovery are not accepted theorem evidence.
Attempt 0004 is the complete successful bridge. Its remaining output
messages are unused-tactic lint warnings, not errors.

`run_check.py` appends a new numbered attempt in the documented original
runtime. It never edits the upstream proof, lockfile or kernel. Runtime
locations are intentionally recorded exactly; the complete external
toolchain/cache is not bundled in this source release.

The portable audit can be run without that external runtime:

```sh
python3 -B research-ide/mathscope-m1/navier/followup-20261010-symbolic-gluing/formal-threshold-bridge/verify_receipt.py
```

It verifies the preserved successful receipt, theorem/axiom output,
source snapshot, original-source inventory equality and kernel records.
It also rejects the two failed expanded-bridge attempts. This audit is
explicitly a check of recorded evidence, not a fresh kernel execution.
