# Mathematical objects and interpretation

The baseline is **v54 / `16f4f911`**. The criterion-level status is recorded in the [70-entry English companion](ACCEPTANCE_CRITERIA_EN.md), with each original ID unchanged. A PASS is assessed within the supported object and operation named by that criterion. It is not a universal claim about every object in the surrounding subject.

## M0: one mathematical object across computation, display, and evidence

An M1 request binds the actual object, coefficient domain, source version, precision, resource budget, and assumptions. A view is an observation of that object. An evidence record says which procedure was run and what it established. Object and assumption revisions invalidate incompatible saved results.

For example, a 3D projection does not overwrite a four-dimensional gauge field. Its manifest records the map, sampled domain, observation quantity, and information lost. A stored mass-gap assumption is not inferred from the image. Likewise, a theorem reference can identify a relevant result without claiming that the current numerical array instantiates its hypotheses.

The six completed M0 additions implement the general group/state-family contract, precision consumption, independent cross-checks, finite algebraic formalization bindings, explicit analytic assumptions, and external comparison-theorem adapters. A fresh replay recomputes a request and compares its mathematical output; reading an old JSON bundle does not count as replay.

## Prime sets and finite arithmetic

`PrimeSet` is an infinite logical specification. A completed computation is a finite interval with endpoints, budget, base-prime coverage, segment hashes, and certification scope. Segments can be merged or resumed only when their coverage data is consistent. Missing or duplicate segments invalidate completeness.

Exact integer and rational operations are kept separate from logarithmic real enclosures and ordinary numerical approximations. The prime-counting function π is integral. The Chebyshev function ψ includes prime powers and can be represented as an exact linear combination of logarithms with a numerical enclosure. Li₂ uses the normalization

$$
\operatorname{Li}_2(x)=\int_2^x\frac{dt}{\log t}.
$$

That differs by an additive constant from a conventional normalization of `li`. A Li₂ computation without a proved error bound remains approximate. A 3D view of a finite prime distribution does not establish the prime number theorem or RH.

Large endpoints and certificate integers use BigInt. Probable-prime and verified-prime results are distinct. An unsupported certificate is UNKNOWN, and the verifier does not promote a result based on color, sampling, or a generator's assertion.

## p-adic precision, complexes, and derived reduction

The first base prism is the mathematical pair `(ℤ_p,(p))` with identity Frobenius. A finite ring `ℤ/p^N` is an observation at precision N, not itself silently approved as a p-torsion-free prism. The actual input records the delta structure, Cartier and completeness assumptions, boundedness, and any unverified admissions.

The delta operation divides by p:

$$
\delta(a)=\frac{\varphi(a)-a^p}{p}.
$$

Computing N digits generally requires an extra input digit. A recoverable exact integer can supply more digits. Otherwise the request is rejected or its certified output precision is reduced. Ring and precision mismatches cannot be repaired by interpreting residues as display decimals.

Over `ℤ/p^N`, nonunits are not inverted as Gaussian-elimination pivots. Smith normal form and module presentations retain torsion. Derived reduction records Tor effects: the complex `[ℤ_p --p→ ℤ_p]` reduces to a zero differential modulo p, so both cohomological degrees survive. Tensoring only the original cohomology would lose information.

Complexes, chain maps, and homotopies are checked over their actual rings. A Frobenius-semilinear map is checked with the appropriate coefficient automorphism. Truncation must be an explicitly valid operation; discarding terms outside an arbitrary cutoff can break the differential, product, or Frobenius identity.

## The point and ℙ¹ comparison models

For `Spec 𝔽_p`, the symbolic comparison object is `ℤ_p[0]`, with finite reduction `ℤ/p^N[0]`. Its degree-zero cohomology is `ℤ/p^N`; other degrees vanish.

The projective-line model uses charts t and s, with s=t⁻¹ on their overlap, and an explicit integral total Čech–de Rham complex. For D≥1 its ranks are

$$
\operatorname{rank} C^0=2D+2,\qquad
\operatorname{rank} C^1=4D+1,\qquad
\operatorname{rank} C^2=2D+1.
$$

At D=1, d₀ is 5×4 and d₁ is 3×5. Their nonzero Smith factors are `(1,1,1)` and `(1,1)` respectively. The resulting free cohomology ranks are `(1,0,1)`, with the top class represented by `dt/t`.

All nonzero Laurent weights have explicit contractions using unit coefficients. The supporting symbolic and Lean identities do not divide by a weight k that might be divisible by p. The original mathematical explanation separately justifies extending the integral operations to the completed model. Observing stable ranks at a few cutoffs is not the proof of this extension.

Frobenius is a map **C(D)→C(pD)**, induced by `t↦t^p` and `d(t^p)=p t^(p−1)dt`. Transport to the finite perfect replacement gives F=1 on H⁰ and F=p on H². Forcing the target back to C(D) can destroy the chain-map identity and is covered by a negative fixture.

The prismatic interpretation uses the specified crystalline/de Rham comparison theorems and geometric hypotheses. The external comparison theorem is recorded as an external theorem where it has not been imported into Lean. This package does not implement a general prismatic site, arbitrary perfectoid geometry, a universal E∞ model, or an automatic Nygaard-filtration theorem.

Sources: Bhatt–Scholze, [Prisms and Prismatic Cohomology](https://people.mpim-bonn.mpg.de/scholze/prisms.pdf), together with the exact S01/S02 references and theorem-application records in the unchanged arithmetic source map. A theorem-application record and a newly checked Lean instantiation remain different evidence grades.

## Frobenius, Euler factors, and BSD/RH connections

The arithmetic module links finite-field point counts, Frobenius conventions, precision towers, and local Euler factors for the same arithmetic model. At a good prime of an elliptic curve,

$$
a_p=p+1-\#E(\mathbb F_p),\qquad
P_p(E,T)=1-a_pT+pT^2.
$$

Bad-prime data and archimedean factors are separate recorded objects. A bundle of good-prime factors alone is incomplete local data. A finite Euler product is not the complete analytically continued L-function and cannot establish an order of vanishing at s=1.

Known-case BSD references have their global hypotheses recorded. They are not certified by a few primes, by the point/ℙ¹ comparison, or by a matching graph. The general BSD and Riemann-hypothesis problems remain outside the achieved proof scope. The [Clay BSD problem description](https://www.claymath.org/wp-content/uploads/2022/05/birchswin.pdf) identifies the global object whose behavior a full result must address.

## Concrete compact groups and classical fields

The implemented adapters are SU(2–6), SO(3,5–8), compact Sp(1–3), and compact G₂. Each has actual arithmetic, Lie-algebra data, a representation, invariant form, and applicable finite certificates. SU(2) and SO(3) have different global forms despite sharing a Lie algebra. A global group claim cannot be obtained solely from a Lie-algebra embedding.

BPST fields are lifted through an actual SU(2)→G embedding. The embedding index transports the invariant form, action density, and topological-density normalization. G₂ includes index-1 and index-3 embeddings; unit SU(2) normalization is not copied blindly. Full-basis Gaussian/Fourier test fields have components outside the embedded subalgebra and can be off shell.

Curvature, Bianchi residuals, Yang–Mills residuals, gauge-transformed fields, invariant densities, and finite-path holonomy are calculated. A nonzero residual is retained. Finite quadrature and transport have finite approximation scopes; they are not automatically continuum or infinite-volume results.

### Delta and the state family

| Mode | Meaning | What changes |
|---|---|---|
| `ASSUMED_BOUND` | A declared lower-bound assumption | The assumption; the physical field remains unchanged |
| `UNITS` | A change of units | Numerical representation of quantities with their units |
| `CLASSICAL_SCALE` | A specified classical family | The field is recomputed under its declared scaling |
| `EFFECTIVE_MODEL` | A specified effective family | The field/model is recomputed according to that definition |

A positive value entered as an axiom does not construct a quantum field theory. Conditional Lean statements retain the exact assumptions they use. The quantum Yang–Mills problem requires existence of the theory and a positive mass gap for the required groups; classical matrix fields, finite spectra, and 3D projections do not supply those requirements by themselves. See the [Clay Yang–Mills problem description](https://www.claymath.org/wp-content/uploads/2022/06/yangmills.pdf).

## NS: source theorem, reference solution, and constructed components

The source edition has 166 pages and is pinned by its PDF hash and repository commit. Its theorem contract keeps its smooth forcing, initial data, domain, finite-energy, and singularity conditions. It does not add an unforced hypothesis. The separate Taylor–Green solution verifies signs, viscosity scaling, energy, enstrophy, and dissipation; it is not the paper's blowup construction.

The heat exterior is defined for r>0. Its z-independence and display normalization do not turn it into a finite-energy solution on all ℝ³ or supply an axis/core. Similarity coordinates and derivatives use the actual q,η,X dependence. The source leading-profile candidate retains separately computed and unresolved components.

The eight follow-up families are described in [NS_FOLLOWUP_COMPONENTS_EN.md](NS_FOLLOWUP_COMPONENTS_EN.md). Of particular importance, the A.21 pressure/local-axis example at `logP=14` and the numerically successful gluing example at `logP=0` are different inputs. Their successful checks cannot be combined into one global certificate. The latter does not satisfy the original large-amplitude hierarchy.

Source: the pinned edition of [Finite time blowup for Navier–Stokes](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf) and [the pinned Lean repository](https://github.com/openai/NavierStokesAndEuler/tree/f9e8bc5b38b6e212696e8a30e3e91517af887bbd). Full original proof checking and verification that a numerical array instantiates the construction are separate tasks.

## Reading the visualizations

Check the observation manifest before identifying coordinates with physical space. The G₂ projection observes actual ℝ⁴ samples through an ℝ³ map. The NS inner-gluing graph uses `(log X,η,log E)` with U encoded by color. The C.12 graph uses `(log X,η,N(E_N−E))`. The pressure-bound view displays intervals and their widths.

The latter graphs are function/diagnostic plots. They are not projections of the full physical NS velocity field. Rendered decimals and camera coordinates never replace exact rational input, source hashes, full-dimensional data, or analytical error bounds.
