# Original Picard coefficient radial-derivative bound

This is a **conditional analytic implication**, supported by an exact source-shape and integer-arithmetic replay. It does not evaluate a source supremum, certify analyticity of the leading data, establish the Picard value-tail premise, or advance any release gate.

For each source actual order n=1,...,5, let A0,A1 be its original 6-by-6 coefficient matrices after the literal X=xi^2 substitution. On the real radial collar and the relevant smaller complex eta strip, define D to be the larger of the induced infinity-row-sum norms of the xi derivatives of A0 and A1. The conclusion is D <= C_n, under the following **separately required analytic premises**:

* |xi|, X <= 1, |eta| <= 2, |1-eta^2| <= 3, |1/(1-2h eta^2)| <= 2, and each absolute value of beta, gamma, A-lambda, D_original+lambda is <= E=4+2nh.
* The original leading F0,U0 and their first two X derivatives have modulus <= H; original v0 and its first X derivative have modulus <= V.
* The original scaled operator satisfies |partial_X Z_b(F0)| and |partial_X Z_c(U0)| <= DXZ(H)=H(5E+10+6e1), and Z=H(5E+5+6e1). Thus DXZ=Z+5H. These are assertions about the genuine piecewise source and its eta derivatives, not assumed identities between branch expressions.
* The derivatives and the X=xi^2 chain rule exist on the full stated collar, including its joins and xi=0. The leading majorant and regularity must hold on the relevant source strip; the cited historical derivations are evidence, not a kernel-checked proof.

The existing `axial-picard/ORIGINAL_PICARD_ANALYTIC.md` explains how these majorants are intended to follow from original B.26 and the natural source (the first-order `actual-background-majorant.mjs` asserts F0,U0 bounds B on S_delta, v0 and two X derivatives <=28B/delta on S_(delta/2)). The original kernel definitions and C constants are pinned by the replay. Verify their analytic hypotheses independently before calling this actual D bound unconditionally proven.

## Matrix calculation

Write Hf=F0+XF0_X and Hu=XU0_X. Since partial_xi=2xi partial_X, |partial_xi Hf|<=6H, |partial_xi Hu|<=4H, |partial_xi F0|,|partial_xi U0|<=2H, |partial_xi v0|<=2V, and |partial_xi Z|<=2 DXZ. For the shared A0 diagonal term `xi/L+xi*v0-2*eta*xi*U0/L` its derivative is bounded by `2+3V+24H`.

Summing the original matrix entries yields these conservative bounds:

| matrix row | upper bound |
|---|---|
| A0 row 3 | 12H |
| A0 row 4 | 224EH+44H+4Z+7V+2 |
| A0 row 5 | 160EH+172H+4Z+3V+2 |
| A1 row 4 | 168H |
| A1 row 5 | 120H |

Rows are zero-based; all other derivative rows vanish. For n>=2, the literal `innerNorm` source sets matrixBound=512(1+E)(1+H+V+Z) and C_n=2(matrixBound+sum of the nonnegative forcing bounds). Thus every row above is <= 1024(1+E)(1+H+V+Z) <= C_n. The replay verifies all coefficientwise comparisons using integers; it does not re-derive the analytic inequalities from AST semantics.

For original order n=1 the source constructs the same 18 matrix assignment statements separately, which the pinned replay checks after renaming lambda1/b0/c0. Its C_1 is *not* the general C_n formula: C1=262144 B^2/delta^2. If B>=1, 0<delta<=1, h<=1/2, H=B, V=28B/delta, and the above DXZ hypothesis holds with e1=128/delta, then E<=5 and Z<=30B+768B/delta. The five row estimates are <= respectively 12,4554,4250,168,120 times B/delta, hence <= C1. S_delta/4 has room for Cauchy estimates from the separately asserted B bounds on S_delta; 128/delta is a deliberately loose allowance. This is a conditional derivation, including the separate n=1 source constant.

Replay from the bridge directory:

`python -B goal-next/y-higher-flow/picard-even-axis/verify_matrix_derivative_bound.py --source-dir <original-mathscope-m2-navier> --out <receipt.json>`

All three inputs have canonical-LF SHA-256 pins in the script. The original graph audit is `coefficient-dependencies.json` beside the script. The script requires all 18 first-order/general assignment statements to agree, checks that the earlier N1–5 native matrix dependency audit generated 95 nonzero derivative roots and used no lower Picard nodes, checks exact polynomial coefficients, and executes two negative controls. Run the preceding coefficient audit to replay the original graph checks.

## Forcing and the actual Xa activation seam

The actual order-one forcing contains `omegaOverX` with `v0_XX` and twice-applied source operator Z containing `F0_XX,U0_XX` and eta derivatives. Its C1 radial regularity generally requires a further X derivative (in particular v0_XXX, F0_XXX, U0_XXX, together with relevant mixed eta derivatives). The existing B majorant of derivatives only through order two does not itself supply this. On a compact radial interval and a closed smaller eta strip, joint continuity of those derivatives and holomorphy on a surrounding larger strip suffice for a finite forcing C1 bound by compactness and Cauchy; no explicit new bound has been computed here. Higher n additionally requires the corresponding lower-cutoff Picard regularity and finite convolution induction.

The exact original seam is at `Xa=4/Lambda`, where `actual-continuation-exact-inner.mjs` chooses the natural branches before Xa and the actual B.26 branches after Xa. Set y=log(X/Xa), and let FN,UN be the *actual* natural branch expressed in y. Original B.26 is initialized at FN(0),UN(0) and has the literal source activation kappa `1-(1-kappa0)*step(y/t1)`. Suppose the genuine reference source has been independently shown to satisfy on the activation collar `-actualShear/2 = kappa * partial_y(log FN)` and `actualUControl = kappa * partial_y UN`. These identities are a source ODE obligation; the present script does not prove them. Suppose further the actual source step is smooth and flat at 0, and the relevant expressions are jointly smooth in y and holomorphic in eta with uniform local bounds. Then for every finite j,

`partial_y^j [log(F_B/FN)](0) = 0` and `partial_y^j [U_B-UN](0) = 0`.

Indeed their derivatives are `(kappa-1)*partial_y(log FN)` and `(kappa-1)*partial_y UN`, with zero initial values. All their y jets vanish because kappa-1 is flat. These identities persist after every finite eta derivative, and the smooth coordinate change X=Xa exp(y) transports them to X jets. The actual collar mass uses the original natural mass at Xa plus `integral_Xa^X U_B`; hence its X jets join the original natural integral once its base mass equality is separately established. The v0 average is regular at Xa>0, so those joined U/mass jets transfer to v0. At X=0, the distinct natural average representation is needed; no division by X is justified merely by this seam argument.

`python work/goal-next/continuation32/picard-source/check_activation_seam.py --source-dir <original-navier-source-directory> --out <seam-receipt.json>`

This requires SymPy, pins the exact two source modules, checks independent symbolic Taylor coefficients through order six, and rejects the false replacement of flatness by kappa(0)=1: already the U second-order coefficient differs by k1*u1/2. The all-order implication above is a mathematical induction, not a claim that a finite jet test proves source ODE, flatness, eta analyticity, or forcing C1.

## Forcing and the actual Xa activation seam

The actual order-one forcing contains `omegaOverX` with `v0_XX` and twice-applied source operator Z containing `F0_XX,U0_XX` and eta derivatives. Its C1 radial regularity generally requires a further X derivative (in particular v0_XXX, F0_XXX, U0_XXX, together with relevant mixed eta derivatives). The existing B majorant of derivatives only through order two does not itself supply this. On a compact radial interval and a closed smaller eta strip, joint continuity of those derivatives and holomorphy on a surrounding larger strip suffice for a finite forcing C1 bound by compactness and Cauchy; no explicit new bound has been computed here. Higher n additionally requires the corresponding lower-cutoff Picard regularity and finite convolution induction.

The exact original seam is at `Xa=4/Lambda`, where `actual-continuation-exact-inner.mjs` chooses the natural branches before Xa and the actual B.26 branches after Xa. Set y=log(X/Xa), and let FN,UN be the *actual* natural branch expressed in y. Original B.26 is initialized at FN(0),UN(0) and has the literal source activation kappa `1-(1-kappa0)*step(y/t1)`. Suppose the genuine reference source has been independently shown to satisfy on the activation collar `-actualShear/2 = kappa * partial_y(log FN)` and `actualUControl = kappa * partial_y UN`. These identities are a source ODE obligation; the present script does not prove them. Suppose further the actual source step is smooth and flat at 0, and the relevant expressions are jointly smooth in y and holomorphic in eta with uniform local bounds. Then for every finite j,

`partial_y^j [log(F_B/FN)](0) = 0` and `partial_y^j [U_B-UN](0) = 0`.

Indeed their derivatives are `(kappa-1)*partial_y(log FN)` and `(kappa-1)*partial_y UN`, with zero initial values. All their y jets vanish because kappa-1 is flat. These identities persist after every finite eta derivative, and the smooth coordinate change X=Xa exp(y) transports them to X jets. The actual collar mass uses the original natural mass at Xa plus `integral_Xa^X U_B`; hence its X jets join the original natural integral once its base mass equality is separately established. The v0 average is regular at Xa>0, so those joined U/mass jets transfer to v0. At X=0, the distinct natural average representation is needed; no division by X is justified merely by this seam argument.

`python -B goal-next/y-higher-flow/picard-even-axis/check_activation_seam.py --source-dir <original-navier-source-directory> --out <seam-receipt.json>`

This requires SymPy, pins the exact two source modules, checks independent symbolic Taylor coefficients through order six, and rejects the false replacement of flatness by kappa(0)=1: already the U second-order coefficient differs by k1*u1/2. The all-order implication above is a mathematical induction, not a claim that a finite jet test proves source ODE, flatness, eta analyticity, or forcing C1.
