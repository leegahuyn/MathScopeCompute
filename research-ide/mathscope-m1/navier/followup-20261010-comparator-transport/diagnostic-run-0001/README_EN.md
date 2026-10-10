# Actual outer-PTY diagnostic: preserved evidence

**The diagnostic succeeded; N1-06 remains incomplete.** Actual diagnostic run
`38013278865`, job `114097893399`, completed successfully at source commit
`d0543504ab3d923490f2e3cf94c968f3739558d8`. The final API observation was received
at **2026-10-10 10:32:34.295 KST** (raw UTC `2026-10-10T01:32:34.295Z`). The
[observation](raw/remote-diagnostic-0001/observation-004.json) and
[producer result](raw/remote-diagnostic-0001/extracted/result.json) are unchanged.

## Actual finding and limits

The comparison preserved the original
`systemd-run --user --pty --wait --collect --property=RestrictAddressFamilies=~AF_UNIX`
and original negative probes. It varied the outer transport between PIPE and a
real outer PTY.

| Actual case | Client timeout | Client exit before cleanup | Actual probe evidence |
| --- | --- | --- | --- |
| `af-pipe` | At 25.0174 s | None | No probe JSON |
| `af-outer-pty` | None; about 0.0544 s | 0 | AF_UNIX creation blocked, errno 97, uid 1002 |
| `landlock-pipe` | At 25.0177 s | None | No probe JSON |
| `landlock-outer-pty` | None; about 0.0531 s | 0 | Outside-path write blocked, errno 13, uid 1002 |

A metadata case also completed, recording TTY descriptors 0/1/2, uid/euid 1002,
zero effective capabilities, `NoNewPrivileges=1`, and the original probe hash.
For both PIPE cases the guarded service was already `inactive/dead` with
`ExecMainStatus=0` before cleanup, while the client had not completed or delivered
probe JSON. **This reproduction establishes a client transport/completion stall
resolved by an outer PTY.** It does not establish that the historical cancelled
run had identical internal unit state or identify a particular internal systemd
function as the cause.

The [primary audit](raw/remote-diagnostic-0001/actual-diagnostic-audit.json) has
**136/136 `DIAGNOSTIC_EVIDENCE_PASS`**. The
[separate independent review](raw/independent-remote-review/reviewer-receipt-0001.json)
has **135/135 PASS**. **Both explicitly retain `N106Completed=false`.** No original
Comparator solution acceptance, nanoda solution acceptance, or Lean solution
acceptance was performed by this diagnostic. A later actual protected run and
artifact must supply that evidence.

## Complete preservation

| Path | Preserved contents |
| --- | --- |
| `raw/remote-diagnostic-0001/` | All 37 original files: ZIP and 25 extracted files, four observations, both job logs, API response, download/newline receipts, primary audit and verifier |
| `raw/independent-remote-review/` | Original independent review and verifier, two files |
| `raw/reviewer-source-inputs/` | Five exact source snapshots referenced through absolute repo paths by the independent review: probe, pins, diagnose, transport and metadata probe |

There are **44 raw files / 435,692 bytes**, with no omissions. The
[source mapping](source-mapping.json) records original absolute paths, destination
paths, sizes and hashes, resolving all 38 independent-review input references.
The primary auditor uses relative packet paths. The independent reviewer's
original absolute repo path is retained; the added snapshots preserve the exact
source bytes it referenced.

The canonical [raw job log](raw/remote-diagnostic-0001/job-114097893399.raw.log)
has **28,233 bytes**, exactly matching the API content. The original display-copy
`.log` has **28,234 bytes**, adding precisely one final newline. Both files and
the [byte-difference receipt](raw/remote-diagnostic-0001/job-log-byte-receipt.json)
remain unchanged.

The [preservation audit](preservation-receipt.json) records **222/222
`PRESERVATION_PASS`** from one archive/copy/log/receipt-binding check. It did not
rerun either 136/135 diagnostic audit. All 67 files in the older failed-run
packet remain unchanged. Preservation counts are not added to acceptance-check
or mathematical-theorem counts.

| Evidence | SHA-256 |
| --- | --- |
| Original ZIP, 44,015 bytes | `b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba` |
| Primary 136/136 audit | `ee855668fcd77dbe4d2304454a743f8cb3732872437729eafbf8779a6b60f0f7` |
| Independent 135/135 review | `fafd7b37117fdf81fda6bdf6e9ce4b7328ea50bd998306775ccba4fd8c058cad` |
| Preservation 222/222 audit | `ede01828c9bb040e49268b72869f5bbdb1b34eef4add21d27426db2d2579debe` |

The original-criteria assessment remains **69 PASS / 1 PARTIAL / 0 BLOCKED**,
with overall completion `false`. This preservation task did not modify original
criteria, historical assessments or PDFs, run a new protected Comparator, create
a PDF, or publish files. If needed, `python -B verify_preserved_diagnostic.py`
rechecks only the preserved bytes from this directory.
