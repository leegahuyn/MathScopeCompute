# Source-bound n=1 axial exterior guards

**Independent review correction:** the previous checker did not account for the source's left-first branch selection. The revised checker requires the ordered pairs proved below, and rejects a reversed-pair negative control. The result remains conditional on defined, smooth source semantics.

Status: **VERIFIED conditional on the real interpretation of the fixed source parameter definitions and smooth source operator semantics**. This establishes the exterior guard inequalities for the pinned source, not global native chart membership, inner equality, cancellation of an integral, or all-order induction. The precise uploaded PDF remains unavailable.

The graph replay `check_exterior.py` verifies the exact source nodes, graph and registry hashes, and the eight n=1 axial summands. With source step flatness, it reduces all eight to zero when the explicit guards listed below hold. Source parameter trees are separately matched byte-for-byte against `source-profile-data.mjs`, SHA-256 `df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a`, Git blob `f1559221145b5d4ce051bbdb9cb84254045c8696`, which matches branch `mathscope-cd-lean-three-gates-20261027`. `check_source_guards.py` validates 23 relevant expression trees and rejects a modified X0I1. It separately checks the exact rational comparisons used below; the exponent inequalities here are a written mathematical proof, not a Lean proof.

Let `T=exp(1048576)+10`, `B=1000T`, `lambda=exp(-1000T)` and `XR=110(CSelected Pstar)^10`. Put

`Xp=XR exp(T+2+60B)`, `Xplus=Xp exp(13/lambda+1)`.

Graph nodes #98, #613, #3292, #3293, and #28824 exactly encode these expressions. With fixed positive real parameters interpreted from the verified pinned source trees, T>10, B>0, lambda>0. Further `logP=2T`, `Pstar=exp(logP)>1`, `h=exp(-8002T)` lies in (0,1), `j0=h^4` lies in (0,1), and `sigmaStar=j0/2000` lies in (0,1). Therefore K=Pstar²>1, `Q=(positive integer >1) K/sigmaStar²>1`, `Lambda=Q^64>1`, `Xa=4/Lambda<4`, `BRefUpper=Q^300>0`, `logCSelected=10 log(1+BRefUpper)+Q^200>0`, `CSelected>1`, `0<t1=CSelected^(-120)<1`, and `XR>110>Xa`.

For X≥Xplus, the remaining inequalities follow from these exact source definitions and strict monotonicity of exp/log:

1. `Xplus/loopIRight=exp(60B+13/lambda)>1`; loopIRight is #6258 = `XR exp(T+3)`.
2. `Xplus/#5093=exp(2+60B+13/lambda)>1`; #5093 = `XR exp(T+1)`.
3. `Xplus/#5089=exp(T+8+60B+13/lambda)>1`; #5089 = `XR exp(-5)`.
4. `Xplus/IposRight=exp(10+13/lambda)>1`; IposRight #28988 = `X0Ipos exp(5)` and `X0Ipos=XR exp(T+2+60B-14)`.
5. #29328 is `X0Ipos(8193/4096)^2`. Its squared rational factor is `<6<exp(5)`, so #29328<IposRight<Xplus. The exact integer comparison is `8193²=67125249<6·16777216=6·4096²`.
6. `Xcut #28823 = Xa exp(t1/32)<XR exp(1/32)<Xplus`: T>10, B>0 and lambda>0 make the exponent of XR in Xplus greater than 3.
7. `log(X/Xp) >= 13/lambda+1 > 13/lambda`. Exact graph #5099 is log(X/Xp), #103 is 13/lambda.
8. `Xplus/X0I1=exp(26+13/lambda)>exp(26)>27`. Thus the exact graph arguments `#9198=2(X/X0I1−9)` and `#9203=2(X/X0I1−10)` are both >1. The identities use `X0I1=XR exp(T+2+60B−25)`, also verified from the pinned source tree. `exp(26)>27` follows from exp(x)>1+x for x>0. The source flat-step function and all its positive-order derivatives vanish when its argument exceeds 1.

The source interpreter selects `before` first when `x<=left`, and only otherwise selects `after` when `x>=right`. Thus `x>right` does not suffice without `left<=right`. For example `(left,right,x,before,after)=(2,1,3/2,1,0)` selects 1 although `x>right`; this is a counterexample to an unrestricted checker rule, not a source counterexample. Every pair used by this audit is ordered:

* Logarithmic coordinate: `#0=0 < #103=13/lambda`.
* Radial `(left,right)=(#4567,#5089)` equals `(XR exp(-7),XR exp(-5))`; `(5091,5093)` equals `(XR exp(1),XR exp(T+1))`.
* `#6257=loopILeft=Xa exp(t1/8) < XR exp(T+3)=loopIRight #6258`, since `Xa<XR`, `t1/8<1/8`, and `T+3>13`.
* `#28819=Xa exp(t1/64) < Xa exp(t1/32)=Xcut #28823` because `t1>0`; `#28987=X0Ipos < IposRight #28988 = X0Ipos exp(5)`.
* `#28819 < #29328=X0Ipos(8193/4096)^2`: indeed `X0Ipos=XR exp(60001T-12)>XR exp(1/64)>Xa exp(t1/64)` and the rational factor exceeds 1. Likewise `#28819 < Xplus #28824` by the positive exponent of `Xplus/XR` exceeding `1/64`.

The revised replay checks these exact source endpoint trees and applies its right-branch reduction only to these seven radial and one logarithmic ordered pairs. The inequalities rely on the displayed mathematical proof and source-real semantics; their existence is not inferred from the mere name `smooth_piecewise`.

Consequently every guard used by the eight-term exterior branch replay holds for every X>Xplus, all |eta|<1 and the fixed source parameters, **provided** the source operations and the expression-function derivatives have the real smooth semantics and are defined on the relevant neighborhood. In the actual producer this is the specific claim that raw #117045=0 on that strict exterior, including its lower axial-viscosity term; it is stronger than merely reading the clipped zero branch of #117047. It is a source-structure and handwritten analytic proof; it is not a Lean-kernel proof of those semantics or of global native caller arguments.

The guard proof does not assert matching derivatives at Xplus. Extending to X=Xplus, η=±1 and arbitrary jets requires the appropriate continuity/one-sided regularity and smooth interpretation of the underlying piecewise and Picard objects. Nor does outer zero establish the inner ODE identity, the actual five moment identities as functions of eta, pressure boundary terms, interchange of derivatives with integrals, the order-zero flux, or all n≥1 induction. Remain at M3 62/64, M4 0/16, Y 33/523, jets 0/67 and RELEASE HOLD.

Reproduce source-matching checks with `python check_source_guards.py --profile <path>/source-profile-data.mjs --out source-guards.json` and `python check_exterior.py --source <graph-directory> --out exterior-certificate.json`. Changing X0I1 causes the former to fail. Removing the #28824 cutoff rule or flat-step derivative rule makes corresponding zero proofs fail; these controls do not claim those actual functions are nonzero.
