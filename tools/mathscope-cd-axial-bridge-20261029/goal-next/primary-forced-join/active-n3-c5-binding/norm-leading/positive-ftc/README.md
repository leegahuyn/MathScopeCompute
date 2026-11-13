# Actual n1–3 positive-profile C8 FTC enclosures

This uses the unchanged original order-3 source constructor and exact same-profile norm producer. It supplies **six directed common upper bounds** for all F/U FTC rows of positive orders one through three on the original enlarged profile rectangle. It does not evaluate signed FTC quadrature, establish a same-live-private-family attachment to Primary K, bound weighted-target FTC leaves, prove any higher correction, or change the RELEASE HOLD decision. The original analytic norm and smooth-join proofs are required inputs.

## Why the existing ten selector rows are insufficient

The earlier `whole-k-prefix/HIGHER_FTC_SOURCE_UPPER_COMPARISON.md` bounds ten original n2/n3 pressure/stress selector operands; its profile derivative demand is total degree at most eight. A degree-eight F/U profile FTC row may differentiate its source jet once in X and once in eta, so the mixed face can require total degree ten. Neither the ten selector wins nor a native C8 name automatically evaluates that face. The construction here asks the original `attachActualInductionNorms` for derivativeOrder 10 on n<=3.

The original producer's 123,870-node prefix matches the earlier hosted/source replay by SHA-256 `ae216216f5076bd6d8c4d5a61f34af1979141af5f13b591c6de371bc0a672d9e`. The top-level source/norm modules and their 31 recursively discovered static imports match the already pinned original source bytes (`source-imports.json`); the separate arithmetic trace module is pinned as well. This is a finite exact source graph generation, not local Lean compilation.

## Same original rows and exact face bound

The normalized original profile norm has domain `[Xa/2,2 Xb] x [-1,1]`, exactly the C8 FTC box. For U_n use its original ordinary X/eta bounds of total order <=10. For F_n use the same original E_n bounds and `F_n=E_n/sqrt(2X)` on this positive-X rectangle, retaining every Leibniz term and the original Xlo denominator. For each of the six fields take the maximum H of these 66 source-only jet bounds. This calculation does not need the auxiliary-core maximum used in an earlier, more conservative scratch attempt because the source annular norm already covers the complete FTC box.

For each r+e<=8, all four anchored FTC face derivatives have total order <=10. As in the original source, each nonnegative face integrand is `sqrt(1+u^2)<=1+H`. Using eta width 2, radial width `Delta X=2Xb-Xa/2` and the original `4Xb<=Rstar^2`, the whole actual face sum satisfies

`0 <= FTC <= 3(1+Delta X)(1+H) <= 3(1+Rstar^2/2)(1+H)`.

No FTC norm is used to bound itself. The independent Python readback checks 270 rows and all 1,080 face records against the original sparse C8 source, including the exact six unchanged global source roots:

| order | original F | original U | new F upper root | new U upper root |
|---:|---:|---:|---:|---:|
| 1 | 117670 | 117671 | 420252 | 420255 |
| 2 | 120457 | 120455 | 420764 | 420767 |
| 3 | 123548 | 123546 | 421276 | 421279 |

The upper roots belong to the new norm graph; original F/U roots belong to the shared 123,870-node prefix. Do not mix them with the K norm namespace. The original exact arithmetic trace has 210,446 records and only the three actual non-arithmetic source integral boundaries #239,#257,#275. Their previously authenticated directed intervals are retained; no source integral is replaced by zero.

## Directed arithmetic

`evaluate_positive_c10.mjs` uses the existing 96-bit directed exponential interpreter with its reviewed monotone/coarse positive operations, the original parameter-definition graph and the three historical integral intervals. The completed `positive-c10-rectangle-directed.json` records all six upper endpoints as closed intervals with lower endpoint zero, using 6,060,050 directed arithmetic operations and preserving huge positive exponentials as exact nested endpoints. All six decimal-free numerators and their common dyadic denominator appear in `positive-directed-readback.json`. The n1/n2 F,U bounds have five nested exponentials, and n3 F,U have six; every innermost positive dyadic argument is less than 2^21. Define `T1=2`, `T_(j+1)=2^Tj`. Since `2^21<T5` and `exp(Tj)<T_(j+2)`, every original n1/n2 FTC sum is <T15, every n3 sum is <T17, and T17 is a single explicit common dyadic integer upper bound for all 270. These enormous integer towers are specified exactly and not expanded into bits. The interpreter is generic and does not by itself authenticate a source: this caller pins the runtime files, parameter tree, source packet and historical interval receipts. No floating-point binary64 decision or finite Picard display is substituted.

The trace's parameter named `K` has exact original definition `Pstar^2`; it is the earlier pressure scale and must not be confused with native Primary norm K #18310069. There are no unresolved native Picard leaves in this source-norm trace, and the three actual integral boundaries remain explicit and pinned; this is the noncircularity scope, not a proof that the whole Primary K has been bounded.

The same-profile source and exact root binding do not automatically imply the independent source graph is the same *live private family* inside a particular Primary K run; that explicit join remains required. The estimates depend on the original C10 source majorant, core/cutoff/global support, eta-side regularity and original exterior geometry proofs. They do not give a whole K enclosure: target FTC, other coefficient/norm leaves and the actual same-family dependency graph still need bounds.

## Replay

From the workspace root, with a pinned original source tree, pinned arithmetic runtime and existing archived inputs:

```text
python work/goal-next/continuation37/positive-ftc/check_source_imports.py --source <original-source-root> --prior <higher-ftc-norm-operands.json> --out <source-imports.json>
node --max-old-space-size=4096 work/goal-next/continuation37/positive-ftc/build_positive_c10.mjs <original-source-root> <actual-common-selection-arithmetic-trace.mjs> <positive-c10-rectangle.json>
python work/goal-next/continuation37/positive-ftc/check_positive_binding.py --packet <positive-c10-rectangle.json> --sparse <background-c8.json> --out <positive-rectangle-binding.json>
node --max-old-space-size=4096 work/goal-next/continuation37/positive-ftc/evaluate_positive_c10.mjs <arithmetic-runtime> <source_arithmetic.mjs> <historical-scale-arithmetic-result.json> <historical-scale-arithmetic-input.json> <positive-c10-rectangle.json> <positive-c10-rectangle-directed.json>
python work/goal-next/continuation37/positive-ftc/check_directed.py --directed <positive-c10-rectangle-directed.json> --binding <positive-rectangle-binding.json> --out <positive-directed-readback.json>
```
