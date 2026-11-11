# N2 Y domain: source Picard call frames

This is a source-domain reduction, not a full Y-range, Picard convergence, derivative, or release proof. Inputs are the exact N2 reached graph and registry hashes in `ancestry-sign-census.json`; axial-native supplies the original support inequality `0<Xminus<Xplus` and `Xcut<a²`.

`check_moment_frames.py` checks ten n=2/n=3 original local-moment integrals: literal unique binder in `[0,Xcut]`, simultaneous mapping `[X,eta]=[binder,eta]`, and own-system even-profile operands. `X*t` needs the original t-integral interval and all conclusions need the actual eta domain and native semantics. This closes the ten local moment *frame reductions* only.

The fixed-point source-ancestry census records 37 actual system 3/5 even-profile nodes and 7,322 partial-expression applications with altered formal X. It classifies 6,708 arguments as syntactically nonnegative, subject to their operations being defined; four equal `R²/(2s)`, s the original slow inverse with source bracket `[1/2,2]`, on its actual image. The remaining 610 applications pass 182 coordinate variables. For each coordinate, `test_binder_cuts.py` removes all matching integral body edges; every one of these 610 calls becomes unreachable from the nine N2 roots. The single-case negative test confirms reachability before the cut. Structural domination does not establish capture-free semantics.

`check_face_stress_intervals.py` combines the cut records with exact source binder endpoints: 160 physical face binders lie in 32 `[0,Xplus]` and 128 `[Xminus,Xplus]` intervals. Four n2/n3 stress binders have 1,056 intervals, all with left endpoint Xminus; 798 right endpoints are syntactically nonnegative, 256 are face binders, and two are `R²/(2s)` on the original image. `check_nested_face_cuts.py` independently confirms every one of those 256 stress-integral nodes is dominated by the corresponding one of 128 physical face binders. It never assumes interval orientation: nonnegative endpoints suffice for the hull even if their ordering varies.

For the 18 other coordinates, 10 local moments have `[0,Xcut]`, three lower-order flux/pressure have `[0,Xplus]`, and five mass/pressure/prefix integrals have `[0,X]`. The latter require actual enclosing X≥0 at each call. Remaining global obligations include exactly scoped formal/actual and derivative substitution, the original lazy branch guard with nonnegative incoming X, actual inverse image and eta parameter range, plus well-defined source sqrt/inverse and existing local Picard regularity. The census is deliberately conservative, and does not certify all 37 profile calls or 567 natural-series calls; neither M3/M4 nor RELEASE HOLD changes.

## Replay from workspace root

    python check_moment_frames.py --reached <N2-reached> --registry <N2-registry>
    python census_frames.py
    python test_binder_cuts.py
    python check_binder_negative.py
    python summarize_binder_cuts.py
    python check_nested_face_cuts.py
    python check_face_stress_intervals.py

The two cut sweeps take minutes on a typical machine. Source paths are referenced from the existing scratch workspace; `reached.json`, graph registry, `native_reference_scopes.py`, and `axial-native/native-domains.json` must be retained. No Lean compilation or main-branch change was made.

Set the environment values MATHSCOPE_N2_REACHED to inputs/original-axial-n2/y-reached.json, MATHSCOPE_N2_REGISTRY to the original N2 original-source-functions.json, and MATHSCOPE_N1_REACHED to inputs/original-y-replay/reached.json before the corresponding replays.
