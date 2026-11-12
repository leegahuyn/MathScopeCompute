# Actual first even-X Picard derivative, including X=0

This fixed-order transport proof uses original source algebra and the [value-tail result](../fixed-n-radial-tail/value-tail.json), under its explicit source C/2 bounds and eta analyticity premises.

The pinned original N4 graph and registry contain actual systems 0,3,5,7,9, corresponding to positive orders 1–5. `check_parity_n4.mjs` reads the original stream, verifies all ten transitive source-runtime module hashes and the previous independent Python N4 tail receipt, and checks the original matrix and forcing parity

    A_j(-xi,eta) = -P A_j(xi,eta) P,    f(-xi,eta) = -P f(xi,eta),
    P = diag(1,1,1,1,-1,-1).

It checks all 22 nonzero matrix/forcing entries in each original system; an intentionally wrong parity test is rejected. This source algebra establishes, for the original zero-axis Picard iteration, parity `W(-xi)=P W(xi)` once its real/complex regularity and limiting semantics hold. It is not itself a convergence proof.

`check_derivatives_n4.mjs` generates the exact source xi derivatives of all 95 nonzero original A0/A1 entries (19 per system), adding 2,940 fresh source graph nodes with SHA-256 `b9a15fce79388d7d606241af4a6c951c29f672c8590a891ed2546c99d1dafd13`. These fresh local graph IDs are not original N4 export IDs. The independent Python `verify_coefficient_dependencies.py` checks their original matrix roots against the pinned N4 registry and traverses each original ordinary A0/A1 operand closure. Each closure has 103 original leading natural-series nodes and no lower Picard or M3 native call. Thus the new coefficient-xi-derivative regularity obligation is concretely a **leading-data** obligation; no numerical supremum has been evaluated.

## Conditional error bound

For one fixed original actual system, let original source values be C, strip s, radial ceiling a and K. Let `W_N` be the mathematical N-term Volterra sum and `E_N=W-W_N`. Assume the original coefficient and forcing bounds and eta holomorphy on `S_(2s)` needed for the preceding value-tail proof, and sufficient joint xi-C1 regularity and eta-holomorphic mixed derivatives for the coefficients and forcing to give the individual mathematical sums and limit two xi derivatives. In particular forcing xi-C1 is required for existence of the individual second derivatives, even though forcing cancels from the error equation. Let

    D = max( ||partial_xi A0||, ||partial_xi A1|| )

be a finite uniform max-row bound on `[0,a] x S_(s/2)`. Such finiteness follows if the relevant original leading functions and the indicated derivatives are jointly continuous on the radial interval and a closed eta tube contained in their analytic domain; that leading-data condition is a premise here, not certified by the registry alone.

For `N>=K+2`, the original regular Volterra identity and the value bound give, using eta Cauchy from `S_s` to `S_(3s/4)`,

    ||E'_(N-1)||_(S_(3s/4))
        <= C*(1+4/s) * 4^(-(N-2))/3.

Use the same identity on the xi derivative of the error RHS. With `q=4/s`, eta Cauchy from `S_(3s/4)` to `S_(s/2)` and the product rule give

    ||E''_N||_(S_(s/2))
        <= 2*(1+q)*(D+(C^2/2)*(1+q))*4^(-(N-2))/3.

The loose common tail `4^(-(N-2))/3` also dominates the value error `E_(N-1)`; no numerical source K is evaluated. For the source parity-even first four components, FTC gives for all `0<=X<=a^2`, including the one-sided axis endpoint,

    partial_X E_N(sqrt(X),eta) = (1/2) integral_0^1 E''_N(t*sqrt(X),eta) dt,
    partial_X E_N(0,eta)       = E''_N(0,eta)/2.

Cauchy in eta on disks approaching radius `s/2` around each real eta in `[-1,1]` thus proves for each fixed nonnegative m

    |partial_X partial_eta^m E_N|
      <= m!*(2/s)^m*(1+4/s)*[D+(C^2/2)*(1+4/s)]*4^(-(N-2))/3.

This is uniform in X up to and including the axis and tends to zero. The source parity and original coefficient-root evidence bind its algebra to actual n=1–5 systems. The exact rational checker validates the constant algebra and a separate parity-compatible scalar toy tail; the toy is not an evaluation of any original Picard coefficient.

The [matrix derivative replay](MATRIX_DERIVATIVE_KO_SOURCE.md) proves the implication D <= C from the original leading-data majorants with separate constants for n=1 and n>=2. The [B.26 source replay](actual-seam/README.md) pins the actual activation branch and derives its two slope identities from the natural recurrence, under convergence and nonvanishing on the source strip. The original forcing xi-C1 and eta-holomorphic bounds, leading-data majorants on that strip, all actual caller frames, native infinite-limit identification, arbitrary n, and higher X derivatives remain open. The native display evaluates a finite eight-term sum.

## Portable replay

Copy this directory to `<bridge>/goal-next/y-higher-flow/picard-even-axis/`. It uses this bridge's `goal-next/y/native_reference_scopes.py` (SHA-256 `37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758`) by a path relative to the script. All source graphs and runtime paths are positional; no input graph or runtime is copied. The original source-runtime root must contain `research-ide/` and the ten exact pinned dependencies in the Node scripts.

From the bridge directory:

    node --max-old-space-size=2048 goal-next/y-higher-flow/picard-even-axis/check_parity_n4.mjs <N4_GRAPH_DIR> <RUNTIME_ROOT> <PYTHON_TAIL_RECEIPT_JSON> <PARITY_OUT_JSON>
    node --max-old-space-size=2048 goal-next/y-higher-flow/picard-even-axis/check_derivatives_n4.mjs <N4_GRAPH_DIR> <RUNTIME_ROOT> <PYTHON_TAIL_RECEIPT_JSON> <DERIVATIVES_OUT_JSON>
    python goal-next/y-higher-flow/picard-even-axis/verify_coefficient_dependencies.py <N4_REACHED_JSON> <N4_REGISTRY_JSON> <DERIVATIVES_OUT_JSON> <DEPENDENCIES_OUT_JSON>
    python goal-next/y-higher-flow/picard-even-axis/check_even_estimate.py <PARITY_OUT_JSON> <DEPENDENCIES_OUT_JSON> <VALUE_TAIL_JSON> <ESTIMATE_OUT_JSON>

The Python tail and value receipts accept LF or CRLF but are authenticated by their canonical UTF-8 LF content; source graph, registry and runtime files are authenticated as exact bytes. Python-generated outputs use UTF-8 LF. The expected canonical-LF input tail receipt hash is `ae27c89dd4c11bdd284e857f8c6770693b14c4860d1cd5b8bb0045d8795e5016`, and value-tail receipt hash is `e91da545f90c5c215209b67687f27494015bedfcfd9349a52fb1504c81021a04`. The earlier original N4 graph, registry, reached export and original runtime remain required external inputs; see the preceding source audit for their complete pins.

All four scripts were replayed against the original N4 graph and the existing original-primary-degree runtime. The Python helper path was also tested in a scratch directory with the same layout as the intended bridge. The original N4 stream was independently checked by Python in the input tail receipt; Node only materializes the 130,348-node source prefix required by these tests. No runtime or source input was copied into this portable directory.

`MathScope/M3/CD/EvenAxisTail.lean` contains the normalized FTC average, its integral bound and the conditional error and geometric tail bounds. All four statements compiled in [GitHub Actions run 43290866453](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43290866453). Original analytic inputs remain explicit hypotheses.
