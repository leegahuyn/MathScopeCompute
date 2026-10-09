# Original acceptance criteria — complete English companion

This document translates all **70 original titles, implementation requirements, and acceptance criteria**. The IDs and their order are unchanged. The status column is the **frozen v54 assessment**: 61 PASS, 7 PARTIAL, and 2 BLOCKED. Any subsequent work is recorded separately in [CURRENT_STATUS_EN.md](CURRENT_STATUS_EN.md); it does not overwrite this historical snapshot.

A PASS has the scope stated by the criterion and the implemented adapter. It does not certify arbitrary prisms, every compact group, a quantum Yang–Mills construction, a global BSD/Riemann hypothesis claim, or a complete numerical NS witness. See [mathematical scope](MATHEMATICAL_SCOPE_EN.md) and [the nine NS gates](NS_GATES_EN.md).

Sources: [unchanged original criteria](../mathscope-m1/evidence/original-acceptance.json), [unchanged v54 assessment](../mathscope-m1/report/M0_M1_normalized-report-data.json), and the [English machine-readable companion](../localization/acceptance.en.json). Full Korean implementation and validation narratives remain in those original records. The English domain and NS documents explain what the corresponding computations establish.

| Group | Total | PASS | PARTIAL | BLOCKED |
|---|---:|---:|---:|---:|
| M0 | 6 | 6 | 0 | 0 |
| Arithmetic | 24 | 24 | 0 | 0 |
| Gauge | 16 | 16 | 0 | 0 |
| Navier | 24 | 15 | 7 | 2 |
| M1 | 64 | 55 | 7 | 2 |
| Total | 70 | 61 | 7 | 2 |

## I0 — Mathematical objects, assumptions, and observation contracts

### I0-04 — Contract for a general G and a family of states

**v54 status: PASS.**

**Implementation requirement.** Specify the Lie algebra and global group form, representation, invariant inner product, coupling, lattice spacing a and size L, boundary, seed, observation channels, and the role of Delta.

**Acceptance criterion.** A request containing only a group name or a numerical Delta must not create an actual gauge-field job. A default state family must be immediately runnable.

**Evidence and implementation locators.** [mathscope-m1/gauge/evidence/validation.json](../mathscope-m1/gauge/evidence/validation.json); [mathscope-m1/core/registry.mjs](../mathscope-m1/core/registry.mjs); [mathscope-m1/core/session-binding.mjs](../mathscope-m1/core/session-binding.mjs); [mathscope-m1/evidence/core-tests.tap](../mathscope-m1/evidence/core-tests.tap); [mathscope-m1/evidence/m0-regression-tests.tap](../mathscope-m1/evidence/m0-regression-tests.tap)


## I1 — Exact arithmetic, precision, and computation jobs

### I1-03 — Propagate precision consumption

**v54 status: PASS.**

**Implementation requirement.** Calculate required input precision and output loss for division, differentiation, Frobenius, determinants, basis reduction, quadrature, and series summation.

**Acceptance criterion.** Automatically request extra digits when a p-adic delta operation requires them. If sufficient valid digits are unavailable, return PRECISION_REQUIRED instead of reporting computational success.

**Evidence and implementation locators.** [mathscope-m1/arithmetic/padic.mjs](../mathscope-m1/arithmetic/padic.mjs); [mathscope-m1/arithmetic/complex.mjs](../mathscope-m1/arithmetic/complex.mjs); [mathscope-m1/arithmetic/tests/arithmetic.test.mjs](../mathscope-m1/arithmetic/tests/arithmetic.test.mjs); [mathscope-m1/navier/numerics.mjs](../mathscope-m1/navier/numerics.mjs); [mathscope-m1/navier/heat.mjs](../mathscope-m1/navier/heat.mjs); [mathscope-m1/core/engine.mjs](../mathscope-m1/core/engine.mjs); [mathscope-m1/evidence/core-tests.tap](../mathscope-m1/evidence/core-tests.tap)

### I1-07 — Cross-check with independent computations

**v54 status: PASS.**

**Implementation requirement.** Compare direct point counting with Frobenius, FFT with direct convolution, analytic density with quadrature, and Lean certificates with generator results.

**Acceptance criterion.** Two copies of the same implementation do not count as independent verification. A fixture must specify at least two methods and their error criterion.

**Evidence and implementation locators.** [mathscope-m1/arithmetic/evidence/independent-validation.json](../mathscope-m1/arithmetic/evidence/independent-validation.json); [mathscope-m1/arithmetic/tests/arithmetic.test.mjs](../mathscope-m1/arithmetic/tests/arithmetic.test.mjs); [mathscope-m1/navier/checks.mjs](../mathscope-m1/navier/checks.mjs); [mathscope-m1/navier/evidence/numerical-validation.json](../mathscope-m1/navier/evidence/numerical-validation.json); [mathscope-m1/gauge/evidence/validation.json](../mathscope-m1/gauge/evidence/validation.json)


## I3 — Lean formalization, evidence grades, and research gates

### I3-02 — Begin formalization with finite algebraic theorems

**v54 status: PASS.**

**Implementation requirement.** Separate permissible precision for delta identities, d squared equals zero, semilinear chain maps, certification of finite prime intervals, Lie brackets, and lattice holonomy into small theorems.

**Acceptance criterion.** Valid fixtures and deliberately incorrect certificates must be accepted and rejected, respectively. Distinguish the scope of numerical examples from that of universally quantified theorems.

**Evidence and implementation locators.** [mathscope-m1/arithmetic/evidence/lean-audit.json](../mathscope-m1/arithmetic/evidence/lean-audit.json); [mathscope-m1/gauge/lean/lean-audit.json](../mathscope-m1/gauge/lean/lean-audit.json); [mathscope-m1/navier/evidence/lean-validation.json](../mathscope-m1/navier/evidence/lean-validation.json); [mathscope-m1/core/theorem-adapters.mjs](../mathscope-m1/core/theorem-adapters.mjs); [mathscope-m1/evidence/core-tests.tap](../mathscope-m1/evidence/core-tests.tap)

### I3-03 — Make analytic assumptions explicit

**v54 status: PASS.**

**Implementation requirement.** Store precise statements of completeness, uniform convergence, interchange of differentiation and limits, semigroup bounds, spectral measures, and stability constants.

**Acceptance criterion.** Every lemma using differentiation of an infinite sum or a continuum limit must display the required norm, domain, and quantifier range.

**Evidence and implementation locators.** [mathscope-m1/core/analytic-contracts.mjs](../mathscope-m1/core/analytic-contracts.mjs); [mathscope-m1/navier/analytic-contracts.json](../mathscope-m1/navier/analytic-contracts.json); [mathscope-m1/navier/lean/MathScope/Navier/Analytic.lean](../mathscope-m1/navier/lean/MathScope/Navier/Analytic.lean); [mathscope-m1/gauge/analytic-assumptions.json](../mathscope-m1/gauge/analytic-assumptions.json); [mathscope-m1/core/session-binding.mjs](../mathscope-m1/core/session-binding.mjs)

### I3-04 — Adapters for external comparison theorems

**v54 status: PASS.**

**Implementation requirement.** Distinguish citation-level references from actual Lean imports for prismatic comparison, trace formulas, known cases of BSD, and the source Navier–Stokes theorems.

**Acceptance criterion.** A result linked only to literature is a THEOREM REFERENCE. Connect it to a kernel result only when the exact exported Lean theorem has actually been imported.

**Evidence and implementation locators.** [mathscope-m1/core/theorem-adapters.mjs](../mathscope-m1/core/theorem-adapters.mjs); [mathscope-m1/core/bsd-known-case-reference.json](../mathscope-m1/core/bsd-known-case-reference.json); [mathscope-m1/core/domain-references.json](../mathscope-m1/core/domain-references.json); [mathscope-m1/arithmetic/lean/MathScope/M1/Arithmetic/Prime.lean](../mathscope-m1/arithmetic/lean/MathScope/M1/Arithmetic/Prime.lean); [mathscope-m1/navier/lean/MathScope/Navier/SourceAdapter.lean](../mathscope-m1/navier/lean/MathScope/Navier/SourceAdapter.lean); [mathscope-m1/navier/evidence/lean-validation.json](../mathscope-m1/navier/evidence/lean-validation.json); [mathscope-m1/navier/official-validation/official-audit-summary.json](../mathscope-m1/navier/official-validation/official-audit-summary.json)


## P1 — The infinite prime specification and prime-indexed arithmetic data

### P1-01 — Separate the infinite specification from completed finite ranges

**v54 status: PASS.**

**Implementation requirement.** Store PrimeSet as a logical definition. Generators provide nextPrime and streamInterval and record each request's endpoints, budget, and last certified interval.

**Acceptance criterion.** Forbid a global allPrimesComputed=true field. Completion of [a,b] and the definition of the infinite domain must have different types.

**Evidence and implementation locators.** [primes.mjs:PRIME_DOMAIN, nextPrime, streamInterval](../mathscope-m1/arithmetic/primes.mjs); [index.mjs:validateRequest](../mathscope-m1/arithmetic/index.mjs)

### P1-02 — Construct a segmented sieve and a completeness certificate

**v54 status: PASS.**

**Implementation requirement.** When eliminating multiples in [a,b], recursively require completeness of the base primes up to the integer square root of b. Start at max(p², ceil(a/p)p), using integer square roots.

**Acceptance criterion.** Verify π(10)=4, π(100)=25, π(1000)=168, and π(10⁶)=78498. Exclude 0 and 1, include 2, and pass p² boundary and unaligned-interval cases.

**Evidence and implementation locators.** [primes.mjs:segmentedPrimes, verifyPrimeSegments](../mathscope-m1/arithmetic/primes.mjs); [exact.mjs:isqrt](../mathscope-m1/arithmetic/exact.mjs)

### P1-03 — Fix memory, range, and resume contracts

**v54 status: PASS.**

**Implementation requirement.** Use an initial profile of 2²⁰ integers per interval and at most 20,000 display samples. Store segment hashes and the base-prime bound; cancellation commits only the last complete segment.

**Acceptance criterion.** Splitting [2,10⁶] into 17 arbitrary intervals, computing, merging, and resuming must reproduce a single computation. A missing or duplicated segment must fail the completeness check.

**Evidence and implementation locators.** [primes.mjs:segmentedPrimes, verifyPrimeSegments, streamInterval](../mathscope-m1/arithmetic/primes.mjs); [exact.mjs:meter](../mathscope-m1/arithmetic/exact.mjs)

### P1-04 — Separate π, ψ, Li, and display error

**v54 status: PASS.**

**Implementation requirement.** Store π as an integer and ψ as a linear combination of logarithms, including prime powers, together with a real ball. Display the normalization difference between Li₂(x)=∫₂ˣ dt/log(t) and the conventional li(x).

**Acceptance criterion.** Verify ψ(10.5)=3log(2)+2log(3)+log(5)+log(7)=log(2520). Add each weight exactly once at a p^k boundary. Without an error bound, Li remains approximate.

**Evidence and implementation locators.** [primes.mjs:primeStatistics, logIntegerInterval](../mathscope-m1/arithmetic/primes.mjs)

### P1-05 — Handle large integers and primality certification

**v54 status: PASS.**

**Implementation requirement.** Use BigInt for endpoints and products beyond the safe-integer range of Number. Separate probable-prime output from verified primality certificates, and provide an independent verifier for the chosen certificate algorithm.

**Acceptance criterion.** The composite integers 341, 561, and 1105 cannot become PRIME_CERTIFIED. Unsupported certificates remain UNKNOWN; display colors do not promote proof grades.

**Evidence and implementation locators.** [primes.mjs:generatePrimeCertificate, verifyPrimeCertificate](../mathscope-m1/arithmetic/primes.mjs); [exact.mjs:bigint, powmod](../mathscope-m1/arithmetic/exact.mjs)

### P1-06 — Connect prime-indexed prisms to fibers of the same model

**v54 status: PASS.**

**Implementation requirement.** Store an integral model, minimal-model transformations, and smoothness/discriminant certificates, and create a BasePrism for each p. Only reduction maps between precision levels N are arrows in the precision tower.

**Acceptance criterion.** Reject direct addition of a coefficient at p=5 to an element of a p=7 ring. Distinguish primes where a chosen model's discriminant vanishes from bad reduction of the curve itself.

**Evidence and implementation locators.** [local-factors.mjs:integerModel, classifyReduction, localFactorBundle](../mathscope-m1/arithmetic/local-factors.mjs); [padic.mjs:addPadic, crystallinePrism](../mathscope-m1/arithmetic/padic.mjs)

### P1-07 — Collect good, bad, and archimedean factors

**v54 status: PASS.**

**Implementation requirement.** Each local factor records its prime, representation and Frobenius convention, good/bad decision, conductor, and source map. Store the archimedean gamma factor and global normalization as separate objects.

**Acceptance criterion.** A bundle containing only good-prime factors is INCOMPLETE_LOCAL_DATA. A product omitting bad-prime factors cannot be stored as the complete L(E,s).

**Evidence and implementation locators.** [local-factors.mjs:localFactorBundle](../mathscope-m1/arithmetic/local-factors.mjs)

### P1-08 — Fix the mathematical meaning of a 3D prime view

**v54 status: PASS.**

**Implementation requirement.** Allow finite-range scans, zoom, prime gaps, and normalized π error. Record whether the z coordinate represents an interval, cutoff, residue class, or cohomological degree in the view manifest.

**Acceptance criterion.** Camera rotation and level-of-detail reduction must preserve the raw-data hash and π. A sampled plot cannot be described as all primes or as a proof of the prime number theorem.

**Evidence and implementation locators.** [primes.mjs:primeView](../mathscope-m1/arithmetic/primes.mjs); [index.mjs:visualization](../mathscope-m1/arithmetic/index.mjs)


## P2 — Prisms, precision, complexes, and derived operations

### P2-01 — Check assumptions on a prism input

**v54 status: PASS.**

**Implementation requirement.** Record the delta structure on A, the Cartier condition on I, (p,I)-completeness, p∈I+φ(I)A, and boundedness, with declarations and supporting evidence. The first base is (ℤ_p,(p)) with φ=id.

**Acceptance criterion.** A fixture approving (ℤ/p^N,(p)) directly as a p-torsion-free prism must fail. Unverified assumptions remain in the admission list.

**Evidence and implementation locators.** [padic.mjs:crystallinePrism, validatePrismBase](../mathscope-m1/arithmetic/padic.mjs)

### P2-02 — Include precision loss in the type

**v54 status: PASS.**

**Implementation requirement.** Record p-adic precision N, coordinate degree D, Čech/cohomological degree H, root depth M, and q−1 or u degree U separately. To compute δ(a)=(φ(a)−a^p)/p to N digits, require at least N+1 input digits.

**Acceptance criterion.** Reject an N-digit delta output from only N input digits, or lower output precision to N−1. At p=3, detect that a=0 and a=3^N agree modulo 3^N while their delta values can differ modulo 3^N.

**Evidence and implementation locators.** [padic.mjs:deltaPadic, precisionFailureFixture](../mathscope-m1/arithmetic/padic.mjs); [complex.mjs:p1Model](../mathscope-m1/arithmetic/complex.mjs)

### P2-03 — Distinguish field rank from modules over finite rings

**v54 status: PASS.**

**Implementation requirement.** Forbid Gaussian elimination that divides by a nonunit over ℤ/p^N. Return Smith normal form, DVR invariant factors, or verifiable kernel/image presentations.

**Acceptance criterion.** The kernel and cokernel of multiplication by p on ℤ/p³ are both ℤ/p. Attempting to use p modulo p³ as an invertible pivot must fail.

**Evidence and implementation locators.** [padic.mjs:finiteRingModule, verifyFiniteRingModule](../mathscope-m1/arithmetic/padic.mjs); [exact.mjs:inverseUnit, determinant](../mathscope-m1/arithmetic/exact.mjs)

### P2-04 — Verify complexes, maps, and homotopies

**v54 status: PASS.**

**Implementation requirement.** Check d_(k+1)d_k=0, chain-map identities, and f−g=dh+hd over the original coefficient ring. Check a φ-semilinear map using D_k F_k=F_(k+1) σ(D_k).

**Acceptance criterion.** A mutation changing any one matrix entry must fail the relevant fixture. If verification is only modulo p^N, the result specification must remain modulo p^N.

**Evidence and implementation locators.** [complex.mjs:checkComplex, checkChainMap, checkRetraction](../mathscope-m1/arithmetic/complex.mjs); [exact.mjs:matrix](../mathscope-m1/arithmetic/exact.mjs)

### P2-05 — Specify truncation and boundary conventions

**v54 status: PASS.**

**Implementation requirement.** Treat a simple degree cutoff, quotient truncation, and smart truncation as different operations. Determine the valid target range before discarding terms sent outside a cutoff by d, φ, or multiplication.

**Acceptance criterion.** Do not approve a finite coordinate subspace as a subcomplex when d leaves it. Require the target degree D→pD for Frobenius on ℙ¹.

**Evidence and implementation locators.** [complex.mjs:subcomplexByBasis, filtration, p1Frobenius](../mathscope-m1/arithmetic/complex.mjs)

### P2-06 — Make derived base change an implementation contract

**v54 status: PASS.**

**Implementation requirement.** Tensor through a free/K-flat replacement or a Tor calculation. Do not automatically identify H(C)⊗B with H(C⊗^L B).

**Acceptance criterion.** For C=[ℤ_p --p→ ℤ_p], reduction modulo p gives a zero differential and H⁰=H¹=𝔽_p. Preserve a fixture showing the difference from simply tensoring the original H⁰=0.

**Evidence and implementation locators.** [complex.mjs:reduceFreeComplex](../mathscope-m1/arithmetic/complex.mjs); [padic.mjs:derivedReductionFixture](../mathscope-m1/arithmetic/padic.mjs)

### P2-07 — Give three filtrations distinct types

**v54 status: PASS.**

**Implementation requirement.** Distinguish the stupid degree filtration F^r C^k=C^k for k≥r, the de Rham form-degree Hodge filtration, and the Nygaard filtration induced by Frobenius divisibility. Nygaard requires the applicable theorem's base twist and descent assumptions.

**Acceptance criterion.** Check d-stability of F^r. Reject calling k≤r a cochain subcomplex without justification, or reporting cochain dimensions as filtration dimensions of H^k.

**Evidence and implementation locators.** [complex.mjs:filtration, subcomplexByBasis](../mathscope-m1/arithmetic/complex.mjs)

### P2-08 — Make verification artifacts independently replayable

**v54 status: PASS.**

**Implementation requirement.** Export matrices, bases, coefficient rings, precision, maps, and input hashes in one manifest. External calculators generate certificates; a small verifier checks them again.

**Acceptance criterion.** Recompute d² and module invariants from raw data without display decimals or 3D coordinates. Changing a ring or basis hash invalidates an existing certificate.

**Evidence and implementation locators.** [complex.mjs:verifyModel](../mathscope-m1/arithmetic/complex.mjs); [padic.mjs:verifyFiniteRingModule](../mathscope-m1/arithmetic/padic.mjs); [index.mjs:runJob](../mathscope-m1/arithmetic/index.mjs)


## P3 — Explicit point and projective-line comparison models

### P3-01 — Complete the base case of a point

**v54 status: PASS.**

**Implementation requirement.** For X=Spec 𝔽_p, record the complex ℤ_p[0] and φ=id. Return both the symbolic full object and a finite computation of C⊗^L ℤ/p^N.

**Acceptance criterion.** For p∈{2,3,5,7} and N∈{1,2,4,8}, verify H⁰=ℤ/p^N and H^k=0 for k≠0. Do not extend this to a formula for arbitrary X.

**Evidence and implementation locators.** [complex.mjs:pointModel, comparisonApplication](../mathscope-m1/arithmetic/complex.mjs)

### P3-02 — Build the actual geometric input and cover of ℙ¹

**v54 status: PASS.**

**Implementation requirement.** Use two charts t,s with s=t⁻¹ on the overlap. Record support for smoothness/properness of the lift and Čech descent premises; build an explicit total complex for polynomial degree D≥1.

**Acceptance criterion.** Recover the chart, form degree, and Čech degree of each basis vector. The sizes of C⁰,C¹,C² are respectively 2D+2, 4D+1, and 2D+1.

**Evidence and implementation locators.** [complex.mjs:p1Complex, comparisonApplication](../mathscope-m1/arithmetic/complex.mjs)

### P3-03 — Verify the D=1 golden matrices

**v54 status: PASS.**

**Implementation requirement.** Check the appendix's 5×4 matrix d₀ and 3×5 matrix d₁ over the integers. Certify Smith normal form and cohomology using unit minors and a chain decomposition.

**Acceptance criterion.** Verify d₁d₀=0. The nonzero Smith factors are (1,1,1) for d₀ and (1,1) for d₁. Obtain H⁰=A, H¹=0, and H²=A·[dt/t].

**Evidence and implementation locators.** [complex.mjs:p1Complex, p1Retraction, p1SmithCertificate](../mathscope-m1/arithmetic/complex.mjs)

### P3-04 — Prove contraction for all omitted coordinate degrees

**v54 status: PASS.**

**Implementation requirement.** Eliminate the complex of every nonzero Laurent weight using unit pivots. Give an explicit h for each summand added when D increases, and extend continuously to the p-adically completed limit.

**Acceptance criterion.** Prove dh+hd=id symbolically for every k≠0. Observing equal ranks at D=1,2,5 alone cannot promote the model to FULL_MODEL_CERTIFIED.

**Evidence and implementation locators.** [complex.mjs:weightContraction, COMPLETED_MODEL_PROOF](../mathscope-m1/arithmetic/complex.mjs); [lean/MathScope/M1/Arithmetic/Algebra.lean](../mathscope-m1/arithmetic/lean/MathScope/M1/Arithmetic/Algebra.lean)

### P3-05 — Compare finite-precision reductions

**v54 status: PASS.**

**Implementation requirement.** Store i,r,h between the completed model and a finite perfect replacement and verify that reduction modulo p^N preserves their identities.

**Acceptance criterion.** Results at N=1,2,4,8 must agree exactly after reduction to lower precision. Unexpected H² torsion indicates a denominator or cutoff error and must fail.

**Evidence and implementation locators.** [complex.mjs:p1Model, p1Retraction](../mathscope-m1/arithmetic/complex.mjs); [local-factors.mjs:verifyTowerReduction](../mathscope-m1/arithmetic/local-factors.mjs)

### P3-06 — Compute Frobenius at chain level

**v54 status: PASS.**

**Implementation requirement.** Construct C(D)→C(pD) using t↦t^p, s↦s^p, and d(t^p)=p t^(p−1)dt. Transport the map through i and r to the finite perfect model.

**Acceptance criterion.** After checking the integral chain-map identity, obtain F=1 on H⁰ and F=p on H². Keep a negative fixture where truncating the target back to D breaks the identity.

**Evidence and implementation locators.** [complex.mjs:p1Frobenius, checkChainMap](../mathscope-m1/arithmetic/complex.mjs)

### P3-07 — Certify the scope of actual prismatic comparison

**v54 status: PASS.**

**Implementation requirement.** Record the theorem application connecting S02 Corollary 3.8 to the crystalline comparison in S01. Explain why the twist disappears for the current base with φ_A=id.

**Acceptance criterion.** Require evidence for the geometric assumptions, lift, completed complex, and quasi-isomorphism before labeling the result PRISMATIC_VIA_COMPARISON. A literature theorem unavailable in Lean remains EXTERNAL_THEOREM, not FORMAL_COMPLETE.

**Evidence and implementation locators.** [complex.mjs:comparisonApplication, verifyModel](../mathscope-m1/arithmetic/complex.mjs); [sources.mjs:S01, S02](../mathscope-m1/arithmetic/sources.mjs)

### P3-08 — Inject errors and distinguish different models

**v54 status: PASS.**

**Implementation requirement.** Assign different object types to CW circles/tori, bare de Rham matrices, and the ℙ¹ comparison model. Separate certification of cup products and E∞ structure from certification of module cohomology.

**Acceptance criterion.** Reject a CW input relabeled as a prism, a cutoff without a contraction, an incorrect Frobenius target, and an unsupported assertion of E∞ formality.

**Evidence and implementation locators.** [complex.mjs:verifyModel](../mathscope-m1/arithmetic/complex.mjs); [index.mjs:getCapabilities](../mathscope-m1/arithmetic/index.mjs)


## Y1 — Concrete compact groups, representations, and Lie algebras

### Y1-01 — Fix the meaning of G and the supported unit

**v54 status: PASS.**

**Implementation requirement.** Input Cartan type, rank, connectedness, simple Lie algebra, and central quotient. Because SU(2) has a center, do not directly use the abstract-group predicate IsSimpleGroup for this purpose.

**Acceptance criterion.** SU(2) and SO(3) share a Lie algebra but have distinct globalForm IDs. Reject direct products without the required simplicity and ranks outside the supported range.

**Evidence and implementation locators.** [groups.mjs](../mathscope-m1/gauge/groups.mjs); [group-data.mjs](../mathscope-m1/gauge/group-data.mjs)

### Y1-02 — Store the root datum

**v54 status: PASS.**

**Implementation requirement.** Version the character and cocharacter lattices and their pairing, roots and coroots, and central quotient, as well as the Cartan matrix.

**Acceptance criterion.** Check integral pairings and Cartan conditions exactly. If global form is missing, leave global topology and representation-faithfulness features in a prepared state.

**Evidence and implementation locators.** [generate_groups.py](../mathscope-m1/gauge/generate_groups.py); [group-data.mjs](../mathscope-m1/gauge/group-data.mjs)

### Y1-03 — Generate a basis and structure constants

**v54 status: PASS.**

**Implementation requirement.** Export a Chevalley basis and sparse bracket table in a fixed order. Use computer algebra as a generator and an independent checker to verify the data.

**Acceptance criterion.** For all basis elements, the finite sums for antisymmetry and Jacobi must be exactly zero. Random sampling is not accepted as a proof of the full Jacobi identity.

**Evidence and implementation locators.** [generate_groups.py](../mathscope-m1/gauge/generate_groups.py); [exact.mjs](../mathscope-m1/gauge/exact.mjs); [lean/MathScope/M1/Gauge/SU3.lean](../mathscope-m1/gauge/lean/MathScope/M1/Gauge/SU3.lean); [lean/MathScope/M1/Gauge/G2.lean](../mathscope-m1/gauge/lean/MathScope/M1/Gauge/G2.lean)

### Y1-04 — Connect the compact real form

**v54 status: PASS.**

**Implementation requirement.** Record the coefficient field and change of basis from a complex Chevalley basis to the compact real form. Specify signs and normalizations for i h, e_α−e_−α, i(e_α+e_−α), and related vectors.

**Acceptance criterion.** Transformed brackets have real coefficients and T†=−T in the selected unitary representation. Reject a split real form labeled as compact.

**Evidence and implementation locators.** [generate_groups.py](../mathscope-m1/gauge/generate_groups.py); [group-data.mjs](../mathscope-m1/gauge/group-data.mjs); [groups.mjs](../mathscope-m1/gauge/groups.mjs)

### Y1-05 — Certify the storage representation of group elements

**v54 status: PASS.**

**Implementation requirement.** Choose R_store:G→U(d). If a representation loses central information, as with a vector representation of Spin, store additional global data or choose a faithful representation.

**Acceptance criterion.** Check multiplication, inverse, identity, and representation-kernel contracts. Faithfulness on the Lie algebra alone does not establish faithfulness of the global group representation.

**Evidence and implementation locators.** [matrix.mjs](../mathscope-m1/gauge/matrix.mjs); [groups.mjs](../mathscope-m1/gauge/groups.mjs); [holonomy.mjs](../mathscope-m1/gauge/holonomy.mjs); [lean/MathScope/M1/Gauge/Transport.lean](../mathscope-m1/gauge/lean/MathScope/M1/Gauge/Transport.lean)

### Y1-06 — Fix the invariant form and action representation

**v54 status: PASS.**

**Implementation requirement.** Record B_G, the long-root normalization, and the trace index of R_action. The storage representation and action representation may differ.

**Acceptance criterion.** Check B([X,Y],Z)=B(X,[Y,Z]) and positive definiteness. Mark an action insensitive to the center as an intentional choice; do not copy β=2N/g₀² from SU(N) to arbitrary G.

**Evidence and implementation locators.** [generate_groups.py](../mathscope-m1/gauge/generate_groups.py); [groups.mjs](../mathscope-m1/gauge/groups.mjs); [holonomy.mjs](../mathscope-m1/gauge/holonomy.mjs)

### Y1-07 — Register family adapters and resource limits

**v54 status: PASS.**

**Implementation requirement.** Use a common interface for SU(N), Sp(N), Spin(N)/permitted quotients, G₂, F₄, E₆, E₇, and E₈, with separate implementation and certification states.

**Acceptance criterion.** Give a group the concrete state only when its arithmetic, exponential, representation dimension, and certificates exist. An adapter with only an added string name is metadata.

**Evidence and implementation locators.** [index.mjs](../mathscope-m1/gauge/index.mjs); [groups.mjs](../mathscope-m1/gauge/groups.mjs); [group-data.mjs](../mathscope-m1/gauge/group-data.mjs)

### Y1-08 — Separate exact certificates from floating-point regression

**v54 status: PASS.**

**Implementation requirement.** Keep exact coefficient certificates as Lean targets and float64 checks as rendering/numerical-engine tests. Provide small fixtures and error criteria depending on conditioning.

**Acceptance criterion.** Use normalized unitary and multiplication residual targets of 10⁻¹⁰ for small SU(2)/SU(3) matrices. Disable quantitative claims for larger representations without separate tolerances and error budgets.

**Evidence and implementation locators.** [matrix.mjs](../mathscope-m1/gauge/matrix.mjs); [exact.mjs](../mathscope-m1/gauge/exact.mjs); [tests.mjs](../mathscope-m1/gauge/tests.mjs); [lean/lean-audit.json](../mathscope-m1/gauge/lean/lean-audit.json)


## Y2 — Actual four-dimensional classical gauge fields

### Y2-01 — Declare the 4D domain and boundary

**v54 status: PASS.**

**Implementation requirement.** Distinguish an observation window of an ℝ⁴ solution, a finite box, and a periodic torus. Input coordinates, units, orientation, the meaning of x₄, and boundary transition data.

**Acceptance criterion.** A truncated ℝ⁴ BPST field pasted onto a periodic grid is not automatically an exact torus solution. Record tail error for a window and seam checks for a periodic model.

**Evidence and implementation locators.** [fields.mjs](../mathscope-m1/gauge/fields.mjs); [observations.mjs](../mathscope-m1/gauge/observations.mjs); [index.mjs](../mathscope-m1/gauge/index.mjs)

### Y2-02 — Certify an SU(2)→G embedding

**v54 status: PASS.**

**Implementation requirement.** Provide a linear map ι on the basis and, where possible, a global group homomorphism. Distinguish the group map's kernel from injectivity of the Lie algebra map.

**Acceptance criterion.** Check ι([X,Y])=[ιX,ιY] exactly for every pair of generators. A Lie algebra certificate alone cannot establish claims about the global group or bundle.

**Evidence and implementation locators.** [generate_groups.py](../mathscope-m1/gauge/generate_groups.py); [fields.mjs](../mathscope-m1/gauge/fields.mjs); [groups.mjs](../mathscope-m1/gauge/groups.mjs); [lean/MathScope/M1/Gauge/G2.lean](../mathscope-m1/gauge/lean/MathScope/M1/Gauge/G2.lean)

### Y2-03 — Transport normalization using the embedding index

**v54 status: PASS.**

**Implementation requirement.** Calculate B_G(ιX,ιY)=I_ι B_SU2(X,Y) for fixed basic forms. Distinguish the representation trace index from the embedding index.

**Acceptance criterion.** The same I_ι must be obtained from the basis Gram matrix and included in action and topological densities. Reject copying a unit-charge SU(2) density to an arbitrary embedding unchanged.

**Evidence and implementation locators.** [generate_groups.py](../mathscope-m1/gauge/generate_groups.py); [fields.mjs](../mathscope-m1/gauge/fields.mjs); [family.mjs](../mathscope-m1/gauge/family.mjs); [index.mjs](../mathscope-m1/gauge/index.mjs)

### Y2-04 — Lift the BPST reference to an actual G-field

**v54 status: PASS.**

**Implementation requirement.** Calculate A_G=ι(A_BPST) and F_G=ι(F_BPST), with center x₀, size ρ, and orientation. This is a particular family of classical G-fields.

**Acceptance criterion.** Check F(A_G)=ι(F(A)) and the self-duality sign. In the same normalization, finite-window integrals with tail correction must converge to I_ι and 8π²I_ι/g².

**Evidence and implementation locators.** [fields.mjs](../mathscope-m1/gauge/fields.mjs); [tests.mjs](../mathscope-m1/gauge/tests.mjs)

### Y2-05 — Generate test fields using the full basis of G

**v54 status: PASS.**

**Implementation requirement.** Provide smooth finite families A_μ(x)=Σ_(a,m) c_(μ,a,m) φ_m(x) T_a. Actually compute components outside the embedded subalgebra.

**Acceptance criterion.** Curvature F_μν=∂_μ A_ν−∂_ν A_μ+[A_μ,A_ν] calculated from basis coefficients must agree with a matrix-commutator calculation. Do not label an off-shell test field as a Yang–Mills solution.

**Evidence and implementation locators.** [fields.mjs](../mathscope-m1/gauge/fields.mjs); [index.mjs](../mathscope-m1/gauge/index.mjs)

### Y2-06 — Separate solution residuals and conserved quantities

**v54 status: PASS.**

**Implementation requirement.** Calculate D_μ F_μν residuals, Bianchi residuals, action, and topological density. Compare analytic differentiation with lattice differentiation as separate paths.

**Acceptance criterion.** Check the theoretical zero BPST residual and numerical convergence. Do not hide nonzero residuals of test fields or effective perturbations, including by color normalization.

**Evidence and implementation locators.** [fields.mjs](../mathscope-m1/gauge/fields.mjs); [tests.mjs](../mathscope-m1/gauge/tests.mjs)

### Y2-07 — Test gauge transformations and observables

**v54 status: PASS.**

**Implementation requirement.** Fix the transformation law for A under the convention D=d+A. Distinguish gauge-dependent A,F components from invariant B_G(F,F) and appropriate traces.

**Acceptance criterion.** Invariant density before and after a nonconstant gauge transformation must agree within the stated error. Changed arrows alone do not imply a physical change of field.

**Evidence and implementation locators.** [fields.mjs](../mathscope-m1/gauge/fields.mjs); [holonomy.mjs](../mathscope-m1/gauge/holonomy.mjs)

### Y2-08 — Export the classical-field construction record

**v54 status: PASS.**

**Implementation requirement.** Bind G, ι, I_ι, ρ, x₀, basis coefficients, boundary, differentiation method, normalization, and seed into one field revision.

**Acceptance criterion.** The same manifest reproduces A, F, and observables. A change to G or ι makes caches, projections, and related proof states stale.

**Evidence and implementation locators.** [index.mjs](../mathscope-m1/gauge/index.mjs); [family.mjs](../mathscope-m1/gauge/family.mjs); [observations.mjs](../mathscope-m1/gauge/observations.mjs); [tests.mjs](../mathscope-m1/gauge/tests.mjs)


## N1 — Source edition, theorem, and proof-evidence scope

### N1-01 — Identify the attached edition

**v54 status: PASS.**

**Implementation requirement.** Pin the 166-page OpenAI paper Finite Time Blowup for Navier–Stokes. Its attached SHA-256 is 0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f.

**Acceptance criterion.** All 166 pages must be readable and the hash must match. A different edition creates a separate edition record and is not substituted automatically.

**Evidence and implementation locators.** [sources.lock.json](../mathscope-m1/navier/sources.lock.json); [paper-reference-map.json](../mathscope-m1/navier/paper-reference-map.json)

### N1-02 — Write the Theorem 1.1 contract

**v54 status: PASS.**

**Implementation requirement.** Store separately ν>0, u₀=0, f∈C_c^∞(ℝ³×(0,∞)), t∈[0,1), fixed spatial support, bounded L², and unbounded L∞.

**Acceptance criterion.** Connect every assumption, quantifier, and conclusion to page 1 or pages 123–126. Reject adding f=0 or a velocity smooth at t=1 to the conclusion.

**Evidence and implementation locators.** [theorem-contract.json](../mathscope-m1/navier/theorem-contract.json); `N00 p1,p118,p120,pp123-126`

### N1-03 — Map the structure of all 166 pages

**v54 status: PASS.**

**Implementation requirement.** Map sections 1–10, Appendices A–C, and the references without gaps. Preserve boundaries where a section changes within a page.

**Acceptance criterion.** Cover pages 1–166 and make the path Theorem 4.6→5.5→7.5→9.6→9.9→10.1→10.3→1.1 navigable.

**Evidence and implementation locators.** [paper-reference-map.json](../mathscope-m1/navier/paper-reference-map.json)

### N1-04 — Separate official announcement states

**v54 status: PASS.**

**Implementation requirement.** Record OpenAI's announcement of C/D and public Lean proofs separately from Clay's 2026-09-11 'apparently settled' notice and review procedure.

**Acceptance criterion.** Store retrieval dates, URLs, and document dates. Do not claim a final Clay award or a solution of unforced A/B without supporting evidence.

**Evidence and implementation locators.** `sources.lock.json publicStatus`

### N1-05 — Pin the official Lean environment

**v54 status: PARTIAL.**

**Implementation requirement.** Pin the official repository commit, lean-toolchain, and lake-manifest. Read the then-current Lean 4.34.0-rc2/Mathlib/Lake instructions without automatically mixing later updates.

**Acceptance criterion.** For the selected commit, preserve exit codes, full logs, and environment hashes for lake exe cache get and lake build. The original blueprint stated that no rebuild had been performed at its date.

**Evidence and implementation locators.** [sources.lock.json](../mathscope-m1/navier/sources.lock.json); [official-validation/official-audit-summary.json](../mathscope-m1/navier/official-validation/official-audit-summary.json); [official-validation/full-pinned-command-results.json](../mathscope-m1/navier/official-validation/full-pinned-command-results.json); [followup-20261009-default-build/interruption-observation-1750.json](../mathscope-m1/navier/followup-20261009-default-build/interruption-observation-1750.json); [original-build-release-snapshots/20261009T181519Z/snapshot.json](../mathscope-m1/navier/original-build-release-snapshots/20261009T181519Z/snapshot.json); [original-build-release-snapshots/20261009T181519Z/SNAPSHOT_MANIFEST.json](../mathscope-m1/navier/original-build-release-snapshots/20261009T181519Z/SNAPSHOT_MANIFEST.json)

### N1-06 — Check theorem dependencies and the Comparator

**v54 status: PARTIAL.**

**Implementation requirement.** Trace NavierStokes.lean→ComparatorSolution/PaperResults and ComparatorSolution→ComparatorR3Theorem/ComparatorTheorem, and compare them with the C/D references.

**Acceptance criterion.** Store #print axioms output for the actual submitted theorems and the Comparator results. Do not confuse deliberate sorry placeholders in the challenge with dependencies of the proof root.

**Evidence and implementation locators.** [formal-import-map.json](../mathscope-m1/navier/formal-import-map.json); [formal-adapters.json](../mathscope-m1/navier/formal-adapters.json); [evidence/lean-validation.json](../mathscope-m1/navier/evidence/lean-validation.json); [official-validation/submitted-source-import-map.json](../mathscope-m1/navier/official-validation/submitted-source-import-map.json); [official-validation/ns-pinned-declarations.log](../mathscope-m1/navier/official-validation/ns-pinned-declarations.log); [official-validation/official-audit-summary.json](../mathscope-m1/navier/official-validation/official-audit-summary.json); [official-validation/comparator-pinned-guarded.json](../mathscope-m1/navier/official-validation/comparator-pinned-guarded.json); [official-validation/comparator-environment-independent.json](../mathscope-m1/navier/official-validation/comparator-environment-independent.json); [official-validation/PinnedDeclarations.lean](../mathscope-m1/navier/official-validation/PinnedDeclarations.lean); [official-validation/full-pinned-command-results.json](../mathscope-m1/navier/official-validation/full-pinned-command-results.json); [followup-construction/axis-pinned-audit.json](../mathscope-m1/navier/followup-construction/axis-pinned-audit.json)

### N1-07 — Define representation grades

**v54 status: PASS.**

**Implementation requirement.** Give theorem descriptions, direct source formulas, numerical profiles, finite correction stages, certified approximations, and separate reference solutions distinct states.

**Acceptance criterion.** No path may automatically promote the current exterior and Gaussian-core schematic to a fully reconstructed solution. Screens and exports must show the same grade.

**Evidence and implementation locators.** [evidence-grades.json](../mathscope-m1/navier/evidence-grades.json); [index.mjs](../mathscope-m1/navier/index.mjs); [evidence/numerical-validation.json](../mathscope-m1/navier/evidence/numerical-validation.json)

### N1-08 — Fix what success and failure mean

**v54 status: PASS.**

**Implementation requirement.** A numerical residual passing establishes consistency only on its finite domain and precision. Keep verification of the paper's proof separate from verification of the numerical implementation.

**Acceptance criterion.** First record a test failure as an implementation, parameter, or resolution failure. A plot alone cannot declare a refutation of the paper or a new blowup proof.

**Evidence and implementation locators.** [README.md](../mathscope-m1/navier/README.md); `index.mjs contract`; [evidence/numerical-validation.json](../mathscope-m1/navier/evidence/numerical-validation.json)


## N2 — Coordinates, viscosity, exterior, and reference solutions

### N2-01 — Implement the actual similarity coordinates

**v54 status: PASS.**

**Implementation requirement.** Use τ=q(1−η²), z=q^(1/2−h)η, and X=r²/(2q). Solve q−z²q^(2h)=τ with a bracketed solver and recover signed η.

**Acceptance criterion.** Check the uniqueness lower bound L=1−2hη²≥1−2h>0. Compare round-trip error with at least 80-bit reference computation and retain τ as an independent variable.

**Evidence and implementation locators.** [coordinates.mjs](../mathscope-m1/navier/coordinates.mjs); [evidence/high-precision-fixtures.json](../mathscope-m1/navier/evidence/high-precision-fixtures.json); [evidence/numerical-validation.json](../mathscope-m1/navier/evidence/numerical-validation.json); `Analytic.coordinate_denominator_positive`

### N2-02 — Check derivative chain rules

**v54 status: PASS.**

**Implementation requirement.** Use T_b and Z_b from equation (4.2). Do not hold q,η,X constant when computing time or axial derivatives.

**Acceptance criterion.** For constant and monomial profiles q^b X^a η^c, direct Cartesian derivatives and transformed derivatives must agree. The normalized reference error target is 10⁻¹⁰.

**Evidence and implementation locators.** `checks.mjs coordinateChecks`; `numerical-validation.json`

### N2-03 — Rescale viscosity

**v54 status: PASS.**

**Implementation requirement.** Apply u_ν=√ν u₁(x/√ν,t), p_ν=ν p₁, and f_ν=√ν f₁, and scale both radial and axial coordinates by √ν.

**Acceptance criterion.** For ν=0.1,1,3, check PDE rescaling and ‖u_ν‖₂²=ν^(5/2)‖u₁‖₂². Values ν≤0 are invalid in this rescaling mode.

**Evidence and implementation locators.** [heat.mjs](../mathscope-m1/navier/heat.mjs); `index.mjs viscosityEnergyCheck`; `numerical-validation.json`

### N2-04 — Integrate the heat factor and bound its tail

**v54 status: PASS.**

**Implementation requirement.** Use H(Z)=Γ(1+h)^−1 ∫₀∞ e^(−v) v^h (1+Zv)^−h dv and derivative integrals. Bound the portion after a cutoff V using incomplete-gamma bounds.

**Acceptance criterion.** Verify H(0)=1, H′(0)=−h(1+h), and H″(0)=h(1+h)²(2+h). The sum of quadrature error, tail error, and rounding error must stay below the stated target.

**Evidence and implementation locators.** [heat.mjs](../mathscope-m1/navier/heat.mjs); [numerics.mjs](../mathscope-m1/navier/numerics.mjs); `numerical-validation.json certified_heat_*`

### N2-05 — Independently check the heat ODE and NS residual

**v54 status: PASS.**

**Implementation requirement.** Check Z²H″+[1+(2+2h)Z]H′+h(1+h)H=0 and K_t=K_rr+r⁻¹K_r−r⁻²K.

**Acceptance criterion.** Use a normalized residual target of 10⁻⁹ and check convergence at doubled precision and with a different differentiation path. For r>0, include p_r=K²/r in the full momentum residual.

**Evidence and implementation locators.** [checks.mjs](../mathscope-m1/navier/checks.mjs); `high-precision-fixtures.json`; `numerical-validation.json`

### N2-06 — Define axis, normalization, and support contracts

**v54 status: PASS.**

**Implementation requirement.** Use K=c_∞ s^−A H(2τ/s), s=r²/2. The setting c_∞=1 is an arbitrary display normalization, to be replaced by the actual N3 value later.

**Acceptance criterion.** Keep the exclusion r=0 in exported data. Do not automatically identify the z-independent exterior with a finite-energy solution on all ℝ³ or connect it to an actual core.

**Evidence and implementation locators.** `heat.mjs exteriorPoint`; `index.mjs exteriorJob`; `numerical-validation.json`

### N2-07 — Implement a Taylor–Green reference solution

**v54 status: PASS.**

**Implementation requirement.** On a 2π-periodic domain use u=(a sin(x)cos(y),−a cos(x)sin(y),0), a=e^(−2νt), and p=a²(cos(2x)+cos(2y))/4.

**Acceptance criterion.** Check mean energy a²/4, mean enstrophy a²/2, mean dissipation νa², and dE/dt=−νa². Reversing the positive pressure sign must fail.

**Evidence and implementation locators.** `heat.mjs taylorGreenPoint`; [checks.mjs](../mathscope-m1/navier/checks.mjs); `numerical-validation.json`

### N2-08 — Define error budgets and negative controls

**v54 status: PASS.**

**Implementation requirement.** Specify the denominator of normalized residuals, the norm, and sampling locations. Design fixtures that deliberately reverse the −r⁻²K heat term, omit pressure, or use the wrong ν.

**Acceptance criterion.** Only the correct formulas pass, and all three errors are detected. A test that merely copies the computation does not count as independent verification.

**Evidence and implementation locators.** [checks.mjs](../mathscope-m1/navier/checks.mjs); `numerical-validation.json`


## N3 — The actual inner–annulus–exterior leading profile

### N3-01 — Make the order of constant selection executable

**v54 status: PARTIAL.**

**Implementation requirement.** Fix the order in (A.6) and (B.40): M_d→T_d=e^(M_d)+10→P_*→λ→h→matching tolerance,j₀→δ_*,σ_*,Λ→T_sh→C,X_R→transition widths→N.

**Acceptance criterion.** Replace every 'sufficiently large/small' requirement with an explicit bound or a proved selection condition. Do not substitute a UI example such as h=.005 for a certified choice.

**Evidence and implementation locators.** [followup-construction/axis-default-certificate.json](../mathscope-m1/navier/followup-construction/axis-default-certificate.json); [followup-construction/pressure-analytic-fixture.json](../mathscope-m1/navier/followup-construction/pressure-analytic-fixture.json); [followup-construction/axis-source-default-certificate.json](../mathscope-m1/navier/followup-construction/axis-source-default-certificate.json); [followup-construction/axis-pinned-audit.json](../mathscope-m1/navier/followup-construction/axis-pinned-audit.json); [followup-construction/source-inner-gluing-contract.json](../mathscope-m1/navier/followup-construction/source-inner-gluing-contract.json)

### N3-02 — Construct the outer radial schedule and pressure datum

**v54 status: PARTIAL.**

**Implementation requirement.** Determine Π_axis using the smooth step (A.5), radial schedules (A.7)–(A.13), Proposition A.4, and Lemma A.5.

**Acceptance criterion.** Verify E>0 and the outer moments, with four disjoint reserved patches. When replacing the far-field power law by the heat exterior, restore the pressure datum using the compensation in A.7.

**Evidence and implementation locators.** [followup-construction/outer.mjs](../mathscope-m1/navier/followup-construction/outer.mjs); [followup-construction/outer-validation.json](../mathscope-m1/navier/followup-construction/outer-validation.json); [followup-construction/outer-independent-reference.json](../mathscope-m1/navier/followup-construction/outer-independent-reference.json); [followup-construction/pressure-analytic-fixture.json](../mathscope-m1/navier/followup-construction/pressure-analytic-fixture.json); [followup-construction/pressure-analytic-independent.json](../mathscope-m1/navier/followup-construction/pressure-analytic-independent.json)

### N3-03 — Construct axis data and a convergent power series

**v54 status: PARTIAL.**

**Implementation requirement.** Solve the nonlinear fixed-point problem in Appendix B using U_*=4η+j₀, φ_*=exp(Λ∫ζ_*), and Y=ΛX.

**Acceptance criterion.** Certify an invariant ball in the B_ρ norm and a contraction bound below 1, or retain uncertified status. Check the fixtures f₀(4.1)=0.2711140554… and φ/φ_*>0.

**Evidence and implementation locators.** [axis-series.mjs](../mathscope-m1/navier/axis-series.mjs); [followup-construction/axis-default-certificate.json](../mathscope-m1/navier/followup-construction/axis-default-certificate.json); [followup-construction/axis-source-default-certificate.json](../mathscope-m1/navier/followup-construction/axis-source-default-certificate.json); [followup-construction/axis-source-validation-manifest.json](../mathscope-m1/navier/followup-construction/axis-source-validation-manifest.json); [followup-construction/axis-pinned-audit.json](../mathscope-m1/navier/followup-construction/axis-pinned-audit.json)

### N3-04 — Recover the actual core pressure and radial velocity

**v54 status: PARTIAL.**

**Implementation requirement.** Use E=√(2X)φ/C, Π_X=E²/(2X), and V₀=(X/L)[2ηU−2Dη A_X(U)−d∂_η A_X(U)].

**Acceptance criterion.** Verify Cartesian regularity at the axis and div u₀=0 as identities. Only the leading tangential residual in (4.13) vanishes; axial viscosity and other terms remain separately recorded residuals.

**Evidence and implementation locators.** [axis-series.mjs](../mathscope-m1/navier/axis-series.mjs); [checks.mjs](../mathscope-m1/navier/checks.mjs); [followup-construction/controlled-continuation.mjs](../mathscope-m1/navier/followup-construction/controlled-continuation.mjs); [followup-construction/continuation-source-formula-independent.json](../mathscope-m1/navier/followup-construction/continuation-source-formula-independent.json); [followup-construction/ns-source-formula-correction.json](../mathscope-m1/navier/followup-construction/ns-source-formula-correction.json)

### N3-05 — Continue the inner profile and glue five moments

**v54 status: BLOCKED.**

**Implementation requirement.** Connect the inner profile following B.5–B.10, and match M,I,J,S,C_p using five bumps.

**Acceptance criterion.** Check invertibility of the 5×5 moment Jacobian and interval-Newton/implicit-function conditions. Joining values while omitting cumulative moments must fail.

**Evidence and implementation locators.** [followup-construction/source-inner-gluing.mjs](../mathscope-m1/navier/followup-construction/source-inner-gluing.mjs); [followup-construction/source-inner-gluing-contract.json](../mathscope-m1/navier/followup-construction/source-inner-gluing-contract.json); [followup-construction/source-inner-gluing-tests.json](../mathscope-m1/navier/followup-construction/source-inner-gluing-tests.json); [followup-construction/source-inner-gluing-independent.json](../mathscope-m1/navier/followup-construction/source-inner-gluing-independent.json); [followup-construction/source-inner-gluing-history.json](../mathscope-m1/navier/followup-construction/source-inner-gluing-history.json); [followup-construction/source-inner-gluing-final-evidence-binding.json](../mathscope-m1/navier/followup-construction/source-inner-gluing-final-evidence-binding.json)

### N3-06 — Apply radial modulation of the cone

**v54 status: BLOCKED.**

**Implementation requirement.** Use (C.12) with the N log X phase from Appendix C, and restore all moments in the first reserved patch.

**Acceptance criterion.** Measure the O(N⁻¹) value change and order-one radial derivative change separately. After fixing a finite N, certify a strict margin κ>0 in (4.26) over the entire interval.

**Evidence and implementation locators.** [followup-construction/admissible-loop.mjs](../mathscope-m1/navier/followup-construction/admissible-loop.mjs); [followup-construction/source-radial-modulation.mjs](../mathscope-m1/navier/followup-construction/source-radial-modulation.mjs); [followup-construction/source-radial-modulation-contract.json](../mathscope-m1/navier/followup-construction/source-radial-modulation-contract.json); [followup-construction/c12-source-formula-independent.json](../mathscope-m1/navier/followup-construction/c12-source-formula-independent.json); [followup-construction/source-correction-independent.json](../mathscope-m1/navier/followup-construction/source-correction-independent.json)

### N3-07 — Check support, endpoints, and reserved patches

**v54 status: PARTIAL.**

**Implementation requirement.** Check T₀=0 for X≤X_a or X≥X_b, T₀≠0 in the interior, and ζ=exp(−t₁²/log²(X/X_a)−4/log²(X_b/X)).

**Acceptance criterion.** Check the edge limit of n=T₀/|T₀|, inner/outer flatness, and unmodified power laws on I_pos and I_mean. Never evaluate 0/0 directly at the edge.

**Evidence and implementation locators.** [radial.mjs](../mathscope-m1/navier/radial.mjs); [followup-construction/outer.mjs](../mathscope-m1/navier/followup-construction/outer.mjs); [followup-construction/source-inner-gluing-contract.json](../mathscope-m1/navier/followup-construction/source-inner-gluing-contract.json); [followup-construction/source-radial-modulation-contract.json](../mathscope-m1/navier/followup-construction/source-radial-modulation-contract.json)

### N3-08 — Define the leading-profile data contract

**v54 status: PASS.**

**Implementation requirement.** Bind each profile, derivative, moment, cone margin, support, and error to the same edition and constant hashes, and compare them visually with the source formulas.

**Acceptance criterion.** Every clause of Theorem 4.6(i)–(vi) must link to numerical/analytic evidence or an explicit unresolved reason. If any clause lacks coverage, block the full certified profile grade.

**Evidence and implementation locators.** `profile.mjs profileDataContract/theoremClauses`; `leading-profile-candidate.json`; [index.mjs](../mathscope-m1/navier/index.mjs)

## Translation and provenance

The complete Korean source entries remain byte-for-byte intact. English wording is stored outside the mathematical source tree and cannot change a request, result, proof, source pin, or acceptance status. The machine-readable companion includes a digest for each original record and digests for the original criteria and assessment files.

N1-05 preserves the blueprint’s historical statement that no rebuild had been performed when it was written. Later selected builds and the release-time full-build snapshot are described in [EVIDENCE_AND_PROVENANCE_EN.md](EVIDENCE_AND_PROVENANCE_EN.md). N1-04 likewise translates the original dated announcement requirement; it is not a claim about a later award or review decision.
