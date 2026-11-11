# Original N2 radial frame and substitution source audit

This audit follows the five original local mass, pressure and prefix integrals with bounds `[0,X]`: #120481, #120503, #123572, #123594 and #123638. The original N2 graph and registry are checked by their exact SHA-256 values. A backwards fixed point gives 70,518 structural ancestors. Among reachable actual shared-expression X arguments, 6,036 are syntactically nonnegative, four are `R^2/(2s)` on the valid slow-inverse image, 595 are 167 distinct integral coordinates, and 55 preserve X or have no X formal. The integral-body must-dataflow confirms all 595 relevant calls are dominated by matching binders. When binder transfer is disabled, all 595 fail the negative control.

The 167 variables consist of 160 physical face binders `[0,Xplus]` or `[Xminus,Xplus]`, four stress binders whose endpoints are separately reduced in `../y-n2-domain/face-stress-intervals.json`, two lower binders `[0,Xplus]`, and the prefix binder #123635 in `[0,X]`. The last is self-dependent at the symbolic level. `check_frame_induction.py` verifies that the entire 70,518-node typed semantic ancestor graph of these five integrals is acyclic and that the original nine roots have no free formal X. It also verifies that shared definitions without an X formal have no free X, and checks the actual native entry types. Under the source semantics, valid physical inverse and defined operands, a finite induction over actual frames starts at nonnegative physical X. Each prefix application then carries nonnegative X into `[0,X]`; its bound coordinate #123635 and the rebound X of call #123637 are also nonnegative. The negative control X=-1, binder=-1/2 shows why the premise is essential. This conditional value/frame induction does not prove native derivative behavior.

`check_original_guards.py` verifies exact original commit `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60`, its five source blob hashes, and byte identity with the separate original fixture. It checks that shared expression definitions require all free coordinates among explicit parameters, use fresh temporary arguments for simultaneous substitution, and alpha-rename integral binders on capture risk. It also checks that the band guard appears last in the source row list and both original indexed materializers nest `choose(...,0,body,0)` in that order, making the band guard outermost. `check_original_substitution.mjs` executes a small synthetic swap and capture-avoidance regression using the original hashed implementation; it is not an evaluation or exhaustive proof of the actual source graph.

The companion `../y-n2-eta/check_slow_eta.py` checks 243 global and 972 auxiliary native rows. For every such row, the original outer guard forces candidate s for the scaled chart into `(1/2,2)`; source homogeneity and the original unique-root theorem then identify the candidate with the local inverse, conditional on a valid original reference image and its exact source semantics. `T>=0` and eta are preserved by positive scaling. Fixed-label seam jets, complete native derivative materialization and source initial domain remain separate obligations. This result does not certify all actual Y arguments, any new final jet or release gate.

Set the input locations before running the checkers. In the extracted archive:

- `MATHSCOPE_N2_REACHED` points to `inputs/original-axial-n2/y-reached.json`.
- `MATHSCOPE_N2_REGISTRY` points to `inputs/original-axial-n2/original-n2-current-pressure-graph/original-source-functions.json`.
- `MATHSCOPE_N1_REACHED` points to `inputs/original-y-replay/reached.json`.
- `MATHSCOPE_ORIGINAL_RUNTIME` points to `inputs/original-core-runtime`.
- `MATHSCOPE_SOURCE_REPO` points to a Git checkout containing the pinned original commit.

Then run from this directory:

    python ../y-n2-eta/check_slow_eta.py
    python check_radial_frames.py
    python check_radial_frames.py --negative-no-binders
    python check_original_guards.py
    node check_original_substitution.mjs
    python check_frame_induction.py

The scripts require the exact N2 reached graph and registry, the original Git commit, original fixture source, and the pinned axial replay implementation at the paths shown. No Lean was compiled locally and no main branch was edited.
