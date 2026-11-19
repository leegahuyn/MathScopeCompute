# Actual initialized mean with the outer cutoff

The saved-source Temporal and FiveMap mean are combined with the actual
outer axial cutoff before computing velocity and its spatial gradient.
This extends the preceding weighted mean-velocity calculation to the
potential cutoff commutator.

The Temporal covariant curl uses the source identity verified in the
preceding `temporal-curl-source.json`. This replay also streams and hashes
the original 4,456,994-node graph. It checks actual FiveMap gamma #3614771,
potential #3614778 and beta #3614789. The potential is the fixed-left
primitive of R gamma divided by R, and the native definitions have only
ell,R,Z,T arguments. Their radial FTC and axial derivative therefore give
the same meridional curl identities as the Temporal field.

Let Psi=Q^(-h) psi be the physical azimuthal potential, and write beta,
v,gamma below for the physical mean velocity. On the annular radial
plateau, the localized field has

```text
ur = C beta-C_z Psi
utheta = C v
uz = C gamma
ur,r = C beta_r-C_z gamma+C_z Psi/r
ur,z = C beta_z+2 C_z beta-C_zz Psi.
```

The remaining four radial/axial derivatives are ordinary product rules.
Direct symbolic Cartesian differentiation verifies that the gradient norm
also contains (ur^2+utheta^2)/r^2. A constant unit azimuthal velocity at
r=2 gives the nonzero connection contribution 1/4 in the negative control.
The incorrect coefficient 1 in place of 2 in ur,z leaves residual C_z beta.

The required potential value bound follows along the original radial
characteristic Y_R=a(R) v_r. The actual covariant curl gives
`d_R(R psi)=R gamma`. At the fixed inner radius, the Temporal left
integral vanishes and its cutoff chi is zero. The recorded Xa<X0Imean,
s>=1/2 and original mean-patch geometry put that cutoff below its step
support. The FiveMap primitive also vanishes at that same left endpoint.
Consequently

```text
|psi| <= R sup|gamma|/2
|psi/R| <= sup|gamma|/2
|D_R psi| <= 3 sup|gamma|/2
|epsilon partial_Z psi| = |beta|.
```

The gamma bound must hold uniformly along the whole characteristic,
including the original zero extensions and fixed chart seams. This
uniformity and the prior source analytic valuation remain explicit
premises. Under those premises the same old-namespace C0/C1 coefficients
bound the physical potential value and first derivatives as well as the
complete localized mean velocity and gradient.

The replay retains epsilon^(1-kappa_s) for tangential mean values,
epsilon^(1-2kappa_s) for their spatial derivatives, and beta's additional
epsilon. It uses the original outer-only cutoff bounds 20/z0 and
692/z0^2. The initialized base has no additional correction-stage cutoff.
All affine h powers are combined before multiplication by log(tau0).

The directed full-mean energy upper endpoint still exceeds the allocated
sufficient initialized-energy budget. This result supplies the complete
conditional mean-cutoff envelope, including the formerly unbounded
commutator. The current coarse global C0/C1 endpoints do not close the
annular energy comparison. Later corrections and final jets remain open.

The result consists of these five files.

* README.md
* derive_mean_cutoff.py
* evaluate_actual_mean_cutoff.mjs
* mean-cutoff-source-final.json
* actual-mean-cutoff-final.json

The numerical runner imports the shared input preparation from
`../weighted-velocity/evaluate_mean_bulk_energy.mjs`. The function verifies
the original numerical inputs and constructs the weighted velocity
enclosures. The earlier mean-bulk replay still produces its original bytes.
Python 3 with SymPy is needed for the source identities.
Choose fresh writable output paths.

```text
python derive_mean_cutoff.py GOAL_NEXT TEMPORAL_CURL_RECEIPT ORIGINAL_GRAPH_DIRECTORY mean-cutoff-source-final.json
node evaluate_actual_mean_cutoff.mjs GOAL_NEXT ORIGINAL_RUNTIME HISTORICAL_INPUT WEIGHTED_VELOCITY_COEFFICIENTS mean-cutoff-source-final.json actual-mean-cutoff-final.json
```

The original graph is the corrected first-cycle export from run
43010593847. The numerical input roles match the preceding weighted-mean
replay. Both the complete source check and numerical enclosure were
replayed twice with byte-identical results. RELEASE HOLD.
