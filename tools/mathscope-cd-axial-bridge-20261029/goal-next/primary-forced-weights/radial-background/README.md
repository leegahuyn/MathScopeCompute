# Archived radial background through slow C3

**VERIFIED.** The radial velocity coefficient at original root #622934
retains epsilon explicitly. The replay checks 36 source records in the
authenticated 4,456,994-node archive, the actual native functions and
their formal-to-actual coordinates. It checks the exact Stokes identity
at orders zero through three, including the derivative of the original
time cutoff. All 20 ordinary R,Z,T multi-indices through C3 have
directed numerical upper endpoints.

Here b is the normalized radial velocity, distinct from the swirl
scalar named b in the physical gauge evidence. Write
chi_n = chi(b_n q), with chi_0=1, and use A+D=1. The normalized
source stream potential is

~~~text
Atheta = s^(1-A) / R * sum_n chi_n q^(2*n*h) M_n(X,eta)
       = R/2 * s^(-A) * sum_n chi_n q^(2*n*h) AverageU_n(X,eta)
AverageU_n(X,eta) = integral_0^1 U_n(tX,eta) dt
b/epsilon = -partial_Z Atheta .
~~~

The first equality uses the original stream normalization and the
second uses R^2=2sX and M_n=X AverageU_n. The original source
constructs these primitives at the axis, on the cutoff and repair
collars, and through the actual moment-matched zero branches. It
retains M_n(0)=0 and partial_X M_n=U_n. At fixed R and T, the original
inverse chart gives

~~~text
partial_Z log(s) = 2 eta s^(-D)/L
partial_Z X = -X partial_Z log(s)
partial_Z eta = (1-eta^2) s^(-D)/L
L = 1-2h eta^2.
~~~

Applying this derivative to the stream gives the retained coefficient
X v_n and the separate correction
-(2 eta/L)(b_n q)chi'(b_n q) M_n. The independent exact algebra check
rejects deletion of the latter term at every positive order. The
archived band has the leading term and its native first-order
correction. The upper argument also admits all source windows with
active orders contained in 0,1,2,3, as in the original whole-K slab.

The ordinary X,eta derivative of the average has a factor t^r inside
the integral when its radial order is r. The global raw U_n norm
therefore bounds it with an extra factor 1/(r+1). For positive orders
the original global raw norm is the sum of the cutoff core/collar
coefficient bounds and the global compact moment correction bounds.
The original leading U_0 norm includes the axis and the matched
exterior zero branch. The pinned numerical FTC envelope dominates
these same raw norm expressions. Thus the earlier positive C9
composition for the axial field G also dominates the averaged
composition through C4, with its original time cutoffs and fixed
band. Its directed upper endpoint is C_G.

Only one derivative can land on the factor R/2. For an ordinary
multi-index alpha of total order at most three, the bound is
(R_*+alpha_R) C_G/2. The radius inequality R <= R_* holds on the
original chart. All derivatives involving the independent auxiliary
variables xi or v vanish identically. This result supplies the
archived radial background operand for full Forced C2. The
remaining operator assembly and the new live-family attachment
are separate verification steps.

## Replay

~~~sh
node --stack-size=4096 check_radial_background_c3.mjs GOAL_NEXT ARCHIVED_GRAPH ORIGINAL_RESEARCH_IDE ARITHMETIC_RUNTIME radial-background-c3.json
~~~

The inputs use the same original corrected archive, source tree and
directed arithmetic runtime as the mixed-wave C4 replay. The receipt
SHA-256 is 9bb296072c08e05e4062e658cc841f4e49b72a6f18ec722a907a7cef6afcc416.
