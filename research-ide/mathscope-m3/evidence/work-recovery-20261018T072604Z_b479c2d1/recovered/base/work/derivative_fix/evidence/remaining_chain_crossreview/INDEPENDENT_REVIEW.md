# Independent review of the remaining mathematical chain

**Verdict: accept the mathematical source applications for N6-07, N6-08, N7-04 and N7-05.** The final candidate defines the later currents, cutoff selectors, localized force and terminal extension from the same accepted initial source. It does not substitute the initial-only JavaScript constructors for arbitrary later states.

This vote excludes N6-02 and the numerical requirements of N7-06 and N8-05. It establishes neither an effective numerical supremum algorithm nor a numerical evaluator of the final fields. No completion ledger was edited by this reviewer.

## Frozen artifacts and executed checks

| Artifact | SHA-256 |
|---|---|
| `ACTUAL_REMAINING_CHAIN_APPLICATION.json` | `bc0d40d467186f3024913ae50bf3b02e69e569110a1368ad1292ea28d70ffe3a` |
| `ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json` | `b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78` |
| Latest portable `verify_remaining_chain.py` | `3f139fed351410314e97c92d88a6166aacad58a2f4b16d1a2f0b4c69a52bd454` |

The candidate and functionals are under `work/remaining_chain/evidence`; code is under `work/remaining_chain/code`. The new verifier ran with explicit `--root` and `--output-dir`, exited 0, and reproduced the frozen payload. Its generated-functionals manifest path changes with the output directory; after normalizing only that path, the JSON is identical. The functionals file is byte-identical.

I performed 115 additional source-pin, exact-root, actual-predecessor, current-source, complete-state, harmonic-range, cutoff-norm, selector, terminal-pair and scope checks. All passed. The receipt records 23 input files and the latest CLI hash. Original source files, original producers and old tests were not modified or rerun. An initial reviewer comparison encountered Python tuple versus serialized JSON-list representation; the serialized comparison and separate CLI invocation resolve that harness issue without changing the candidate.

These finite checks authenticate links. The all-stage and all-order conclusions rely on the mathematical induction below, not on the five serialized example cycles or finite terminal prefix. This is theorem reuse and independent mathematical/code review, not a new kernel proof or an independent proof of the entire paper.

## Actual currents, operators and common domain

The seed is the previously accepted initialized N6-01 tuple, with complete velocity roots 3825006/7/8, full pressure 3825009 and latest full mean pressure 3615361. The fixed background and stress roots are checked against the saved norm-family actual roots. The five-potential root is checked as 3614778. The primary and temporal potentials are bound to the original constructors before curl, with the original physical rescalings and cover. Thus the potential gauge needed for cutoff multiplication is specified by the source, rather than inferred from velocity alone.

Every successor uses these four actual operations in order:

1. Solve the fixed inhomogeneous amplitude problem for every grouped supported nonzero coefficient of the preceding actual residual, keeping conjugates and all generated harmonics. Flat residual terms remain outside this supported source.
2. After a complete pressure/residual refresh, form the physical Haar-averaged tangential source, remove its actual weighted moments, and apply the fixed signed inverse around the original primary amplitudes.
3. After another refresh, apply the temporal inverse to the actual zero-auxiliary-mean tangential residual and retain the difference between prescribed and realized axial increment.
4. After another refresh, apply the five-map to the fresh P/J targets, retain the nonlinear remainders, and refresh the complete pressure and residual again.

Each map explicitly returns the complete predecessor plus its realized increment. It retains previous angular pressure and the new angular pressure coefficient. Full auxiliary covariance is formed before Haar averaging; all cross terms remain. The graph's sources point to those exact predecessors, rather than to an initial-state residual reused at later stages.

The source theorem supplies the arbitrary-current operator application: Proposition 9.6 preserves Definition 9.4, Proposition 9.3 supplies the next supported/flat decomposition, and Lemma 9.7 fixes all inverse denominators and supports at the primary construction. Later sources can have arbitrary finite size. The harmonic damping factor does not increase the propagator, and each fixed-stage derivative dependency graph is finite. These facts permit a mathematical recursive definition without a new stage-independent numerical dispatcher. The original first-step JavaScript module's restriction to modes 1 and 2 is not misrepresented as an implementation of every later cycle.

The domain join is an equality of defining expressions, not of node numbers from different graphs:

\[
q_{\rm big}=\frac{2^{-(\ell_{\min}+4)}}{64}
=2^{-(\ell_{\min}+10)}
=2^{-(\ell_0+4)},\qquad \ell_0=\ell_{\min}+6.
\]

This is both the accepted initialized domain threshold and the original localization threshold. Stage and derivative order do not change it.

## N6-07: actual constants and derivative losses

The stage orders are sigma_j=1/5+j/10 and g_j=hj/10 with the exact positive source h. The physical increment loss is the paper's sufficient choice ell_m=2A+(m+1)(1+3h/2). Constants and logarithmic powers may depend on j and m.

The candidate now selects definite mathematical values. For the actual canonical Z_j and its actual velocity increment, it takes the least nonnegative integer logarithmic power making the weighted supremum of |Z_j|_m+|Delta u_j|_m finite, then sets C=1+ceil of that supremum. Lemma 9.8 makes the set nonempty.

The finite-state/residual loss is also definite: k_m is the least nonnegative integer loss for which both the actual finite-state and nonflat-residual weighted suprema have finite logarithmic bounds for every finite j. Lemma 9.8 supplies a common finite loss, so an integer enlargement exists. Setting K_m=max_{r<=m} k_r makes the loss stage-independent and nondecreasing. The least admissible common logarithmic power and positive ceiling select the corresponding actual constants. Each fixed-stage flat term has its own actual weighted supremum at each prescribed order N. It is never summed over stages.

These are uniquely defined functionals of the actual recursively constructed source, not arbitrary supplied constants. The finiteness proof precedes their use. Their numerical evaluation remains unimplemented and is not claimed by this acceptance.

## N6-08: noncircular cutoff choice and actual final fields

The cutoff estimate is uniform over every scale a>=1 before any a_j is selected. It applies to the exact operator

\[
T_a Z_j=\bigl(\operatorname{curl}(\chi(aq)A_j)+\chi(aq)B_j e_\theta,\ \chi(aq)p_j\bigr).
\]

It includes all mixed Cartesian/time derivatives through m. Product and chain rules consume the actual potential bound through m+1. On a positive cutoff-derivative support, aq lies in [1/2,1]; the factors of a are controlled by powers of q^{-1}. The original q derivative estimates and 0<D<1 make ellPrime_m=ell_(m+1)+(m+1) sufficient. Thus the scale-uniform weighted supremum is finite for some logarithmic power. Its least admissible integer power and positive ceiling define P-hat and C-hat before scale selection. This avoids circularly defining C-hat from an already selected a_j.

Writing x=log(1/q) and gamma_j=hj/20, the selected L_j dominates 1, L_(j-1)+1, 1+log(1/qbig), (2P-hat/gamma_j)^2 and 2(C-hat+j)/gamma_j for every m<=j. For x>=1, log(1+x)<=sqrt(x). Also log(C-hat)+j log 2<=C-hat+j. Consequently C-hat(1+x)^(P-hat) exp(-gamma_j x)<=2^{-j} throughout x>=L_j. The original full-interval cutoff condition follows; a_j=exp(L_j) grows by at least e>2.

The saved window is the exact source-defined interval [exp(-L_5),2exp(-L_5)]. Corrections 1 through 4 are retained; cutoffs 1 through 3 equal one, and every correction j>=5 is identically zero there. Its tail relative to one uncut stage J=3 is bounded by

\[
\frac18 q^{h/5-\ell'_1}.
\]

This separates an exactly zero omitted active-series tail on that positive window from the asymptotic comparison with an uncut finite state.

Only the finite initialization corrections receive chi(2q/qbig); the realized slow base and exact exterior heat/pressure are unchanged. This is the finite initialization cutoff allowed on paper p115. The modified finite state U-prime^[J] differs from the original recursive state only where q>=qbig/4, producing a supported-away-from-zero flat error. On the saved window, q<=2e^{-5}qbig<qbig/4, so U-prime^[3] equals the original stage 3 exactly.

For general fixed m,N, the selected finite J has tail exponent strictly greater than N+K_(m+2)+1 and nonflat finite-residual exponent strictly greater than N+1. After that single J is fixed, absorb its constants/logarithms into one q^{-1} loss and work below its cutoff plateau. The full second-order Navier–Stokes difference contains e_t, Delta e, grad pressure error and all three advection differences. The strict tail margin controls those terms using the same finite-state norm. Adding only that fixed stage's flat remainder proves (9.20). No infinite series of flat residuals is formed.

The final A/B/p are therefore determined by canonical source potentials and the selected cutoff sequence. Local finiteness, original flat joins, Cartesian axis representatives and the unchanged exterior establish the required local smoothness and endpoint premises.

## N7-04 and N7-05: same actual force throughout

The localization uses the same final A/B/p and the original axisymmetric cutoff. Its constants satisfy tau0=qbig/32, z0=tau0^D, r0=1, and the whole support lies in q<=qbig/4<qbig/2. The identity u=curl(cA)+cB e_theta retains grad(c) cross A. Axisymmetry gives div(cB e_theta)=0. The independent differential-polynomial expansion verifies the complete localized residual in all three Cartesian components, including the pressure commutator; deleting that commutator is rejected.

For terminal jets, the argument covers the whole compact support: fixed positive q has locally finite endpoint bounds through one extra derivative; positive radius with small q uses the exact exterior heat field and centrifugal pressure; near the origin the cutoff is one and the actual local residual is flat. These three regions yield uniform limits on all of R^3. Spatial and temporal fundamental-theorem identities identify compatible derivatives of the same F_j and show every spatial derivative vanishes at the origin. Exterior-only jets or finite differences do not supply this conclusion.

The terminal selector uses the actual finite C^a(K) norms of these F_j, b0=1, and the original least-integer rule for all a+m<=floor(j/2). The exponent j-m is positive in every required constraint, so a qualifying integer exists. Exact derivative constants for the original cutoff come from the full Leibniz/flat-exponential recurrence. Every fixed differentiated tail is bounded by a summable geometric tail. At sigma=0 only j=m contributes the mth jet, and the already proved left-side compatibility gives the join. The extension retains compact spatial support and vanishes for sigma>=1. Only the force is extended.

## Limits of this vote

The four mathematical applications are accepted for the frozen version. The original whole-field numerical energy/refinement requirements remain separate. No actual numerical force/velocity grid, whole-support quadrature refinement, four-axis refinement table, numerical supremum algorithm or last-resolved actual tau is provided by this theorem application. N6-02's independently compared residual evidence is also outside this review's vote.
