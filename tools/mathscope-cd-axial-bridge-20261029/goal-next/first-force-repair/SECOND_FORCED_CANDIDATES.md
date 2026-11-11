# Actual second Forced inverse candidates

The [GitHub run](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43015175416)
completed at 13:33:07 UTC on the pinned source commit
`e98705903ac6a47b309b63dd02c4ed15024d6b3e`. It materialized 40 native
positive-mode systems and the original-operator candidate graph with
4,682,006 nodes. The first 4,456,994 node records and the corresponding
native definitions exactly match the independently verified corrected
first-cycle export.

The independent checker reads the corrected conservative residual
anchors, source and subtraction ledgers, 1,680 zero-branch guard
occurrences, and all 240 real and imaginary forcing components. It
checks the actual formal arguments of the source facade and the
same-label path substitution, zero initial data, normal projection,
and the difference in diagonal damping for each mode. The
supplementary checker rederives the mapped cutoff pressure
\[
 \psi\frac{i[(nK-n')t+n\cdot f]}{km|n|^2}
\]
with the original operands. Omitting \(n\cdot f\) fails in all 80
pressure components. The same checker matches the 30 actual Signed
principal tail components to the original mapped cutoff derivative,
half-amplitude, source weight, and chart factors.

The all-mode raw support check substitutes zero for 1,760 exact
own-label wave-jet descriptors while retaining the entire mean and
the geometric operands. All 240 raw component slots reduce to literal
zero. Modes 1 and 2 reach velocity derivatives of order at most two
and pressure derivatives of order at most one. Their subtracted
flat addends have separate support obligations.

For modes 3 and 4, every raw monomial in the 20 positive-mode rows
is quadratic in own-label velocity, with modes \((1,2)\) or \((2,2)\),
respectively, and total derivative order at most one. Neither mean
nor pressure factors appear in these expanded monomials. The
raw and pre-guard supported rows coincide for these two modes.
The vanishing of the wave jets on the original support boundaries
is an analytic premise of the guard-removal implication.

The live stencil replay rechecks eight fields with the same 162
signed labels, their 810 outer guards, the 13,041 geometric row
pairs, and all 15 switch masks for four nearest-integer coordinates.
At a tie an exiting or entering row has one normalized distance
strictly greater than \(3/4\) in a neighborhood. The common fixed
labels use the same guards and derivative maps. At most one enlarged
torus rectangle reaches a point, so an inactive factor of any
cross-row product is identically zero near that point. The
ordinary derivatives of the possible active row still need their
source-specific bounds and joins.

The live [low-mode replay](LOW_FORCED_COLLARS.md) independently
reads the two first-Forced terms in 240 component slots. On the
admitted pulse and transverse collars, the original source
cutoffs prove their vanishing. The support of \((1-\psi)g\)
uses \(g=0\) on the exterior pulse collars. The right-collar ODE
state may retain memory and the derivative term vanishes there
because its factor \(\psi'\) is zero.

The [fixed-row raw projection](RAW_FIXED_ROW_PROJECTION.md)
independently matches the actual wave-dependent reference residual
and the 240 live raw coefficients on the admitted ordinary derivative
domain. The [principal flat ledger](PROP91_93_FLAT_LEDGER.md) and
[Gaussian tail proof](GAUSSIAN_TAILS.md) check the nonzero cutoff
terms. The mode-zero \(F[1]\) bounds, equality of the guarded and
unclipped \(G[1]\) across all seams, and its uniform derivative
and support bounds remain open.

Run the checks with the extracted, exact GitHub graph directories
and the checkout of the verification branch.

    python check_repeat_forced_candidates.py --repo REPO --first-dir FIRST --full-dir FULL --candidate-dir CANDIDATE --github-metadata GITHUB_JSON --out independent-second-forced-candidates.json
    python check_repeat_wrapped_readback.py --repo REPO --first-dir FIRST --candidate-dir CANDIDATE --official-receipt independent-second-forced-candidates.json --out supplemental-second-candidates.json
    python check_repeat_raw_support_ideal.py --repo REPO --candidate-dir CANDIDATE --official-receipt independent-second-forced-candidates.json --out actual-raw-support-ideal.json
    python check_repeat_high_mode_ideal.py --repo REPO --full-dir FULL --candidate-dir CANDIDATE --github-metadata GITHUB_JSON --out actual-high-mode-ideal.json
    python check_repeat_stencil_support.py --candidate-dir CANDIDATE --official-receipt independent-second-forced-candidates.json --out live-stencil-support.json

Here `FIRST` is the corrected first Forced graph directory, `FULL`
is the corrected first-cycle graph directory, and `CANDIDATE` is
`post-five-repeat-forced-graph` from run 43015175416. `GITHUB_JSON`
is the exact run metadata included in the archive.
