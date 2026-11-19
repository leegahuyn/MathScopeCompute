# Saved-source epsilon-weighted mean velocity coefficients

The old conditional fixed-slab valuation uses the same original initialized
source graph as the 67-atom replay, with SHA-256
`ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf`.
Its positive norm nodes belong to `mean-path-longitudinal.json`, whose node
numbers differ from `lower-covariance-pressure.json`.

The coefficient replay evaluates 3,924 reachable arithmetic records in the
correct old namespace and consumes 51 pinned original numerical leaves.
It computes the original common constants
`C0=4 max(#7590,#7602,#7594)` and
`C1=4 max(#7619,#7591,#7627,#7603,#7635,#7595)`.
These bound values and normalized spatial first derivatives of the old
mean velocity beta,v,gamma under the prior analytic valuation hypotheses.
The retained epsilon exponents are 1-kappa_s and 1-2kappa_s, with one
additional epsilon for beta; kappa_s=1/100000.

For a frozen reference band with tau0/4<=Q<=4tau0, epsilon=Q^h and
A=1/2+h, the common normalized value bound is

```text
tau0^A Q^(-A) C0 epsilon^alpha0
 <= 4^(A-h alpha0) C0 tau0^(h alpha0).
```

The first derivative has the analogous expression with A+1/2 and C1.
The replay keeps the small exponent h alpha separate before multiplying
by log(tau0). It also retains the two cylindrical angular connection
terms beta/R and v/R. For the scalar-cutoff product C times this virtual
axisymmetric velocity, it uses |C|<=1 and the existing normalized axial
derivative bound 64 tau0^h.

Even with these epsilon gains the directed upper endpoint exceeds the
sufficient allocated initialized energy budget. This is inconclusive
about the actual field. The complete initialized mean is constructed from
the pulled-back potential via curl(C Amean). The later source check in
`../mean-curl/temporal-curl-source.json` resolves the radial
fast pullback. The original shifted T1 definition cancels the external
a L(psi), and native gamma already represents the covariant curl.
The cutoff commutator grad(C) cross Amean remains to be included in the
energy estimate. The actual annular mean energy, later corrections and
final jets remain open. The earlier JSON records retain the intermediate
unresolved-pullback wording, superseded by that exact source identity.

Only the following five files form this additional result.

* README.md
* evaluate_weighted_velocity.mjs
* evaluate_mean_bulk_energy.mjs
* weighted-velocity-coefficients.json
* weighted-mean-bulk-energy.json

Both scripts load the existing arithmetic helper from the GOAL_NEXT
argument and are movable. The input roles match the prior stage-zero and
energy-budget replay. Use fresh writable output paths.

```text
node --stack-size=4096 evaluate_weighted_velocity.mjs GOAL_NEXT ORIGINAL_RUNTIME SLOW_RECEIPT original67.json weighted-velocity-coefficients.json
node evaluate_mean_bulk_energy.mjs GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT weighted-velocity-coefficients.json weighted-mean-bulk-energy.json
```

The first command independently reproduces the original 67-atom JSON with
the established SHA-256
`9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34`.
The coefficient and energy certificates were each reproduced twice with
identical bytes. RELEASE HOLD.
