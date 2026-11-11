# Original first-FiveMap real Y domains

The baseline ledger counts original `actual_natural_series` call nodes whose
real radial argument satisfies `0 ≤ Y ≤ 5`. The pinned prior 33 are the 15
calls with literal `Y=4` and the 18 with `Y=ΛXa·exp(t1)`. The receipt lists
their exact source IDs and SHA-256 `862033a6f22e1a3ad4dddbb993853a113bbeead7e4be867ca1679c68c943b490`.
The earlier `new-source-Y-receipt.json` described 109 additional candidate
call nodes at fixed binders and left the all-path application open.

The new replay proves that every source use of these 109 candidate IDs is
inside the body of an integral with the matching coordinate and fixed real
endpoint hull. It runs across the original 11 physical roots and separately
across each of the 1,745 reached native definition roots. Opening each native
definition without inherited caller context covers every actual substitution
that preserves its lexical binders and its coordinate-free endpoints.

| Original Y input group | New call IDs | Fixed interval |
|---|---:|---|
| `3640, 3647, 3656, 3663, 3672` | 36 | `0 ≤ Y ≤ 4exp(t1)` |
| `3684, 3703` | 18 | `t1 ≤ s ≤ 2t1`, `Y=4exp(s)` |
| `4487, 4492, 4501, 4508, 4516` | 30 | `0 ≤ Y ≤ 4` |
| `6319, 6326, 6334` | 15 | `0 ≤ Y ≤ 4` |
| `28890, 28908, 28955` | 10 | `0 ≤ t ≤ Xa·exp(t1/32)`, `Y=Λt` |

The source-pinned N3 profile has `T=exp(Md)+10>0`, `0<h=exp(-8002T)<1`,
`σ*=h^4/2000∈(0,1)`, `P*=exp(2T)>1` and `K=P*²>1`. Its exact positive
integer factor in `Q=C K/(σ*)²` exceeds 1, hence `Q>1`, `Λ=Q^64>0` and
`Xa=4/Λ>0`. The source `logCSelected=10log(1+Q^300)+Q^200` is greater than
1, so `CSelected>e>2` and `0<t1=CSelected^-120<2^-120`. Consequently the
listed endpoint intervals all have positive length, and each positive exponent
used here is at most `2t1 < 1/64`. For `0≤s<1`, comparing the exponential
power series term by term with the geometric series gives
`exp(s) ≤ 1/(1-s)`. Thus `Y<256/63<41/10<5` for the exponential bounds.

The all-path check traverses exact typed operand edges and the registered
native body/parameter/guard edges. The total membership mask is the OR of
all child masks. A separate mask keeps obligations for free coordinate uses.
An integral clears only the obligation for its matching variable in the body
when the endpoint pair is pinned. Endpoints retain their obligations. An
unknown inner interval seals the corresponding debt so an outer shadowing
binder cannot clear it. All 18 candidate groups have a reached use and zero
remaining debts at every reached root. All 523 natural call IDs are checked
against the independently recorded census hash. The new 109 and prior 33
are disjoint by exact call ID. The control adds a second unbound path to
original natural node `#3641` and retains the original covered path. The
added path keeps an outstanding debt. The unit control also checks that
a free occurrence at an endpoint escapes a matching body binder.

The source producer blobs are pinned to PR30
`a9b3a5b317525f6d0a71e2e356b054c9d25d2e60`. The base expression producer
stores `[body, variable, left, right]`, evaluates the endpoints in the outer
environment, and supplies the integration variable only when evaluating the
body. The exact-functions producer preserves the same scope in substitution,
alpha renames a binder when a replacement would be captured, and uses the
registered formal list in expression-native materialization. Differentiation
of a fixed-endpoint integral keeps the bound coordinate in the integral body.
If a Leibniz endpoint copy is materialized, the coordinate there equals one
of the two already certified endpoint values. The copied typed graph helpers
are the existing source census routines from the archived verification branch.

The result is **142/523 original real Y-range certificates, 381 open**.
The range applies to the source argument at each defined real use. Independent
questions include existence of native solutions, the analytic `eta` domain,
the numerical natural-function values, and the final 67 physical jets.
Those questions do not enter this radial range count.

From the task workspace root, use Node.js:

```powershell
node work/goal-20261111/y/verify_fixed_binder_y.mjs --self-test
node work/goal-20261111/y/verify_fixed_binder_y.mjs work/delivery-20261110/inputs/graph work/delivery-20261110/inputs/producer/source-profile-data.mjs work/goal-20261111/y/fixed-binder-y.json
```
