# N4 positive-radial first-expansion argument coverage

**VERIFIED.** The original N4 current/pressure/selector projection
contains 112 stored positive-radial even-profile applications. This
replay excludes the 41 caller IDs already certified by the authoritative
bootstrap receipt and the three higher-site readbacks. It materializes
and checks the exact 71-site complement, with no overlaps and no missing
IDs. All 71 pass. The finite subgate for fresh natural arguments in the
first ordinary expansions is therefore **112/112**.

| Original system | New source sites | Ordinary nodes | Fresh natural arguments | Reused natural arguments | Explicit native frames |
| --- | ---: | ---: | ---: | ---: | ---: |
| 3, order 2 | 30 | 580,998 | 8,162 | 4,343 | 6,477 |
| 5, order 3 | 26 | 442,902 | 4,224 | 3,401 | 10,512 |
| 7, order 4 | 15 | 295,112 | 2,614 | 1,907 | 8,136 |
| Total | 71 | 1,319,012 | 15,000 | 9,651 | 25,125 |

Counts are summed across distinct actual caller environments. Replay-local
node IDs can recur in different expansion files. Within each expansion,
the verifier checks one reached node ID through every ordinary operand
path to that node. All 19 top and 52 lower-system coefficient caller
environments match the exact original pinned guard and binder receipts.
The lower-system cases use the original owner's `xi^2` or
`unitBinder*xi^2`, and the top cases use the original X or
`X*unitBinder`. The saved component, radial order and eta order are
carried through unchanged. Each checked natural, lower even-profile
and same-system Picard call preserves the source eta formal #2.

**CONDITIONAL.** In the admitted real source frames,
`0 <= X <= Xcut = Xa*exp(t1/32)`, `abs(eta) <= 1`, `Xa > 0`,
`Lambda*Xa = 4` and `0 < t1 < 1/128`. Using the original lazy-branch
and capture-free integral semantics, the exact Python transfer proves
`0 <= Y <= 4*exp(2*t1) < 256/63 < 5`. The lower even-profile and
same-system Picard arguments lie in `[0,Xcut]` for squared radius
and `[0,sqrt(Xcut)]` for radius, respectively. Both enter the original
radius domain since `a^2=Xa*exp(t1/16)>Xcut`. Upper and lower
inequalities include their closed endpoints. The checker determines
log-domain positivity from actual selected branches and moves interval
facts through both real integral endpoints, regardless of orientation.
It uses integers and exact rationals, without evaluating native values.

Source-sensitivity controls independently withhold a proof fact from
one top and one lower-system caller per new system. The six exact IDs
are #125249, #123123, #128769, #129547, #128683 and #130065.

| Withheld fact | Open natural arguments on six callers | Open explicit native frames |
| --- | ---: | ---: |
| Integration binder transfer | 3,840 | 5,798 |
| Branch log guards | 1,661 | 0 |
| Original radial frame | 3,438 | 5,798 |

**OPEN.** The 112/112 count refers to fresh natural arguments in the first
ordinary expansion of the stored N4 positive-radial sites. This replay
also checks reused operands and explicit native frames at the new 71
higher sites. The earlier 38 bootstrap receipts cover their fresh
natural arguments. Descent into typed native bodies, arbitrary source
orders, convergence and native derivative agreement remain separate.
The whole Y, M3 and final-jet gates receive no promotion from this
finite argument result.

The archive contains the source materializer, the per-site symbolic
verifier, three independently initialized manifests, all 71 ordinary
expansions, all positive and representative control receipts, and the
verified rollup. The materializer authenticates the complete original
7,358,162-node stream as well as the original reached projection and
registry. To reproduce from the workspace root with Node.js 24 and
Python 3, use the original archive and authoritative source receipts.

```powershell
$audit = 'work/goal-next/continuation80/y-next'
$archive = 'work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph'
$source = 'work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier'
$flow = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/y-higher-flow'
$controlled = @{ 3 = @(125249,123123); 5 = @(128769,129547); 7 = @(128683,130065) }
New-Item -ItemType Directory -Path "$audit/graphs" -Force | Out-Null
foreach ($system in 3,5,7) {
    node --max-old-space-size=3000 "$audit/materialize_remaining_sites.mjs" $archive 'work/goal-next/y-n4/reached.json' $source $flow "$audit/graphs" $system
    python -B "$audit/verify_batch.py" "$audit/graphs" "$audit/checks" $flow $system --workers 2
    $a, $b = $controlled[$system]
    foreach ($control in 'binders','guards','radial-frame') {
        python -B "$audit/verify_batch.py" "$audit/graphs" "$audit/checks" $flow $system --workers 2 --caller $a --caller $b --control $control
    }
}
python -B "$audit/verify_rollup.py" $audit
```
