# Independent replay of the corrected first Forced source

GitHub run [43010379487](https://github.com/leegahuyn/MathScopeCompute/actions/runs/43010379487)
executes reference checkout `f8cb4034e86d7b669d52a6f2248aebba156b51b5`
from original PR30 base `a9b3a5b317525f6d0a71e2e356b054c9d25d2e60`,
with the repaired source and recorder from
`15582df5e06fa462b29fea01842becd89fb864ac`. Use its artifact
`mathscope-corrected-first-forced` after the construction job succeeds.

The original first Forced input was the raw initialized nonzero angular
residual. The corrected constructor keeps the primary cutoff contribution
as a separate fundamental coefficient and supplies
`f_supported = f_raw - P_primary` to the first inverse. The second
harmonic remains unchanged and the primary imaginary coefficients are zero.

The Python replay re-reads the full graph stream and exact coupled
registry. It authenticates the node count, header, byte count,
operation histogram, SHA-256, exported roots and native registry counts.
For all ten fixed band/sign charts, it obtains the raw cosine and
sine coefficients from the original own-label expression registry.
It replays the subtraction with exact rational coefficient arithmetic.
For each nonzero primary operand it also identifies the correct
source-defined primary coefficient body and its exact longitudinal
cutoff derivative. The pinned constructor defines that coefficient as
one half of the uncut primary amplitude times the cutoff derivative.

Every repaired source definition and its pulse argument substitution is
checked through the two distinct native layers. The first layer applies
the complete common-torus source at the actual fixed-lift
`H_w = Y + (c_i/T_g^delta)(w-v(Y))v_t`. The second wraps that mapped
expression with the exact full forced parameter tuple. The independent
projection check uses `-f + n(n·f)/|n|²` and compares every component to
the native zero-data system registry. The check reconstructs the
coefficient matrix with the recorded normal and its derivative, and
checks both complex pressure components from the full `n·f` term and
moving-normal velocity contribution. Native velocity applications carry
the exact system, complex part, component, pulse variable and zero jet
order. The cutoff check reconstructs the two transitions and their
derivative at the actual pulse endpoint and validates each retained
`(1−ψ)f_supported+ψ′t` decomposition. The three physical conservative
residual output roots reach the corrected systems through their typed
native definitions.

Run the independent checker after downloading the completed artifact:

```text
gh run view 43010379487 --repo leegahuyn/MathScopeCompute --json databaseId,headSha,status,conclusion,workflowName,url
gh run download 43010379487 --repo leegahuyn/MathScopeCompute --name mathscope-corrected-first-forced --dir ARTIFACT
python verify_repaired_first_force.py --repo REPO --artifact ARTIFACT --run-metadata GITHUB_RUN_JSON --out independent-repaired-first-force.json
```

The mutation controls reject an incorrect raw complex part, reintroduction
of a raw primary coefficient, bypassing the inverse-source wrapper,
exchanging the two fixed-lift arguments, breaking a native velocity
application, changing the full pressure, and detaching a projected
forcing component. The optional `exercise_archived_controls.py` separately
exercises the checker on the earlier uncorrected source snapshots. That
fixture tests conventions and cannot certify the repaired run.

## Archived positive target weights and all 30 half-amplitudes

`bind_primary_amplitude.py` reads the same GitHub artifact and authenticates
the first 3,654,073 node records against the archived pre-repair prefix.
It recovers the three original weighted vector components for each sign
from their incidence in the two arms of the original potential cross
products. It then applies the active archived fixed representative
tuple and the repaired chart's exact transverse and pulse values. The
result equals the repaired real fundamental coefficient after removing
its one explicit outer `dψ` factor. The archived weighted coefficient's
single outer `ψ` factor is removed structurally along multiplication
nodes, and the independent factor `1/2` is checked. The archived
potential-to-leading-velocity identification uses the original moving
frame tangency and vector triple-product source proof.

The formal positive weight roots `#623824` and `#623825` match the actual
repaired roots `#3625718` and `#3652093`, respectively. The result
records ten alpha-equivalent whole-integral groups for each sign.
Every group includes the formal and actual body, binder, lower and
upper bounds and enclosing binder scope. The two bounds use the
ambient formal-to-actual substitution, and only the integrand uses
the integral binder. Every inner cutoff remains in the target-weight
integrals. Three mutations reject a missing `1/2`, swapped chart
coordinates, and replacing that inner cutoff by one.

```text
python bind_primary_amplitude.py --repo REPO --artifact ARTIFACT --out independent-primary-half-amplitude.json
```

The scope is the first Forced source on its declared pulse domain.
Uniform class bounds, support and all-order joining, corrected Signed,
Temporal, FiveMap and final jets remain open. The decision remains
`RELEASE HOLD`.
