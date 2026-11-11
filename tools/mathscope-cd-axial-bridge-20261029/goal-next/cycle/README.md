# First post-FiveMap harmonic projection

## VERIFIED

- The checker streamed the 4,420,257 nodes of the archived original graph from GitHub replay commit `f8cb4034e86d7b669d52a6f2248aebba156b51b5`. It verified the uncompressed stream SHA-256, checked the 159,655-node projection against the full graph by original ID, and checked the complete registry SHA-256. It used physical velocity roots `[4419697, 4419698, 4419699]`, pressure `4419702`, and the actual conservative residual `[4420035, 4420037, 4420039]`.
- The eight angular fields carry the same 81 original boxes, two signs per box, complete values, guards, local derivative maps, fixed differences, and frozen nearest copies. Their native angular partials are differentiated in local formal coordinates before the fixed row map and outer guards. The checker independently verified the angular maps, the 100 indexed derivative atoms, and the unchanged angle in the inner chart substitutions. The archived registry's `sourceAuthenticated` flags remain false.
- Each of the five phase cases for a sign has the same nonzero integer angular winding rate. The actual slopes are `omega_plus/k` and `omega_minus/k`, with `omega_plus = #625982` and `omega_minus = #629400`. The source picks a rounded integer and replaces zero with a sign-dependent unit. Both rates depend only on the band and the three fixed representative coordinates, so all six differentiations leave them fixed before row substitution. The checker recovered all ten selected phases by the original half-integer case tests.
- The full three conservative residuals are polynomials of degree at most two in the original indexed angular partials. Their linear term counts are 44, 46, and 42. Their quadratic term counts are 34, 40, and 40. The coefficient program includes the background term, the same-row zero harmonic, every same-row degree from −4 to 4, and every cross-row product. Conjugacy holds structurally in all three components and after conversion to the own phase. The control run rejects a wrong sign rate, a changed angular derivative direction, a changed frozen grid, and a missing actual angle argument.
- Chart normalization uses `rho = #3675262 = 2^(ell_own-ell_reference)`. The original forward local coordinate values are `[3822571,3822572,3822573]`. The original residual multiplier `#3822575 = rho^(2A+1/2)` is checked against all six earlier archived Forced reference residual wrappers. The raw own-chart recipes apply its reciprocal and remove the angle-independent offset of the selected own phase. The checker identifies all 20 original zero-data positive first-force systems, two for each of the ten phase cases.

## Meaning of the coefficient program

For row `lambda`, put `t_lambda = exp(i omega_lambda theta)`. Write the selected original phase as `Phi_lambda = phi_lambda + (omega_lambda/k_lambda) theta`. Each projected cosine contributes `exp(i m k_lambda phi_lambda)/2` at degree `m` and its conjugate at degree `-m`. Each projected sine has factors `1/(2i)` and `-1/(2i)` at those two degrees. Both formulas preserve the original signed (m) in each source argument.

The recipe IDs index `coefficientRecipes` starting at zero. `source` is a real archived root. `phasor(phase,m)` is the exponential of the original `m*k` times the stored sum of angle-free phase terms, multiplied by `i` in the exponent. `sourcePiecewise` uses the exact source test, endpoints, and selected branch. `substitute` uses the simultaneous formal/actual tuple in `referenceCalls`. All recipe identities are restricted to the declared domain where their original operands are defined. Evaluation of a guarded body uses the selected branch only.

`indexedCoefficient(call,m)` is parameterized by the same row `lambda` for every atom in a same-row coefficient. Take the archived `slowLocalOrders` partial of the matching reference field's coefficient, multiply by `(i m omega)^angleOrder`, apply the row's values, and apply its five original outer guards in their original order. The row and derivative-map factors are exactly one. The rate depends on neither the six formal derivative coordinates nor their source-preserving reference substitutions.

`fullWavePolynomial` substitutes the sum over all rows for each indexed atom. For a quadratic term with atom factors `a,b`, its `crossRowPolynomial` contribution is the sum of `a(lambda)b(mu)` over ordered pairs of distinct rows. Ordered pairs also preserve the multiplicity in a square. A cross-row product can contain a different winding frequency than a same-row product. The program therefore retains it with both source rows and does not assign it the same-row mode index.

In `rawSameRowOwnPhaseNonzeroModes`, `inverseResidualChart(c)` evaluates the reference coefficient at `(R/sqrt(rho), Z/rho^D, T/rho)` in own coordinates and divides by `rho^(2A+1/2)`. `ownPhaseInverse(m)` is `exp(-i*m*k*phi_lambda)` in the selected own chart. This gives raw complete-residual coefficients in the original forcing basis. The fixed representatives, guards, common auxiliary coordinates and row-specific copies are preserved.

## CONDITIONAL

On the original fixed-label, closed-support and flat-join premises, every derivative atom is supported on its original labelled wave support. The archived cover declares the required disjointness. If those premises apply to the actual post-Five wave and pressure jets, cross-row terms vanish, the same-row coefficients with a wave factor inherit that row's support, and the same-row degree zero is its angular mean. This check does not independently establish the geometric inequalities and boundary smoothness needed to apply those premises to every row.

## OPEN

The subsequent [archived reconciliation](../f1-mean/archived-cutoff-reconciliation.json)
binds every first-Forced input to the raw initialized source. For this
archived run the Forced principal term already includes the surviving
Primary cutoff contribution. A separate Primary term belongs to the
repaired run where the original supported input excludes it before
solving. Regenerate all four stages for that input.

Proposition 9.3, PDF pp. 103–105, splits the complete physical residual into supported source `G[j]` and additive flat remainder `F[j]`. The latter contains nonzero Gaussian pulse-cutoff tails, even for a homogeneous pulse. Proposition 9.1, pp. 101–102, gives the two terms for an inhomogeneous solve. A full direct projection can contain those terms. The original next function `GroupedSupportedNonzeroResidual` `f_68465a2d86d9ee074ccccd4b` needs the projection of `G[j]`, hence the raw recipes are not a valid source for the next inverse yet.

The earlier `initial.global.oldFlatResidual.local` is a mode-zero base/stress record. Its subtraction cannot supply the missing nonzero cutoffs. The original first-force live records already hold their cutoff expressions. See [next live export](LIVE_EXPORT.md) for the exact predecessor fields to retain and the remaining split proof.

The archived runner uses `prepareGlobalSourceBand({coefficientOrder:1,...})`. This covers one source coefficient prefix and one correction cycle. The (n=1) axial case of #117047 needs the distinct leading-order flux identity and exterior checks already recorded in the axial package. The recursion (n≥2) of Lemma 5.2, larger prefix lengths (N), and later correction iterations (j) of Proposition 9.6 remain outside this certificate. The archived common chart carries `0 < q < qGlobalStar`, `b₂ q ≥ 1`, `1/2 ≤ q/Qref ≤ 2`, `T ≥ 0`, and the original annulus guards.

This projection certifies the archived coefficient recipes. The next inverse, final field, class estimates, and numerical jets remain open. RELEASE HOLD.

## Reproduction

Run from the workspace root with Python 3 and assertions enabled.

```text
python work/goal-next/cycle/group_postfive_residual.py --reached work/goal-20261111/y-next/reached.json --registry work/delivery-20261110/inputs/graph/original-source-functions.json --graph work/delivery-20261110/inputs/graph/original-source-nodes.jsonl.gz --output work/goal-next/cycle/group-postfive-residual.json
python work/goal-next/cycle/check_group_postfive_controls.py --reached work/goal-20261111/y-next/reached.json --registry work/delivery-20261110/inputs/graph/original-source-functions.json
```

The projection input was generated by `work/goal-20261111/y-next/collect_reachable.mjs`; it is also cross-checked in full by the new script. The resulting coefficient-program SHA-256 is `6a99e63be8e1ba2445e93a240005aaa4345c556f4e4d14ba6bcf813297b2b656`. The observed replay and control outputs are in `replay.log` and `controls.log`.
