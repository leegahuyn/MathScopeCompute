# MathScope Stage 8 — Hardening and 3D Research Visualization Contract

Stage 8 follows the v0.3.1-A/B/C/D master checklist:
regression → benchmarks → reproducible .mathscope bundle → docs → performance/accessibility → release gate.

## 3D representative law
Each view must identify its source object, a RepresentationSpec, its coordinate map,
discarded/encoded information, scope assumptions, numerical residual/uncertainty,
source revisions and evidence grade. A picture is never proof.

### Stage 5
- Research Graph: x=dependency tier, y=sibling layout, z=evidence grade or revision recency. Geometry is graph layout, not theorem structure.
- Stress Test: x=parameter, y=refinement, z=residual/fidelity defect; search failure remains evidence.
- Copilot: suggestions as nodes/edges, no formal promotion.
- Proof Dock: proof coverage/revision lattice, historical formal evidence distinguished.

### Stage 6
- Symbol/Ellipticity: x,y=unit cotangent direction chart, z=smallest singular value with zero/characteristic loci; sampled != theorem.
- K-class: display sampled symbol determinant phase and representative, not abstract class.
- Index: kernel/cokernel/index independent signed bars; index=0 != invertible.
- Boundary: local condition eligibility and obstruction as annotated regions; nonzero local obstruction != all BC impossible.
- Nonlinear bridge: candidate→linearization→symbol/index, nonlinear global solution not certified.

### Stage 7
- Galois: complex roots and explicitly typed permutation edges; visual resemblance != Galois relation.
- Zeta complex surface: x=Re(s), y=Im(s), z=log(1+|ζ(s)|); hue=arg ζ(s). Pole s=1 masked; analytic continuation method recorded. Re zeta and Im zeta are not independent spatial coordinates. Numerically near-zero sample != certified zero. Riemann zeta != spectral zeta; compare in a separate typed panel.
- Spectral flow: x=t, y=track index, z=eigenvalue; only explicit self-adjoint Fredholm paths have signed crossings.
- Equivariant/K-homology: finite reference group/representation/commutator graph, NOT a 3D realization of the K-class.
- Perturbation: spectra evolving with parameter; finite index is not infinite Fredholm index stability.
- Ricci flow: parametric time-dependent reference metric with curvature/selected spectrum overlays; no automatic surgery/lifting inference.

## Numeric contract: complex ζ(s)
For bounded complex s and s != 1, mpmath.zeta evaluates analytic continuation.
Two dps values are compared to estimate precision sensitivity, not to certify an error bound.
The adapter masks a neighborhood of the pole; height is clipped only for rendering.
Always emit NUMERICAL INDICATOR with finite-grid metadata, source/environment hashes, and diagnostics.
No validation mode may infer RH, prove zero locations, or identify an arbitrary operator spectral zeta with Riemann zeta.

## Golden integration fixture
F(u)=-Δ_g u + λ u -u³=0:
PDE candidate + residual → linearized L=DF(u*) → finite spectrum
→ 3D representation with singularity/fidelity metadata → claim/stress/Lean coverage
→ principal symbol/ellipticity/K-class/Fredholm index/boundary.
A complete release requires end-to-end identity/revision references and regression checks,
not just panels whose reference fixtures can be run separately.

## Status
Stage 8 backend complex-zeta adapter is a reference implementation.
The final release gate must remain HOLD until the browser E2E, bundle import/export replay,
cross-stage golden fixture and performance/accessibility probes have evidence.
