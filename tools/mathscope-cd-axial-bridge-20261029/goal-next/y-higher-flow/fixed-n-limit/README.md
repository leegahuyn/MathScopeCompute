# Fixed-n actual Picard binder and auxiliary strip reduction

This is a source-bound **partial progression**, not a completed arbitrary-order native Picard or Y proof. It combines one actually generated source expression with a mathematical fixed-n contraction/analytic-strip reduction. The original finite JS display is explicitly not the infinite solution.

`check_n2_binder.mjs` replays the pinned actual N2 source moment `#120279`, its literal `[0,Xcut]` binder `#120276`, the actual even-profile system 3 and the first three Picard iterates. It confirms the actual generated call #150912 along an exact three-level `[0,1]` Volterra-integral path; the actual positive-log branch and its nested lazy branch are both identified in the same path. The source replay sees 227 natural nodes, of which 93 were created during this finite generated construction. These are fresh local graph node IDs, not the same-numbered original exported graph nodes, and the counts are not a success fraction.

`check_n2_export.py` independently streams all 2,852,905 original N2 exported nodes with Python integer-only graph checking, verifies the source and registry hashes, checks 6,116,836 ordinary operand edges point to earlier nodes, and anchors the source moment/binder/guards. It checks the JS-generated path snapshot separately, including all three actual integral binders and both selected branch arms. It also checks 6,561 exact rational binder examples. The 2,814 raw natural nodes in the full export are an inventory; they are not the N2 567 reached-site count.

For the verified path, set source moment coordinate `X in [0,Xcut]`, `t_i in [0,1]`, and `xi=sqrt(X)*t_1*t_2*t_3`. In the actually selected source branch `xi^2>Xa`, the log is positive and the original input is

    Y = Lambda*Xa*exp(log(xi^2/Xa)) = Lambda*xi^2
      <= Lambda*Xcut = 4*exp(t1Source/32) < 128/31 < 5.

The final bound uses the pinned profile `Xa=4/Lambda`, `0<t1Source<1` and `exp(x)<1/(1-x)` for `0<x<1`. At xi=0 the strict positive-log branch is inactive; it is not evaluated there. The source Picard radial ceiling is `sqrt(Xa*exp(t1Source/16))`, which strictly exceeds `sqrt(Xcut)`.

The original `picardPartialSum`, `picardRadialDerivative` and `materializePicardEvenDerivative` source fragments all apply `xi -> t*xi` with fresh `t in [0,1]`, or `sqrt(X)` times such factors. Therefore for each **fixed finite** sequence of such operations, `xi^2=X product(t_i^2)<=X`. This is a mathematical induction on those identified source constructors. Applying it to all generated natural calls still requires per-caller initial domain, hygienic source substitution, every enclosing guard and recursive lower-system domain; the single observed path does not establish these for every source expression or for its infinite limit. The source display API allows at most eight terms in one call, and this witness uses exactly three.

The original auxiliary order-n constructor has `s_n=delta/(8*256^n)>0`, source strip `4*s_n`, predecessor strip `256*s_n`, and complex Y radius `r_n=6+2^(-(n-1))>6` for any fixed finite `n>=1`. For any real `Y in [0,5]`, its closed unit complex disk lies strictly inside `|Y'|<r_n`. Under the separately proved fixed-n Picard/majorant premises, suppose an even auxiliary component U_n is holomorphic on this radial disk and the eta tube S_(s_n), with original source bound M_n=solutionNorm_n. The ordinary two-variable Cauchy estimate gives, at real `eta in [-1,1]`,

    |partial_Y^r partial_eta^m U_n| <= r! m! (2/s_n)^m M_n.

The original source definition, the ratio 256, strict radial margin, exact denominator bound `1-(1/8)(33/32)^2=7103/8192>1/2`, and negative source-fragment controls are checked independently with Python rational/integer arithmetic and Node BigInt. The two JSON results contain equal decoded data. The universal identities follow from the displayed exact formulas; finite tests do not independently prove the analytic hypotheses. This estimate concerns the **auxiliary** analytic field and does not transfer it to the actual nonanalytic radial cutoff collar, prove the infinite Picard/native derivative interchange, or yield an eta strip uniform in n.

Open: prove the actual real source-domain and matching lazy guard for every relevant native `(X,eta)` frame, all lower-order source calls, and the ordinary Picard limit/derivative transport under the original coefficient majorants. Fixed-label seam jets, physically sourced infinite cutoff, global M3/M4 gates and final 67 jets remain separate. RELEASE HOLD.

## Portable replay

From this bridge directory, supply the original N2 graph directory (containing original-source-nodes.jsonl.gz and original-source-functions.json), a complete original runtime root (containing research-ide/), and separate witness and output file paths:

    node --max-old-space-size=2048 goal-next/y-higher-flow/fixed-n-limit/check_n2_binder.mjs <N2_GRAPH_DIR> <RUNTIME_ROOT> <WITNESS_JSON>
    python goal-next/y-higher-flow/fixed-n-limit/check_n2_export.py <N2_GRAPH_DIR> <WITNESS_JSON> <AST_OUTPUT_JSON>
    python goal-next/y-higher-flow/fixed-n-limit/check_fixed_n.py <RUNTIME_ROOT> <WITNESS_JSON> <PYTHON_OUTPUT_JSON>
    node goal-next/y-higher-flow/fixed-n-limit/check_fixed_n.mjs <RUNTIME_ROOT> <WITNESS_JSON> <NODE_OUTPUT_JSON>

The four scripts take explicit input and output paths. The Python AST scanner imports `goal-next/y/native_reference_scopes.py` and checks its SHA-256. The fixture authenticates ten transitive original runtime modules before loading the source generator. The Python stream authenticates the uncompressed graph and registry. The Python and Node analytic checks separately authenticate five original source files. All three output receipts bind the exact witness SHA. The two analytic outputs also match byte for byte using LF newlines.

The replay was run successfully from this directory against the existing `original-primary-degree-runtime` and pinned N2 export. The alternative existing `annular-numeric-24/pinned-original-runtime` generated the identical witness. In a packaged environment, `inputs/original-primary-degree-runtime` or equivalent `inputs/annular-numerical-runtime` can be passed as `<RUNTIME_ROOT>` if it has the pinned original file layout and contents. The helper is part of the repository; original graph and runtime are external inputs.

## Source and evidence pins

- Original uncompressed N2 graph: `75db9fddc311fb7ce8d7968fbde4a52a07521cf8d47feb0b8f302d6bed108987`; registry: `6859cded252d523a0868656b0b98c8699d6289782f057e2931419ceae3cabe8f`.
- Source witness `n2-binder.json`: `e3b36d1df4689698ca3810d6f8d7db35e58aa4a277325fb0b75bbbc87ecc4f6c`.
- Python original-export audit `n2-python-ast.json` has SHA-256 `e742ff7538e462c6863c6d4ca601d56ebdf1bc209c0631cd7159865b918ad284`.
- Python fixed-n reduction `fixed-n-reduction.json` and its Node counterpart `fixed-n-node.json` both have SHA-256 `ae5e306bb092416d113a6dd397251c56ae545c6b0541beafac2699a0d6ec5f36`.
- Original induction producer: `30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047`; original Picard implementation: `326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311`. Complete runtime import pins are in `native-binder-fixture.mjs`.

No Lean was compiled locally and no Git branch was committed or pushed.
