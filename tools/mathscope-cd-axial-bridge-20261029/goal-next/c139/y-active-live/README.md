# Actual live Repeat Y-range replay on defined original frames

The archived original GitHub C132 run 44682703381 supplies the 22,380,596
source records, the extended owner registry `[2269,29,2,60,0]` and
the 1,444 actual roots. The replay verifies the complete uncompressed stream
and metadata hashes, interprets typed native definition edges using the exact
readers included alongside the scanner, and compares each literal natural
call's six typed fields against the pinned N3 raw-base receipt.

The 1,444 roots reach 379,603 records. The three predecessor conservative
residuals reach 337,054. Both closures contain the same 567 literal natural
calls with 61 distinct Y operands. The complete stream contains 3,268
literal calls, which is an inventory. In the rooted live closure there are
5,318 coupled-expression applications and 360 Forced pulse applications.
The full reach uses both alternatives of each branch as a structural
overapproximation. During range analysis, branch bounds are carried only
in their corresponding original branches.

The original Y obligation rules are replayed from zero prior passes on these
actual live roots with the full original native registry. The method uses
both original endpoints of an integration bound, the original positive
loop-left guard, and the positive bracket at the **defined** original root
#17732766. The pinned source profile supplies the same upper envelope
`4 exp(2 t1) < 256/63 < 5` as the raw-base audits. The executable replay
has 1,694 formal-to-actual transfers (1,682 expression and 12 monotone-root),
567 conditional literal passes, zero
open calls and zero unsupported frame transports. Removing the positive
bracket leaves four open calls #4758, #4784, #5177 and #5299. Removing the
loop-left positivity premise leaves 158 open calls. These controls verify
that the assumptions are used.

**Scope.** The result is for the fixed active N3 Repeat export and defined
original native branches. The positivity premise is about a root already
defined in the registered bracket. The work does not infer that every
physical point admits the reference or representative root. It does not
build new derivatives, evaluate infinite Picard/Fourier/Volterra limits,
assert any other N, or change acceptance totals.

Run from this packet with the original C132 artifact root DIR, current
evidence root GOAL and pinned original runtime profile PROFILE:

```text
node collect_y_active.mjs DIR . GOAL/y-higher-flow/n3.json active-y-reach.json expanded.json
python -B transport_live_y.py GOAL/y-higher-flow/range_flow_n3.py expanded.json DIR/active-n3-repeat-forced-source/original-source-functions.json PROFILE transport-live.json
python -B transport_live_y.py GOAL/y-higher-flow/range_flow_n3.py expanded.json DIR/active-n3-repeat-forced-source/original-source-functions.json PROFILE transport-no-bracket.json --no-bracket
python -B transport_live_y.py GOAL/y-higher-flow/range_flow_n3.py expanded.json DIR/active-n3-repeat-forced-source/original-source-functions.json PROFILE transport-no-loop.json --drop-loop
python -B verify_y_active_packet.py . result.json
```

The reproducible 22,046,091-byte expanded transport input is kept outside the
packet. Its expected byte hash is
`797b0331d34b8e1011c7e5c0e993e3cd2e0fdc864b410085c69c126e14b971b7`.
PROFILE is the original pinned `mathscope-m2/navier/source-profile-data.mjs`.
The nominal Python replay was run twice, with identical bytes. The scoped
positive report uses original AST operands only. No Lean compilation or
production changes were used. RELEASE HOLD.
