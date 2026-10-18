# Read-only review of the signed full-pressure successor

Reviewed module: `work/recovered_input_fix/signed_pressure_repair/overlay/research-ide/mathscope-m3/navier/source-global-signed-full-pressure.mjs`  
SHA-256: `dc20e9a12ef6fba6648f9e88d029639ab63e88fb4fdeaba5edf51eed272218db`  
Bytes: 11272  
Review scope: actual full auxiliary covariance support, common-torus maps and physical scaling, and compatibility of the homogeneous angular pressure. No original producer or successor constructor was executed for this review. No implementation files were changed. This is a source-level mathematical/code review, not an executed construction certificate or formal proof.

No concrete mismatch was found in those formulas. This conclusion follows from the operand definitions and construction below, not from boolean scope flags, pass counts, or an increase in completed-obligation counts.

## Checked source connections

All line references below refer to the reviewed hash. The cited original modules are the neighboring recovered copies in the same overlay directory.

1. **Full covariance before auxiliary averaging.** Lines 32–34 reconstruct the real field from `row.oldFull + row.increment`. Lines 47–57 take all six entries of `row.expansion.after`, rather than `signed.updated.fullAuxiliaryMean`. In `source-global-signed.mjs`, `hmean`/`hcov` at lines 29–31 retain the angular factor 1/2, and `exactHarmonicCovarianceIncrement` at lines 36–51 defines `after=C(U+V)` with all ordered cross terms and the new square. The signed constructor at lines 175–211 identifies U and V with the old complete curl and the new complete curl. Consequently this is the required angular mean at fixed auxiliary Y before the information-losing auxiliary Haar integral.

2. **Support and both frozen affine columns.** Lines 49–55 apply `guardGlobalLocalBody` to every local body before substituting the original representative. Lines 64–80 reuse `cover.rows`, `sign.values`, `sign.derivativeMaps`, and each box's guards, retaining both original signs and every original common-torus contribution. The original `completeSourceCover` in `source-global-pressure.mjs` at lines 60–122 supplies the same two-column xi/v map, support separation and flat joins. The signed amplitudes retain the same slow/chi/psi cutoffs as the old curl, so their support is contained in the original supported pieces; multiplying by the signed slow amplitude does not create cross-label overlap.

3. **Physical scaling and angular parameter.** At line 71, velocity uses K^A and covariance/pressure use the original `sign.coefficient=K^(2A)`, where K=Q_ref/Q_label. This agrees with `shareCompleteAngularFields` in `source-global-angular.mjs` at lines 73–117. The extra theta identity column at local parameter index 9 matches that original function: seven slow/label parameters, then xi and v, then theta. No new covering multiplicity or Haar Jacobian is inserted. Reusing the frozen derivative maps is essential; differentiating floor-selected labels would be a different construction.

4. **Homogeneous signed pressure.** Lines 37–43 require deltaA to be independent of xi and v and feed the unchanged original normal, normal derivative, principal K matrix, carrier k and complete signed weighted primary amplitude to `originalHomogeneousPrimaryPressure`. Lines 44–46 add the original primary pressure and reconstruct the same real harmonic. The original function in `source-global-angular.mjs` at lines 44–60 computes the moving-normal row i(n^T K-n'^T)t/(k|n|^2). The privately authenticated signed constructor separately supplies tangency and full-curl identities. Thus the extra signed scalar scales the same homogeneous pulse pressure; no forced inverse solution or different pulse is substituted. Cutoff-derivative and curl-remainder contributions remain in the full PDE residual; the pressure identity does not claim those contributions vanish.

5. **Refreshed whole auxiliary mean pressure.** Lines 130–136 pass the newly assembled six-component covariance, unchanged original stress, rho and chi, and the explicitly checked zero pre-temporal mean velocity into `reconstructUpdatedFullMeanPressure`. That original routine recomputes gr, its normalized Haar defect P, shifted radial integrals and the A0 cutoff term. The complete pressure then includes background, refreshed full auxiliary mean pressure and the original-plus-signed angular pressure. The old auxiliary Haar covariance is not substituted for the full Y-dependent covariance.

## Material limits

**The universal residual identity does not authenticate pressure by itself.** Lines 89–111 define the increment as new velocity minus old velocity and the pressure increment as new pressure minus old pressure. Lines 137–146 compare a direct cylindrical PDE evaluation with its exact linear/bilinear/quadratic expansion. That identity is valid for arbitrary smooth input pressures. A wrong pressure inserted consistently into both paths can still pass. Therefore covariance/pressure authenticity rests on the checked source connections above; it must not be inferred solely from the comparison or its status flags. The cylindrical nonsymmetric tensor-divergence connections, both ordered cross terms, new quadratic term and named old flat term are explicitly retained.

**Only the original pre-temporal signed step is addressed.** The private-seal checks at lines 116–125 require the original current shared with the initial angular state, reject a post-temporal initial state, and require the initial mean velocity to be zero. The later forced state has an updated mean and pressure and is not this input. This overlay therefore does not construct the missing signed step after the forced/initialized stages, does not close arbitrary signed cycles, and does not close N6-02 or the whole Proposition 9.6 cycle. A result that reports this narrow step as complete must preserve this distinction.

**Execution and estimates remain separate.** This read-only review does not show that the actual constructor reaches its returned tuple within available resources, that a saved graph certificate has been emitted, or that all-order class estimates for the new signed state hold. It does not alter N6-01's frozen candidate, historical flags, or obligation counts. A complete later-stage application still requires the actual compatible full input state and the needed analytical estimates.

## Hash stability

The module bytes were checked again after writing this review and were unchanged during the write. Any later module change invalidates this review's exact line/hash binding and requires a focused review of the change.
