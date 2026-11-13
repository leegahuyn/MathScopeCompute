# Independent scope audit: original axial #672

This is a separate read-only review of the pinned source and earlier evidence. `audit_scope.py` cross-checks four hashed receipts, original source-family reduction and exact endpoint counterexample; its PASS is **not** an independent kernel proof or a rerun of the large original graph scan. No Git changes or local Lean compilation.

## What is directly bound

The original order-one function `ActualAllFiniteOrderOneStress_z` is function #672 with body #117069 and formals `[X#4756, eta#2]`. Its density #117047 is the original #117045 residual inside the two radial thresholds and zero outside. Its three actual literal source integrals are:

| use | integral | bound variable | actual density operands | endpoints |
|---|---:|---:|---|---|
| forward | #117057 | #117055 | `[#117055,#2]` | `[#28814,#4756]` |
| backward | #117066 | #117064 | `[#117064,#2]` | `[#4756,#28824]` |
| whole | #117075 | #117073 | `[#117073,#2]` | `[#28814,#28824]` |

Substitution is therefore made into the density's integration coordinate, not simply the caller's outer X. The previous streamed export receipt binds 4,420,257 nodes and its registry; the separate finite producer replay for n=1,2,3 has the same independently authenticated first 117,100 source nodes. Their actual axial residual roots are #117045, #120788, #123838, with supported densities #117047, #120791, #123841. The finite source replay and previously checked source-domain traversals extend to these orders; they do not constitute native execution for all n.

The exact independent algebra derives the physical conservation-to-moment formula with every radial boundary term and pressure integration by parts, not merely formal similarity of names. It uses `X=R^2/2`, so `R dR=dX` and physical `r dr=q dX`. It retains the same physical powers for the time, transport, pressure and previous-order viscosity terms, all ordered lower convolution pairs, and the actual stream/pressure identities. The original Lean 16 conditional linear-algebra theorems remain separate from this source meaning and the full integrals.

## What makes the zero total conditional

`buildConservativeTotals` in the actual source first constructs the *same original* whole-integral moment families and `M0`-based leading mass family, each behind its source proof record. It then simplifies those families and their eta derivatives to zero. Thus `actualConservativeTotalReduced=0` in the finite replay is a **source-proof-conditional reduction**. The literal #117075 is not a proof that Lean reduced an arbitrary integral to zero by computation. In particular the theorem depends on actual whole-density-to-five-inverse-operand identification, continuity and pressure primitives, their genuine finite-integral/source-branch semantics, and the actual leading mass exterior. The source certificate's `allFixedDerivativeJetsMatch` is a mathematical/producer assertion; its expression-function derivative limit `[2]` and finite materializations do not in themselves execute every possible eta derivative.

For n=1 the lower axial viscosity is U0: the additional original identity is `integral_0^Xv U0 dX = M0(Xv)-M0(0)=0`. It requires the actual leading stream and an exterior valid for the whole parameter neighborhood; it cannot be substituted with the previous positive-order moment. At n>=2 use the complete previous-order positive first moment. For the current order use the actual first and fifth moments and the positive pressure's actual primitive and zero exterior. `actual-global-conservative-moments.mjs` retains the actual full lower convolutions, current source pressure derivative, `incoming+correction` inverse operands, and a negative omitted-fifth-correction test; its direct graph equality is still backed by the stated source smoothness/integral contracts.

## Domain, support and eta differentiation

For physical `q>0,t<1`, the original relations give `1-t=q(1-eta^2)`, hence `|eta|<1`; values eta=+-1 are inward limits, not extra points with t<1 at fixed q. The source Xminus and Xplus are eta-independent. On the active stress branch `Xminus<X<Xplus`, the square-root denominator is positive, forward/backward intervals are contained in the same compact support interval, and their equality follows from the whole integral only after its actual vanishing is established. Inner zero uses the original Picard equations and cutoff=1; exterior zero and all requested jets use the actual positive-field/pressure support, with leading U0 already zero beyond Xv for n=1. Equality of values at an endpoint alone does not prove vanishing derivative jets.

Derivatives in eta commute with these fixed X integrals only under the separately demonstrated continuous mixed jets and integrable bounds. At eta=+-1 the coefficient `d=1-eta^2` has value zero, but its derivatives cannot be discarded before differentiation. The original algebra's exact negative control at `(a,h,eta)=(1,1/32,1)` gives `-17408/3375` for an omitted term's first inward derivative. Core Picard analyticity on a smaller strip is a useful separate input; do not assume the full global heat profile extends holomorphically across eta=+-1. The original all-order leading-jet source states the endpoint convention as continuous one-sided derivatives.

## Remaining precise obligations

* For the executed n=1–3 cases: accept or independently substantiate the continuous source proof records for actual moment integrals, pressure/stream boundary values, original Picard limit and the requested eta/X derivative interchanges. The existing replay verifies graph bindings and algebra under those contracts; it is not all of those analytic arguments rechecked by Lean.
* For arbitrary fixed n>=1: propagate the actual coefficient/forcing majorants, solution uniqueness and all requested derivative limits, core-to-global cutoff/pressure identities and moment induction at the current n. n=1 uses the leading mass case above; n>=2 uses a preceding positive moment. Demonstrate the actual caller's radial and eta arguments, including integral binders and the one-sided convention. Formal induction over a source loop does not overcome its finite graph/derivative budgets or prove a uniform strip in n.
* The whole physical infinite cutoff, global flat residual, terminal jets and unrelated gate counts remain separate. Keep RELEASE HOLD.

Reproduce the receipt cross-read from this directory with `python -B audit_scope.py --out new-scope-receipt.json`. Use `--goal-next` to supply a different copy of the evidence tree.

## Actual finite replay through order five

`replay_fixed_prefix.mjs` checks the pinned original issuer and the historical
117,100-node prefix before examining the axial rows. The order-five run reached
148,591 nodes and checked the original density, FTC derivative, forward/backward
signs, whole density and original moment reduction for each order 1–5. A
wrong-sign negative control failed in each row as expected.

At order one the issuer retains its literal whole integral #117075. Its own
comparison matches it to the whole integral formed using the forward integral's
binder. At orders two through five the source stores the two split integrals.
The verified issuer constructs the whole integral with the shared density and
checks equality against the backward side completed to the same endpoints.
The receipt records both identities separately. The reductions use the source
moment, regularity and integral premises detailed above.

```text
node --max-old-space-size=4096 replay_fixed_prefix.mjs ORIGINAL_RUNTIME 5 5000000 n5-fixed-prefix.json
```
