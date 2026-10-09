# N1-05: original default build completed

The requested remaining whole-default-build condition is now satisfied.
The unchanged original `lake build` command exited **0** at
**2026-10-09T20:59:06.787843+00:00**, with the final line:

> Build completed successfully (11424 jobs).

The execution used the pinned official Lean **4.34.0-rc2** shared kernel through
the previously documented entry with an explicit installation path. It did not
change the original proof sources, manifest, kernel bytes, default targets or
resource guards. It does not claim that the stock launcher worked in this
container.

## Command-by-command evidence

| Operation | Actual exit | Complete evidence | Meaning |
|---|---:|---|---|
| Original `lake exe cache get`, initial environment | 1 | `../official-validation/official-command-results.json`, `lake-cache-get.log` | Preserved original launcher/environment failure |
| `lake exe cache get`, explicit sysroot environment | 1 | `../official-validation/official-explicit-command-results.json`, `lake-cache-get-explicit.log` | Preserved failure |
| `lake exe cache get`, explicit-path wrapper environment | 1 | `../official-validation/official-wrapper-command-results.json`, `lake-cache-get-wrapper.log` | Cache executable built, then application-location detection failed |
| Original Cache.Main command body in an explicit pinned CacheM context | **0** | `../official-validation/cache-context-result.json`, `cache-context-explicit.log` | **8,747/8,747 downloaded and decompressed**; adapter changes only context/environment detection |
| Complete original `lake build` | **0** | `result.json`, `default-build.log` | All three unchanged default targets completed |

The three historical cache logs in this table are under
`../official-validation/`. `cache-prerequisite-link.json` records their exact
receipt locations, exit codes, full-log hashes, and hashes of their recorded
environment mappings. It also distinguishes the successful explicit CacheM
context run from the failed literal command invocations. No download was
repeated for this follow-up and no failed exit was relabeled as success.

The original N1-05 acceptance text requires preservation of both commands'
exit codes, complete logs and environment hashes. The user's remaining
condition was successful termination of the entire original default build.
`N1-05-completion-summary.json` connects both requirements to the preserved
evidence without altering the original acceptance file.

## Scope of the completed build

The original repository commit remains
`f9e8bc5b38b6e212696e8a30e3e91517af887bbd`.

| Original default target | Source modules | Present olean artifacts | Missing |
|---|---:|---:|---:|
| NavierStokes | 817 | 817 | 0 |
| Euler | 1,840 | 1,840 | 0 |
| ComparatorChallenges | 2 | 2 | 0 |

The final resume lasted 655.534 seconds. Its process exited
normally; no disk, OOM or explicit-stop guard ended this successful run.

`verify-completion.py` independently passed **29/29** checks after
that actual exit. These cover the actual log hash, all recorded frozen-input
hashes, original manifest/toolchain, clean tracked repository, exact default
command and targets, official shared-kernel and entry hashes, unchanged guards,
all target artifacts, and preservation of both earlier interrupted attempts.

The original challenge templates emit **four `sorry` warnings** in the default
build. They have been preserved. The log separately prints the standard
`propext`, `Classical.choice` and `Quot.sound` dependencies of the named submitted
Navier–Stokes and Euler theorems. Successful compilation is **not** a completed
independent Comparator check; that original N1-06 requirement remains separate.
The build also does not certify MathScope's numerical leading-profile candidate
or repair its rejected outer-cone parameter choice.

## Preserved interruption and resource history

The first preceding run stopped at the unchanged 768 MiB disk guard and
recorded exit -15 in `../followup-20261010-default-build/result.json`.
The subsequent `resume-2016` run completed more modules, but its managed session
later disappeared without a final process receipt. Its last heartbeat was
20:37:37 UTC. The session probe returned `Unknown process id`, and direct
process inspection found no active Lean or Lake compiler. Its actual exit code
and signal are recorded as **unknown**, not invented.

This successful `resume-2047` run started only after that absence was confirmed.
`previous-interruption-observation.json` preserves the earlier current-stage,
resource-progress and full-log hashes. Both preceding runs remain intact.

The cleanup audit in
`../followup-20261010-default-build-resume-2016/cache-cleanup.json` records removal
of inactive previous installations, downloaded archives and reusable caches.
It reclaimed 3,592,273,920 bytes while preserving the active rc2 kernel, original
source, and existing official `.lake` products. The minimum free-disk guard
remained **805,306,368 bytes**, and an increase in OOM kills still required a stop.

## Principal hashes

| Evidence | SHA-256 |
|---|---|
| Actual result | `96820a64bdb5a722901c7e8172e638a03b22854940dbbd0e038745fcc6672268` |
| Complete default-build log | `cd90dc7cf0499cb6ed94415c01ab991d1ee439b42172ea43ab16d894977a8e23` |
| Default-build recorded environment | `325028d4c5f253cc800238f66914766be1b9c184317dda54b575c36ce902c802` |
| Successful pinned-context cache log | `6e01f287ffad23379ad402dd872baeb7f38032d059e90fe4795a6553359273f1` |
| Successful pinned-context cache environment | `4aed8a5dd3d656c855cf6bb7bf3148b36eb6bb6dcc28b2854ccac2e9b2b5624a` |

Environment hashes use UTF-8 JSON with sorted keys and compact separators, as
specified in the cache link. The complete original environment mappings remain
in their execution receipts. `manifest.json` hashes every file in this final
follow-up directory.
