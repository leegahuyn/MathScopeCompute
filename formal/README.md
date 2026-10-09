# Golden formal source and replay

`GOLDEN-NONLINEAR-ALGEBRA-001` proves three exact commutative-ring identities in
Lean 4.34.0-rc2, using Lean core only. `GoldenAlgebra.lean` is the complete source.
The proof uses explicit polynomial expressions and the core `Expr.eq_of_toPoly_eq`
soundness theorem; Lean kernel reduction checks each normalization certificate.
This avoids loading the general `grind` tactic during each fresh replay while
keeping the same theorem statements, assumptions and axiom audit.

For `F(u) = -D(u) + λu - u³`, the first theorem proves the exact polynomial
perturbation formula assuming `D(u + tv) = D(u) + tD(v)`. The second proves the
constant-one residual is zero at λ=1 assuming `D(1)=0`. The third reduces the
linear coefficient at that point to `-D(v)-2v`.

These are algebraic statements. They do not instantiate the torus Laplacian,
prove analytic Fréchet differentiability, domain/regularity properties, PDE
existence or uniqueness, a spectral assertion, or a topology/index theorem.
The Golden numerical computation and the C-014 theorem are independent claims.

Run `python formal/replay.py --output golden-local-receipt.json` from the compute
repository with the pinned Lean toolchain installed. Every replay starts a fresh
Lean process, checks the exact source and complete manifest hashes plus runtime
commit, and audits all three theorem axioms. Scope, assumption, exclusion,
dependency and other manifest edits are rejected before Lean runs; changes to
the reviewed package require deliberately updating its pinned hashes. Failed,
missing or timed-out compilation cannot produce formal evidence. The expected
axioms are `propext`, `Classical.choice` and
`Quot.sound`; `sorryAx` is rejected. Each local receipt has a fresh run ID and a
UTC `generatedAt` timestamp, neither of which enters the stable proof hash.

The local receipt is not an authenticated cloud attestation. Imported source
and receipts remain historical in a research session until a trusted verifier
reruns the audited source. The separate MathScopeCloudLean service provides the
cloud verifier; it is not hosted by MathScopeCompute. It accepts only a fixed
claim ID, source hash and semantic-review flag at `/v1/verify/golden`; it never accepts
arbitrary source text or a supplied executable. Its proof hash binds source,
actual runtime environment and axiom audit. Replays in the same environment
must preserve that hash, while run IDs and timestamps change.
