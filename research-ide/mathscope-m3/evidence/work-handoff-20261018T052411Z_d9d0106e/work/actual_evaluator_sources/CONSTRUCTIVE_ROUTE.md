# Constructive source bounds and the actual evaluator

The original source contains a sufficient, explicit cutoff rule and finite positive expressions for the initialized norm constants. Exact suprema, least polynomial degrees and ceilings of exact suprema are unnecessary for a separately identified sufficient-cutoff continuation. The frozen `remaining_chain` family uses those choices, however, so the new rule must have a new family identity. The original h, domain, background selector and initialized tuple remain unchanged.

This report establishes an implementation route and supplies exact elementary kernels. It does not claim that all updated-current coefficient constants have been computed, that the whole final field has been numerically evaluated, or that N7-06/N8-05 are closed.

## 1. Existing source expressions that avoid supremum searches

Paths beginning `M2/` mean `analysis/base/PR30-primary67-continuation/MathScopeCompute/research-ide/mathscope-m2/navier/`. Paths beginning `M3/` mean `work/remaining_chain/source/`. `SOURCE_PINS.json` records complete relative paths, sizes and SHA256 hashes.

| Source | Constructive content | Remaining adapter duty |
|---|---|---|
| `M2/actual-background-physical-seminorms.mjs`, `rectangularSourceFTC` | All 2^d anchored-face integrals of sqrt(1+(mixed derivative)^2), d<=3. This is an exact finite positive constant, with no free profile coordinates. | Bound or integrate each retained actual face body. Continuity and actual box endpoints must be authenticated. |
| `M2/actual-residual-order-induction-source.mjs`, `innerNorm`, and `actual-residual-order-induction-norms.mjs`, `attachActualInductionNorms` | Explicit source-only exponential solution norms and well-founded ordinary mixed-jet recurrences, including global moments. | Consume these actual upper roots before introducing a new quadrature task; weighted stress remains a separate producer. |
| `M2/actual-common-admissible-family.mjs`, `commonRecursiveSelector` | Finite max/log recursion for b_n. Every diagonal clause m<=n appears; each B_nm is a source norm expression. | Preserve canonical earlier rows when extending the query. The generic helper alone has no source authority. |
| `M2/actual-common-target-weighted-norms.mjs` | Actual inner/outer regular factors, reverse-distance anchors, Gaussian recurrences and middle-region FTC. | Use factorized endpoint envelopes; do not evaluate a quotient by a flat zero. |
| `M3/source-global-class.mjs`, `globalClassSourceCutoffAndMapConstants` | Source step/partition/slow-chart/radius derivative constants; partition denominator >=1/4; finite factorial and radius formulas. | Evaluate or dominate exact source-only expressions. Preserve the single epsilon loss of the radial phase separately from its derivative degree. |
| `M3/source-global-class.mjs`, `globalClassMeanAndRadialConstants` | Exact mean seed, positive mass, explicit collar gaps, Gaussian primitive envelopes and middle zeta lower bound. | Retain actual zero weighted radial moments and source Imean support. Positive gaps need their source proof. |
| `M3/source-initialized-lazy-norm-program.mjs` and `source-saved-initialized-norm-family.mjs` | Closed 13-call actual producer DAG; every deferred leaf selects the result of a named imported source producer. | Materialize or dominate each requested leaf at the required finite order. An unevaluated source_norm_result is not a numerical interval. |
| `M3/source-forced-class-majorants.mjs`, `originalStableForcedClassPowers` | Explicit finite mixed derivative and polynomial-S degree recurrences; stable propagator independent of harmonic maximum. | Attach the actual current forcing W_alpha input norms, same pressure and full common-Y pullback. |
| `M3/source-iteration-decay.mjs`, `originalIterationDependencyProgram` | Complete finite four-step dependency graph, full pressure refresh after each, finite derivative requests and harmonic-range bound. | Instantiate actual C, S-degree and boundary-pole rows for every updated source; the graph explicitly says these are not yet instantiated. |
| `M3/shrinking-cutoff-summation.mjs` | Exact sufficient logarithmic threshold and complete active-window/tail checks. | Feed actual cutoff-corrected coefficient majorants; generic rational fixtures are not source certificates. |

The initialized 13-call composition has authenticated source identities, and its all-fixed-order theorem establishes finite constants. The missing numeric step is evaluating/dominating the actual producer results, not proving that an arbitrary supremum is finite. Later recursive current stages additionally need their concrete operator/body adapters.

## 2. A concrete sufficient selector

Suppose the actual cutoff-corrected coefficient at stage j and derivative order m<=j has been proved bounded by

`C_hat[j,m] * (1+|log q|)^P_hat[j,m] * q^(g_j - physical_loss[m])`,

with positive source-only C_hat, a nonnegative integer P_hat, and original g_j=h*j/10. Put gamma_j=g_j/2=h*j/20, and choose

`L_j = max(1, 1+L_(j-1), 1+log(1/q0), max_(m<=j)(2*P_hat[j,m]/gamma_j)^2, max_(m<=j)2*(C_hat[j,m]+j)/gamma_j)`;

`a_j = exp(L_j)`.

For x=-log(q)>=L_j, log(1+x)<=sqrt(x), log C<=C and log2<1 give

`C_hat[j,m]*(1+|log q|)^P_hat[j,m]*q^gamma_j <= 2^-j`.

This is precisely the sufficient rule already implemented by `shrinkingCutoffThresholdExpression`. Maxima, rational arithmetic and exp/log expression nodes suffice; no least integer search or exact ceiling of a computed real is required. Replacing a source constant by a certified upper bound only enlarges this new selector. It does change this new continuation's cutoff field, so it cannot be called the frozen exact-sup field.

The original `b_n` selector belongs to the fixed background and is not silently changed by this proposal. Original producer bounds can be dominated using their explicit diagonal inequalities and finite low-index blocks, without numerically expanding every b_n. The new `a_j` selector is the separately authorized final correction schedule.

The full norm type should retain `(C, polynomial degree in S, epsilon exponent, boundary pole, Gaussian/pulse factor, source identity)`. For S=ell^2, S^p contributes logarithmic degree 2p after the original chart comparison. Product degrees add; finite Leibniz sums take the maximum degree and add the exact positive constants with binomial coefficients. Derivative demand and explicit epsilon loss must remain separate. A high input derivative order is not an additional q-power loss by itself.

## 3. Exact implemented elementary bounds

`constructive_kernels.py` implements exact rational bounds for the actual flat kernels used by the source, with no numerical fit:

For g(t)=exp(-a/t^r), a>0, r=1 or2, write `g^(n)(t)=P_n(1/t)*g(t)`. Then

`P_0=1`, `P_(n+1)(u)=-u^2*P_n'(u)+a*r*u^(r+1)*P_n(u)`.

Every weighted monomial is bounded by

`sup_(u>=0) u^k exp(-a*u^r) = (k/(a*r*e))^(k/r) <= max(1,k/(a*r))^ceil(k/r)`

for k>0, and by1 for k=0. The right side is rational when a is rational. This yields computable bounds for any finite derivative and finite endpoint pole. The original mean seed satisfies

`exp(-1/[t*(1-t)]) = exp(-1/t)*exp(-1/(1-t))`,

so complete Leibniz sums bound every derivative. Its original normalization mass is at least `exp(-16/3)/20 > 1/14580`. The normalized seed bounds in the audit include the reciprocal mass; physical affine radius/scaling factors must still be applied by the actual rho adapter.

The source step denominator `exp(-1/t^r)+exp(-1/(1-t)^r)` is at least `exp(-2^r)>3^(-2^r)` on [0,1], because one of t,1-t is at least1/2. The kernel includes an exact inverse-jet recurrence under this positive lower bound. It also includes the anchored FTC majorant `sum_faces volume(face)*(1+B_face)`, using sqrt(1+B^2)<=1+B. These close elementary bound tasks, not arbitrary coefficient leaves.

`ELEMENTARY_KERNEL_AUDIT.json` records the exact results, seven rejected invalid hypotheses and scoped status. Its generic threshold fixture is explicitly not the original h or an actual C_jm.

## 4. Source-specific operator rules available for a bound compiler

1. Fixed profile bodies: guard support before any inverse, apply complete algebraic/chain derivative recurrences, and use the Gaussian envelopes above at flat endpoints. Source parameters stay exact; an interval upper/lower pair may dominate them when proved. A ceil node can be bounded above by `|x|+1` for a norm estimate without determining its exact integer value.
2. Implicit slow inverse: the original derivative floor is1/2 and upper bound1 on the whole original image. Contractive/monotone enclosures and differentiated implicit equations supply a finite modulus; do not substitute a point sample for a whole-image bound.
3. Volterra pulse: use the stable identity `M_m=M_1-(m^2-1)*d*I`, d>=0. The original logarithmic norm bound gives `W=exp(3*Bnorm^256*Lmax)`, independent of S. The forced output bound is of the form `F_m*W^(m+1)*K_m^(3*p)*S^(b+p)`, with all original common-reference factors retained. An absolute-matrix estimate `exp(||M||*Ls)` is not an acceptable polynomial-S class proof. A separately bounded factorial Volterra tail is useful for numerical evaluation but does not replace the stable class estimate.
4. Torus inverse: the original quadratic directions satisfy `|divisor(k)^(-1)| <= (2+sqrt2)*max|k|`. The complete omitted square tail above K is at most `8*(2+sqrt2)^p/(2*pi)^(2*p+3) * inputNorm/K`. Output order m needs source order m+p+3; the radial p-fold integration-by-parts application needs m+2p+3. Preserve the zero mode separately.
5. Radial inverse: retain the full weighted zero moment, use forward inner/backward outer Gaussian primitives and the compact middle positive zeta lower bound. Boundary cancellation is an identity of the actual source, not a numerical smallness assumption.
6. Products, full mean pressure and five-map: finite exact Leibniz and matrix inverse recurrences apply after actual positive determinant/denominator bounds are supplied. Reconstruct current pressure before computing the next actual residual/moments. The same field roots and complete supports must be carried through every stage.

These steps specify an effective route for the explicit finite source operations. The present code has not completed every adapter, so a global effective-evaluation theorem is not asserted. In particular, exact discontinuous carrier rounding at a computable-real boundary needs either a separation proof or a branch-specific argument; generic interval refinement alone does not guarantee its termination.

## 5. Actual scale and evaluation frontier

The original positive exponent is `h=exp(-8002*(exp(1048576)+10))`, and the source proves `0<h<2^-8002`. The common original domain requires `ell >= (64/h)^2`; `epsilon=2^(-h*ell)` and `k=ceil(1/sqrt(epsilon))`. Consequently

`log2(k) >= h*ell/2 >= 2048/h > 2^8013`.

A conventional expanded binary integer k would therefore require more than 2^8013 digits already from this deliberately weak bound. This is a representation/resource fact, not a theorem of noncomputability. Symbolic/logarithmic representations can retain these quantities compactly. Norm bounds can avoid phase evaluation using |sin|,|cos|<=1. Generic actual point values still require a certified treatment of the exact frozen rounded carriers and phase reduction; relative precision for a huge carrier does not control its phase modulo2*pi.

The existing `evaluateSourceProgramDiagnostic` is binary64 Simpson diagnostics: it rejects nonrepresentable exact source scales with `EXACT_SOURCE_SCALE_NOT_REPRESENTABLE`, declares `intervalCertified:false`, and never certifies an actual global field. Substituting manageable source parameters explicitly changes the source. M1's interval numerical code is useful locally but has a finite binary64 precision limit. Neither is the requested whole-field evaluator.

Potential legitimate branches:

* The actual original inner core has exact zero annular corrections and unit localization. `source-near-terminal-evidence.mjs` binds three component restrictions to the leading original fields; it can support a branch-specific normalized evaluation. An archived bound is not a fresh evaluation or all-space result.
* Exact angular/Haar integration may eliminate oscillatory phases for permitted matching modes in actual energy/work integrals. All cross-label terms and physical support/measure factors still need their original identities. This is an implementation lead, not a completed energy certificate.
* A global absolute enclosure may sometimes follow from actual source norms and support volumes without resolving phase. No such enclosure is established here; replacing the field by zero is not justified.

## 6. Required acceptance evidence

For an accepted new sufficient-cutoff family, bind each majorant to its actual source node, derivative demand, support, common coordinate map and latest pressure. Record the changed selector identity and reapply the four existing scoped proofs against unchanged original domain/initial tuple. Provide the complete active cutoff index window, coefficient/Fourier tails, arithmetic rounding enclosure and independent direct-force evaluation. N8-05 still requires the original separate refinement axes and the last-resolved time/resource cause when the budget is exhausted. A core-only or one-operation result must stay labeled with that scope.

The smallest next implementation is a source-bound adapter for the existing positive ordinary norm roots and the remaining elementary/weighted FTC leaves, plus explicit positive denominator contracts, followed by one actual current-stage bound adapter. This can consume the sufficient selector above. It must not infer actual C/P values from a generic dependency graph or reuse an initialized bound for a changed current without its operator proof.

## 7. A stronger existing ordinary-coefficient route

`actual-residual-order-induction-source.mjs:innerNorm` already avoids evaluating the coefficient functions to bound them. At order n it sets `strip=delta/(8*256^n)`, uses the preceding actual/auxiliary solution norms and smaller strip, forms an explicit finite positive C from every matrix/forcing term, and returns

`solutionNorm = exp(9*C^2*radialDomain/(2*loss))`, with `loss=strip`.

Its `naturalBase` and actual collar bounds retain the original source parameters, cutoff derivatives, and separate auxiliary system. All dependencies point to lower coefficient orders. This is an explicit bound expression, not a solution-norm supremum. Its Picard K threshold is a ceiling of an explicit positive expression; an upper bound for numerical iteration can instead use a certified integer above that expression without changing the solution being approximated.

`attachActualInductionNorms` consumes those genuine prepared records. It requests the leading source bounds at radial order `m+2*n+4` and eta order `2*m+6*n+8`, then applies the complete positive Leibniz calculus. For low radial order it uses the bounds

`actual.solutionNorm * m! * (2/actual.strip)^m * (r ? sqrt(Lambda) : 1)`

and

`r!*m!*Lambda^r*(2/auxiliary.strip)^m*auxiliary.solutionNorm`.

Higher radial derivatives on the smooth collar come from differentiating the actual second-order equation and solving for `2X*dX^2`; same-order coefficient references have smaller radial derivative order. This avoids falsely assuming radial analyticity of the smooth cutoff collar. Global moments are bounded by actual support length Xplus times the complete differentiated integrand norm. The fixed Ipos inverse uses the proven constants1024 and2^24 and retains its actual small scaling factors.

The returned `normalized[n].jets[field][r,m].upper` roots are therefore ready-made positive source expressions, paired with `actualSourceRoots` and the original domain. The source explicitly reports `weightedStressNormsDerived:false`, so the weighted target producer and its endpoint treatment cannot be omitted.

The leading producer `actual-leading-all-order-jets.mjs` itself returns a finite positive arithmetic graph built from the actual nonlinear Banach coefficient series, source pressure measure bound, finite cutoff Taylor recurrences and actual contraction/continuation constants. For example, its pressure norm uses the actual whole pressure estimate `|P|<=5K` on the stated complex strip and the finite geometric Cauchy factor; it does not numerically replace the original pressure by a core comparison profile. This strengthens the constructive route: ordinary background C leaves need a positive-expression evaluator, not fresh oscillatory field quadrature.
