# Absolute original inner force-square perturbation

The original full-inner degree4 and degree8 source approximations now have a quantitative absolute error bound in the original S_R scale. For both orders, on the actual axis-inclusive inner whole-K domain0<=Y=Lambda X<=4,

    normalized squared force-error integral <2^-256 S_R,
    absolute change of normalized force-square integral <2^-256 S_R.

These are the same normalized force-square quantities and actual moving inner domain used by the original whole-inner-force-energy receipt. They are not unscaled physical space-time integrals. The original leading coefficient stays exact, positive-order axis/pressure data are preserved, and every original cutoff and positive coefficient gain remains.

VERIFIED:396 exact physical monomial identities, direct evaluation of the original129 raw-stencil force-majorant and267 force-error monomials, strictly positive directed upper endpoints, and four independent rational/exponential endpoint proofs. CONDITIONAL: the existing original inner final-field identification, actual analytic/core norm bounds, common selector exclusion and original sharp-center leading bounds. Neither force-square integral value is evaluated directly. Annular/whole-K N7 and N8 completion, global jets and RELEASE HOLD are unchanged.

## The old force majorant is not the same W

The prior relative-error packet used an absolute original67-input stencil majorant. The sharp center receipt first substitutes and cancels the scalar Stokes gauge, then bounds the resulting expressions. Their scalar monomial counts are40/40/26 versus38/38/23. The same-W audit finds missing raw monomials in the collected expressions, including

    2 C_z I_a000 I_b000 R                 (components0 and1),
    32 C_z I_a000 I_a100 R^2              (component2).

Thus coefficientwise domination by the collected sharp force majorant fails. This is a mismatch between bounds, not a counterexample for the actual field. The numeric sharp-center force-square endpoint is not reused as if it bounded that raw W.

There is also a source-norm distinction: the old atom table uses global leading norms. The sharp center uses independently valid local720 natural leading bounds. This packet explicitly rebases the leading part onto those same valid local bounds. Every positive-order H factor is unchanged. The frozen Taylor errors have no leading contribution, so their original analytic constants and gains remain applicable.

## Direct physical cancellation and source evaluation

For the normalized force square, the original source scale satisfies

    S_R/tau0=B_h^4 Xb^(-4A) exp(-2h log tau0)/(4A), B_h>1.

The original normalized inner slab measure is bounded by(352/7)tau0/Lambda. Normalize each raw force and force-error monomial by tau0^(A+1+h) before evaluating any enormous exponent. Every half-integer time power cancels exactly; only nonnegative h powers0,1,2,3,4 remain. All original positive H_n factors separately retain tau0^(2nh), n=1,2,3. The actual normalized source gain is never discarded or rounded to zero.

Let W_i and E_(N,i) be the resulting bounds on tau0^(A+1+h)F_i and tau0^(A+1+h)(F_(N,i)-F_i). The two integral ratios are bounded by

    G sum_i E_(N,i)^2,
    G sum_i (2 W_i E_(N,i)+E_(N,i)^2),

respectively, with

    G=(352/7)(4A)Xb^(4A)/Lambda
      <=(1056/7)Xb^3/Lambda.

The source bounds h<1/64, Xb>1 and B_h>1 justify this geometry enclosure. W and E are computed directly from the original raw67+13 stencil and common physical atom powers. Their absolute analytic norm constants are evaluated with the existing pinned directed numerical runtime. Original source parameters, all positive Cauchy factors, exact cutoff Euler weights, the ordinary720 leading bound and the original123870-node prefix are retained. All runtime import bytes match their prior original Git blobs. No degree4/8 Taylor source polynomial is rebuilt or imported.

The original raw force-square majorant itself is large. Its positive lower endpoint is a lower bound on that majorant expression, not on the true integral. The separate true-integral interval starts at zero. The approximation errors are small because each contains an actual positive-order source gain.

## Independent endpoint proof and refinement limits

For both degrees and both error quantities, the saved directed upper is exp(-x), where x is a six-level positive exponential tower with an exact rational seed greater than256. The independent Python reader does not call a numerical exponential routine: exp(t)>t for t>0 gives x>256, and exp(1)>1+1+1/2>2 gives

    0<exp(-x)<exp(-256)<2^-256.

This proves strict positivity as well as the dyadic bound, excluding a zero-underflow argument. The reader separately reconstructs all396 physical powers with SymPy and verifies the source and geometry pins.

The stored coarse numerical upper endpoints for degrees4 and8 round identically; their endpoint comparison is0. No numerical endpoint shrink is claimed. Independently, the frozen positive-polynomial proof gives a25/256 contraction for the squared-error majorant and5/16 for the force-square-difference majorant. Those are comparisons of certified error envelopes, not ratios of the unknown actual errors.

The actual normalized force-square integral may therefore be replaced by either source approximation within the stated S_R error. This supplies an absolute coefficient-order error guarantee, not an evaluated quadrature, a closed moving-boundary energy identity, an annular certificate or whole-K N8 acceptance. N7-06/N8-05 remain OPEN, jets0/67, RELEASE HOLD.

## Replay

GOAL_NEXT is the original evidence root. ERROR_PROGRAM is the frozen continuation53 inner-output-errors.json, SHA48f4fa3f8f07cfb3e6ee88fb83ef6ef067a874307357ad4ce22e6e38ae19d0ae. INNER_REFINEMENT is the frozen continuation52 inner-taylor-refinement.json, SHA86a17bafa5f65b311ee94fe789babeb866d185b33146c26128a86d59950fa601. RUNTIME and HISTORICAL_INPUT are the same pinned originals used by sharp center. Use a fresh OUT directory and Python with SymPy and active assertions:

```text
python audit_force_majorant.py GOAL_NEXT ERROR_PROGRAM OUT/majorant-match.json
python build_absolute_force_ledger.py GOAL_NEXT ERROR_PROGRAM OUT/absolute-force-ledger.json
node evaluate_absolute_force.mjs GOAL_NEXT RUNTIME HISTORICAL_INPUT INNER_REFINEMENT OUT/absolute-force-ledger.json OUT/absolute-force.json
python verify_absolute_force.py GOAL_NEXT ERROR_PROGRAM OUT/absolute-force-ledger.json OUT/absolute-force.json OUT/absolute-force-readback.json
```

The evaluator imports inner_norm_context.mjs beside it; keep those two scripts adjacent. The context calls existing original source norm primitives and the pinned arithmetic engine, rather than copying their implementations. All four receipts reproduce byte-for-byte. The eleven files in this final directory, including MANIFEST.json, are the deliverable. Preliminary tests elsewhere in continuation54/inner-absolute are excluded. All files use UTF-8/LF. No repository, branch, website or base67 file changed, and no local Lean compilation was performed.
