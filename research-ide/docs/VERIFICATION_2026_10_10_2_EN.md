# Original build and quantitative follow-up: 2026-10-10, edition 2

The requested remaining **whole original default-build condition is
complete**. The command actually exited 0. The new quantitative outer
candidate and seven conditional Lean cone statements also have new
execution and review records. The protected Comparator and the seven
original construction obligations remain separate.

This assessment concerns the nine remaining conditions listed by the
user. It preserves the original v54 assessment and all original criteria.
One of those nine reported remaining conditions is satisfied; eight are
still open. It does not declare M1 or the complete NS leading profile
finished.

## 1. Actual original default-build completion

The unchanged original `lake build` ended at **2026-10-09 20:59:06 UTC**
(2026-10-10 05:59:06 in Seoul) with actual exit code **0** and the final
line `Build completed successfully (11424 jobs)`.

| Original default target | Source modules | Present `.olean` files | Missing |
|---|---:|---:|---:|
| NavierStokes | 817 | 817 | 0 |
| Euler | 1,840 | 1,840 | 0 |
| ComparatorChallenges | 2 | 2 | 0 |

This was a resumed build using the already completed artifacts and the
same pinned dependencies. The 11,424 count is Lake jobs, not a count of
newly proved theorems. The final module inventory supplements the actual
successful process exit; it does not replace that exit.

An independent completion verifier passed **29/29** checks. It verified
the full log, source and configuration pins, unchanged default targets,
original kernel and entry hashes, original tracked source bytes, frozen
snapshot files, resource guards and interruption history.

- [Actual completion receipt](../mathscope-m1/navier/followup-20261010-default-build-resume-2047/result.json)
- [Complete default-build log](../mathscope-m1/navier/followup-20261010-default-build-resume-2047/default-build.log)
- [Independent completion verification](../mathscope-m1/navier/followup-20261010-default-build-resume-2047/independent-completion-verification.json)
- [N1-05 scope, original criterion and command-by-command evidence](../mathscope-m1/navier/followup-20261010-default-build-resume-2047/README.md)

The original commit is `f9e8bc5b38b6e212696e8a30e3e91517af887bbd`, and
the toolchain is `leanprover/lean4:v4.34.0-rc2`. This execution used the
previously audited entry with an explicit installation path and the
original shared kernel. It is not a claim that the stock launcher's path
autodetection succeeded in this container.

### The cache commands remain distinguishable

| Operation in the preserved local history | Actual result |
|---|---|
| Literal `lake exe cache get`, three recorded environment attempts | Exit 1 in each attempt; complete failures preserved |
| Original `Cache.Main` command body with the explicit pinned `CacheM` context | Exit 0; all 8,747 cache files downloaded and decompressed |
| Complete original default `lake build` in the documented explicit-path environment | Exit 0; all three original default targets completed |
| Protected independent Comparator | No verified successful final receipt at this publication observation |

The [cache evidence link](../mathscope-m1/navier/followup-20261010-default-build-resume-2047/cache-prerequisite-link.json)
binds each actual exit, complete log and recorded environment hash.
The old cache-command failures are not rewritten as successes. The
N1-05 original criterion asks for those records to be preserved; the
remaining condition supplied by the user was successful completion of
the original whole default build, now recorded above.

The default log retains four intended `sorry` warnings from unchanged
original challenge templates. The submitted theorem axiom outputs are
separately recorded. An ordinary successful build does not supply the
protected independent comparison required by N1-06.

The preceding disk-guard termination and the later session loss remain
in separate directories. The unknown exit of the lost session remains
unknown. The successful resume did not lower the disk threshold or permit
OOM kills.

### Independent GitHub execution: commands passed, audit wrapper failed

The separate GitHub default-build job, **113984854490** in run
[37979127351](https://github.com/leegahuyn/MathScopeCompute/actions/runs/37979127351),
also produced actual successful standard commands:

| Command in the stock GitHub installation | Actual exit | Completion UTC |
|---|---:|---|
| `lake exe cache get` | **0** | 2026-10-09 19:19:18 |
| Original default `lake build` | **0** | 2026-10-09 20:58:47 |
| Final `git status --porcelain --untracked-files=no` | **0** | 2026-10-09 20:58:47 |

The build reported 11,424 completed jobs. All **2,669 tracked file hashes**
were identical before and after, and the official kernel matched the pin.
The actual downloaded artifact, its GitHub SHA-256, full command logs and
source inventories were independently checked in **43 checks**.

The **overall job and audit controller still failed**. The controller had
merged Git's stderr warnings into stdout, then treated any nonempty
returned text as a porcelain source-change record. Two warnings about
unreadable runner configuration files therefore caused a false dirty-tree
diagnosis. There is no evidence of a failed original build or exhausted
disk space in this result.

The [preserved GitHub audit](../mathscope-m1/navier/followup-20261010-ci-audit/README.md)
retains the failed job/controller status alongside the successful actual
commands. The follow-up runner correction separates the actual porcelain
stdout, stderr diagnostics and exit code. A dirty tracked file or a
nonzero Git exit still fails the check, and the original before/after
hash and protected-Comparator checks remain required. No old failed job
is relabeled as a successful job.

## 2. New outer mathematics and actual conditional Lean checks

Read [the outer-reselection report](OUTER_RESELECTION_2026_10_10_EN.md)
for the exact new parameter expressions, actual continuous pulse
integral, exact moment-root definitions, finite A.4 domain and missing
source-chain obligations.

| Evidence | Executed checks | Meaning |
|---|---:|---|
| Independent axial producer | 47/47 | Whole-cell derivative bounds and exact supporting scalar inequalities |
| Independent axial review | 16/16 | Separate exact identities, bounds and reviewed source bindings |
| Full outer envelope producer | 106/106 | Exact scalar inequalities supporting the written continuous derivation |
| Independent incoming/pulse review | 45/45 | Separate algebra and error estimates supporting the continuous argument |
| Independent post-pulse review | 21/21 | Supporting rational estimates, conditional where the exact moment roots are required |
| Actual continuous pulse integral | 11/11 | Outward whole-cell integral and exact amplitude endpoint checks |
| Independent pulse diagnostic | 15/15 | Exact endpoint checks plus independent high-precision numerical agreement |
| Rejection controls | 8/8 | Detect omitted contributions, invalid error bounds and false global claims |
| New original-kernel cone statements | 7/7 | Actual Lean compilation and seven complete axiom audits |

These counts describe different scopes; their sum is not a proof count
or a completed-profile score. The continuous arguments are written and
independently reviewed; the scalar programs do not turn those arguments
into kernel-checked analytic theorems.

The seven new Lean statements compiled at **20:59:35 UTC**, with actual
exit code **0**, after the original full build and its independent input
check completed. They use the actual original `RelaxedCone`,
`AdmissibleCone` and `coneBound` definitions. All seven axiom outputs
contain only `propext`, `Classical.choice` and `Quot.sound`. Original
source and kernel hashes were unchanged.

The [preserved first attempt](../mathscope-m1/navier/followup-20261010-outer-reselection/formal-cone/attempts/0001/result.json)
binds the actual checked source and log. The statements provide explicit
thresholds of 9 and `2^24`, together with the exact zero-shear distinction.
Analytic field bounds remain hypotheses. No new infinite-profile premise
bundle has been instantiated by this compilation.

## 3. The original nine remaining conditions

| ID | Current assessment of the reported remaining condition | What remains |
|---|---|---|
| N1-05 | **Requested remaining condition satisfied** | Local whole build and the separate stock GitHub cache/build commands exited 0; the GitHub audit-wrapper failure remains separately recorded |
| N1-06 | PARTIAL — protected run still awaiting verified completion | Actual guarded Comparator result, required nanoda check, submitted axiom audit and unchanged source evidence |
| N3-01 | PARTIAL | Simultaneous parameter hierarchy for one complete new axis, continuation, joining, modulation, heat replacement and final field |
| N3-02 | PARTIAL | Same-datum heat-exterior pressure compensation and all reserved-patch obligations, in addition to the new A.4 outer moments |
| N3-03 | PARTIAL | Same new pressure in the infinite fixed point, finite jet, truncation/roundoff bounds and actual Lean analytic premises |
| N3-04 | PARTIAL | Exact leading identities and Cartesian regularity of that same new infinite core |
| N3-05 | BLOCKED | Same-source incoming moments and rigorous whole-eta inclusion for the five-moment joining map |
| N3-06 | BLOCKED | One finite frequency with a strict cone and uniform restoration on the entire same final field |
| N3-07 | PARTIAL | Support, nonzero stress, flat factorization and endpoint limits of that same final field |

The original protected workflow is
[run 37979127351](https://github.com/leegahuyn/MathScopeCompute/actions/runs/37979127351).
It runs independent Comparator and stock original default-build jobs.
The original default-build job's wrapper failure is documented above.
The Comparator's current web status may change after this dated document. A
green English-packaging or backend job must never be used as its result.

## 4. Reproducing this addition

From the English `research-ide` directory, on a disposable reproduction
copy, run:

```bash
python3 tools/verify_english_release.py
python3 -B mathscope-m1/navier/followup-20261010-outer-reselection/independent-axial/verify_axial_bounds.py
python3 -B mathscope-m1/navier/followup-20261010-outer-reselection/check_outer_envelopes.py
python3 -B mathscope-m1/navier/followup-20261010-outer-reselection/independent-review-axial/review_checks.py
python3 -B mathscope-m1/navier/followup-20261010-outer-reselection/independent-review-pulse/review_checks.py
python3 -B mathscope-m1/navier/followup-20261010-outer-reselection/independent-postpulse/check_bounds.py
python3 -B mathscope-m1/navier/followup-20261010-outer-reselection/certify_main_pulse_integral.py
python3 -B mathscope-m1/navier/followup-20261010-outer-reselection/verify_pulse_integral_independent.py
python3 -B -m unittest discover -s mathscope-m1/navier/followup-20261010-outer-reselection -p test_outer_envelopes.py -v
```

The independent numerical diagnostic uses the reference `mpmath`
dependency. The separate original-kernel checks require the installed
pinned upstream Lean environment. The source/evidence ZIP does not
include a multi-gigabyte runtime or claim a new live browser deployment.
