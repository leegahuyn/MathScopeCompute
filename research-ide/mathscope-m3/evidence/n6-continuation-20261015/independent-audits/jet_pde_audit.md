# Original Jet230 / PDE1020 audit, 2026-10-15

This audit creates no derivative values, changes no original definitions and
discharges no original obligation. It uses the authenticated source kernel
export at commit a35bb0727953e56470682839c98fd9759306d18c and the supplied
continuation audit, rather than generic values for opaque source functions.

## Exact request inventory

The supplied Jet230 rows contain 190 requests which become native higher
partials *if those derivatives exist*, 36 requests with an absent direction
after an earlier derivative whose existence remains unproved, and 4
nonidentity pullbacks. The latter are the four original requests
cartesian-result:1407, :1590, :1650, :2640 on source node 3615202, in the
original directions R, Y0, Y1, Z respectively. Native multi-index addition
does not certify any of these derivatives. The earlier order of a mixed
derivative must not be silently exchanged with an absent direction.

The PDE ledger has 169, 197 and 654 reduced numerator terms in components
0, 1 and 2. Its three coupled operands are original nodes 3825003, 3825004,
3825005, respectively coupled-field:0, :1, :2. The scalar algebra treats
these as retained actual source operations. Assigning them independent
numbers does not give a counterexample to the defined functions.

## Where the three actual residual bodies are constructed

`source-initialized-angular.mjs` constructs three fields named
`ActualAll162InitializedAngularResidual_0`, `_1`, `_2`. Each field retains
all 81 source boxes and both signs, a total of 162 rows. Its local bodies
are `ActualInitializedAngularOwnLabel_{sign}_{component}` and
`ActualInitializedAngularReferenceChart_{sign}_{component}`. The local
bodies retain the whole common torus mean before the fixed lift; exact
palette differences 0 through 4 stay separate branches. All physical
normalization factors are inside the differentiated local expression.

The constructor then forms both:

- `direct = exactRealCylindricalPDE(whole mean + whole original wave,
  whole refreshed mean pressure + whole angular pressure)`;
- `assembled[j] = referenceMean.conservativeResidual[j] +
  residualRoots[j]`.

Consequently the required identity is equality of these two constructions.
It is not the claim that each named angular residual is zero. The code's
`equalityScope` explicitly identifies local coefficient identities,
fixed-label normalization and disjoint flat joins as the proof mechanism.

## Finite assembly lemma, with an explicit proof

Let E(u,p) = L(u,p) + div(u tensor u), where L is the complete linear
time/viscosity/pressure operator in the fixed original chart. L can have
the original cylindrical connection coefficients and all original slow
and auxiliary derivatives. Suppose B, w_i and the pressures have every
classical derivative used by E, and the finite family satisfies
w_i tensor w_j = 0 identically for every i != j. Write
Delta_i = E(B+w_i, p_B+p_i) - E(B,p_B). Then

    E(B + sum_i w_i, p_B + sum_i p_i)
      = E(B,p_B) + sum_i Delta_i.

Proof: linearity gives L(B+sum w_i,p_B+sum p_i) =
L(B,p_B)+sum L(w_i,p_i). Bilinearity gives the quadratic tensor
B tensor B + sum_i(B tensor w_i + w_i tensor B + w_i tensor w_i)
+ sum_{i != j} w_i tensor w_j. Every tensor in the final sum is the
identically zero smooth tensor, so its complete divergence is zero.
The remaining terms are exactly E(B,p_B)+sum Delta_i. The same argument
holds for a locally finite family on each compact set. There is no
incompressibility assumption and no discarded mean-wave product.

This lemma applies to the original conservative residual definition in
`source-harmonic-assembly.mjs`. Its `exactRealCylindricalPDE` retains all
cylindrical Laplacian connections and defines conservative residual as
advective residual plus u div(u), so the required tensor divergence is
exactly the source operator. `exactAngularResidualUpdate` separately
retains the complete old residual, both bilinear cross products, the new
quadratic remainder and all generated harmonics.

The lemma is mathematical progress toward the 1020 comparison terms, but
its application has not been authenticated for the whole original source.
In particular, the code's statements `allCrossLabelProductsVanish`,
`localFinitenessAndFlatJoins` and `sourceAuthenticated` are records, not
independent analytic proofs. Their exact source support, flat extension,
physical scale identities and all derivatives still have to be bound to
the original rows. Counting this conditional lemma as 1020 discharges
would erase those premises.

## Precise remaining derivative dependencies

1. A selected native shared expression needs the smoothness and scalar
   domains of its actual defining body on the original chart. A retained
   registry body or mechanically emitted derivative is not that theorem.
2. A periodic indexed field needs all local bodies' regularity, the exact
   constant fixed-label derivative maps, local finiteness and flatness at
   label/copy joins. Nearest-copy ceilings and integer labels are frozen
   before differentiation; they are not continuous smooth directions.
3. A temporal inverse is the zero-mean Fourier *limit* of the actual source
   body with the fixed operator (sqrt(2)-1) partial_Y0 + partial_Y1. The
   exact quadratic integer norm proves every nonzero divisor is nonzero.
   It does not prove the input body's periodic smoothness. A local uniform
   source derivative bound of the required slow/torus jet is still needed
   to exchange differentiation and the infinite sum. A tail generated for
   one source jet does not certify another source jet.
4. The original radial definite integrals require the actual complete
   integrand's local uniform domination in the differentiated parameters,
   plus endpoint integrability. The ten open integral guards are part of
   this dependency; an outer zero coefficient cannot validate an undefined
   inner derivative.

`source-coupled-derivative-closure.mjs` itself records
`originalSmoothSupportAndPeriodicityAuthenticatedHere:false` and
`originalAllBandClassBoundsCertified:false`. Its Fourier block states
`sourcePeriodicityStillRequiresAuthentication:true`. These are consistent
with, rather than a resolution of, the current OPEN obligations.

## Cloud follow-up

`jet_pde_audit_extract.py` reads the freshly authenticated cloud SQLite
cache and header, verifies all 230 original call/definition hashes, and
exports compact actual definitions, the three coupled residuals and the
conservative complete_gr ancestor inventory. Its bounded graph excerpt is
explicitly incomplete. Large source artifacts stay in GitHub cloud storage.
