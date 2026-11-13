# N2–5 actual forcing: cutoffs, radial callers and finite smoothness

This is source-bound progress on the actual common-inner Picard systems. It does **not** claim completion of all native Y calls, a new independent numerical forcing norm, higher-order global moment/cutoff matching, or a Lean proof. Release remains HOLD.

The N4-export original graph hash `ce323893...1031bd` has actual systems `(order,system)=(1,0),(2,3),(3,5),(4,7),(5,9)`. Python checks each actual forcing operand closure up to its native call boundaries. The respective lower actual even-profile node counts are 0, 19, 37, 48, 59. Every such call uses a strictly lower system. Every checked call on **every explicit operand path** has eta equal to its current system's formal eta and radial X exactly `xi^2` or `t*xi^2`, with that very t lexically bound by an original integral over `[0,1]`. Thus for any actual outer call satisfying the original `0<=xi^2<=a^2`, all these lower native arguments also satisfy `0<=X<=a^2`. A negative test removes the first required binder and fails at original node #120060. This statement does not unfold nested native systems; apply it recursively at each checked lower actual forcing root. It does not cover all other original Y transports.

## Actual cutoff and a third-derivative majorant

The literal common cutoff uses `w=t1/64>0`,

`Xkeep=Xa exp(w)`, `Xcut=Xa exp(2w)`, `a^2=Xa exp(4w)`,

`kappa=1-sigma((log(X/Xa)-w)/w)`.

The original `choose` selects raw U/F for X<=Xkeep, kappa times raw U/F between keep and cut, and zero at and beyond Xcut. `actual-global-source-expressions.mjs` uses lazy branch evaluation for `smooth_piecewise`; therefore the positive-log middle expression need not be evaluated at X=0. The literal scalar step is C-infinity and flat at 0 and 1. Since `Xa>0`, raw even profiles are smooth there, and the source derivative selection has matching jets at both cut points. The last endpoint lies strictly inside the Picard domain because `exp(2w)<exp(4w)`.

The original source `sourceAllOrderCutoffJets({order:3})` was executed with its actual profile and returns safe integer bounds `S1=66048`, `S2=136356096`, `S3=422521605120` for the first three ordinary sigma derivatives. On the active transition X>=Xa, the source chain rule yields

`K1=S1/(w Xa)`,
`K2=(S2/w^2+S1/w)/Xa^2`,
`K3=(S3/w^3+3 S2/w^2+2 S1/w)/Xa^3`.

These upper-bound the first three X derivatives of the actual kappa, with flat matching outside the transition. `check_cutoff_chain.py` checks the exact symbolic chain rule and its positive integer coefficients. Thus, for k<=3, any true raw-profile bounds H_j imply `|partial_X^k(kappa Uraw)|<=sum_{j=0}^k binom(k,j) K_j H_(k-j)`, with K0=1. The same applies to F. These explicit constants do **not** themselves supply the raw H_j.

The actual common `v_i` uses `Avg(U_i)=integral_0^1 U_i(tX)dt`, not a cutoff applied to raw v. On a larger eta strip S_r assume `H_k` bounds `partial_X^k U_i`, including the actual cutoff, and U_i is eta-holomorphic. Then on S_(r/2), `|partial_eta partial_X^k Avg U_i| <= 2 H_k/((k+1)r)` by Cauchy, and `|partial_X^k Avg U_i|<=H_k/(k+1)`. The original formula

`v_i=[2 eta U_i-2 eta (D+lambda_i) Avg(U_i)-d partial_eta Avg(U_i)]/L`

therefore gives, on the stated source strip where `|eta|<=2`, `|d|<=3`, `|1/L|<=2`, and `|D+lambda_i|<=E_i`,

`|partial_X^k v_i| <= [8 + 8 E_i/(k+1) + 12/((k+1)r)] H_k`.

This holds for each fixed k, including k=3; the regular integral formula at X=0 contains no division by X. Cauchy on a further smaller strip handles every fixed eta derivative. These bounds are conditional on the indicated actual H_k, and the strict positive r may shrink at every order.

## Finite-order induction and its remaining premise

The actual source omega/order-n constructor uses finite sums and products of earlier cutoff F,U,v, first derivatives, `v_(n-1),XX`, and the literal operator `Z_a=(2eta(a-X partial_X)+d partial_eta)/L` applied at most twice. Consequently, if the lower original fields possess every fixed continuous X derivative and are eta-holomorphic on a wider strip, their original forcing has every fixed continuous X derivative and is eta-holomorphic on a smaller strip; its xi form is C1 (indeed C-infinity) even at xi=0. The `Z^2` and v_XX terms explain why a bound through only X order two does not furnish the forcing's X derivative. The explicit K3 and v bound above address the necessary extra order without inventing a numerical solution.

The preceding N1 leading-source bridge supplies the base regularity conditional on its pinned written B_rho/pressure proof. For each next fixed order, combine the original value-tail and source coefficient/forcing bound premises with the ordinary Volterra derivative induction in `axial-picard/ORIGINAL_PICARD_ANALYTIC.md`: first obtain all fixed xi derivative convergence on successively smaller eta strips, then use even parity and the regular even-X integral formula to obtain every fixed X derivative, and only then apply the real cutoff and average. The original strip ratios are strictly positive at each fixed order, so this is a finite induction through 2,3,4,5, not a uniform-in-n strip claim. At each step both actual and auxiliary source bounds and their same-source core agreement must be supplied where the original majorant construction uses them. **Those analytic value-tail, all-fixed-derivative, auxiliary/core-agreement and bound premises are not established by the graph audit or cutoff arithmetic in this folder.** In particular the previously compiled first even-X derivative theorem alone is insufficient to claim the six xi derivatives needed for X-order three. Any finalized global-to-local support identity is a separate source bridge.

## Replay

From the workspace root, Python dependency replay (the three inputs can be passed with `--reached`, `--registry`, `--helper`):

`python -B audit_forcing_dependencies.py --reached <N4-reached.json> --registry <N4-original-source-functions.json> --out <forcing-dependencies.json>`

Repeat the same command with `--negative-unbind-first` and a new output path. The replay must reject the missing actual binder.

`node check_cutoff_jets.mjs <original-navier-source-directory> <cutoff-jets.json>`

`python -B check_cutoff_chain.py <cutoff-chain.json>`

The final Python calculation needs SymPy. The graph checker uses Python integer/node IDs and never binary floating point. No Git changes, hosted actions, or local Lean compilation were performed for this scratch audit.
