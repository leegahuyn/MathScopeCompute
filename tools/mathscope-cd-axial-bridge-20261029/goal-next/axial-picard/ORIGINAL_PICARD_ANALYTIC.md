# Original Picard recurrence on the radial core

This derivation uses the unchanged original six-component input records.
The two conditional data inputs are the verified leading B.26 and natural
axis functions and their source domains. The original order-one program
uses its own actual Picard0 source and majorant. The general constructor
applies to its auxiliary order one and both systems at every fixed $n\ge2$.
The complex-strip claim concerns the parameter $\eta$ on the real radial
collar. Complex radial Cauchy estimates use only the independent natural
auxiliary system.

## Volterra operator, convergence and the exact stored constants

Let $S_r=\{\eta:\operatorname{dist}(\eta,[-1,1])<r\}$ and use the
max component norm for vectors and the induced max row sum for matrices.
Set $c=(0,0,2,0,3,1)$, $a^2$ to the actual system's radial-domain upper
bound in $X$, and define

    (Gg)_i(xi) = xi ∫_0^1 t^(c_i) g_i(t xi) dt,
    K = G(A0 + A1 ∂eta),   W_N = ∑_{0<=k<N} K^k G f.

This is the literal iteration used by the JS partial-sum constructor.
It solves the zero-axis regular singular equation once the series is
summed. The larger strip contains $S_{2s}$, where $s$ is the recorded
solution strip, and the recorded loss is $\Delta=s\le1$.

The enforced A1 mask sends the first four coordinates into the last
two and annihilates the last two. Diagonal Volterra factors preserve
both subspaces, as does parameter differentiation of the support mask.
Thus two adjacent A1 derivative operators in any expanded word vanish
both when the outer derivative acts on the inner matrix and when it acts
on the rest of the word. A nonzero word of length $k$ uses at most
$p=\lceil k/2\rceil$ parameter differentiations. For each word, distribute
the strip loss across those derivative operators and apply Cauchy to the
remaining analytic product under each radial integral. This controls
derivatives on variable coefficients without assuming constant matrices.
The ordered simplex contributes $a^{k+1}/(k+1)!$ and each diagonal weight
has absolute value at most one. There are at most $2^k$ words. If the
actual norms of A0, A1 and f are each at most $C/2$, the source bound is

    ||K^k G f||_(S_s) ≤ (C a)^(k+1)/(k+1)! · max(1,p/Delta)^p.

For the complex natural auxiliary disc, integrate along the straight
radial segment $t\xi$. The same ordered simplex and absolute bounds
apply for every $|\xi|<a$. The actual collar uses $0\le\xi\le a$.

Let $m=k+1$ and $z=Ca$. With $p\le m/2$ and $\Delta\le1/2$,
the preceding bound is at most $[3z/\sqrt{2\Delta m}]^m$.
Here $m!\ge(m/3)^m$ follows from the integral lower estimate for
$\sum_{j=1}^m\log j$ and $e<3$. When
$m\ge72z^2/\Delta$, the term is at most $4^{-m}$. Hence for
$N\ge\lceil72 C^2a^2/\Delta\rceil$ the literal tail is bounded by
$4^{-N}/3$. The indexing is the source's first omitted iterate $k=N$.

The original stored solution norm also follows with its exact constant.
With $x=3z^2/\Delta$, use $p^p\le3^p p!$ and
$m!\ge p!(m-p)!$. The even term $m=2j$ is at most $x^j/j!$
and the odd term $m=2j+1$ at most $z x^j/(j+1)!$. Thus the total is
bounded by $e^x-1+z e^x$. Since $z\le\sqrt{x/3}$, it is at most
$e^{3x/2}$. For $x\ge4/3$ use $z\le x/2$. For $x\le4/3$ use
$z\le2/3$ and $e^{-x}+x/2\ge(1+\log 2)/2\ge3/4$.
Together these imply $z\le e^{-x}+(e^{x/2}-1)$ in both ranges.
The source norm is therefore $e^{9 C^2a^2/(2\Delta)}$.

Normal convergence on $S_s$ and Cauchy on a smaller strip permit
passing to $W=G(f+(A_0+A_1\partial_\eta)W)$.
For uniqueness, a difference of two bounded holomorphic solutions equals
its $k$-fold image under $K$. Its bound has $k!$ in the denominator and
at most $\lceil k/2\rceil$ Cauchy factors. The $k$th root tends to zero
on a smaller common strip. This proves uniqueness there and on their
common analytic parameter neighborhood by identity of analytic functions.

## All fixed mixed derivatives and the radial axis

For continuous $g$ the regular identity at all $0\le\xi\le a$ is

    ∂xi (Gg)_i = g_i(xi) - c_i ∫_0^1 t^(c_i) g_i(t xi) dt.

For $r\ge1$ its $r$th derivative uses $g_i^{(r-1)}$ in both terms
and replaces the integral weight by $t^{c_i+r-1}$. Its operator norm
on that derivative is at most two. This avoids applying $1/\xi$
at the axis.

The integral equation first gives a continuous radial derivative of
$W$ on any smaller strip. Repeat the regular formula, using the
Cauchy estimate for the parameter derivative at each step, to obtain
each fixed higher radial derivative and its continuity at the axis.
Each finite partial sum has the same regularity.
Set $E_N=W-W_N$. Then $E_N=G(A_0+A_1\partial_\eta)E_{N-1}$.
Choose any fixed $R$ and $s_j=s(1-j/(2(R+1)))$ for $0\le j\le R$.
For $j\ge1$ put $d_j=s_{j-1}-s_j$ and choose $B_j$ as the maximum of
1 and the following finitely many explicit bounds over $0\le\ell<j$:

    2 ∑_{i=0}^ell binom(ell,i)
      ( ||∂xi^i A0||_(S_sj) + (2/d_j)||∂xi^i A1||_(S_sj) ).

One Cauchy estimate from $S_{s_{j-1}}$ to $S_{s_j}$ and the regular
radial formula give

    max_(0<=r<=j) || ∂xi^r E_N ||_(S_sj)
      ≤ (∏_(1<=i<=j) B_i) 4^(-(N-j))/3

when $N-j$ is at least the source value-tail threshold. The product
and the powers come from iterating the same error equation. The
bound proves uniform convergence of each fixed radial derivative, not
just differentiability of the limit. At real $\eta$, use a circle of
radius $s/2$ within $S_{s_R}$ for any fixed $m$. This adds the factor
$m!(2/s)^m$ to the mixed error. The proof also places all fixed radial
derivatives on the common smaller open strip $S_{s/2}$, with a distinct
bound for each derivative. For $R=0$ this recovers the source's
stored $\eta$-derivative tail. The mixed estimate has an additional
radial constant and shifted truncation index.

Let $P=\operatorname{diag}(1,1,1,1,-1,-1)$. In the original kernel
$A_\ell(-\xi)=-P A_\ell(\xi)P$ for $\ell=0,1$ and
$f(-\xi)=-P f(\xi)$. In A0 the first four to last two and last two
to first four entries are even. The pressure entry and last two
diagonal entries carry one explicit $\xi$ and are odd. The A1 block
is even. The first three forcing entries are zero, pressure forcing
carries $\xi$, and the two remaining forcing entries are even. These
are structural properties of the source formulas at $X=\xi^2$.
The same conditions hold for the original actual order-one source.
The Volterra operator flips the scalar parity of its forcing.
Induction on the iterates therefore gives $W(-\xi)=P W(\xi)$.

For any first-four component $w$, the ordinary one-sided derivative
in $X$ is furnished by the exact formula

    ∂X^r w(sqrt(X)) = 2^-r ∫_[0,1]^r
       (∏_(j=0)^(r-1) t_j^(2(r-1-j)))
       w^(2r)(sqrt(X)∏_j t_j) dt.

For $r=1$ this is the FTC on $w'$ using $w'(0)=0$. Iteration contributes
the squared previous radial factors at each step. At $X=0$ the
integral factor is $r!/(2r)!$. The formula holds for every fixed
$\eta$ derivative by the mixed convergence estimate. It never needs a
singular square-root division at zero.

## Discharging the recursive source-data conditions

The following bounds apply to the actual source recurrence using the
pinned leading-data theorem and ordinary operations in its proved domain.

- The leading actual core has the independently derived B.26 and natural
  joins and original majorant $B$ on its actual tube. The auxiliary
  leading source uses $|Y|\le8$, $Y=\Lambda X$, with the same natural
  analytic coefficient norm $Q$. The sum of the geometric scales is
  $8/20+1/4=13/20$ on the quoted natural tube, yielding a multiplier
  below 3. The original complex $g$ is bounded by its recorded
  $e^{128\Lambda/\sigma_*^2}/C_{\rm Selected}$. Indeed
  $|H_*|<16$, $|H_*'|<24$ there. Starting from a real parameter
  where $H_*^2+\sigma_*^2\ge\sigma_*^2$, moving at most
  $\rho/4=\sigma_*^2/(4\cdot65536)$ leaves this denominator above
  $\sigma_*^2/2$ in absolute value. $|L|<2$ gives
  $|\zeta|<64/\sigma_*^2$ and the actual integration path from zero
  has length below 2. This yields the exact source majorant for the
  leading auxiliary data, with no substituted leading profile.
- At order $i<n$ the auxiliary solution is holomorphic in $Y$ on
  $|Y|<r_i$, $r_i=6+2^{-(i-1)}$, by the complex radial Volterra
  argument and even parity. Cauchy at the positive gap $r_i-r_n$
  gives the source $X$-derivative multiplier
  $\max(1,2\Lambda^2/(r_i-r_n)^2)$ through order two. The leading
  auxiliary uses $8-r_n$ for the same purpose. For the actual core
  $0\le X\le1/\Lambda$, the leading functions, original lower
  cutoffs and regular averages coincide with their auxiliary restrictions.
  The identical Volterra equations and uniqueness give the same raw
  profiles there. Radius one in $Y$ supplies $2\Lambda^2$ for the
  source core multiplier through order two.
- On the actual remaining collar $X\ge1/\Lambda$, $\xi\ge\Lambda^{-1/2}$.
  Use the same original equations $F_\xi=W_4$ and $U_\xi=W_5$,
  with zero-based indices. Their first $X$ derivative is $W_j/(2\xi)$,
  and the second is $W_j'/(4\xi^2)-W_j/(4\xi^3)$. For source solution
  bound $M$, on $S_{s_i/2}$ Cauchy yields
  $|W_j'|\le M(2C_i/s_i+3\sqrt{\Lambda})$. Consequently the
  $X$ derivatives through order two are bounded by
  $64 C_i M\Lambda^2/s_i$, using $C_i,\Lambda\ge1$ and $s_i\le1$.
  The cutoff factors multiply this by at most
  $1+2\kappa_1+\kappa_2$, using the literal logarithmic cutoff and its
  original derivative bounds. The bump corrections lie beyond the
  inner source interval and do not enter these raw norm estimates.
- Write $\omega=s_{n-1}$ for the preceding auxiliary strip. Every
  lower cutoff-local $H_i$ bound holds on $S_{\omega/2}$.
  The original averaging operator is
  $\int_0^1 U_i(tX,\eta)dt$, a contraction in each of the two $X$
  derivatives. On $S_{\omega/4}$ the original formula for $v_i=V_i/X$
  gives the stored bound $128(1+2ih)H_i/\omega$ by Cauchy.
  On $S_{\omega/8}$ the additional $\eta$ factors $16/\omega$
  and $2(16/\omega)^2$ dominate the first and second derivatives.
  The target is $S_{4s_n}=S_{\omega/64}$. For auxiliary order one
  the predecessor is the original leading source width $\delta/8$;
  the same strip ratios apply. For original actual order one consume
  its separate independently verified majorant.
- On $|\eta|\le33/32$, $|L^{-1}|<2$, $|d|<3$ and $|X|,|\xi|\le1$,
  expand $Z_a=P_a+Q_X\partial_X+R\partial_\eta$ and its two
  derivatives, preserving coefficient derivatives. The exact bounds in
  the Python receipt validate the stored $Z,DXZ,DEZ,ZZ$ constants.
  The original lower pair forcing includes all $i,j$ terms and its
  $\Omega/X$ radial viscous term has bound $6V_{n-1}$. The three
  nonzero forcing entries have bounds $2p_{\rm known}$,
  $2H_\theta$ and $2H_z+16p_{\rm known}$, as stored.
- Direct row sums of the original linear kernel are bounded by
  $512(1+E)(1+H_0+V_0+Z(H_0))$, with $E=4+2nh$.
  This is a row-sum bound, including the A0 and A1 rows containing
  several terms. Thus the source definition $C=2(\text{matrixBound}
  +\sum_i\text{forcingBounds}_i)$ justifies the $C/2$ hypothesis.
  The exact coefficientwise comparisons are included in the Python
  receipt.

For every fixed derivative, the lower coefficients are smooth in $X$
on the real collar and holomorphic in $\eta$ on the smaller common
strip. Flat radial cutoffs and the regular integral average preserve this
property. The finite lower convolution and the local $Z,T$ differential
operators preserve it after the above positive strip losses. Thus the
hypotheses of the Volterra and mixed-convergence argument recur at the
next fixed order. The constants may grow with order and derivative.
This is an induction on the original uncut coefficient problem and
does not require a uniformly positive parameter strip or a uniform
global norm.

## Source implementation and scope controls

The input records and source hashes in `original-paths.json` pin these
paths. The executable checks cover both the actual and auxiliary
systems at orders 1 and 2.

- `definePicardSystem` checks the original six-dimensional diagonal,
  the formal $\xi,\eta$ coordinates and the A1 block mask.
  `picardPartialSum` implements the literal $G$ kernel and derivative
  word expansion above. Its finite display is separately limited.
- `picardRhs` forms the exact binomial derivative of
  $f+A_0W+A_1\partial_\eta W$ by differentiating the coefficient
  functions. `picardRadialDerivative` implements the regular radial
  identity. The `actual_background_picard` chain rule uses both that
  radial derivative and the incremented $\eta$ order after actual
  argument substitution.
- `actual_background_even_profile` increments the corresponding
  ordinary $X,\eta$ derivative orders and applies the chain rule to
  both actual operands. The induction implementation of
  `materializePicardEvenDerivative` is the iterated regular integral
  above. The original historical order-one implementation also has
  a specialized first radial axis derivative.
- The checks verify the exact $\xi$ parity of all stored A0, A1 and
  forcing roots after removing the shared $\xi^2$ subexpression.
  The two fixed-argument derivative paths, pulled-back chain rule and
  mixed even derivative paths were checked against original graph
  node identities. No producer or runtime gate was edited.

The original registry emits the actual order-two Picard descriptor
for $\xi=2a$ (node 120894 in this replay), although the recorded
source radial interval is $[0,a]$. This is a descriptor-construction
result. It supplies a concrete remaining domain obligation for every
native application and for bound-variable environments inside each
actual integral. No outside-domain value was evaluated.

The two synthetic controls check that the original registration guard
alone supplies neither parity nor parameter analyticity. With all
matrices zero and the first forcing equal to 1, the first Picard
coordinate is $\xi$. Its falsely designated even profile is
$\sqrt X$, which has no finite inward derivative at zero, although
the generic materializer emits zero when parity is omitted. For a
parity-preserving example, take $A_{0,0,4}=1$, $A_1=0$ and
$f_4=|\eta|$. The first coordinate is $\xi^2|\eta|/8$ and its
ordinary $\eta$ derivative at zero does not exist for $\xi>0$.
The source differentiator rejects the synthetic maximum expression.
The controls do not modify the actual systems.

The mathematical local Picard implication, exact source constants,
ordinary mixed limit and even-axis formulas are now supplied under
the original leading-input semantics and matching source domains.
A separate complete native call-site proof must transport the original
domain to each substituted $(X,\eta)$ or $(\xi,\eta)$ and each
integral binder. The exact source descriptor at $\xi=2a$ shows why the
graph shape and sparse mask cannot discharge this step. Full global
positive-pressure/stream primitive and cutoff proofs are consumed by
the axial bridge separately. No independent all-native numerical
enclosure, infinite cutoff residual, or terminal jet status is claimed.

Reproduce from the common workspace root:

    python work/goal-next/axial-picard/check_majorants.py
    node --max-old-space-size=3072 work/goal-next/axial-picard/check_original_paths.mjs work/goal-next/axial-picard/original-paths.json

