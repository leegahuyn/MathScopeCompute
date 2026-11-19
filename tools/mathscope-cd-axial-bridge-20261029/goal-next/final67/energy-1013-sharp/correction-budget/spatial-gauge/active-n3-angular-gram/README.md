# Angular energy and dissipation for the actual first correction

The source is GitHub run 44582875351, with the complete authenticated
22,155,584-node source export. The checker authenticates the existing
local graph cache without changing it.

## VERIFIED source binding

The actual uncut first correction has three direct pieces

    U = M + W_F + W_S,
    W_F = ForcedFullWave - InitializedWave.

The C80 original assembly verified this as a literal three-component
sum. The net mean M has roots 22153217, 22153219 and 22153221.
It includes the original Temporal and FiveMap increments with the
actual initialized mean subtracted. The new native argument and
source-occurrence check proves all three roots independent of
physical theta. Their auxiliary torus dependence is retained.

All ten Signed branches share the exact same phase roots and k as
the corresponding Forced branches. The original Signed-only velocity
has a conjugate fundamental pair. The C81 original phase slope is
p=omega/k with omega a nonzero rounded integer. Hence the Signed
physical frequencies are ±omega, and the Forced-only frequencies are
±omega and ±2 omega. Seven original local guards, both coefficient
parts and all original outer Forced/Signed row maps used in this
proof are angle-independent. Forced fundamental and Signed
fundamental contribute to the same two frequencies on each label.
Equal physical frequencies across different labels can also collide.

## CONDITIONAL angular Gram on the admitted original guards

At a fixed ordinary physical ring write one original wave row using
its positive relative coefficient c in

    c exp(i*m*k*phi) + conjugate(c) exp(-i*m*k*phi).

Retain its own/reference and physical scales. Place
c exp(i*m*k*phi_offset) in frequency n=m*omega and its conjugate
in -n, where phi_offset has no physical theta. When omega is
negative this reverses which of the two coefficients lands in
a positive n. Combine all retained contributions to each literal
integer n within each wave piece before taking a norm. Denote the
resulting weights by F_n and S_n.

On normalized full-circle Haar, the exact velocity-square density is

    |M|² + 2 sum_{n>0} |F_n + S_n|².

Half of this density gives kinetic energy in the usual convention.
The mean-wave kinetic pairings vanish. The exact Forced–Signed inner
product is

    2 Re sum_{n>0} <F_n,S_n>.

Multiply this pairing by two for the cross term in the squared norm.
This rule retains same-label and cross-label collisions, including
Forced m=2 and Signed m=1 at the same signed integer n.

Define the physical gradient coefficient

    G_n(c) = [ D_r c, (i*n*c+J*c)/r, D_z c ],
    J(c_r,c_theta,c_z) = (-c_theta,c_r,0).

Use the original physical radial and axial operators with all fixed
chart weights, radial torus shift derivatives, and ordinary cutoff
derivatives. A fixed label keeps omega constant. The source physical
connection acts also at n=0. Rotation from the orthonormal cylindrical
basis cancels from the full Frobenius pairing. The dissipation
density before any separate experiment weight is

    ||G_0(M)||_F² + 2 sum_{n>0} ||G_n(F_n+S_n)||_F².

The derivative coefficients are grouped at their physical frequency
using the same rule. The exact zero-mode cross statement follows
for the complete retained net mean and each wave piece. Ordinary
differentiation still requires the admitted source guard branches
and smooth joins.

The integer/rational controls include two distinct labels with a
positive fundamental and a negative double harmonic colliding at
the same absolute frequency. The synthetic Forced–Signed pairing
is nonzero and is retained by the exact Gram computation. An
N-point grid can also alias unequal frequencies whenever N divides
their difference. The exact matched-frequency Gram omits these
false terms. The control produces a false cross mean at six points
and removes it at thirteen. These controls do not stand in for
numerical source amplitudes.

## OPEN

Numerical coefficient and derivative intervals at all original
radial/time points, outer localization, work and force integrals,
later stages, and the final convergence table retain their separate
proof obligations. N7-06 and N8-05 remain open, final jets 0/67,
RELEASE HOLD.

Replay with the isolated checkout's `goal-next` directory, the
preserved GitHub run 44582875351 artifact directory and a local
read-only source cache directory.

    python -B check_first_correction_gram.py GOAL_NEXT HOSTED_ARTIFACT CACHE NEW_RECEIPT.json
