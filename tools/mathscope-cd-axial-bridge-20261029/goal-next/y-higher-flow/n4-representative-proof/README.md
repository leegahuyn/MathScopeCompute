# C50 independent ORIGINAL representative geometry and radial ingress

The prior outer-image binding left the ORIGINAL active-box geometry as an
explicit premise. `ACTIVE_BOX_PROOF.md` now supplies an independent complete
ordinary real-analysis proof for the actual interval/sign/root/midpoint
construction. It covers `T=0`, `Z=0`, strict radius positivity, the empty-box
extension, and the original zero-width sign tie.

The entire geometry theorem has NOT been compiled in Lean by this packet.
Existing compiled chart/inverse/scaling lemmas do not erase that distinction.
The exact source slice and replay supply concrete finite source evidence.

## Results

* 24/24 original radius-only native calls: all-path lexical binder domination.
* Four fresh radial coordinates; nine original integral nodes; 120 ancestors.
* 5,987 native/local formal lists checked: no fresh coordinate is rebound.
* Every original lower limit is `sqrt(Xa)`. Upper limits are `2*sqrt(Xb)`
  or the current physical radius. Thus all binder intervals are positive
  under the admitted original radius, irrespective of integral orientation.
* Negative control removes binder edges: all 24 membership facts disappear.
* 219-node original slice: import and execute original pure geometry using
  its actual source arithmetic methods. All six selected live root IDs match
  exactly. Original inverse definition 2 residual body #4587653 also matches.
* Actual native substitution at negative width 0 selects #4588837, the positive
  midpoint. A wrong negative tie can select an excluded boundary, as the proof
  gives by a minimal rational interval countermodel.
* Only two operations computing unused positiveWidth metadata need new scratch
  IDs; they are beyond the entire original graph and affect no live root.

## Live premise remaining after the 24 binder maps

The original top-level physical input must still be admitted in its chart:
`R>=0`, `s>0`, `T>=0`, `0<h<1/16`, source parameter positivity and the actual
inverse/image equations. On an active shell `Xa<X=R^2/(2s)` and `Xa>0` force
`R>0`. The outer row scale factors are positive, so they preserve that sign.
The 24 integral replacements inherit nonnegative (indeed positive) radius
from their ORIGINAL bounds; their native formals preserve Z,T and fixed labels.
The other previously audited representative/row substitutions do not create an
additional independent radius premise. Use finite nesting of those original
native calls, not an unrestricted recursive assumption.

Given the admitted active live point in a row, the selected representative's
inverse existence and image membership follow from the independent proof here;
they need not be assumed as separate real-analysis propositions. Their full
Lean formalization and the foundational native-real/integral semantics remain
explicit formal obligations. General recursive n, #117047 integral equality,
endpoint derivative commutation and actual field values remain outside scope.
No milestone or release counter changes.

## Reproduction

Run the scripts from this directory. Use Python 3 with `-B`. Supply
`REACHED` from `work/goal-next/y-n4/reached.json`, `REGISTRY` from the
original N4 GitHub 43055678022 graph (the `original-source-functions.json`
in the `original-whole-k-current-pressure-graph` artifact), and `HELPER`
from `work/goal-next/y/native_reference_scopes.py`. `RUNTIME` is the
`research-ide` directory inside the previously archived original runtime
`work/goal-next/continuation30/forced-probe/runtime`.

```
python -B check_radial_ingress.py REACHED REGISTRY HELPER ../n4-outer-image/outer-images.json ../n4-residual-frame/gateway-closure.json OUT.json SLICE.json

python -B check_radial_ingress.py REACHED REGISTRY HELPER ../n4-outer-image/outer-images.json ../n4-residual-frame/gateway-closure.json NEGATIVE.json CONTROL_SLICE.json --drop-binders

node replay_representative.mjs SLICE.json RUNTIME REPLAY.json
```

The exact source and prerequisite SHA-256 pins are enforced in the Python and
Node scripts. The archived repository reports and working reports have
identical consumed inputs (the radial-only frame list and the three gateway
lists). Replaying with the archived repository reports reproduces the same
deterministic outputs.

Include README, ACTIVE_BOX_PROOF, both scripts, radial-ingress.json,
radial-no-binders.json, representative-slice.json, representative-replay.json,
and checks.log. Exclude repeat/control-slice scratch duplicates.

VERIFIED: the specified finite source formula/scope checks. CONDITIONAL:
ordinary real-analysis proof under admitted original physical input, and
full Lean formalization still open. RELEASE HOLD.
