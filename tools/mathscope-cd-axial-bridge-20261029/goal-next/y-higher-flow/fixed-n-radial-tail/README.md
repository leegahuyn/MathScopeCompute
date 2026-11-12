# Actual fixed-order Picard: source tail constants and a radial derivative tail

The original N4 raw export is independently hashed over all 7,358,162 nodes. The Python audit binds the original registry, the original Picard implementation source SHA, all five actual Picard system IDs, their exact source operands and the original A1 block mask. The following table is source AST data, not an evaluated value of the enormous source index:

| Actual order n | System | Source C | Solution strip s | Source K | Source solution norm M |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | 24818 | 24807 | 24825 | 24848 |
| 2 | 3 | 118568 | 117678 | 118577 | 118573 |
| 3 | 5 | 121892 | 120822 | 121901 | 121897 |
| 4 | 7 | 125092 | 123872 | 125101 | 125097 |
| 5 | 9 | 128610 | 127243 | 128619 | 128615 |

For every listed row, integer/rational AST normalization checks the **actual source expressions**

    K = ceil(72*C^2*a^2/s),     M = exp(9*C^2*a^2/(2*s)),
    a^2 = source node #24805,  actual radial domain = [0,sqrt(a^2)].

Order one uses its own source bootstrap `s=delta/8` and source strip `2s`. Orders 2–5 use `s=delta/(8*256^n)` and source strip `4s`. The source 6-by-6 A1 has nonzero entries only in rows 4–5, columns 0–3; its original nilpotence is checked from the actual system registry. The source-declared value tail is `4^(-N)/3` once `N>=K`. The audit checks 100 exact rational instances of the sufficient factorial threshold and the original regular radial-derivative implementation. It does not numerically evaluate K or the actual coefficient norms.

## Conditional fixed-n value convergence

Assume the original coefficient functions and forcing are continuous in
the actual radial interval, holomorphic in eta on the tube of radius 2s
about [-1,1], and each has the source row or vector norm bound C/2
there. Take 0<s<=1 and a,C>0. All five audited actual systems have a
source strip at least 2s. The argument also applies at any other fixed
order satisfying these assumptions and the same matrix mask.

For a Picard term with L diagonal Volterra integrations, the innermost
operand is the forcing and the other L-1 operands are A0 or A1 times an
eta derivative. There are at most 2^(L-1) words. The A1 mask maps the
first four coordinates to the last two and kills the last two. Diagonal
Volterra integration and eta differentiation preserve that two-coordinate
subspace. Adjacent A1 derivative operators therefore vanish even with
different radial arguments and when a derivative hits an inner matrix
entry. Each surviving word contains at most floor(L/2) eta derivatives.

In ordinary radial integration variables each diagonal factor is
(inner radius / outer radius)^c with c>=0. Its absolute value is at
most one. The L radial integrals range over an ordered simplex of
volume at most a^L/L!. For a word with d>0 eta derivatives, allocate
strip width s/d to each derivative between the outer tube 2s and
the final tube s. Cauchy bounds each derivative by d/s. The word
with no derivative consumes no strip width. Together with C/2 for
each operand and the word count, the term with L integrations obeys

    ||T_L||_(S_s) <= (Ca)^L/(2 L!)*max(1,d_max/s)^d_max,
    d_max = floor(L/2).

For L>=2, use L! >= (L/3)^L, from
sum_(j=1)^L log(j) >= integral_1^L log(x) dx and e<3.
Since s<=1 and d_max<=L/2, the right side is at most
(3Ca/sqrt(2sL))^L/2. For L>=ceil(72(Ca)^2/s) this is at most 4^(-L)/2.
Consequently the series converges uniformly on the actual real radial
interval and S_s. After N>=K terms its error is at most 4^(-N)/6,
which supplies the original stated bound 4^(-N)/3. Convergence on
smaller eta tubes also allows the first eta derivative in the Volterra
equation by Cauchy. This argument uses the source analytic and
coefficient-majorant premises and gives the mathematical value limit.
The correspondence to the native limit and the original coefficient
majorants still require their source proofs.

## Conditional fixed-n first radial derivative

Fix an original actual system under the preceding assumptions. Write
`E_j=W-W_j` for the mathematical Picard error and use

    ||E_j||_(S_s) <= 4^(-j)/3     for j >= K.

Assume the original coefficient functions have the regularity needed for the original Volterra equation and uniform holomorphy in eta on the stated strips. Define `G_i f(xi)=xi*integral_0^1 t^(c_i) f(t*xi) dt`. The original regular identity is

    (G_i f)'(xi) = f(xi) - c_i*integral_0^1 t^(c_i) f(t*xi) dt.

It is valid also at xi=0 and has norm at most 2 because the original diagonal `c_i` is nonnegative. The exact error equation is `E_N=G(A0 E_(N-1)+A1 partial_eta E_(N-1))`. Cauchy from `S_s` to `S_(s/2)` gives `||partial_eta E_(N-1)||<=2||E_(N-1)||/s`. Consequently, for every integer `N>=K+1`,

    ||partial_xi E_N||_(S_(s/2)) <= C*(1+2/s)*4^(-(N-1))/3.

For every fixed m and real eta in `[-1,1]`, a second Cauchy estimate on disks of radii approaching `s/2` gives

    |partial_eta^m partial_xi E_N|
      <= m!*(2/s)^m*C*(1+2/s)*4^(-(N-1))/3.

This bound is uniform for `0<=xi<=a`, including the axis, under the
original analytic and coefficient-majorant premises. On any positive
collar `X>=Xa=4/Lambda` inside the source radius, the first X derivative
of an even-profile component composed with `xi=sqrt(X)` costs at most
`1/(2 sqrt(Xa))=sqrt(Lambda)/4` times the same bound. Higher X
derivatives and the X derivative at the axis require further estimates.

A direct one-step Banach contraction does not follow from those source upper bounds. In an abstract permitted block-mask example with `a=1`, `A0=2`, `A1=0` and zero diagonal, the operator sends constant one to `2xi`, giving norm at least 2. This is a mathematical sensitivity example, not a counterexample to the actual source system. The original proof uses the ordered Volterra factorial and finite eta-strip losses to obtain decaying powers/tails, not a claimed universally contracting first iterate.

The native `picardPartialSum` display has an explicit maximum of eight terms and reports `finitePartialSumIsExactSolution:false`; neither that display nor this audit evaluates the generally huge K. Higher xi derivatives, the even-X/axis derivative, per-caller domain, original coefficient-majorant proof, all-order source realization and final jets remain separate. RELEASE HOLD remains unchanged.

Replay using the original N4 graph and registry from GitHub run 43055678022,
and the original Picard implementation in the pinned runtime:

    python -B audit_tail_parameters.py GRAPH_JSONL_GZ REGISTRY_JSON FUNCTIONS_MJS /tmp/tail-parameters.json
    python -B check_value_tail.py /tmp/tail-parameters.json PROFILE_MJS FUNCTIONS_MJS /tmp/value-tail.json

The input hashes are `ce3238938bd5ed7cd5f1d554eddf2f15e774928388fbc54a978c45fea99731bd` for the full graph stream, `049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad` for the registry, and `326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311` for the Picard source. The tail receipt SHA-256 is `ae27c89dd4c11bdd284e857f8c6770693b14c4860d1cd5b8bb0045d8795e5016`.

The profile audit and integer word checks produce
`18f3ce0ec44992d2a1783ac687e8e6225b8845d7ff65cb091f70bcad81d85a8f`.
The regular radial norm bound and its preceding-error transfer compiled
in [GitHub Lean run 43281416160](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43281416160).
The two Lean statements use the weighted-average and Cauchy inequalities
as hypotheses. The original source assumptions are tracked in this report.
