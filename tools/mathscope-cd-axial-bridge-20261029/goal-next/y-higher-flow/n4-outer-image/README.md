# Outer active N4 indexed charts and selected representatives

The new checks trace the source-native callers outside the 29 verified
profile-input gateways. They inspect 87 reached native call nodes.
Forty-eight rebind a tracked slow or representative coordinate. Those
cases partition exactly into

| Changed frame | Calls |
| --- | --- |
| Explicit slow representative triples | 6 |
| Fixed representative parameter substitutions | 18 |
| Radial coordinate only | 24 |

The radial-only cases preserve Z and T, so they preserve the slow inverse
and eta. Nonnegativity of physical X uses the square of the real radial
coordinate. The six triple cases are three applications of the original
representative template and three applications at the selected fixed
representative. No outer native call rebinds the band or the three mesh
labels. Candidate-row label changes are checked separately against every
stored row's actual label arguments.

The previous source row check verified Z and T scaling. The new
`bind_outer_images.py` also checks the radial map, all five guard
arguments and the frozen-label substitution in every reached indexed row.
Across nine unique field definitions there are 243 global row entries and
972 auxiliary row entries, with three distinct positive scale ratios.
Every checked row has

```text
c=Qref/Qlabel>0,
Rnext=sqrt(c)*R, Znext=c^(1/2-h)*Z, Tnext=c*T.
```

The candidate band guard gives `1/2<c*s<2`. The existing chart transport
theorem then supplies the unique candidate inverse and preserves eta.
The radial map additionally gives
`Rnext^2/(2*c*s)=R^2/(2*s)`, preserving X and the strict shell guard.
The three remaining mesh guards are exactly
`|ell_label^6*xnext-j|<3/4`. Dividing by the positive mesh scale puts the
mapped point inside the original box with center `j/ell_label^6` and
radius `3/(4*ell_label^6)`. All local ell and mesh arguments match their
stored frozen row labels.

Thus an active row supplies an actual physical point in the candidate
box. This is the nonempty-box input to the original fixed representative
construction. The original construction's active-box geometry theorem
and the source initial physical image remain premises.

`selected_representative_guards.py` checks the missing operational
precondition of that construction. On every original root path to the
selected representative inverse #4588852, all five original local support
guards dominate the inverse. The analysis clears facts across native
definition edges that rebind a slow or label coordinate. All five facts
survive across 561 source ancestors. With local guard transfer withheld,
all five are lost.

The chosen roots
`(Xrep,etarep,srep)=(#4588867,#4588872,#4588852)` have exactly the free
coordinates `ell` and the three fixed mesh labels. They depend on no
current R, Z or T coordinate. Eighteen actual native applications substitute
this exact triple. Both sets of the three actual slow arguments have the
exact forward-image shape

```text
Rrep=sqrt(2*srep*Xrep),
Zrep=srep^(1/2-h)*etarep,
Trep=srep*(1-etarep^2).
```

The checked native materializers retain their entire actual argument
tuple and wrap each row in its stored lazy guards after differentiating
the local fixed-label body. The output records byte pins of the four
original source modules used for this binding.

An exact rational control at `c=2,s=3/4,R=2` distinguishes the original
radial map from an omitted radial rescaling. The correct map preserves
`X=8/3`; leaving R unchanged produces `X=4/3`.

The result closes the finite source substitutions and active-row image
transport under the stated original image, active-box geometry and native
semantics. Formalizing the representative geometry theorem, evaluating
native limits, exchanging derivatives at endpoints, generalizing to
all recursive orders and certifying final field values remain open.
RELEASE HOLD.

[GitHub proof of radial scale invariance](https://github.com/leegahuyn/MathScopeCompute/actions/runs/44543956526)

Run with Python 3 from the workspace root. Replace REPLAY with this
directory and NEW_JSON with a new output path.

```text
python REPLAY/selected_representative_guards.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-next/y/native_reference_scopes.py NEW_JSON

python REPLAY/bind_outer_images.py work/goal-next/y-n4/reached.json work/goal-next/hosted-43055678022-N4/original-whole-k-current-pressure-graph/original-source-functions.json work/goal-next/y/native_reference_scopes.py REPLAY/../n4-residual-frame/gateway-closure.json REPLAY/representative-guards.json work/goal-next/continuation30/forced-probe/runtime/research-ide/mathscope-m3/navier NEW_JSON
```

Append `--drop-local-guards` to the first command for the control.
Include only this README, the two final Python scripts,
`representative-guards.json`, `representative-no-guards.json` and
`outer-images.json`. The initial frame census and replay duplicates
are exploratory scratch outputs.
