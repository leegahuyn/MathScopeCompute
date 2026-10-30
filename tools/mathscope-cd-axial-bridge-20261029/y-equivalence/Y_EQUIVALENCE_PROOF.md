# First-FiveMap natural-series Y: source-specific identity reduction

**VERIFIED conditional source-expression identities.** The script `identify_y_equivalences.py` rereads and SHA-checks all 4,420,257 original source nodes and the function registry. It checks exact AST IDs and uses the saved 11-root semantic-closure receipt, itself tied to those source hashes. Counts below are counts from that receipt, not evaluations of natural functions.

Write `lambda` for source parameter #3454 and `xa` for #3617. For one common formal assignment, the following identities hold:

| source Y nodes | receipt calls by node | sufficient conditions | exact identity |
|---|---:|---|---|
| #4757, #32495, #56747 | 27, 23, 6 | X#4756>0 | `lambda*X = lambda*exp(log X) = lambda*exp(log(exp(log X)))` |
| #6945, #25063 | 21, 8 | xa>0, node #6944>0, lambda*xa=4 | `lambda*#6944 = 4*exp(log(#6944/xa))` |
| #33412, #54061 | 17, 6 | xa>0, node #33411>0, lambda*xa=4 | `lambda*#33411 = 4*exp(log(#33411/xa))` |
| #25660, #26118 | 11, 3 | xa>0, node #25659>0, lambda*xa=4 | `lambda*#25659 = 4*exp(log(#25659/xa))` |

Each equality follows from `exp(log y)=y` for y>0, and in the last three rows `4/xa=lambda`. The latter identity holds under the previously established pinned source parameter definition `xa=4/lambda`, `lambda>0`; it remains an explicit premise of this standalone certificate. The first row uses no scaling premise. The 5 nonrepresentative Y nodes have 46 total source-receipt occurrences. They can share a mathematical range lemma with a representative **when the same formal arguments and guards are actually established**.

This reduces the number of *source formulas* requiring distinct symbolic analysis from 56 to at most 51 under the displayed assumptions, not the number of actual native domain proofs: callers may instantiate these equal expressions at different coordinates, use different integration binders, or be reached under different branches. In particular, the existing first-order cutoff result establishes the needed bound only on its chosen inner branch, not every occurrence in these classes. Source root #4756=0 is an omitted-guard counterexample: `log_positive(0)` is undefined. Taking xa=3, lambda=1, x=2 makes `4*x/xa != lambda*x`, showing that dropping the scale equality is unsound.

**OPEN:** chart/image membership and bounds of each native argument; positivity at every log; whether the actual natural-series computation runs under the common eta/complex domain; actual full natural values and all terminal 67 jet values. `released_Y_count_increment=0`, M3 62/64, M4 0/16 and RELEASE HOLD remain unchanged. This is not a disproof of the original source and does not show physical reachability of the omitted-guard counterexamples.

Reproduce with `python identify_y_equivalences.py --source <graph-dir> --receipt <semantic-closure-receipt.json> --out y-equivalences.json`. The expected original JSONL SHA is `a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269`; the registry SHA is `bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e`.
