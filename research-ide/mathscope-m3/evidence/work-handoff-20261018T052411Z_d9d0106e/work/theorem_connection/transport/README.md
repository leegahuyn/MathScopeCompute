# Angular transport successor verifier

Run from the recovered workspace:

```sh
python work/theorem_connection/transport/verify_transport_application.py
```

Python's standard library is sufficient. `--workspace ROOT` selects the recovered workspace and `--output-dir DIR` selects a separate evidence directory. The verifier rejects output directories inside the preserved source trees.

The deterministic outputs are `TRANSPORT_APPLICATION.json` and `TRANSPORT_APPLICATION.log`. Exit code 0 means all source-link/scaling checks and both negative controls passed; exit code 1 means the application was rejected. The original 15 audit checks are retained, with two additional literal-map/root checks, 20 pinned-file checks, and 11 exact rational exponent identities. These are verifier checks, not a count of mathematical obligations.

The negative controls modify only in-memory copies: one actual map argument and one assembled residual root. Each must be rejected by its corresponding semantic check. No original producer, consumer, test suite, derivative expansion, or private source runtime is executed.

The JSON separates five inherited mathematical prerequisites from the six-step all-fixed-order inference chain. It includes actual background homogeneity compatibility: the source implicit coordinate satisfies `s_label(P)=K*s_ref`, preserving `X`, `eta`, and `Q*s`, with the correct velocity/pressure scaling. The generic affine chain rule is applied to the actual source maps, and the full-vector exact function identity is differentiated using the independent same-source smoothness results.

PASS is a checked application of the conditional transport theorem. It does not claim to reprove all upstream mean/primary estimates. It does not promote N6-01 or certify later N6-02 substeps. Historical statuses remain unchanged.
