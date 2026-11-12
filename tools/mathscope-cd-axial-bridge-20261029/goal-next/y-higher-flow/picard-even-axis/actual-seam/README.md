# Actual B.26 activation slope: original source reduction

This is an exact symbolic derivation of the two natural-reference slope identities from the original natural coefficient recurrence and sourceFromState, followed by an ordinary analytic argument. It is **conditional** on the source's actual infinite natural series convergence and termwise differentiation on the collar and eta strip, its nonzero Phi condition, the stated activation branch inequalities, and the source integral semantics. These are not established by the symbolic script alone. No release gate is promoted.

## Actual step and activation

The pinned `actual-global-source-expressions.mjs` evaluates the literal `source_step_derivative`: for s<=0 it gives sigma=0, for s>=1 sigma=1, and on 0<s<1 its stable logistic expression is exactly

`sigma(s) = exp(-1/s^2) / (exp(-1/s^2) + exp(-1/(1-s)^2))`.

For v(s)=exp(-1/s^2) on s>0 and zero otherwise, every derivative is a polynomial in 1/s times exp(-1/s^2), hence tends to zero as s tends to 0 from above. The same argument applied to v(1-s) at 1, together with the smooth nonzero denominator, proves the *actual real scalar function* is C-infinity with every positive-order endpoint derivative zero. The interpreter only provides derivative orders within its own native budget; the mathematical flatness statement does not claim unbounded native materialization.

On the actual common collar write y=log(X/Xa), 0<=y<=t1/16, Xa=4/Lambda. The separate `verify_activation_domain.py` pins and reads the literal source parameter graph, checks its exact expression shapes, and proves using rational inequalities that `0<t1<1/4`, `0<Xa<4`, `Xa exp(t1)<16/3<100<110`, and `Y<=256/63<41/10`. The proof uses `exp(x)<=1/(1-x)` for 0<=x<1. Thus the original Xstart=Xa exp(t1) precedes Xi=110 and the B.22 reference selector takes its natural branch over the activation. Since Xb=100 and w1=t1>0, `y<yB` and `y<yB+w1`, so original beta=1 and blend=0. Therefore actualShear=kap*p1(reference), actualUControl=-(kap/2)*X*ns(reference), and kap=1-(1-kappa0)*sigma(y/t1). The domain check does not prove that the natural solution exists or is nonzero on the eta strip.

## The exact source first integrals

For the natural F,U and source primitive functions, the pinned pregluing source gives

`M_X=U`, `I_X=2XF`, `J_X=2XUF`, `S_X=U^2-XF^2`, `Pi_X=F^2`, and `W=1-2D eta M/X-d M_eta/X`.

Define the source angular numerator

`a=(1-h)I-D eta I_eta-d J_eta+2(h-D)eta J`.

The two desired slopes are equivalent, where X>0, L!=0 and F!=0, to the vanishing of

`Eang = a - 2 X^2 F W + 4 L X^2 F_X`,

`Eax = -X W U + D(M-eta M_eta) + 4h eta S - d S_eta + X(4A eta Pi-d Pi_eta) + 2L X U_X`.

Indeed the source has `p1=X*(-W+a/(2X^2 F))/L` and `ns=(-WU+[D(M-eta M_eta)+4h eta S-d S_eta]/X+4A eta Pi-d Pi_eta)/L`; hence Eang=0 says `p1=-2X F_X/F`, while Eax=0 says `ns=-2 U_X`.

Now let Y=Lambda X, `F=g Phi`, `U=Ustar+u/Lambda`, `Pi=P0+p/Lambda`, and write avg for the original natural average of u. The original exact core recurrence has the generating-function equations

`2(Y Phi_YY+2 Phi_Y) = -chi Phi + R1/Lambda`,

`2(Y u_YY+u_Y) = -Zstar/L + R2/Lambda`,

where R1,R2 are precisely the original n-th coefficient convolution expressions in `actual-continuation-exact-core.mjs`; `p_Y=g^2 Phi^2` is its literal pressure recurrence. In the script these equations are written without division by L, using the source R1/R2 numerators. Substituting the exact derivatives of the original source integrals and `g_eta=Lambda*zeta*g` gives the independently checked polynomial/rational identities

`Eang_X/(2Xg) = 2L Lambda (Y Phi_YY+2 Phi_Y) + Lambda L chi Phi - numerator(R1)`,

`Eax_X = Zstar + 2L(Y u_YY+u_Y) - numerator(R2)/Lambda`.

The right sides vanish by the full convergent recurrence, not by a finite display or a comparison profile. At X=0, all original M,I,J,S,Cp primitives vanish, regular F,U and their derivatives imply Eang(0)=Eax(0)=0. Fundamental calculus therefore gives Eang=Eax=0 throughout the actual natural-reference portion, provided all stated analyticity and source-domain premises hold. This supplies the two slope identities used for B.26 actual activation and their eta derivatives on any compact substrip where these premises hold.

Flatness of kap-1 now yields matching all finite X and eta jets at Xa by the [integral argument](../MATRIX_DERIVATIVE_KO_SOURCE.md). Natural mass at Xa is the literal `coreMoments(4)` used by the collar integral. Its actual integral representation, differentiability, and natural average equality remain part of the source-domain premises. The axis X=0 uses the natural average branch.

Replay:

`python -B verify_source_slopes.py --source-dir <original-navier-source-directory> --out <receipt.json>`

Requires SymPy. The canonical-LF SHA-256 pins cover the original pregluing source, natural recurrence, and step evaluator. Exact symbolic source identity checks PASS and two corruptions (missing 4h eta S, altered radial coefficient) are detected. This check covers the stated algebra, not numerical parameter enclosures, direct evaluation of the infinite series, or an independent Lean proof of the analytic continuation.

The exact original-parameter-domain check needs only Python's standard library:

`python -B verify_activation_domain.py --source-dir <original-navier-source-directory> --out <domain-receipt.json>`

## Natural series and source parameter binding

The byte-exact original `SAME_DATUM_ANALYTIC_AXIS.md` and its 51/51 exact scalar certificate have been recovered into `natural-source/`; their raw SHA-256 hashes are pinned by `verify_natural_bridge.py`. The document gives a mathematical construction of the same A.21 natural fixed point in B_rho, its convergent coefficient recurrence, analyticity in |Y|<20 and an eta neighborhood, all fixed mixed derivatives, and Phi>1/4 on real 0<=Y<=41/10. Section 9 independently records the same exact source Qs/Ns slope identities. Its boundary explicitly states that the analytic premises are not all Lean proof terms and that finite scalar checks alone do not prove the analytic claims.

The selected native profile and certificate agree on all 12 common parameter expression trees (including h, j, sigma, rho, Q and Lambda). In particular `Q=2^260 K/sigma^2`, `K>1`, `sigma<1`, `Lambda=Q^64`, and `log CSelected>Q^200`. Consequently `Q>2`, `64 Lambda/sigma^2<64 Q^65/2^260<Q^65/2`, and `Q^200>Q^65/2+1`. Thus the actual selected `CSelected` exceeds the document's required `Caxis=exp(64 Lambda/sigma^2+1)`. This is an exact comparison of source expressions; no source exponential is materialized as a floating-point number.

The separate pinned `actual-background-majorant.mjs` records `|Phi_eta|<=4Q/rho` on the relevant eta tube. Since the actual `delta=rho/(1024Q)`, from any eta in the distance-delta tube a straight segment to the real interval gives

`|Phi(Y,eta)| >= 1/4 - (4Q/rho) delta = 63/256 > 1/8`.

The source proof's tube also gives nonzero L and Hstar^2+sigma^2. Therefore the *actual* g=exp(Lambda psi)/CSelected is holomorphic and nonzero, and the natural F=g Phi is nonzero. Together with the separately checked activation Y<=256/63<41/10, this supplies the nonvanishing needed by the original reference slope division on the indicated strip. This is a mathematical implication from the cited original proof and recorded majorant, not a new independent proof of the A.21 pressure identity or the complete B_rho fixed-point theorem.

Under those established source-data theorems, the natural F,U have continuous mixed X and eta derivatives of every fixed finite order on the real core and are holomorphic in eta. On the real B.26 collar, the actual integrals for F,U use smooth flat step controls, the nonvanishing natural Phi denominator, and eta-holomorphic integrands; differentiation under these finite integrals gives the same regularity. The source slope identity and endpoint flatness above identify all their jets at Xa. For the actual natural/collar U, set `average U = integral_0^1 U(tX) dt`; the original source's core average and `coreMoments(4)+integral_Xa^X U` give this same average, provided the original core-moment integral identity is used. Differentiating this regular integral gives all fixed X and eta derivatives, including at X=0 without evaluating a singular quotient. The actual formula `v0=[2 eta U-2D eta average U-d partial_eta average U]/L` then has the same regularity. In particular the third X derivatives and mixed eta derivatives needed to differentiate original n=1 forcing containing v0_XX and Z(Z(F0)), Z(Z(U0)) exist continuously. A closed smaller eta strip inside the larger source tube makes the finite number of relevant derivatives bounded, and the original forcing is C1 in xi and holomorphic in eta. This conclusion relies on the written original fixed-point/pressure proof and ordinary differentiation, not on an executed numerical supremum or a Lean-instantiated analytic theorem. It does not yet prove the higher-order forcing induction.

Reproduce the pinned cross-source and rational checks with

`python -B verify_natural_bridge.py --source-dir <original-navier-source-directory> --evidence-dir <natural-source> --out <natural-bridge-receipt.json>`.
