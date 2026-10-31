# Source-specific n=1 leading U0 and v0 binding on the inner interval

## Status and exact scope

`check_leading_binding.py` authenticates all 4,420,257 original nodes and the exact function registry, and checks the pinned `source-profile-data.mjs` SHA. It compares five source subtrees with the Picard system 0 `sourceLeading` subtrees by exact DAG interning, with associative/commutative normalization of real addition and multiplication, alpha-renaming of integration dummy coordinates, and the explicit substitution `X=xi²`. It does **not** use digests as equality, numerical values, or rewrite under integral binders. The source operations must be defined, integrals must be valid under renaming, and the real arithmetic interpretation must apply. Branch simplifications only hold in the intervals below.

| Region | actual leading subtree | Picard subtree | result |
|---|---:|---:|---|
| `0<X<Xa` | U #4786 | #25605 | exact structural match |
| `0<X<Xa` | v #6201 | #25619 | exact structural match |
| `Xa<X<Xminus` | U #4788 | #25621 | exact structural match |
| `Xa<X<Xminus` | collar mass #5255 | #25625 | exact structural match |
| `Xa<X<Xminus` | v #6193 | #25636 | exact structural match after guarded branch rewrites |

The last row requires the **three** actual branch rules `#5175→#4788`, `#5293→#5255`, `#6182→#5665`. The third is essential: previous unqualified normalization did not prove the v match. The checker asserts the complete individual piecewise node shapes, rejects a changed #5675 branch, and checks that omitting `#6182→#5665` makes the v comparison fail. Its branch rewrites are rejected inside any integral binder; dummy coordinates are normalized only as genuine scoped binders, with capture of X or xi explicitly disallowed.

## Why the branches apply

Source graph `#25638` is Picard system-0 U0, and `#25637` its v0; the checker verifies both exact registry entries. In the actual leading source, #9236 is global U0 and #18778 is global v0. For `0<X<Xminus`, `#18778` selects #6202 because `X<Xminus<loopILeft #6257`. #9236 is #5175 plus a loop bump with literal zero left branch and two step-derivative terms. The loop bump vanishes before loopILeft; the step derivatives vanish on their left flat plateau because `X/X0I1<1`, so both `2(X/X0I1-9)` and `2(X/X0I1-10)` are negative. This uses defined factors and the source step's smooth derivative semantics; 0 times an undefined factor is not justified.

The source-real parameter definitions and their exact AST matching are in `../axial-exterior/SOURCE_GUARDS.md`: `Xa<4`, `0<t1<1`, `T>10`, `Pstar=exp(2T)>1`, `CSelected>1`, `XR=110(CSelected*Pstar)^10`, `loopILeft=Xa exp(t1/8)`, and `X0I1=XR exp(60001T-23)`. Thus

* `Xminus=Xa exp(t1/128)<loopILeft`, and `Xminus<4 exp(1)<12`.
* `XR>110 exp(20T)`, hence `#4564=XR exp(-8)>110 exp(20T-8)>110>Xminus`; #4564<#4567<#5089 by the exact graph exponents -8,-7,-5.
* `X0I1>XR>110>Xminus`.
* `Xminus<12<110` and `Xminus<a²=Xa exp(t1/16)`.

Therefore on `0<X<Xa` both the actual and Picard choices select their core U/v branches; on `Xa<X<Xminus` all the source's left-first choices select the indicated collar branches. The substitutions are strict to avoid silently assuming a neighborhood or derivative at Xa. Equality at Xa and the axis require independent continuity/one-sided regularity. For derivatives appearing in raw #117045, pointwise structural equality on an open X-eta rectangle permits equality of derivatives only after real interpretation, local definedness, and required smoothness are separately established. No AST name itself proves these conditions.

This does **not** prove F0 binding, Picard convergence/ODE satisfaction, actual row-5 AST identity, total moment vanishing, endpoint jets, caller-native domain or any all-order result. The `X=xi²` change uses positive xi for the open-X comparisons. The result is no increment to M3 62/64, M4 0/16, Y 33/523, jets 0/67 or RELEASE HOLD.

Reproduce from the package root:

```
python axial-inner/check_leading_binding.py --source inputs/graph --profile inputs/producer/source-profile-data.mjs --out leading-binding.json
```
