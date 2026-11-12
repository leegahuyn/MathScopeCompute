# Isolated R1-08 export and file re-import

The replay uses the immutable private candidate at
`inputs/m4-r108-isolated-candidate/candidate.html`.
The `su2` and `point` examples export JSON, select it through the browser file
input, and start a new Worker job. Both executions reproduce the input and
result hashes. A malformed point file preserves the prior valid result.
An unapplied edit is preserved. Importing an old result after changing
the point input produces STALE and preserves the new prime.

The test runs locally with external page requests blocked. It exercises the
browser file input API. Native operating-system file chooser interaction
and the published operational candidate remain OPEN.

    node replay.cjs CANDIDATE_HTML PLAYWRIGHT_MODULE CHROME OUT_JSON
