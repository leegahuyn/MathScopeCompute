# C82: original Signed fast guard seams

**VERIFIED:** the lazily guarded original Signed potential has an open zero neighborhood at all four fast guard faces, for all ten fixed `(difference, sign)` cases in completed GitHub run `44582875351`. Its potential jets through order 3 and velocity jets through order 2 therefore have zero traces there. This is a source-bound symbolic result, not a numerical evaluation of the Signed quotient.

**CONDITIONAL:** four slow partition factors are verified with exact common power 1 in every Signed native body. Their flatness alone does not establish the Signed quotient's slow-face jet bounds. **OPEN:** generic positive radial shell faces and cross-label / periodic nearest-copy glue. The release remains **HOLD**; the original 67-jet graph and shared checkout are unchanged.

## Actual source comparison

The authenticated native registry defines six `GenericSignedAfterForced_{sign}_{component}` functions, IDs `1278`–`1283`, with bodies `22001304`, `22001305`, `22001306`, `22001468`, `22001469`, `22001470`. Exact sparse rational expansion gives 120, 408, 232 terms for each sign. Every term contains precisely one copy of each of these common factors:

| Source factor | Actual node |
| --- | ---: |
| transverse cutoff chi | 17733045 |
| lower pulse step | 17733053 |
| upper pulse step | 17733056 |
| slow band factor | 17735193 |
| slow R factor | 17735228 |
| slow Z factor | 17735263 |
| slow T factor | 17735298 |

Removing the seven factors and multiplying them back reproduces each native body exactly. Native analytic calls, integrals, square roots and other analytic atoms remain symbolic. A false `sourceAuthenticated` metadata flag is preserved in the receipt: byte-authenticated graph comparison does not manufacture an upstream authenticator seal.

The actual cutoff constructor is

`chi = choose(abs(xi/r0), 1/4, 3/4, 1, step(3/2 - 2 abs(xi/r0)), 0)`

`psi = step(20 v/Ls - 4) * step(16 - 20 v/Ls)`.

The exact source step operation is zero on negative arguments, and its exterior derivative branches are zero. Hence chi is zero when `abs(xi) >= 3r0/4`; psi is zero for `v <= Ls/5` or `v >= 4Ls/5`. Here actual `r0 = 2^-34 > 0`; `Ls > 0` is the original fixed admitted band scale.

For each face `xi = +/-r0`, a neighborhood of radius `r0/8` has `abs(xi) > 7r0/8 > 3r0/4`. For each pulse face `v = 0,Ls`, a neighborhood of radius `Ls/10` lies either outside its lazy guard or inside the displayed zero collar. Thus the **guarded** potential is jointly identically zero near each face, including its intersections with other guard faces. This yields every finite mixed derivative of zero there; the receipt records the requested pure normal native queries through order 3 explicitly. There are 40 case/face instances and 480 component/order/face trace claims. Existing native jet root IDs are checked. Unmaterialized semantic derivative queries have `existingMaterializedRoot: null`, not invented IDs.

The original Signed real potential is `-C*sin(k*phase)`, established on the same actual source by C80's frozen receipt. Phase multiplication and the fixed continuous reference lift preserve this zero neighborhood. The C80 literal cylindrical curl, including `epsilon*dZ`, `radialFast*dxi` and the `Ctheta/R` connection, gives velocity jets through order 2. This does not differentiate a selected integer label and does not supply glue between different labels or nearest periodic copies.

## Domain and remaining obligations

The raw unguarded Signed quotient is only interpreted where all source lazy guards admit it and the original chart, positive amplitudes, inverse H, and `k*nSquared` are defined. Exterior guards return zero before evaluating an invalid chart or radial quotient. At an intersection, a rejected guard gives zero; on the admitted side a fast factor is exactly zero with a defined quotient. No value is assigned to `0 * undefined`.

The actual inverse contains `H^-1*(Sigma/epsilon)/(2*a_j)`, where `a_j` is the original positive target square root. Its denominators contain no pointwise inverse chi or psi; their positive central-mass integrals enter H. These source-constructor observations are included as context. Actual common-factor equality is independently checked against the authenticated native bodies.

At slow band/R/Z/T faces `offset = +/-3/4`, the common slow factor is flat but there is no comparable open interior zero collar. A same-source C3 or sufficient finite-pole bound for the remaining Signed quotient is still needed. At radial shell faces the required weighted Sigma/target-square-root transfer is separate. The elementary control `Sigma=exp(-1/(4*d^2))`, `a=exp(-1/(2*d^2))` has two flat functions but a diverging ratio. It only rejects the inference “flat numerator implies flat quotient”; it is not a counterexample to the original source.

## Replay

Use Python 3 with assertions enabled. No local Lean is used.

```powershell
python -B .\verify_signed_seams.py --goal <checkout>\tools\mathscope-cd-axial-bridge-20261029\goal-next --work <work>\goal-next --out .\signed-seams.json
```

`--goal` supplies the digest-pinned original source reader, exact algebra, and Git-object reader. `--work` supplies frozen C80 receipts/cache plus the C70 hosted source export. `source-context/` contains the two byte-pinned generated overlay constructors, so replay does not depend on an unbundled continuation30 runtime. The script reads original band/current/interpreter modules from Git object `059df9db3a188ce18f3c43a0dca3a92f2e02a4b2`, the actual hosted export's executing commit. It reauthenticates all 22,155,584 source records using the retained read-only C80 cache, including its full source SHA and offsets hash. It checks C80 input digests and all ten actual guard/native-argument bindings. Run with `-O` aborts deliberately.

The four fast-face class closures are the new result. Existing C80/C81 open-chart curl and outer-lift joins are frozen prerequisites; this packet makes no new whole-field, stage-cap, energy, final 67-jet, or release claim.
