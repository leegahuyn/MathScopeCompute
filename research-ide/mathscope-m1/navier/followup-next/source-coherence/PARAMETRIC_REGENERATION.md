# Regenerating a separate source-dependent local chain

`rebuild-source-variant.mjs` connects an actual A.21 source parameter choice to
new axis, continuation, C0/C1/C2 debt, and directed interval-prefix files.
Every run uses a new `variants/<name>/` directory. Existing directories and
unknown arguments are rejected. The original baseline generators and evidence
remain unchanged.

## Executed baseline parity

```bash
node rebuild-source-variant.mjs --baseline-check
```

The baseline mode copies the original generated axis certificate as its input
and executes the two new parameterized Python generators. It compares **all
bytes** of all three resulting JSON documents with the original records:

- `uniform-source-debt-cone-refined.json`
- `continuation-refinement.json`
- `uniform-source-debt-final.json`

There are no excluded mathematical or metadata fields. The comparison passed;
the final source remains
`ac79c8268a501f9762b5f13f6efe114809a94e568efc614e2fd66ceae4303c7a`.
The 18 debt checks and 30 continuation checks passed. The original rounded
prefix is referenced through this exact equality; baseline mode does not claim
to have recomputed that prefix.

The evidence is in `variants/baseline-exact-parity/exact-baseline-parity.json`.
For another run, select a fresh directory with `--name`.

## Source parameters and actual computation

For example, the following command tests the parameter path with a different
actual pressure and axial-transition length:

```bash
node rebuild-source-variant.mjs --name parameter-path-md101-logp15 --Md 1.01 --logP 15
```

This is a local computation example, **not a recommended global parameter
choice**. The default outer datum with Md=1 has a rigorous negative-Pc witness.
Changing Md or logP does not remove the obligation to prove the entire outer
cone for the resulting new datum.

The CLI accepts exact textual values for `Md`, `logP`, `lambda`, `h`, `logXR`,
`Tf`, and `co`. Unspecified parameters preserve the actual numeric source
input, including its exact binary64 interpretation. A supplied decimal such as
`--h 0.00000001` instead denotes the exact written rational 1/100000000 and
therefore defines a different h from the default binary64 input. Both its
exact value and input interpretation are stored in the run receipt.

The pipeline executes the following operations for a non-baseline run:

1. Validate every parameter through the unchanged A.21 source producer.
2. Recompute its analytic pressure masses, real and complex bounds, and source
   order checks; compute the automatic cone-margin Lambda refinement.
3. Compute C0/C1 debts with the **actual exact source logP**.
4. Select C, the strictly positive factored exponential widths, and C2 bounds.
5. Recompute the same source's degree-24 radial prefix and eta degree-2 jets
   with 1024-bit directed intervals and analytic infinite radial tails.
6. Check agreement of h, j0, Lambda, sigmaStar, logC, and the full mathematical
   axis-certificate hash between the continuation and the rounded prefix.
7. Save a run receipt and hashes of every produced file. Verify that the five
   original baseline evidence files were not changed.

The j0 value is the same exact 1/10000000000 used in the baseline inner chain.
No input allows the user to inject a norm, error interval, Lambda, solution
array, pressure mass, or theorem-truth flag.

## Exact changes in the two parameterized generators

The baseline mathematical code is preserved in `derive_uniform_debt.py` and
`refine_continuation.py`. Their new parameterized copies read logP from
`sourcePressureCertificate.parametersExact.logP`.

The only logP-dependent mathematical substitutions are:

| Quantity | Baseline | Parameterized expression |
|---|---|---|
| Positive lower bound for P* | degree-160 positive Taylor sum for exp(14) | The same degree-160 positive Taylor sum for exp(logP) |
| Physical outer radius | logXR = log(110)+10(logC+14) | logXR = log(110)+10(logC+logP) |
| Normalized separation coordinate | Tsh-10logC-140 | Tsh-10logC-10logP |

For every nonnegative exact logP, a finite positive Taylor sum is below
exp(logP). The downstream reciprocal and debt estimates therefore keep the
same inequality direction. The normalized B8 moment map itself is independent
of P*: it uses K=P*/(1+eta^2). Every other magnitude is already read from the
new actual source certificate. The byte parity check confirms that these
substitutions recover the complete original case when logP=14.

## Explicit boundaries

The unchanged producer currently accepts Md in [0.2,4], logP in [0,100], h
in [1e-12,0.001], lambda in [0.00005,0.005], and its further exact positivity
conditions. These are **computational input ranges**, not a proof that an
arbitrary input satisfies the manuscript's sequential small/large parameter
requirements. In particular, large Md requires a much larger logP and a much
smaller h under that order; the present finite ranges may exclude them.

The source-order result is copied into each run receipt. A failing local scalar
gate, unsupported precision, or rejected source input stops the corresponding
run with `FAILED_OR_BLOCKED`; a failure is never turned into a global success.

A successful non-baseline run has status
`LOCAL_SOURCE_CHAIN_REGENERATED_NOT_GLOBAL_CERTIFIED`. It still requires its
own entire outer-cone certificate, exact outgoing moment/pressure repair,
source-bound implicit joining root, whole finite-frequency modulation, final
support and endpoint proof, and generated analytic Lean premise verification.
The existing source-log evaluator and uniform-gluing outputs continue to refer
to their explicitly named baseline data until separately regenerated and bound
to the new source hash.
