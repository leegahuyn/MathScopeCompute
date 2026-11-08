# Original F0-to-Picard binding on strict inner regions

The authenticated graph binds actual `ActualFinalLeadingF` to #71959 and Picard system 0 `sourceLeading.F0` to #25601. `check_f0_binding.py` checks exact graph, function registry, profile hashes and two source-specific structural equalities after `X=xi^2`: on `0<X<Xa`, #71959 restricts to #4759 and #25601 to #25589; on `Xa<X<Xminus` the source's stated plateau and cutoff branches reduce the two expressions to the same structurally interned DAG. Three negative controls refuse the removed B8 plateau, removed heat cutoff, and a changed collar branch. This is a finite source-structure check, not a native numerical evaluation.

For the collar comparison the checker requires `Xminus < min(110,aSquared,XK,X0I2,X0I1,loopILeft,XR,XR exp(-5))` and `Xminus/XR<1/256`. The zero branch rewrites are sound only under left-first, non-eager real semantics on an open neighborhood, with all surviving and eliminated factors defined. Exact alpha-renaming of integral binders and associative/commutative real arithmetic are also required. The axis, Xa and Xminus are not covered by these open intervals.

For pinned parameter trees, the earlier source guard proof yields `Xa<4`, `0<t1<1`, `T>10`, `BOuter=1000T`, and `XR>110 exp(20T)`. It follows `Xminus=Xa exp(t1/128)<4 exp(1)<12`, `XR exp(-5)>110 exp(195)>12`, `Xminus/XR<1/256`, and `X0I2=XR exp(60001T-18)>XR>Xminus`. The cutoff ordering `Xminus<aSquared` and `Xminus<loopILeft` follow from the positive t1 exponents. These are symbolic real inequalities, not floating-point evaluations.

`check_terminal_guards.py` independently checks the full graph hash and matches the XK expression and its Qb/Qp copies modulo scoped integral renaming and real associative/commutative operations. It does **not** prove the analytic integral inequalities. Under the source's smooth normalized step and its fundamental-theorem-of-calculus and integrability assumptions, the argument recorded in `REVIEW.md` and `actual-continuation-exact-support.mjs` yields `Qb>1`, `0<Qp<h<1`, positive terminal wait and `XK>XR>Xminus`. This is a written conditional analytic argument, not a Lean proof or an evaluated certificate for native values. Omitting `Qb>Qp` is invalid: the synthetic Qb=1/2, Qp=1 gives a negative log wait; this does not assert those values are reachable in the original source.

At X=0, Xa, and Xminus, continuity and the needed derivatives must be proved independently. The natural-series operator, its integral and all source factors must have the required real smooth interpretation, and actual native arguments must lie in its domain. In particular, equality of these two conditional AST expressions does not show that the ideal Picard function converges, solves its ODE, cancels the actual axial residual, has zero full moments, or works for all recursion orders. M3/M4/Y/jets status and RELEASE HOLD are unchanged.

Reproduce against the bundled graph and profile:

```
python f0-binding/check_f0_binding.py --source inputs/graph --profile inputs/producer/source-profile-data.mjs --out f0-binding-result.json
python f0-binding/check_terminal_guards.py --source inputs/graph --profile inputs/producer/source-profile-data.mjs --out terminal-guards.json
```
