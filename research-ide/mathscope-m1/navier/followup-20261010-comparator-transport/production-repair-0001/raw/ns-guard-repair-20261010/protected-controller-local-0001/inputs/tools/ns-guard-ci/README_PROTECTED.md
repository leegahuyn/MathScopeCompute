# Protected Comparator with the validated outer PTY

`run_protected.py` copies the source-status-corrected original controller and
adapts its guarded command transport. The copied controller's SHA-256 is
`47b0126a22ada5c2254377a458daac076948526f5e8eaa13b5c4e47f933bc220`.
The original files in `tools/ns-original-ci/` remain unchanged. The diagnostic
files in this directory also remain unchanged.

The change follows actual diagnostic run `38013278865`, artifact
`11655127117`, ZIP SHA-256
`b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba`.
With the original probe and guard options, both PIPE clients failed to deliver
probe output or finish within 25 seconds. Their service units had already
exited successfully before cleanup. An outer controlling PTY delivered each
original AF_UNIX/Landlock denial and the client's real exit zero in about
0.05 seconds. The raw metadata established UID/EUID 1002, empty effective
capabilities, `NoNewPrivs=1`, and three terminal descriptors. This establishes
the narrow transport repair; it does not supply a Comparator result.

## Installation and execution

The dedicated workflow installs these files:

| File | Runtime path |
|---|---|
| New controller | `/opt/mathscope-ci/run_protected.py` |
| Separate long-command transport | `/opt/mathscope-ci/protected_transport.py` |
| Original unchanged pins | `/opt/mathscope-ci/pins.json` |
| Original unchanged negative probe | `/opt/mathscope-ci/probe.py` |
| Frozen diagnostic metadata sidecar | `/opt/mathscope-guard-ci/metadata_probe.py` |

The original UID 1002, user systemd manager and DBus environment are prepared
before running:

```sh
/usr/bin/python3 -B /opt/mathscope-ci/run_protected.py \
  --mode comparator --work /home/mathscopeverify/audit
```

The workflow runs Comparator only. It provides the same pinned Go and Rust
toolchains and the same original controller PATH. Preparation of the Lean
archive, dependency checkouts, trusted verification tools, source/configuration
hashes and the empty original-project `.olean` precondition is copied from the
original controller. The original required nanoda, submitted Lean replay,
Quot postcheck and final Comparator completion remain inside the unmodified
pinned Comparator. The type/axiom audit, final source/kernel comparison and
separate Git stdout/stderr check remain after that command.

## Guard command and new evidence

The original `systemd-run --user --pty --wait --collect` arguments,
`RestrictAddressFamilies=~AF_UNIX`, environment, working directory and guarded
payload are retained. Each invocation adds one unique `--unit` option so the
runner can collect its status and clean up only its own unit. The transport
requires that exact original prefix before it can launch a client.

`protected_transport.py` is a separate copy of the validated diagnostic
transport. It adds an explicit maximum of 330 minutes and streams every raw
captured byte to the CI log while preserving the same bytes in the stage log.
It keeps the parent-side slave descriptor closed, treats PTY `EIO` as EOF,
and records EOF separately from process exit. The diagnostic transport's
30-second cap is unchanged in its original file.

AF_UNIX, metadata and Landlock preflights each have a 25-second observation
limit. The protected Comparator has a 330-minute limit. The workflow's job
limit is 350 minutes. Unit status queries are bounded to three seconds. On
timeout, exception or an interrupted guarded stage, the runner stops/kills
only its generated service unit and bounds the client TERM/KILL waits. Raw
query failures remain evidence: `--collect` can remove a completed unit before
a later query.

The metadata sidecar is verified against its diagnostic SHA and runs the
unchanged original probe inside the actual guarded process. An unrestricted
write/byte check at the original forbidden-write path precedes Landlock;
the control is removed, and the actual original probe must then be denied.

## Result contract

The result retains `MathScope.ProtectedOriginalCI/1`, the original stage labels,
the actual command, `exitCode`, timestamps and `logSHA256`. A guarded stage adds
`transportRecord`, which contains its full raw transport, process, unit-query
and cleanup observations. The stage `exitCode` is always
`transportRecord.exitCodeBeforeCleanup`; it never substitutes a cleanup exit.

The transport can pass only when all of these hold:

- The observation did not time out and the capture had no error.
- The actual client returned zero and EOF was observed before cleanup.
- The final client status is still zero, with no incomplete cleanup or
  transport exception.
- The byte count streamed to CI equals the byte count stored in the raw log.

Any failure marks the actual guard stage failed and ends the controller as
failed. A timeout followed by exit zero remains a failure. Preflight success
allows the original Comparator to start; it never establishes N1-06 by itself.
Acceptance still requires the final original Comparator exit, original kernel
checks and all original source/dependency/guard/type/axiom receipts.

Additional result evidence appears under `transportOnlyAdaptation`,
`parentEffectiveCapabilities`, `guardProcessMetadata`, `landlockWriteControl`
and `landlockForbiddenWriteAbsent`. The original security arguments are
unchanged; the added unit name and different transport are disclosed there.

## Local verification

```sh
python3 -B -m unittest discover -s tools/ns-guard-ci -p test_protected_transport.py -v
```

The tests replay the existing real-PTY transport edge cases against this new
module, check exact binary CI streaming, and verify the explicit long budget
with a command that finishes immediately. Simulated systemd-client tests check
timeout/exception failure, signal-handler restoration and exact-unit cleanup
without touching a real service. These tests do not claim guard or theorem
validation; the actual diagnostic and subsequent full workflow supply those
separate observations.
