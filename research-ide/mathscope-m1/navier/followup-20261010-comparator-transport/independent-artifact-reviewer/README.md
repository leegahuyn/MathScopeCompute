# Independent actual Comparator review — source preparation

`review_actual_comparator.py` is prepared for the actual terminal artifact of
run `38014602021`, job `114101981614`, commit
`55dacb898f8c204bf0c5925ea901d75d6c2d0f46`. This directory currently contains
source preparation only. It contains no actual N1-06 result.

The script directly inspects the saved final API response and downloaded archive.
It imports and invokes neither the primary auditor nor any controller/prover.
The original eight input hashes and actual production run binding are literal
pins. The checks include every original tracked-file hash, configuration/kernel,
original dependency and verification-tool pins, an independent-build precondition,
all 35 stages, full literal guard argv, actual UID/capabilities/TTY metadata, the
negative AF_UNIX and Landlock probes with positive write control, real exit zero
and EOF before cleanup, mandatory nanoda then Lean then the final Quot-success
path, both submitted theorem types and allowed axioms, and clean separate Git
status streams. A failed or missing check yields `FAIL_OR_INCOMPLETE`.

Once actual paths and the actual artifact ID have been supplied, use:

```sh
python3 -B review_actual_comparator.py \
  --archive /absolute/path/to/actual-terminal.zip \
  --artifact-id ACTUAL_NUMERIC_ARTIFACT_ID \
  --observation /absolute/path/to/actual-final-api-observation.json \
  --original-inputs /absolute/path/to/followup-20261010-n1-final/comparator-auditor-inputs \
  --production-inputs /absolute/path/to/followup-20261010-comparator-transport/terminal-auditor-inputs \
  --extracted /absolute/path/to/actual-extracted-members \
  --primary-audit /absolute/path/to/actual-primary-audit.json \
  --job-log /absolute/path/to/actual-raw-job.log \
  --output /absolute/path/to/new-independent-comparator-review.json
```

The last three input options are optional independent cross-checks. The output
uses exclusive creation and the required interface:
`status`, `N106Completed`, `archiveSHA256`, `runId`, `jobId`,
`passed`, `total`, and `checks` with a Boolean `pass` for each item.
An actual result can be generated only after actual archive and observation files
exist. No example output, simulated success or current completion claim is supplied.
