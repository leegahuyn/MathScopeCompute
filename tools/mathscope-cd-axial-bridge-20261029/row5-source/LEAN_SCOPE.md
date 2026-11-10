# Order-one raw source / Picard row 5 scalar certificate

`SourceRowFive.lean` proves the scalar identity checked by
`row5-source/check_source_row.py`:

`2 raw = -U_xixi - U_xi/xi + (A0*u + A1*u_eta + forcing)[5]`.

The file uses independent real values and jets. The authenticated Python
checker provides the separate correspondence to the graph's eight raw
summands and twelve row coefficients plus forcing. Lean does not load that
graph or prove its interpretation. Compilation must run on GitHub; this
directory contains no local compiler result.

The field names correspond to the checker:

| Lean field | Checker / intended value |
|---|---|
| `xi`, `eta`, `h` | `xi`, `eta`, `H` |
| `F0`, `U0`, `v0` | matched actual / Picard leading values |
| `U0X`, `U0Eta` | matched leading derivative atoms `Ux`, `Ueta` |
| `Omega` | source atom #26393 |
| `Visc` | lower viscosity atom, matched across the two projections |
| `F`, `U`, `K`, `P` | inner system components 0, 1, 2, 3 |
| `W`, `Uxx` | putative `U_xi`, `U_xixi` |
| `UEta`, `KEta`, `PEta` | putative eta derivatives |

The definitions substitute `lambda_1=2h`, `X=xi^2`,
`U_X=W/(2xi)`, `U_XX=(Uxx-W/xi)/(4xi^2)`,
`Pi_X=2F0*F-Omega/2`, `average(U)=U+K`, and the corresponding eta
derivative of that average. Source node #29440 is `v1_factor`; manuscript
`V1=X*v1_factor`. The inner coordinate identity `X=xi^2` must not be confused
with the manuscript radial coordinate `X=R^2/2`.

The three theorems prove the identity, its implication from the radial row
equation, and the converse. They require `xi != 0` and
`1-2h eta^2 != 0`. They provide no axis limit, native-domain proof, derivative
identity, Picard convergence / actual ODE proof, full moment cancellation,
cutoff jet gluing, or statement for recursive orders n>=2.

The source matrix equation must be independently established before using the
zero-residual corollary on actual profiles. No progress counter is changed.
