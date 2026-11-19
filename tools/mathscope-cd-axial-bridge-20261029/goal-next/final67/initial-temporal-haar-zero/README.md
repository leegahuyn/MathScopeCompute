# Original post-Temporal pressure and axial defect

## VERIFIED

The C67 branch from pre-Haar Wrz Z^5T^2 to the fresh P0_ZZT
through the **linear** slow-time term has zero projection in the
original N3 source. The same projected term contributes zero to the
fresh Jz0_ZZT. This applies after the original Fourier inverse and
shifted radial operators, at the actual outer Haar projection used
by both native targets.

| Original native operand | Source node |
| --- | --- |
| Common-torus pre-Haar Wrz | 17753400 |
| Wrz_ZZ evaluated at the original translated T0 binder | 17754185 |
| Early T0 left and whole integrals | 17754191, 17754192 |
| Axial pressure derivative with cutoff and whole subtraction | 17754234 |
| Early Ez, registered inverse system 1 input | 17754268 |
| Original shifted exact axial inverse application | 19570809 |
| T1 left and whole integrals and original cutoff | 19570813, 19570814, 17743734 |
| Temporal meridional potential and beta | 19570917, 19570921 |
| Slow part +epsilon partial_T beta of the complete radial source | 21374035 |
| Complete post-Temporal radial source gr | 21374149 |
| Actual normalized Haar in Y0 then Y1, both on [0,1] | 21374484, 21374485 |
| P0 native whole body and application | 21374489, 21374490 |
| Jz0 native whole body and application | 21374575, 21374576 |
| Jz0 axial flux whole integral and weighted Haar(gr) integral | 21374566, 21374572 |
| Fixed radial limits sqrt(Xa), 2 sqrt(Xb) | 17743711, 17743713 |

The source uses time(beta) = -epsilon partial_T beta + ci N beta
and adds its opposite to gr. The initial pressure path from Wrz
starts with -epsilon T0(partial_Z Wrz). Its contribution to Ez with
the largest count of axial derivatives on the same Wrz is
-epsilon^2 T0(partial_Z^2 Wrz). The actual realization is

    gammaDesired = -ci^-1 N^-1 P_perp Ez
    psi = T1(gammaDesired)
    beta = -epsilon partial_Z psi.

Consequently the highest Wrz leg before projection in the slow-time
term of P0_ZZT has coefficient -epsilon^4 ci^-1 multiplying
T1 N^-1 P_perp T0(partial_Z^5 partial_T^2 Wrz). This expression names
the derivative allocation with all Z,T derivatives on Wrz. Derivatives
of both radial cutoffs produce other allocations in the same linear
input. The projection below applies to the complete beta and covers
all of these allocations.

Write H for normalized Haar on the Y torus. The actual infinite inverse
is defined with zero Fourier coefficient at mode zero. Its source
convergence proof gives H(N^-1 P_perp Ez)=0 at every fixed slow point.
For each radial binder r the original T1 translation
Y + (Phi(r)-Phi(R)) vr preserves Haar. Fubini therefore gives zero
Haar for both of the actual r-weighted T1 integrals individually.
The retained cutoff chi, invariant factors ci^-1 and R^-1, and slow
scales are independent of Y. Thus H(psi)=0 and H(beta)=0. Smoothness on
the original admitted coordinate charts allows slow differentiation
of this pointwise zero identity, including at the admitted flat joins.
The radial integration is after pointwise Haar. Any endpoint Leibniz
term for this projected contribution would evaluate the same zero
function at the endpoint. The active strict source uses the actual
fixed endpoints recorded above.

For Jz0 the weighted Haar(gr) branch is integrated with R^2 and
multiplied by -1/2. This preserves the zero contribution. The separate
flux branch is R(2G0 gamma + gamma^2 + Wzz). It has no beta-time term.
Its linear gamma term also has zero Haar since
gamma=(partial_R+aL+1/R)psi, L is a constant torus direction and the
background G0 is independent of Y. The identities persist under the
target's original slow normalization and the epsilon^3 multiplier of
the C67 Sigma_theta time contribution.

## OPEN

The active source retains beta^2, beta_Z gamma, beta gamma_Z, v^2
and gamma^2 at nodes 21374043, 21374077, 21374078, 21374092 and
21374560. The mean of cos(2 pi Y0) is zero and its square has mean 1/2,
which is an exact control against projecting entire quadratic terms to
zero. These products, the original covariance Haar and other moment
terms still need their own source estimates. One retained allocation
for the quadratic beta_Z gamma branch at P0_ZZT puts its two
additional Z derivatives and its T derivative on beta_Z. The early
pressure route in that factor then calls for Wrz_Z^6T. That branch
requires its own inverse and product evidence. This is an allocation
in the original expression, with its full product and cutoff
contributions separate.

The C73 pre-Haar Wrz bound applies to its original pointwise variable.
There is no inference that this Wrz jet, T0/T1 or the inverse itself
vanishes pointwise on the torus. Other pointwise consumers and genuine
quadratic contributions still retain the inverse and their radial
translation/cutoff costs. Final jets remain 0/67 and RELEASE HOLD.

## Replay

Replay from the preserved workspace with Python 3.

    python verify_temporal_projection.py WORKSPACE source-native-final.json NEW.json

When unpacked from the evidence ZIP, run the compact standalone replay.

    python verify_temporal_projection.py . source-native-final.json NEW.json --bundle

The compact source slab is pinned. For an independent rebuild, use
capture_source.py with the original hosted original-source-nodes.jsonl.gz
from run 43296617887 and a new output filename. The extractor reads all
21,681,493 nodes and verifies the original 1,000,764,709-byte stream.

## A retained quadratic input

The exact degree-seven pre-Haar map also gives a directional corollary
for the retained `Z6 T` input. For the same fixed candidate labels and
copies, both original fast arguments are constant under slow Z and T
differentiation. The original reference factor for its local covariance
jet is `rho^(2A+6D+1)`. After retaining the local epsilon gain
`beta in {1, 2-2*kappa_s}`, its power is
`5-(4+beta)h`, between zero and five. This fits the same upper factor
used in the existing `Z5 T2` bound on `rho in [1/4,4]`.
The original order-seven local class, finite row inventory and admitted
transport hypotheses are identical. They give the same conditional
pointwise cap `epsilon_ref^7 |d_Z^6 d_T Wrz| <= exp(-7H) sqrt(zeta)`.
The zero-mode-preserving argument above concerns the separate outer
linear mean. The surviving quadratic route still needs an anisotropic
inverse estimate, including the required L-squared derivative, and its
actual radial cutoff and translation factors.
