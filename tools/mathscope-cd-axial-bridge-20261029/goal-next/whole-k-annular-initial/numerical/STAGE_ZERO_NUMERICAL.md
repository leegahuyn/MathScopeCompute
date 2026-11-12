# Numerical intervals for the original initialized annular field

All 67 original initialized stage-zero atoms have finite directed numerical intervals. The certificate contains 57 potential atoms, six direct scalar atoms, and four pressure atoms. Its physical chart is \(X_a\le X\le X_b\), \(|\eta|\le3/4\), and \(q_{\rm Big}/64\le q<q_{\rm Big}/16\). These intervals apply before outer localization and before any subsequent Forced, Signed, Temporal, or FiveMap increment.

The replay follows the original initialized root for every atom and resolves 8,121 reachable positive bound records across the original four namespaces. Eliminating authenticated namespace aliases leaves 7,980 arithmetic records. All 108 external intervals are consumed by exact namespace and identifier. They comprise 48 slow-background atoms, 15 fixed radial operators, 11 original hosted scalars, 18 background C8 norms, and 16 weighted target C7 norms. The source graph and native registry are the authenticated corrected first-cycle inputs. All 134 endpoint expressions are closed finite numerical trees with rational leaves, exponentials and optional negation.

The replay uses the existing directed source arithmetic with its existing coarse upper operations. A local wrapper rounds intermediate rational coordinates outward. For a positive rational \(p/q\), let \(j\) be the difference of the bit lengths of \(p\) and \(q\) and put \(\Delta=2^{j-128}\). The lower and upper rational roundings are \(\Delta\lfloor p/(q\Delta)\rfloor\) and \(\Delta\lceil p/(q\Delta)\rceil\), computed by exact integer quotient and remainder. Negation swaps the directions. The same rounding applies beneath exponential nodes because the exponential is increasing. Each multiplication in an integer power receives this wrapper, including intermediate squarings.

For \(|j|>2048\), the wrapper first computes the exact integer \(k\) with \(2^k\le p/q<2^{k+1}\). The directed lower exponential coordinate is \(k/2\) for \(k>0\) and \(k\) otherwise. The upper coordinate is \(k+1\) for \(k+1>0\) and \((k+1)/2\) otherwise. These follow from \(1/2<\log 2<1\), by integrating \(1/t\) on \([1,2]\). The conversion keeps large rational powers in closed exponential form and preserves strictly positive lower endpoints. This replay used one such conversion. The shared source arithmetic module is byte-identical to the fixed-input checkpoint version.

Each symmetric atom interval uses the rounded directed upper endpoint of its source norm. The readback checks every source root and verifies symmetry, closure, and sign for the 134 endpoints. Removing target leaf `153454` in an isolated copy is rejected before any output can be written. Extra arguments and attempts to write over a pinned input are rejected before evaluation.

## Replay

`GOAL_NEXT` is the extracted `tools/mathscope-cd-axial-bridge-20261029/goal-next` directory. `ORIGINAL_RUNTIME` is the exact earlier annular numerical runtime. `SLOW_RECEIPT` is the 96-bit coarse slow-field receipt with SHA256 `6c8ad3386dfc2d5e392368a4884eacbd2088531821edb37f3a4c471f729410fc`. The final target receipt is loaded from the pinned path beneath `GOAL_NEXT`. Choose separate writable output paths.

```sh
p=tools/mathscope-cd-axial-bridge-20261029/goal-next
n="$p/whole-k-annular-initial/numerical"
node --stack-size=4096 "$n/evaluate_stage_zero_all.mjs" "$p" "$rt" "$slow96" /tmp/stage-zero-complete-numerical.json
node "$n/check_stage_zero_numerical.mjs" "$p" "$rt" "$slow96" /tmp/stage-zero-complete-numerical.json /tmp/stage-zero-complete-readback.json
```

The stage-zero numerical receipt SHA256 is `9dcc5ad21169fe7462bd76f588d994126f0beaef5fdfc4e6ab4657e056371b34`. The whole-K final-field jet count is 0/67 and release remains HOLD.
