# Actual angular coefficient transport: recovered-source integration

This is a read-only mathematical audit. No original producer, consumer, test, private runtime, registry, or derivative expansion was run or modified. The companion `angular_transport_audit.json` records 15 independent saved-file/hash/structure comparisons; all passed. These comparisons authenticate the links discussed below, rather than supplying the analytic proof by themselves.

## Conclusion

The angular transport implication can be discharged from the recovered originals. There is no remaining mismatch between the primary affine maps, the actual initialized residual maps, and the full three-component native function identity. The original all-fixed-order primary and initialized-mean norm theorems supply the smooth functions and finite source-only constants. The recovered affine chain theorem then transports their coefficient estimates at every fixed derivative order. The original Gaussian argument transports the pulse-cutoff remainder into the flat class. This conclusion does not infer all orders from the finite native jet registry or the executed orders 0–2.

This is a written integration of existing results. It does not change the historical wave application's conditional flags. It also does not by itself settle the other initial-state estimates/moments in N6-01 or the later-substep requirements in N6-02. The broader audit must establish the already specified same-source mean/primary premises from their own producers; it need not add an independent angular-transport assumption.

## Checked originals and exact source links

Use the following roots:

- `B = /workspace/scratch/11bf626d6c2d/analysis/base/PR30-primary67-continuation`
- `W = /workspace/scratch/11bf626d6c2d/analysis/base/embedded-wave-norm/MathScope_M3_WaveNorm_Continuation`
- `Y = /workspace/scratch/11bf626d6c2d/analysis/intake_audit/recovered_source_candidates/9badb503543f8bc8/source-common-y-class-majorants.mjs`

The recovered Y file has SHA-256 `9badb503543f8bc83f5db0e7a373a9a8434ae63104f201601c8e1df66e493da6`, matching the recovered original reference. The W copies of the initialized construction, angular source packet, and angular theorem are byte-identical to their B originals. The radial/axial theorem binds that exact angular theorem and initialized construction; both native theorems share source header `f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1`. The initialized mean graph exactly matches the original mean graph in the saved norm family. The actual primary and norm family have the same paper/parameter identities. The sources retain all 10 lift/sign templates, all 162 signed rows, and all three components of each nonzero mode.

## The analytic argument

### 1. The affine-chain rule is an arbitrary-order theorem

`Y:39–63`, `originalCommonYAffineClassRecipe`, states the full chain formula for arbitrary smooth coefficient b and any multi-index alpha of length m. The map uses both xi and v columns; higher derivatives of the coordinate map vanish after freezing the actual integer labels and nearest copy. The integer matrices are J^delta for delta=0,...,4. With the original palette bounds and neighboring-band restriction, the row norm of the coordinate Jacobian is bounded by C_torus S_ref, where C_torus = 4 + 1296(1+4 Tg) < 32404.

Consequently a coefficient estimate through order m of the form

`|D^beta b| <= C_m S_label^L epsilon_label^alpha sqrt(zeta) delta_*^(-d) P(v)`

gives, for the composed coefficient on the common chart, a bound with an additional finite factor `(C_torus S_ref)^m` and `S_label^L <= 4^L S_ref^L`. No new epsilon loss appears in this coordinate composition. The coefficient derivatives here exclude the separated oscillatory phase; physical derivatives of that phase are considered separately for the flat tail.

### 2. These are the actual wave maps, not merely covariance lookalikes

`Y:71–109`, `actualSourceMapping`, checks both columns, the full derivative maps, frozen map coefficients, all 162 rows, and the source flat-join convention. Its attached class output is for covariance, but the chain formula in step 1 is generic; its applicability to wave coefficients follows from the source reuse below, not from changing a covariance conclusion into a wave conclusion.

`B/MathScopeCompute/research-ide/mathscope-m3/navier/source-global-pressure.mjs:46–57,74–98` defines the rectangle and full derivative maps. `source-global-angular.mjs:73–117`, especially lines 96–101, uses exactly `sign.values` and `sign.derivativeMaps` from that cover for the wave fields and adds only the physical theta identity column. The extra velocity/pressure/residual factors are powers of the frozen band ratio. Thus the original affine-chain theorem applies to the actual primary coefficients, not to an approximating field.

`source-initialized-angular.mjs:128–159` maps those same primary coefficients through `exactOriginalAngularLift`; lines 167–198 construct the exact own-label and reference-chart residual wrappers. The whole mean is kept in its original common-Y coordinates: lines 113–122 define its inverse slow-chart pullback, and lines 200–204 reuse the original primary wave. The mean is not assumed to factor through xi and v, and no inverse torus cover is substituted for it. For norm composition the primary coefficient is transformed through both affine columns, while the mean uses its slow inverse chart and the identity map on Y. Finite product rules then combine them.

The background part also genuinely matches the label's homogeneous principal equation; this need not be added as an unproved background-homogeneity assumption. `source-global-band.mjs:70–97` defines s by `s-Z^2*s^(2h)-T=0`, X=R^2/(2s), eta=Z/s^D, qActual=Q*s, and fields from the same profile bodies at (qActual,X,eta). Under the actual slow map `(R,Z,T) -> (sqrt(K)R,K^D Z,KT)`, the function K*s solves the mapped equation because 2D+2h=1. Uniqueness of the original monotone root on the active overlap gives s_label=K*s_ref. Hence X, eta, and qActual are invariant. The multipliers in lines95–97 give all three velocity components the exact K^A scaling, including b because epsilon_ref=K^h*epsilon_label; pressure scales by K^(2A). The same profile and cutoff sums are evaluated at the identical qActual, so no approximate leading-background substitution is involved. The whole Y-dependent mean correction remains separately pulled back exactly as above.

The saved independent map proof is more explicit than a matching field name: `B/pressure-proof/angular-fast-pullback-independent/audit_two_fast_coordinates.py:39–72` compares both fast-coordinate expressions for all 162 rows and every delta=0,...,4 branch against the literal initialized-template lift, preserving the original centers/copies and all four primary field argument lists. Its saved result is an immutable input of the actual angular theorem.

### 3. Full vector equality can be differentiated once source smoothness is supplied

`B/MathScopeCompute/tools/n6-native-domain-frontier-20261015/actual_angular_pde_source_application.py:205–210` proves the fixed-chart differential-operator scaling, using the common ci and radial-fast coefficients. It retains differentiation of the R-dependent radial coefficient. With K=Q_ref/Q_label, the exact residual multiplier is K^(2A+1/2).

The radial/axial extension is already present: `actual_radial_axial_pde_source_application.py:107–136` binds the actual component-0 and component-2 local operator identities; lines 183–212 bind their 162-row wrappers to the same source maps and literal residual multiplier; lines 251–255 explain the complete vector scaling, including cylindrical connections and Dr^2. The saved theorem proves components 0 and 2 (823 original rows), alongside the angular theorem's component 1 (197 rows).

These are equalities of the original functions on each open fixed-label chart, not sampled equalities or only numerical jet coincidences. The native application deliberately requires only the derivatives needed to define the PDE. Separately, the source-bound primary and initialized-mean all-fixed-order theorems give smoothness of the coefficient functions. Therefore the ordinary theorem that derivatives of equal smooth functions are equal extends the same function identity to every fixed coefficient derivative order. It is unnecessary to execute a new high-order native derivative registry.

All mean-pressure derivatives cancel exactly in the wave increment, since pressure enters the PDE linearly and the same whole mean pressure occurs in both operators. The surviving nonzero pressure is the actual homogeneous primary pressure. This is visible in the full local operator identities; no new all-order mean-pressure premise is required solely for the wave increment.

### 4. The actual G_wave bound survives transport

`source-primary-class-majorants.mjs:123–143,175–223` supplies the actual primary/potential/pressure/full-curl bounds from the same private family, target norms, positive weight/inverse floors and homogeneous pulse bindings. Lines 199–205 and 215–240 distinguish its all-fixed-order source recipe from finite derivative materialization. `source-saved-initialized-norm-family.mjs:24–50` gives the canonical same-source continuation and preserves the coefficient bodies, selector, physical window and common threshold.

`W/reports/ALL_ORDER_PROOF_KO.md:13–48` is the actual local wave argument. The homogeneous principal equation leaves the real cutoff term `+psi_prime*t`. The regular part consists of principal-on-curl terms, all slow/phase/pressure/viscous/frame terms, all mean-wave terms, and same-label wave squares. The exact curl divergence identity, not the false assertion `n dot a = 0` for the full amplitude, removes the longitudinal fast k factor from same-label products. It yields exponent 1−3 kappa_s for supported modes ±1 and 1−kappa_s for modes ±2.

The identities and finite-product rules hold at every fixed coefficient order. Increasing that order changes the finite source constant, polynomial S power and Gaussian boundary pole, without introducing another physical Dr into the residual operator. The actual epsilon loss is therefore independent of the requested coefficient order. Applying steps 1–3 to the resulting actual coefficients gives the same exponents on the reference chart.

For the residual multiplier, epsilon_label^alpha/epsilon_ref^alpha = K^(−h alpha), and 1/4 <= K <= 4. The source's positive small h and the displayed exponents make the ratio factor bounded by 16. The extra slow-coordinate derivative factors are bounded by 4 per derivative. Hence the conservative factor `16*4^(m+L)` used in `W/code/wave_bridge.py:222,245` is compatible with the actual residual scaling. Both Y columns have already contributed their `32404^m*S_ref^m` factor at lines 153–158. Frozen ratio, carrier, label and copy factors are not differentiated.

Thus the complete supported nonzero coefficient family satisfies `G_wave in W_(99997/100000)`, hence `W_(7/10)`, on the original domain. Finite sums retain all three vector components and all 162 source contributions. This is a coefficient-family conclusion, not a claim that an unnormalized sum has the size of one individual coefficient.

### 5. F_pulse remains a genuine flat remainder

The source pulse cutoff is applied before the curl and pressure calculation. The homogeneous principal equation and the exact product rule identify the surviving term `+psi_prime*t`; it is not set to zero. `source-global-angular.mjs:41–58,130–156` retains the actual moving-normal pressure, half-conjugate pairs and endpoint remainder. The actual primary pulse bindings are part of the primary norm theorem.

On the cutoff transition region, the original Gaussian bound and length lower bound imply `P(v) <= exp(−c*S_label)`, with `c = gaussianLower*lengthRatioLower/25 > 0`. These are the actual source nodes 617317 and 300173; `W/code/wave_bridge.py:250–267` and `W/reports/ALL_ORDER_PROOF_KO.md:60–77` give the source-bound formula.

Every fixed physical derivative consists of finitely many coefficient derivatives, phase/carrier factors and chart factors. The primary all-order bounds and the affine transport above bound them by a finite source-only `C Q^(−M) S_label^P exp(−c*S_label)` (after enlarging finite M and P if necessary). Polynomial losses in the boundary distance are absorbed by the original positive radial Gaussian factors. Frozen physical normalization adds another fixed Q power and finite constant, which belongs in M and C; it creates no new analytic premise.

Writing Q=2^(−ell), S_label=ell^2, and using q>=Q/2 on the active label's original band support, completion of the square gives, for every fixed N, the explicit finite constant

`C_N = C*2^N*(2P/c)^P*exp((M+N)^2/(2c))`, with the P=0 factor taken as 1.

Therefore every fixed physical derivative of F_pulse is O(q^N) for every fixed N. This flatness survives the same frozen chart changes and finite locally supported assembly. Its constants need not be decimal-evaluated, and no new q threshold is chosen. The remainder stays explicitly present in `Pi_nonzero R = G_wave + F_pulse`.

### 6. Joins and quantifier scope

All-order extension across guards/nearest-copy changes uses the original source's flat zero extensions, not derivatives of a floor function. `Y:108`, `source-global-pressure.mjs:104–118`, and the primary Gaussian boundary estimates supply this premise. Distinct-label products vanish as functions with their derivatives; same-label squares and both mean-wave orders remain.

The scope is the same canonical source atlas and its certified windows. The literal N=1 prefix is valid only on `0<q<qGlobalStar` and `b_2*q>=1`. It is not extended to all q by this audit. The canonical all-order norm continuation preserves the physical source in the selected window; other valid windows use the same established source recipe. This distinction is retained in the existing wave proof and is not changed here.

## Integration recommendation

Record the angular all-order transport implication as analytically justified by the recovered original map theorem and exact source identities, subject only to the already existing same-source primary/initialized-mean inputs. Do not retain a fictitious separate requirement to execute all coefficient derivatives, to compute decimal constants, or to produce a new full-vector transport theorem from scratch. Do not promote the finite native proof alone to this result.

For N6-01, integrate this wave/flat decomposition with the independently established mean, defect and conservation-moment results on the same latest-pressure tuple. N6-02 still requires the independently compared latest-pressure residual after each later requested substep; this transport argument adds no completion claim for an unperformed correction stage.
