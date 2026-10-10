# Independent audit of the fresh concrete Lean chain

**Result: PASS, 343/343 checks.** The audit verified the completed fresh
13-module compilation and its one-module extension, covering **14 source
compilations and 110 printed declaration audits**. It independently resolved
the actual imports of all 14 sources through the original Lean dependency
parser and object resolver. Every custom dependency resolved to the newly
compiled object in the fresh prefix or extension, with the exact SHA256
recorded by that compilation.

The audit ran on 2026-10-10, 00:13:08–00:13:12 UTC. Its append-only result is
`attempts/0001/receipt.json`. No mathematical source, accepted component
receipt, fresh compilation output, original tracked file, launcher, or kernel
was modified by this audit.

## What was examined

The reviewed orchestration consists of
`followup-20261010-symbolic-gluing/formal-clean-replay/freeze_chain.py`,
`replay_chain.py`, and `extend_replay.py`. The auditor does not import their
Python helpers. It separately reads and hashes their source, their frozen
selection manifest, the accepted component sources and receipts, the actual
fresh source/object/log files, and the original source inventories.

The prefix runner requires a nonexistent output directory, copies the pinned
source files into it, checks that it contains no custom `.olean` files, and
compiles each module only after its custom dependencies. It obtains the
effective import search path from the original Lake environment and rejects
visible same-name custom objects outside the fresh output. Each successful
step records the source, object, and log hashes and the exact declaration
audit targets. All actual import headers use the single-import-per-line form
recognized by the runner; the independent original Lean parser confirmed the
resolved dependency set.

The extension runner verifies the existing fresh prefix's source, object,
log, axiom, and selection bytes before and after compiling `MixedEtaBindings`.
Its new output did not contain that object before compilation. The extension
uses the immediately rebuilt prefix and its own new output as the only
locations containing custom modules. Its receipt correctly records a
13-module prefix followed by one new compilation; it does not claim that the
prefix was compiled for a second time.

## Actual dependency and axiom results

| Module | Printed declaration audits | Direct custom imports |
| --- | ---: | --- |
| `SameDatumInputs` | 15 | None |
| `SameDatumMass` | 5 | `SameDatumInputs` |
| `FieldBounds` | 8 | `SameDatumInputs`, `SameDatumMass` |
| `ThresholdBridge` | 6 | None |
| `PressureSelection` | 7 | `SameDatumInputs` |
| `AmplitudeInput` | 8 | `FieldBounds` |
| `AmplitudeDynamics` | 3 | `AmplitudeInput` |
| `OperatorBounds` | 5 | `FieldBounds`, `ThresholdBridge` |
| `AxisFiniteJet` | 8 | None |
| `ConcreteProducer` | 9 | `OperatorBounds`, `AmplitudeInput`, `AmplitudeDynamics`, `PressureSelection`, `AxisFiniteJet` |
| `SelectedReferenceBoxes` | 8 | `FieldBounds`, `AxisFiniteJet` |
| `ConcreteFiniteJet` | 9 | `ConcreteProducer`, `SelectedReferenceBoxes` |
| `ConcreteJetRecurrence` | 10 | `ConcreteProducer` |
| `MixedEtaBindings` | 9 | `ConcreteProducer`, `SelectedReferenceBoxes` |

All **20 direct custom import edges** resolve to the fresh objects. All
**63 reported dependency references**, including the ordinary Lean and
original project dependencies, exist at their resolved paths. The complete
per-file paths and SHA256 values, together with each module's transitive
custom dependency closure, are recorded in the receipt. All noncustom
dependencies resolved within the preserved original runtime.

For all 110 audit entries, the freshly parsed log equals the accepted
declaration list and its recorded axiom list. There are no duplicate printed
targets within a module. The lists contain only `propext`, `Classical.choice`,
and `Quot.sound`; no `sorryAx` or Lean error appears. Each mathematical
compilation has an observed exit code of zero and an output object whose
current hash equals its recorded fresh-compilation hash.

## Dependency reporting through the preserved launcher

The unchanged `lean-rc2-entry.c` launcher does not forward the `--deps` option,
although the original Lean help text advertises it. The direct attempt was
executed and retained in `attempts/0001/direct-deps-option.log`; it exits with
code 1 and reports the unrecognized option. This is not counted as a
successful `lean --deps` command.

Instead, `DependencyProbe.lean` calls **`Lean.Elab.printImports`**, the exact
function invoked by the original `Lean.Shell` `--deps` branch. That original
function parses the supplied source with Lean's parser and calls the
original `findOLean` resolver for each import. The probe imports only
`Lean.Elab.Import`. It adds no axiom, mathematical result, or substitute
dependency algorithm. Two observed exit-zero runs use precisely the
recorded prefix and extension search paths, respectively. Their complete
outputs are `prefix-resolved-imports.log` and
`extension-resolved-imports.log` in the audit attempt.

The official `Lean/Shell.lean`, `Lean/Elab/Import.lean`, and
`Lean/Util/Path.lean` sources, the unchanged launcher source, and all reviewed
orchestration sources are snapshotted alongside the receipt. No launcher or
kernel change was made to enable this diagnostic.

## Preservation and evidence identities

The original checkout remains at commit
`f9e8bc5b38b6e212696e8a30e3e91517af887bbd`. All **2669 tracked files** exist and
match the accepted original inventory, both compilation inventories, and
the independent audit's before/after inventories. The kernel SHA256 remains
`cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5`.

| Evidence | SHA256 |
| --- | --- |
| Fresh 13-module receipt | `510c83e7cb15554ababb559e842233cbd5aa806c0f814995360efe15274d2720` |
| One-module extension receipt | `f4890e49435a7848d426358180605a0636145897516de4f2515b63c8b7706b87` |
| Independent 343-check receipt | `245086de9600df89ddac6868fb0716c733c1fc46fa29ceecc81e32796cb79ec8` |
| Independent auditor source | `cf3ea362602d00a168011de627c8484ed43b7dc3f3fdf11d8eb4ab0e8b2ae0cb` |
| Original-API dependency probe | `0fd152efbb944cadc87bdd43933ae72d96ee5ce11ef40688b9bf952272189164` |

The selected one-profile receipt and mixed-Φ interval receipt also retain
their frozen manifest hashes after the audit. This verifies their attachment
to the compilation manifest; their mathematical interval checks and the
original acceptance-gate assessment have separate evidence.

## Scope and reproduction

This is an independent read-only audit of the actual fresh compilation
evidence. It does not repeat the mathematical compilations, run the protected
Comparator, or claim that the entire nonlinear numerical expression graph
has been evaluated. The mathematical chain and its quantitative finite-jet
consumers are described in `../ACTUAL_PRODUCER_COMPLETED.md` and the accepted
module sources.

To repeat this audit, run `audit_replay.py` with `--runtime` pointing to the
preserved original runtime, `--prefix` and `--extension` pointing to the two
fresh outputs, and `--output` pointing to a new, nonexistent directory.
Every attempt is append-only. The current result and all its snapshots are
frozen; no further mathematical source edits are planned.
