# Original N4 coefficient recursion: actual lower Picard calls

The Python audit opens the pinned N4 reachable projection and registry, the original source profile and the full uncompressed 7,358,162-node N4 source stream. It hashes the entire original stream, counts its nodes and directly authenticates `#24806=sqrt(#24805)`. The reached projection and exact typed operand helper are also hash-pinned. No floating-point arithmetic or source/runtime substitution is used.

For each actual Picard system, the checker traverses every original A0, A1 and forcing root by its ordinary AST children. It finds no other hidden native definition edge in those coefficient closures: the reached native sites in this scope are all the directly identified lower actual even-profile calls. The first actual order has no lower call. In higher orders the exact call counts are:

| Original actual order | Actual system | Direct lower calls | Calls using a bound unit-interval factor | Lower orders |
| --- | ---: | ---: | ---: | --- |
| 1 | 0, original bootstrap | 0 | 0 | none |
| 2 | 3 | 19 | 7 | 1 |
| 3 | 5 | 37 | 16 | 1–2 |
| 4 | 7 | 48 | 21 | 1–3 |
| 5 | 9 | 59 | 26 | 1–4 |

All 163 call nodes and their original radial arguments are listed in `lower-calls.json`. Each argument is the enclosing system's `xi^2` or `t*xi^2`, and each actual eta operand is the common formal #2. For every group, remove the branches of the original smooth cutoff which can select that exact lower profile: then none of the group's targets is reachable from its original coefficient roots. For each of the 70 `t*xi^2` calls, removing bodies of the corresponding original `integral(...,t,0,1)` likewise makes all target calls unreachable. Before each cut, the listed calls are reachable; the controls do not rely on missing or fabricated calls.

The exact pinned geometry is `Xkeep=Xa*exp(t1/64) < Xcut=Xa*exp(t1/32) < a^2=Xa*exp(t1/16)`, for positive Xa and t1. All five actual Picard systems use formal eta #2 and the same radial domain `[0,sqrt(a^2)]`; the order-one system is separately recognized by its original bootstrap name, because it has no `kind` field. Therefore, **if** an actual outer system receives `0<=xi<=a` and its admitted eta, the matching lazy cutoff and literal `t in [0,1]` give each directly reached lower actual even-profile call `0<=X<=Xcut<a^2` and the unchanged eta. Its lower Picard value has `sqrt(X)` in the lower original radial domain. The strictly decreasing source orders permit this conditional value/frame transport through these five finite actual systems.

This establishes a concrete source-bounded recursive ingress subset, not the whole all-order result. It assumes the original real branch and expression/substitution semantics, valid original profile and outer caller inputs. It does not certify the auxiliary systems, all runtime-generated derivative ASTs, initial physical source chart, complex-eta Picard convergence, arbitrary n, entire Y range, cutoff seam jets or final 67 jets. RELEASE HOLD remains unchanged.

Replay from this directory using the pinned reached projection, registry,
source profile and original graph export:

    python -B audit_lower_calls.py N4_REACHED_JSON REGISTRY_JSON PROFILE_MJS GRAPH_JSONL_GZ /tmp/n4-lower-calls.json

The helper is `../../y/native_reference_scopes.py` with SHA-256 `37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758`. The full N4 source stream SHA-256 is `ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd`. The original graph and registry come from GitHub run 43055678022.

## Remaining original reached Picard caller sites

`audit_top_calls.py` independently scans the N4 reached projection from its 14 original roots. The projection contains exactly 259 actual even-profile literal nodes. The 163 coefficient-recursion sites above and the remaining 96 sites are disjoint and exhaustive for those original reached nodes. The latter occur in original actual systems 0, 3, 5, 7 and 9 with counts 42, 18, 18, 14 and 4 respectively. All their eta operands are formal #2.

For the 96 sites, the checker follows 2,388,184 ordinary and typed-native graph edges in descending original node order with a must-dataflow analysis. It proves that every graph path to each site crosses a matching original lazy cutoff arm and, when the input uses an integration variable, the original matching integral body with its required endpoints:

| Input form | Calls | Necessary binder |
| --- | ---: | --- |
| X | 42 | none |
| X*t | 36 | t in [0,1] |
| direct bootstrap binder | 14 | binder in [0,Xcut] |
| direct bootstrap prefix | 4 | binder in [0,X] |

The original leading average calls #29331 and #29342 are important: their `X*t` operand is not guarded on that exact product. Their actual proof is the original outer X guard together with the separately bound unit-interval t. A matching-product-only check would incorrectly flag them.

A stronger sensitivity run discards all guard and binder proof state whenever any typed native-definition edge is entered; all 96 still pass. Disabling all guard propagation makes all 96 fail, and disabling binder propagation makes the 54 binder-dependent sites fail, while the 42 direct-X sites pass. These tests check the structural analysis and do not claim that any actual source call fails its domain.

Given nonnegative X in each actual enclosing formal frame, a valid common eta and original lazy/capture-free semantics, the upper source guards plus these binder intervals place the 96 literal inputs in `[0,Xcut]`, hence in their original Picard domain. In particular, the four `[0,X]` prefixes require the nonnegative X assumption: the interval's orientation by itself cannot supply it. Combined with the 163 conditional lower-source sites, all 259 original reached even-profile literal nodes have this structural ingress reduction. This is not a proof that all actual chart frames satisfy the input assumptions, nor a classification of dynamically materialized nodes, arbitrary source orders, limit/derivative convergence, seam jets or final Y status.

Run after producing `/tmp/n4-lower-calls.json`:

    python -B audit_top_calls.py N4_REACHED_JSON /tmp/n4-lower-calls.json /tmp/n4-top-calls.json
    python -B audit_top_calls.py N4_REACHED_JSON /tmp/n4-lower-calls.json /tmp/n4-top-reset-native.json --reset-native
    python -B audit_top_calls.py N4_REACHED_JSON /tmp/n4-lower-calls.json /tmp/n4-top-no-guards.json --drop-guards
    python -B audit_top_calls.py N4_REACHED_JSON /tmp/n4-lower-calls.json /tmp/n4-top-no-binders.json --drop-binders
