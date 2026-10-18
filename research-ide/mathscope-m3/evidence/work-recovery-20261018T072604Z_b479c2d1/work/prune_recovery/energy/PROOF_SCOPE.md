# N7-06 recovery: actual target binding and interval consumer

This directory is a **new recovery implementation**, not a recovery of the lost
uncommitted bytes. It does not change the retained mathematical family or the
62/64 status. N7-06 and N8-05 remain open; actual last-resolved tau is null.

The recovered executable part binds the original captured (10.4) localization
rows to `ORIGINAL_PROP9_9_FINAL_FIELDS_ON_SAME_COMMON_DOMAIN`. It reruns the
unchanged exact differential-polynomial algebra, including every curl-cutoff
term, complete pressure cutoff, physical derivative `-partial_tau`, viscosity
one, and the direct force. A new exact differentiation step emits the full
Cartesian velocity gradient. Cartesian evaluation includes all physical
components and avoids an incomplete angular-only gradient or an axis division.

The new Fraction interval consumer evaluates velocity, full gradient, direct
force, kinetic density, dissipation density, force work and squared force norm.
Its generic entry point is explicitly **unidentified**. It cannot authenticate a
dictionary of arbitrary jets as the original field. Interval inputs must enclose
the corresponding derivatives throughout a common cell, not merely at centers.
No integration or quadrature enclosure is claimed here.

The actual adapter pins the frozen family SHA256
`b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78`
and retains its initial state, all five recorded correction nodes and all five
recorded exact selector nodes. Its concrete request lists **67 A/b/p derivative
atoms and 13 outer-cutoff derivative atoms**. The direct scalar is the smooth
`b(s,z,tau)` in `B_e_theta=b*(-y,x,0)`; it is not obtained by dividing a sampled
swirl value by zero on the axis. The potential must have the original emitted
gauge, since localization depends on that potential.

The retained final-summation consumer accepts complete actual roots, but does
not identify or compute them automatically. The frozen family explicitly
declares `numerical_field_evaluator=false` and
`numerical_supremum_evaluator=false`. Calling the new actual adapter therefore
raises `MISSING_ACTUAL_JET` and records the exact request. There is no admitted
replacement family, alternate cutoff schedule or forged private source seal.

`ACTUAL_ADAPTER_BLOCKERS.json` names the available original consumers and their
missing inputs. Its **historical** initialized-coefficient frontier records
60,693 present records, 700 then-unavailable scalar body/argument records and
138 then-recorded native-kernel boundaries. All 700 missing records have now
been recovered. The current authenticated coefficient capture has 128,555 raw
records, 589 semantic native calls and 811 nonzero expression-derivative calls;
these are source expressions, not completed numerical evaluations.

`ACTUAL_ENERGY_SOURCE_CONNECTION.json` goes further: it traces the canonical
initial five-potential roots 3614778/3614782, complete initialized pressure
3825009/3615361, initial swirl constituents and original background seeds.
This recovers 142 additional raw records from the independently rechecked full
source. Their dependency cones meet 584 of the current 589 semantic calls and
one additional indexed pressure call, node 3676897 (`fieldDefinitions:9`). Each
of the 67 field-jet requests is linked to its relevant seed-constituent cones.
These connections do not replace the final summed fields by their initial
constituents, nor do raw equation/body references establish native definedness.
The additional pressure call is now attached to the current original-native
recipe adapter in `ADDITIONAL_PRESSURE_INDEXED_RECIPE.json`: all 162 actual
cover rows, guards, local bodies and local derivative requests are retained.
This is an added initialized pressure recipe, with no numerical pressure value
or new final-field claim. The earlier 34-recipe inventory is unchanged.

All 28 saved initialized norm root bindings were checked exactly against that
full source. The retained norm archive supplies same-source initialized norm
recipes; its deferred source-norm composition does not evaluate the frozen
correction-wise exact supremum/minimum functionals. No identification of those
selector values with a different sufficient bound is asserted. Original cutoff
jets remain bound to their own captured localization graph; matching integer
node IDs across different source snapshots is not used as an identification.

The generic energy checker enforces exact initial energy zero and uses

`||u(t)||_2^2 + 2*integral ||grad u||_2^2 <= (integral ||f||_2)^2`.

It distinguishes the force norm integral from the force-squared integral, and
does not treat zero merely lying in a defect interval as proof of the identity.
It takes already enclosed quantities; actual whole-K quadrature, spatial/time
refinements, tails and independent defect decrease still require the missing
actual evaluator and selectors.

The lost normalized cutoff-weight ranges are deliberately not recomputed as
energy. They describe only the cutoff measure. A narrower cutoff-weight
interval cannot discharge the whole-K energy requirement.

## Reproduce from the workspace root

```bash
node work/prune_recovery/energy/code/recover_operator.mjs recovered/base work/prune_recovery/energy/evidence
python work/prune_recovery/energy/code/check_recovery.py recovered/base
python work/prune_recovery/energy/code/connect_recovered_source.py
python work/prune_recovery/energy/code/connect_pressure_recipe.py
```

Observed exits are zero. The first execution checks eight original exact
identities and exposes 82 distinct atoms and 540 polynomial terms. The second
passes 54 checks: independent analytic polynomial controls at six points,
including the axis; interval arithmetic; omitted-data rejection; viscosity-one
and initial-energy guards; binding-mutation rejection; and the source-bound
missing-jet boundary. These
controls are explicitly fixtures and are never reported as actual field values.
