# Actual axial cutoff support ledger

The original radial, axial and time cutoffs are `chi(2*(x^2+y^2))`,
`chi(2*(z/z0)^2)` and `chi(tau/tau0)`. The original radial scale is one.
The checker pins the actual recursive selector records, whole-K chart,
cutoff evaluator and the earlier fourth-stage support receipt. It checks the
linear-seed cutoff's first three derivatives using outward rational intervals.

On the axial transition shell, the common geometry gives `Q > 95/128`,
`Q < 47/31` and `eta^2 > 31/188`. It uses the original
`Q = rho + zeta^2 Q^(2h)` and the bounds `1-2h <= Q^(2h) <= 32/31`.
The stage-three selector gives `Q < 8/5`, which is already implied by
the whole-K chart.
Stage four has no axial-cutoff commutator by the separately checked support
result. The full outer-cutoff axial shell has spacetime measure strictly below
`(33/98)*z0*tau0`; therefore a **known** absolute density bound `B` on this
shell gives an integral bound `(33/98)*z0*tau0*B`. No such physical field
bound is constructed here. In particular, the needed source potentials and
their cutoff derivatives remain open, as do final jets and energy closure.

The receipt also gives an abstract selector-maxima instance in which the
third selected cutoff is active in the axial shell. It is a countermodel to
deriving a stronger zero from selector growth and K geometry alone, not a
counterexample for the actual source family or its parameter values.

## Portable replay

Extract `MathScope_Goal_Continuation17_20261111.zip` into a directory and
preserve its paths. That prior package contains every input below, including
the source files read transitively by `outer_cutoff.py`. Run from the
extraction root, with this new checker separately available at `$checker`:

```sh
python "$checker" \
  --family inputs/final-functionals/ACTUAL_RECURSIVE_SOURCE_FUNCTIONALS.json \
  --chart tools/mathscope-cd-axial-bridge-20261029/goal-20261111/m3/whole-k-chart.json \
  --cutoff tools/mathscope-cd-axial-bridge-20261029/goal-next/final67/first-scale-selector.json \
  --tail tools/mathscope-cd-axial-bridge-20261029/goal-next/final67/cut-correction-tail.json \
  --outer inputs/localization-source/research-ide/mathscope-m3/recovery-20261019/outer_cutoff.py \
  --out active-support.json
```

Python standard library only; the run prints `PASS` and the receipt hash.
The outer module resolves its companion source tree relative to its own path,
so it must stay in the package's original `inputs/localization-source` tree.
The checker and its new receipt are not contained in the earlier package.
