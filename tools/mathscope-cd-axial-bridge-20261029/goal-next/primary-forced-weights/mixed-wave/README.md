# Archived primary wave mixed derivatives through C4

**VERIFIED archived source and arithmetic.** The replay streams the complete
4,456,994-node graph from GitHub run 43010593847. It authenticates the native
registry and the source implementations. It checks both normals, their
denominators, the two native Volterra matrices and initial conditions, the
actual frame and scalar envelope products, the covariance square roots, the
two fast cutoffs and the six signed native potential bodies. The independent
readback checks all 126 five-variable multi-indices through C4, including
56 through C3, and rejects omission of the cylindrical connection.

**CONDITIONAL application.** The positive and numerical results apply to the
archived fixed-label chart in the original whole-K annulus under the original
analytic premises. These include the same admitted source chart along the
pulse, the stable Volterra and covariance bounds, and the smooth zero joins.
The band, representative and discrete labels remain fixed under
differentiation.

The actual source uses n = (x0 - v H_R, p/R, pz - epsilon v H_Z), w_v = M w,
and t = B(Pw). It retains the moving frame derivative B_v in
M = Bleft(Aphi B - B_v) - (lambda + d - dref)I. The source amplitude A
contains sqrt(epsilon), chi, psi, sqrt(y), the partition, and t. The
archive uses C = n cross A / (k |n|^2). The original checked tangency and
vector triple product give real curl A and imaginary curl

~~~text
(-D_z C_theta, D_z C_r - D_r C_z, D_r C_theta + C_theta/R)
D_r = partial_R + a(R) partial_xi
D_z = epsilon partial_Z
~~~

Pressure uses (n^T K - n_v^T)A/(k|n|^2). Bounds for the original signed
harmonic half-coefficients follow by enlarging their factor one half to one.

For slow order s take the maximum over ordinary R,Z,T indices of order s.
Divide derivatives by s!j! for j derivatives in v. The product convolution
follows because the Leibniz coefficients of all slow left indices of total
order a sum to binomial(s,a). The original Volterra equation then gives

~~~text
w[s,j] <= (1/j) sum_{a=0}^s sum_{b=0}^{j-1} M[a,b] w[s-a,j-1-b].
~~~

The matrix through degree four retains n_v, the pressure projection, the
moving basis and B_v. It uses original F and G through slow degree six.
The same-slab full R,Z,T receipt supplies the established 2^m transfer from
the original fixed-T norms. In the fixed label the original positive P
depends only on v, with P_v = (lambda - dref)P. With e_j the absolute
derivative divided by j!P, e_0=1 and

~~~text
e[j] <= (1/j) sum_{b=0}^{j-1} |lambda-dref|[0,b] e[j-1-b].
~~~

All derivative bounds retain the actual P(v). The covariance input keeps
sqrt(zeta) times delta_*^(-p_s), with poles 12, 24, 48, 72, 96, 120 through
slow order five. Since 0 < delta_* <= 1, a product may use the largest
pole among its slow orders. The graph differentiates chi, both factors of
psi, and the four partition factors through degree five. It uses no Gaussian
absorption and no reciprocal of either cutoff.

The radial fast term uses exact binomial coefficients with the R derivatives
of a(R). The connection retains the reciprocal-radius derivatives
(-1)^d d! R^(-d-1). The exact k = ceil(epsilon^(-1/2)) gives
sqrt(epsilon)/k <= epsilon. The real, imaginary and pressure bounds keep
epsilon powers 1/2, 1-kappa_s, and 1, respectively, with
kappa_s=1/100000. The axial imaginary terms individually keep power 2.
For slow degree s the common imaginary pole is p_(s+1).

The directed evaluation resolves 315 distinct upper expressions through
7,554 reachable arithmetic records and 33 source leaves. It uses the
authenticated full-slow C8 and C7 endpoints, the existing directed
original constants, and the prior covariance positive program. It
retains the dimension factors already present in the arithmetic DAG.

## Archived mean–wave interaction through C2

The join verifies the exact original initialized prefix shared with the
first Forced archive and compares all ten signed path cases by their actual
H_w, w and pulse roots. It keeps the five actual ci/Tg^delta scale roots.
In this affine path the auxiliary Y changes with w while the slow chart
and discrete labels remain fixed. The numerical mean receipt supplies
the required 52 mean derivative indices per component after the original
reference-to-own map. The wave C3 upper expressions cover all matching
wave requests. Application assumes the original admitted own and
reference charts and their smooth zero joins along these paths.

For total output derivative order d, let Q = M tensor U + U tensor M.
The original conservative mode-one coefficient has the ordinary radial
and axial derivatives of Q, the transverse radial-fast term, the
cylindrical connections and the phase factor ik times n contracted with Q.
The absolute coefficient counts for those four groups are bounded by
2^(d+3), 4*3^d, 4*3^d and 12*3^d, respectively. The phase count includes
k <= 2 epsilon^(-1/2). The original numerical C9 endpoints supply
the slow F and G bounds in the normal derivatives through C2.
The C2 expression is

~~~text
C_M C_U (32 + 36 C_a + 36 C_R + 108 C_n).
~~~

It keeps sqrt(zeta) delta_*^(-96) P(v). The real exponent is
3/2-2*kappa_s and the imaginary exponent is 1-kappa_s. The numerical
receipt contains all 21 output multi-indices and three directed
upper endpoints, one for each total order zero through two.

## Archived supported mode one through C2

The exact signed ledger exports the regular part of each differentiated
coefficient after subtracting the mean–wave term. That term is accounted for by
the previous cross receipt. The regular part uses the same wave C4, pressure C3,
slow F/G C4 and the [radial background C3](../radial-background/README.md).
The numerical replay checks all 13,235 distinct monomials and calculates an
upper endpoint for each of the 21 indices, three components and two complex
parts. Each monomial contains one weighted wave or pressure operand. The
result uses the maximum of its Gaussian pole and the cross pole, and the
smallest verified epsilon power in the corresponding signed row.

These are conditional estimates for the archived phase-free N1 input.
The profile receipts describe the slab qBig/64 through qBig/16. The native
archived N1 additionally requires b2 q >= 1 and b2 qBig = 16. Its intersection
with the strict physical whole-K interior q < qBig/16 is empty. Application
in that interior requires the actual N3/N4 source. Transfer of the numerical
premises beyond the input slab is a separate proof obligation.

## Replay

GOAL_NEXT contains the pinned prior receipts. ARCHIVED_GRAPH contains the
extracted corrected original-source-nodes.jsonl.gz and
original-source-functions.json from GitHub run 43010593847.
ORIGINAL_RESEARCH_IDE contains mathscope-m2 and mathscope-m3 from the
original primary-degree runtime. ARITHMETIC_RUNTIME is the pinned
original annular numerical runtime.

~~~sh
node replay_mixed_wave.mjs GOAL_NEXT ARCHIVED_GRAPH ORIGINAL_RESEARCH_IDE mixed-wave-c4.json
node check_mixed_wave.mjs mixed-wave-c4.json mixed-wave-c4-readback.json
node --stack-size=4096 evaluate_mixed_wave.mjs GOAL_NEXT ARITHMETIC_RUNTIME mixed-wave-c4.json mixed-wave-c4-numerical.json
node --stack-size=4096 evaluate_archived_cross_c2.mjs GOAL_NEXT ARITHMETIC_RUNTIME mixed-wave-c4-numerical.json archived-cross-c2-numerical.json
node ../higher-mode-one/replay_mode_one_valuation.mjs GOAL_NEXT ORIGINAL_RUNTIME /tmp/mode-one-valuation.json /tmp/mode-one-regular-c2.json
node --stack-size=4096 evaluate_archived_mode_one_c2.mjs GOAL_NEXT ARITHMETIC_RUNTIME /tmp/mode-one-regular-c2.json ../radial-background/radial-background-c3.json archived-mode-one-c2.json
~~~

The arithmetic graph SHA-256 is
167e79db7e0106e999bd6f2d9461d9177f3a1f44f0e324aeaf0d09ec044af1b0.
The directed receipt SHA-256 is
dc58aa3deb6f3b9fba10eae0f9081f1d6af56d67e2dfc98ce698240da3f86b3e.
The directed mean–wave receipt SHA-256 is
9dbeedd3b4b28b1b4770c08cece5bfd6e6002308efec72033911680745720f5a.

The last replay requires the pinned mode-one source modules under
`ORIGINAL_RUNTIME/research-ide`. The live-family attachment, original
inverse, active correction and final jet coverage remain open.
