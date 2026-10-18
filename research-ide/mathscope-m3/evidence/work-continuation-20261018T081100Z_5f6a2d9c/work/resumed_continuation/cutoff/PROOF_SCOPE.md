# Frozen cutoff continuation and energy connection

This continuation makes one new exact application to the unchanged family
SHA256 `b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78`.
It also adds conditional interval arithmetic and an integration consumer.
It does not complete N7-06 or N8-05. The actual global last-resolved tau remains
null, and no actual selector or field value has been numerically evaluated.

## 1. An exact finite correction prefix on a physical time slab

The frozen definition gives `L0=log(1/qbig)` and, for **every** positive integer
`j`, `L_j>=L_(j-1)+1`. Induction, rather than the five serialized examples,
therefore gives

`a_j*q = exp(L_j)*q >= exp(j)*(q/qbig)`.

The original physical chart is `tau=q*(1-eta^2)`, with `|eta|<1`, hence
`q>=tau`. The same-source localization has `tau0=qbig/32`. On the entire
physical time slab `tau/tau0 in [1/2,1]`, every point of the local-source
branch has `q/qbig>=1/64`. Exact rational arithmetic gives

`exp(5) > sum_(k=0..4) 5^k/k! = 523/8 > 64`.

Consequently every original stage correction with `j>=5` vanishes on this
slab, together with every mixed derivative. The support identity uses the
unchanged original `chi(s)=0` on `s>=1`. Its flat definition gives all-order
matching at the endpoint. In this particular witness the strict rational gap
already supplies an open zero margin. Outside the original local-source branch,
retain the prescribed smooth zero extension. Localization support lies inside
`q<=qbig/4` on that branch.

Only corrections 1,2,3,4 are **possibly** active. Their actual functions and
cutoff scales are still required. Initialization is retained, not substituted
for this prefix. The slow base has its own coefficient series and cutoff
selectors; this argument does not evaluate or remove that separate tail.

`FrozenCutoffPlanner` rechecks the frozen family and four supporting source
hashes before emitting this plan. `INPUT_PINS.json` records those sources.
For another positive rational lower bound on `tau/tau0`, the same planner
produces a finite sufficient tail index using `exp(J)>2^J`. A requested
sharper index uses finite rational Taylor lower bounds and reports unresolved
if its explicit proof budget is exhausted.
It does not claim a minimal active set or create a replacement schedule.
At the terminal lower bound zero, it rejects the finite-prefix request.

The displayed slab is a concrete planning application, not a prescribed
acceptance time or a completed numerical run. N7-06 has no fixed grid or
tolerance; no N8-04 time grid is introduced.

## 2. What remains in the chosen exact selectors

The saved norm archive with SHA256
`d98a245f1fc563ba44c48d21c59a43d6787fc3895d922472bb3f3ab6e04d9a6d`
is rechecked. It supplies same-source initialized deferred norm recipes,
including its explicit limitations. It does not numerically enclose the twenty
serialized correction-wise `S_hat` values or determine their least finite
logarithm exponents. `FROZEN_SELECTOR_PREMISES.json` lists every corresponding
source node, derivative order and frozen scale node.

The meanings of `P_hat=min{p>=0:S_hat_p<infinity}` and
`C_hat=1+ceil(S_hat_(P_hat))` are the definitions of this chosen frozen
implementation. They are not additional acceptance conditions imposed on the
paper or on N7-06/N8-05. The paper may admit other sufficient cutoff choices.
Using one would require an explicit separate construction, source rebinding
and revalidation under the unchanged original conditions. No such change is
made here, and no impossibility of other compliant routes is asserted.

A finite bound at some exponent `pbar` proves only `P_hat<=pbar`. It need not
bound the supremum at the selected smaller exponent. For example, on
`Lambda>=1`, the abstract function
`F_N(Lambda)=N*Lambda^2/(N+Lambda)` has `S_2<=1`, but its least finite exponent
is 1 and `S_1=N`. This example explains the selection issue; it is not an
actual field or norm replacement.

There are concrete conditional routes for the same selector. A global finite
bound on `S_hat_0` establishes the exact least exponent zero. For a proposed
positive `p`, finiteness at `p` and divergence at `p-1` establish minimality,
because `Lambda>=1`. After identifying `P_hat`, a certified closed enclosure
`S_hat in [s_lo,s_hi]` gives

`C_hat in [1+ceil(s_lo),1+ceil(s_hi)]`.

Exact evaluation of the supremum, or a single exact ceiling integer, is not
necessary merely to enclose the same scale. An interval straddling an integer
must retain the uncertainty. `conditional_scale_enclosure` propagates these
intervals through the **same** frozen maximum, retaining all `m=0..j` terms.
It assigns no source authority to caller-supplied intervals or exponents.

The unbounded auxiliary scale in the supremum can also be removed exactly:
differentiate `T_a` with `a` fixed, then set `s=a*q`. For each physical point
the domain becomes `q<=s<=1`; all cutoff derivatives vanish for `s>=1`.
Thus the supremum over `a>=1` is equivalent to this bounded `s` domain.
The difficult endpoint `q->0` remains. Replacing `a` by `s/q` **before**
differentiating at fixed `s` would be wrong. The new multivariate Taylor-jet
consumer implements the correct order of operations; its controls are
explicit polynomial fixtures, not actual original cutoff values.

## 3. Connection to the same whole-K energy problem

The retained exact energy operator is bound to this same family, with the
unchanged 67 potential/direct-scalar/pressure jets and 13 outer-cutoff jets.
No historical 54-check or 540-term algebra run is repeated. The new plan
removes the stage-correction tail on the stated positive slab and leaves
the unevaluated prefix and slow-base/native dependencies explicit.

For a future whole-support quadrature, put
`x=xi`, `y=upsilon`, `z=z0*zeta`, and `tau=tau0*s`.
The original `r0=1` support `K` lies inside the normalized box `[-1,1]^3`;
the exact cutoff is zero in the portion of this box outside K. Spatial
measure is `z0 dxi dupsilon dzeta`, and space-time measure is
`z0*tau0 dxi dupsilon dzeta ds`. All supplied jets must still be derivatives
in the original physical coordinates, valid on entire mapped cells.

The added `normalized_box_integral` checks an arbitrary supplied rectangular
partition for complete coverage and duplicate/missing cells, then sums exact
rational cell measures times interval density enclosures. Its output records
the supplied box and is explicitly unidentified. For the actual whole-K use,
the supplied spatial box must be the above enclosing `[-1,1]^3`; the source
provider must justify its intervals and the `z0,tau0` factors. This routine
does not produce those data or constitute an actual quadrature result.

The force-norm route retains the correct ordering: first integrate
`|f|^2` over space, multiply by `z0`, take its square root, then integrate
over normalized time and multiply by `tau0`. It is not the space-time
integral of `|f|^2`. The initial interval has exact zero energy by the
original temporal cutoff. The required independent space/time defect
decrease and all four original N8-05 doubled-axis comparisons remain open.

## Reproduction and observed scope

From the workspace root:

```bash
python work/resumed_continuation/cutoff/code/run_continuation.py
```

The new check run passes 22 checks, with exit 0. They cover the actual frozen
support application, same-source pins, conditional selector arithmetic,
fixed-scale derivative ordering, mixed chain jets, partition coverage and
the unchanged 67+13 energy requests. Fixture numbers are never claimed as
actual field values. Logs and an artifact hash manifest accompany this work.
