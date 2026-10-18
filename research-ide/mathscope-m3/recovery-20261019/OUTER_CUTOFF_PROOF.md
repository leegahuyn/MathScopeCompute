# Actual outer cutoff: closed-cell jets and exact zero extension

This is newly implemented work from verified saved source. It is not recovered
code from the interrupted late conversation. The evaluator binds the 20-node
primitive AST in the original localization artifact (SHA-256
`fa2acf400bb1fe8705bdb716d171882a3343562be3c5167e0fcb153d96cbf24e`)
and the same frozen final family
`b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78`.
The original paper, pp.117-118, (10.1)-(10.5), and blueprint pp.64,66 give the
localization and the distinct N7-06/N8-05 obligations.

## 1. Exact original primitive and interval arithmetic

Put F(u)=exp(-1/u) for u>0, with its smooth zero extension for u<=0.
The original outer cutoff is chi(s)=F(1-u)/(F(u)+F(1-u)), u=2s-1, on
1/2<s<1; it equals one on s<=1/2 and zero on s>=1. This is sigma_1,
not the sigma_2 bump in the inner profile. The evaluator compares the complete
archived primitive AST to this exact formula, including the piecewise branches.

For exp(-x), x>=0, range reduction gives x=2^k y, 0<=y<=1/8. With
S_n=sum_{j=0}^n y^j/j!, the next-term geometric estimate is

    S_n <= exp(y) <= S_n + (y^(n+1)/(n+1)!)/(1-y/(n+2)).

Reciprocation and k outward-rounded squarings enclose exp(-x). For x>=bits,
e>2 gives 0<exp(-x)<2^(-bits); a zero lower endpoint is an enclosure, never
substitution of zero for the actual positive exponential. All endpoints are
Fractions; dyadic rounding explicitly uses floor for the lower endpoint and
ceiling for the upper endpoint.

The original recurrence F^(n)(u)=P_n(1/u)exp(-1/u),
P_(n+1)(v)=v^2(P_n(v)-P_n'(v)), gives ordinary derivatives. Each monomial
v^j exp(-v) increases up to v=j and decreases afterwards. Endpoint values,
the possible interior maximum, and its zero limit at infinity give a rational
interval for the whole closed input interval, including u=0. Signed sums of
these intervals enclose P_n(v)exp(-v) without sampling.

For G(u)=F(1-u) and H=F+G, at least one of u,1-u is >=1/2, so
H>=exp(-2)>0 on [0,1]. Quotient derivatives are obtained recursively from

    (G/H)^(n) = (G^(n) - sum_{k=1}^n binom(n,k) H^(k)(G/H)^(n-k))/H.

Multiplication by 2^n converts u derivatives to s derivatives. Intervals that
cross a seam include the flat exterior jet. The exact center identities are
chi(3/4)=1/2, chi'(3/4)=-4, chi''(3/4)=0 and chi'''(3/4)=128.
Finite orders 0..3 are the required numerical orders here, not a claim that
finite samples establish smoothness of all orders.

## 2. The 13 actual cutoff jets requested by the energy operator

Use the original constants r0=1, tau0=qbig/32 and z0=tau0^(1/2-h), with
the unchanged strictly positive h. Let z=z0*zeta and tau=tau0*rho. Then

    C(s,z,tau)=chi(2s)*chi(2*zeta^2)*chi(rho), s=x^2+y^2.

The axial normalized derivatives through order three are

    Z0=chi(2*zeta^2),
    Z1=4*zeta*chi'(2*zeta^2),
    Z2=4*chi'(2*zeta^2)+16*zeta^2*chi''(2*zeta^2),
    Z3=48*zeta*chi''(2*zeta^2)+64*zeta^3*chi'''(2*zeta^2).

Thus the ordinary physical jet C@a,b,c is enclosed by
2^a chi^(a)(2s) Z_b chi^(c)(rho) times z0^(-b) tau0^(-c).
These positive physical scale expressions are preserved, not converted to
zero/infinity in floating point. The rational intervals are normalized
coefficients, so they are not mislabeled as evaluated physical derivatives.
The exact archived energy polynomial binding supplies the 13 requested orders;
the 67 other A/b/p jets remain separate.

## 3. Global zero branch and remaining cells

The fixed normalized box [-1,1]^3 contains all K, with
K contained in {x^2+y^2<=1/2, zeta^2<=1/2}. On any closed cell whose
minimum radial square or axial square is >=1/2, the original flat cutoff
and all of its derivatives vanish. The smooth global zero extension therefore
has u=0, p=0, grad(u)=0 and f=0 there. Outside the local chart we use the
specified zero extension directly; we do not evaluate an undefined local field
and multiply it by zero. This remains valid at the flat support boundary.

On rho in [1/2,1], the 8^3 partition gives 320 exact-zero cells and 192 cells
requiring actual field operands. Doubling the grid gives 2,656 exact-zero cells
and 1,440 cells requiring those operands. The unresolved normalized covering
volume changes from 3 to 45/16; this is a support-cover calculation, not an
energy-defect convergence result. Every spatial cell is retained and indexed.
No quadrature result is inferred from the zero subset.

The existing proof that corrections j>=5 vanish on this positive time slab is
reused with its exact source scope. It does not remove stages 1..4, the initial
state, or the distinct slow-base coefficient series and its tail.

## 4. Execution and limits

Run `python research-ide/mathscope-m3/recovery-20261019/run_outer_cutoff.py`.
The independent tests use the repository's pinned mpmath 1.3.0 dependency:
`python -m unittest discover -s research-ide/mathscope-m3/recovery-20261019 -p test_outer_cutoff.py -v`.
They check the analytic recurrence, exponential enclosures, the original quotient
and its derivatives by a separately evaluated high-precision expression, seam
behavior, exact cell geometry, and rejection of terminal/invalid input. The
sample comparisons are diagnostic checks supporting the rational enclosure
derivation; they are not themselves a whole-domain proof.

N7-06 still needs the actual whole-K energy terms and independent space/time
normalized-defect comparisons consistent with (10.13). N8-05 still needs four
actual doubled-axis comparisons and separate tails. The concrete blocked run
requests preserve grid, Fourier cutoff, coefficient order and arithmetic
precision as the four axes. No new tolerance, field monotonicity, or forced
tau schedule is imposed as an original acceptance condition. All missing
energy values, comparison values and the actual last-resolved tau remain null.
