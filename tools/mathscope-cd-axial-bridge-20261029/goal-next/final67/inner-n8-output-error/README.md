# Original full-inner velocity, gradient, pressure and nonlinear-force refinement

The frozen axis-corrected degree4/8 source approximation has now been propagated through all16 outputs of the exact original67+13 polynomial stencil:3 velocity,9 Cartesian gradient,1 localized pressure and3 full physical force components. The original source norm radii, physical coordinate scales and cutoff are common to both orders. No inner source polynomial was regenerated or imported.

VERIFIED:308 positive output-error terms, including all71 nonlinear error-error products, exact domination of every original signed polynomial difference, and coefficientwise width reductions. The independent reader checks all source pins, the physical normalization of every input error and all rational inequalities. Outer time, axial, mixed and third axial cutoff derivatives and the pressure gradients remain present.

Let A_i be the same original absolute physical atom radius and E_(N,i) its frozen approximation-error radius. For every stencil monomial c*fixed*prod z_i^alpha_i, the error program retains

    |c|*fixedCaps*[prod(A_i+E_(N,i))^alpha_i-prod A_i^alpha_i].

This finite positive binomial expression includes products of two errors. Coordinates and cutoff have zero approximation error. The program changes no source time sign or pressure normalization. Every positive error monomial has error degree at least one, so the frozen componentwise E8/E4 inequalities imply the following error-radius contractions:

| Outputs | Degree8/degree4 error-radius bound |
|---|---:|
|Velocity, all3 components|5/48|
|Cartesian gradient, all9 entries|23/128|
|Localized pressure|5/48|
|Full nonlinear force, all3 components|5/16|

The field reference radius A_i contains the retained exact leading source and all positive source norm factors. The error has no leading contribution. This gives exact atomwise inequalities E4_i<=A_i/4 and E8_i<=65 A_i/1024; the replay uses the sharper individual atom constants rather than these common maxima.

## Exact directed normalized error enclosures

For each output let W be its strictly positive original absolute-stencil majorant, constructed from the unchanged A_i, the original cutoff derivative caps and R=4sqrt(tau0/Lambda). The exact pointwise normalized error enclosures are:

| Output | Degree4 | Degree8 |
|---|---:|---:|
|Each velocity component and localized pressure|[0,3/16]|[0,5/256]|
|Each Cartesian gradient entry|[0,1/4]|[0,23/512]|
|Each full-force component|[0,31/64]|[0,8563/131072]|

These enclose absolute approximation error divided by W. They do not divide by the actual output, which can vanish. A common physical normalization such as tau0^(A+1) for force cancels from the same numerator/denominator comparison. The force degree8 cap is below0.065331. Its exact nonlinear calculation is

    (1+3/16)(1+1/4)-1=31/64,
    (1+5/256)(1+23/512)-1=8563/131072.

Huge original analytic norm factors therefore need no numerical evaluation to verify these dimensionless ratio enclosures. The pointwise absolute error bound still contains W. This is a real source-bound output refinement, not an evaluated source force sample or a relative-error guarantee against the actual force.

For squared-output densities, q(2+q) multiplies the sum of squared original component majorants. For work, q_u+q_f+q_u*q_f multiplies the sum of the same original velocity-force majorant products. The independent exact checks give:

| Density error | Degree4 cap | Degree8 cap |
|---|---:|---:|
|Velocity squared|105/256|2585/65536|
|Gradient squared|9/16|24081/262144|
|Force squared|4929/4096|2318064041/17179869184|
|Velocity-force work|781/1024|2890303/33554432|

These also bound errors after integration over the same inner domain with the original positive weights and measure. The corresponding original majorant integrals remain symbolic. No moving-boundary energy balance, numerical integral value or whole-K defect estimate is asserted.

## Independent checks and scope

The second program independently expands each original signed P(z+delta)-P(z), takes exact coefficientwise absolute values, and verifies domination by the generated error program. It reconstructs prod(A+E)-prod A with SymPy rather than the producer's combinatorial enumeration. It then substitutes the frozen input error bounds and proves every normalized ratio inequality by nonnegative polynomial coefficients. All3 force omission controls detect missing nonlinear error-error terms. An actual mutated receipt dropping those terms is rejected; optimized Python that disables assertions is also rejected.

All premises are inherited from the frozen original inner source identification and analytic bounds:0<=Y=Lambda X<=4, original whole-K time/eta/angle domain, original Stokes gauge, exact leading n0, actual chi(b_nq)q^(2nh), n>=4 selector exclusion, original axis/pressure data and smooth inner-side face. Annular corrections vanish here by the prior original final-field identification.

This advances the coefficient-order/error axis on the actual final inner field. It supplies no annular numerical refinement, evaluated nonlinear integral or complete N8 acceptance. N7-06/N8-05 remain OPEN, global jets remain0/67 and RELEASE HOLD is unchanged. No repository, branch, website or numerical base67 file was changed; no local Lean compilation was performed.

The two scripts are portable and accept explicit locations. INNER_REFINEMENT is the frozen continuation52 inner-taylor-refinement.json with SHA86a17bafa5f65b311ee94fe789babeb866d185b33146c26128a86d59950fa601. GOAL_NEXT is the existing original evidence root. Use Python with SymPy, active assertions and fresh output paths:

```text
python propagate_inner_outputs.py GOAL_NEXT INNER_REFINEMENT OUT/inner-output-errors.json
python verify_inner_outputs.py GOAL_NEXT INNER_REFINEMENT OUT/inner-output-errors.json OUT/inner-output-readback.json
```

The seven files in this final-v2 directory form the deliverable, including the control receipt and MANIFEST.json. Both main receipts reproduce byte-for-byte. All files use UTF-8/LF. Preliminary files elsewhere in continuation53/inner-output are excluded.
