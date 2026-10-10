# Original guard transport diagnostic

This directory diagnoses the preflight where original workflow run
`37979127351` stopped producing output. Its artifact contains only the two
`systemd-run` unit/TTY announcement lines in `guard-preflight`; it contains no
original probe JSON and no completed preflight exit. The job was cancelled
near the configured 350-minute job limit before Comparator started; the raw
log does not state the cancellation reason. The experiment here determines
whether supplying an outer controlling PTY changes that observation.

## Invocation

The dedicated diagnostic workflow prepares the same unprivileged UID 1002,
user systemd manager, DBus environment, original probe, and pinned Landrun.
The driver then runs as that user:

```sh
/usr/bin/python3 -B /opt/mathscope-guard-ci/diagnose.py \
  --output /home/mathscopeverify/guard-diagnostic-evidence \
  --landrun /home/mathscopeverify/guard-diagnostic-tools/landrun
```

`--output` must be a new directory. The driver verifies the pinned bytes of
`/opt/mathscope-ci/probe.py` and `pins.json`. It uses the old absolute working
directory as an **empty diagnostic directory**. It installs no Lean or Rust
toolchain, checks out no original proof source, and runs no Comparator.

For both the AF_UNIX creation probe and the Landlock write-denial probe, A
uses the old `Popen` stdout pipe with inherited stdin; B uses an actual outer
PTY for all three standard descriptors and gives the client a controlling
terminal. The command still contains all the original guard options:

```text
systemd-run --user --pty --wait --collect
  --property=RestrictAddressFamilies=~AF_UNIX
  -E PATH=<the original literal path>
  --working-directory=/home/mathscopeverify/audit/original-source
  --unit=<unique diagnostic unit> -- <unchanged original probe payload>
```

The unique `--unit` is the single common addition to both cases, used for
status collection and exact-unit cleanup. A and B use identical payloads and
environment; their command vectors are checked equal after removing the
unique unit name. The Landrun binary and temporary write target have
diagnostic paths, while all original Landrun restriction options remain
unchanged. No `--pty` option is removed and no guard property is relaxed.

A separately labeled metadata case executes `metadata_probe.py` under the
same outer-PTY guard. It records actual UID, effective capabilities,
`NoNewPrivs`, descriptor types, process/session groups, and controlling TTY
state. It then executes the unchanged original probe in that same Python
process and emits a completion marker. This sidecar does not replace either
original A/B probe.

## Failure and evidence rules

Each case observes the command for at most 25 seconds. It records byte logs,
real child exit, EOF, and whether either was observed before cleanup. EOF
(including Linux PTY `EIO`) never means exit zero. A timeout stays a timeout
even if cleanup later causes the child to return zero. No case passes unless
the real client exits zero, EOF arrives before cleanup, capture succeeds,
and the original negative-probe JSON establishes the expected denial.

Status queries have three-second limits. On timeout or exception, the driver
records the named unit, requests its stop and then kills processes in that
same diagnostic unit. The transport sends bounded TERM/KILL only to its own
client. It never cancels another workflow or touches another service unit.
Raw `systemctl show/status` and journal exit codes are retained. With
`--collect`, a successfully completed unit may already be removed; a query
failure alone is not interpreted as a failed or successful probe.

`DIAGNOSTIC_PASS` requires the direct outer-PTY AF probe, actual metadata,
and (when `--landrun` is supplied) the direct outer-PTY Landlock probe to
pass. It can coexist with a recorded PIPE timeout, which is the intended
experimental contrast. A result always records `N106Completed: false` and
`originalComparatorExecuted: false`. A transport result is no substitute
for the real Comparator exit, nanoda, Lean replay, Quot postcheck, source
preservation, or the other original N1-06 conditions.

`result.json`, per-case JSON and raw logs, process/unit observations, source
snapshots, and SHA-256 hashes form the evidence packet. A failed experiment
still produces evidence and the workflow always attempts its upload.

## Local transport tests

```sh
python3 -B -m unittest discover -s tools/ns-guard-ci -p test_transport.py -v
```

These checks exercise both stream capture modes, actual controlling-terminal
behavior, nonzero exits, partial output, timeouts whose cleanup exits zero,
and a process that exits before its output pipe closes. They require Linux
PTYs but do not use systemd or execute any original guard/proof tool. They
therefore establish transport behavior only; the separate Ubuntu diagnostic
supplies the real guard observations.
