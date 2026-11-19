# Stage-one gauge reduction

The exact local replay binds the source constructors and verifies the
forced and signed cylindrical curl, the own-to-reference chart transport,
and both mean curls. Its zero statements concern the displayed local
identities. The exported stage-one source roots and their whole-domain
flat joins still require readback.

For each fixed label and copy, set `Q=Q_ref`,
`rho=Q_ref/Q_own`, `R_own=sqrt(rho)*R`, and
`delta=i_own-i_refbase`. The source direction on the common torus is
unchanged. Differentiating the original radial primitive gives

```text
sqrt(rho) * a_own(R_own) / Lambda^delta = a_ref(R)
Q_ref^h * rho^D = sqrt(rho) * Q_own^h
rho^(A-1/2) / R = rho^A / R_own
```

The first equation uses the physical radius `sqrt(Q_ref)*R` on both
charts and the actual common-torus level factor. Both sides use the same
frozen labels. Differentiating the band picker, palette ceiling or copy
index would change the problem.

For a complex potential `i(C+iB)`, the conjugate pair gives the real
potential `2(-B cos(mkφ)-C sin(mkφ))`. Its curl has complex coefficient
`-mk*n×(C+iB) + (-curl B + i curl C)` with the ordinary cylindrical
connection in the amplitude curl. Signed is the case `B=0`, with the
original half coefficient. The replay exercises the factor signs and
preserves all spatial phase derivatives.

Temporal realizes exactly the curl of `psi_T=(I_left-χ Iwhole)/R`.
Its axial component is `gammaDesired-(∂R χ) Iwhole/R` after the
shifted FTC. The cutoff term does not vanish in the derivation. The
FiveMap curl uses the actual raw `I_left/R`, whose axial component is
the integrand after the endpoint FTC. The separate whole integral check
serves compact support, with the raw potential preserved for gauge
equality.

## Minimal actual artifact test

1. Within the exported graph, split the top-level difference into
   `forcedWave − initializedWave + signedWave + temporal + five`.
   Verify exact cancellation of the same source mean baselines. Use
   the three latest and three initialized operand IDs and the retained
   Signed full-velocity receipt. Confirm the temporal and FiveMap
   native registrations before comparing their three components.
2. Match all 162 label/sign metadata rows from the new gauge field
   against the Forced and Signed fields. The initialized field uses
   a separate original auxiliary declaration. Check its row metadata
   and substitute the original frozen `xi,v` lift before matching
   the initialized wave constituents of the Forced full field.
3. Unwrap the fixed own/reference adapters and the common guard chain.
   On each of the ten sign/level branches, compare rational linear
   combinations of the Fourier coefficients before summing them.
   The three wave components, each available positive mode and its
   conjugate partner can be checked separately. Normalize only
   `cos(-θ)=cos(θ)` and `sin(-θ)=-sin(θ)`, with the same angle AST.
   Treat a native partial as a tuple of registration, exact ordered
   actual arguments, and derivative orders.
4. For the means, compare the source Temporal first partials with
   `G_A`'s common-reference directional stencil. Check the FiveMap
   beta integral's fixed endpoints and the native `Z` derivative of
   its same bound-radius gamma. Recover gamma from the upper limit
   after comparing the exact integrand. Keep the raw potential and its
   compact candidate distinct. Apply the guard/zero-jet proof at each
   seam before interpreting the three differences globally.

No live root numbers are copied from the earlier N1 archive. The
source-calculus replay does not evaluate any of the uniform energy caps.

Replay with SymPy 1.14 and assertions enabled.

```text
python -B prove_stage1_gauge.py ORIGINAL_RESEARCH_IDE STAGE1_INGRESS_MJS NEW_OUTPUT.json
```
