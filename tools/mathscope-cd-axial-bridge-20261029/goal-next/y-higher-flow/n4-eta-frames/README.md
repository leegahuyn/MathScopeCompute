# N4 eta expression frames and reached indexed rows

Two exact N4 source replays extend the earlier N2 eta analysis to the
conservative ancestry of all **597 literal natural-series** calls and **259
literal even-profile** calls in the original N4 raw-base current/pressure
and selector projection. Every target's stored eta operand is formal #2; all
five actual Picard systems have that same formal. These finite target sets
do not include dynamically generated calls or other, unexported graphs.

`eta_frames_n4.py` builds the complete 534,870-node typed ancestor subgraph,
retaining source-definition edges and every branch. For each reached
`actual_expression_partial` whose definition can reach a target, it maps
definition formals to original actual arguments and checks the eta frame:

| Actual eta argument | Applications |
| --- | ---: |
| Literal -1 | 14,895 |
| Physical inverse eta #4587663 | 24 |
| Unchanged eta #2 or definition without an eta formal | 233 |
| One of 6,330 eta-integral coordinates | 21,568 |
| Other unclassified argument | 0 |

Every integral coordinate has exactly one original binder with literal
endpoints `[-1,1]`. A must-dataflow propagates the relevant fact only into
its integral body, intersects facts across joins, and finds zero failures
across those 21,568 applications. With binder transfer deliberately disabled,
all 21,568 fail. The negative result checks sensitivity of the analysis; it
does not claim invalid source calls. The "unchanged or no formal" category
does not itself prove an external eta input is in range.

`slow_rows_n4.py` separately reconstructs the same ancestor set and reads
all reached source-definition applications of the indexed covariance,
global and auxiliary types: 4, 4 and 39 native call nodes, respectively.
For reached local bodies it checks 243 global and 972 auxiliary **row
entries**, including repetitions, across 11 unique typed definitions. It
does not certify their private runtime seals. In every checked row, with
`D=1/2-h` and `c=Qref/Qlabel>0`, the original arguments satisfy

```text
Znext = Z*c^D,  Tnext = T*c,  q = Qref*s,
outer band guard: -3/4 < -log2(q)-ell < 3/4,
Qlabel = 2^(-ell).
```

Consequently `snext=c*s=q/Qlabel` lies in
`(2^(-3/4),2^(3/4))`, inside `(1/2,2)`. On an admitted reference source image,
substituting the scaled variables into the original inverse equation
`s-Z^2*s^(2h)-T=0` gives zero, and uniqueness of the original bracketed
inverse identifies the scaled root. The original eta is preserved because
`Znext/snext^D=Z/s^D`; nonnegative T is preserved because c is positive.
This argument assumes the recorded outer band guard is selected lazily,
the source row semantics and inverse uniqueness, and that the reference
point actually lies on the admitted image. It does not establish those
premises for arbitrary user input or transport all derivative jets.

Two small **abstract** controls expose indispensable hypotheses. At
`h=1/32,s=1,Z=2,T=-3`, the inverse equation holds with a unique positive
bracketed root but eta=2, so one cannot omit physical `T>=0`. At the valid
reference image `s=1,Z=0,T=1`, an unguarded ratio `c=4` sends `snext` to 4;
with `Qref=1,Qlabel=1/4`, its source band-guard value is -2 and is rejected.
The latter is not asserted to be one of the actual checked rows.

**Scope:** exact structural and algebraic reductions under the source's
binding, lazy evaluation, differentiability and image assumptions. They do
not prove every actual original frame lies on the physical image, every
other typed-native argument map, endpoint derivative semantics, dynamically
generated recursion, convergence, all original Y obligations, or final jets.
No Y/M3/M4 gate is advanced and RELEASE HOLD remains.

Run from the workspace root using Python 3 (three commands):

```text
python work/goal-next/continuation44/y/eta_frames_n4.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-next/y/native_reference_scopes.py work/goal-next/continuation44/y/eta-frames.json
python work/goal-next/continuation44/y/eta_frames_n4.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-next/y/native_reference_scopes.py work/goal-next/continuation44/y/eta-negative.json --negative-no-binders
python work/goal-next/continuation44/y/slow_rows_n4.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-next/y/native_reference_scopes.py work/goal-next/continuation44/y/slow-rows.json
```

No Git mutation or local Lean compilation was made.
