# Original N4 Picard order-3 and order-4 mixed argument replays

**VERIFIED.** The original N4 export has 112 positive-radial even-profile
sites. This replay binds two more of those sites to the unchanged actual
materializer, then analyzes each full ordinary operand graph with the
exact Python obligation transfer used at original #121999. Both new
sites request component 1 with radial derivative order 2 and eta
derivative order 1. Original #125199 is system 5 (order 3), with
`X=#123337=#4756*#123336`. Original #128717 is system 7 (order 4), with
`X=#126687=#4756*#126686`. Both retain actual eta #2. The separately
pinned source ingress locates both arguments under the original
cutoff and their own unit-interval averaging binders.

| Source caller | Ordinary nodes | Fresh natural arguments | Reused original natural arguments | Lower even-profile inputs | Own-system Picard inputs |
| --- | ---: | ---: | ---: | ---: | ---: |
| #125199 | 66,338 | 652 | 170 | 1,227 | 353 |
| #128717 | 74,900 | 652 | 170 | 1,644 | 353 |
| #121999, prior graph rechecked for reused arguments | 82,848 | 1,221 | 170 | 595 | 353 |

The checker enumerates the actual natural-series, even-profile and Picard
operators in each reached ordinary graph. It certifies every listed
argument, including the inherited original operands under their new
enclosing binders. The order-3 lower even-profile inputs go to system 3
(595) and system 0 (632). The order-4 inputs go to systems 5 (595), 3
(632) and 0 (417). The 353 same-system Picard inputs in each replay
include its value and eta-jet operations. The original registry fixes
the admitted radius of all these systems to `[0,a]`.

**CONDITIONAL.** Assume the original caller has
`0 <= X <= Xcut = Xa*exp(t1/32)`, `abs(eta) <= 1`,
`Xa > 0`, `Lambda*Xa = 4`, `0 < t1 < 1/128`, and original real
lazy-branch and capture-free binder semantics. The exact transfer proves
`0 <= Y <= 4*exp(2*t1) < 256/63 < 5` for every listed natural argument.
The lower even-profile inputs have `X' in [0,Xcut]` and the same-system
Picard inputs have `xi' in [0,sqrt(Xcut)]`. Both fit the associated
radius since `a^2 = Xa*exp(t1/16)`. Every verified operand uses the
unchanged eta formal, including the closed eta endpoints. These are input
domain statements. No native value evaluator or floating-point sample
participates.

The following controls report argument obligations that become open when
one proof fact is withheld. Each cell is the number of open natural
arguments followed by the number of open explicit native frames.

| Source caller | Withhold binders | Withhold log guards | Withhold caller radial frame |
| --- | ---: | ---: | ---: |
| #125199 | 791 / 1,580 | 308 / 0 | 725 / 1,580 |
| #128717 | 791 / 1,997 | 308 / 0 | 725 / 1,997 |
| #121999 | 1,355 / 948 | 648 / 0 | 1,280 / 948 |

**OPEN.** With the 38 bootstrap sites previously checked, 41 of the
112 stored positive-radial N4 sites have exact checks for all fresh
natural arguments in their first ordinary expansion. The complete
reused-operand check here applies to the three higher sites above.
The other 71 sites, typed-definition descent even at these three sites,
native infinite limits, derivative values and arbitrary source orders
remain open. The overall Y and final-jet gates receive no promotion.

The source replay hashes the complete original 7,358,162-node stream,
extracts each original caller from the pinned projection and preserves
the source slots and derivative orders. The Python pass pins the two
new compressed exports and the prior #121999 export. Use Node.js 24 and
Python 3 from the workspace root.

```powershell
$audit = 'work/goal-next/continuation74/y-next'
$graph = 'work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph'
$source = 'work/goal-20261111/axial-replay/source/research-ide/mathscope-m2/navier'
$flow = 'work/MathScopeCompute-Continuation22/tools/mathscope-cd-axial-bridge-20261029/goal-next/y-higher-flow'
$ingress = "$flow/y-picard-callers/top-calls.json"
foreach ($site in 125199,128717) {
    node --max-old-space-size=4096 "$audit/replay_higher_site.mjs" $graph 'work/goal-next/y-n4/reached.json' $source $flow "$audit/$site-graph.json.gz" $site
}
foreach ($site in 121999,125199,128717) {
    $inputGraph = if ($site -eq 121999) { 'work/goal-next/continuation71/y-domain-b22/moving-graph.json.gz' } else { "$audit/$site-graph.json.gz" }
    python -B "$audit/verify_higher_sites.py" $inputGraph "$audit/$site-range.json" $ingress --include-native-ingress
    python -B "$audit/verify_higher_sites.py" $inputGraph "$audit/$site-no-binders.json" $ingress --include-native-ingress --drop-binders
    python -B "$audit/verify_higher_sites.py" $inputGraph "$audit/$site-no-guards.json" $ingress --include-native-ingress --drop-guards
    python -B "$audit/verify_higher_sites.py" $inputGraph "$audit/$site-no-radial-frame.json" $ingress --include-native-ingress --drop-radial-frame
}
```
