# Directed source enclosure for the leading U0 FTC leaf family

The original same-family C8 background producer constructs four-face FTC upper expressions for every leading U0 and F0 jet `partial_X^r partial_eta^e` with r+e<=8 on `[Xa/2,2 Xb] x [-1,1]`. There are 45 rows per field, and Cslow8 #14220475 feeds GaussianB6 #14220496 and native Primary K #18310069. This note provides directed numerical enclosures for these 90 whole four-face sums; it does not close the other norm leaves or substitute into the private live family.

The independent source producer `actualLeadingAllOrderJets({radialOrder:9,etaOrder:9})` executes successfully on the same original profile expression hash and produces H=`normProgram.roots.U0` #12501. Its written/source-bound bound says H dominates all `partial_X^r partial_eta^e U0` with r<=9,e<=9 on **all** X>=0 and real eta in [-1,1], with continuous one-sided eta boundary jets. The H source-only closure contains 8,295 graph nodes and **no FTC integrals or native Picard calls**, nor a reference to native Primary K #18310069. Its exact JSON graph hash is `29f278b041c8110ee1e239fba80244e100a2f0a3ec80199e8e99c9a38c2afb61`. Its source parameter called `K` is the original pressure scale `Pstar^2`, not native Primary K; the producer checks the exact parameter expression. The bound's validity relies on the original finite-jet ledger and its source proofs, not merely on the graph shape.

For any C8 U0 jet f, each anchored FTC face differentiates it in zero, one or both coordinates. Each resulting derivative has radial order <=9 and eta order <=9, hence absolute value <=H. The original face integrand is `sqrt(1+u^2)`, which is <=`1+H` when `|u|<=H`. The rectangle has eta width 2 and radial width `Delta X=2Xb-Xa/2`, and its four original terms are bounded by `1+H`, `Delta X(1+H)`, `2(1+H)`, `2 Delta X(1+H)`. Therefore

`0 <= original_U0_FTC_face_sum <= 3(1+Delta X)(1+H) <= 3(1+Rstar^2/2)(1+H)`,

using `Xa>0` and the separately recorded same-source geometry `4 Xb <= Rstar^2`, where `Rstar=C12EnvelopeR`. The expression is noncircular with respect to the FTC sums and native Primary K. On the separately generated sparse original C8 graph, the U0 eta-order-eight example is jet #126411, face-sum root #126488, faces #126448,#126459,#126471,#126485; those IDs are in that sparse graph's namespace and must not be relabelled as IDs in the large native norm graph.

`check_u0_upper.py` independently checks the 45 original U0 C8 jet records, the sample root and four faces, source/graph hashes, and exact nonnegative-polynomial and width algebra. The C8/C6 witness, geometry receipt and source producer have matching source parameter hashes. The isolated H reconstruction is a separate source construction, not a same-live-private-family proof: before using it to replace an actual Primary K operand the same U0 identity and the original root-to-leaf dependency must be bound on that live private source instance.

## F0 active and outer join

The F0 eta-order-eight row in the separately generated sparse graph is jet #124235, face-sum #124312, with faces #124272,#124283,#124295,#124309. Its mixed face requires `partial_X partial_eta^9 F0`; the prior active F0 norm alone stops at Xplus. The separately pinned original `leading-outer-c10` proves for `X>=Xplus`, r+e<=10 that `|partial_X^r partial_eta^e F0| < 2^(-65343) Xv/X^(r+1) <=1`, including heat and one-sided eta derivatives. Its 12 recorded source Git blobs agree byte-for-byte with the active norm producer. Replaying `actualLeadingAllOrderJets(9,9)` gives active M=#12507 on `X<=Xplus`; every F0 FTC face derivative has total degree at most ten, so on the full box its absolute value is <=1+M. The same width calculation bounds each original F0 face sum by `3(1+Rstar^2/2)(2+M)`. `leading_f0_c99.mjs` constructs this exact noncircular source expression and verifies the 12 matching Git blob pins; its use assumes both the original active and exterior source proofs.

## Directed numerical and fixed dyadic endpoints

The pinned existing source arithmetic runtime, 96-bit directed intervals and its previously reviewed coarse-positive optimization evaluate all closed source parameters and each positive norm DAG. The nonnegative FTC intervals are `[0,exp^5(c_U)]` and `[0,exp^5(c_F)]`, respectively, with

`c_U=83152259474872902432540274525583463/2^96`,
`c_F=83152338703035416696877868069533799/2^96`.

Here `exp^5` denotes five nested exponentials, not a fifth power. The interpreter uses no binary64 numerical decisions and retains positive tiny bounds. For a looser, fully specified dyadic integer bound, let `T1=2` and `T_(j+1)=2^Tj`. Both c values are <2^21<T5. The elementary `e^x<2^(2x)` and `2Tj<=2^Tj` give `exp(Tj)<T_(j+2)`; applying this five times yields **every one of these 90 FTC sums < T15**. T15 is an exact finite integer tower; its bits and its exponent are not materialized. The generic arithmetic kernel reports `sourceAuthenticated:false`; the caller separately checks every original runtime file hash, profile and witness input. `check_directed_readback.py` checks the two receipts' hashes, dyadic rational top arguments, 45 rows per source, and the tower arithmetic, without pretending to rerun the arithmetic DAG.

The exact source-expression enclosures and directed evaluated endpoints do not themselves establish the same-live-private-family join from these separately generated bounds to K #18310069. Target weighted C6 and finite positive-profile FTC leaves, complete K, the full corrected field and final gates remain open. No numerical quadrature was executed. RELEASE HOLD.

Replay from the workspace root:

```text
node --max-old-space-size=3072 work/goal-next/continuation36/norm-leaf/leading_u0_c19.mjs <original-source-root> <leading-u0-c99.json> <primary-c5-native.json> <whole-k-exterior-cell.json>
python work/goal-next/continuation36/norm-leaf/check_u0_upper.py --norm <leading-u0-c99.json> --sparse <background-c8.json> --out <u0-upper-readback.json>
node --max-old-space-size=3072 work/goal-next/continuation36/norm-leaf/leading_f0_c99.mjs <original-source-root> <leading-outer-c10.json> <leading-f0-c99.json>
node --max-old-space-size=3072 work/goal-next/continuation36/norm-leaf/evaluate_u0_dyadic.mjs <arithmetic-runtime> <source_arithmetic.mjs> <historical-scale-arithmetic-result.json> <leading-u0-c99.json> <u0-directed.json>
node --max-old-space-size=3072 work/goal-next/continuation36/norm-leaf/evaluate_u0_dyadic.mjs <arithmetic-runtime> <source_arithmetic.mjs> <historical-scale-arithmetic-result.json> <leading-f0-c99.json> <f0-directed.json>
python work/goal-next/continuation36/norm-leaf/check_directed_readback.py --dir <norm-leaf-directory> --sparse <background-c8.json> --out <directed-readback.json>
```

The first producer hard-pins the source program, hosted C8/C6 receipt and geometry receipt; the second uses SymPy. No local Lean was compiled and no shared branch edited.

## Live N3 and N4 binding

GitHub run 43368204121 retains the same leading FTC binding bytes in both jobs and distinct arithmetic frontiers for K roots 18310069 and 24120472. In each job `bind_actual_leading_ftc.py` compares every one of the 90 bound nodes against that job's reachable arithmetic frontier, and confirms that the two full leading functions and their admitted rectangle are the ones bounded above. The two endpoint lists attach those bounds without modifying the original graph. The newly bound rows and the [separate positive-order upper bounds](positive-ftc/README.md) still leave the full norm evaluation open.

```sh
python -B bind_actual_leading_ftc.py N3_ARTIFACT . n3-leading-ftc-join.json --prefix 3
python -B bind_actual_leading_ftc.py N4_ARTIFACT . n4-leading-ftc-join.json --prefix 4
```

## Original slow-chart coefficient integrals

The same original C8 issuer also integrates its explicit slow-chart coefficients over `s∈[1/2,2]`, `X∈[Xa/2,2Xb]`, and `eta∈[-1,1]`. Set `H=max(2,Lambda,C12EnvelopeR)`. The source geometry gives `2/H≤X≤H²`. The script bounds the first eleven ordinary mixed derivatives of every atom using falling factorials for the powers of `s,X`, and the radius-`1/4` Cauchy bound of `1/(1-2h eta²)` around each real eta. There the denominator has absolute value greater than `1/2`. The Euler derivative has coefficient `s a_i0` in the ordinary-coordinate basis. That product, the other coefficients and all four multipliers have seminorm at most `2^156 H^13` through order eleven.

The literal source recurrence for a fixed coefficient at order `j` combines at most six terms from its preceding row. Three differentiate the predecessor coefficient and three advance one profile derivative. A product costs at most `2^11` in the total-order mixed seminorm. Thus at order `j≤8`, the seminorm through order `11-j` is at most `2^(156+170j) H^(13(j+1))`. All eight faces use at most three of the remaining derivatives. Integrating `sqrt(1+u²)≤1+|u|` costs `(1+3/2)(1+DeltaX)(1+2)≤15H²`. Each nonconstant slow-chart coefficient FTC sum is bounded by `2^1521 H^119`. The directed evaluator encloses this expression with the original fixed parameters, without integrating the unknown profile or weighted-target derivatives. The current export does not enumerate the exact IDs of this coefficient family.

```sh
python -B check_slow_chart_majorant.py ORIGINAL_RUNTIME/research-ide/mathscope-m2/navier slow-chart-majorant.json
node evaluate_slow_chart_majorant.mjs ORIGINAL_RUNTIME HISTORICAL_SCALE_RESULT slow-chart-majorant.json slow-chart-directed.json
```

## Actual whole-norm N3 and N4 enclosures

The original 14-operand maximum was evaluated for each prefix. The original
background C8 operand requires 808,755 arithmetic nodes after stopping at
90 bound leading FTC sums, 25,299 original slow-chart coefficient FTC sums
and the three historical integral intervals. This uses seven actual positive
finite-block terms and its exact `1/128` tail. Those terms are the source's
positive majorant programs. They are distinct from the separately reproduced
270 positive-profile FTC sums. Each directed background run executed
48,805,382 operations without binary64 numerical decisions.

The actual cutoff/map maximum takes eight partition FTC bounds, 35 slow-chart
FTC bounds, eight squared step derivative integrals and three historical
integrals. The weighted target's 168 FTC rows and 672 faces are independently
matched for each prefix. See [N4 replay](weighted-target/n4-replay/README.md).

With the stated leaf inequalities, the whole original K intervals at N3
#18310069 and N4 #24120472 have equal exact endpoints. The upper endpoint
has ten nested exponentials with positive innermost argument below `2^21`.
The integer readback gives the common bound `K < T25`, where `T1=2` and
`T(j+1)=2^Tj`. This bound is coarse. It does not supply the actual final
corrected-field values, their uniform derivative intervals, or a comparison
with an error tolerance.

```text
node evaluate_k_background.mjs ARITHMETIC_RUNTIME HISTORICAL_RESULT HISTORICAL_INPUT ARTIFACT EVIDENCE n3-background.json
node evaluate_k_cutoff_map.mjs ARITHMETIC_RUNTIME HISTORICAL_RESULT HISTORICAL_INPUT ARTIFACT EVIDENCE n3-cutoff-map.json
node combine_original_k.mjs ARITHMETIC_RUNTIME HISTORICAL_RESULT ARTIFACT/primary-K-arithmetic-frontier.json n3-closed.json n3-background.json n3-cutoff-map.json weighted-target/n3-weighted-target-directed.json n3-whole-k.json
python -B check_whole_k_enclosure.py EVIDENCE whole-k-integer-readback.json
```

For N4 use the N4 hosted artifact and the directed target JSON in
`weighted-target/n4-replay`. The background evaluator accepts the earlier
43371105453 artifacts; the cutoff evaluator uses the added map index in
43373034256. Both runs record the identical original arithmetic frontier
hash per prefix. The join uses this hash and exact node IDs.
