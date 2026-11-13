# Fixed-order radial Picard tails and native even-X selector

This is a conditional, arbitrary **fixed** derivative convergence estimate for the original Volterra equation, together with a finite exact source-selector audit. It is not a Lean theorem, a native evaluation of the source truncation index, a uniform-in-order estimate, or a promotion of Y/release gates.

## Inputs and source scope

Take one of original actual systems `(n,system)=(1,0),(2,3),(3,5),(4,7),(5,9)` and its original real radial interval `0<=xi<=a`. The prior source receipt pins their exact C, solution strip s, source strip, Kcondition and axis diagonal `c=(0,0,2,0,3,1)` on graph `ce323893...1031bd`. The parity receipt checks the original A0/A1 and forcing parity at these five source systems, plus a wrong-parity negative control. Both prior receipts and original selector implementations are pinned by `verify_exact_coefficients.py`; this script verifies the receipts' bindings, not their prior source audit from scratch.

Assume the original source value-tail premises have been established on S_s, so for `W_N=sum_(k<N) K^k G f` and `N>=K=Kcondition` the genuine limit W satisfies `||W-W_N||_(S_s)<=4^(-N)/3`. Assume A0,A1,f are continuous in xi, holomorphic in eta on a neighborhood of the needed strips, and their relevant fixed xi derivatives exist continuously and are bounded there. The actual forcing/cutoff source regularity and same-source auxiliary/core agreement must be established separately; neither is implied merely by this estimate. `G` and `K` are the original operators:

`(Gg)_i(xi)=xi integral_0^1 t^(c_i) g_i(t xi)dt`, `K=G(A0+A1 partial_eta)`.

## Explicit derivative-tail induction without assuming limit differentiability

For any fixed integer R>=1 define `s_j=s*(1-j/(2(R+1)))`, j=0,...,R, and `d=s/(2(R+1))`. Every strip margin is strictly positive, and `s_R>s/2`. Let `C_(l,k,j)` be any finite bound on the induced row norm of `partial_xi^k A_l` on `[0,a] x S_(s_j)`. Define

`B_j=max(1,2,a) * max_(0<=q<j) sum_(k=0)^q binom(q,k) (C_(0,k,j)+2 C_(1,k,j)/d)`.

The 2/d factor deliberately leaves slack in the Cauchy radius. The regular Volterra formula is, for q>=1,

`partial_xi^q (Gg)_i = partial_xi^(q-1)g_i(xi) - c_i integral_0^1 t^(c_i+q-1) partial_xi^(q-1)g_i(t xi) dt`.

Because every original c_i>=0, its operator norm on the displayed derivative is at most 2; for q=0 use `||Gg||<=a||g||`. For finite partial sums define `M_j(H)=max_(0<=q<=j)||partial_xi^q H||_(S_sj)`. Product rules and Cauchy yield

`M_j(K H)<=B_j M_(j-1)(H)`.

For P>N, the literal finite sums obey `W_P-W_N=K(W_(P-1)-W_(N-1))`. Applying the above R times and using the given original value tails at the smaller indices proves, for N-R>=K,

`M_R(W_P-W_N) <= (2/3) (product_(j=1)^R B_j) 4^(-(N-R))`.

This first proves that all derivatives through R of the actual finite partial sums form a uniform Cauchy family on the smaller strip and radial interval. Standard uniform derivative convergence identifies their limits with the xi derivatives of W; no differentiability of W was assumed to begin the induction. Passing P to infinity and using the single value-tail bound gives the sharper

`max_(0<=q<=R)||partial_xi^q (W-W_N)||_(S_sR) <= (1/3)(product B_j)4^(-(N-R))`.

For eta derivatives, Cauchy on a circle of radius s/2 around each real eta in [-1,1] gives an additional factor `m!*(2/s)^m`. For R=0 use the original value tail directly. B_j may depend on R and the fixed source parameters, and the strip need not remain positive uniformly as R or source order tends to infinity.

## Even X derivatives and the separate odd quotient

For any first-four component w with the source's genuine even parity and every fixed r>=1, the original selector uses

`partial_X^r w(sqrt X) = 2^(-r) integral_[0,1]^r (product_(j=0)^(r-1) t_j^(2*(r-1-j))) w^(2r)(sqrt X product_j t_j) dt`.

The positive integral weight is exactly `r!/(2r)!`. Therefore the source even-profile X^r and real eta^m tail is bounded by

`[r!/(2r)!] * m!*(2/s)^m * (product_(j=1)^(2r) B_j) * 4^(-(N-2r))/3`,

provided `N-2r>=K` and B_j is computed with R=2r. At X=0 the integral formula remains regular and gives exactly `r!/(2r)! * w^(2r)(0)`. This is the analytic conversion used for the third X derivative when r=3; it requires convergence through xi order six, not only the already formalized first X derivative.

For an odd q with q(0)=0, the *separate analytic quotient* `q(sqrt X)/sqrt X=integral_0^1 q'(t sqrt X)dt` has X^r bound factor `r!/(2r+1)!` against `||q^(2r+1)||`. Apply the preceding xi tail with R=2r+1 when that quotient is actually required. The inspected `picardEven` selector **does not** accept odd components; this auxiliary identity is not a claim that it creates such a selector or that any particular caller requests it.

## Native budgets and axis branch

The original standalone n1 `ActualConvergentExpressions.picardEven` permits only components 0–3, radial X order 0–4 and eta order 0–8. Its X=0, radial-order-one case has a separate direct equation-coefficient implementation; the integral representation must be proved equal to this branch using the same ODE and regularity. The higher `ActualInductionExpressions` adapter also permits only components 0–3 and requires `derivativeBudget(2*r,m)`, plus its separate node budget. The original displayed partial sum is limited to 0–8 terms and is not the mathematically certified K-term sum. Thus the arbitrary-fixed-r theorem does not imply arbitrary native materialization or a checked numerical source tail. In particular, r=3 is within the standalone source's stated selector range but has not been newly materialized or evaluated here.

Reproduce the exact finite coefficient, source selectors, preexisting parity/tail receipts and monomial controls with

`python -B verify_exact_coefficients.py --source-dir <original-navier-source-directory> --out <coefficient-receipt.json>`.

The executable checks coefficient identities for r=0,...,16 and all monomials through degree 20, and detects the need for evenness via the w(xi)=xi counterexample. The displayed arbitrary-r proof is the FTC/product/Cauchy argument above; a finite test is not its proof. No local Lean was compiled.
