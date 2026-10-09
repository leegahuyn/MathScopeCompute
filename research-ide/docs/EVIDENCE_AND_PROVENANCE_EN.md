# Evidence, audits, and provenance

The English edition preserves the evidence bytes delivered with **MathScope v54 / `16f4f911`**. It adds explanations and translation bindings; it does not turn a stored result into a new execution or a proof. The [source selection](../provenance/source-selection.json) records every included and omitted original archive member with its original digest.

## Distinct questions require distinct evidence

| Evidence | What it can establish | What it does not establish by itself |
|---|---|---|
| Source and file hashes | Which exact bytes were used or preserved | Correctness of those bytes |
| A successful bounded computation | The implemented procedure returned the documented result for that request | A universal theorem or an infinite-domain statement |
| Independent numerical comparison | Agreement of separately implemented paths within a stated error criterion | A rigorous enclosure unless such a bound is actually supplied |
| Exact rational certificate | The encoded finite algebraic/interval claim, under its exact premises | All external analytic hypotheses or a complete global witness |
| Analytic bound with exact constants | The stated analytic implication and its computed constants | A newly executed Lean proof of that implication |
| Imported Lean theorem audit | The exact imported declaration, type, kernel environment, and axiom dependencies | A new instantiation of every theorem premise by the numerical object |
| Fresh replay | A new computation matching the recorded mathematical output in the matching environment | Mathematical truth beyond the procedure's stated scope |
| Browser observation | The visible UI and actual API behavior observed in that session | A new Lean kernel run or unsampled continuous-domain behavior |

## Frozen release identities

| Artifact | Identity |
|---|---|
| Source archive | `MathScope_M0_M1_Source_and_Evidence.zip`, 73,559,111 bytes |
| Source archive SHA-256 | `ccc8d6dd7bc85f8e5a054aa04c0adab6f1ebd3172a175c667180cf9ef75b58f9` |
| Original archive manifest SHA-256 | `d4bcc38dcd6186cef9b6a9169fca6b8f900f0afc776f00eb3e5ae803754f94ae` |
| Mathematical Worker SHA-256 | `0526fb1030c328e940c39672e86dfb9d24f09f4622794269c1e0eadbb92cc0ca` |
| App bundle SHA-256 | `4dc2624ae5ef86ec23d329e7b8d9e4129daef956bd81bd3f3ddf029206d9dc14` |
| Source pins | 50 pinned members in the build manifest |
| Engine versions | M1 `1.2.0`, NS `1.3.0-m1` |

See [build-manifest.json](../mathscope-m1/build-manifest.json) and [the verified v54 deployment](../mathscope-m1/evidence/deployment-v54-verified.json). The Python backend's repository commit is a separate identity; moving these preserved files into that repository does not rewrite the historical deployment record.

## Actual browser and CLI records

The final v54 browser ledger records **19/19** actual WebMCP/visible-DOM observations at **2026-10-09 18:24:40.511 UTC**. It includes the live Worker and registry, gluing calculations, A.21 pressure and axis, point/ℙ¹ comparison, G₂ projection, exact input/precision rejection, M0 saves, and fresh replay.

The ledger is an **observation summary of actual checks**, not a byte-identical copy of a raw browser export. Synchronizing the browser-created raw JSON file timed out. The final screenshot was separately synchronized successfully, and it remains [available](../mathscope-m1/evidence/browser-v54-final.jpg). This distinction is encoded in [browser-final-v54.json](../mathscope-m1/evidence/browser-final-v54.json).

The gluing output was saved in M0 revision 68 and replayed by a fresh job with `MATCH`. The source-axis output was saved in revision 65 and also replayed with `MATCH`. Both retained `formalPass:false`. UI checks verified that changing an example immediately invalidates the prior result/input binding and disables saving, while restoring the selected result's original input restores the binding.

The v53 cohorts comprise **19 core**, **19 follow-up integration**, **82 M0 regression**, and **48 CLI** assertions/controls. The CLI cohort contains seven actual CLI calls and seven separate public-engine controls. It did not run all 48 examples. The engine controls include actual recomputation, forged-promotion mismatch, foreign-environment rejection, precision and budget refusal, and caller-supplied debt rejection.

Only the UI workspace source changed between v53 and v54, and the Worker remained identical. [The continuity record](../mathscope-m1/evidence/v53-v54-worker-continuity.json) documents that fact. The v53 cohorts retain their real execution version; they are not renamed as fresh v54 runs.

## Three different Lean audit scopes

### Local MathScope component targets

The local component audit used Lean **4.34.1**, commit `5045d0056413266e57c625dcd7c365b10e377c52`. Where mathlib was imported, its commit was `d13f23b723b8a846827a245b89c10fc7d3f11612`.

The **71 targets** comprise arithmetic 31, gauge 27, and NS 13. Their exact types, `#print axioms` output, sources, exit codes, logs, and hashes are preserved. **Nine deliberately incorrect cases** were rejected. This audited local set did not report `sorryAx` or additional user axioms; the standard-axiom dependency set varies by target and should be read from each actual record.

These are finite/local component targets. Their success does not certify arbitrary prismatic objects, a quantum Yang–Mills construction, all generated NS analytic premises, or a full source-profile reconstruction.

### Original rc2 C/D declarations

The original NS repository commit is `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`. It used Lean **4.34.0-rc2**, commit `6a10ac8c22beadecabdbb0919c2b50214762f91d`, and original mathlib commit `85e3a25e006c35636f0e53b0e9296caca2685bc0`.

`lake build NavierStokes.ComparatorSolution` completed on **2026-10-09 16:05:12 UTC**, with **9371 Lake jobs and exit code 0**. At **16:06:24 UTC**, a separate pinned declaration import/type/axiom query completed with exit code 0 for:

- `NavierStokes.Comparator.navier_stokes_breakdown_R3`
- `NavierStokes.Comparator.navier_stokes_breakdown_periodic`

Both reported `[propext, Classical.choice, Quot.sound]`. Their exact types preserve the original initial-data and forcing hypotheses. These are two original submitted theorem audits, not two newly invented theorems and not a successful independent Comparator run.

The original kernel bytes were retained. An explicit installation-path entry handled an environment-specific launcher-path problem; the record does not claim that the failed path-autodiscovery launcher succeeded. See [the original audit summary](../mathscope-m1/navier/official-validation/official-audit-summary.json) and [command results](../mathscope-m1/navier/official-validation/full-pinned-command-results.json).

### Follow-up axis audit

The separate axis audit inspected **16 exact exported declaration types/axiom references** under the original rc2 environment and checked **four new scalar statements** for the rational-pressure default fixture. A false-margin case of the correct type was rejected. Standard axiom dependencies remain explicitly listed.

Those four scalar statements do not automatically instantiate the A.21 source-axis producer, whose input and generated analytic premises differ. The 16 imported references are not 16 new global proofs. The counts therefore remain separated from the 71 local targets and two C/D declarations.

## The immutable full-build snapshot

The release contains a snapshot captured at **2026-10-09 18:15:19–18:15:21 UTC**:

- [snapshot.json](../mathscope-m1/navier/original-build-release-snapshots/20261009T181519Z/snapshot.json)
- [SNAPSHOT_MANIFEST.json](../mathscope-m1/navier/original-build-release-snapshots/20261009T181519Z/SNAPSHOT_MANIFEST.json)

The snapshot digest is `5be11b40fbaadfe93c59c12cf7de059239ad247b4cf5534978f7d64c928058ee`. It checks the fixed source inputs, manifests, kernel, entry, copied observations, and source status. The whole default build state is **`RUNNING_AT_CAPTURE`**, with null exit/completion fields. Its artifact inventory is NS **794/817**, Euler **158/1840**, ComparatorChallenges **2/2**.

A running snapshot's copied log is an observed prefix. It cannot be described as the final log of a completed build. Packaging omitted four live mutable progress/result/log paths and copied the snapshot instead; the build was not stopped to make the archive. No current process liveness or future persistence is implied by this historical record.

Earlier runs have separate histories: one was intentionally interrupted with exit −15 when prioritizing C/D; another disappeared after a stream interruption and has an unknown actual exit cause. Neither is rewritten as success. The later default-build resume began at 17:50:28 UTC and was still running at snapshot capture.

The protected Comparator failed in the recorded container because its user systemd/DBus/delegation requirements were unavailable. The original protections remain intact. No successful Comparator or Nanoda outcome is inferred from the selected build or axioms query.

## Corrections and negative evidence are part of the release

### Ns scaling correction

The correct source formula places `−WU` outside the division by X. Historical B.26/C.12 code divided it by X. A new independent source-formula comparison found **243/243 failures** in the old data; corrected results passed **243/243**, with a maximum difference approximately `2.8422e-14`.

The old shared 109/109 regression and C.12 53/53 cohort did not reconstruct that expression independently. The corrected C.12 checks increased to 57/57, accompanied by **1135** exact Fraction source-formula comparisons and a separate **74** high-precision correction-map comparison. Their scopes are not interchangeable.

Previous code, fixtures, and results remain in `navier/followup-construction/history/ns-wu-scaling-v1/`. The installed Worker does not import them. [The correction record](../mathscope-m1/navier/followup-construction/ns-source-formula-correction.json) ties the old and corrected evidence together.

### Gluing resolution and representation failures

The initial Gauss32 gluing candidate failed **130/616** independent checks. The implementation retained the tolerance and moved to the documented 128/192-point rules and stable normalization. It also preserves genuine failures for a larger-j₀ candidate and the `logP=14` finite-axis positivity branch.

Nonzero signed-log debt that cannot be represented in the Newton coordinate type must produce `PRECISION_REQUIRED`. A finite 3/3 moment check and 97/97 sampled cone pass do not imply an interval-Newton certificate. All full-profile flags remain false in the v54 candidate.

## How to cite or extend this evidence

Identify the release, exact source/request/environment hashes, numerical domain, precision, and evidence type. A later execution should receive a new receipt with its actual date and versions. If a theorem is imported, record the exact exported declaration and hypotheses; if it is instantiated, record the instantiation and actual kernel output.

The English wrapper's own tests verify translation coverage and delegation. They do not repeat every historical mathematical verification. The complete source and English manifests make it possible to tell a new presentation-only change from a changed mathematical implementation.
