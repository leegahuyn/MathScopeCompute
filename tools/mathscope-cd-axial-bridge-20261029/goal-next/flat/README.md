# First-cycle principal flat residual

The earlier three-family composition included one extra standalone Primary
term on each signed mode-one component of the archived run. Use the
exact correction in [the archived reconciliation](../f1-mean/archived-cutoff-reconciliation.json).
The individual source bindings and symbolic recompositions below describe
the archived inputs. The corrected first Forced generates a new source graph.

The archived first post-FiveMap source is the output of GitHub Actions run
39988632325. Its 4,420,257-node graph and native definitions are unchanged.
The older live Forced checkpoint supplies candidate roots. Its numbering
first differs at node 3615944, so numerical offsets serve only as lookup
hints. The verifier checks the candidate nodes against the newer graph's
actual native registry, formal and actual argument orders, and operator
shapes.

For all 20 positive Forced systems the checker recovers both terms
(1-ψ)f and ∂ᵥψ·t in each complex component. The mapped f uses the same
unprojected wrapper and source body as the formal source inside the retained
projection P f. The t node is the zero-order application of the exact
registered system at the same actual v and frozen arguments. The actual ψ
and ∂ᵥψ contain the two source step factors at 20v/Ls−4 and 16−20v/Ls.
The algebra verifies their chain multipliers by comparing products with Ls.

The companion Primary/Signed replay removes ψ structurally from the formal
potentials of the real half-leading mode. It retains the original covariances,
transverse and slow factors and actual lift substitutions. Both homogeneous
families contribute ∂ᵥψ times the uncut half-leading mode, using the
homogeneous moving-frame equation from Proposition 9.1. The source step has
flat endpoints. The derivative support lies in the two longitudinal
transitions, inside the registered original pulse.

The historical composition binds all three families to the same 10
own-phase cases and 162 original signed rows. Its 240 formal
recompositions verify the arithmetic for its chosen subtractands. The
archived physical residual already contains `(1−ψ)P` inside the Forced
term `(1−ψ)f_raw`, where `P` is the Primary cutoff derivative. The
reconciliation removes the extra standalone Primary subtractand at 60
mode-one component positions and keeps the actual Forced and Signed
cutoff terms. A paper-aligned input excludes `P` before the solve. Its
new physical residual retains `P` once.

The complete F[1] ledger and uniform derivative estimates are still needed
for the original next forcing input. The existing proof hypotheses about
real-domain materialization and smooth flat joins govern the remaining
native derivatives. An independent same-chart next inverse, all later
cycles, the final field and its numerical jets remain open.

## Reproduction

Run from an extracted evidence archive. The separate Git checkout must
contain the pinned producer and checkpoint commits.

```powershell
$repo = 'C:/path/to/MathScopeCompute'
$bridge = 'tools/mathscope-cd-axial-bridge-20261029/goal-next'
$graph = 'inputs/graph'
$projection = "$bridge/cycle/group-postfive-residual.json"
python "$bridge/flat/bind_forced_cutoffs.py" --repo $repo --graph $graph --projection $projection --out forced-replay.json
python "$bridge/flat-homogeneous/bind_homogeneous_cutoffs.py" --repo $repo --graph "$graph/original-source-nodes.jsonl.gz" --registry "$graph/original-source-functions.json" --projection $projection --forced forced-replay.json --out homogeneous-replay.json --controls-out homogeneous-controls.json
python "$bridge/flat/combine_principal_cutoffs.py" --projection $projection --forced forced-replay.json --homogeneous homogeneous-replay.json --out subtraction-replay.json
```
