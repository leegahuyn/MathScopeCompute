# Independent review of the guard diagnosis and protected execution repair

The actual remote diagnosis and the frozen production candidate passed this
independent review. This review does **not** establish completion of the original
Comparator or N1-06.

## Actual remote observations

Run `38013278865`, job `114097893399`, artifact `11655127117` produced the
44,015-byte ZIP with SHA-256
`b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba`.
The separate independent remote receipt records **135/135** checks, including
the ZIP member bytes, executed source hashes, original guard arguments,
canonical raw job log, probe output and actual process/unit observations.

| Observation | PIPE | Outer controlling PTY |
|---|---|---|
| Original AF_UNIX probe | 25-second timeout; no probe JSON | Actual denial, errno 97, UID 1002; exit 0 and EOF before cleanup; about 0.054 seconds |
| Original Landlock probe | 25-second timeout; no probe JSON | Actual denial, errno 13, UID 1002; exit 0 and EOF before cleanup; about 0.053 seconds |
| Client exit after PIPE cleanup | 0, still classified as failure | No cleanup needed |

Before PIPE cleanup, successful raw `systemctl show` queries recorded both
service units as `inactive/dead`, `Result=success`, `ExecMainCode=1` and
`ExecMainStatus=0`. The clients were still pending. The distinct metadata
case recorded actual UID/EUID 1002, zero effective capabilities,
`NoNewPrivs=1` and three terminal descriptors while executing the unchanged
original negative probe.

These observations identify a client transport/completion stall in the
controlled reproduction and support the outer-PTY execution repair. They do
not prove an exact internal systemd defect or retrospectively establish the
internal service state of the older cancelled run.

Remote independent receipt:
`../independent-remote-review/reviewer-receipt-0001.json`, SHA-256
`fafd7b37117fdf81fda6bdf6e9ce4b7328ea50bd998306775ccba4fd8c058cad`.

## Frozen production candidate

The production review records **73/73** checks. It binds the actual 12-test
execution logs and all ten source snapshots from
`../protected-controller-local-0001/`; the tests were not rerun by this
reviewer. All twelve logged methods match the inherited/overridden test
source. Simulated-client cleanup tests remain explicitly separate from
actual remote guard observations.

The original controller's preparation from identity through the guard argv
is a literal copy. The final type/axiom/source/kernel/Git acceptance tail is
also a literal copy. Twenty-four function/command AST comparisons agree.
The original AF_UNIX restriction, `--pty --wait --collect`, Landlock payload,
source/configuration/kernel pins, fresh original-project `.olean` condition
and required nanoda are preserved. A unique owned unit name and transport
observations are disclosed. Timeout, nonzero exit, missing EOF, capture or
stream failure cannot become success merely because cleanup returns zero.

The new workflow retains the unprivileged UID 1002 and original user-systemd
environment, uses read-only repository permissions, keeps cancellation
disabled for its separate queue, gives the protected body 330 minutes inside
a 350-minute job and attempts evidence collection/upload on failure as well
as success. A truncated or cancelled run remains incomplete.

| Frozen file | SHA-256 |
|---|---|
| `run_protected.py` | `ae500aaa9e3915bb1d988f527025f5a557c17a56b65cd326b78862286c666a11` |
| `protected_transport.py` | `2a247e2f60e2952ea57a1348ded5c0bd3c72d7379af52e6c0ca8d7f41d28e993` |
| `test_protected_transport.py` | `fe76cdde16f76b2b5fa193c5baed75248425641b6704971d54c39ff92230461a` |
| `README_PROTECTED.md` | `3d416e7cb2dbc201e997a05acb69b1a9b5f65966c4e4be10e98cc3e8746f8992` |
| `ns-comparator-verification.yml` | `7e3145aa9309ddcbb37564fb67e4f624e03e45fefeb06a4b122965f41ece7163` |

Production independent receipt: `reviewer-receipt-0001.json`, SHA-256
`45c8d99c79010e4c36ea6ffb62980cb8c8571517edf26d28b25c8d0467e044ef`.
The read-only source/log review script is `review_production.py`.

No remaining source-review blocker was found. N1-06 still requires the actual
full protected Comparator result and its original final verification evidence.
This reviewer changed no mathematical evidence, original source/kernel,
workflow, diagnostic or production implementation and performed no remote
dispatch, cancellation or restart.
