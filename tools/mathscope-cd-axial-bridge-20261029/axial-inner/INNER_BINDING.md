# Original #672 inner branch: exact AST binding, conditional on source semantics

`check_inner.py` authenticates the 4,420,257-node JSONL stream and exact registry, then checks selected nodes and system 0. No symbolic branch is treated as a proof that its chosen function solves a differential equation. This is a structural certificate with explicit conditions.

The source defines `Xminus=#28814=Xa exp(t1/128)`, `Xkeep=#28819=Xa exp(t1/64)`, `Xcut=#28823=Xa exp(t1/32)` and `a²=#24805=Xa exp(t1/16)`. For the pinned source parameters `Xa>0`, `0<t1<1`, the first three are strictly ordered and Xcut<a². The separate exact source guard audit proves `Xa<4`, `XR>110`, `T>10` and `B=1000T`; source parameter `X0Ipos=XR exp(T+2+60B-14)` is >XR. Since Xkeep<Xa exp(1)<12<110<XR, Xminus<Xkeep<X0Ipos. The bound exp(1)<3 is a standard elementary exponential bound. Exact numeric limits are not needed.

Under those inequalities and a defined, non-eager piecewise interpretation, for all `0≤X≤Xminus` and a fixed admissible eta, the positive-order global fields restrict to the same Picard system-0 components:

- F1 #29290 = #28834 = even-profile(system 0, component 0, X, eta).
- U1 #29289 = #28835 = even-profile(system 0, component 1, X, eta).
- Pi1 #50558 = #50557 = even-profile(system 0, component 3, X, eta).
- average #29336 = #29332 = ∫₀¹ even-profile(system 0, component 1, tX, eta) dt.

These follow because X is to the left of Xkeep and X0Ipos; the correction branches have literal zero left values. At Xminus the strict inequality Xminus<Xkeep gives an interior neighborhood in X, but X=0 requires its regular one-sided interpretation and cannot be inferred by substituting into a quotient. Formal functions 5,6,9,10 have exact parameters [#4756,#2] and those bodies. The raw source #117045 is separately retained, while #117047 is clipped to zero on the left. Thus the branch identity does not by itself prove raw #117045=0.

Picard system 0 has unknowns `(F1,U1,K1,Pi1,∂xi F1,∂xi U1)`, diagonal `(0,0,2,0,3,1)`, zero axis datum, `xi=sqrt X`, and its row for K1 has A0 entry −1 in column ∂xi U1, zero A1 row and zero forcing. Assuming the source Picard function satisfies its stated ODE in the required differentiability class, this gives

`∂xi K1 + 2 K1/xi = −∂xi U1`.

Set `J(xi)=xi² K1 + xi² U1 − 2∫₀^xi s U1(s) ds`. Then J'=0 on xi>0. Continuity at 0 makes J(0)=0, so `K1 = (1/X)∫₀^X U1(x) dx − U1` for X>0, and the equal limit extends to 0 under continuity. Hence the source's #29332 average agrees with the Picard combination `U1+K1`, *conditional on real Picard differential semantics, local integrability, and the axis limit*. The source operator having this name or zero datum alone does not prove those analytic assumptions.

The remaining exact obligations to prove raw #117045=0 on the inner region are: (1) actual leading U0, F0 and v0 entering #117045 equal the leading coefficients used by system 0 on the whole region, including mixed eta derivatives; (2) prove the Picard output converges and satisfies all six ODE rows with sufficient eta/radial regularity; (3) verify its row-5 algebra reproduces the actual eight source residual summands, including the double-Z lower U0 term, pressure exponent and `V=Xv`; (4) treat the axis via limits and verify the native arguments satisfy the domain. Source metadata asserting (5.2)-(5.8), cut branches and a finite partial Picard sum are not substitutes. Until all four are discharged, the actual inner residual, full moment cancellation and smooth cutoff gluing remain OPEN.

Reproduce `python check_inner.py --source <graph-dir> --out inner-binding.json`. The validator rejects a mutated nonzero left bump branch. It checks exact graph identity and the row structure, not any analytic conclusion. No M3/M4/Y/jet gate is promoted.
