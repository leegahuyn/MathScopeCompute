# External original Primary coefficients at orders six and seven

This directed comparison combines the same original pointwise C10 background
bounds, the original target through order eight, the original cutoff and map
bounds, and the original independently directed covariance primitives. The
exact source is the N3/N4 Primary constructor at the pinned original commit.
The result applies to that source recurrence under the stated domain and
analytic hypotheses. The native Primary K roots and their private seals have
their own acceptance evidence.

For output order m in {6,7}, the original Gaussian input stencil has
background order m+3. Its source base is the maximum of Bnorm, the normalized
slow background Cslow, (m+3)!, Lmax, and two. W=exp(3*Bnorm^256*Lmax).
The original Bnorm>=2^128 and Lmax>2^-31 give Bnorm<=W^8, which is retained
inside W^(m+3). The factorial, Lmax, Haar length and two are below 2^128.
A sufficient external base is therefore the maximum of these seven terms.

1. 2^128.
2. The original live pointwise C10 upper plus one.
3. The original directed W^(m+3).
4. The inverse of the original positive determinant floor dstar.
5. The inverse square root of the original positive y/zeta floor cy.
6. The external original cutoff/map bound through m+2.
7. The original target maximum through m+1, using directed native bounds
   through six and the external bounds for seven and eight.

The first three original positive background summands use the rate
2 exp(-2 n H) at both live and fixed representatives. For n<=3,
h<1/64, and q<=4 tau0, this follows from 4 n h < 1 without changing
the live directed arithmetic. The fixed source cutoff geometry gives zero
for n>=5 in the fixed representative range. The original fourth term,
when active in its exceptional permitted raw collar, is strictly less than
one through order ten according to the accompanying proof. The same bound
therefore covers the live and those frozen representative backgrounds on
their admitted charts. It applies to each actual role once the precise
live or representative argument is associated to these domains.

The exact source degree program includes the sum of leading and remainder
angular covariance. Its sum reserve adds one to the larger of the two
powers. Across all rows the maximum degree is 3,405 for m=6 and 3,814
for m=7. The full Haar coefficient contains the original 162 factors,
auxiliary rectangle mass, reference chart scale and 4^(j+power). The mass
is below one and 4^(2A+2h)<16. Thus the complete separate prefactor is
bounded by 2^(12+2*(m+power)). The directed log calculation retains this
overhead.

All four original prefix/order pairs (N3 or N4, m=6 or m=7) have strict
upper-to-lower endpoint separation:

- External Khat is below exp(H/2^128)/(64 Xb^2).
- The log of each local power of Khat is below H/2^115.
- The log including the full Haar prefactor is below H/2^113.

For the unaveraged covariance weights, the source pole is at most 54.
With `0<t1<1`, the original Gaussian gives
`zeta*delta^(-p) <= 27!*t1^(-54)` for every `0<=p<=54`.
If delta<1, at least one Gaussian exponent controls t1^2/delta^2.
For z=t1/delta>=1, the exact nonnegative exponential series term
z^54/27! gives the bound. For z<=1, delta>=t1 gives it directly.
Using half of the Gaussian leaves sqrt(zeta) and costs an additional factor 2^27. The directed logarithms of both finite radial factors are below H/2^115.

The estimates concern coefficients. The actual covariance also has its
original scale S_label, epsilon gain, Gaussian and radial factors, and the
common-Y pullback before auxiliary Haar. The whole correction, original
source path association, and final jets remain OPEN.

Use the verified evidence directory and workspace source trees.

    node evaluate_external_primary_k.mjs GOAL_NEXT WORK NEW_OUTPUT.json
