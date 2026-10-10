# Fresh compilation of the concrete same-datum chain

The original Lean 4.34.0-rc2 kernel accepted all **14 custom modules**, with
**110 printed declaration audits**, using only `propext`, `Classical.choice`
and `Quot.sound`. These are declaration audits, rather than a count of
independent global theorems. The original 2,669 tracked source files and
kernel bytes remained unchanged throughout both recorded stages.

The [first receipt](attempts/0001/receipt.json) records 13 source compilations
from an empty custom output directory, completed on 2026-10-10 at
00:07:32 UTC. The [extension receipt](extension-attempts/0001/receipt.json)
records the subsequent compilation of `MixedEtaBindings` against that same
freshly rebuilt prefix. Its combined totals are 14 modules and 110 audits.
The extension rechecked the prefix sources, objects, logs and original
inventory before and after its own compilation. It did not recompile the
prefix a second time.

Every custom import came from these new output directories. The selected
component sources were copied byte for byte from their successful frozen
attempts; their old compiled objects were excluded from the search path.
The previously completed original default build supplied the original
project and Mathlib dependencies. Its completion evidence is in the
[N1 follow-up](../../followup-20261010-n1-final/README.md).

## Compiled dependency chain

| Module | Audited declarations | Role in the same-object proof |
| --- | ---: | --- |
| SameDatumInputs | 15 | Actual clock, pressure integral and coefficient inputs |
| SameDatumMass | 5 | Actual continuous clock-mass bound |
| FieldBounds | 8 | Eleven field norms and actual-data compatibility |
| ThresholdBridge | 6 | Original operator estimates and fixed-point threshold |
| PressureSelection | 7 | Exact terminal wait and the original pressure-data predicate |
| AmplitudeInput | 8 | Actual analytic amplitude, coefficients and norm |
| AmplitudeDynamics | 3 | Exact amplitude derivative and logarithmic gradient |
| OperatorBounds | 5 | All actual operator, resolvent and radius hypotheses |
| AxisFiniteJet | 8 | Coefficient, truncation and separate arithmetic estimates |
| ConcreteProducer | 9 | Selected infinite nonlinear fixed point and original smooth equations |
| SelectedReferenceBoxes | 8 | Exact comparison coefficients and 25 dyadic enclosures |
| ConcreteFiniteJet | 9 | Actual infinite profile to finite rounded polynomial |
| ConcreteJetRecurrence | 10 | Exact all-order nonlinear coefficient/jet projections |
| MixedEtaBindings | 9 | Actual small parameters, rescaled input formulas and eta chart |

The [selection manifest](selected-chain.json) pins the first 13 source
files, their successful component receipts, the original inventory and
mathematical assembly. The extension pins its source and component receipt
and the exact first-stage receipt. Sources, compilation logs, resulting
objects and original before/after inventories accompany each stage.

## Scope of the result

`ConcreteProducer` instantiates the original fixed-point theorem with the
actual pressure, all selected fields and operators, and the actual amplitude.
It proves the selected infinite solution and its coefficient-space comparison
error `29/Q^53` at `Lambda = Q^64`. `ConcreteJetRecurrence` projects that
same nonlinear equation to every radial/eta coefficient and to finite
rectangular blocks, including the 25-by-5 block.

`ConcreteFiniteJet` connects the actual selected nonlinear profile, at
eta zero and `|Y| <= 5`, to a 25-term dyadic polynomial with total error
strictly below `2^-118`. The nonlinear comparison, factorial radial tail
and coefficient rounding have separate proved bounds. Its 25 nonlinear
coefficient boxes use the actual selected infinite coefficients.

`MixedEtaBindings` proves the exact selected small-parameter bounds and
the rescaled source identities. It places `|eta| <= rho/4` inside the
actual analytic window and proves `|xi| <= 2^-16000`, where `xi = eta/j`.
The corresponding numerical mixed-array and eta-tail binding is a separate
exact interval audit. The original N3-03 assessment must read both the
kernel connection and that numerical binding.

The original protected independent Comparator has its own N1-06 execution
record. The two receipts here leave `protectedComparatorPerformed` and
`originalGateAssessmentPerformed` false.

## Reproduce the compilations

Use the recorded official runtime layout, with the pinned original project
and its completed original dependency build. Set `--runtime` explicitly on
another machine. The runner checks the original commit and rc2 kernel hash
before importing the original objects.

From this directory, choose output directories that do not already exist:

```sh
python3 replay_chain.py \
  --runtime /absolute/path/to/official-validation \
  --output attempts/new-clean-prefix

python3 extend_replay.py \
  --runtime /absolute/path/to/official-validation \
  --prefix attempts/new-clean-prefix \
  --module MixedEtaBindings \
  --attempt followup-20261010-same-datum-axis/independent-review/formal-finite-jet/attempts/0008 \
  --output extension-attempts/new-clean-extension
```

For the extension's portable Navier-relative receipt paths, place its prefix
and output under this Navier source tree. The canonical runners are the
files in this directory; each attempt also preserves their source bytes as
an execution snapshot. Existing attempts and selection manifests are never
replaced by these commands.
